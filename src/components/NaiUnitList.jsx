/* ═══════════════════════════════════════════
   Sarathi – NAI Units List Page
   ═══════════════════════════════════════════ */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchNaiUnits } from '../services/naiUnitApi';
import navyEmblem from '../assets/navy-emblem.png';
import NotificationBell from './NotificationBell';
import './NaiUnitList.css';

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
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

export default function NaiUnitList() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mastersOpen, setMastersOpen] = useState(true);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('unitName');
  const [sortDir, setSortDir] = useState('asc');
  const [filterType, setFilterType] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchNaiUnits();
        if (res.success || res.statusCode === 200) {
          setUnits(res.data || []);
        } else {
          setError(res.message || 'Failed to load NAI units');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derive unique unit types for the filter dropdown
  const unitTypes = useMemo(() => {
    const types = [...new Set(units.map((u) => u.unitType).filter(Boolean))];
    return types.sort();
  }, [units]);

  // Filter + sort
  const filteredUnits = useMemo(() => {
    let result = units;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.unitName?.toLowerCase().includes(q) ||
          u.unitType?.toLowerCase().includes(q) ||
          u.locationName?.toLowerCase().includes(q) ||
          u.controllerateName?.toLowerCase().includes(q) ||
          u.stationName?.toLowerCase().includes(q),
      );
    }

    if (filterType) {
      result = result.filter((u) => u.unitType === filterType);
    }

    result = [...result].sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase();
      const bv = (b[sortField] ?? '').toString().toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [units, search, filterType, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field) => {
    if (sortField !== field) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Summary stats
  const totalUnits = units.length;
  const totalControllerates = new Set(units.map((u) => u.controllerateName).filter(Boolean)).size;
  const totalLocations = new Set(units.map((u) => u.locationName).filter(Boolean)).size;
  const totalStations = new Set(units.map((u) => u.stationName).filter(Boolean)).size;

  return (
    <div className={`dashboard nai-page ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
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
            const activeNav = 'nai-units';
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
              <span /><span /><span />
            </button>
            <div className="topbar-title">
              <h1>NAI Units</h1>
              <p>Naval Armament Inspection Unit Registry</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-clock">
              <span className="clock-live-dot" />
              {currentTime.toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
              })}
              {' · '}
              {currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', hour12: true,
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
              <button className="profile-btn">
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
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="content nai-content">
          {/* Summary Mini Cards */}
          <section className="nai-summary-strip">
            <div className="nai-mini-card">
              <span className="nai-mini-icon">🏢</span>
              <div>
                <p className="nai-mini-value">{totalUnits}</p>
                <p className="nai-mini-label">Total Units</p>
              </div>
            </div>
            <div className="nai-mini-card">
              <span className="nai-mini-icon">🗂️</span>
              <div>
                <p className="nai-mini-value">{totalControllerates}</p>
                <p className="nai-mini-label">Controllerates</p>
              </div>
            </div>
            <div className="nai-mini-card">
              <span className="nai-mini-icon">📍</span>
              <div>
                <p className="nai-mini-value">{totalLocations}</p>
                <p className="nai-mini-label">Locations</p>
              </div>
            </div>
            <div className="nai-mini-card">
              <span className="nai-mini-icon">⚓</span>
              <div>
                <p className="nai-mini-value">{totalStations}</p>
                <p className="nai-mini-label">Stations</p>
              </div>
            </div>
          </section>

          {/* Toolbar */}
          <section className="nai-toolbar">
            <div className="nai-search-wrap">
              <span className="nai-search-icon">🔍</span>
              <input
                type="text"
                className="nai-search"
                placeholder="Search units, locations, controllerates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="nai-search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
            <select
              className="nai-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {unitTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="nai-result-count">
              {filteredUnits.length} of {totalUnits} units
            </span>
          </section>

          {/* Table */}
          {loading ? (
            <div className="nai-loader">
              <div className="nai-spinner" />
              <p>Decrypting unit registry…</p>
            </div>
          ) : error ? (
            <div className="nai-error">
              <span className="nai-error-icon">⚠️</span>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <div className="nai-table-wrap">
              <table className="nai-table">
                <thead>
                  <tr>
                    <th className="nai-th-number">#</th>
                    <th onClick={() => handleSort('unitName')} className="sortable">
                      Unit Name <span className="sort-arrow">{sortIcon('unitName')}</span>
                    </th>
                    <th onClick={() => handleSort('unitType')} className="sortable">
                      Type <span className="sort-arrow">{sortIcon('unitType')}</span>
                    </th>
                    <th onClick={() => handleSort('locationName')} className="sortable">
                      Location <span className="sort-arrow">{sortIcon('locationName')}</span>
                    </th>
                    <th onClick={() => handleSort('stationName')} className="sortable">
                      Station <span className="sort-arrow">{sortIcon('stationName')}</span>
                    </th>
                    <th onClick={() => handleSort('controllerateName')} className="sortable">
                      Controllerate <span className="sort-arrow">{sortIcon('controllerateName')}</span>
                    </th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="nai-empty">
                        No units match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((unit, idx) => (
                      <tr key={unit.id} className="nai-row" style={{ animationDelay: `${Math.min(idx, 15) * 0.03}s` }}>
                        <td className="nai-td-number">{idx + 1}</td>
                        <td className="nai-td-name">
                          <span className="unit-name-text">{unit.unitName || '—'}</span>
                        </td>
                        <td>
                          <span className="nai-type-badge">{unit.unitType || '—'}</span>
                        </td>
                        <td>{unit.locationName || '—'}</td>
                        <td>{unit.stationName || '—'}</td>
                        <td>{unit.controllerateName || '—'}</td>
                        <td>
                          <span className={`nai-status-dot ${unit.contralleratePresent ? 'active' : 'inactive'}`} />
                          {unit.contralleratePresent ? 'Active' : 'Pending'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <footer className="dashboard-footer">
            <div className="footer-tricolor-line" />
            <p>Government of India — Ministry of Defence · SARATHI v1.0 · © 2026 Indian Navy</p>
          </footer>
        </main>
      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
