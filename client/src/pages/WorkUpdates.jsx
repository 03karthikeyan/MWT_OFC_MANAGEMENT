import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkUpdates, fetchProjects } from '@/redux/slices/dataSlice';
import { addWork, updateWork, deleteWork } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineXMark, 
  HiOutlineClipboardDocumentList, 
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';

const WorkUpdates = () => {
  const dispatch = useDispatch();
  const { workUpdates: works, projects, loading: dataLoading } = useSelector((state) => state.data);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentWork, setCurrentWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    projectId: '',
  });

  useEffect(() => {
    loadData();
  }, [filterMonth, dispatch]);

  const loadData = async () => {
    try {
      dispatch(fetchWorkUpdates());
      dispatch(fetchProjects());
    } catch (err) {
      console.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadWorks = () => dispatch(fetchWorkUpdates());

  const filteredWorks = works.filter(w => {
    const isMonthMatch = new Date(w.date).toISOString().slice(0, 7) === filterMonth;
    const isSearchMatch = (w.title + w.description).toLowerCase().includes(searchTerm.toLowerCase());
    return isMonthMatch && isSearchMatch;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const downloadCSV = () => {
    const headers = ['Date', 'Project/Client', 'Title', 'Description', 'Status'];
    const dataRows = filteredWorks.map(w => [
      new Date(w.date).toLocaleDateString(),
      `"${w.projectId?.name || 'Personal'} (${w.projectId?.clientName || 'N/A'})"`,
      `"${w.title.replace(/"/g, '""')}"`,
      `"${(w.description || '').replace(/"/g, '""')}"`,
      w.status.toUpperCase()
    ]);

    const csvContent = [headers, ...dataRows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `work_journal_${filterMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Journal exported as CSV');
  };

  const getTimingBadge = (workDate, createdAt) => {
    if (!createdAt) return null;
    const wDate = new Date(workDate).toISOString().split('T')[0];
    const cDate = new Date(createdAt).toISOString().split('T')[0];
    if (wDate === cDate) return null;
    return (
      <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest mt-1 inline-block ${wDate < cDate ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
        {wDate < cDate ? 'Late Update' : 'Early Update'}
      </span>
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateWork(currentWork._id, formData);
        toast.success('Work updated');
      } else {
        await addWork(formData);
        toast.success('Work added');
      }
      setShowModal(false);
      setFormData({ 
        title: '', 
        description: `[Logged at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]: `, 
        status: 'pending', 
        date: new Date().toISOString().split('T')[0], 
        projectId: '' 
      });
      loadWorks();
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const handleEdit = (work) => {
    setIsEdit(true);
    setCurrentWork(work);
    setFormData({
      title: work.title,
      description: work.description,
      status: work.status,
      date: new Date(work.date).toISOString().split('T')[0],
      projectId: work.projectId?._id || work.projectId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this update?')) {
      try {
        await deleteWork(id);
        toast.success('Work deleted');
        loadWorks();
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  if (loading) return <div className="text-center py-10 font-medium text-slate-500">Loading work journal...</div>;

  return (
    <div className="space-y-6 px-2 md:px-0 relative min-h-screen pb-20">
      <div className="fade-in space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Daily <span className="text-indigo-600">Journal</span></h1>
            <p className="text-slate-500 mt-1 font-medium">Keep track of your projects and progress</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text"
                placeholder="Search journal..."
                className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-medium w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Month Filter */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Work Month</span>
              <input
                type="month"
                className="bg-transparent border-none p-0 text-sm font-bold text-indigo-600 focus:outline-none cursor-pointer"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              />
            </div>

            {/* Export */}
            <button
               onClick={downloadCSV}
               disabled={filteredWorks.length === 0}
               className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
               title="Download CSV"
            >
              <HiOutlineArrowDownTray className="w-5 h-5" />
            </button>

            {/* Add */}
            <button
              onClick={() => { 
                setIsEdit(false); 
                setFormData({ 
                  title: '', 
                  description: `[Logged at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]: `, 
                  status: 'pending', 
                  date: new Date().toISOString().split('T')[0], 
                  projectId: '' 
                });
                setShowModal(true); 
              }}
              className="btn-primary flex items-center gap-2 group"
            >
              <HiOutlinePlus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Add Update
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWorks.length === 0 ? (
            <div className="col-span-full border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 bg-slate-50/50">
              <HiOutlineClipboardDocumentList className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p className="font-bold text-lg text-slate-500">No matching updates found</p>
              <p className="text-sm">Try adjusting your filters or share what you're working on!</p>
            </div>
          ) : (
            filteredWorks.map((work) => (
              <div key={work._id} className="glass-card p-6 flex flex-col justify-between group hover:border-indigo-200 hover:shadow-indigo-50/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`status-badge text-[10px] font-bold uppercase tracking-wider ${
                      work.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                      work.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                      work.status === 'blocked' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'
                    }`}>
                      {work.status}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{new Date(work.date).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                      {getTimingBadge(work.date, work.createdAt)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-slate-200 shadow-sm shrink-0">
                      {user?.profilePicture ? (
                        <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.charAt(0)
                      )}
                    </div>
                    <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">{work.title}</h3>
                  </div>
                  {work.projectId && (
                    <div className="mb-4 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl inline-flex items-center gap-2">
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Project:</span>
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-tight">{work.projectId.name || 'Personal Task'}</span>
                    </div>
                  )}
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed italic font-medium whitespace-pre-wrap">{work.description || 'No additional details provided.'}</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100/50">
                  <button
                    onClick={() => handleEdit(work)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-widest text-slate-600 bg-slate-100/50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-all"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(work._id)}
                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                  >
                    <HiOutlineTrash className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto pt-4 md:pt-20 pb-10">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-10 shadow-2xl relative border border-slate-200 fade-in mb-8">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <HiOutlineXMark className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 uppercase tracking-tight">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                <HiOutlineClipboardDocumentList className="w-6 h-6 text-indigo-600" />
              </div>
              {isEdit ? 'Update Entry' : 'New Entry'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Work Date</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Status</label>
                  <select
                    className="input-field font-bold"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In-Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Associated Project (Optional)</label>
                <select
                  className="input-field font-bold"
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                >
                  <option value="">No Project / Personal</option>
                  {projects.map(proj => (
                    <option key={proj._id} value={proj._id}>{proj.name} ({proj.clientName})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Project/Task Title</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="e.g. Website Header Design"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Details & Change Log</label>
                <textarea
                  rows="5"
                  className="input-field resize-none py-4"
                  placeholder="Describe your progress, focus areas, and any blockers..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
              
              <button type="submit" className="w-full btn-primary py-4 text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100">
                {isEdit ? 'Save Changes' : 'Post Journal Update'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkUpdates;
