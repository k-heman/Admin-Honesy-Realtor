import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiPhone, FiKey, FiArrowRight, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

function Login() {
  const { currentUser, loginWithPhone, verifyOTP, authLoading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Phone Input, 2 = OTP Input
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [formError, setFormError] = useState('');

  if (currentUser) return <Navigate to="/" replace />;

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Format phone number to E.164 (+91...)
  const getFormattedPhone = (rawPhone) => {
    let stripped = rawPhone.trim().replace(/\s+/g, '');
    if (!stripped.startsWith('+')) {
      if (stripped.startsWith('91') && stripped.length > 10) {
        stripped = '+' + stripped;
      } else {
        // Prepend +91 as default country code
        stripped = '+91' + stripped;
      }
    }
    return stripped;
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setFormError('');

    const formatted = getFormattedPhone(phone);
    // Simple verification: must have country code and 10 digits (so length >= 12)
    if (formatted.length < 12) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const ALLOWED_NUMBERS = ['+918074411454', '+918523802251'];
    if (!ALLOWED_NUMBERS.includes(formatted)) {
      setFormError('Access denied. Only registered admin mobile numbers are allowed.');
      toast.error('Unauthorized mobile number');
      return;
    }

    try {
      await loginWithPhone(formatted, 'recaptcha-container');
      toast.success('OTP sent successfully!');
      setStep(2);
      setTimer(60);
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Failed to send OTP. Please try again.';
      if (msg.includes('recaptcha') || msg.includes('reCAPTCHA')) {
        msg = 'reCAPTCHA verification failed. Please try again.';
      }
      setFormError(msg);
      toast.error('Failed to send OTP');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setFormError('');

    if (otp.trim().length !== 6) {
      setFormError('Please enter the 6-digit OTP.');
      return;
    }

    try {
      await verifyOTP(otp.trim());
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      console.error(err);
      const msg = err.message || 'OTP verification failed.';
      setFormError(msg);
      if (msg === 'Unauthorized Access') {
        // Redirect to unauthorized page
        navigate('/unauthorized');
      } else {
        toast.error('Verification failed');
      }
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (timer > 0) return;
    setFormError('');
    const formatted = getFormattedPhone(phone);

    const ALLOWED_NUMBERS = ['+918074411454', '+918523802251'];
    if (!ALLOWED_NUMBERS.includes(formatted)) {
      setFormError('Access denied. Only registered admin mobile numbers are allowed.');
      toast.error('Unauthorized mobile number');
      return;
    }

    try {
      await loginWithPhone(formatted, 'recaptcha-container');
      toast.success('OTP resent successfully!');
      setTimer(60);
      setOtp('');
    } catch (err) {
      console.error(err);
      setFormError(err.message || 'Failed to resend OTP.');
    }
  };

  // Go back to edit phone number
  const handleBackToPhone = () => {
    setStep(1);
    setOtp('');
    setFormError('');
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
            {step === 1 
              ? 'Enter your registered admin mobile number' 
              : `Enter the OTP sent to ${getFormattedPhone(phone)}`
            }
          </p>

          {step === 1 ? (
            /* Step 1: Send OTP Form */
            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <FiPhone style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    className={`form-control ${formError ? 'error' : ''}`}
                    style={{ paddingLeft: 36 }}
                    type="tel"
                    placeholder="e.g. 8523802251"
                    value={phone}
                    onChange={e => { setPhone(e.target.value.replace(/[^0-9+]/g, '')); setFormError(''); }}
                    required
                    disabled={authLoading}
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                  Include country code (e.g., +91). If omitted, +91 will be added.
                </p>
              </div>

              {formError && (
                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiAlertCircle style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={authLoading}>
                {authLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spin-sm" /> Sending OTP...
                  </span>
                ) : (
                  <><FiArrowRight /> Send OTP</>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Verify OTP Form */
            <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Enter 6-Digit OTP</label>
                <div style={{ position: 'relative' }}>
                  <FiKey style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    className={`form-control ${formError ? 'error' : ''}`}
                    style={{ paddingLeft: 36, letterSpacing: '0.15em', fontWeight: 600 }}
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={e => { setOtp(e.target.value.replace(/[^0-9]/g, '')); setFormError(''); }}
                    required
                    disabled={authLoading}
                  />
                </div>
              </div>

              {formError && (
                <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiAlertCircle style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg w-full" disabled={authLoading}>
                {authLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="spin-sm" /> Verifying...
                  </span>
                ) : (
                  <><FiArrowRight /> Verify OTP</>
                )}
              </button>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={handleResendOTP}
                  disabled={timer > 0 || authLoading}
                >
                  {timer > 0 ? `Resend OTP (${timer}s)` : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  onClick={handleBackToPhone}
                  disabled={authLoading}
                >
                  <FiArrowLeft size={14} /> Back
                </button>
              </div>
            </form>
          )}

          {/* Invisible Google reCAPTCHA Container */}
          <div id="recaptcha-container" style={{ marginTop: 10 }}></div>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: 20 }}>
            Restricted access — Authorized admins only
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
              <div key={item} style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; display: inline-block; animation: spin 0.7s linear infinite; flex-shrink: 0; }
      `}</style>
    </div>
  );
}

export default Login;
