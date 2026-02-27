import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import navyEmblem from '../assets/navy-emblem.png';
import './LoginPage.css';

const SARATHI_WORDS = [
  { letter: 'S', word: 'System' },
  { letter: 'A', word: 'Armament' },
  { letter: 'R', word: 'Review' },
  { letter: 'A', word: 'Analysis' },
  { letter: 'T', word: 'Tracking' },
  { letter: 'H', word: '& Handling' },
  { letter: 'I', word: 'Indigenisation' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, authenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    serviceNumber: '',
    password: '',
    rememberMe: false,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  // redirect if already logged in
  useEffect(() => {
    if (authenticated) navigate('/dashboard', { replace: true });
  }, [authenticated, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceNumber || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.serviceNumber, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Indian Tricolor Bar ── */}
      <div className="tricolor-bar">
        <div className="tricolor-saffron" />
        <div className="tricolor-white" />
        <div className="tricolor-green" />
      </div>

      {/* ── Hero Panel ── */}
      <div className="hero-panel">
        <div className="ocean">
          <div className="wave wave-1" />
          <div className="wave wave-2" />
          <div className="wave wave-3" />
        </div>

        <div className="particles">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="particle" />
          ))}
        </div>

        <div className="compass-bg" />

        <div className="hero-content">
          <div className="emblem-container">
            <div className="emblem-ring" />
            <div className="emblem-ring emblem-ring-2" />
            <img
              src={navyEmblem}
              alt="Indian Navy Emblem"
              className="hero-emblem"
            />
          </div>

          <h1 className="hero-title">SARATHI</h1>

          <div className="acronym-grid">
            {SARATHI_WORDS.map((item, i) => (
              <div
                key={i}
                className="acronym-item"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <span className="acronym-letter">{item.letter}</span>
                <span className="acronym-word">{item.word}</span>
              </div>
            ))}
          </div>

          <div className="hero-divider">
            <span className="divider-diamond" />
          </div>

          <p className="hero-subtitle">Indian Navy Portal</p>

          <div className="hero-motto">
            <span className="motto-text">शं नो वरुणः</span>
          </div>

          <p className="hero-tagline">
            Secure access to Naval armament services,
            <br />
            tracking &amp; indigenisation systems.
          </p>

          <div className="security-badges">
            <div className="badge">
              <span className="badge-icon">🛡️</span>
              <span className="badge-text">256-bit Encrypted</span>
            </div>
            <div className="badge">
              <span className="badge-icon">🔐</span>
              <span className="badge-text">NIC Secured</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Panel ── */}
      <div className="form-panel">
        <div className="grid-pattern" />

        <div className="form-panel-topbar">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="live-clock">
            <span className="clock-dot" />
            <span>
              {currentTime.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </span>
          </div>
        </div>

        <div className="login-card">
          <div className="card-border-glow" />

          <div className="card-header">
            <div className="card-logo-wrap">
              <img
                src={navyEmblem}
                alt="Sarathi Logo"
                className="card-logo"
              />
            </div>
            <h2 className="card-title">
              Welcome to <span>SARATHI</span>
            </h2>
            <p className="card-desc">Authorized personnel access only</p>
            <div className="secure-indicator">
              <span className="secure-dot" />
              Secure Connection
            </div>
          </div>

          {/* error message */}
          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="serviceNumber">
                Service Number / Username
              </label>
              <div className="input-wrapper">
                <span className="input-icon">⚓</span>
                <input
                  id="serviceNumber"
                  name="serviceNumber"
                  type="text"
                  className="form-input"
                  placeholder="Enter your service number"
                  value={formData.serviceNumber}
                  onChange={handleChange}
                  autoComplete="username"
                  disabled={loading}
                  required
                />
                <span className="input-focus-line" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
                <span className="input-focus-line" />
              </div>
            </div>

            <div className="form-extras">
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span className="remember-label">Remember me</span>
              </label>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              <span className="btn-content">
                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">⚓</span>
                    Sign In
                  </>
                )}
              </span>
              <span className="btn-shimmer" />
            </button>
          </form>

          <div className="card-footer">
            <div className="footer-tricolor" />
            <p>
              <span className="gov-text">
                Government of India — Ministry of Defence
              </span>
              <br />
              © 2026 Indian Navy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
