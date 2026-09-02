
import { useState, useEffect } from 'react';
import { getAllNotifications, sendNotification, deleteNotification, getUsers } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineMegaphone, 
  HiOutlineTrash, 
  HiOutlinePlus, 
  HiOutlineXMark, 
  HiOutlineUserGroup, 
  HiOutlineUser
} from 'react-icons/hi2';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all',
    recipients: [],
    startsAt: new Date().toISOString().slice(0, 16),
    expiresAt: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [notifRes, userRes] = await Promise.all([
        getAllNotifications(),
        getUsers()
      ]);
      setNotifications(notifRes.data?.notifications || []);
      setUsers((userRes.data?.users || []).filter(u => u.role !== 'admin'));
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.target === 'specific' && formData.recipients.length === 0) {
      return toast.error('Please select at least one recipient');
    }
    try {
      await sendNotification(formData);
      toast.success('Announcement broadcasted!');
      setShowModal(false);
      setFormData({ title: '', message: '', type: 'info', target: 'all', recipients: [], startsAt: new Date().toISOString().slice(0, 16), expiresAt: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to send announcement');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this announcement?')) {
      try {
        await deleteNotification(id);
        toast.success('Removed');
        fetchData();
      } catch (err) {
        toast.error('Failed to remove');
      }
    }
  };

  if (loading) return <div className="p-10 text-center opacity-50">Syncing announcements...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Announcements</h1>
          <p className="text-slate-400 font-medium tracking-wide">Blast important updates to the team</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2 group transition-all"
        >
          <HiOutlinePlus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          New Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notifications.map((notif) => (
          <div key={notif._id} className="glass-card p-6 relative group border-t-4 border-t-indigo-600">
            <button 
               onClick={() => handleDelete(notif._id)}
               className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
            >
              <HiOutlineTrash className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                notif.type === 'urgent' ? 'bg-rose-50 text-rose-600' : 
                notif.type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'
              }`}>
                {notif.type}
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {notif.target === 'all' ? 'Universal' : 'Targeted'}
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">{notif.title}</h3>
            <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed font-medium">{notif.message}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center justify-between">
                <span>Start: {new Date(notif.startsAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                {notif.expiresAt && <span className="text-rose-400">Ends: {new Date(notif.expiresAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>}
            </p>
            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-2 pt-2 border-t border-slate-50">
                Created: {new Date(notif.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200">
             <HiOutlineMegaphone className="w-12 h-12 text-slate-300 mx-auto mb-4" />
             <p className="text-slate-400 font-bold uppercase tracking-widest">No history found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-900/60 backdrop-blur-md">
           <div className="flex min-h-full items-center justify-center p-4 text-center">
             <div className="w-full max-w-xl transform overflow-hidden rounded-[2.5rem] bg-white text-left align-middle shadow-2xl transition-all animate-in zoom-in duration-300 relative">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                    <HiOutlineMegaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Broadcast</h2>
                    <p className="text-xs font-black text-slate-400 tracking-widest uppercase">Send official update</p>
                  </div>
               </div>
               <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-white hover:text-slate-900 rounded-xl transition-all">
                  <HiOutlineXMark className="w-6 h-6" />
               </button>
             </div>

             <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm font-bold"
                    placeholder="E.g. System Maintenance"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Announcement Message</label>
                  <textarea
                    required
                    rows="4"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 outline-none focus:border-indigo-600 focus:bg-white transition-all text-sm font-medium resize-none"
                    placeholder="Details about the update..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Broadcast Start Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 text-sm font-bold"
                      value={formData.startsAt}
                      onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiration Time <span className="text-slate-300 italic">(Optional)</span></label>
                    <input
                      type="datetime-local"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 text-sm font-bold"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Urgency</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 text-sm font-bold"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="info">Information</option>
                      <option value="warning">Action Required</option>
                      <option value="urgent">Urgent Announcement</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Broadcasting Range</label>
                     <select
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-6 text-sm font-bold"
                      value={formData.target}
                      onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    >
                      <option value="all">Universal (Entire Team)</option>
                      <option value="specific">Targeted (Choose Users)</option>
                    </select>
                  </div>
                </div>

                {formData.target === 'specific' && (
                  <div className="space-y-2 animate-in slide-in-from-top duration-300">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Recipients</label>
                    <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-[24px] p-4 bg-slate-50/50 flex flex-wrap gap-2">
                       {users.map(user => (
                         <label key={user._id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-all border ${
                            formData.recipients.includes(user._id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                         }`}>
                           <input
                            type="checkbox"
                            className="hidden"
                            checked={formData.recipients.includes(user._id)}
                            onChange={(e) => {
                               if (e.target.checked) setFormData({ ...formData, recipients: [...formData.recipients, user._id] });
                               else setFormData({ ...formData, recipients: formData.recipients.filter(id => id !== user._id) });
                            }}
                           />
                           <HiOutlineUser className="w-3.5 h-3.5" />
                           <span className="text-[11px] font-black uppercase tracking-tight">{user.name}</span>
                         </label>
                       ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-4">
                   <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit" 
                    className="flex-[2] btn-primary py-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100"
                   >
                     Broadcast Update
                   </button>
                </div>
             </form>
           </div>
         </div>
       </div>
      )}
    </div>
  );
};

export default AdminNotifications;
