/* ═══════════════════════════════════════════
   Sarathi – Location API Service
   ═══════════════════════════════════════════ */

import { apiFetch } from './api';

/**
 * Fetch all locations from the backend.
 * @returns {Promise<{ success: boolean, data: Array, message: string }>}
 */
export async function fetchLocations() {
  const res = await apiFetch('/location/getall');
  const json = await res.json();
  return json;
}
