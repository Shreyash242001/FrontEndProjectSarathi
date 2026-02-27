/* ═══════════════════════════════════════════
   Sarathi – NAD Units List Page
   ═══════════════════════════════════════════ */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchNadUnits } from '../services/nadUnitApi';
import navyEmblem from '../assets/navy-emblem.png';
import NotificationBell from './NotificationBell';
import './NadUnitList.css';

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

export default function NadUnitList() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mastersOpen, setMastersOpen] = useState(true); // Default open since we are in a child route
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
        const res = await fetchNadUnits();
        if (res.success || res.statusCode === 200) {
          setUnits(res.data || []);
        } else {
          setError(res.message || 'Failed to load NAD units');
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
          u.controllerateName?.toLowerCase().includes(q)
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
  const techUnits = units.filter(u => u.technical).length;
  const nonTechUnits = totalUnits - techUnits;
  const totalLocations = new Set(units.map((u) => u.locationName).filter(Boolean)).size;

  const activeNav = 'nad-units';

  return (
    <div className={`dashboard nad-page ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <div className="tricolor-bar">
        <div className="tricolor-saffron" />
        <div className="tricolor-white" />
        <div className="tricolor-green" />
      </div>

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

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen((v) => !v)}>
              <span /><span /><span />
            </button>
            <div className="topbar-title">
              <h1>NAD Units</h1>
              <p>Naval Armament Depot Unit Registry</p>
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
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <NotificationBell />
            <div className="profile-area">
              <button className="profile-btn">
                <div className="avatar">{(user?.name || 'A').charAt(0).toUpperCase()}</div>
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

        <main className="content nad-content">
          <section className="nad-summary-strip">
            <div className="nad-mini-card">
              <span className="nad-mini-icon">🏗️</span>
              <div>
                <p className="nad-mini-value">{totalUnits}</p>
                <p className="nad-mini-label">Total NAD Units</p>
              </div>
            </div>
            <div className="nad-mini-card">
              <span className="nad-mini-icon">⚙️</span>
              <div>
                <p className="nad-mini-value">{techUnits}</p>
                <p className="nad-mini-label">Technical Units</p>
              </div>
            </div>
            <div className="nad-mini-card">
              <span className="nad-mini-icon">🏢</span>
              <div>
                <p className="nad-mini-value">{nonTechUnits}</p>
                <p className="nad-mini-label">Non-Tech Units</p>
              </div>
            </div>
            <div className="nad-mini-card">
              <span className="nad-mini-icon">📍</span>
              <div>
                <p className="nad-mini-value">{totalLocations}</p>
                <p className="nad-mini-label">Locations</p>
              </div>
            </div>
          </section>

          <section className="nad-toolbar">
            <div className="nad-search-wrap">
              <span className="nad-search-icon">🔍</span>
              <input
                type="text"
                className="nad-search"
                placeholder="Search units, locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="nad-search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
            <select
              className="nad-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {unitTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <span className="nad-result-count">
              {filteredUnits.length} units found
            </span>
          </section>

          {loading ? (
            <div className="nad-loader">
              <div className="nad-spinner" />
              <p>Retrieving Depot records…</p>
            </div>
          ) : error ? (
            <div className="nad-error">
              <span className="nad-error-icon">⚠️</span>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <div className="nad-table-wrap">
              <table className="nad-table">
                <thead>
                  <tr>
                    <th className="nad-th-number">#</th>
                    <th onClick={() => handleSort('unitName')} className="sortable">
                      Unit Name {sortIcon('unitName')}
                    </th>
                    <th onClick={() => handleSort('unitType')} className="sortable">
                      Type {sortIcon('unitType')}
                    </th>
                    <th onClick={() => handleSort('locationName')} className="sortable">
                      Location {sortIcon('locationName')}
                    </th>
                    <th>Technical</th>
                    <th>Controllerate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUnits.length === 0 ? (
                    <tr><td colSpan="6" className="nad-empty">No NAD units found.</td></tr>
                  ) : (
                    filteredUnits.map((unit, idx) => (
                      <tr key={unit.id} className="nad-row">
                        <td className="nad-td-number">{idx + 1}</td>
                        <td className="nad-td-name">{unit.unitName || '—'}</td>
                        <td>{unit.unitType || '—'}</td>
                        <td>{unit.locationName || '—'}</td>
                        <td>
                          <span className={`nad-tech-badge ${unit.technical ? 'tech-yes' : 'tech-no'}`}>
                            {unit.technical ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td>{unit.controllerateName || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

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
