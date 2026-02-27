import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchNaiUnits } from '../services/naiUnitApi';
import { fetchLocations } from '../services/locationApi';
import { fetchNadUnits } from '../services/nadUnitApi';
import navyEmblem from '../assets/navy-emblem.png';
import NotificationBell from './NotificationBell';
import './Dashboard.css';

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard', id: 'dashboard' },
  { icon: '👥', label: 'Personnel', id: 'personnel' },
  { icon: '🚢', label: 'Ships', id: 'ships' },
  { icon: '🔫', label: 'Armament', id: 'armament', path: '/product-tree' },
  {
    icon: '📂', label: 'Masters', id: 'masters',
    children: [
      { icon: '🏢', label: 'NAI Units', id: 'nai-units', path: '/nai-units' },
      { icon: '📍', label: 'Locations', id: 'locations', path: '/locations' },
      { icon: '🏗️', label: 'NAD Units', id: 'nad-units', path: '/nad-units' },
    ],
  },
  { icon: '📋', label: 'Reports', id: 'reports' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
];

const STATS = [
  {
    icon: '👥',
    label: 'Total Personnel',
    value: '12,847',
    change: '+2.4%',
    positive: true,
    color: '#3d6db5',
  },
  {
    icon: '🏗️',
    label: 'NAD Units',
    value: null,
    change: 'Live',
    positive: true,
    color: '#27ae60',
    clickable: true,
    path: '/nad-units',
  },
  {
    icon: '🏢',
    label: 'NAI Units',
    value: null,
    change: 'Live',
    positive: true,
    color: '#c9a84c',
    clickable: true,
    path: '/nai-units',
  },
  {
    icon: '📍',
    label: 'Locations',
    value: null,
    change: 'Live',
    positive: true,
    color: '#3d6db5',
    clickable: true,
    path: '/locations',
  },
];

const ACTIVITIES = [
  { time: '2 min ago', text: 'INS Vikrant status report submitted', type: 'report' },
  { time: '15 min ago', text: 'New personnel onboarded — Western Naval Command', type: 'personnel' },
  { time: '1 hr ago', text: 'Armament inventory audit completed — Unit 7', type: 'armament' },
  { time: '2 hrs ago', text: 'Ship maintenance schedule updated — INS Chennai', type: 'ship' },
  { time: '3 hrs ago', text: 'Quarterly indigenisation report approved', type: 'report' },
  { time: '5 hrs ago', text: 'Security drill assessment — Eastern Naval Command', type: 'personnel' },
];

const QUICK_ACTIONS = [
  { icon: '📝', label: 'New Report', desc: 'Create assessment' },
  { icon: '👤', label: 'Add Personnel', desc: 'Register member' },
  { icon: '🔍', label: 'Track Armament', desc: 'Search inventory' },
  { icon: '📊', label: 'Analytics', desc: 'View statistics' },
  { icon: '🚢', label: 'Fleet Status', desc: 'Ship overview' },
  { icon: '📢', label: 'Notifications', desc: 'Send alerts' },
];

