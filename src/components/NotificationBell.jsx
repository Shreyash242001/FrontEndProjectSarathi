import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUnreadNotifications,
  getAllNotifications,
  markAsRead,
} from '../services/notificationService';
import './NotificationBell.css';

const POLL_INTERVAL = 30_000; // 30 seconds

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('unread');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const email = user?.email || '';

  // ── Fetch unread ──
  const fetchUnread = useCallback(async () => {
    if (!email) return;
    try {
      const data = await getUnreadNotifications(email);
      setNotifications(data);
    } catch {
      // fail silently — API might not be running
    }
  }, [email]);

  // ── Fetch all ──
  const fetchAll = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      const data = await getAllNotifications(0, email);
      setAllNotifications(data);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [email]);

  // ── Initial load + polling ──
  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // ── When "All" tab is selected ──
  useEffect(() => {
    if (activeTab === 'all' && isOpen) fetchAll();
  }, [activeTab, isOpen, fetchAll]);

  // ── Click outside to close ──
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // ── Mark single notification read ──
  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setAllNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, viewed: true } : n))
      );
    } catch {
      // fail silently
    }
  };

  // ── Mark all read ──
  const handleMarkAllRead = async () => {
    const unreadIds = notifications.map((n) => n.id);
    await Promise.allSettled(unreadIds.map((id) => markAsRead(id)));
    setNotifications([]);
    setAllNotifications((prev) =>
      prev.map((n) => (unreadIds.includes(n.id) ? { ...n, viewed: true } : n))
    );
  };

  const unreadCount = notifications.length;
  const displayList = activeTab === 'unread' ? notifications : allNotifications;

  // ── Type → color mapping ──
  const typeColor = (type) => {
    if (!type) return '#c9a84c';
    const t = type.toLowerCase();
    if (t.includes('inspection')) return '#3d6db5';
    if (t.includes('report'))     return '#27ae60';
    if (t.includes('armament'))   return '#e67e22';
    if (t.includes('personnel'))  return '#8e44ad';
    if (t.includes('ship'))       return '#2980b9';
    return '#c9a84c';
  };

  // ── Format date ──
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.split('/').reverse().join('-'));
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        className="notification-bell"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifications"
        title="Notifications"
      >
        <svg
          className="bell-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Pulse ring for unread */}
        {unreadCount > 0 && <span className="bell-pulse" />}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notif-header">
            <h3 className="notif-title">
              🔔 Notifications
              {unreadCount > 0 && (
                <span className="notif-count">{unreadCount}</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="notif-tabs">
            <button
              className={`notif-tab ${activeTab === 'unread' ? 'active' : ''}`}
              onClick={() => setActiveTab('unread')}
            >
              Unread
              {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
            </button>
            <button
              className={`notif-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
          </div>

          {/* List */}
          <div className="notif-list">
            {loading && (
              <div className="notif-empty">
                <div className="notif-spinner" />
                Loading…
              </div>
            )}

            {!loading && displayList.length === 0 && (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔕</span>
                <p>No {activeTab === 'unread' ? 'unread ' : ''}notifications</p>
              </div>
            )}

            {!loading &&
              displayList.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.viewed ? 'unread' : ''}`}
                >
                  <div
                    className="notif-type-dot"
                    style={{ background: typeColor(n.assignmentType) }}
                    title={n.assignmentType || 'General'}
                  />

                  <div className="notif-body">
                    <p className="notif-message">{n.message || 'New notification'}</p>
                    <div className="notif-meta">
                      {n.assignmentType && (
                        <span
                          className="notif-tag"
                          style={{
                            color: typeColor(n.assignmentType),
                            borderColor: typeColor(n.assignmentType) + '30',
                            background: typeColor(n.assignmentType) + '10',
                          }}
                        >
                          {n.assignmentType}
                        </span>
                      )}
                      {n.storeName && n.storeName !== 'Not Relevant' && (
                        <span className="notif-store">📍 {n.storeName}</span>
                      )}
                      {n.refNo && (
                        <span className="notif-ref">Ref: {n.refNo}</span>
                      )}
                      {n.assignedDate && (
                        <span className="notif-date">{formatDate(n.assignedDate)}</span>
                      )}
                    </div>
                  </div>

                  {!n.viewed && (
                    <button
                      className="notif-read-btn"
                      onClick={() => handleMarkRead(n.id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
