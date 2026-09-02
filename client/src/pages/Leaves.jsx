import { useState, useEffect } from 'react';
import { applyLeave, getMyLeaves } from '@/services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineXMark, HiOutlineCalendarDays, HiOutlineCheckCircle, HiOutlineClock } from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

const Leaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    reason: `Requested at: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - `,
  });

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const res = await getMyLeaves();
      setLeaves(res.data.leaves);
    } catch (err) {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await applyLeave(formData);
      toast.success('Leave application submitted!');
      setShowModal(false);
      setFormData({ 
        startDate: new Date().toISOString().slice(0, 16), 
        endDate: '', 
        reason: `Requested at: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ` 
      });
      loadLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed');
    }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 font-bold',
    approved: 'bg-emerald-100 text-emerald-700 font-bold',
    rejected: 'bg-red-100 text-red-700 font-bold',
  };

  if (loading) return <div className="text-center py-10 font-medium text-slate-500 italic">Reading your calendar...</div>;

  return (
    <div className="space-y-6 px-2 md:px-0 relative min-h-screen">
      <div className="fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Time <span className="text-indigo-600">Off</span></h1>
            <p className="text-slate-500 mt-1">Balance is non-negotiable</p>
          </div>
          <button
            onClick={() => {
              setFormData({ 
                startDate: new Date().toISOString().slice(0, 16), 
                endDate: '', 
                reason: `Requested at: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ` 
              });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Apply for Leave
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="stat-card">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 text-center">Approved</p>
            <p className="text-3xl font-black text-center text-emerald-600">{leaves.filter(l => l.status === 'approved').length}</p>
          </div>
          <div className="stat-card">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 text-center">Pending</p>
            <p className="text-3xl font-black text-center text-amber-500">{leaves.filter(l => l.status === 'pending').length}</p>
          </div>
          <div className="stat-card">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1 text-center">Rejected</p>
            <p className="text-3xl font-black text-center text-red-500">{leaves.filter(l => l.status === 'rejected').length}</p>
          </div>
        </div>

        <div className="glass-card overflow-hidden shadow-xl mb-10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-slate-400">
                    <HiOutlineCalendarDays className="w-10 h-10 mb-2 opacity-20 inline-block" />
                    <p className="font-bold">No leave applications found.</p>
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-slate-100 shadow-sm">
                          {user?.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user?.name?.charAt(0)
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-tight">
                          <span>{new Date(leave.startDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          <span className="text-slate-300">→</span>
                          <span>{new Date(leave.endDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="text-sm text-slate-600 truncate">{leave.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`status-badge ${statusColors[leave.status]}`}>
                        {leave.status === 'approved' ? <HiOutlineCheckCircle className="w-4 h-4 inline mr-1" /> : leave.status === 'pending' ? <HiOutlineClock className="w-4 h-4 inline mr-1" /> : <HiOutlineXMark className="w-4 h-4 inline mr-1" />}
                        {leave.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto pt-4 md:pt-20 pb-10">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl relative border border-slate-200 fade-in mb-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <HiOutlineCalendarDays className="w-6 h-6 text-indigo-600" />
              Apply for Leave
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    className="input-field"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Reason for Leave</label>
                <textarea
                  rows="4"
                  required
                  className="input-field resize-none py-4"
                  placeholder="Tell us why you need a break..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                ></textarea>
              </div>
              <button type="submit" className="w-full btn-primary mt-4 py-4 text-base tracking-wide font-black">
                Submit Application
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
