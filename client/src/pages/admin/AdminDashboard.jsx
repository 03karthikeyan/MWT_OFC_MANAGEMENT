import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  updateStats,
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
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { 
    users, 
    allAttendance, 
    allWork, 
    allLeaves, 
    notifications, 
    incomingRequests, 
    stats 
  } = useSelector((state) => state.data);

  const [loading, setLoading] = useState(true);
  const [hasToasted, setHasToasted] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboard();

      // Auto-refresh stats and data every 60 seconds
      const refreshInterval = setInterval(() => {
        dispatch(fetchDashboardStats());
        dispatch(fetchDashboardData());
      }, 60000);

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  // Handle specific notifications/toasts on first data load
  useEffect(() => {
    if (!hasToasted && user && (incomingRequests.length > 0 || stats.totalUsers > 0)) {
        const pReqs = incomingRequests.filter(r => r.status === 'Pending');
        
        if (notifications?.length > 0) {
          toast(`You have ${notifications.length} active announcement(s)`, { icon: '📢', duration: 4000 });
        }
        if (pReqs.length > 0) {
          toast.success(`You have ${pReqs.length} pending request(s) to review`, { icon: '🔔', duration: 4000 });
        }
        setHasToasted(true);
    }
  }, [stats.totalUsers, notifications, incomingRequests, hasToasted, user]);

  const loadDashboard = () => {
    // Stage 1: Fast metrics fetch (instant)
    dispatch(fetchDashboardStats());
    
    // Stage 2: Detailed lists fetch (background)
    dispatch(fetchDashboardData());
    
    // Snappy transition
    setTimeout(() => setLoading(false), 300);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
    blocked: 'bg-red-100 text-red-700',
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

  const getTimingBadge = (workDate, createdAt) => {
    if (!createdAt) return null;
    const wDate = new Date(workDate).toISOString().split('T')[0];
    const cDate = new Date(createdAt).toISOString().split('T')[0];
    
    if (wDate === cDate) return null;
    if (wDate < cDate) {
      return (
        <span className="px-1.5 py-0.5 rounded border bg-rose-50 text-rose-600 border-rose-100 text-[8px] font-black uppercase tracking-widest inline-block ml-2">Late Update</span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black uppercase tracking-widest inline-block ml-2">Early Update</span>
    );
  };

  // Non-blocking dashboard
  // if (loading) return ...

  return (
    <div className="space-y-8 fade-in">
      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div 
              key={notif._id} 
              className={`p-4 md:p-6 rounded-[2rem] border relative overflow-hidden animate-in slide-in-from-top duration-500 ${
                notif.type === 'urgent' ? 'bg-rose-50 border-rose-100 text-rose-800' : 
                notif.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-indigo-50 border-indigo-100 text-indigo-800'
              }`}
            >
              <div className="flex items-start gap-4 relative z-10">
                <div className={`p-3 rounded-2xl ${
                  notif.type === 'urgent' ? 'bg-rose-100 text-rose-600' : 
                  notif.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <HiOutlineMegaphone className="w-5 h-5 animate-bounce" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-1">{notif.title}</h4>
                  <p className="text-sm font-medium leading-relaxed opacity-80">{notif.message}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-50">
                    {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button 
                  onClick={() => setNotifications(notifications.filter(n => n._id !== notif._id))}
                  className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                >
                  <HiOutlineXMark className="w-5 h-5" />
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            </div>
          ))}
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manager <span className="text-indigo-600">Command Center</span></h1>
        <p className="text-slate-500 mt-1">Real-time overview of your team's activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Main Metrics */}
          {[
              { label: 'Total Members', value: stats.totalUsers, icon: HiOutlineUsers, color: 'border-l-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Active Interns', value: stats.activeInterns, icon: HiOutlineAcademicCap, color: 'border-l-rose-600', text: 'text-rose-600', bg: 'bg-rose-50', link: '/admin/internships' },
              { label: 'Present Today', value: stats.presentToday, icon: HiOutlineCheckCircle, color: 'border-l-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Pending Leaves', value: stats.pendingLeaves, icon: HiOutlineCalendarDays, color: 'border-l-amber-600', text: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/leaves' },
              { label: 'Pending On Duty', value: stats.pendingOnDuty, icon: HiOutlineBriefcase, color: 'border-l-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-50', link: '/admin/on-duty' }
          ].map((item, idx) => (
              <div key={idx} className={`stat-card border-l-4 ${item.color} hover:scale-[1.02] transition-all bg-white p-6 rounded-3xl shadow-sm border border-slate-100`}>
                  <div className="flex items-center justify-between">
                      <div>
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{item.label}</p>
                          <p className={`text-3xl font-black ${item.text}`}>{item.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center`}>
                          <item.icon className={`w-6 h-6 ${item.text}`} />
                      </div>
                  </div>
                  {item.link && (
                      <Link to={item.link} className="mt-4 flex items-center text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                          View Details <HiOutlineArrowTrendingUp className="ml-1 w-3 h-3" />
                      </Link>
                  )}
              </div>
          ))}

          {/* Financial Metrics - Only for Admins */}
          {user.role === 'admin' && (
              <>
                  <div className="lg:col-span-2 stat-card border-l-4 border-l-blue-600 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative group">
                      <div className="flex items-center justify-between relative z-10">
                          <div className="space-y-4 flex-1">
                              <div>
                                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Internship Revenue (Invoiced)</p>
                                  <p className="text-3xl font-black text-blue-900">₹{(stats?.totalInvoiced || 0).toLocaleString('en-IN')}</p>
                              </div>
                              <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                      <span>Collected: ₹{(stats?.totalCollected || 0).toLocaleString('en-IN')}</span>
                                      <span>{Math.round(((stats?.totalCollected || 0) / (stats?.totalInvoiced || 1)) * 100)}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                          className="h-full bg-blue-600 transition-all duration-1000" 
                                          style={{ width: `${((stats?.totalCollected || 0) / (stats?.totalInvoiced || 1)) * 100}%` }}
                                      />
                                  </div>
                              </div>
                          </div>
                          <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center ml-6">
                            <HiOutlineArrowTrendingUp className="w-8 h-8 text-blue-600" />
                          </div>
                      </div>
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-blue-50/50 rounded-full group-hover:scale-110 transition-transform duration-700" />
                  </div>

                  <div className="lg:col-span-2 stat-card border-l-4 border-l-emerald-600 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative group">
                      <div className="flex items-center justify-between relative z-10">
                          <div className="space-y-4 flex-1">
                              <div>
                                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Balance to be Collected</p>
                                  <p className="text-3xl font-black text-emerald-900">₹{((stats?.totalInvoiced || 0) - (stats?.totalCollected || 0)).toLocaleString('en-IN')}</p>
                              </div>
                              <div className="flex gap-4">
                                  <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Active Accounts</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Partial Payments</span>
                                  </div>
                              </div>
                          </div>
                          <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center ml-6">
                              <HiOutlineUsers className="w-8 h-8 text-emerald-600" />
                          </div>
                      </div>
                      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-50/50 rounded-full group-hover:scale-110 transition-transform duration-700" />
                  </div>
              </>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        {/* Today's Attendance */}
        <div className="glass-card overflow-hidden h-full">
          <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <HiOutlineClock className="w-5 h-5 text-indigo-600" />
              Live Attendance
            </h2>
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {allAttendance.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-medium">No one has checked in yet today.</div>
            ) : (
              allAttendance.slice(0, 8).map((record) => (
                <div key={record._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold group-hover:scale-110 transition-transform overflow-hidden">
                      {record.userId?.profilePicture ? (
                        <img src={record.userId.profilePicture} alt={record.userId.name} className="w-full h-full object-cover" />
                      ) : (
                        record.userId?.name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-slate-900 font-bold text-sm tracking-tight">{record.userId?.name || 'Unknown'}</p>
                          <div className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                              record.userId?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {record.userId?.role}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-widest ${
                              jobRoleColors[record.userId?.jobRole] || jobRoleColors.Staff
                            }`}>
                              {record.userId?.jobRole || 'Staff'}
                            </span>
                          </div>
                        </div>
                      <p className="text-indigo-600 text-[10px] uppercase font-bold tracking-widest">{record.userId?.employeeId || 'ID NOT SET'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider">
                    <span className="text-emerald-600">{formatTime(record.checkIn)}</span>
                    <span className="text-slate-200">→</span>
                    <span className={record.checkOut ? 'text-red-500' : 'text-slate-300'}>{formatTime(record.checkOut)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Work */}
        <div className="glass-card overflow-hidden h-full">
          <div className="p-5 bg-white border-b border-slate-100 flex items-center gap-2">
            <HiOutlineArrowTrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-slate-900 uppercase">Recent Updates</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
            {allWork.length === 0 ? (
              <div className="p-10 text-center text-slate-400 font-medium italic">Your team's work will appear here.</div>
            ) : (
              allWork.slice(0, 5).map((work) => (
                <div key={work._id} className="p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <h3 className="text-slate-900 font-bold text-xs uppercase tracking-widest truncate max-w-[70%] group-hover:text-indigo-600 transition-colors">{work.title}</h3>
                      {getTimingBadge(work.date, work.createdAt)}
                    </div>
                    <span className={`status-badge text-[10px] ${statusColors[work.status]}`}>
                      {work.status}
                    </span>
                  </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-slate-200">
                          {work.userId?.profilePicture ? (
                            <img src={work.userId.profilePicture} alt={work.userId.name} className="w-full h-full object-cover" />
                          ) : (
                            work.userId?.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <p className="text-slate-500 text-xs truncate italic flex-1 mr-4">{work.description}</p>
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">{work.userId?.name || 'Unknown'}</span>
                            <span className={`px-1.5 py-0.5 rounded border text-[6px] font-black uppercase tracking-widest ${
                              jobRoleColors[work.userId?.jobRole] || jobRoleColors.Staff
                            }`}>
                              {work.userId?.jobRole || 'Staff'}
                            </span>
                          </div>
                        </div>
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
