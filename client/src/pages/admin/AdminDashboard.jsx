import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchDashboardData,
  fetchDashboardStats
} from '../../redux/slices/dataSlice';
import {
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineArrowTrendingUp,
  HiOutlineMegaphone,
  HiOutlineXMark,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineArrowRight,
  HiOutlineBuildingOffice2,
  HiOutlineSparkles,
  HiOutlineBanknotes
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { 
    allAttendance, 
    allWork, 
    notifications, 
    incomingRequests, 
    stats 
  } = useSelector((state) => state.data);

  const [loading, setLoading] = useState(true);
  const [activeDismissedNotifs, setActiveDismissedNotifs] = useState([]);

  useEffect(() => {
    if (user) {
      loadDashboard();

      // Auto-refresh stats and data every 45 seconds
      const refreshInterval = setInterval(() => {
        dispatch(fetchDashboardStats());
        dispatch(fetchDashboardData());
      }, 45000);

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const loadDashboard = () => {
    dispatch(fetchDashboardStats());
    dispatch(fetchDashboardData());
    setTimeout(() => setLoading(false), 300);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const jobRoleColors = {
    Developer: 'bg-blue-50 text-blue-600 border-blue-100',
    HR: 'bg-rose-50 text-rose-600 border-rose-100',
    CEO: 'bg-amber-50 text-amber-600 border-amber-100',
    Manager: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    Designer: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Flutter Developer': 'bg-cyan-50 text-cyan-600 border-cyan-100',
    'Team Leader': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    Accounts: 'bg-slate-100 text-slate-700 border-slate-200',
    Staff: 'bg-slate-50 text-slate-600 border-slate-100',
  };

  const statusColors = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blocked: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const pendingRequestsCount = incomingRequests?.filter(r => r.status === 'Pending').length || 0;
  const activeNotifs = (notifications || []).filter(n => !activeDismissedNotifs.includes(n._id));

  return (
    <div className="space-y-8 fade-in pb-16">
      {/* Broadcast Banner Alerts */}
      {activeNotifs.length > 0 && (
        <div className="space-y-3">
          {activeNotifs.map((notif) => (
            <div 
              key={notif._id} 
              className={`p-4 md:p-5 rounded-2xl border flex items-center justify-between gap-4 shadow-sm ${
                notif.type === 'urgent' ? 'bg-rose-50/90 border-rose-200 text-rose-900' : 
                notif.type === 'warning' ? 'bg-amber-50/90 border-amber-200 text-amber-900' : 'bg-indigo-50/90 border-indigo-200 text-indigo-900'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`p-2.5 rounded-xl ${
                  notif.type === 'urgent' ? 'bg-rose-100 text-rose-600' : 
                  notif.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <HiOutlineMegaphone className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">{notif.title}</h4>
                  <p className="text-xs font-medium opacity-90 mt-0.5">{notif.message}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveDismissedNotifs(prev => [...prev, notif._id])}
                className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="hrms-card p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <HiOutlineSparkles className="w-4 h-4" />
              Enterprise Operations Center
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Welcome back, {user?.name || 'Administrator'}
            </h1>
            <p className="text-slate-300 text-sm font-medium max-w-xl">
              System is operating at high productivity. Check attendance punches, approve requests, and review project velocity below.
            </p>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/attendance"
              className="px-4 py-2.5 bg-white text-slate-900 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <HiOutlineClock className="w-4 h-4 text-indigo-600" />
              Manual Punch
            </Link>
            <Link
              to="/admin/leaves"
              className="px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white border border-indigo-400/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <HiOutlineCalendarDays className="w-4 h-4" />
              Leaves ({stats?.pendingLeaves || 0})
            </Link>
            <Link
              to="/reports"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
            >
              <HiOutlineClipboardDocumentList className="w-4 h-4" />
              Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Key HRMS Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { 
            label: 'Total Workforce', 
            value: stats.totalUsers || 0, 
            icon: HiOutlineUsers, 
            color: 'text-indigo-600', 
            bg: 'bg-indigo-50',
            link: '/admin/members'
          },
          { 
            label: 'Present Today', 
            value: stats.presentToday || 0, 
            icon: HiOutlineCheckCircle, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50',
            link: '/admin/attendance'
          },
          { 
            label: 'Active Interns', 
            value: stats.activeInterns || 0, 
            icon: HiOutlineAcademicCap, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50',
            link: '/admin/internships'
          },
          { 
            label: 'Pending Leaves', 
            value: stats.pendingLeaves || 0, 
            icon: HiOutlineCalendarDays, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50',
            link: '/admin/leaves'
          },
          { 
            label: 'Pending On-Duty', 
            value: stats.pendingOnDuty || 0, 
            icon: HiOutlineBriefcase, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50',
            link: '/admin/on-duty'
          },
        ].map((item, idx) => (
          <Link
            key={idx}
            to={item.link}
            className="stat-card hover:scale-[1.02] transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
              <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
              {item.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Financial Overview (If Admin) */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="hrms-card p-6 border-l-4 border-l-blue-600 bg-gradient-to-br from-white to-blue-50/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Internship Invoiced Revenue</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  ₹{(stats?.totalInvoiced || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <HiOutlineBanknotes className="w-6 h-6" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600">
                <span>Collected: ₹{(stats?.totalCollected || 0).toLocaleString('en-IN')}</span>
                <span>{Math.round(((stats?.totalCollected || 0) / (stats?.totalInvoiced || 1)) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-700" 
                  style={{ width: `${Math.min(100, Math.round(((stats?.totalCollected || 0) / (stats?.totalInvoiced || 1)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="hrms-card p-6 border-l-4 border-l-emerald-600 bg-gradient-to-br from-white to-emerald-50/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Accounts Balance</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">
                  ₹{Math.max(0, (stats?.totalInvoiced || 0) - (stats?.totalCollected || 0)).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <HiOutlineArrowTrendingUp className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active Enrollments
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Under Processing
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dual Activity Panels: Live Attendance & Team Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Attendance Panel */}
        <div className="hrms-card flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h2 className="text-base font-black text-slate-900">Today's Attendance Roster</h2>
            </div>
            <Link 
              to="/admin/attendance" 
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Manage <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px] flex-1">
            {allAttendance?.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                No check-ins registered yet today.
              </div>
            ) : (
              allAttendance.slice(0, 8).map((record) => (
                <div key={record._id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center border border-indigo-100 overflow-hidden shrink-0">
                      {record.userId?.profilePicture ? (
                        <img src={record.userId.profilePicture} alt={record.userId.name} className="w-full h-full object-cover" />
                      ) : (
                        record.userId?.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900">{record.userId?.name || 'Unknown'}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${jobRoleColors[record.userId?.jobRole] || jobRoleColors.Staff}`}>
                          {record.userId?.jobRole || 'Staff'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {record.userId?.employeeId || 'ID Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono font-bold">
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      IN: {formatTime(record.checkIn)}
                    </span>
                    <span className={record.checkOut ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100' : 'text-slate-300 text-[11px]'}>
                      {record.checkOut ? `OUT: ${formatTime(record.checkOut)}` : 'On Shift'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Work Feed */}
        <div className="hrms-card flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <HiOutlineArrowTrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-black text-slate-900">Latest Work Submissions</h2>
            </div>
            <Link 
              to="/admin/work-updates" 
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Full Log <HiOutlineArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[380px] flex-1">
            {allWork?.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                No recent work journals submitted.
              </div>
            ) : (
              allWork.slice(0, 6).map((work) => (
                <div key={work._id} className="p-4 hover:bg-slate-50/80 transition-colors group">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate max-w-[70%]">
                      {work.title}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${statusColors[work.status] || 'bg-slate-50 text-slate-600'}`}>
                      {work.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1 italic font-medium mb-2">
                    {work.description || 'No description provided.'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>By: <strong className="text-slate-700">{work.userId?.name || 'Unknown'}</strong></span>
                    <span>{new Date(work.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
