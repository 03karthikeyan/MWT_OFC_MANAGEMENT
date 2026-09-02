import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMyRequests, getIncomingRequests, addRequest, updateRequest, deleteRequest, getTeam } from '@/services/api';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineChatBubbleLeftRight, HiOutlineLink } from 'react-icons/hi2';

const Requests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('my_requests');
  const [formData, setFormData] = useState({
    id: null,
    type: 'Request',
    subject: '',
    description: '',
    websiteLink: '',
    recipientId: '',
    status: 'Pending',
    remarks: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [myRes, incRes, membersRes] = await Promise.all([
        getMyRequests().catch(() => ({ data: { requests: [] } })),
        getIncomingRequests().catch(() => ({ data: { requests: [] } })),
        getTeam().catch(() => ({ data: { team: [] } }))
      ]);
      setRequests(myRes.data.requests || []);
      setIncomingRequests(incRes.data.requests || []);
      setMembers(membersRes.data.team || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (req = null) => {
    if (req) {
      setFormData({
        id: req._id,
        type: req.type,
        subject: req.subject,
        description: req.description,
        websiteLink: req.websiteLink || '',
        recipientId: req.recipientId?._id || '',
        status: req.status,
        remarks: req.remarks || ''
      });
    } else {
      setFormData({
        id: null,
        type: 'Request',
        subject: '',
        description: '',
        websiteLink: '',
        recipientId: '',
        status: 'Pending',
        remarks: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateRequest(formData.id, formData);
      } else {
        await addRequest(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error saving request');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      try {
        await deleteRequest(id);
        fetchData();
      } catch (err) {
        console.error(err);
        alert('Error deleting request');
      }
    }
  };

  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    'Resolved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800'
  };

  const displayedRequests = activeTab === 'my_requests' ? requests : incomingRequests;

  return (
    <div className="p-8 pb-32 w-full max-w-7xl mx-auto space-y-8 animate-fade-in relative z-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-3">
            <HiOutlineChatBubbleLeftRight className="w-8 h-8 text-indigo-600" />
            Requests & Reviews
          </h1>
          <p className="text-slate-500 font-medium">Manage your requests, reviews, and help desk items</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold tracking-wide hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg hover:first-line:shadow-indigo-200"
        >
          <HiOutlinePlus className="w-5 h-5" />
          <span className="uppercase text-sm tracking-wider">New</span>
        </button>
      </div>

      <div className="flex space-x-4 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('my_requests')}
          className={`pb-2 px-1 border-b-2 font-bold transition-all ${activeTab === 'my_requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          My Requests
        </button>
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-2 px-1 border-b-2 font-bold transition-all relative flex items-center gap-2 ${activeTab === 'incoming' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Incoming Requests
          {incomingRequests.some(r => r.status === 'Pending') && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading...</div>
      ) : displayedRequests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border md:col-span-1 border-slate-100 shadow-sm flex flex-col items-center">
            <HiOutlineChatBubbleLeftRight className="w-16 h-16 text-slate-200 mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No requests found</h3>
            <p className="text-slate-400 mt-2">There are no items in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedRequests.map(req => (
            <div key={req._id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg ${statusColors[req.status]}`}>
                  {req.status}
                </span>
                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase">
                  {req.type}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 truncate" title={req.subject}>{req.subject}</h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-grow">{req.description}</p>
              
              <div className="text-xs font-medium text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl">
                {activeTab === 'my_requests' ? (
                  <><strong>To:</strong> {req.recipientId ? req.recipientId.name : 'Administrators'}</>
                ) : (
                  <><strong>From:</strong> {req.userId?.name}</>
                )}
                <div className="mt-1"><strong>Date:</strong> {new Date(req.createdAt).toLocaleDateString()}</div>
                {req.websiteLink && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <a href={req.websiteLink.startsWith('http') ? req.websiteLink : `https://${req.websiteLink}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors uppercase font-black text-[10px] tracking-widest bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                      <HiOutlineLink className="w-3.5 h-3.5" /> Reference Link
                    </a>
                  </div>
                )}
              </div>

              {req.remarks && (
                <div className="mb-4 text-sm p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <strong className="text-indigo-800 text-xs uppercase">Remarks:</strong>
                  <p className="text-indigo-700 mt-1">{req.remarks}</p>
                </div>
              )}

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenModal(req)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-bold transition-colors text-sm"
                >
                  <HiOutlinePencilSquare className="w-4 h-4" /> Edit
                </button>
                {(user.role === 'admin' || req.userId?._id === user._id || req.userId === user._id) && (
                  <button
                    onClick={() => handleDelete(req._id)}
                    className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 font-bold transition-colors"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-slate-100 p-8">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
                {formData.id ? 'UPDATE REQUEST' : 'NEW REQUEST'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {(!formData.id || (activeTab === 'my_requests' && formData.status === 'Pending')) && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">Type</label>
                      <select
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        required
                      >
                        <option value="Request">General Request</option>
                        <option value="Review">Review / Feedback</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-500">Recipient</label>
                      <select
                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                        value={formData.recipientId}
                        onChange={(e) => setFormData({ ...formData, recipientId: e.target.value })}
                      >
                        <option value="">Admin (General)</option>
                        {members.filter(m => m._id !== user._id).map(m => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Subject</label>
                    <input
                      type="text"
                      required
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Website Link <span className="text-slate-300 font-medium">(Optional)</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <HiOutlineLink className="w-5 h-5" />
                      </div>
                      <input
                        type="url"
                        className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 placeholder-slate-300"
                        placeholder="https://example.com"
                        value={formData.websiteLink}
                        onChange={(e) => setFormData({ ...formData, websiteLink: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Description</label>
                    <textarea
                      required
                      rows={4}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 resize-none"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Status and Remarks for admin or recipient */}
              {(user.role === 'admin' || activeTab === 'incoming') && formData.id && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Update Status</label>
                    <select
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500">Add Remarks/Reply</label>
                    <textarea
                      rows={3}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700 resize-none"
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'my_requests' && formData.id && formData.status !== 'Pending' && (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm">
                  This request is already "{formData.status}" and cannot be modified.
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold uppercase tracking-wider text-slate-500 border-2 border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={activeTab === 'my_requests' && formData.id && formData.status !== 'Pending'}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all disabled:opacity-50"
                >
                  {formData.id ? 'Save Changes' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
