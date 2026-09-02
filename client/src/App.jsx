import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SocketManager from './components/SocketManager';

// Lazy load components
const Layout = lazy(() => import('./components/Layout'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const WorkUpdates = lazy(() => import('./pages/WorkUpdates'));
const Attendance = lazy(() => import('./pages/Attendance'));
const Leaves = lazy(() => import('./pages/Leaves'));
const OnDuty = lazy(() => import('./pages/OnDuty'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Members = lazy(() => import('./pages/admin/Members'));
const AdminWorkUpdates = lazy(() => import('./pages/admin/AdminWorkUpdates'));
const AdminAttendance = lazy(() => import('./pages/admin/AdminAttendance'));
const AdminLeaves = lazy(() => import('./pages/admin/AdminLeaves'));
const AdminOnDuty = lazy(() => import('./pages/admin/AdminOnDuty'));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications'));
const AdminPayslips = lazy(() => import('./pages/admin/AdminPayslips'));
const Payslips = lazy(() => import('./pages/Payslips'));
const Profile = lazy(() => import('./pages/Profile'));
const Team = lazy(() => import('./pages/Team'));
const ActiveProjects = lazy(() => import('./pages/ActiveProjects'));
const Portfolios = lazy(() => import('./pages/Portfolios'));
const Requests = lazy(() => import('./pages/Requests'));
const InternshipEnquiry = lazy(() => import('./pages/InternshipEnquiry'));
const AdminInternships = lazy(() => import('./pages/admin/AdminInternships'));
const Enquiries = lazy(() => import('./pages/Enquiries'));
const Leads = lazy(() => import('./pages/Leads'));
const AdminInternEnquiries = lazy(() => import('./pages/admin/AdminInternEnquiries'));

// Background Prefetcher
const Prefetcher = () => {
  useEffect(() => {
    // Prefetch main dashboards 2 seconds after mount to not interfere with initial load
    const timer = setTimeout(() => {
      import('./pages/admin/AdminDashboard');
      import('./pages/UserDashboard');
      import('./components/Layout');
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  return null;
};

const PageLoader = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Initializing Wave...</p>
  </div>
);

const HomeRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Prefetcher />
      <SocketManager />
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } },
          }}
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/internship-enquiry" element={<InternshipEnquiry />} />
            
            {/* User Routes */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/internship-form" element={<InternshipEnquiry sidebarMode />} />
              <Route path="/work-updates" element={<WorkUpdates />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/leaves" element={<Leaves />} />
              <Route path="/on-duty" element={<OnDuty />} />
              <Route path="/payslips" element={<Payslips />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/team" element={<Team />} />
              <Route path="/active-projects" element={<ActiveProjects />} />
              <Route path="/portfolios" element={<Portfolios />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/internships" element={<AdminInternships />} />
              <Route path="/admin/internship-enquiries" element={<AdminInternEnquiries />} />
              <Route path="/enquiries" element={<Enquiries />} />
              <Route path="/leads" element={<Leads />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute adminOnly><Layout /></ProtectedRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/members" element={<Members />} />
              <Route path="/admin/work-updates" element={<AdminWorkUpdates />} />
              <Route path="/admin/attendance" element={<AdminAttendance />} />
              <Route path="/admin/leaves" element={<AdminLeaves />} />
              <Route path="/admin/on-duty" element={<AdminOnDuty />} />
              <Route path="/admin/announcements" element={<AdminNotifications />} />
              <Route path="/admin/payroll" element={<AdminPayslips />} />
              <Route path="/admin/requests" element={<Requests />} />
              <Route path="/admin/internships" element={<AdminInternships />} />
              <Route path="/enquiries" element={<Enquiries />} />
              <Route path="/leads" element={<Leads />} />
            </Route>

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
