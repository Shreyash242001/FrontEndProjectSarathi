/* ═══════════════════════════════════════════
   Sarathi – Notification Service
   Wraps backend /api/v1/notifications endpoints
   ═══════════════════════════════════════════ */

import { apiFetch } from './api';

/**
 * Fetch all unread notifications for a user.
 * GET /api/v1/notifications/get/{email}
 */
export async function getUnreadNotifications(email) {
  const res = await apiFetch(`/api/v1/notifications/get/${encodeURIComponent(email)}`);
  const data = await res.json();
  return data.data || [];
}

/**
 * Fetch all notifications (key = pagination / filter key).
 * GET /api/v1/notifications/get/{key}/{email}
 */
export async function getAllNotifications(key, email) {
  const res = await apiFetch(`/api/v1/notifications/get/${key}/${encodeURIComponent(email)}`);
  const data = await res.json();
  return data.data || [];
}

/**
 * Mark a single notification as read.
 * PUT /api/v1/notifications/marked/{notificationId}
 */
export async function markAsRead(notificationId) {
  const res = await apiFetch(`/api/v1/notifications/marked/${notificationId}`, {
    method: 'PUT',
  });
  const text = await res.text();
  return text.includes('successfully');
}

/**
 * Fetch regular notifications by role.
 * GET /api/v1/notifications/regular/notifications/{roleId}
 */
export async function getRegularNotifications(roleId) {
  const res = await apiFetch(`/api/v1/notifications/regular/notifications/${encodeURIComponent(roleId)}`);
  const data = await res.json();
  return data.data || [];
}

/**
 * Create / send a regular notification.
 * POST /api/v1/notifications/get/regular
 */
export async function sendRegularNotification({ fromRole, roles, subject, massage }) {
  const res = await apiFetch('/api/v1/notifications/get/regular', {
    method: 'POST',
    body: JSON.stringify({ fromRole, roles, subject, massage }),
  });
  const data = await res.json();
  return data;
}
