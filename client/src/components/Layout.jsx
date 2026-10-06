import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
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
    if (path.includes('/admin')) return 'Executive Command Center';
    if (path.includes('/dashboard')) return 'Employee Workspace';
    return 'MediaWave Portal';
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col lg:flex-row font-sans">
      {/* Fixed Bottom Sync Indicator Pill */}
      <div className="fixed bottom-6 right-8 z-[100] hidden md:flex items-center gap-2 bg-white/90 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-lg select-none group hover:shadow-xl transition-all">
        <div
          className={`w-2 h-2 rounded-full ${
            connected
              ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.7)]'
              : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]'
          }`}
        ></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
          {connected ? 'Sync Connected' : 'Sync Reconnecting'}
        </span>
        {connected && (
          <HiOutlineSignal className="w-3.5 h-3.5 text-emerald-600 opacity-70 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-[60] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 overflow-hidden flex items-center">
            <img src={logo} alt="MediaWave" className="h-full object-contain" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          ></div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-2xl transition-all"
          >
            {isSidebarOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enterprise Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Workspace Body */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Desktop Top Command Header */}
        <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 sticky top-0 z-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <HiOutlineSparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                MediaWave HRMS Platform
              </p>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">{getPageTitle()}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Clock Widget */}
            <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-100/70 border border-slate-200/80 rounded-2xl shadow-xs">
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

            {/* Quick Action Buttons */}
            <Link
              to="/chat"
              className="p-2.5 bg-slate-100/70 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/80 rounded-2xl transition-all shadow-xs"
              title="Team Chat"
            >
              <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
            </Link>

            <Link
              to={user?.role === 'admin' ? '/admin/attendance' : '/attendance'}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider shadow-md shadow-indigo-200 transition-all cursor-pointer"
            >
              <HiOutlineCalendarDays className="w-4 h-4" />
              <span>Time Logs</span>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content Outlet */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 transition-all duration-300">
          <div className="max-w-7xl mx-auto w-full fade-in flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
