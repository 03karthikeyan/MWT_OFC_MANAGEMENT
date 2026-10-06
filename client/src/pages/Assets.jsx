import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyAssets,
  getAllAssets,
  addAsset,
  allocateAsset,
  deleteAsset,
  getUsers,
} from '../services/api';
import {
  HiOutlineComputerDesktop,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineTag,
  HiOutlineUserPlus,
  HiOutlineCheckBadge,
  HiOutlineWrenchScrewdriver,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const Assets = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // Forms
  const [newAsset, setNewAsset] = useState({
    name: '',
    category: 'Laptop',
    assetTag: '',
    serialNumber: '',
    specifications: '',
    condition: 'Good',
    assignedTo: '',
  });

  const [allocateData, setAllocateData] = useState({
    assignedTo: '',
    condition: 'Good',
  });

  const fetchAssetsList = async () => {
    try {
      setLoading(true);
      const res = isAdmin ? await getAllAssets() : await getMyAssets();
      setAssets(res.data.assets || []);
    } catch (err) {
      console.error('Error fetching assets:', err);
      toast.error('Failed to load asset records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetsList();
    if (isAdmin) {
      getUsers().then((res) => setTeamMembers(res.data.users || [])).catch(() => {});
    }
  }, [isAdmin]);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.assetTag) {
      toast.error('Asset Name and Asset Tag are required');
      return;
    }

    try {
      const res = await addAsset(newAsset);
      toast.success('Asset registered successfully!');
      setAssets((prev) => [res.data.asset, ...prev]);
      setShowAddModal(false);
      setNewAsset({
        name: '',
        category: 'Laptop',
        assetTag: '',
        serialNumber: '',
        specifications: '',
        condition: 'Good',
        assignedTo: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register asset');
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedAsset) return;

    try {
      const res = await allocateAsset(selectedAsset._id, {
        assignedTo: allocateData.assignedTo || null,
        condition: allocateData.condition,
        status: allocateData.assignedTo ? 'allocated' : 'available',
      });
      toast.success(allocateData.assignedTo ? 'Asset assigned to employee' : 'Asset returned to stock');
      setAssets((prev) => prev.map((a) => (a._id === selectedAsset._id ? res.data.asset : a)));
      setShowAllocateModal(false);
      setSelectedAsset(null);
    } catch (err) {
      toast.error('Failed to update asset allocation');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;
    try {
      await deleteAsset(id);
      toast.success('Asset removed');
      setAssets((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      toast.error('Failed to delete asset');
    }
  };

  const filteredAssets = assets.filter((a) => {
    if (filterCategory !== 'all' && a.category !== filterCategory) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = a.name?.toLowerCase().includes(q);
      const matchTag = a.assetTag?.toLowerCase().includes(q);
      const matchSerial = a.serialNumber?.toLowerCase().includes(q);
      const matchAssignee = a.assignedTo?.name?.toLowerCase().includes(q);
      if (!matchName && !matchTag && !matchSerial && !matchAssignee) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Hardware & Infrastructure Inventory
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assets & Hardware Register</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Maintain hardware serials, company laptops, peripherals, and staff assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssetsList}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all"
            title="Refresh"
          >
            <HiOutlineArrowPath className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
            >
              <HiOutlinePlus className="w-4 h-4" />
              Register New Asset
            </button>
          )}
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <HiOutlineComputerDesktop className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inventory</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{assets.length} Units</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <HiOutlineCheckBadge className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allocated in Use</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {assets.filter((a) => a.status === 'allocated').length} Units
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <HiOutlineTag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Stock / Available</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {assets.filter((a) => a.status === 'available').length} Units
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <HiOutlineWrenchScrewdriver className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Maintenance</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {assets.filter((a) => a.status === 'maintenance' || a.condition === 'Fair' || a.condition === 'Poor').length} Units
            </h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'allocated', 'available', 'maintenance'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                filterStatus === st ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Search by tag, name, or employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Assets Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Hardware Registry...</p>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8">
          <HiOutlineComputerDesktop className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">No Assets Recorded</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Register laptops, test smartphones, or accessories to track company hardware allocations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => (
            <div
              key={asset._id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {asset.category}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      asset.status === 'allocated'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 mb-1">{asset.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold mb-3">
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[10px] font-bold">
                    TAG: {asset.assetTag}
                  </span>
                  {asset.serialNumber && (
                    <span className="font-mono text-[10px]">S/N: {asset.serialNumber}</span>
                  )}
                </div>

                {asset.specifications && (
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed">
                    {asset.specifications}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Holder</p>
                  <p className="font-bold text-slate-800">
                    {asset.assignedTo ? asset.assignedTo.name : 'In Warehouse'}
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedAsset(asset);
                        setAllocateData({
                          assignedTo: asset.assignedTo?._id || '',
                          condition: asset.condition || 'Good',
                        });
                        setShowAllocateModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Assign / Return"
                    >
                      <HiOutlineUserPlus className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset._id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete Asset"
                    >
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Register New Hardware Asset</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Asset Name / Model *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro M3 16GB / Dell UltraSharp 27"
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Asset Tag (Barcode ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AST-0091"
                    value={newAsset.assetTag}
                    onChange={(e) => setNewAsset({ ...newAsset, assetTag: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newAsset.category}
                    onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Laptop">Laptop / Notebook</option>
                    <option value="Desktop">Desktop Workstation</option>
                    <option value="Monitor">External Monitor</option>
                    <option value="Mobile">Testing Mobile Device</option>
                    <option value="Keyboard & Mouse">Peripherals</option>
                    <option value="Other">Other Hardware</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. C02G8192MD6T"
                  value={newAsset.serialNumber}
                  onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Specifications & Remarks
                </label>
                <textarea
                  rows="2"
                  placeholder="512GB SSD, 16GB RAM, Retina Display..."
                  value={newAsset.specifications}
                  onChange={(e) => setNewAsset({ ...newAsset, specifications: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assign to Employee (Optional)
                </label>
                <select
                  value={newAsset.assignedTo}
                  onChange={(e) => setNewAsset({ ...newAsset, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Keep in Warehouse Stock</option>
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.jobRole || m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation / Return Modal */}
      {showAllocateModal && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-black text-slate-900">Manage Allocation</h3>
                <p className="text-xs text-slate-400 font-bold">{selectedAsset.name} ({selectedAsset.assetTag})</p>
              </div>
              <button onClick={() => setShowAllocateModal(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Assignee
                </label>
                <select
                  value={allocateData.assignedTo}
                  onChange={(e) => setAllocateData({ ...allocateData, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Return to Stock (De-allocate)</option>
                  {teamMembers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.jobRole || m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Hardware Condition
                </label>
                <select
                  value={allocateData.condition}
                  onChange={(e) => setAllocateData({ ...allocateData, condition: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Excellent">Brand New / Excellent</option>
                  <option value="Good">Good Working Condition</option>
                  <option value="Fair">Fair / Minor Scratches</option>
                  <option value="Damaged">Needs Repair / Damaged</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
