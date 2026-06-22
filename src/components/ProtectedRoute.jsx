import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
  const { currentUser, adminData, loading, adminReady } = useAuth();

  // 1. Still doing the initial Firebase auth check — show spinner
  if (loading) {
    return <LoadingSpinner label="Loading admin panel..." />;
  }

  // 2. currentUser is set but adminData hasn't resolved yet — show spinner
  //    (avoids the race condition that caused the /unauthorized bounce)
  if (currentUser && !adminReady) {
    return <LoadingSpinner label="Verifying admin access..." />;
  }

  // 3. No authenticated user → go to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 4. User is authenticated but NOT an admin → unauthorized
  if (!adminData) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 5. All good — render the dashboard
  return children;
}

function LoadingSpinner({ label }) {
  return (
    <div
      className="flex-center"
      style={{ minHeight: '100vh', flexDirection: 'column', gap: 16 }}
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

export default ProtectedRoute;
