import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getMyAttendance } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineClock, 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineCalendarDays,
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import AttendanceCalendar from '@/components/AttendanceCalendar';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAttendance();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(loadAttendance, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadAttendance = async () => {
    try {
      const res = await getMyAttendance();
      setAttendance(res.data.attendance);
    } catch (err) {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendance.filter(record => {
    const dateStr = new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    return dateStr.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const downloadCSV = () => {
    const headers = ['Date', 'Check In', 'Check Out', 'Status', 'Duration'];
    const dataRows = filteredAttendance.map(record => {
      const checkIn = record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '--:--';
      const checkOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : (new Date(record.date).toDateString() === new Date().toDateString() ? 'In-Progress' : 'Missed');
      const status = record.checkOut ? 'COMPLETED' : (new Date(record.date).toDateString() === new Date().toDateString() ? 'ACTIVE' : 'MISSED CHECKOUT');
      
      let duration = '--';
      if (record.checkIn && record.checkOut) {
        const diff = new Date(record.checkOut) - new Date(record.checkIn);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${hours}h ${minutes}m`;
      }

      return [
        new Date(record.date).toLocaleDateString(),
        checkIn,
        checkOut,
        status,
        duration
      ];
    });

    const csvContent = [headers, ...dataRows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time_logs_${user?.name?.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Time logs exported as CSV');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '--:--';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <div className="text-center py-10 font-medium text-slate-500">Checking records...</div>;

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Time Logs & <span className="text-indigo-600">Leave Calendar</span></h1>
          <p className="text-slate-500 mt-1 font-medium italic italic tracking-wide">Sync your work and life balance perfectly</p>
        </div>
        
        <div className="flex items-center gap-3">
          <NavLink 
            to="/leaves"
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Apply Leave
          </NavLink>
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search date..."
              className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={downloadCSV}
            disabled={filteredAttendance.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <HiOutlineArrowDownTray className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="stat-card">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Days</p>
          <p className="text-3xl font-black text-slate-900">{attendance.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Completed Shift</p>
          <p className="text-3xl font-black text-emerald-600">{attendance.filter(a => a.checkIn && a.checkOut).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Now</p>
          <p className="text-3xl font-black text-amber-500">{attendance.filter(a => a.checkIn && !a.checkOut && new Date(a.date).toDateString() === new Date().toDateString()).length}</p>
        </div>
      </div>

      <div className="glass-card p-6 shadow-xl border-slate-200">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
          <HiOutlineCalendarDays className="w-5 h-5 text-indigo-600" />
          Attendance <span className="text-indigo-600">Calendar</span>
        </h2>
        <AttendanceCalendar isAdmin={false} userId={user?._id} />
      </div>

      <div className="glass-card overflow-hidden shadow-xl border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date & User</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Check In</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Check Out</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <HiOutlineCalendarDays className="w-16 h-16 mb-4 opacity-10" />
                      <p className="font-bold text-lg text-slate-500">No time logs found.</p>
                      <p className="text-sm">Try searching for a different date or clear your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-slate-100 shadow-sm transition-transform group-hover:scale-110">
                          {user?.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user?.name?.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none">{formatDate(record.date)}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{user?.jobRole || 'Staff'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        {formatTime(record.checkIn)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`flex items-center gap-2 font-black text-sm ${record.checkOut ? 'text-red-500' : 'text-slate-300 italic'}`}>
                        <HiOutlineClock className="w-4 h-4" />
                        {record.checkOut ? formatTime(record.checkOut) : (new Date(record.date).toDateString() === new Date().toDateString() ? 'In-Progress' : 'Missed')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {record.checkOut ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest border border-emerald-200">Completed</span>
                      ) : new Date(record.date).toDateString() === new Date().toDateString() ? (
                        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest border border-amber-200 animate-pulse">Active Now</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest border border-red-200">Missed Checkout</span>
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
