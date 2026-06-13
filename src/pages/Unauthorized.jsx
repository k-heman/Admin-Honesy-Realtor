import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

function Unauthorized() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Make sure to clean up any auth session if the user lands here
  useEffect(() => {
    logout();
  }, [logout]);

  return (
    <div className="login-page" style={{ justifyContent: 'center', alignItems: 'center', background: '#0f172a', minHeight: '100vh', display: 'flex' }}>
      <div className="login-card" style={{ maxWidth: 450, margin: '0 auto', textAlign: 'center', padding: '40px 30px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)' }}>
        <div style={{ fontSize: '4.5rem', marginBottom: 20, display: 'inline-block' }}>⚠️</div>
        
        <h1 className="login-title" style={{ fontSize: '1.75rem', color: '#ef4444', marginBottom: 12 }}>
          Unauthorized Access
        </h1>
        
        <p className="login-subtitle" style={{ fontSize: '0.925rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
          Your mobile number is not registered or active as an admin. 
          Access to the administrative dashboard is strictly restricted.
        </p>

        <button 
          onClick={() => navigate('/login')} 
          className="btn btn-primary btn-lg w-full"
          style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', borderColor: '#ef4444', color: '#fff', fontWeight: 600 }}
        >
          Back to Login
        </button>

        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 24 }}>
          Please contact the system administrator to pre-register your number.
        </p>
      </div>
    </div>
  );
}

export default Unauthorized;
