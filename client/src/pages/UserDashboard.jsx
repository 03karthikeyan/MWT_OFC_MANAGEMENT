import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAttendance, 
  fetchWorkUpdates, 
  fetchLeaves, 
  fetchMyAttendance, 
  fetchNotifications, 
  fetchIncomingRequests, 
  fetchOnDuty,
  updateStats
} from '../redux/slices/dataSlice';
import { checkIn, checkOut, fetchMyPayslips } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBriefcase,
  HiOutlineArrowTrendingUp,
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineChevronRight,
  HiOutlineXMark,
  HiOutlineMegaphone,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineSquare2Stack
} from 'react-icons/hi2';

const UserDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { 
    attendance, 
    workUpdates, 
    notifications, 
    incomingRequests, 
    leaves, 
    myAttendance, 
    onDuty,
    stats,
    loading: dataLoading 
  } = useSelector((state) => state.data);

  const [latestPayslip, setLatestPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState(null);
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [urgentAnnouncement, setUrgentAnnouncement] = useState(null);
  const [countdown, setCountdown] = useState(15);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting] = useState(() => {
    const greetings = ['Bonjour', 'Welcome', 'Hello', 'Greetings', 'Hi', 'Good to see you', 'Howdy', 'Namaste'];
    return greetings[Math.floor(Math.random() * greetings.length)];
  });
  const [hasToasted, setHasToasted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timer;
    if (showUrgentModal && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showUrgentModal && countdown === 0) {
      closeUrgentModal();
    }
    return () => clearInterval(timer);
  }, [showUrgentModal, countdown]);

  const getElapsedTimeString = () => {
    if (!attendance?.checkIn || attendance?.checkOut) return null;
    const diff = currentTime - new Date(attendance.checkIn);
    if (diff < 0) return '00:00:00';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
      
      // Auto-refresh data every 60 seconds
      const refreshInterval = setInterval(() => {
        dispatch(fetchAttendance());
        dispatch(fetchWorkUpdates());
      }, 60000);

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  // Recalculate stats whenever dependent data changes in Redux
  useEffect(() => {
    // We compute stats if we have any data, or just use defaults
    let totalMs = 0;
    myAttendance.forEach(record => {
      if (record.checkIn && record.checkOut) {
        totalMs += new Date(record.checkOut) - new Date(record.checkIn);
      }
    });

    const pendingReqs = incomingRequests.filter(r => r.status === 'Pending');

    dispatch(updateStats({
        totalTasks: workUpdates.length,
        completedTasks: workUpdates.filter(w => w.status === 'completed').length,
        leavesTaken: leaves.filter(l => l.status === 'approved').length,
        attendanceRate: myAttendance.length > 0 ? Math.round((myAttendance.filter(a => a.checkIn && a.checkOut).length / 30) * 100) : 0,
        totalWorkingHours: Math.floor(totalMs / (1000 * 60 * 60)),
        totalWorkingDays: myAttendance.length,
        onDutyDays: onDuty.filter(r => r.status === 'approved').length,
        pendingRequests: pendingReqs.length
    }));

    if (!hasToasted && user && workUpdates.length > 0) {
        if (notifications?.length > 0) {
          toast(`You have ${notifications.length} new announcement(s)`, { icon: '📢', duration: 4000 });
        }
        if (pendingReqs.length > 0) {
          toast.success(`You have ${pendingReqs.length} pending request(s)`, { icon: '🔔', duration: 4000 });
        }
        setHasToasted(true);
    }
  }, [workUpdates, leaves, myAttendance, onDuty, notifications, incomingRequests, dispatch, hasToasted, user]);

  const loadDashboard = () => {
    const hasExistingData = workUpdates.length > 0 || myAttendance.length > 0;
    
    // Background sync - don't show loading if we have data
    dispatch(fetchAttendance());
    dispatch(fetchWorkUpdates());
    dispatch(fetchLeaves());
    dispatch(fetchMyAttendance());
    dispatch(fetchNotifications());
    dispatch(fetchIncomingRequests());
    dispatch(fetchOnDuty());
    getPayslip();

    if (!hasExistingData) {
        setLoading(true);
        // Short timeout to let initial Redux flow happen or show the frame
        setTimeout(() => setLoading(false), 500);
    }
  };

  const getPayslip = async () => {
    try {
        const payslipRes = await fetchMyPayslips();
        setLatestPayslip(payslipRes.data[0] || null);
    } catch (err) {
        // Silently fail for non-critical data
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await checkIn();
      toast.success(res.data.message);
      dispatch(fetchAttendance()); // Refresh attendance in store
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await checkOut();
      toast.success(res.data.message);
      dispatch(fetchAttendance()); // Refresh attendance in store
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
  };

  const closeUrgentModal = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('last_urgent_seen_date', today);
    setShowUrgentModal(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getTimingBadge = (workDate, createdAt) => {
    if (!createdAt) return null;
    const wDate = new Date(workDate).toISOString().split('T')[0];
    const cDate = new Date(createdAt).toISOString().split('T')[0];
    if (wDate === cDate) return null;
    return (
      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-2 ${wDate < cDate ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
        {wDate < cDate ? 'Late' : 'Early'}
      </span>
    );
  };

  // Loading is handled per-section or backgrounded
  // if (loading) return ( ... );

  const jobRoleColors = {
    Developer: 'bg-blue-50 text-blue-600 border-blue-100',
    HR: 'bg-rose-50 text-rose-600 border-rose-100',
    CEO: 'bg-amber-50 text-amber-600 border-amber-100',
    Manager: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    Designer: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Flutter Developer': 'bg-cyan-50 text-cyan-600 border-cyan-100',
    'Team Leader': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    Accounts: 'bg-slate-100 text-slate-700 border-slate-200 shadow-sm',
    Staff: 'bg-slate-50 text-slate-600 border-slate-100',
  };

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
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending Requests Section */}
      {incomingRequests.filter(r => r.status === 'Pending').length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-2">Requests Requiring Your Attention</h3>
          {incomingRequests.filter(r => r.status === 'Pending').map((req) => (
            <div 
              key={req._id} 
              className="p-4 md:p-6 rounded-[2rem] border relative overflow-hidden bg-indigo-50 border-indigo-100 animate-in slide-in-from-top duration-500"
            >
              <div className="flex items-start gap-4 relative z-10">
                <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600">
                  <HiOutlineSquare2Stack className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-indigo-800 uppercase tracking-widest mb-1">{req.subject}</h4>
                  <p className="text-sm font-medium leading-relaxed opacity-80 text-indigo-700">From: {req.userId?.name} ({req.type})</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-2 opacity-50 text-indigo-600">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Link 
                  to={user?.role === 'admin' ? "/admin/requests" : "/requests"}
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest shadow-md"
                >
                  Review
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header with quick stats */}
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <HiOutlineClock className="w-32 h-32 text-indigo-600 rotate-12" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 text-2xl font-black">
                        {user?.name?.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{greeting}, {user?.name?.split(' ')[0]}</h1>
                            <span className={`px-2.5 py-1 rounded-xl border text-[9px] font-black uppercase tracking-widest ${jobRoleColors[user?.jobRole] || jobRoleColors.Staff}`}>
                                {user?.jobRole}
                            </span>
                        </div>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
                           <HiOutlineCalendar className="w-4 h-4 text-indigo-400" />
                           {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric' })}
                           <span className="text-indigo-600 font-black ml-2">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {!attendance?.checkIn ? (
                        <button onClick={handleCheckIn} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                           Check In
                        </button>
                    ) : !attendance?.checkOut ? (
                        <div className="flex items-center gap-4">
                            <div className="px-6 py-4 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl font-black text-lg tracking-widest shadow-inner flex items-center gap-3">
                               <HiOutlineClock className="w-5 h-5 text-indigo-500" />
                               {getElapsedTimeString()}
                            </div>
                            <button onClick={handleCheckOut} className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl active:scale-95 flex items-center gap-3">
                               <div className="w-2 h-2 rounded-full bg-white opacity-50" />
                               Check Out
                            </button>
                        </div>
                    ) : (
                        <div className="px-8 py-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3">
                           <HiOutlineCheckCircle className="w-5 h-5" />
                           Daily Quota Met
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Payslip Mini Preview Box */}
        <div className="w-full xl:w-80 bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group border border-white/10 shadow-2xl shadow-indigo-900/20">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
               <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Latest Payslip</p>
                    {latestPayslip ? (
                        <div>
                            <h3 className="text-2xl font-black tracking-tight">{latestPayslip.month}</h3>
                            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mt-1">₹ {latestPayslip.summary.netSalary.toLocaleString()}</p>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-xl font-bold opacity-40 uppercase tracking-tight italic">No records</h3>
                        </div>
                    )}
               </div>
               <Link to="/payslips" className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-all border border-white/5">
                 View Document
               </Link>
            </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Clocking Time', value: stats.totalWorkingHours + ' hrs', icon: HiOutlineClock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Cumulative Days', value: stats.totalWorkingDays + ' days', icon: HiOutlineCalendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Task Velocity', value: stats.completedTasks + '/' + stats.totalTasks, icon: HiOutlineBriefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'On Duty Field Work', value: stats.onDutyDays + ' records', icon: HiOutlineBriefcase, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Attendance Rate', value: stats.attendanceRate + '%', icon: HiOutlineArrowTrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((m, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-xl hover:shadow-slate-100 transition-all cursor-default group overflow-hidden relative">
                <div className={`absolute -right-2 -bottom-2 w-12 h-12 opacity-10 group-hover:scale-150 transition-transform ${m.bg} rounded-full`}></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center shadow-inner`}>
                        <m.icon className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">{m.value}</p>
                    </div>
                </div>
            </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Context */}
        <div className="glass-card p-8 lg:col-span-1 border-2 border-indigo-50 shadow-indigo-100 animate-in fade-in slide-in-from-left duration-700">
           <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase">Live Timeline</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date().toDateString()}</p>
                </div>
                <HiOutlineSquare2Stack className="w-6 h-6 text-indigo-200" />
           </div>

           <div className="space-y-8 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-[2px] before:bg-indigo-50">
                <div className="flex items-start gap-6 relative z-10">
                    <div className={`w-6 h-6 rounded-full border-4 border-white shadow-md shrink-0 mt-1 transition-colors ${attendance?.checkIn ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                    <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Shift Check-In</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{attendance?.checkIn ? formatTime(attendance.checkIn) : 'Awaiting initialization...'}</p>
                    </div>
                </div>
                <div className="flex items-start gap-6 relative z-10">
                    <div className={`w-6 h-6 rounded-full border-4 border-white shadow-md shrink-0 mt-1 transition-colors ${attendance?.checkOut ? 'bg-rose-600' : 'bg-slate-200'}`}></div>
                    <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Shift Check-Out</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{attendance?.checkOut ? formatTime(attendance.checkOut) : attendance?.checkIn ? 'Ongoing activity' : 'Awaiting check-in'}</p>
                    </div>
                </div>
           </div>

           <div className="mt-10 p-6 bg-slate-900 rounded-[2rem] text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/40 transition-all"></div>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-2">Workspace Insight</p>
                <p className="text-sm font-medium leading-relaxed italic opacity-80">"Productivity is never an accident. It is always the result of a commitment to excellence."</p>
           </div>
        </div>

        {/* Work Feed */}
        <div className="glass-card p-8 lg:col-span-2 animate-in fade-in slide-in-from-right duration-700">
           <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-lg font-black text-slate-900 uppercase">Production Work-Feed</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tracking latest contributions</p>
                </div>
                <Link to="/work-updates" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 hover:border-indigo-600 pb-1 transition-all">View Full Log</Link>
           </div>

           {workUpdates.length === 0 ? (
                <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                    <HiOutlineBriefcase className="w-12 h-12 mx-auto text-slate-200 mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-tight">No submissions for this period</p>
                </div>
           ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workUpdates.slice(0, 4).map((work) => (
                        <div 
                            key={work._id} 
                            onClick={() => setSelectedWork(work)}
                            className="p-5 bg-white border border-slate-100 rounded-[2rem] hover:shadow-2xl hover:shadow-indigo-900/5 hover:-translate-y-1 transition-all cursor-pointer relative group"
                        >
                            <div className={`absolute top-0 right-0 w-1 h-12 rounded-bl-full transition-colors ${
                                work.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}></div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                    work.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                }`}>
                                    {work.status}
                                </span>
                                {getTimingBadge(work.date, work.createdAt)}
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1 mb-2 group-hover:text-indigo-600 transition-colors uppercase">{work.title}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium italic">
                                {work.description || 'No summary log found.'}
                            </p>
                        </div>
                    ))}
                </div>
           )}
        </div>
      </div>

       {/* Work Detail Modal */}
       {selectedWork && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl relative border border-white/20 animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setSelectedWork(null)}
              className="absolute top-8 right-8 p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            
            <div className="mb-8">
              <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm inline-block mb-4 ${
                selectedWork.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
              }`}>
                {selectedWork.status}
              </span>
              <h2 className="text-3xl font-black text-slate-900 leading-[1.1] uppercase tracking-tighter">{selectedWork.title}</h2>
              <div className="flex items-center gap-3 mt-4 text-slate-400">
                 <HiOutlineCalendar className="w-4 h-4" />
                 <p className="text-[10px] font-black uppercase tracking-widest">{new Date(selectedWork.date).toDateString()}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 border border-white shadow-inner">
              <p className="text-slate-700 text-md leading-relaxed whitespace-pre-wrap font-medium italic italic">
                "{selectedWork.description || 'No detailed log provided for this task.'}"
              </p>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100 font-black text-lg">
                    {user?.name?.charAt(0)}
                 </div>
                 <div>
                    <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{user?.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{user?.jobRole}</p>
                 </div>
              </div>
              <button onClick={() => setSelectedWork(null)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-slate-100">
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Urgent Announcement Modal */}
      {showUrgentModal && urgentAnnouncement && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={closeUrgentModal}
        >
          <div 
            className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative border-4 border-rose-100 animate-in zoom-in-95 duration-300 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Decorative Element */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-50 rounded-full blur-3xl opacity-50"></div>
            
            <button
              onClick={closeUrgentModal}
              className="absolute top-6 right-6 p-2 hover:bg-rose-50 rounded-xl transition-all text-rose-300 hover:text-rose-600 z-10"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>

            <div className="text-center space-y-6 relative z-10">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-100 rounded-[2.5rem] text-rose-600 mb-2 animate-bounce">
                <HiOutlineMegaphone className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <span className="px-4 py-1.5 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-rose-200">Urgent Broadcast</span>
                <h2 className="text-3xl font-black text-slate-900 leading-tight uppercase tracking-tighter pt-4">
                  {urgentAnnouncement.title}
                </h2>
              </div>

              <div className="bg-rose-50/50 rounded-3xl p-8 border border-rose-100/50">
                <p className="text-slate-700 text-lg leading-relaxed font-bold italic">
                  "{urgentAnnouncement.message}"
                </p>
              </div>

              <div className="pt-4">
                <button 
                  onClick={closeUrgentModal}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-4 relative overflow-hidden"
                >
                  <span className="relative z-10">I Understand</span>
                  <span className="relative z-10 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                    {countdown}s
                  </span>
                  {/* Progress bar background overlay to show time visually */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-white/10 transition-all duration-1000"
                    style={{ width: `${(countdown / 15) * 100}%` }}
                  ></div>
                </button>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-4">Broadcast will auto-dismiss in {countdown} seconds</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
