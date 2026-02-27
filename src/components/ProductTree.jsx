import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import navyEmblem from '../assets/navy-emblem.png';
import torpedoBlueprint from '../assets/torpedo-blueprint.png';
import missileBlueprint from '../assets/missile-blueprint.png';
import ammoBlueprint from '../assets/ammo-blueprint.png';
import smallarmsBlueprint from '../assets/smallarms-blueprint.png';
import gunBlueprint from '../assets/gun-blueprint.png';
import mineBlueprint from '../assets/mine-blueprint.png';
import defaultBlueprint from '../assets/default-blueprint.png';
import NotificationBell from './NotificationBell';
import {
  fetchNeutralParameters,
  fetchProductTree,
  fetchNodeDetails,
} from '../services/productTreeApi';
import './ProductTree.css';

/* ─── Sidebar nav ─── */
const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard', id: 'dashboard', path: '/dashboard' },
  { icon: '👥', label: 'Personnel', id: 'personnel' },
  { icon: '🚢', label: 'Ships', id: 'ships' },
  { icon: '🔫', label: 'Armament', id: 'armament', path: '/product-tree' },
  {
    icon: '📂', label: 'Masters', id: 'masters',
    children: [
      { icon: '🏢', label: 'NAI Units', id: 'nai-units', path: '/nai-units' },
      { icon: '�', label: 'Locations', id: 'locations', path: '/locations' },
      { icon: '🏗️', label: 'NAD Units', id: 'nad-units', path: '/nad-units' },
    ],
  },
  { icon: '�📋', label: 'Reports', id: 'reports' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
];

/* ─── Helpers ─── */
function getBlueprintImage(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('torpedo')) return torpedoBlueprint;
  if (c.includes('missile')) return missileBlueprint;
  if (c.includes('ammun')) return ammoBlueprint;
  if (c.includes('small') || c.includes('arm')) return smallarmsBlueprint;
  if (c.includes('gun') || c.includes('cannon') || c.includes('artill')) return gunBlueprint;
  if (c.includes('mine')) return mineBlueprint;
  return defaultBlueprint;
}

function getCatTag(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('torpedo')) return 'HEAVYWEIGHT SUB-SURFACE ASSET';
  if (c.includes('missile')) return 'TACTICAL STRIKE SYSTEM';
  if (c.includes('ammun')) return 'ORDNANCE MUNITION';
  if (c.includes('small') || c.includes('arm')) return 'SMALL ARMS WEAPON SYSTEM';
  if (c.includes('gun') || c.includes('cannon') || c.includes('artill')) return 'NAVAL GUN SYSTEM';
  if (c.includes('mine')) return 'NAVAL MINE WARFARE ASSET';
  return 'ARMAMENT COMPONENT';
}

/* ═══════════════════════════════════════════
   Detail Panel (fixed right column)
   ═══════════════════════════════════════════ */
