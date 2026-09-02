import { useState, useEffect } from 'react';
import { getAllLeaves, updateLeave, deleteLeave } from '@/services/api';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineCalendarDays, HiOutlineXMark, HiOutlineTrash } from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

const AdminLeaves = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadLeaves();
    }
  }, [user]);

  const loadLeaves = async () => {
    try {
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
      await updateLeave(id, { status });
      toast.success(`Leave ${status} successfully`);
      loadLeaves();
    } catch (err) {
      toast.error('Failed to update leave status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this leave request?')) {
      try {
        await deleteLeave(id);
        toast.success('Leave deleted successfully');
        loadLeaves();
      } catch (err) {
        toast.error('Failed to delete leave request');
      }
    }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
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

  if (loading) return <div className="text-center py-10 font-medium text-slate-500 italic">Processing applications...</div>;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Time <span className="text-indigo-600">Off Requests</span></h1>
          <p className="text-slate-500 mt-1">Approve or reject leave applications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaves.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
            <HiOutlineCalendarDays className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-bold text-lg">No leave applications found.</p>
          </div>
        ) : (
          leaves.map((leave) => (
            <div key={leave._id} className="glass-card shadow-xl flex flex-col justify-between hover:border-indigo-200 transition-all group relative">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 font-bold border border-slate-100 group-hover:scale-110 transition-transform overflow-hidden">
                    {leave.userId?.profilePicture ? (
                      <img src={leave.userId.profilePicture} alt={leave.userId.name} className="w-full h-full object-cover" />
                    ) : (
                      leave.userId?.name?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-base font-black text-slate-900 truncate tracking-tight uppercase tracking-widest leading-tight">{leave.userId?.name || 'Unknown'}</p>
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${
                          leave.userId?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {leave.userId?.role}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-widest ${
                          jobRoleColors[leave.userId?.jobRole] || jobRoleColors.Staff
                        }`}>
                          {leave.userId?.jobRole || 'Staff'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest leading-none">{leave.userId?.employeeId || 'ID Pending'}</p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none italic">
                        Applied: {new Date(leave.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span>From</span>
                    <span className="text-slate-900">{new Date(leave.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                    <span>To</span>
                    <span className="text-slate-900">{new Date(leave.endDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mb-2 block">Reason</label>
                  <p className="text-slate-600 text-sm italic font-medium line-clamp-3">"{leave.reason}"</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <span className={`status-badge text-[10px] ${statusColors[leave.status]}`}>
                    {leave.status === 'pending' && <HiOutlineClock className="w-3 h-3 inline mr-1" />}
                    {leave.status === 'approved' && <HiOutlineCheckCircle className="w-3 h-3 inline mr-1" />}
                    {leave.status === 'rejected' && <HiOutlineXMark className="w-3 h-3 inline mr-1" />}
                    {leave.status}
                  </span>

                  <div className="flex items-center gap-3">
                    {leave.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdate(leave._id, 'approved')}
                          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all hover:scale-110"
                          title="Approve"
                        >
                          <HiOutlineCheckCircle className="w-6 h-6" />
                        </button>
                        <button
                          onClick={() => handleUpdate(leave._id, 'rejected')}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all hover:scale-110"
                          title="Reject"
                        >
                          <HiOutlineXCircle className="w-6 h-6" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(leave._id)}
                      className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all hover:scale-110"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminLeaves;
