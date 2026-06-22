import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiArrowRight, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

function Login() {
  const { currentUser, adminReady, loginWithEmail, authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  // ✅ Only redirect when BOTH currentUser AND adminData are confirmed ready
  // This prevents the race-condition bounce through /unauthorized
  if (currentUser && adminReady) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    try {
      await loginWithEmail(email, password);
      // No manual navigate() needed — the if-check above will fire
      // on next render once currentUser + adminReady are both true
      toast.success('Welcome back, Admin!');
    } catch (err) {
      const msg = err.message || 'Login failed. Please try again.';
      setFormError(msg);
      if (msg.toLowerCase().includes('unauthorized')) {
        toast.error('Unauthorized access');
      } else {
        toast.error('Login failed');
      }
    }
  };

  return (
    <div className="login-page">
      {/* Left: Login Card */}
      <div className="login-left">
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo__icon">HR</div>
            <div>
              <h1>Honesty Realtors</h1>
              <p>Admin Dashboard</p>
            </div>
          </div>

          <h2 className="login-title">Admin Login</h2>
          <p className="login-subtitle">
            Sign in with your admin credentials to continue
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail
                  style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: '#94a3b8',
                  }}
                />
                <input
                  id="admin-email"
                  className={`form-control ${formError ? 'error' : ''}`}
                  style={{ paddingLeft: 36 }}
                  type="text"
                  placeholder="honestyrealtor@gmail.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFormError(''); }}
                  required
                  autoComplete="username"
                  disabled={authLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock
                  style={{
                    position: 'absolute', left: 12, top: '50%',
                    transform: 'translateY(-50%)', color: '#94a3b8',
                  }}
                />
                <input
                  id="admin-password"
                  className={`form-control ${formError ? 'error' : ''}`}
                  style={{ paddingLeft: 36, paddingRight: 42 }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
                  required
                  autoComplete="current-password"
                  disabled={authLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: '#94a3b8',
                    padding: 0, display: 'flex', alignItems: 'center',
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {formError && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiAlertCircle style={{ flexShrink: 0 }} />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={authLoading}
              style={{ marginTop: 4 }}
            >
              {authLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spin-sm" /> Signing in...
                </span>
              ) : (
                <><FiArrowRight /> Sign In</>
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: 24 }}>
            🔒 Restricted access — Authorized admins only
          </p>
        </div>
      </div>

      {/* Right: Illustration Panel */}
      <div className="login-right">
        <div className="login-illustration">
          <div style={{ fontSize: '6rem', marginBottom: 24, filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }}>🏠</div>
          <h2>Honesty Realtors Admin</h2>
          <p>Manage your real estate portfolio, track enquiries, and grow your business — all in one powerful dashboard.</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
            {['🏘️ Properties', '📋 Enquiries', '⭐ Reviews', '📊 Analytics'].map(item => (
              <div
                key={item}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-sm {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          display: inline-block;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

export default Login;
