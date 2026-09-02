import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects } from '../redux/slices/dataSlice';
import { addProject, updateProject, deleteProject, getTeam } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlineBriefcase, 
  HiOutlineUserGroup, 
  HiOutlineCalendar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCurrencyDollar,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineXMark
} from 'react-icons/hi2';

const ActiveProjects = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { projects, loading } = useSelector((state) => state.data);
  const [users, setUsers] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    clientName: '',
    description: '',
    status: 'In Progress',
    priority: 'Medium',
    deadline: '',
    budget: '',
    teamMembers: [],
    clientEmail: '',
    clientPhone: ''
  });

  const fetchData = async () => {
    try {
      // Fetch projects via Redux Thunk
      dispatch(fetchProjects());
      
      // Fetch team members locally (or could also be moved to redux)
      const userRes = await getTeam();
      setUsers(userRes.data.team || []);
    } catch (err) {
      toast.error('Failed to fetch data');
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch]);

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updateProject(currentProject._id, newProject);
        toast.success('Project updated');
      } else {
        await addProject(newProject);
        toast.success('Project added successfully');
      }
      setShowAddModal(false);
      // No need to fetch all projects again, WebSocket will update the store!
      setNewProject({ name: '', clientName: '', description: '', status: 'In Progress', priority: 'Medium', deadline: '', budget: '', teamMembers: [] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
        try {
            await deleteProject(id);
            toast.success('Project deleted');
            // No need to fetch all projects again, WebSocket will update the store!
        } catch (err) {
            toast.error('Failed to delete');
        }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'In Progress': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'On Hold': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Planned': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'High': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'Medium': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Low': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <HiOutlineBriefcase className="text-indigo-600 w-8 h-8" />
            Active <span className="text-indigo-600">Projects</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Track and manage ongoing client engagements and internal initiatives.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => {
                setIsEdit(false);
                setNewProject({ name: '', clientName: '', description: '', status: 'In Progress', priority: 'Medium', deadline: '', budget: '', teamMembers: [], clientEmail: '', clientPhone: '' });
                setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
          >
            <HiOutlinePlus className="w-5 h-5" />
            New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center">
          <HiOutlineBriefcase className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Active Projects</h3>
          <p className="text-slate-500 font-medium">Get started by creating your first client project.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project._id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl hover:shadow-slate-200 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase">{project.name}</h3>
              <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">{project.clientName}</p>
              
              <div className="flex -space-x-3 mb-6 overflow-hidden">
                {project.teamMembers?.map((member, i) => (
                  <div key={i} title={member.user?.name} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm overflow-hidden">
                    {member.user?.profilePicture ? (
                        <img src={member.user.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                        member.user?.name?.charAt(0)
                    )}
                  </div>
                ))}
                {(!project.teamMembers || project.teamMembers.length === 0) && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300">
                        ?
                    </div>
                )}
              </div>
              
              <p className="text-slate-600 text-sm line-clamp-3 mb-6 font-medium leading-relaxed">
                {project.description || 'No description provided.'}
              </p>

              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                  <span className="text-xs font-black text-slate-900">{project.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-1000 ease-out" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-2 text-slate-500">
                  <HiOutlineCalendar className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No Date'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 justify-end">
                   <HiOutlineCurrencyDollar className="w-4 h-4" />
                   <span className="text-[10px] font-black uppercase tracking-widest">
                    {project.budget || 'N/A'}
                  </span>
                </div>
              </div>

              {user?.role === 'admin' && (
                  <div className="mt-8 pt-4 border-t border-slate-50 flex gap-4">
                      <button 
                        onClick={() => {
                            setIsEdit(true);
                            setCurrentProject(project);
                            setNewProject({
                                name: project.name,
                                clientName: project.clientName,
                                description: project.description,
                                status: project.status,
                                priority: project.priority,
                                deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
                                budget: project.budget,
                                teamMembers: project.teamMembers?.map(m => ({ user: m.user?._id || m.user, role: m.role })) || [],
                                progress: project.progress || 0
                            });
                            setShowAddModal(true);
                        }}
                        className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                      >
                          <HiOutlinePencil className="w-3.5 h-3.5" />
                          Modify
                      </button>
                      <button 
                        onClick={() => handleDeleteProject(project._id)}
                        className="p-3 bg-slate-100 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all"
                      >
                          <HiOutlineTrash className="w-4 h-4" />
                      </button>
                  </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Project Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-50/60 border-slate-200 backdrop-blur-sm">
          <div className="flex min-h-screen items-start justify-center p-4 py-12 text-center md:items-center">
            <div className="w-full max-w-lg transform rounded-[2.5rem] bg-white text-left align-middle shadow-2xl transition-all animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 text-slate-900 shrink-0">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">{isEdit ? 'Modify Project' : 'New Project'}</h2>
                <p className="text-slate-500 text-sm font-medium">{isEdit ? 'Update project scope and progress.' : 'Create a new workspace for client resources.'}</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                <HiOutlineXMark className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddProject} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                {isEdit && (
                    <div className="space-y-4 pb-6 border-b border-slate-100">
                         <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Progress</label>
                            <span className="text-indigo-600 font-black text-lg">{newProject.progress}%</span>
                         </div>
                         <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={newProject.progress || 0}
                            onChange={(e) => setNewProject({...newProject, progress: parseInt(e.target.value)})}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                    </div>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                    placeholder="E.g. Web Redesign"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                  <input
                    type="text"
                    required
                    value={newProject.clientName}
                    onChange={(e) => setNewProject({...newProject, clientName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                    placeholder="E.g. Media Wave"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Email</label>
                  <input
                    type="email"
                    value={newProject.clientEmail}
                    onChange={(e) => setNewProject({...newProject, clientEmail: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                    placeholder="client@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Phone</label>
                  <input
                    type="text"
                    value={newProject.clientPhone}
                    onChange={(e) => setNewProject({...newProject, clientPhone: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                    placeholder="+1 234 567 890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  rows="3"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                  placeholder="Describe the project scope..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                  <select
                    value={newProject.priority}
                    onChange={(e) => setNewProject({...newProject, priority: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deadline</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Team Allocation</label>
                <div className="max-h-32 overflow-y-auto border border-slate-100 rounded-2xl p-4 bg-slate-50/50 flex flex-wrap gap-2">
                    {users.filter(u => u.role !== 'admin').map(u => {
                        const isSelected = newProject.teamMembers.some(m => m.user === u._id);
                        return (
                            <button
                                key={u._id}
                                type="button"
                                onClick={() => {
                                    if (isSelected) {
                                        setNewProject({ ...newProject, teamMembers: newProject.teamMembers.filter(m => m.user !== u._id) });
                                    } else {
                                        setNewProject({ ...newProject, teamMembers: [...newProject.teamMembers, { user: u._id, role: u.jobRole }] });
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border text-[10px] font-black uppercase tracking-tight ${
                                    isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                                }`}
                            >
                                {u.name}
                            </button>
                        );
                    })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Progress Log (Admin Only)</label>
                <textarea
                  rows="2"
                  value={newProject.adminNotes || ''}
                  onChange={(e) => setNewProject({...newProject, adminNotes: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-400 italic"
                  placeholder="Private stakeholder updates or internal blockers..."
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-indigo-600 hover:shadow-xl transition-all active:scale-95 shadow-xl shadow-slate-100"
              >
                {isEdit ? 'Update Project Metrics' : 'Launch New Project'}
              </button>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default ActiveProjects;
