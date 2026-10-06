import { useState, useEffect } from 'react';
import { getAllLeaves, updateLeave, deleteLeave } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineClock, 
  HiOutlineCalendarDays, 
  HiOutlineXMark, 
  HiOutlineTrash,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineCheck,
  HiOutlineChatBubbleBottomCenterText
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

const AdminLeaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    if (user) {
      loadLeaves();
    }
  }, [user]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const res = await getAllLeaves();
      setLeaves(res.data?.leaves || []);
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, status) => {
    try {
      await updateLeave(id, { status, adminNotes: reviewNote });
      toast.success(`Leave request marked as ${status}`);
      setReviewModalOpen(false);
      setSelectedLeave(null);
      setReviewNote('');
      loadLeaves();
    } catch (err) {
      toast.error('Failed to update leave status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this leave application?')) {
      try {
        await deleteLeave(id);
        toast.success('Leave deleted successfully');
        loadLeaves();
      } catch (err) {
        toast.error('Failed to delete leave request');
      }
    }
  };

  const getDayCount = (start, end) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const statusColors = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200',
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

  const filteredLeaves = leaves.filter((l) => {
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
    const searchStr = `${l.userId?.name || ''} ${l.userId?.employeeId || ''} ${l.reason || ''} ${l.leaveType || ''}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = leaves.filter((l) => l.status === 'pending').length;
  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;

  return (
    <div className="space-y-6 fade-in pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Leave <span className="text-indigo-600">Governance</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Review, authorize, and audit employee time-off and sabbatical applications.
          </p>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilterStatus('all')}
          className={`stat-card cursor-pointer transition-all ${filterStatus === 'all' ? 'ring-2 ring-indigo-500 shadow-md' : ''}`}
        >
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Applications</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{leaves.length}</p>
        </div>
        <div 
          onClick={() => setFilterStatus('pending')}
          className={`stat-card cursor-pointer transition-all ${filterStatus === 'pending' ? 'ring-2 ring-amber-500 shadow-md' : ''}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</p>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
        </div>
        <div 
          onClick={() => setFilterStatus('approved')}
          className={`stat-card cursor-pointer transition-all ${filterStatus === 'approved' ? 'ring-2 ring-emerald-500 shadow-md' : ''}`}
        >
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</p>
        </div>
        <div 
          onClick={() => setFilterStatus('rejected')}
          className={`stat-card cursor-pointer transition-all ${filterStatus === 'rejected' ? 'ring-2 ring-rose-500 shadow-md' : ''}`}
        >
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Rejected</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto overflow-x-auto">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Leaves' : st}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applicant, reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* Grid of Leave Applications */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
          Loading leave applications...
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="hrms-card p-16 text-center text-slate-400">
          <HiOutlineCalendarDays className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="font-bold text-base text-slate-600">No leave requests found</p>
          <p className="text-xs text-slate-400 mt-1">There are no leave requests matching the active filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaves.map((leave) => {
            const days = getDayCount(leave.startDate, leave.endDate);
            return (
              <div 
                key={leave._id} 
                className="hrms-card flex flex-col justify-between hover:border-indigo-200 hover:shadow-lg transition-all group"
              >
                <div className="p-6">
                  {/* Member Header */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-base flex items-center justify-center border border-indigo-100 overflow-hidden shadow-inner shrink-0">
                        {leave.userId?.profilePicture ? (
                          <img src={leave.userId.profilePicture} alt={leave.userId.name} className="w-full h-full object-cover" />
                        ) : (
                          leave.userId?.name?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-snug">
                          {leave.userId?.name || 'Unknown Employee'}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${jobRoleColors[leave.userId?.jobRole] || jobRoleColors.Staff}`}>
                            {leave.userId?.jobRole || 'Staff'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {leave.userId?.employeeId || 'ID Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${statusColors[leave.status] || 'bg-slate-50 text-slate-600'}`}>
                      {leave.status}
                    </span>
                  </div>

                  {/* Dates & Duration Banner */}
                  <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100/80 mb-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Duration</span>
                      <span className="font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full text-[11px]">
                        {days} {days === 1 ? 'Day' : 'Days'} ({leave.leaveType || 'General'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-700 pt-1 border-t border-slate-200/50">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold">From</p>
                        <p className="font-bold">{new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className="text-right">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">To</p>
                        <p className="font-bold">{new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">Reason for Absence</p>
                    <p className="text-xs text-slate-700 italic font-medium leading-relaxed bg-white p-3 rounded-xl border border-slate-100 line-clamp-3">
                      "{leave.reason}"
                    </p>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 px-6 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Applied {new Date(leave.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-2">
                    {leave.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedLeave(leave);
                            setReviewModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <HiOutlineCheck className="w-3.5 h-3.5" />
                          Review
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedLeave(leave);
                          setReviewModalOpen(true);
                        }}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold transition-all"
                      >
                        Change Status
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(leave._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete Application"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review & Decision Modal */}
      {reviewModalOpen && selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setReviewModalOpen(false);
                setSelectedLeave(null);
              }}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                <HiOutlineCalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Leave Decision</h3>
                <p className="text-xs text-slate-500">Applicant: {selectedLeave.userId?.name}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Leave Period:</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold uppercase">Total Days:</span>
                <span className="font-bold text-indigo-600">
                  {getDayCount(selectedLeave.startDate, selectedLeave.endDate)} Days
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-slate-400 font-bold uppercase block mb-1">Reason:</span>
                <p className="italic text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/60">
                  "{selectedLeave.reason}"
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Admin Note / Remarks (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Approved as per project deadline alignment"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                className="input-field text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleUpdate(selectedLeave._id, 'approved')}
                className="py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <HiOutlineCheckCircle className="w-4 h-4" />
                Approve Leave
              </button>
              <button
                onClick={() => handleUpdate(selectedLeave._id, 'rejected')}
                className="py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <HiOutlineXCircle className="w-4 h-4" />
                Reject Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaves;
