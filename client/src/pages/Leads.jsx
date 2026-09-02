import { useState, useEffect } from 'react';
import { getLeadsData, addLead, updateLead, deleteLead } from '@/services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineBriefcase,
  HiOutlineCurrencyDollar
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

const Leads = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [formData, setFormData] = useState({
    clientName: '',
    company: '',
    email: '',
    phone: '',
    projectType: '',
    budget: '',
    status: 'New',
    notes: ''
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await getLeadsData();
      setLeads(res.data.leads || []);
    } catch (err) {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleOpenModal = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        clientName: lead.clientName,
        company: lead.company || '',
        email: lead.email,
        phone: lead.phone || '',
        projectType: lead.projectType || '',
        budget: lead.budget || '',
        status: lead.status,
        notes: lead.notes || ''
      });
    } else {
      setEditingLead(null);
      setFormData({ clientName: '', company: '', email: '', phone: '', projectType: '', budget: '', status: 'New', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLead(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLead) {
        await updateLead(editingLead._id, formData);
        toast.success('Lead updated successfully');
      } else {
        await addLead(formData);
        toast.success('Lead added successfully');
      }
      fetchLeads();
      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLead(id);
        toast.success('Lead deleted');
        fetchLeads();
      } catch (err) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateLead(id, { status: newStatus });
      toast.success('Status updated');
      fetchLeads();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filteredLeads = leads.filter(ld =>
    ld.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ld.company && ld.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statusColors = {
    'New': 'bg-blue-50 text-blue-600 border-blue-200',
    'Contacted': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
    'Qualified': 'bg-amber-50 text-amber-600 border-amber-200',
    'Proposal Sent': 'bg-indigo-50 text-indigo-600 border-indigo-200',
    'Won': 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'Lost': 'bg-rose-50 text-rose-600 border-rose-200'
  };

  return (
    <div className="space-y-6 fade-in pb-10 h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Sales <span className="text-indigo-600">Leads</span></h1>
          <p className="text-slate-500 mt-1 font-medium italic">Track potential clients and project opportunities</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Search leads..."
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
            Add Lead
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div className="glass-card overflow-hidden shadow-xl border-slate-200">
        {loading ? (
          <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : filteredLeads.length === 0 ? (
          <div className="py-20 text-center">
            <HiOutlineDocumentText className="w-16 h-16 mx-auto text-slate-200 mb-4" />
            <p className="font-bold text-lg text-slate-500">No leads found</p>
            <p className="text-sm mt-2 text-slate-400">Add a new potential client to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Prospect Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project Summary</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Funnel Stage</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((ld) => (
                  <tr key={ld._id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-900 tracking-tight">{ld.clientName}</p>
                      {ld.company && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{ld.company}</p>}
                      <div className="flex flex-col gap-1 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500"><HiOutlineEnvelope className="w-3.5 h-3.5" /> {ld.email}</div>
                        {ld.phone && <div className="flex items-center gap-1.5 text-xs text-slate-500"><HiOutlinePhone className="w-3.5 h-3.5" /> {ld.phone}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {ld.projectType ? (
                        <div className="flex items-center gap-2 mb-2">
                          <HiOutlineBriefcase className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-black text-slate-700">{ld.projectType}</span>
                        </div>
                      ) : <span className="text-xs text-slate-400 italic">No specific project</span>}
                      {ld.budget && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 inline-flex items-center gap-1"><HiOutlineCurrencyDollar className="w-3 h-3" /> Budget: {ld.budget}</span>
                        </div>
                      )}
                      {ld.notes && <p className="text-xs text-slate-500 italic mt-2 line-clamp-1 border-l-2 border-slate-200 pl-2">"{ld.notes}"</p>}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <select
                        value={ld.status}
                        onChange={(e) => handleStatusChange(ld._id, e.target.value)}
                        className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border appearance-none outline-none cursor-pointer transition-colors shadow-sm text-center ${statusColors[ld.status] || statusColors['New']}`}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Proposal Sent">Proposal Sent</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(ld)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><HiOutlinePencilSquare className="w-5 h-5" /></button>
                        {(user?.role === 'admin' || user?.canManageLeads) && (
                          <button onClick={() => handleDelete(ld._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><HiOutlineTrash className="w-5 h-5" /></button>
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
        <div className="fixed inset-0 z-[100] overflow-y-auto h-screen">
          <div className="flex min-h-full items-center justify-center p-4 py-10 md:py-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-slate-400/20 backdrop-blur-sm  border border-slate-400/20 transition-opacity" onClick={handleCloseModal} aria-hidden="true"></div>
            <div className="relative transform overflow-hidden rounded-[2rem] bg-white text-left shadow-2xl transition-all w-full max-w-2xl border border-black/20 flex flex-col animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingLead ? 'Edit Lead' : 'New Sales Lead'}</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Prospect profile & deal tracker</p>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all"><HiOutlineXMark className="w-6 h-6" /></button>
              </div>

              <div className="p-6">
                <form id="leadForm" onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Client Name <span className="text-rose-500">*</span></label>
                      <input type="text" required value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Company Name</label>
                      <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address <span className="text-rose-500">*</span></label>
                      <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                      <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Project Type (e.g. Website, SEO)</label>
                      <input type="text" value={formData.projectType} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estimated Budget</label>
                      <input type="text" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="e.g. $500 - $1000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Funnel Status</label>
                      <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Qualified">Qualified</option>
                        <option value="Proposal Sent">Proposal Sent</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Additional Notes</label>
                      <textarea rows="3" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"></textarea>
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0 flex justify-end gap-3">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" form="leadForm" className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md active:scale-95">Save Lead</button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
