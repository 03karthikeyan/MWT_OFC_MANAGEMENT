import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHolidays, addHoliday, deleteHoliday } from '../services/api';
import {
  HiOutlineCalendarDays,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineFire,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const Holidays = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ date: '', reason: '' });

  const fetchHolidayList = async () => {
    try {
      setLoading(true);
      const res = await getHolidays();
      setHolidays(res.data.holidays || []);
    } catch (err) {
      console.error('Failed to load holidays:', err);
      toast.error('Failed to load holidays schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidayList();
  }, []);

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.date || !newHoliday.reason) {
      toast.error('Date and reason are required');
      return;
    }
    try {
      const res = await addHoliday(newHoliday);
      toast.success('Holiday added to schedule');
      setHolidays((prev) => [...prev, res.data.holiday].sort((a, b) => new Date(a.date) - new Date(b.date)));
      setShowAddModal(false);
      setNewHoliday({ date: '', reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add holiday');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scheduled holiday?')) return;
    try {
      await deleteHoliday(id);
      toast.success('Holiday deleted');
      setHolidays((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      toast.error('Failed to delete holiday');
    }
  };

  const now = new Date();
  const upcomingHolidays = holidays.filter((h) => new Date(h.date) >= new Date(now.setHours(0, 0, 0, 0)));
  const nextHoliday = upcomingHolidays[0];

  const getDaysUntil = (dateStr) => {
    const diff = new Date(dateStr) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today!';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Official Calendar & Celebrations
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Company Holidays & Festivals</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Stay updated with upcoming public holidays, regional celebrations, and office closures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHolidayList}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all"
            title="Refresh"
          >
            <HiOutlineArrowPath className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* Next Holiday Hero Banner */}
      {nextHoliday && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-400 border border-white/15 shadow-inner">
              <HiOutlineFire className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">
                Next Upcoming Holiday
              </span>
              <h2 className="text-xl md:text-2xl font-black mt-0.5">{nextHoliday.reason}</h2>
              <p className="text-xs text-indigo-200 font-medium mt-0.5">
                {new Date(nextHoliday.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
            <span className="text-xs font-black text-amber-300 uppercase tracking-widest block">
              {getDaysUntil(nextHoliday.date)}
            </span>
          </div>
        </div>
      )}

      {/* Holidays Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 mb-4">
          Full Year Schedule ({holidays.length} Days)
        </h3>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Calendar...</p>
          </div>
        ) : holidays.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <HiOutlineCalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold">No holidays scheduled for this period.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays.map((h) => {
              const hDate = new Date(h.date);
              const isPast = hDate < new Date().setHours(0, 0, 0, 0);
              return (
                <div
                  key={h._id}
                  className={`p-5 rounded-3xl border transition-all flex items-center justify-between ${
                    isPast
                      ? 'bg-slate-50/70 border-slate-200/60 opacity-60'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black flex flex-col items-center justify-center border border-indigo-100">
                      <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 leading-none">
                        {hDate.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-base font-black leading-none mt-0.5">{hDate.getDate()}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-tight">{h.reason}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {hDate.toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(h._id)}
                      className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Add Company Holiday</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddHoliday} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Holiday / Occasion *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diwali / New Year / Independence Day"
                  value={newHoliday.reason}
                  onChange={(e) => setNewHoliday({ ...newHoliday, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Holiday Date *
                </label>
                <input
                  type="date"
                  required
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays;
