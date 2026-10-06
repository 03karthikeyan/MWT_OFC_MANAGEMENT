import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  HiOutlineXMark,
  HiOutlineMegaphone,
  HiOutlineCalendarDays,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineFingerPrint
} from 'react-icons/hi2';

const UserDashboard = () => {
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
    stats 
  } = useSelector((state) => state.data);

  const [latestPayslip, setLatestPayslip] = useState(null);
  const [selectedWork, setSelectedWork] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workMode, setWorkMode] = useState('office');
  const [activeDismissedNotifs, setActiveDismissedNotifs] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      
      const refreshInterval = setInterval(() => {
        dispatch(fetchAttendance());
        dispatch(fetchWorkUpdates());
      }, 45000);

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  useEffect(() => {
    let totalMs = 0;
    (myAttendance || []).forEach(record => {
      if (record.checkIn && record.checkOut) {
        totalMs += new Date(record.checkOut) - new Date(record.checkIn);
      }
    });

    const pendingReqs = (incomingRequests || []).filter(r => r.status === 'Pending');

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
  }, [workUpdates, leaves, myAttendance, onDuty, incomingRequests, dispatch]);

  const loadDashboard = () => {
    dispatch(fetchAttendance());
    dispatch(fetchWorkUpdates());
    dispatch(fetchLeaves());
    dispatch(fetchMyAttendance());
    dispatch(fetchNotifications());
    dispatch(fetchIncomingRequests());
    dispatch(fetchOnDuty());
    getPayslip();
  };

  const getPayslip = async () => {
    try {
      const payslipRes = await fetchMyPayslips();
      setLatestPayslip(payslipRes.data?.[0] || null);
    } catch (err) {
      // Non-critical data
    }
  };

  const handleCheckIn = async () => {
    try {
      const res = await checkIn({ workMode });
      toast.success(res.data?.message || 'Checked in successfully!');
      dispatch(fetchAttendance());
      dispatch(fetchMyAttendance());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await checkOut();
      toast.success(res.data?.message || 'Checked out successfully!');
      dispatch(fetchAttendance());
      dispatch(fetchMyAttendance());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
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

  const activeNotifs = (notifications || []).filter(n => !activeDismissedNotifs.includes(n._id));

  return (
    <div className="space-y-8 fade-in pb-16">
      {/* Broadcast Announcements */}
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

      {/* Hero Clock & Punch Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Punch Hero (2 cols) */}
        <div className="lg:col-span-2 hrms-card p-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/30">
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user?.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    user?.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-white">Hello, {user?.name?.split(' ')[0]}</h1>
                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${jobRoleColors[user?.jobRole] || jobRoleColors.Staff}`}>
                      {user?.jobRole || 'Staff'}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-300 font-mono mt-0.5">
                    {user?.employeeId || 'ID: Active Employee'} • {user?.department || 'Operations'}
                  </p>
                </div>
              </div>

              {/* Digital Live Clock */}
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-right">
                <p className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">
                  {currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xl font-mono font-black text-white tracking-wider">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Shift Progress / Punch Controller */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Shift Status</p>
                {!attendance?.checkIn ? (
                  <p className="text-lg font-black text-amber-400 mt-1">Not Checked In Today</p>
                ) : !attendance?.checkOut ? (
                  <div className="flex items-center gap-3 mt-1">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <p className="text-lg font-black text-emerald-400">
                      On Active Shift ({getElapsedTimeString()})
                    </p>
                  </div>
                ) : (
                  <p className="text-lg font-black text-indigo-300 mt-1">
                    Shift Completed ({formatTime(attendance.checkIn)} - {formatTime(attendance.checkOut)})
                  </p>
                )}
              </div>

              {/* Punch Actions */}
              <div className="flex items-center gap-3">
                {!attendance?.checkIn ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className="bg-white/10 text-white text-xs font-bold border border-white/20 rounded-xl px-3 py-3 outline-none cursor-pointer"
                    >
                      <option value="office" className="text-slate-900">Office</option>
                      <option value="wfh" className="text-slate-900">WFH</option>
                      <option value="on-duty" className="text-slate-900">On Duty</option>
                    </select>
                    <button
                      onClick={handleCheckIn}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/30 flex items-center gap-2 active:scale-95"
                    >
                      <HiOutlineFingerPrint className="w-5 h-5" />
                      Check In
                    </button>
                  </div>
                ) : !attendance?.checkOut ? (
                  <button
                    onClick={handleCheckOut}
                    className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-rose-900/30 flex items-center gap-2 active:scale-95"
                  >
                    <HiOutlineClock className="w-5 h-5" />
                    Check Out
                  </button>
                ) : (
                  <div className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                    <HiOutlineCheckCircle className="w-4 h-4" />
                    Logged for Today
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payslip & Quick Summary Card (1 col) */}
        <div className="hrms-card p-6 flex flex-col justify-between bg-gradient-to-br from-indigo-50/50 via-white to-white">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payroll Statement</span>
              <HiOutlineDocumentText className="w-5 h-5 text-indigo-600" />
            </div>

            {latestPayslip ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500">{latestPayslip.month}</p>
                <p className="text-3xl font-black text-slate-900">
                  ₹{(latestPayslip.summary?.netSalary || 0).toLocaleString('en-IN')}
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-500">
                    <span>Gross Earnings</span>
                    <span className="font-bold text-slate-700">₹{(latestPayslip.summary?.grossPay || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-rose-500">
                    <span>Total Deductions</span>
                    <span className="font-bold">-₹{(latestPayslip.summary?.totalDeductions || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400">
                <HiOutlineDocumentText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-bold">No recent payslips issued.</p>
              </div>
            )}
          </div>

          <Link
            to="/payslips"
            className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-all shadow-md flex items-center justify-center gap-2"
          >
            View Salary Documents <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Work Hours', value: `${stats.totalWorkingHours || 0} hrs`, icon: HiOutlineClock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Days Present', value: `${stats.totalWorkingDays || 0} days`, icon: HiOutlineCheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tasks Completed', value: `${stats.completedTasks || 0} / ${stats.totalTasks || 0}`, icon: HiOutlineBriefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Approved Leaves', value: `${stats.leavesTaken || 0} days`, icon: HiOutlineCalendarDays, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, idx) => (
          <div key={idx} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Work Contributions */}
      <div className="hrms-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-black text-slate-900">Your Recent Work Journal</h2>
            <p className="text-xs text-slate-400 font-medium">Daily productivity logs and task deliverables</p>
          </div>
          <Link
            to="/work-updates"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            All Updates <HiOutlineArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {workUpdates?.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <HiOutlineBriefcase className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-xs font-bold uppercase tracking-wider">No daily work logs posted yet</p>
            <Link to="/work-updates" className="text-xs font-bold text-indigo-600 mt-2 inline-block">
              + Add Today's Progress
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workUpdates.slice(0, 3).map((w) => (
              <div
                key={w._id}
                onClick={() => setSelectedWork(w)}
                className="p-4 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl border border-slate-100 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                    w.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {w.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(w.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h3 className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase line-clamp-1">
                  {w.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 italic mt-1 font-medium">
                  {w.description || 'No description provided.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal Details */}
      {selectedWork && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedWork(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                selectedWork.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {selectedWork.status}
              </span>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-2">{selectedWork.title}</h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                {new Date(selectedWork.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
              <p className="text-xs text-slate-700 leading-relaxed italic whitespace-pre-wrap">
                "{selectedWork.description || 'No detailed description.'}"
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedWork(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
