import { useState, useEffect } from 'react';
import { getEnquiries, addEnquiry, updateEnquiry, deleteEnquiry } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineUserGroup, 
  HiOutlineMagnifyingGlass, 
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineClipboardDocumentList,
  HiOutlineChatBubbleBottomCenterText
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

const Enquiries = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    status: 'New'
  });

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const res = await getEnquiries();
      setEnquiries(res.data.enquiries || []);
    } catch (err) {
      toast.error('Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleOpenModal = (enquiry = null) => {
    if (enquiry) {
      setEditingEnquiry(enquiry);
      setFormData({
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone || '',
        subject: enquiry.subject,
        message: enquiry.message,
        status: enquiry.status
      });
    } else {
      setEditingEnquiry(null);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '', status: 'New' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEnquiry(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEnquiry) {
        await updateEnquiry(editingEnquiry._id, formData);
        toast.success('Enquiry updated successfully');
      } else {
        await addEnquiry(formData);
        toast.success('Enquiry added successfully');
      }
      fetchEnquiries();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this enquiry?')) {
      try {
        await deleteEnquiry(id);
        toast.success('Enquiry deleted');
        fetchEnquiries();
      } catch (err) {
        toast.error('Failed to delete enquiry');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateEnquiry(id, { status: newStatus });
      toast.success('Status updated');
      fetchEnquiries();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredEnquiries = enquiries.filter(enq => 
    enq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    enq.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    'New': 'bg-blue-50 text-blue-600 border-blue-200',
    'In Progress': 'bg-amber-50 text-amber-600 border-amber-200',
    'Resolved': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'Closed': 'bg-slate-50 text-slate-600 border-slate-200'
  };

  return (
    
    <div className="space-y-6 fade-in pb-10 h-full rounded-[2rem]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Client <span className="text-indigo-600">Enquiries</span></h1>
          <p className="text-slate-500 mt-1 font-medium italic">Manage and track incoming client requests</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text"
              placeholder="Search enquiries..."
              className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm active:scale-95"
          >
            <HiOutlinePlus className="w-5 h-5" />
            New Enquiry
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="glass-card overflow-hidden shadow-xl border-slate-200">
        {loading ? (
          <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="py-20 text-center">
             <HiOutlineUserGroup className="w-16 h-16 mx-auto text-slate-200 mb-4" />
             <p className="font-bold text-lg text-slate-500">No enquiries found</p>
             <p className="text-sm mt-2 text-slate-400">Add a new enquiry to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Client details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Subject & Message</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnquiries.map((enq) => (
                  <tr key={enq._id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900 tracking-tight">{enq.name}</p>
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500"><HiOutlineEnvelope className="w-3.5 h-3.5"/> {enq.email}</div>
                        {enq.phone && <div className="flex items-center gap-1.5 text-xs text-slate-500"><HiOutlinePhone className="w-3.5 h-3.5"/> {enq.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-sm">
                      <p className="text-sm font-bold text-indigo-900 mb-1 line-clamp-1">{enq.subject}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{enq.message}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-2">{new Date(enq.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <select 
                        value={enq.status}
                        onChange={(e) => handleStatusChange(enq._id, e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border appearance-none outline-none cursor-pointer transition-colors shadow-sm text-center ${statusColors[enq.status] || statusColors['New']}`}
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(enq)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><HiOutlinePencilSquare className="w-5 h-5" /></button>
                        {(user?.role === 'admin' || user?.canManageEnquiries) && (
                          <button onClick={() => handleDelete(enq._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><HiOutlineTrash className="w-5 h-5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 py-10 md:py-20 text-center sm:p-0">
          <div className="fixed inset-0 bg-slate-400/20 backdrop-blur-sm  border border-slate-400/20 transition-opacity" onClick={handleCloseModal} aria-hidden="true"></div>
            
            <div className="relative transform overflow-hidden rounded-[2rem] bg-white text-left shadow-2xl transition-all w-full max-w-lg border border-white/20 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
               <div>
                 <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingEnquiry ? 'Edit Enquiry' : 'New Enquiry'}</h2>
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Client communication log</p>
               </div>
               <button onClick={handleCloseModal} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><HiOutlineXMark className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6">
              <form id="enquiryForm" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Client Name <span className="text-rose-500">*</span></label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"/>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Subject <span className="text-rose-500">*</span></label>
                    <input type="text" required value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"/>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Message Details <span className="text-rose-500">*</span></label>
                    <textarea required rows="4" value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"></textarea>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none">
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
               <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all">Cancel</button>
               <button type="submit" form="enquiryForm" className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md active:scale-95">Save Enquiry</button>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enquiries;
