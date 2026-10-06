import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineBars3,
  HiOutlineXMark,
  HiOutlineSignal,
  HiOutlineClock,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCalendarDays,
  HiOutlineSparkles,
  HiOutlineHome,
  HiOutlineCheckBadge,
  HiOutlineUserCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineSquares2X2,
} from 'react-icons/hi2';
import logo from '../assets/logo.png';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { connected } = useSelector((state) => state.socket);
  const { user } = useAuth();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/admin/attendance') || path === '/attendance') return 'Time Logs & Attendance';
    if (path.includes('/admin/work-updates') || path === '/work-updates') return 'Work Journal';
    if (path.includes('/admin/leaves') || path === '/leaves') return 'Leave & Time Off';
    if (path.includes('/admin/on-duty') || path === '/on-duty') return 'On Duty Register';
    if (path.includes('/chat')) return 'Live Team Chat';
    if (path.includes('/tasks')) return 'Tasks & Sprint Planner';
    if (path.includes('/expenses')) return 'Expenses & Claims';
    if (path.includes('/assets')) return 'Hardware & Assets';
    if (path.includes('/reports')) return 'Workforce Reports';
    if (path.includes('/holidays')) return 'Company Holidays';
    if (path.includes('/admin/members')) return 'Employee Directory';
    if (path.includes('/admin/payroll') || path === '/payslips') return 'Payroll & Payslips';
    if (path.includes('/admin/internships') || path === '/internships') return 'Internship Hub';
    if (path.includes('/active-projects')) return 'Active Projects';
    if (path.includes('/portfolios')) return 'Portfolios & Showcase';
    if (path.includes('/enquiries')) return 'Client Enquiries';
    if (path.includes('/leads')) return 'Lead Pipeline';
    if (path.includes('/admin')) return 'Executive Command Center';
    if (path.includes('/dashboard')) return 'Employee Workspace';
    return 'MediaWave Portal';
  };

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';
  const attendancePath = user?.role === 'admin' ? '/admin/attendance' : '/attendance';
  const workPath = user?.role === 'admin' ? '/admin/work-updates' : '/work-updates';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Fixed Bottom Sync Indicator Pill (Desktop/Tablet) */}
      <div className="fixed bottom-6 right-8 z-[100] hidden lg:flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-lg select-none group hover:shadow-xl transition-all">
        <div
          className={`w-2 h-2 rounded-full ${
            connected
              ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]'
              : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]'
          }`}
        ></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
          {connected ? 'Live Sync Active' : 'Connecting Sync...'}
        </span>
        {connected && (
          <HiOutlineSignal className="w-3.5 h-3.5 text-emerald-600 opacity-70 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Mobile Top Header Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[60] shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors active:scale-95"
            aria-label="Open Navigation Menu"
          >
            <HiOutlineBars3 className="w-6 h-6" />
          </button>
          <div className="h-9 overflow-hidden flex items-center">
            <img src={logo} alt="MediaWave" className="h-full object-contain" />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span>{connected ? 'Live' : 'Offline'}</span>
          </div>

          <Link
            to="/profile"
            className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-xs border border-indigo-100 overflow-hidden"
          >
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </Link>
        </div>
      </header>

      {/* Sidebar Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[65] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enterprise Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Workspace Body */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Desktop Top Command Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100/60 shadow-xs">
              <HiOutlineSparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                  MediaWave Technologies
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  HRMS v1.3
                </span>
              </div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">{getPageTitle()}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Live Real-time Clock Widget */}
            <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-2xl shadow-2xs">
              <HiOutlineClock className="w-4 h-4 text-indigo-600" />
              <div className="flex flex-col">
                <span className="text-xs font-black font-mono text-slate-900 leading-none">
                  {currentTime.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                  {currentTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Quick Live Chat */}
            <Link
              to="/chat"
              className="p-2.5 bg-slate-100/80 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/80 rounded-2xl transition-all shadow-2xs relative group"
              title="Team Live Chat"
            >
              <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            </Link>

            {/* Attendance Punch Quick Button */}
            <Link
              to={attendancePath}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-md shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer select-none"
            >
              <HiOutlineCalendarDays className="w-4 h-4" />
              <span>Time Logs</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content Outlet with responsive padding */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 mobile-nav-pad transition-all duration-300">
          <div className="max-w-7xl mx-auto w-full fade-in flex-1">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Modern Mobile Bottom Navigation Dock (App-Like 1-Tap Bar) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around select-none">
        <NavLink
          to={dashboardPath}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`
          }
        >
          <HiOutlineHome className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-black uppercase tracking-tight">Home</span>
        </NavLink>

        <NavLink
          to={attendancePath}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`
          }
        >
          <HiOutlineCalendarDays className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-black uppercase tracking-tight">Time Logs</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              isActive
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`
          }
        >
          <HiOutlineCheckBadge className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-black uppercase tracking-tight">Tasks</span>
        </NavLink>

        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
              isActive
                ? 'text-indigo-600 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-700'
            }`
          }
        >
          <HiOutlineChatBubbleLeftRight className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-black uppercase tracking-tight">Chat</span>
          <span className="absolute top-0 right-2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </NavLink>

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all"
        >
          <HiOutlineSquares2X2 className="w-5 h-5 mb-0.5" />
          <span className="text-[9px] font-black uppercase tracking-tight">Menu</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;

