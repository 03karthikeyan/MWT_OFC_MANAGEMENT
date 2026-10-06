import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  getAllAttendance,
  getAllOnDuty,
  getUsers,
  adminRegularizeAttendance,
  manualCheckout,
  remindCheckIn,
  remindCheckOut,
} from '@/services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineCalendarDays,
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineXMark,
  HiOutlineBell,
  HiOutlinePencilSquare,
  HiOutlineArrowRightOnRectangle,
  HiOutlineMapPin,
  HiOutlineBriefcase,
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import AttendanceCalendar from '@/components/AttendanceCalendar';

const AdminAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [onDutyData, setOnDutyData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showManualModal, setShowManualModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Manual checkin / regularization form state
  const [manualForm, setManualForm] = useState({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    checkInTime: '09:30',
    checkOutTime: '18:30',
    workHours: '8.0',
    status: 'present',
    reason: 'Admin manual entry',
    hasCheckOut: true,
  });

  // Manual checkout form state
  const [checkoutForm, setCheckoutForm] = useState({
    checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    workHours: '8.0',
    status: 'present',
    reason: 'Admin manual checkout',
  });

  useEffect(() => {
    if (user) {
      loadAttendance();
      getUsers().then((res) => setTeamMembers(res.data.users || [])).catch(() => {});
    }
  }, [filterDate, user]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const [attRes, odRes] = await Promise.all([
        getAllAttendance({ date: filterDate }),
        getAllOnDuty({ date: filterDate, status: 'approved' }),
      ]);
      setAttendance(attRes.data?.attendance || []);
      setOnDutyData(odRes.data?.onDutyRecords || []);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDate = (type) => {
    const d = new Date();
    if (type === 'yesterday') {
      d.setDate(d.getDate() - 1);
    }
    setFilterDate(d.toISOString().split('T')[0]);
  };

  const handleManualRegularizeSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.userId || !manualForm.date) {
      toast.error('Please select an employee and date');
      return;
    }

    try {
      const targetDate = manualForm.date;
      const checkInDateTime = new Date(`${targetDate}T${manualForm.checkInTime || '09:30'}:00`);
      const checkOutDateTime = manualForm.hasCheckOut
        ? new Date(`${targetDate}T${manualForm.checkOutTime || '18:30'}:00`)
        : null;

      const payload = {
        userId: manualForm.userId,
        date: targetDate,
        checkIn: checkInDateTime,
        checkOut: checkOutDateTime,
        workHours: parseFloat(manualForm.workHours) || 8.0,
        status: manualForm.status,
        reason: manualForm.reason || 'Admin Regularization',
      };

      const res = await adminRegularizeAttendance(payload);
      toast.success('Attendance record saved & synchronized!');
      setShowManualModal(false);
      loadAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regularize attendance');
    }
  };

  const handleManualCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      const targetDate = new Date(selectedRecord.date).toISOString().split('T')[0];
      const checkOutDateTime = new Date(`${targetDate}T${checkoutForm.checkOutTime}:00`);

      const payload = {
        checkOut: checkOutDateTime,
        workHours: parseFloat(checkoutForm.workHours) || 8.0,
        status: checkoutForm.status,
        reason: checkoutForm.reason || 'Manual Admin Checkout',
      };

      await manualCheckout(selectedRecord._id, payload);
      toast.success('Manual checkout completed successfully!');
      setShowCheckoutModal(false);
      setSelectedRecord(null);
      loadAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete checkout');
    }
  };

  const handleSendReminder = async (type) => {
    try {
      if (type === 'checkin') {
        await remindCheckIn();
        toast.success('Check-in notification broadcasted to all staff');
      } else {
        await remindCheckOut();
        toast.success('Check-out reminder broadcasted to all staff');
      }
    } catch (err) {
      toast.error('Failed to send broadcast reminder');
    }
  };

  const filteredAttendance = attendance.filter((record) => {
    const name = record.userId?.name || '';
    const empId = record.userId?.employeeId || '';
    const role = record.userId?.jobRole || '';
    return (name + empId + role).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const downloadCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Job Role', 'Check In', 'Check Out', 'Work Hours', 'Status'];
    const dataRows = filteredAttendance.map((record) => [
      `"${record.userId?.name || 'Unknown'}"`,
      record.userId?.employeeId || '--',
      record.userId?.jobRole || 'Staff',
      record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '--:--',
      record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : (record.checkIn ? 'In Office' : 'Absent'),
      record.workHours || (record.checkOut ? '8' : '--'),
      record.checkOut ? 'COMPLETED' : (record.checkIn ? 'IN OFFICE' : 'ABSENT'),
    ]);

    const csvContent = [headers, ...dataRows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `attendance_report_${filterDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance report exported');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const jobRoleColors = {
    Developer: 'bg-blue-50 text-blue-700 border-blue-200',
    HR: 'bg-rose-50 text-rose-700 border-rose-200',
    CEO: 'bg-amber-50 text-amber-700 border-amber-200',
    Manager: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    Designer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Flutter Developer': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Team Leader': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    Accounts: 'bg-slate-100 text-slate-700 border-slate-200',
    Staff: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const activeInOfficeCount = attendance.filter((a) => a.checkIn && !a.checkOut).length;
  const shiftOverCount = attendance.filter((a) => a.checkOut).length;
  const totalHoursLogged = attendance.reduce((acc, cur) => acc + (cur.workHours || (cur.checkOut ? 8 : 0)), 0);

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* Top Header Section */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Shift Management & Biometric Logs
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Attendance & Shift Command Center
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Real-time shift activity, manual check-in regularizations, and daily work hour audits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Reminders trigger */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 p-1 rounded-2xl">
            <button
              onClick={() => handleSendReminder('checkin')}
              className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
              title="Broadcast Check-in push notification"
            >
              🔔 Remind In
            </button>
            <button
              onClick={() => handleSendReminder('checkout')}
              className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
              title="Broadcast Check-out push notification"
            >
              👋 Remind Out
            </button>
          </div>

          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all cursor-pointer active:scale-95"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Manual Punch / Regularize
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <HiOutlineUsers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Checked-In</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{attendance.length} Staff</h3>
          </div>
        </div>

        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <HiOutlineClock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In-Office (Active)</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{activeInOfficeCount} On-Shift</h3>
          </div>
        </div>

        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <HiOutlineCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shift Ended</p>
            <h3 className="text-2xl font-black text-blue-700 mt-0.5">{shiftOverCount} Staff</h3>
          </div>
        </div>

        <div className="stat-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <HiOutlineBriefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Hours Today</p>
            <h3 className="text-2xl font-black text-amber-700 mt-0.5">{totalHoursLogged.toFixed(1)} hrs</h3>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Actions */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleQuickDate('today')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              filterDate === new Date().toISOString().split('T')[0]
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => handleQuickDate('yesterday')}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-100 transition-all"
          >
            Yesterday
          </button>

          {/* Target Date Picker */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date:</span>
            <input
              type="date"
              className="bg-transparent border-none text-xs font-bold text-indigo-600 focus:outline-none cursor-pointer"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <button
            onClick={loadAttendance}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all"
            title="Refresh Logs"
          >
            <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-64">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID or role..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Export Report */}
          <button
            onClick={downloadCSV}
            disabled={filteredAttendance.length === 0}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 transition-all disabled:opacity-50"
          >
            <HiOutlineArrowDownTray className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Attendance Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Fetching Attendance Records...
            </p>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="py-20 text-center p-8">
            <HiOutlineClock className="w-12 h-12 text-slate-300 mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
              No Attendance Records for {filterDate}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              No staff check-ins logged for this date. Use "Manual Punch / Regularize" above to register entries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs font-medium text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-6">Employee Profile</th>
                  <th className="py-4 px-6 text-center">Check In</th>
                  <th className="py-4 px-6 text-center">Check Out</th>
                  <th className="py-4 px-6 text-center">Work Hours</th>
                  <th className="py-4 px-6">On Duty / Notes</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.map((record) => {
                  const isInOffice = record.checkIn && !record.checkOut;
                  return (
                    <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-6 font-bold">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-slate-200 text-indigo-700 font-bold flex items-center justify-center text-xs overflow-hidden shadow-xs">
                            {record.userId?.profilePicture ? (
                              <img
                                src={record.userId.profilePicture}
                                alt={record.userId.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              record.userId?.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-black text-slate-900 tracking-tight">
                                {record.userId?.name || 'Unknown'}
                              </p>
                              <span
                                className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                                  jobRoleColors[record.userId?.jobRole] || jobRoleColors.Staff
                                }`}
                              >
                                {record.userId?.jobRole || 'Staff'}
                              </span>
                            </div>
                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">
                              {record.userId?.employeeId || 'ID NOT SET'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-center font-black text-emerald-600 text-xs">
                        {formatTime(record.checkIn)}
                      </td>

                      <td className="py-4 px-6 text-center font-black text-slate-600 text-xs">
                        {record.checkOut ? formatTime(record.checkOut) : '--:--'}
                      </td>

                      <td className="py-4 px-6 text-center font-black text-slate-800 text-xs">
                        {record.workHours ? `${record.workHours}h` : (record.checkOut ? '8.0h' : '--')}
                      </td>

                      <td className="py-4 px-6">
                        {(() => {
                          const od = onDutyData.find((o) => o.userId?._id === record.userId?._id);
                          if (od) {
                            return (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-indigo-600 uppercase">
                                  <HiOutlineMapPin className="w-3 h-3" />
                                  {od.reason}
                                </span>
                              </div>
                            );
                          }
                          if (record.manualCheckoutReason) {
                            return (
                              <span className="text-[9px] font-bold text-amber-600 italic">
                                ⚙️ {record.manualCheckoutReason}
                              </span>
                            );
                          }
                          return <span className="text-[10px] text-slate-300 font-bold">Standard Shift</span>;
                        })()}
                      </td>

                      <td className="py-4 px-6">
                        {record.checkOut ? (
                          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                            Shift Ended
                          </span>
                        ) : record.checkIn ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            In Office
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                            Absent
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isInOffice && (
                            <button
                              onClick={() => {
                                setSelectedRecord(record);
                                setCheckoutForm({
                                  checkOutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                                  workHours: '8.0',
                                  status: 'present',
                                  reason: 'Admin manual checkout',
                                });
                                setShowCheckoutModal(true);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                              title="Manual Check-Out"
                            >
                              <HiOutlineArrowRightOnRectangle className="w-3.5 h-3.5" />
                              Punch Out
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setManualForm({
                                userId: record.userId?._id || '',
                                date: new Date(record.date || filterDate).toISOString().split('T')[0],
                                checkInTime: record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:30',
                                checkOutTime: record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '18:30',
                                workHours: record.workHours ? record.workHours.toString() : '8.0',
                                status: record.status || 'present',
                                reason: record.manualCheckoutReason || 'Admin adjustment',
                                hasCheckOut: !!record.checkOut,
                              });
                              setShowManualModal(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Edit / Regularize"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Attendance Calendar Overview */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
          <HiOutlineCalendarDays className="w-5 h-5 text-indigo-600" />
          Monthly <span className="text-indigo-600">Calendar Overview</span>
        </h2>
        <AttendanceCalendar isAdmin={true} />
      </div>

      {/* Manual Check-in & Regularization Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Manual Punch & Regularize</h3>
                <p className="text-xs text-slate-400 font-bold">Admin override for employee attendance record</p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualRegularizeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Employee *
                </label>
                <select
                  required
                  value={manualForm.userId}
                  onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Employee</option>
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.jobRole || m.role}) — {m.employeeId || 'No ID'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="present">Present (Full Day)</option>
                    <option value="half-day">Half Day</option>
                    <option value="on-duty">On Duty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Check-In Time
                  </label>
                  <input
                    type="time"
                    value={manualForm.checkInTime}
                    onChange={(e) => setManualForm({ ...manualForm, checkInTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Check-Out Time
                  </label>
                  <input
                    type="time"
                    value={manualForm.checkOutTime}
                    onChange={(e) => setManualForm({ ...manualForm, checkOutTime: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Work Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={manualForm.workHours}
                    onChange={(e) => setManualForm({ ...manualForm, workHours: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Regularization Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Biometric punch missed"
                    value={manualForm.reason}
                    onChange={(e) => setManualForm({ ...manualForm, reason: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Check-Out Modal */}
      {showCheckoutModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Manual Shift Check-Out</h3>
                <p className="text-xs text-slate-400 font-bold">
                  {selectedRecord.userId?.name} ({selectedRecord.userId?.employeeId})
                </p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Check-Out Time *
                </label>
                <input
                  type="time"
                  required
                  value={checkoutForm.checkOutTime}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, checkOutTime: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Work Hours (hrs)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={checkoutForm.workHours}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, workHours: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={checkoutForm.status}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, status: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="present">Present (Full Day)</option>
                  <option value="half-day">Half Day</option>
                  <option value="on-duty">On Duty</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Note / Reason
                </label>
                <input
                  type="text"
                  value={checkoutForm.reason}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-200 cursor-pointer"
                >
                  Confirm Check-Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
