import { useState, useEffect } from 'react';
import { getAllWork } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineMagnifyingGlass, 
  HiOutlineClipboardDocumentList, 
  HiOutlineArrowDownTray, 
  HiOutlineXMark 
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

const AdminWorkUpdates = () => {
  const { user } = useAuth();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWork, setSelectedWork] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (user) {
      loadWorks();
    }
  }, [user]); // We keep filterDate out of dep array if we want client-side search across all loaded work OR we can keep it for server-side once supported.

  const loadWorks = async () => {
    try {
      setLoading(true);
      const res = await getAllWork();
      setWorks(res.data?.workUpdates || []);
    } catch (err) {
      toast.error('Failed to load work journal');
    } finally {
      setLoading(false);
    }
  };

  const filteredWorks = works.filter(w => {
    const name = w.userId?.name || '';
    const title = w.title || '';
    const matchesSearch = (name + title).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = new Date(w.date).toISOString().split('T')[0] === filterDate;
    return matchesSearch && matchesDate;
  });

  const downloadCSV = () => {
    const headers = ['Employee Name', 'Employee ID', 'Date', 'Project/Client', 'Task Title', 'Status', 'Description'];
    const dataRows = filteredWorks.map(w => [
      `"${w.userId?.name || 'Unknown'}"`,
      w.userId?.employeeId || '--',
      new Date(w.date).toLocaleDateString(),
      `"${w.projectId?.name || 'Personal'} (${w.projectId?.clientName || 'N/A'})"`,
      `"${w.title.replace(/"/g, '""')}"`,
      w.status.toUpperCase(),
      `"${(w.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers, ...dataRows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `team_work_report_${filterDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Work report exported as CSV');
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
    return (
      <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest mt-1 inline-block ${wDate < cDate ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
        {wDate < cDate ? 'Late' : 'Early'}
      </span>
    );
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Team <span className="text-indigo-600">Journal</span></h1>
          <p className="text-slate-500 mt-1 font-medium italic">Consolidated output monitor for all departments</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search member or task..."
              className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Archive Date</span>
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
            disabled={filteredWorks.length === 0}
            className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            <HiOutlineArrowDownTray className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Aggregating Content...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorks.length === 0 ? (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 bg-slate-50/50">
              <HiOutlineClipboardDocumentList className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="font-bold text-lg text-slate-500 italic">No matching reports found.</p>
              <p className="text-sm">Adjust your search or check a different archive date.</p>
            </div>
          ) : (
            filteredWorks.map((work) => (
              <div 
                key={work._id} 
                onClick={() => setSelectedWork(work)}
                className="glass-card flex flex-col justify-between hover:border-indigo-200 hover:shadow-indigo-50/50 transition-all group cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center text-indigo-600 font-bold border border-slate-100 group-hover:scale-105 transition-transform overflow-hidden">
                      {work.userId?.profilePicture ? (
                        <img src={work.userId.profilePicture} alt={work.userId.name} className="w-full h-full object-cover" />
                      ) : (
                        work.userId?.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-black text-slate-900 truncate tracking-tight uppercase tracking-widest">{work.userId?.name || 'Unknown'}</p>
                        <span className={`px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-widest ${
                          jobRoleColors[work.userId?.jobRole] || jobRoleColors.Staff
                        }`}>
                          {work.userId?.jobRole || 'Staff'}
                        </span>
                      </div>
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest leading-none mt-1">{work.userId?.employeeId || 'ID NOT SET'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`status-badge text-[10px] font-bold uppercase tracking-widest border ${statusColors[work.status]}`}>
                      {work.status}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{new Date(work.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</span>
                      {getTimingBadge(work.date, work.createdAt)}
                    </div>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-2 truncate uppercase tracking-wider group-hover:text-indigo-600 transition-colors">{work.title}</h3>
                  {work.projectId && (
                    <div className="mb-4 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg inline-flex items-center gap-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Project:</span>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tight">{work.projectId.name || 'Personal'}</span>
                    </div>
                  )}
                  <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed italic font-medium">{work.description || 'No detailed log shared for this session.'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Work Detail Modal */}
      {selectedWork && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-10 shadow-2xl relative border border-slate-200 fade-in">
            <button
              onClick={() => setSelectedWork(null)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            
            <div className="mb-8">
              <span className={`status-badge mb-4 border ${statusColors[selectedWork.status]}`}>
                {selectedWork.status}
              </span>
              <h2 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tight">{selectedWork.title}</h2>
              {selectedWork.projectId && (
                <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Project:</span>
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-tight bg-indigo-50 px-2 py-0.5 rounded-md">{selectedWork.projectId.name} ({selectedWork.projectId.clientName || 'Private'})</span>
                </div>
              )}
              <div className="flex items-center gap-3 mt-3">
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{new Date(selectedWork.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {getTimingBadge(selectedWork.date, selectedWork.createdAt)}
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 mb-10">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Official Log Entry</h4>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap italic font-medium">
                {selectedWork.description || 'No detailed log provided for this task.'}
              </p>
            </div>

            <div className="pt-8 border-t border-slate-100 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-slate-100">
                {selectedWork.userId?.profilePicture ? (
                  <img src={selectedWork.userId.profilePicture} alt={selectedWork.userId.name} className="w-full h-full object-cover" />
                ) : (
                  selectedWork.userId?.name?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">{selectedWork.userId?.name || 'Unknown User'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                    jobRoleColors[selectedWork.userId?.jobRole] || jobRoleColors.Staff
                  }`}>
                    {selectedWork.userId?.jobRole || 'Staff'}
                  </span>
                  <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest leading-none">{selectedWork.userId?.employeeId || 'ID NOT SET'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkUpdates;
