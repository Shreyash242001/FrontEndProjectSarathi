/* ═══════════════════════════════════════════
   Sarathi – Hardened Auth Service
   ─────────────────────────────────────────
   Security layers:
     1. AES-256-GCM encryption  (Web Crypto API)
     2. Key splitting           (3 fragments across 3 locations)
     3. Data fragmentation      (encrypted data split across 2 stores)
     4. HMAC integrity          (tamper detection → auto-wipe)
     5. Anti-extraction         (data unreadable from any single store)

   Refresh-safe: all fragments are in persistent storage.
   Key Fragment 3 is in IndexedDB (separate from data chunk).
   ═══════════════════════════════════════════ */

import {
  SESSION_STORAGE_KEY,
  VAULT_KEY_FRAG1,
  VAULT_KEY_FRAG2,
  VAULT_DATA_CHUNK1,
  VAULT_HMAC,
  VAULT_DB_NAME,
  VAULT_DB_STORE,
} from '../config';

// ─────────────────────────────────────────
// In-memory cache  (fast synchronous access)
// ─────────────────────────────────────────
let _cachedToken = null;
let _cachedRefreshToken = null;
let _cachedUser = null;
let _vaultReady = false;        // true once init() has completed

// ═══════════════════════════════════════════
//  Crypto primitives  (Web Crypto API)
// ═══════════════════════════════════════════

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  return bytes.buffer;
}

function randomHex(byteLen) {
  return bufToHex(crypto.getRandomValues(new Uint8Array(byteLen)));
}

function xorHex(a, b) {
  const result = [];
  for (let i = 0; i < a.length; i += 2) {
    result.push((parseInt(a.substr(i, 2), 16) ^ parseInt(b.substr(i, 2), 16)).toString(16).padStart(2, '0'));
  }
  return result.join('');
}

// ─── AES-256-GCM ───

async function generateAesKey() {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const raw = await crypto.subtle.exportKey('raw', key);
  return bufToHex(raw);
}

