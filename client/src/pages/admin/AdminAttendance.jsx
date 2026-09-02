import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { getAllAttendance, getAllOnDuty } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineClock, 
  HiOutlineUsers, 
  HiOutlineCalendarDays, 
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import AttendanceCalendar from '@/components/AttendanceCalendar';

const AdminAttendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [onDutyData, setOnDutyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadAttendance();
    }
  }, [filterDate, user]);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const [attRes, odRes] = await Promise.all([
        getAllAttendance({ date: filterDate }),
        getAllOnDuty({ date: filterDate, status: 'approved' })
      ]);
      setAttendance(attRes.data?.attendance || []);
      setOnDutyData(odRes.data?.onDutyRecords || []);
    } catch (err) {
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendance.filter(record => {
    const name = record.userId?.name || '';
    const empId = record.userId?.employeeId || '';
    return (name + empId).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const downloadCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Job Role', 'Check In', 'Check Out', 'Status'];
    const dataRows = filteredAttendance.map(record => [
      `"${record.userId?.name || 'Unknown'}"`,
      record.userId?.employeeId || '--',
      record.userId?.jobRole || 'Staff',
      record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '--:--',
      record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : (new Date(record.date).toDateString() === new Date().toDateString() ? 'Active' : 'Missed'),
      record.checkOut ? 'FINISHED' : (record.checkIn ? (new Date(record.date).toDateString() === new Date().toDateString() ? 'WORKING' : 'MISSED CHECKOUT') : 'ABSENT')
    ]);

    const csvContent = [headers, ...dataRows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${filterDate}.csv`);
    link.style.visibility = 'hidden';
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

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase tracking-tight">Time Logs & <span className="text-indigo-600">Leave Calendar</span></h1>
          <p className="text-slate-500 mt-1 font-medium italic">Full administrative oversight for all shifts and leaves</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <NavLink
            to="/admin/leaves"
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Manage Leaves
          </NavLink>
          {/* Search */}
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Filter by name/ID..."
              className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Target Date</span>
            <input
              type="date"
              className="bg-transparent border-none p-0 text-sm font-bold text-indigo-600 focus:outline-none cursor-pointer"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          {/* Export */}
          <button
            onClick={downloadCSV}
            disabled={filteredAttendance.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <HiOutlineArrowDownTray className="w-5 h-5" />
            Report
          </button>
        </div>
      </div>

      <div className="glass-card p-6 shadow-xl border-slate-200">
        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
          <HiOutlineCalendarDays className="w-5 h-5 text-indigo-600" />
          Monthly <span className="text-indigo-600">Overview</span>
        </h2>
        <AttendanceCalendar isAdmin={true} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Refreshing Logs...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="stat-card">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Members</p>
              <p className="text-3xl font-black text-slate-900">{attendance.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">In-Office</p>
              <p className="text-3xl font-black text-emerald-600">{attendance.filter(a => a.checkIn && !a.checkOut && new Date(a.date).toDateString() === new Date().toDateString()).length}</p>
            </div>
            <div className="stat-card">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Shift Over</p>
              <p className="text-3xl font-black text-indigo-600">{attendance.filter(a => a.checkOut).length}</p>
            </div>
          </div>

          <div className="glass-card overflow-hidden shadow-xl border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee Profile</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Check In</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Check Out</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">On Duty</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <HiOutlineClock className="w-16 h-16 mb-4 opacity-10" />
                          <p className="font-bold text-lg text-slate-500">No active records for this search.</p>
                          <p className="text-sm">Try Adjusting your filters or target date.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((record) => (
                      <tr key={record._id} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-6 py-5 font-bold">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-indigo-600 font-bold group-hover:scale-105 transition-transform overflow-hidden border border-slate-100">
                              {record.userId?.profilePicture ? (
                                <img src={record.userId.profilePicture} alt={record.userId.name} className="w-full h-full object-cover" />
                              ) : (
                                record.userId?.name?.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="text-sm font-black text-slate-900 tracking-tight">{record.userId?.name || 'Unknown'}</p>
                                <span className={`px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-widest ${
                                  jobRoleColors[record.userId?.jobRole] || jobRoleColors.Staff
                                }`}>
                                  {record.userId?.jobRole || 'Staff'}
                                </span>
                              </div>
                              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">{record.userId?.employeeId || 'ID NOT SET'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center font-black text-emerald-600 text-sm tracking-tight">{formatTime(record.checkIn)}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`text-sm font-black tracking-tight ${record.checkOut ? 'text-rose-500' : 'text-slate-400'}`}>
                            {record.checkOut ? formatTime(record.checkOut) : (new Date(record.date).toDateString() === new Date().toDateString() ? '--:--' : 'Missed')}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {(() => {
                            const od = onDutyData.find(o => o.userId?._id === record.userId?._id);
                            if (od) {
                              return (
                                <div className="space-y-1">
                                  <p className="text-[9px] font-black text-indigo-600 uppercase tracking-tight italic line-clamp-1">"{od.reason}"</p>
                                  {od.expenses?.title && (
                                    <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">
                                      {od.expenses.title}: ₹{od.expenses.price}
                                    </p>
                                  )}
                                </div>
                              );
                            }
                            return <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">--</span>;
                          })()}
                        </td>
                        <td className="px-6 py-5">
                          {record.checkOut ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Dismissed</span>
                          ) : record.checkIn ? (
                            new Date(record.date).toDateString() === new Date().toDateString() ? (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100">On-Shift</span>
                              </div>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-100">Missed Checkout</span>
                            )
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border border-slate-100">Absent</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAttendance;
