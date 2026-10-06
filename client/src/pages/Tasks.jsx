import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyTasks,
  getAllTasks,
  addTask,
  updateTaskStatus,
  addTaskComment,
  deleteTask,
  getUsers,
  getProjects
} from '../services/api';
import {
  HiOutlineCheckBadge,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineChatBubbleOvalLeftEllipsis,
  HiOutlineTrash,
  HiOutlineFolder,
  HiOutlineUserCircle,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineSparkles,
  HiOutlineXMark,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [commentText, setCommentText] = useState('');

  // Dropdown options
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectsList, setProjectsList] = useState([]);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    projectId: '',
    priority: 'medium',
    dueDate: '',
  });

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = isAdmin
        ? await getAllTasks()
        : await getMyTasks();
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (isAdmin) {
      getUsers().then(res => setTeamMembers(res.data.users || [])).catch(() => {});
      getProjects().then(res => setProjectsList(res.data.projects || [])).catch(() => {});
    }
  }, [isAdmin]);

  const handleStatusChange = async (taskId, newStatus, newProgress) => {
    try {
      const res = await updateTaskStatus(taskId, {
        status: newStatus,
        progress: newProgress !== undefined ? newProgress : (newStatus === 'completed' ? 100 : undefined)
      });
      toast.success('Task updated');
      setTasks(prev => prev.map(t => t._id === taskId ? res.data.task : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedTo) {
      toast.error('Title and Assignee are required');
      return;
    }
    try {
      const res = await addTask(newTask);
      toast.success('Task assigned successfully!');
      setTasks(prev => [res.data.task, ...prev]);
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        assignedTo: '',
        projectId: '',
        priority: 'medium',
        dueDate: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask) return;
    try {
      const res = await addTaskComment(selectedTask._id, { message: commentText });
      toast.success('Comment posted');
      setSelectedTask(res.data.task);
      setTasks(prev => prev.map(t => t._id === res.data.task._id ? res.data.task : t));
      setCommentText('');
    } catch (err) {
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent':
        return 'bg-rose-50 text-rose-600 border-rose-200';
      case 'high':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'medium':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Task Management & Milestones
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Project Tasks & Sprints</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Track daily deliverables, milestone progress, and collaborate seamlessly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all"
            title="Refresh"
          >
            <HiOutlineArrowPath className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Assign New Task
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
          {['all', 'todo', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-200 p-8">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-4">
            <HiOutlineCheckBadge className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">No Tasks Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            No tasks match the selected filters. Check back later or create a new sprint task.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Badges row */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPriorityBadge(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(task.status)}`}>
                    {task.status?.replace('_', ' ')}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1.5">
                  {task.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-3 mb-4 leading-relaxed">
                  {task.description || 'No detailed instructions provided.'}
                </p>

                {/* Project Tag */}
                {task.projectId && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold mb-4">
                    <HiOutlineFolder className="w-3.5 h-3.5 text-indigo-500" />
                    {task.projectId.name}
                  </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-wider">Progress</span>
                    <span className="text-indigo-600">{task.progress || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${task.progress || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                {/* Assignee / Due Date */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs overflow-hidden border border-slate-200">
                    {task.assignedTo?.profilePicture ? (
                      <img src={task.assignedTo.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      task.assignedTo?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 leading-tight">
                      {task.assignedTo?.name || 'Assigned'}
                    </p>
                    {task.dueDate && (
                      <p className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                        <HiOutlineClock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {/* Status toggle for employee/admin */}
                  {task.status !== 'completed' ? (
                    <button
                      onClick={() => handleStatusChange(task._id, 'completed', 100)}
                      className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                      title="Mark Complete"
                    >
                      <HiOutlineCheckCircle className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(task._id, 'in_progress', 50)}
                      className="p-2 text-emerald-600 hover:bg-slate-100 rounded-xl transition-all"
                      title="Re-open Task"
                    >
                      <HiOutlineCheckBadge className="w-5 h-5" />
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setSelectedTask(task);
                      setShowCommentModal(true);
                    }}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all relative"
                    title="Comments"
                  >
                    <HiOutlineChatBubbleOvalLeftEllipsis className="w-5 h-5" />
                    {task.comments?.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-600 rounded-full"></span>
                    )}
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete Task"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Assign New Task</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Socket.IO Webhook"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Detailed instructions or acceptance criteria..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Assign To *
                  </label>
                  <select
                    required
                    value={newTask.assignedTo}
                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Employee</option>
                    {teamMembers.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({m.jobRole || m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Project (Optional)
                  </label>
                  <select
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None / General</option>
                    {projectsList.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  Create & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Comments Modal */}
      {showCommentModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedTask.title}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sprint Discussion</p>
              </div>
              <button
                onClick={() => setShowCommentModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-3">
              {(!selectedTask.comments || selectedTask.comments.length === 0) ? (
                <p className="text-center text-xs text-slate-400 font-medium py-8">
                  No comments yet. Start the thread below.
                </p>
              ) : (
                selectedTask.comments.map((c, i) => (
                  <div key={i} className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-slate-800">{c.userId?.name || 'Team Member'}</span>
                      <span className="text-[9px] font-semibold text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{c.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add comment input */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl text-xs font-black uppercase tracking-wider"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
