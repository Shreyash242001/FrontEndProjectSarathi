/* ═══════════════════════════════════════════
   Sarathi – NAI Unit API Service
   ═══════════════════════════════════════════ */

import { apiFetch } from './api';

/**
 * Fetch all NAI units from the backend.
 * @returns {Promise<{ success: boolean, data: Array, message: string }>}
 */
export async function fetchNaiUnits() {
  const res = await apiFetch('/nai-unit/getall');
  const json = await res.json();
  return json;
}
