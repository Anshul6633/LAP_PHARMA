import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Public pages
import LoginPage from './pages/auth/LoginPage';

// Admin pages
import AdminDashboard   from './pages/admin/AdminDashboard';
import SemestersPage    from './pages/admin/SemestersPage';
import SubjectsPage     from './pages/admin/SubjectsPage';
import LabsPage         from './pages/admin/LabsPage';
import UsersPage        from './pages/admin/UsersPage';
import AnalyticsPage    from './pages/admin/AnalyticsPage';

// Shared pages
import ExperimentsPage      from './pages/experiments/ExperimentsPage';
import ExperimentDetailPage from './pages/experiments/ExperimentDetailPage';
import SolutionsPage        from './pages/solutions/SolutionsPage';
import EquipmentPage        from './pages/equipment/EquipmentPage';
import AttendancePage       from './pages/attendance/AttendancePage';
import RecordsPage          from './pages/records/RecordsPage';
import NotificationsPage    from './pages/notifications/NotificationsPage';
import ProfilePage          from './pages/profile/ProfilePage';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import InstructorDashboard from './pages/instructor/InstructorDashboard';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />

      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        {/* Dashboard — role-based */}
        <Route path="dashboard" element={
          user?.role === 'student' ? <StudentDashboard /> :
          user?.role === 'admin'   ? <AdminDashboard />   : <InstructorDashboard />
        } />

        {/* Admin only */}
        <Route path="semesters"  element={<ProtectedRoute roles={['admin']}><SemestersPage /></ProtectedRoute>} />
        <Route path="subjects"   element={<ProtectedRoute roles={['admin']}><SubjectsPage /></ProtectedRoute>} />
        <Route path="labs"       element={<ProtectedRoute roles={['admin','instructor']}><LabsPage /></ProtectedRoute>} />
        <Route path="users"      element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="analytics"  element={<ProtectedRoute roles={['admin']}><AnalyticsPage /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="experiments"        element={<ExperimentsPage />} />
        <Route path="experiments/:id"    element={<ExperimentDetailPage />} />
        <Route path="solutions"          element={<SolutionsPage />} />
        <Route path="equipment"          element={<EquipmentPage />} />
        <Route path="attendance"         element={<AttendancePage />} />
        <Route path="records"            element={<RecordsPage />} />
        <Route path="notifications"      element={<NotificationsPage />} />
        <Route path="profile"            element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <AppRoutes />
  </AuthProvider>
);

export default App;
