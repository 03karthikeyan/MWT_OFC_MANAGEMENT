import { useState, useEffect } from 'react';
import { getAllOnDuty, updateOnDuty, deleteOnDuty } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineCheckCircle, 
  HiOutlineXCircle, 
  HiOutlineClock, 
  HiOutlineCalendarDays, 
  HiOutlineTrash,
  HiOutlineBanknotes,
  HiOutlineChatBubbleBottomCenterText
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

const AdminOnDuty = () => {
  const { user } = useAuth();
  const [onDutyRecords, setOnDutyRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOnDutyRecords();
    }
  }, [user]);

  const loadOnDutyRecords = async () => {
    try {
      const res = await getAllOnDuty();
      setOnDutyRecords(res.data?.onDutyRecords || []);
    } catch (err) {
      toast.error('Failed to load on duty records');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id, status) => {
    try {
      await updateOnDuty(id, { status });
      toast.success(`On Duty ${status} successfully`);
      loadOnDutyRecords();
    } catch (err) {
      toast.error('Failed to update on duty status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this on duty record?')) {
      try {
        await deleteOnDuty(id);
        toast.success('On Duty record deleted successfully');
        loadOnDutyRecords();
      } catch (err) {
        toast.error('Failed to delete on duty record');
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

  if (loading) return <div className="text-center py-10 font-medium text-slate-500 italic">Loading on duty updates...</div>;

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">On Duty <span className="text-indigo-600">Register</span></h1>
          <p className="text-slate-500 mt-1 font-medium italic">Track and manage external work assignments</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden shadow-xl border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee Profile</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Date</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reason</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Expenses</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {onDutyRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <HiOutlineCalendarDays className="w-16 h-16 mb-4 opacity-10" />
                      <p className="font-bold text-lg text-slate-500">No On Duty records found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                onDutyRecords.map((record) => (
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
                          <p className="text-sm font-black text-slate-900 tracking-tight">{record.userId?.name || 'Unknown'}</p>
                          <span className={`px-1.5 py-0.5 rounded border text-[7px] font-black uppercase tracking-widest ${
                            jobRoleColors[record.userId?.jobRole] || jobRoleColors.Staff
                          }`}>
                            {record.userId?.jobRole || 'Staff'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center text-sm font-bold text-slate-600">
                      {new Date(record.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="max-w-xs">
                        <p className="text-sm text-slate-600 font-medium line-clamp-2 italic">"{record.reason}"</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {record.expenses?.title ? (
                         <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                               <HiOutlineBanknotes className="w-3 h-3 text-emerald-600" />
                               <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{record.expenses.title}</span>
                            </div>
                            <p className="text-xs font-black text-emerald-600">₹{record.expenses.price.toLocaleString()}</p>
                         </div>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Expenses</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusColors[record.status]}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdate(record._id, 'approved')}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                              title="Approve"
                            >
                              <HiOutlineCheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleUpdate(record._id, 'rejected')}
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                              title="Reject"
                            >
                              <HiOutlineXCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(record._id)}
                          className="p-2 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </div>
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

export default AdminOnDuty;
