/* ═══════════════════════════════════════════
   Sarathi – Product Tree API Service
   Endpoints for neutral-parameter product trees
   ═══════════════════════════════════════════ */

import { BASE_URL } from '../config';
import { getToken } from './authService';

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Fetch every neutral parameter (torpedoes, missiles, ammunition, etc.)
 * GET /neutral-parameters/getv
 */
export async function fetchNeutralParameters() {
  const res = await fetch(`${BASE_URL}/neutral-parameters/getv`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load neutral parameters');
  return res.json();
}

/**
 * Fetch the product tree for a given neutral-parameter id.
 * GET /neutral-parameters/{id}/productree
 */
export async function fetchProductTree(id) {
  const res = await fetch(
    `${BASE_URL}/neutral-parameters/${id}/productree`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error('Failed to load product tree');
  return res.json();
}

/**
 * Fetch store-level details for a single tree node.
 * GET /neutral-parameters/ProductreeStoreData/{id}
 */
export async function fetchNodeDetails(id) {
  const res = await fetch(
    `${BASE_URL}/neutral-parameters/ProductreeStoreData/${id}`,
    { headers: authHeaders() },
  );
  if (!res.ok) throw new Error('Failed to load node details');
  return res.json();
}
