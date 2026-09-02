import React, { useState, useEffect } from 'react';
import { 
  HiOutlineChevronLeft, 
  HiOutlineChevronRight, 
  HiOutlineCalendarDays, 
  HiOutlinePlus,
  HiOutlineXMark
} from 'react-icons/hi2';
import { getAttendanceSummary, addHoliday } from '@/services/api';
import toast from 'react-hot-toast';

const AttendanceCalendar = ({ isAdmin, userId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [summaryData, setSummaryData] = useState({ attendance: [], leaves: [], members: [], holidays: [] });
  const [loading, setLoading] = useState(false);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ date: '', reason: '' });

  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchSummary();
  }, [currentDate, userId]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await getAttendanceSummary({ month, year, userId });
      setSummaryData(res.data);
    } catch (err) {
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    try {
      await addHoliday(holidayForm);
      toast.success('Office leave added');
      setShowHolidayModal(false);
      setHolidayForm({ date: '', reason: '' });
      fetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add office leave');
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDayData = (day) => {
    const dateStr = new Date(year, month, day).toDateString();
    
    const attendances = summaryData.attendance.filter(a => new Date(a.date).toDateString() === dateStr);
    const leaves = summaryData.leaves.filter(l => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      const current = new Date(year, month, day);
      return current >= new Date(start.setHours(0,0,0,0)) && current <= new Date(end.setHours(23,59,59,999));
    });
    let holiday = summaryData.holidays?.find(h => new Date(h.date).toDateString() === dateStr);
    
    // Default Sunday holiday
    if (!holiday && new Date(year, month, day).getDay() === 0) {
      holiday = { reason: 'Sunday', type: 'holiday', date: new Date(year, month, day) };
    }

    return { attendances, leaves, holiday };
  };

  const renderDay = (day) => {
    if (!day) return <div key={Math.random()} className="h-24 bg-slate-50/50 rounded-2xl"></div>;

    const { attendances, leaves, holiday } = getDayData(day);
    const presentCount = attendances.filter(a => a.status === 'present').length;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const cellDate = new Date(year, month, day);
    const isPastOrToday = cellDate <= today;
    
    const presentIds = new Set(attendances.map(a => a.userId?._id?.toString()));
    const leaveIds = new Set(leaves.map(l => l.userId?._id?.toString()));
    const absentCount = isPastOrToday && !holiday ? (summaryData.members?.filter(m => !presentIds.has(m._id) && !leaveIds.has(m._id)).length || 0) : 0;
    
    let userStatus = null;
    if (!isAdmin) {
      if (presentCount > 0) userStatus = 'present';
      else if (leaves.length > 0) {
        const leave = leaves[0];
        if (leave.status === 'approved') userStatus = 'approved-leave';
        else if (leave.status === 'pending') userStatus = 'request';
        else if (leave.status === 'rejected') userStatus = 'rejected-leave';
      } else if (isPastOrToday && !holiday) {
        userStatus = 'leave';
      }
    }

    return (
      <div 
        key={day} 
        onClick={() => isAdmin && setSelectedDateDetails({ day, attendances, leaves, absentCount, isPastOrToday, presentIds, leaveIds, holiday })}
        className={`h-24 p-2.5 border border-slate-100 rounded-2xl flex flex-col justify-between transition-all hover:border-indigo-200 cursor-pointer ${isAdmin ? 'hover:shadow-lg' : ''} bg-white relative overflow-hidden group`}
      >
        {holiday && (
          <div className="absolute inset-0 opacity-[0.08] pointer-events-none" 
               style={{ 
                 background: 'repeating-linear-gradient(45deg, #7c3aed, #7c3aed 10px, transparent 10px, transparent 20px)' 
               }} 
          />
        )}

        <span className={`text-sm font-black transition-all ${holiday ? 'text-indigo-600 line-through decoration-indigo-400 decoration-2' : 'text-slate-400'}`}>
          {day}
        </span>
        
        <div className="flex flex-col gap-1 z-10">
          {holiday ? (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-2 py-1 mt-auto">
              <p className="text-[9px] font-black text-indigo-700 uppercase leading-none truncate mb-0.5">{holiday.reason}</p>
              <p className="text-[7px] font-bold text-indigo-400 uppercase tracking-tighter italic">Office Leave</p>
            </div>
          ) : isAdmin ? (
            <>
              {presentCount > 0 && (
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                   <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">{presentCount} Present</span>
                </div>
              )}
              {absentCount > 0 && (
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                   <span className="text-[9px] font-black text-red-600 uppercase tracking-tighter">{absentCount} Absent</span>
                </div>
              )}
              {leaves.length > 0 && (
                <div className="flex items-center gap-1 mt-0.5 border-t border-slate-50 pt-0.5">
                   <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter italic">+{leaves.length} Request</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex justify-center">
              {userStatus === 'present' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase">Present</span>
              )}
              {userStatus === 'approved-leave' && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[8px] font-black uppercase tracking-tight">Green Leave</span>
              )}
              {userStatus === 'request' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[8px] font-black uppercase tracking-tighter">Request</span>
              )}
              {userStatus === 'leave' && (
                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[8px] font-black uppercase">Leave</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const days = [];
  const startDay = firstDayOfMonth(year, month);
  const totalDays = daysInMonth(year, month);

  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-5 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
          {monthNames[month]} <span className="text-indigo-600">{year}</span>
        </h2>
        <div className="flex items-center gap-4">
          {isAdmin && (
            <button 
              onClick={() => setShowHolidayModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Office Leave
            </button>
          )}
          <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl">
            <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <HiOutlineChevronLeft className="w-5 h-5 text-slate-400 hover:text-indigo-600" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <HiOutlineChevronRight className="w-5 h-5 text-slate-400 hover:text-indigo-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2.5">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-3">
            {d}
          </div>
        ))}
        {days.map(day => renderDay(day))}
      </div>

      {isAdmin && selectedDateDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md shadow-2xl transition-all">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 fade-in">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase">
                  Details for {selectedDateDetails.day} {monthNames[month]}
                </h3>
                {selectedDateDetails.holiday && (
                  <p className="text-indigo-600 text-xs font-bold uppercase mt-1 tracking-widest">Office Leave: {selectedDateDetails.holiday.reason}</p>
                )}
              </div>
              <button 
                onClick={() => setSelectedDateDetails(null)}
                className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all group"
              >
                <HiOutlineXMark className="w-6 h-6 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
            
            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Present Members</h4>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-xl uppercase tracking-wider">{selectedDateDetails.attendances.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDateDetails.attendances.length > 0 ? (
                    selectedDateDetails.attendances.map(a => (
                      <div key={a._id} className="flex items-center gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 transition-transform hover:scale-[1.02]">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-sm shadow-sm">
                          {a.userId?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none mb-1">{a.userId?.name || 'Unknown'}</p>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Check-in complete</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic font-medium p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 col-span-2 text-center">No reports for this shift</p>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Leave / Requests</h4>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-xl uppercase tracking-wider">{selectedDateDetails.leaves.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedDateDetails.leaves.length > 0 ? (
                    selectedDateDetails.leaves.map(l => (
                      <div key={l._id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-transform hover:scale-[1.02] ${
                        l.status === 'approved' ? 'bg-indigo-50/50 border-indigo-100' : 
                        l.status === 'pending' ? 'bg-amber-50/50 border-amber-100' : 'bg-red-50/50 border-red-100'
                      }`}>
                        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center font-black text-slate-700 text-sm shadow-sm border border-slate-100">
                          {l.userId?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-none mb-1">{l.userId?.name || 'Unknown'}</p>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${
                             l.status === 'approved' ? 'text-indigo-600' : 
                             l.status === 'pending' ? 'text-amber-600' : 'text-red-600'
                          }`}>{l.status === 'approved' ? 'Green Leave' : l.status === 'pending' ? 'Request' : 'Red Leave'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic font-medium p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 col-span-2 text-center">No leave filings detected</p>
                  )}
                </div>
              </section>

              {!selectedDateDetails.holiday && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Absent Members</h4>
                    <span className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black rounded-xl uppercase tracking-wider">{selectedDateDetails.absentCount}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedDateDetails.isPastOrToday && summaryData.members
                      ?.filter(m => !selectedDateDetails.presentIds.has(m._id) && !selectedDateDetails.leaveIds.has(m._id))
                      .map(m => (
                        <div key={m._id} className="flex items-center gap-3 p-4 bg-red-50/30 rounded-2xl border border-red-100 transition-transform hover:scale-[1.02]">
                          <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center font-black text-red-700 text-sm shadow-sm">
                            {m.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-none mb-1">{m.name}</p>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest italic">Missed Shift</p>
                          </div>
                        </div>
                      ))
                    }
                    {(!selectedDateDetails.isPastOrToday || selectedDateDetails.absentCount === 0) && (
                      <p className="text-xs text-slate-400 italic font-medium p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 col-span-2 text-center">Perfect attendance or future date</p>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {showHolidayModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-lg">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 scale-in shadow-indigo-500/10">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
              <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tight">Add Office Leave</h3>
              <button 
                onClick={() => setShowHolidayModal(false)}
                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddHoliday} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Date</label>
                <input 
                  type="date"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Reason / Label</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Tamil New Year"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-black text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={holidayForm.reason}
                  onChange={(e) => setHolidayForm({ ...holidayForm, reason: e.target.value })}
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:translate-y-[-2px] active:translate-y-[0px] transition-all uppercase tracking-[0.2em] text-xs"
              >
                Confirm Holiday
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
