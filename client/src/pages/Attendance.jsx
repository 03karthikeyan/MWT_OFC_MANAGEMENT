import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getMyAttendance, checkIn, checkOut, getTodayAttendance } from '@/services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineCalendarDays,
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineMapPin,
  HiOutlinePlay,
  HiOutlineStop,
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineHome,
  HiOutlineBriefcase,
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import AttendanceCalendar from '@/components/AttendanceCalendar';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [workMode, setWorkMode] = useState('office');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadAttendance();
    const interval = setInterval(loadAttendance, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const [allRes, todayRes] = await Promise.all([
        getMyAttendance(),
        getTodayAttendance(),
      ]);
      setAttendance(allRes.data.attendance || []);
      setTodayRecord(todayRes.data.attendance || null);
    } catch (err) {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const handlePunchCheckIn = async () => {
    try {
      setPunchLoading(true);
      let latitude, longitude;
      if (navigator.geolocation) {
        try {
          const pos = await new Promise((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
          );
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        } catch (_) {}
      }

      const res = await checkIn({ latitude, longitude, address: `Work Mode: ${workMode}` });
      toast.success('Check-in punched successfully! Have a great day.');
      setTodayRecord(res.data.attendance);
      loadAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const handlePunchCheckOut = async () => {
    if (!window.confirm('Are you ready to clock out for today?')) return;
    try {
      setPunchLoading(true);
      const res = await checkOut();
      toast.success('Check-out punched successfully! Shift ended.');
      setTodayRecord(res.data.attendance);
      loadAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const filteredAttendance = attendance.filter((record) => {
    const dateStr = new Date(record.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return dateStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const downloadCSV = () => {
    const headers = ['Date', 'Check In', 'Check Out', 'Work Hours', 'Status'];
    const dataRows = filteredAttendance.map((record) => {
      const checkIn = record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '--:--';
      const checkOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'In-Progress';
      const status = record.checkOut ? 'COMPLETED' : (record.checkIn ? 'ACTIVE' : 'MISSED');
      return [
        new Date(record.date).toLocaleDateString(),
        checkIn,
        checkOut,
        record.workHours || (record.checkOut ? '8' : '--'),
        status,
      ];
    });

    const csvContent = [headers, ...dataRows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `attendance_logs_${user?.name?.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance logs exported');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isCheckedIn = !!todayRecord?.checkIn;
  const isCheckedOut = !!todayRecord?.checkOut;

  // Calculate elapsed time if checked in
  const getElapsedTime = () => {
    if (!todayRecord?.checkIn) return '00:00:00';
    const end = todayRecord.checkOut ? new Date(todayRecord.checkOut) : currentTime;
    const diff = Math.max(0, end - new Date(todayRecord.checkIn));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Daily Time Card & Schedule
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            My Attendance & Shift Portal
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
            Punch check-in / check-out, track active working hours, and review time logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NavLink
            to="/leaves"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Apply Leave
          </NavLink>
        </div>
      </div>

      {/* Hero Attendance Punch Box */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-2xl border border-indigo-900/40 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex-1 space-y-4 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Live Biometric System
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight font-mono">
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </h2>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Work Mode Picker */}
          {!isCheckedIn && (
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mode:</span>
              {[
                { id: 'office', label: 'Office', icon: HiOutlineBuildingOffice2 },
                { id: 'wfh', label: 'WFH', icon: HiOutlineHome },
                { id: 'onduty', label: 'On-Duty', icon: HiOutlineBriefcase },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setWorkMode(m.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    workMode === m.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              ))}
            </div>
          )}

          {isCheckedIn && (
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                  Check-In Time
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {formatTime(todayRecord.checkIn)}
                </span>
              </div>

              <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                  Shift Duration
                </span>
                <span className="text-sm font-black text-indigo-300 font-mono">
                  {getElapsedTime()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Big Punch Action Button */}
        <div className="flex flex-col items-center justify-center z-10">
          {!isCheckedIn ? (
            <button
              onClick={handlePunchCheckIn}
              disabled={punchLoading}
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <HiOutlinePlay className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span>Punch In</span>
            </button>
          ) : !isCheckedOut ? (
            <button
              onClick={handlePunchCheckOut}
              disabled={punchLoading}
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-black text-xs uppercase tracking-widest flex flex-col items-center justify-center gap-2 shadow-[0_0_40px_rgba(244,63,94,0.4)] hover:shadow-[0_0_60px_rgba(244,63,94,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <HiOutlineStop className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span>Punch Out</span>
            </button>
          ) : (
            <div className="w-36 h-36 rounded-full bg-white/10 border border-white/20 text-white font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-1.5 shadow-inner">
              <HiOutlineCheckCircle className="w-8 h-8 text-emerald-400" />
              <span>Shift Ended</span>
              <span className="text-emerald-400 font-mono text-xs">{todayRecord.workHours || 8}h logged</span>
            </div>
          )}
        </div>

        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Days Logged</p>
          <p className="text-3xl font-black text-slate-900">{attendance.length} Days</p>
        </div>
        <div className="stat-card">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Completed Shifts</p>
          <p className="text-3xl font-black text-emerald-600">
            {attendance.filter((a) => a.checkIn && a.checkOut).length} Days
          </p>
        </div>
        <div className="stat-card">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Current Shift Status</p>
          <p className={`text-xl font-black ${isCheckedIn && !isCheckedOut ? 'text-emerald-600 animate-pulse' : isCheckedOut ? 'text-blue-600' : 'text-slate-400'}`}>
            {isCheckedIn && !isCheckedOut ? '🟢 Active On-Shift' : isCheckedOut ? '🏁 Shift Completed' : '⚪ Not Checked In'}
          </p>
        </div>
      </div>

      {/* Attendance Calendar */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
          <HiOutlineCalendarDays className="w-5 h-5 text-indigo-600" />
          Monthly <span className="text-indigo-600">Attendance Calendar</span>
        </h2>
        <AttendanceCalendar isAdmin={false} userId={user?._id} />
      </div>

      {/* Search and History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-base font-black text-slate-900">Attendance History Logs</h3>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by date..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={downloadCSV}
              disabled={filteredAttendance.length === 0}
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 transition-all disabled:opacity-50"
            >
              <HiOutlineArrowDownTray className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs font-medium text-slate-700">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-center">Check In</th>
                <th className="py-4 px-6 text-center">Check Out</th>
                <th className="py-4 px-6 text-center">Hours</th>
                <th className="py-4 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-slate-400 font-bold">
                    No attendance logs found.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="py-4 px-6 text-center font-black text-emerald-600">
                      {formatTime(record.checkIn)}
                    </td>
                    <td className="py-4 px-6 text-center font-black text-slate-600">
                      {record.checkOut ? formatTime(record.checkOut) : '--:--'}
                    </td>
                    <td className="py-4 px-6 text-center font-black text-slate-800">
                      {record.workHours ? `${record.workHours}h` : (record.checkOut ? '8h' : '--')}
                    </td>
                    <td className="py-4 px-6">
                      {record.checkOut ? (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
                          Shift Ended
                        </span>
                      ) : record.checkIn ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200 animate-pulse">
                          In Office
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                          Absent
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