export default function Dashboard() {
  const { user, logout, switchRole, switchSection } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [mastersOpen, setMastersOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [naiUnitCount, setNaiUnitCount] = useState(null);
  const [locationCount, setLocationCount] = useState(null);
  const [nadUnitCount, setNadUnitCount] = useState(null);

  const hasMultipleSections = (user?.sections?.length || 0) > 1;
  const activeSection = user?.sections?.find((s) => s.sectionId === user.activeSectionId) || user?.sections?.[0] || null;
  const activeRoles = activeSection?.roles || [];
  const hasMultipleRoles = activeRoles.length > 1;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live NAI Unit count
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchNaiUnits();
        if (res.success || res.statusCode === 200) {
          setNaiUnitCount((res.data || []).length);
        }
      } catch { /* silent */ }
    })();
  }, []);

  // Fetch live Location count
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchLocations();
        if (res.success || res.statusCode === 200) {
          setLocationCount((res.data || []).length);
        }
      } catch { /* silent */ }
    })();
  }, []);

  // Fetch live NAD Unit count
  useEffect(() => {
    (async () => {
      try {
        const res = await fetchNadUnits();
        if (res.success || res.statusCode === 200) {
          setNadUnitCount((res.data || []).length);
        }
      } catch { /* silent */ }
    })();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className={`dashboard ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      {/* ── Tricolor ── */}
      <div className="tricolor-bar">
        <div className="tricolor-saffron" />
        <div className="tricolor-white" />
        <div className="tricolor-green" />
      </div>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={navyEmblem} alt="Sarathi" className="sidebar-logo" />
          {sidebarOpen && (
            <div className="sidebar-brand">
              <h2>SARATHI</h2>
              <span>Indian Navy</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            if (item.children) {
              const isChildActive = item.children.some((c) => activeNav === c.id);
              return (
                <div key={item.id} className="nav-group">
                  <button
                    className={`nav-item nav-parent ${isChildActive ? 'active' : ''}`}
                    onClick={() => setMastersOpen((v) => !v)}
                    title={item.label}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {sidebarOpen && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        <span className={`nav-chevron ${mastersOpen ? 'open' : ''}`}>▸</span>
                      </>
                    )}
                  </button>
                  {mastersOpen && sidebarOpen && (
                    <div className="nav-children">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          className={`nav-item nav-child ${activeNav === child.id ? 'active' : ''}`}
                          onClick={() => {
                            setActiveNav(child.id);
                            if (child.path) navigate(child.path);
                          }}
                          title={child.label}
                        >
                          <span className="nav-icon">{child.icon}</span>
                          <span className="nav-label">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <button
                key={item.id}
                className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveNav(item.id);
                  if (item.path) navigate(item.path);
                }}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout} title="Logout">
            <span className="nav-icon">🚪</span>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="main-area">
        {/* ── Top Bar ── */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <span />
              <span />
              <span />
            </button>
            <div className="topbar-title">
              <div className="selector-area">
                {/* ── Section Selector ── */}
                <div className="section-selector">
                  <button
                    className={`selector-btn section-btn ${hasMultipleSections ? 'switchable' : ''}`}
                    onClick={() => {
                      if (hasMultipleSections) {
                        setSectionDropdownOpen((v) => !v);
                        setRoleDropdownOpen(false);
                      }
                    }}
                  >
                    <span className="selector-label">Section</span>
                    <span className="selector-value">
                      {user?.sectionName || 'N/A'}
                      {hasMultipleSections && <span className="selector-chevron">{sectionDropdownOpen ? '▲' : '▼'}</span>}
                    </span>
                  </button>

                  {sectionDropdownOpen && hasMultipleSections && (
                    <div className="selector-dropdown">
                      <div className="selector-dropdown-header">Switch Section</div>
                      {user.sections.map((s) => (
                        <button
                          key={s.sectionId}
                          className={`selector-option ${s.sectionId === user.activeSectionId ? 'active' : ''}`}
                          onClick={() => {
                            switchSection(s.sectionId);
                            setSectionDropdownOpen(false);
                            setRoleDropdownOpen(false);
                          }}
                        >
                          <span className="selector-option-name">{s.sectionName}</span>
                          <span className="selector-option-meta">{s.postName}</span>
                          {s.sectionId === user.activeSectionId && <span className="selector-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Role Selector ── */}
                <div className="role-selector">
                  <button
                    className={`selector-btn role-btn ${hasMultipleRoles ? 'switchable' : ''}`}
                    onClick={() => {
                      if (hasMultipleRoles) {
                        setRoleDropdownOpen((v) => !v);
                        setSectionDropdownOpen(false);
                      }
                    }}
                  >
                    <span className="selector-label">Role</span>
                    <span className="selector-value">
                      {user?.role || 'User'}
                      {hasMultipleRoles && <span className="selector-chevron">{roleDropdownOpen ? '▲' : '▼'}</span>}
                    </span>
                  </button>

                  {roleDropdownOpen && hasMultipleRoles && (
                    <div className="selector-dropdown">
                      <div className="selector-dropdown-header">Switch Role</div>
                      {activeRoles.map((r) => (
                        <button
                          key={r.roleId}
                          className={`selector-option ${r.roleId === user.activeRoleId ? 'active' : ''}`}
                          onClick={() => {
                            switchRole(r.roleId);
                            setRoleDropdownOpen(false);
                          }}
                        >
                          <span className="selector-option-name">{r.roleName}</span>
                          {r.roleId === user.activeRoleId && <span className="selector-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p>
                Welcome back, {user?.name || 'Admin'}
              </p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-clock">
              <span className="clock-live-dot" />
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              {' · '}
              {currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </div>

            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            <NotificationBell />

            <div className="profile-area">
              <button
                className="profile-btn"
                onClick={() => setProfileOpen((v) => !v)}
              >
                <div className="avatar">
                  {(user?.name || 'A').charAt(0).toUpperCase()}
                </div>
                {sidebarOpen && (
                  <div className="profile-info">
                    <span className="profile-name">{user?.name || 'Admin'}</span>
                    <span className="profile-role">{user?.role || 'User'}</span>
                  </div>
                )}
              </button>

              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="avatar avatar-lg">
                      {(user?.name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="dropdown-name">{user?.name || 'Admin'}</p>
                      <p className="dropdown-email">{user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <div className="dropdown-info">
                    <p><strong>Role:</strong> {user?.role || 'User'}</p>
                    {user?.sectionName && <p><strong>Section:</strong> {user.sectionName}</p>}
                    {user?.unitName && <p><strong>Unit:</strong> {user.unitName}</p>}
                    {user?.organisation && <p><strong>Organisation:</strong> {user.organisation}</p>}
                    <p><strong>Employee ID:</strong> {user?.employeeId || 'N/A'}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-logout" onClick={handleLogout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="content">
          {/* Stat Cards */}
          <section className="stats-grid">
            {STATS.map((stat, i) => {
              const displayValue = stat.label === 'NAI Units'
                ? (naiUnitCount !== null ? naiUnitCount.toLocaleString() : '…')
                : stat.label === 'Locations'
                  ? (locationCount !== null ? locationCount.toLocaleString() : '…')
                  : stat.label === 'NAD Units'
                    ? (nadUnitCount !== null ? nadUnitCount.toLocaleString() : '…')
                    : stat.value;
              return (
                <div
                  key={i}
                  className={`stat-card ${stat.clickable ? 'stat-clickable' : ''}`}
                  style={{ '--accent': stat.color, animationDelay: `${i * 0.1}s` }}
                  onClick={() => stat.path && navigate(stat.path)}
                  role={stat.clickable ? 'link' : undefined}
                >
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-body">
                    <p className="stat-label">{stat.label}</p>
                    <h3 className="stat-value">{displayValue}</h3>
                    <span className={`stat-change ${stat.positive ? 'up' : 'down'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="stat-glow" />
                </div>
              );
            })}
          </section>

          {/* Two-column layout */}
          <div className="content-grid">
            {/* Quick Actions */}
            <section className="panel quick-actions-panel">
              <h2 className="panel-title">
                <span className="panel-icon">⚡</span>
                Quick Actions
              </h2>
              <div className="actions-grid">
                {QUICK_ACTIONS.map((action, i) => (
                  <button key={i} className="action-card">
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                    <span className="action-desc">{action.desc}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="panel activity-panel">
              <h2 className="panel-title">
                <span className="panel-icon">🕐</span>
                Recent Activity
              </h2>
              <div className="activity-list">
                {ACTIVITIES.map((act, i) => (
                  <div key={i} className="activity-item" style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className={`activity-dot ${act.type}`} />
                    <div className="activity-content">
                      <p className="activity-text">{act.text}</p>
                      <span className="activity-time">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="dashboard-footer">
            <div className="footer-tricolor-line" />
            <p>
              Government of India — Ministry of Defence · SARATHI v1.0 · © 2026 Indian Navy
            </p>
          </footer>
        </main>
      </div>

      {/* mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
