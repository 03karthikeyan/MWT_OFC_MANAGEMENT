import { useState, useEffect } from 'react';
import { getPortfolios, addPortfolio, updatePortfolio, deletePortfolio } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  HiOutlineGlobeAlt, 
  HiOutlinePlus, 
  HiOutlineDevicePhoneMobile, 
  HiOutlinePaintBrush, 
  HiOutlineLink,
  HiOutlineArrowUpRight,
  HiOutlineCamera,
  HiOutlineVariable,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineXMark
} from 'react-icons/hi2';

const Portfolios = () => {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [newPortfolio, setNewPortfolio] = useState({
    title: '',
    clientName: '',
    description: '',
    category: 'Web Development',
    thumbnail: '',
    liveLink: '',
    isFeatured: false
  });
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const categories = ['All', 'Web Development', 'Mobile App', 'Logo Design', 'Branding', 'Photography', 'UI/UX Design'];

  const fetchPortfolios = async () => {
    try {
      const res = await getPortfolios();
      setPortfolios(res.data.portfolios || []);
    } catch (err) {
      toast.error('Failed to fetch portfolios');
      setPortfolios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await updatePortfolio(currentId, newPortfolio);
        toast.success('Portfolio updated');
      } else {
        await addPortfolio(newPortfolio);
        toast.success('Portfolio item added');
      }
      setShowAddModal(false);
      fetchPortfolios();
      setNewPortfolio({ title: '', clientName: '', description: '', category: 'Web Development', thumbnail: '', liveLink: '', isFeatured: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this portfolio item?')) {
        try {
            await deletePortfolio(id);
            toast.success('Deleted');
            fetchPortfolios();
        } catch (err) {
            toast.error('Failed to delete');
        }
    }
  };

  const filteredPortfolios = activeCategory === 'All' 
    ? portfolios 
    : portfolios.filter(p => p.category === activeCategory);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Web Development': return HiOutlineGlobeAlt;
      case 'Mobile App': return HiOutlineDevicePhoneMobile;
      case 'Logo Design': case 'Branding': return HiOutlinePaintBrush;
      case 'Photography': return HiOutlineCamera;
      case 'UI/UX Design': return HiOutlineVariable;
      default: return HiOutlineGlobeAlt;
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <HiOutlinePaintBrush className="text-indigo-600 w-8 h-8" />
            Media <span className="text-indigo-600">Portfolios</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Showcase of our best work across various digital disciplines.</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => {
                setIsEdit(false);
                setNewPortfolio({ title: '', clientName: '', description: '', category: 'Web Development', thumbnail: '', liveLink: '', isFeatured: false });
                setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add Work
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
              activeCategory === cat 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100 scale-105' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
           <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPortfolios.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center">
          <HiOutlineGlobeAlt className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">No Works Found</h3>
          <p className="text-slate-500 font-medium">No items found for category "{activeCategory}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPortfolios.map((item) => {
            const Icon = getCategoryIcon(item.category);
            return (
              <div key={item._id} className="group bg-white rounded-[2rem] border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 hover:-translate-y-2">
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                      <Icon className="w-12 h-12 opacity-20" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">No Preview Available</span>
                    </div>
                  )}
                  {item.isFeatured && (
                    <div className="absolute top-4 left-4 bg-indigo-600 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                      Featured
                    </div>
                  )}
                  <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm flex items-center justify-center">
                    {item.liveLink && (
                      <a 
                        href={item.liveLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-white text-indigo-900 p-4 rounded-3xl shadow-2xl hover:scale-110 transition-transform"
                      >
                        <HiOutlineArrowUpRight className="w-6 h-6 stroke-[3]" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-8">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                            {item.category}
                        </span>
                        {user?.role === 'admin' && (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => {
                                        setIsEdit(true);
                                        setCurrentId(item._id);
                                        setNewPortfolio({
                                            title: item.title,
                                            clientName: item.clientName,
                                            description: item.description,
                                            category: item.category,
                                            thumbnail: item.thumbnail,
                                            liveLink: item.liveLink,
                                            isFeatured: item.isFeatured
                                        });
                                        setShowAddModal(true);
                                    }}
                                    className="p-1.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg"
                                >
                                    <HiOutlinePencil className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={() => handleDelete(item._id)}
                                    className="p-1.5 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-lg"
                                >
                                    <HiOutlineTrash className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors uppercase">{item.title}</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed line-clamp-2">
                        {item.description}
                    </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Portfolio Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-50/60 border-slate-200 backdrop-blur-sm">
          <div className="flex min-h-screen items-start justify-center p-4 py-12 text-center md:items-center">
            <div className="w-full max-w-lg transform rounded-[2.5rem] bg-white text-left align-middle shadow-2xl transition-all animate-in zoom-in duration-300 flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 text-slate-900 shrink-0">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">{isEdit ? 'Modify Work' : 'Add to Portfolio'}</h2>
                    <p className="text-slate-500 text-sm font-medium">{isEdit ? 'Update project details and links.' : 'Showcase a completed client project.'}</p>
                  </div>
                  <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                    <HiOutlineXMark className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                
                <form onSubmit={handleAddPortfolio} className="p-8 space-y-6 text-left overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                  <input
                    type="text"
                    required
                    value={newPortfolio.title}
                    onChange={(e) => setNewPortfolio({...newPortfolio, title: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                    placeholder="E.g. E-commerce App"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                  <input
                    type="text"
                    value={newPortfolio.clientName}
                    onChange={(e) => setNewPortfolio({...newPortfolio, clientName: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                    placeholder="E.g. Tech Corp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                  <select
                    value={newPortfolio.category}
                    onChange={(e) => setNewPortfolio({...newPortfolio, category: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Live Link (Optional)</label>
                  <input
                    type="url"
                    value={newPortfolio.liveLink}
                    onChange={(e) => setNewPortfolio({...newPortfolio, liveLink: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  rows="3"
                  required
                  value={newPortfolio.description}
                  onChange={(e) => setNewPortfolio({...newPortfolio, description: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none transition-all text-sm font-bold text-slate-900"
                  placeholder="Detailed description of the work done..."
                />
              </div>

              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                 <input
                    type="checkbox"
                    id="isFeatured"
                    checked={newPortfolio.isFeatured}
                    onChange={(e) => setNewPortfolio({...newPortfolio, isFeatured: e.target.checked})}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                 />
                 <label htmlFor="isFeatured" className="text-xs font-black text-indigo-900 uppercase tracking-tight cursor-pointer">Mark as Featured Item</label>
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-indigo-600 hover:shadow-xl transition-all active:scale-95 shadow-xl shadow-slate-100"
              >
                Publish Portfolio item
              </button>
            </form>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default Portfolios;
