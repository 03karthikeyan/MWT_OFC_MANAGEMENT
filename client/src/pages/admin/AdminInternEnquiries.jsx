import { useState, useEffect } from 'react';
import {
  getInternships,
  updateInternship,
  deleteInternship,
} from '@/services/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  HiOutlineAcademicCap,
  HiOutlineChatBubbleLeftRight,
  HiOutlineMagnifyingGlass,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineChevronDown,
} from 'react-icons/hi2';

const STATUS_COLORS = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
};

const AdminInternEnquiries = () => {
  const { user } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    load();
  }, []);

  if (!user || (user.role !== 'admin' && !user.canManageInternships)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center">
          <HiOutlineXMark className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access Denied</h2>
        <p className="text-slate-500 font-medium italic">You do not have permission to view enquiry details.</p>
      </div>
    );
  }

  const load = async () => {
    setLoading(true);
    try {
      const res = await getInternships();
      setEnquiries(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this enquiry?')) return;
    try {
      await deleteInternship(id);
      setEnquiries(prev => prev.filter(e => e._id !== id));
      toast.success('Enquiry deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleAboutChange = async (id, val) => {
    try {
      await updateInternship(id, { about: val });
      setEnquiries(prev => prev.map(e => e._id === id ? { ...e, about: val } : e));
      toast.success(`Lead status: ${val}`);
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDateChange = async (id, val) => {
    try {
      await updateInternship(id, { startDate: val });
      setEnquiries(prev => prev.map(e => e._id === id ? { ...e, startDate: val } : e));
      toast.success('Commencement date updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleWhatsApp = (enquiry) => {
    if (!enquiry.phone) {
      toast.error('No phone number provided');
      return;
    }
    // Remove non-numeric characters
    const cleanPhone = enquiry.phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hi ${enquiry.name}, this is regarding your internship enquiry for ${enquiry.domain} at MediaWave.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const filtered = enquiries.filter(e => {
    const matchSearch = `${e.name} ${e.email} ${e.domain}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Enquiry Details...</p>
    </div>
  );

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Enquiry <span className="text-indigo-600">Details</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">View and contact all internship applicants.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search applicants..."
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white text-slate-900 placeholder-slate-400"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', 'Pending', 'Active', 'Completed', 'Rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Applicant</th>
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Phone</th>
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Specialization</th>
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Duration</th>
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Commencement</th>
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Applied Date</th>
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">About</th>
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Status</th>
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Contact</th>
                <th className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No enquiries found
                  </td>
                </tr>
              ) : filtered.map((e) => (
                <tr key={e._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0 uppercase">
                        {e.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm whitespace-nowrap">{e.name}</p>
                        <p className="text-slate-400 text-[11px]">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-700 text-xs whitespace-nowrap">{e.phone || '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-wide text-slate-600">
                      {e.domain}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-700 text-xs">
                      {!isNaN(e.duration) ? `${e.duration} Months` : e.duration}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <input
                      type="date"
                      value={e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : ''}
                      onChange={(ev) => handleDateChange(e._id, ev.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    />
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      {new Date(e.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={e.about || 'enquiry'}
                      onChange={(ev) => handleAboutChange(e._id, ev.target.value)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer transition-all ${
                        e.about === 'joined' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        e.about === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="enquiry">Enquiry</option>
                      <option value="joined">Joined</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                    <span className={`px-2 py-1 rounded-lg border ${STATUS_COLORS[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleWhatsApp(e)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest border border-emerald-100"
                    >
                      <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                       <button
                        onClick={() => handleDelete(e._id)}
                        className="w-8 h-8 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Delete Enquiry"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminInternEnquiries;
