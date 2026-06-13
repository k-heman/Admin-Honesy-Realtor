import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PropertiesList from './pages/Properties/PropertiesList';
import CategoriesList from './pages/Categories/CategoriesList';
import LocationsList from './pages/Locations/LocationsList';
import EnquiriesList from './pages/Enquiries/EnquiriesList';
import TestimonialsList from './pages/Testimonials/TestimonialsList';
import BannersList from './pages/Banners/BannersList';
import UsersList from './pages/Users/UsersList';
import SettingsPage from './pages/Settings/SettingsPage';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<PropertiesList />} />
            <Route path="categories" element={<CategoriesList />} />
            <Route path="locations" element={<LocationsList />} />
            <Route path="enquiries" element={<EnquiriesList />} />
            <Route path="testimonials" element={<TestimonialsList />} />
            <Route path="banners" element={<BannersList />} />
            <Route path="users" element={<UsersList />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              borderRadius: '10px',
              padding: '12px 16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
              maxWidth: 380,
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
              style: { border: '1px solid #d1fae5', background: '#f0fdf4' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
              style: { border: '1px solid #fee2e2', background: '#fff5f5' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
