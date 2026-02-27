/* ═══════════════════════════════════════════
   Sarathi – NAD Unit API Service
   ═══════════════════════════════════════════ */

import { apiFetch } from './api';

/**
 * Fetch all NAD units from the backend.
 * @returns {Promise<{ success: boolean, data: Array, message: string }>}
 */
export async function fetchNadUnits() {
  const res = await apiFetch('/nadunit/getall');
  const json = await res.json();
  return json;
}
