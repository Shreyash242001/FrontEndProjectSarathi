/* ═══════════════════════════════════════════
   Sarathi – Locations List Page
   ═══════════════════════════════════════════ */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchLocations } from '../services/locationApi';
import navyEmblem from '../assets/navy-emblem.png';
import NotificationBell from './NotificationBell';
import './LocationList.css';

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

export default function LocationList() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mastersOpen, setMastersOpen] = useState(true);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('locationName');
  const [sortDir, setSortDir] = useState('asc');
  const [filterStation, setFilterStation] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchLocations();
        if (res.success || res.statusCode === 200) {
          setLocations(res.data || []);
        } else {
          setError(res.message || 'Failed to load locations');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Unique station names for the filter
  const stationNames = useMemo(() => {
    const names = [...new Set(locations.map((l) => l.stationName).filter(Boolean))];
    return names.sort();
  }, [locations]);

  // Filter + sort
  const filteredLocations = useMemo(() => {
    let result = locations;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.locationName?.toLowerCase().includes(q) ||
          l.code?.toLowerCase().includes(q) ||
          l.stationName?.toLowerCase().includes(q) ||
          l.stationTypeName?.toLowerCase().includes(q) ||
          String(l.id).includes(q),
      );
    }

    if (filterStation) {
      result = result.filter((l) => l.stationName === filterStation);
    }

    result = [...result].sort((a, b) => {
      const av = (a[sortField] ?? '').toString().toLowerCase();
      const bv = (b[sortField] ?? '').toString().toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [locations, search, filterStation, sortField, sortDir]);

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
  const totalLocations = locations.length;
  const totalStations = new Set(locations.map((l) => l.stationName).filter(Boolean)).size;
  const totalStationTypes = new Set(locations.map((l) => l.stationTypeName).filter(Boolean)).size;
  const totalCodes = locations.filter((l) => l.code).length;

  return (
    <div className={`dashboard loc-page ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
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
            const activeNav = 'locations';
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
              <h1>Locations</h1>
              <p>Naval Station & Location Registry</p>
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
        <main className="content loc-content">
          {/* Summary Mini Cards */}
          <section className="loc-summary-strip">
            <div className="loc-mini-card">
              <span className="loc-mini-icon">📍</span>
              <div>
                <p className="loc-mini-value">{totalLocations}</p>
                <p className="loc-mini-label">Total Locations</p>
              </div>
            </div>
            <div className="loc-mini-card">
              <span className="loc-mini-icon">⚓</span>
              <div>
                <p className="loc-mini-value">{totalStations}</p>
                <p className="loc-mini-label">Stations</p>
              </div>
            </div>
            <div className="loc-mini-card">
              <span className="loc-mini-icon">🏷️</span>
              <div>
                <p className="loc-mini-value">{totalStationTypes}</p>
                <p className="loc-mini-label">Station Types</p>
              </div>
            </div>
            <div className="loc-mini-card">
              <span className="loc-mini-icon">🔖</span>
              <div>
                <p className="loc-mini-value">{totalCodes}</p>
                <p className="loc-mini-label">With Codes</p>
              </div>
            </div>
          </section>

          {/* Toolbar */}
          <section className="loc-toolbar">
            <div className="loc-search-wrap">
              <span className="loc-search-icon">🔍</span>
              <input
                type="text"
                className="loc-search"
                placeholder="Search locations, stations, codes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="loc-search-clear" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
            <select
              className="loc-filter"
              value={filterStation}
              onChange={(e) => setFilterStation(e.target.value)}
            >
              <option value="">All Stations</option>
              {stationNames.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <span className="loc-result-count">
              {filteredLocations.length} of {totalLocations} locations
            </span>
          </section>

          {/* Table */}
          {loading ? (
            <div className="loc-loader">
              <div className="loc-spinner" />
              <p>Loading location registry…</p>
            </div>
          ) : error ? (
            <div className="loc-error">
              <span className="loc-error-icon">⚠️</span>
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          ) : (
            <div className="loc-table-wrap">
              <table className="loc-table">
                <thead>
                  <tr>
                    <th className="loc-th-number">#</th>
                    <th onClick={() => handleSort('locationName')} className="sortable">
                      Location Name <span className="sort-arrow">{sortIcon('locationName')}</span>
                    </th>
                    <th onClick={() => handleSort('code')} className="sortable">
                      Code <span className="sort-arrow">{sortIcon('code')}</span>
                    </th>
                    <th onClick={() => handleSort('stationName')} className="sortable">
                      Station <span className="sort-arrow">{sortIcon('stationName')}</span>
                    </th>
                    <th onClick={() => handleSort('stationTypeName')} className="sortable">
                      Station Type <span className="sort-arrow">{sortIcon('stationTypeName')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="loc-empty">
                        No locations match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredLocations.map((loc, idx) => (
                      <tr key={loc.id} className="loc-row" style={{ animationDelay: `${Math.min(idx, 15) * 0.03}s` }}>
                        <td className="loc-td-number">{idx + 1}</td>
                        <td className="loc-td-name">{loc.locationName || '—'}</td>
                        <td>
                          <span className="loc-code-badge">{loc.code || '—'}</span>
                        </td>
                        <td>{loc.stationName || '—'}</td>
                        <td>
                          <span className="loc-type-badge">{loc.stationTypeName || '—'}</span>
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
