import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import SuperadminDashboard from './components/SuperadminDashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserProfile from './components/UserProfile';
import AssessmentRunner from './components/AssessmentRunner';
import ManagerReview from './components/ManagerReview';
import EmployeeHistory from './components/EmployeeHistory';
// Consolidated Pages
import TeamPage from './components/TeamPage';
import AssessmentsPage from './components/AssessmentsPage';
import UsersPage from './components/UsersPage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';
import './index.css';

// Role-based Dashboard Component
const RoleBasedDashboard = () => {
  const { user } = useAuth();

  // Show SuperadminDashboard for staff/admin/superuser, regular Dashboard for employees
  if (user?.is_staff || user?.is_superuser || user?.role === 'employer') {
    return <SuperadminDashboard />;
  }

  return <Dashboard />;
};

// Loading Component
const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }}>
    <div style={{
      color: 'white',
      fontSize: '1.25rem',
      fontWeight: '500'
    }}>
      Loading...
    </div>
  </div>
);

// Protected Route Component - Only allows fully registered users
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Not logged in -> Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Super Admin Route - Only allows superusers
const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_superuser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Staff Route - Only allows staff/admin users
const StaffRoute = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.is_staff) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Signup Route - Allows authenticated users who haven't completed registration
const SignupRoute = ({ children }) => {
  const { isAuthenticated, isEmailVerified, isProfileComplete, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // If fully registered, go to dashboard
  if (isAuthenticated && isEmailVerified && isProfileComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  // Allow signup for non-authenticated OR partially registered users
  return children;
};

// Login Route - Redirects based on user state
const LoginRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  // Logged in -> Dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <LoginRoute>
                <Login />
              </LoginRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <SignupRoute>
                <Signup />
              </SignupRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <RoleBasedDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          {/* Consolidated Routes */}
          <Route
            path="/team"
            element={
              <StaffRoute>
                <TeamPage />
              </StaffRoute>
            }
          />
          <Route
            path="/assessments"
            element={
              <StaffRoute>
                <AssessmentsPage />
              </StaffRoute>
            }
          />
          <Route
            path="/users"
            element={
              <SuperAdminRoute>
                <UsersPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <StaffRoute>
                <ReportsPage />
              </StaffRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <StaffRoute>
                <SettingsPage />
              </StaffRoute>
            }
          />
          {/* Assessment and Review Routes */}
          <Route
            path="/assessments/:id"
            element={
              <ProtectedRoute>
                <AssessmentRunner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/review-submission/:submissionId"
            element={
              <ProtectedRoute>
                <ManagerReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team/employee/:employeeId"
            element={
              <ProtectedRoute>
                <EmployeeHistory />
              </ProtectedRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
