import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import ManagerDashboard from './components/ManagerDashboard';
import AdminAllocation from './components/AdminAllocation';
import UserProfile from './components/UserProfile';
import AdminAssessments from './components/AdminAssessments';
import AdminSettings from './components/AdminSettings';
import AssessmentRunner from './components/AssessmentRunner';
import ManagerReview from './components/ManagerReview';
import EmployeeHistory from './components/EmployeeHistory';
import AdminGlobalHistory from './components/AdminGlobalHistory';
import AdminSlackSettings from './components/AdminSlackSettings';
import DottedLineAllocation from './components/DottedLineAllocation';
import './index.css';

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
                <Dashboard />
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
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/allocation"
            element={
              <ProtectedRoute>
                <AdminAllocation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/assessments"
            element={
              <ProtectedRoute>
                <AdminAssessments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/submissions"
            element={
              <ProtectedRoute>
                <AdminGlobalHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/slack"
            element={
              <ProtectedRoute>
                <AdminSlackSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dotted-allocation"
            element={
              <ProtectedRoute>
                <DottedLineAllocation />
              </ProtectedRoute>
            }
          />
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