function DetailPanel({ data, loading, nodeName }) {
  if (!data && !loading && !nodeName) {
    return (
      <aside className="pt-detail-panel">
        <div className="detail-empty">
          <div className="detail-empty-icon">
            <svg viewBox="0 0 40 40" width="40" height="40">
              <circle cx="20" cy="20" r="18" fill="none" stroke="var(--gold-400)" strokeWidth="1" opacity="0.2" />
              <circle cx="20" cy="20" r="8" fill="none" stroke="var(--gold-400)" strokeWidth="1" opacity="0.15" />
              <line x1="20" y1="4" x2="20" y2="36" stroke="var(--gold-400)" strokeWidth="0.5" opacity="0.1" />
              <line x1="4" y1="20" x2="36" y2="20" stroke="var(--gold-400)" strokeWidth="0.5" opacity="0.1" />
            </svg>
          </div>
          <p>Select a component</p>
          <p className="detail-empty-sub">Click ⓘ on any node to view specs</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="pt-detail-panel">
      <div className="detail-scroll">
        {/* Header */}
        <div className="detail-header">
          <div className="detail-header-top">
            <span className="detail-tag">ACTIVE COMPONENT</span>
            <span className="detail-info-icon">ⓘ</span>
          </div>
          <h2 className="detail-title">{nodeName || 'Loading…'}</h2>
        </div>

        {loading && (
          <div className="detail-loading">
            <div className="detail-spinner" />
            <p>LOADING DATA…</p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Technical Specifications */}
            <div className="detail-section">
              <h3 className="detail-section-title">Technical Specifications</h3>
              <div className="spec-rows">
                <SpecRow label="STORE NAME" value={data.storeName} />
                <SpecRow label="ASSET TYPE" value={data.assetType} accent />
                <SpecRow label="COMPONENT" value={data.componentName} />
                <SpecRow label="DRAWING NO." value={data.drawingNumber} accent />
                <SpecRow label="REVISION" value={data.revisionNumber} accent />
                <SpecRow label="SUPPLIER" value={data.supplierName} />
              </div>
            </div>

            {/* Classification */}
            <div className="detail-section">
              <h3 className="detail-section-title">Classification Status</h3>
              <div className="detail-class-card">
                <span className="class-dot" />
                <span className="class-text">
                  {data.standardItem || 'STANDARD'} / {data.indigenised ? 'INDIGENOUS' : 'IMPORTED'}
                </span>
              </div>
            </div>

            {/* Asset Tracking */}
            <div className="detail-section">
              <h3 className="detail-section-title">Asset Tracking</h3>
              <div className="tracking-grid">
                <div className="tracking-item">
                  <span className="tracking-label">STORE UID</span>
                  <span className="tracking-value">{data.storeUid || '—'}</span>
                </div>
                <div className="tracking-item">
                  <span className="tracking-label">OEM PART NO.</span>
                  <span className="tracking-value">{data.oemPartNo || '—'}</span>
                </div>
              </div>
              {data.indigenousPartNo && (
                <div className="tracking-grid single" style={{ marginTop: '6px' }}>
                  <div className="tracking-item">
                    <span className="tracking-label">INDIGENOUS PART</span>
                    <span className="tracking-value">{data.indigenousPartNo}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Parents */}
            {data.parentNeutralParameterStoreNames?.length > 0 && (
              <div className="detail-section">
                <h3 className="detail-section-title">Parent Assemblies</h3>
                <div className="parent-chips">
                  {data.parentNeutralParameterStoreNames.map((n, i) => (
                    <span key={i} className="parent-chip">{n}</span>
                  ))}
                </div>
              </div>
            )}

            <button className="detail-report-btn">
              ↓ FULL TECH REPORT
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

function SpecRow({ label, value, accent }) {
  if (value == null || value === '') return null;
  return (
    <div className="spec-row">
      <span className="spec-label">{label}</span>
      <span className={`spec-value ${accent ? 'accent' : ''}`}>{String(value)}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   ProductTree — main page
   ═══════════════════════════════════════════ */
export default function ProductTree() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mastersOpen, setMastersOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileOpen, setProfileOpen] = useState(false);

  const [neutralParams, setNeutralParams] = useState([]);
  const [selectedParam, setSelectedParam] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [treeData, setTreeData] = useState(null);
  const [loadingParams, setLoadingParams] = useState(false);
  const [loadingTree, setLoadingTree] = useState(false);

  const [activeChildId, setActiveChildId] = useState(null);
  const [activeSubId, setActiveSubId] = useState(null);

  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailNodeName, setDetailNodeName] = useState('');

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingParams(true);
      try { setNeutralParams((await fetchNeutralParameters()) || []); }
      catch { setNeutralParams([]); }
      finally { setLoadingParams(false); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedParam) return;
    (async () => {
      setLoadingTree(true);
      setTreeData(null);
      setActiveChildId(null);
      setActiveSubId(null);
      setDetailData(null);
      setDetailNodeName('');
      try { setTreeData(await fetchProductTree(selectedParam)); }
      catch { setTreeData(null); }
      finally { setLoadingTree(false); }
    })();
  }, [selectedParam]);

  const handleChildClick = useCallback((child) => {
    const next = activeChildId === child.id ? null : child.id;
    setActiveChildId(next);
    setActiveSubId(null);
    if (next) loadDetail(child.id, child.storeName);
  }, [activeChildId]);

  const handleSubClick = useCallback((sub) => {
    setActiveSubId(sub.id);
    loadDetail(sub.id, sub.storeName);
  }, []);

  const handleInfoClick = useCallback((id, name) => {
    loadDetail(id, name);
  }, []);

  const loadDetail = async (id, name) => {
    setDetailNodeName(name);
    setDetailLoading(true);
    setDetailData(null);
    try { setDetailData(await fetchNodeDetails(id)); }
    catch { setDetailData(null); }
    finally { setDetailLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const handleParamSelect = (e) => {
    const id = Number(e.target.value) || null;
    setSelectedParam(id);
    const p = id ? neutralParams.find((n) => n.neutralParameterId === id) : null;
    setSelectedCategory(p?.assetCategoryName || '');
  };

  const children = treeData?.subsections || [];
  const activeChild = children.find(c => c.id === activeChildId);
  const breadcrumb = [treeData?.storeName, activeChild?.storeName].filter(Boolean);

  return (
    <div className={`dashboard product-tree-page ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
      <div className="tricolor-bar"><div className="tricolor-saffron" /><div className="tricolor-white" /><div className="tricolor-green" /></div>

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={navyEmblem} alt="Sarathi" className="sidebar-logo" />
          {sidebarOpen && <div className="sidebar-brand"><h2>SARATHI</h2><span>Indian Navy</span></div>}
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const activeNav = 'armament';
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
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar"><span /><span /><span /></button>
            <div className="topbar-title"><h1>Product Tree</h1><p>Tactical Weapon System Explorer</p></div>
          </div>
          <div className="topbar-right">
            <div className="topbar-clock">
              <span className="clock-live-dot" />
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </div>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
            <NotificationBell />
            <div className="profile-area">
              <button className="profile-btn" onClick={() => setProfileOpen(v => !v)}>
                <div className="avatar">{(user?.name || 'A').charAt(0).toUpperCase()}</div>
                {sidebarOpen && <div className="profile-info"><span className="profile-name">{user?.name || 'Admin'}</span><span className="profile-role">{user?.role || 'User'}</span></div>}
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header"><div className="avatar avatar-lg">{(user?.name || 'A').charAt(0).toUpperCase()}</div><div><p className="dropdown-name">{user?.name}</p><p className="dropdown-email">{user?.email}</p></div></div>
                  <div className="dropdown-divider" />
                  <div className="dropdown-info"><p><strong>Role:</strong> {user?.role}</p>{user?.sectionName && <p><strong>Section:</strong> {user.sectionName}</p>}</div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-logout" onClick={handleLogout}>🚪 Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ═══ Content: Explorer + Detail Panel ═══ */}
        <main className="content product-tree-content">
          {/* ── Explorer (center) ── */}
          <div className="pt-explorer">
            {/* Select bar */}
            <div className="pt-toprow">
              <div className="pt-selector">
                <span className="pt-sel-label">SELECT NEUTRAL PARAMETER</span>
                <select className="pt-sel-input" value={selectedParam || ''} onChange={handleParamSelect} disabled={loadingParams}>
                  <option value="">{loadingParams ? 'LOADING…' : '— Select asset —'}</option>
                  {neutralParams.map(np => (
                    <option key={np.neutralParameterId} value={np.neutralParameterId}>
                      {np.storeName} ({np.assetCategoryName || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>
              {selectedCategory && (
                <div className="pt-cat-badge">
                  <span className="pt-ping" />{selectedCategory.toUpperCase()}
                </div>
              )}
            </div>

            {/* Breadcrumb */}
            {breadcrumb.length > 0 && (
              <nav className="pt-breadcrumb">
                <span>ARSENAL</span>
                {breadcrumb.map((b, i) => (
                  <span key={i}><span className="bc-sep">›</span>{b.toUpperCase()}</span>
                ))}
              </nav>
            )}

            {treeData && <h2 className="pt-page-title">Tactical Weapon System Explorer</h2>}

            {/* ── Empty state ── */}
            {!selectedParam && !loadingTree && (
              <div className="pt-empty">
                <div className="empty-reticle">
                  <div className="ret-ring r1" /><div className="ret-ring r2" />
                  <div className="ret-cross" /><div className="ret-dot" />
                </div>
                <h2>WEAPON SYSTEM EXPLORER</h2>
                <p>Select an asset to view its component hierarchy</p>
              </div>
            )}

            {loadingTree && (
              <div className="pt-empty">
                <div className="detail-spinner lg" />
                <p>LOADING ASSET DATA…</p>
              </div>
            )}

            {/* ── Hero Card + Children ── */}
            {!loadingTree && treeData && (
              <div className="pt-tree-area">
                {/* Hero Card — with real blueprint image */}
                <div className="hero-card">
                  <div className="hero-art-area">
                    <div className="hero-radial-glow" />
                    <img
                      src={getBlueprintImage(selectedCategory)}
                      alt={`${selectedCategory || 'Asset'} technical blueprint`}
                      className="hero-blueprint-img"
                    />
                    <div className="hero-version-tag">CLASSIFIED // DS-WIRE_v4.2</div>
                  </div>
                  <div className="hero-info-bar">
                    <div>
                      <h3 className="hero-name">{treeData.storeName}</h3>
                      <span className="hero-sub">PARENT NODE // {getCatTag(selectedCategory)}</span>
                    </div>
                    <span className="hero-active-badge">ACTIVE</span>
                  </div>
                </div>

                {/* Connector lines */}
                {children.length > 0 && (
                  <div className="connector-wrapper">
                    <div className="connector-vert" />
                    <div className="connector-horiz" />
                  </div>
                )}

                {/* Children Grid */}
                {children.length > 0 && (
                  <div className="children-grid">
                    {children.map((child) => {
                      const hasSubs = child.subsections?.length > 0;
                      const isActive = activeChildId === child.id;
                      return (
                        <div key={child.id}
                          className={`child-card ${isActive ? 'active' : ''} ${!isActive && activeChildId ? 'dimmed' : ''}`}
                          onClick={() => handleChildClick(child)}>
                          <div className="child-connector" />
                          <h4 className="child-category">{hasSubs ? 'ASSEMBLY' : 'COMPONENT'}</h4>
                          <p className="child-name">{child.storeName}</p>

                          {/* Sub-items inline (active child) */}
                          {isActive && hasSubs && (
                            <div className="child-subs">
                              {child.subsections.map(sub => (
                                <div key={sub.id}
                                  className={`child-sub-item ${activeSubId === sub.id ? 'selected' : ''}`}
                                  onClick={(e) => { e.stopPropagation(); handleSubClick(sub); }}>
                                  {sub.storeName}
                                </div>
                              ))}
                            </div>
                          )}

                          {!isActive && (
                            <div className="child-bar-wrap">
                              <div className="child-bar"><div className="child-bar-fill" style={{ width: hasSubs ? '60%' : '100%' }} /></div>
                            </div>
                          )}

                          <div className="child-footer">
                            {hasSubs && <span className="child-count">{child.subsections.length} sub</span>}
                            <button className="child-info-btn" onClick={(e) => { e.stopPropagation(); handleInfoClick(child.id, child.storeName); }} title="View details">ⓘ</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Detail Panel (fixed right) ── */}
          <DetailPanel data={detailData} loading={detailLoading} nodeName={detailNodeName} />
        </main>
      </div>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
