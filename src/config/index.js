/* ═══════════════════════════════════════════
   Sarathi – App Configuration
   ═══════════════════════════════════════════
   Central place for environment / app settings.
   Any developer working on this project can
   update values here without hunting through
   multiple files.
   ═══════════════════════════════════════════ */

/** Backend API base URL (no trailing slash). */
export const BASE_URL = 'http://localhost:8888';



/** App metadata */
export const APP_NAME = 'SARATHI';
export const APP_FULL_NAME =
  'System for Armament Review, Analysis, Tracking & Handling, Indigenisation';
export const APP_VERSION = '1.0.0';

/** Session / auth keys */
export const SESSION_STORAGE_KEY = '__s_session'; // legacy (will be removed after migration)
export const THEME_STORAGE_KEY = 'sarathi_theme';

/** Hardened vault storage keys */
export const VAULT_KEY_FRAG1 = '__s_kf1';       // sessionStorage — key fragment 1
export const VAULT_KEY_FRAG2 = '__s_kf2';       // cookie — key fragment 2
export const VAULT_DATA_CHUNK1 = '__s_d1';      // sessionStorage — encrypted data chunk 1
export const VAULT_HMAC = '__s_hmac';           // sessionStorage — integrity hash
export const VAULT_DB_NAME = 'sarathi_vault';   // IndexedDB — encrypted data chunk 2
export const VAULT_DB_STORE = 'session';        // IndexedDB object store name
