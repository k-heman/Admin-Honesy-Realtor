import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function LoadingSpinner({ label }) {
  return (
    <div
      className="flex-center"
      style={{ minHeight: '100vh', flexDirection: 'column', gap: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: '3px solid #e2e8f0',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { currentUser, loading, adminReady, isAdmin } = useAuth();
  
  if (loading || !adminReady) {
    return <LoadingSpinner label="Checking Authentication..." />;
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