async function importAesKey(hexKey) {
  return crypto.subtle.importKey('raw', hexToBuf(hexKey), 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function aesEncrypt(plaintext, hexKey) {
  const key = await importAesKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return { iv: bufToHex(iv), ciphertext: bufToHex(cipherBuf) };
}

async function aesDecrypt(ciphertextHex, ivHex, hexKey) {
  const key = await importAesKey(hexKey);
  const iv = new Uint8Array(hexToBuf(ivHex));
  const cipherBuf = hexToBuf(ciphertextHex);
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf);
  return new TextDecoder().decode(plainBuf);
}

// ─── HMAC-SHA256 ───

async function computeHMAC(data, hexKey) {
  const key = await crypto.subtle.importKey(
    'raw', hexToBuf(hexKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bufToHex(sig);
}

async function verifyHMAC(data, hexKey, expectedHex) {
  const actual = await computeHMAC(data, hexKey);
  if (actual.length !== expectedHex.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expectedHex.charCodeAt(i);
  return diff === 0;
}

// ═══════════════════════════════════════════
//  Key splitting  (3-way XOR)
// ═══════════════════════════════════════════

function splitKey(hexKey) {
  const frag1 = randomHex(32);
  const frag2 = randomHex(32);
  const frag3 = xorHex(xorHex(hexKey, frag1), frag2);
  return { frag1, frag2, frag3 };
}

function reconstructKey(frag1, frag2, frag3) {
  return xorHex(xorHex(frag1, frag2), frag3);
}

// ═══════════════════════════════════════════
//  Data fragmentation
// ═══════════════════════════════════════════

function splitData(hexStr) {
  const mid = Math.ceil(hexStr.length / 2);
  return { chunk1: hexStr.slice(0, mid), chunk2: hexStr.slice(mid) };
}

function joinData(chunk1, chunk2) {
  return chunk1 + chunk2;
}

// ═══════════════════════════════════════════
//  IndexedDB helpers
// ═══════════════════════════════════════════

function openVaultDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(VAULT_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VAULT_DB_STORE)) {
        db.createObjectStore(VAULT_DB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbPut(key, value) {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VAULT_DB_STORE, 'readwrite');
    tx.objectStore(VAULT_DB_STORE).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function idbGet(key) {
  const db = await openVaultDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VAULT_DB_STORE, 'readonly');
    const req = tx.objectStore(VAULT_DB_STORE).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function idbClear() {
  try {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VAULT_DB_STORE, 'readwrite');
      tx.objectStore(VAULT_DB_STORE).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  } catch { /* ignore */ }
}

// ═══════════════════════════════════════════
//  Cookie helpers  (SameSite=Strict)
// ═══════════════════════════════════════════

function setCookie(name, value, maxAgeSec = 86400) {
  document.cookie = `${name}=${value}; path=/; SameSite=Strict; max-age=${maxAgeSec}`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; path=/; SameSite=Strict; max-age=0`;
}

// ═══════════════════════════════════════════
//  User extraction  (from login API response)
// ═══════════════════════════════════════════

function extractUser(res) {
  const sections = [];
  if (res.sectionPostResponse?.length) {
    res.sectionPostResponse.forEach((section) => {
      sections.push({
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        postId: section.postId,
        postName: section.postName,
        sectionTypeCode: section.sectionTypeCode,
        sectionTypeName: section.sectionTypeName,
        sectionTypeId: section.sectionTypeId,
        roles: (section.postRoleResponse || []).map((r) => ({
          roleId: r.roleId,
          roleName: r.roleName,
        })),
      });
    });
  }

  const firstSection = sections[0] || null;
  const firstRole = firstSection?.roles?.[0] || null;

  return {
    name: res.name || '',
    email: res.email || '',
    role: firstRole?.roleName || 'User',
    activeRoleId: firstRole?.roleId ?? null,
    activeSectionId: firstSection?.sectionId ?? null,
    sectionName: firstSection?.sectionName || '',
    sections,
    unitName: res.unitName || '',
    organisation: res.employeeFrom || '',
    unitId: res.unitId ?? 0,
    shipId: res.shipId ?? 0,
    employeeId: res.employeeId ?? 0,
    commandId: res.commandId ?? 0,
    fleetId: res.fleetId ?? 0,
    unitStationId: res.unitStationId ?? 0,
    controllerateId: res.controllerateId ?? 0,
    controllerateName: res.controllerateName || '',
  };
}

// ═══════════════════════════════════════════
//  Vault write  (shared by saveSession + updateUser)
// ═══════════════════════════════════════════

/**
 * Encrypt and distribute a payload across the vault.
 * @param {object} payload – { user, token, refreshToken }
 */
async function writeVault(payload) {
  const plaintext = JSON.stringify(payload);

  // 1. Generate AES-256 key
  const aesKey = await generateAesKey();

  // 2. Encrypt
  const { iv, ciphertext } = await aesEncrypt(plaintext, aesKey);
  const encryptedPayload = iv + ':' + ciphertext;

  // 3. Split key into 3 fragments
  const { frag1, frag2, frag3 } = splitKey(aesKey);

  // 4. Split encrypted data into 2 chunks
  const { chunk1, chunk2 } = splitData(encryptedPayload);

  // 5. Compute HMAC (tamper detection)
  const hmacInput = frag1 + chunk1 + frag2;
  const hmacHash = await computeHMAC(hmacInput, frag3);

  // 6. Distribute across storage locations:
  //    Fragment 1  → sessionStorage
  sessionStorage.setItem(VAULT_KEY_FRAG1, frag1);
  //    Fragment 2  → Cookie (SameSite=Strict)
  setCookie(VAULT_KEY_FRAG2, frag2);
  //    Fragment 3  → IndexedDB (separate key from data)
  await idbPut('kf3', frag3);
  //    Data Chunk 1 → sessionStorage
  sessionStorage.setItem(VAULT_DATA_CHUNK1, chunk1);
  //    Data Chunk 2 → IndexedDB
  await idbPut('data', chunk2);
  //    HMAC        → sessionStorage
  sessionStorage.setItem(VAULT_HMAC, hmacHash);

  // 7. Remove legacy key
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Read and decrypt the vault, verifying integrity.
 * Returns the full payload { user, token, refreshToken } or null.
 */
async function readVault() {
  try {
    // Gather all fragments
    const frag1 = sessionStorage.getItem(VAULT_KEY_FRAG1);
    const frag2 = getCookie(VAULT_KEY_FRAG2);
    const frag3 = await idbGet('kf3');
    const chunk1 = sessionStorage.getItem(VAULT_DATA_CHUNK1);
    const storedHmac = sessionStorage.getItem(VAULT_HMAC);

    // All 5 pieces are required
    if (!frag1 || !frag2 || !frag3 || !chunk1 || !storedHmac) {
      return null;
    }

    // Verify HMAC integrity
    const hmacInput = frag1 + chunk1 + frag2;
    const valid = await verifyHMAC(hmacInput, frag3, storedHmac);
    if (!valid) {
      console.error('[SARATHI] HMAC integrity check failed — possible tampering');
      await _emergencyWipe();
      return null;
    }

    // Retrieve chunk 2 from IndexedDB
    const chunk2 = await idbGet('data');
    if (!chunk2) {
      console.error('[SARATHI] Data chunk 2 missing from IndexedDB');
      await _emergencyWipe();
      return null;
    }

    // Reconstruct key
    const aesKey = reconstructKey(frag1, frag2, frag3);

    // Join data chunks
    const encryptedPayload = joinData(chunk1, chunk2);
    const [ivHex, ciphertextHex] = encryptedPayload.split(':');
    if (!ivHex || !ciphertextHex) {
      await _emergencyWipe();
      return null;
    }

    // Decrypt
    const plaintext = await aesDecrypt(ciphertextHex, ivHex, aesKey);
    return JSON.parse(plaintext);
  } catch (err) {
    console.error('[SARATHI] Vault decryption failed:', err.message);
    await _emergencyWipe();
    return null;
  }
}

// ═══════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════

/**
 * Initialise the vault from persistent storage (called on page load).
 * Restores tokens + user into memory cache so getToken()/getUser() work.
 * Returns the user object or null.
 */
export async function initVault() {
  if (_vaultReady && _cachedUser) return _cachedUser;

  const payload = await readVault();
  if (payload) {
    _cachedToken = payload.token || null;
    _cachedRefreshToken = payload.refreshToken || null;
    _cachedUser = payload.user || null;
    _vaultReady = true;
    return _cachedUser;
  }

  _vaultReady = true;
  return null;
}

/**
 * Save session after login.
 * Encrypts user + tokens and distributes across the vault.
 */
export async function saveSession(res) {
  const user = extractUser(res);

  const payload = {
    user,
    token: res.token,
    refreshToken: res.refreshToken,
  };

  await writeVault(payload);

  // Update memory cache
  _cachedToken = res.token;
  _cachedRefreshToken = res.refreshToken;
  _cachedUser = user;
  _vaultReady = true;
}

/**
 * Update user profile (e.g. role/section switch).
 * Re-encrypts everything with a fresh key + fresh fragments.
 */
export async function updateUser(updates) {
  const current = await getUser();
  if (!current) return null;
  const updatedUser = { ...current, ...updates };

  const payload = {
    user: updatedUser,
    token: _cachedToken,
    refreshToken: _cachedRefreshToken,
  };

  await writeVault(payload);

  _cachedUser = updatedUser;
  return updatedUser;
}

/** Get the bearer token (from memory cache — synchronous). */
export function getToken() {
  return _cachedToken;
}

/** Get the refresh token (from memory cache — synchronous). */
export function getRefreshToken() {
  return _cachedRefreshToken;
}

/**
 * Get the user profile.
 * Returns from memory cache if available, otherwise decrypts from vault.
 */
export async function getUser() {
  if (_cachedUser) return _cachedUser;
  return initVault();
}

/**
 * Check if a session exists (synchronous — uses cache).
 * Call initVault() first on page load to populate the cache.
 */
export function isAuthenticated() {
  return !!_cachedToken && !!_cachedUser;
}

/** Clear all session data across every storage location. */
export async function logout() {
  _cachedToken = null;
  _cachedRefreshToken = null;
  _cachedUser = null;
  _vaultReady = false;

  sessionStorage.removeItem(VAULT_KEY_FRAG1);
  sessionStorage.removeItem(VAULT_DATA_CHUNK1);
  sessionStorage.removeItem(VAULT_HMAC);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);

  deleteCookie(VAULT_KEY_FRAG2);

  await idbClear();
}

/** Emergency wipe – called when tampering is detected. */
async function _emergencyWipe() {
  console.warn('[SARATHI] ⚠️ Emergency wipe — all session data destroyed');
  await logout();
}
