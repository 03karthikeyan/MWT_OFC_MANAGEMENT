import { useState, useEffect } from 'react';
import { applyOnDuty, getMyOnDuty, deleteOnDuty } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineBriefcase, 
  HiOutlineCalendarDays, 
  HiOutlineClock, 
  HiOutlineBanknotes,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineXCircle
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

const OnDuty = () => {
  const { user } = useAuth();
  const [onDutyRecords, setOnDutyRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    expenses: {
      title: '',
      price: ''
    }
  });

  useEffect(() => {
    if (user) {
      loadMyRecords();
    }
  }, [user]);

  const loadMyRecords = async () => {
    try {
      const res = await getMyOnDuty();
      setOnDutyRecords(res.data?.onDutyRecords || []);
    } catch (err) {
      toast.error('Failed to load on duty records');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.reason || !formData.date) {
        return toast.error('Date and reason are required');
      }
      await applyOnDuty(formData);
      toast.success('On Duty applied successfully');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reason: '',
        expenses: { title: '', price: '' }
      });
      setIsFormOpen(false);
      loadMyRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Cancel this request?')) {
      try {
        await deleteOnDuty(id);
        toast.success('Deleted successfully');
        loadMyRecords();
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div className="space-y-6 fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">On Duty <span className="text-indigo-600">Requests</span></h1>
          <p className="text-slate-500 mt-1 font-medium italic">Record your external assignments and expenses</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          {isFormOpen ? <HiOutlineXCircle className="w-5 h-5" /> : <HiOutlineBriefcase className="w-5 h-5" />}
          {isFormOpen ? 'Cancel Application' : 'Apply On Duty'}
        </button>
      </div>

      {isFormOpen && (
        <div className="glass-card p-6 border-indigo-200 animate-in slide-in-from-top duration-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Duty Date</label>
                <div className="relative">
                  <HiOutlineCalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Duty Reason</label>
                <div className="relative">
                  <HiOutlineChatBubbleBottomCenterText className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                  <textarea 
                    placeholder="Where and why are you going?"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all min-h-[46px]"
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    rows="1"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
              <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
                <HiOutlineBanknotes className="w-4 h-4" />
                Expenses Incurred (If any)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text"
                  placeholder="Expense Title (e.g. Travel, Lunch)"
                  className="bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold focus:outline-none focus:border-indigo-500"
                  value={formData.expenses.title}
                  onChange={(e) => setFormData({...formData, expenses: {...formData.expenses, title: e.target.value}})}
                />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input 
                    type="number"
                    placeholder="Price"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-8 pr-4 text-sm font-bold focus:outline-none focus:border-indigo-500"
                    value={formData.expenses.price}
                    onChange={(e) => setFormData({...formData, expenses: {...formData.expenses, price: e.target.value}})}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"
            >
              Submit On Duty Report
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 font-medium italic text-slate-400">Syncing report history...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {onDutyRecords.length === 0 ? (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <HiOutlineBriefcase className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="font-bold">No on duty records submitted yet.</p>
            </div>
          ) : (
            onDutyRecords.map((record) => (
              <div key={record._id} className="glass-card p-6 flex flex-col justify-between hover:border-indigo-200 transition-all group">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusColors[record.status]}`}>
                      {record.status}
                    </span>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-2 italic">"{record.reason}"</h3>
                  
                  {record.expenses?.title && (
                    <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Expense Claim</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{record.expenses.title}</span>
                        <span className="text-xs font-black text-emerald-600">₹{record.expenses.price}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {record.status === 'approved' && <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />}
                    {record.status === 'rejected' && <HiOutlineXCircle className="w-5 h-5 text-red-500" />}
                    {record.status === 'pending' && <HiOutlineClock className="w-5 h-5 text-amber-500" />}
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {record.status === 'pending' ? 'Decision Pending' : `Outcome: ${record.status}`}
                    </span>
                  </div>
                  {record.status === 'pending' && (
                    <button 
                      onClick={() => handleDelete(record._id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default OnDuty;
