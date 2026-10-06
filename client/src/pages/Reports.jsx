import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMusterRollReport, getSummaryOverviewReport } from '../services/api';
import {
  HiOutlineDocumentChartBar,
  HiOutlineArrowDownTray,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
  HiOutlineBanknotes,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const Reports = () => {
  const { user } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [musterRoll, setMusterRoll] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [musterRes, overviewRes] = await Promise.all([
        getMusterRollReport({ month: selectedMonth, year: selectedYear }),
        getSummaryOverviewReport(),
      ]);
      setMusterRoll(musterRes.data);
      setOverview(overviewRes.data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [selectedMonth, selectedYear]);

  const exportCSV = () => {
    if (!musterRoll?.report || musterRoll.report.length === 0) {
      toast.error('No muster roll data to export');
      return;
    }

    const totalDays = musterRoll.totalDaysInMonth;
    const dayHeaders = Array.from({ length: totalDays }, (_, i) => `Day ${i + 1}`).join(',');
    const header = `Employee Name,Employee ID,Department,Job Role,Present Days,Half Days,Total Hours,${dayHeaders}\n`;

    const rows = musterRoll.report.map((emp) => {
      const dailyVals = [];
      for (let d = 1; d <= totalDays; d++) {
        const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        dailyVals.push(emp.dailyMatrix[dateKey] || '-');
      }
      return `"${emp.name}","${emp.employeeId}","${emp.department}","${emp.jobRole}",${emp.presentDays},${emp.halfDays},${emp.totalWorkHours},${dailyVals.join(',')}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Muster_Roll_${months[selectedMonth]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Muster Roll exported as CSV');
  };

  const getDayBadge = (code) => {
    switch (code) {
      case 'P':
        return 'bg-emerald-500 text-white';
      case 'HD':
        return 'bg-amber-400 text-slate-900';
      case 'L':
      case 'HD-L':
        return 'bg-indigo-500 text-white';
      case 'WO':
        return 'bg-slate-200 text-slate-600 font-bold';
      case 'A':
        return 'bg-rose-500 text-white';
      default:
        return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Executive HR Analytics & Muster Roll
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Muster Roll & Workforce Analytics</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Official monthly attendance matrix, work hour summaries, and department metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchReportsData}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all"
            title="Refresh"
          >
            <HiOutlineArrowPath className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
          >
            <HiOutlineArrowDownTray className="w-4 h-4" />
            Export Muster Roll CSV
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Staff</p>
            <h4 className="text-xl font-black text-slate-900 mt-1">{overview.totalEmployees}</h4>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Present Today</p>
            <h4 className="text-xl font-black text-emerald-600 mt-1">{overview.presentToday}</h4>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absent Today</p>
            <h4 className="text-xl font-black text-rose-600 mt-1">{overview.absentToday}</h4>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Leaves</p>
            <h4 className="text-xl font-black text-amber-600 mt-1">{overview.pendingLeaves}</h4>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tasks</p>
            <h4 className="text-xl font-black text-indigo-600 mt-1">{overview.activeTasks}</h4>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Month Claims</p>
            <h4 className="text-xl font-black text-slate-900 mt-1">₹{overview.totalReimbursementMonth?.toLocaleString('en-IN')}</h4>
          </div>
        </div>
      )}

      {/* Month & Year Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <HiOutlineCalendarDays className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-700">Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {months.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-wider">
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> P = Present</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> HD = Half Day</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> L = Leave</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300"></span> WO = Week Off</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> A = Absent</span>
        </div>
      </div>

      {/* Muster Roll Table Matrix */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generating Monthly Muster Matrix...</p>
          </div>
        ) : !musterRoll?.report || musterRoll.report.length === 0 ? (
          <div className="py-20 text-center p-8">
            <HiOutlineDocumentChartBar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">No Employees Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add staff members to start tracking automatic attendance muster roll logs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-500 sticky top-0">
                  <th className="py-4 px-4 sticky left-0 bg-slate-50 z-20 shadow-xs min-w-[160px]">Employee</th>
                  <th className="py-4 px-3 text-center min-w-[60px]">Present</th>
                  <th className="py-4 px-3 text-center min-w-[60px]">Half Day</th>
                  <th className="py-4 px-3 text-center min-w-[60px]">Hours</th>
                  {Array.from({ length: musterRoll.totalDaysInMonth }, (_, i) => (
                    <th key={i + 1} className="py-4 px-1.5 text-center font-mono min-w-[32px]">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {musterRoll.report.map((emp) => (
                  <tr key={emp.userId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold sticky left-0 bg-white z-10 shadow-xs border-r border-slate-100">
                      <p className="text-xs font-black text-slate-900 truncate">{emp.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{emp.jobRole} • {emp.employeeId}</p>
                    </td>

                    <td className="py-3 px-3 text-center font-black text-emerald-600 bg-emerald-50/30">
                      {emp.presentDays}
                    </td>

                    <td className="py-3 px-3 text-center font-black text-amber-600 bg-amber-50/30">
                      {emp.halfDays}
                    </td>

                    <td className="py-3 px-3 text-center font-black text-indigo-600 bg-indigo-50/30">
                      {emp.totalWorkHours}h
                    </td>

                    {Array.from({ length: musterRoll.totalDaysInMonth }, (_, i) => {
                      const day = i + 1;
                      const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const code = emp.dailyMatrix[dateKey] || '-';
                      return (
                        <td key={day} className="py-3 px-1 text-center font-mono">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[10px] font-black ${getDayBadge(code)}`}>
                            {code}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
