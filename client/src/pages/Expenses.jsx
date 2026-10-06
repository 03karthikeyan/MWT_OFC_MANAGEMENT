import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyExpenses,
  getAllExpenses,
  addExpense,
  updateExpenseStatus,
  deleteExpense
} from '../services/api';
import {
  HiOutlineReceiptPercent,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTrash,
  HiOutlineSparkles,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineBanknotes,
} from 'react-icons/hi2';
import toast from 'react-hot-toast';

const Expenses = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  // New expense modal
  const [showModal, setShowModal] = useState(false);
  const [newClaim, setNewClaim] = useState({
    title: '',
    category: 'Travel',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    receiptUrl: '',
  });

  const fetchExpensesList = async () => {
    try {
      setLoading(true);
      const res = isAdmin ? await getAllExpenses() : await getMyExpenses();
      setExpenses(res.data.expenses || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      toast.error('Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesList();
  }, [isAdmin]);

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!newClaim.title || !newClaim.amount) {
      toast.error('Please provide a title and amount');
      return;
    }

    try {
      const res = await addExpense(newClaim);
      toast.success('Expense claim submitted for approval!');
      setExpenses((prev) => [res.data.expense, ...prev]);
      setShowModal(false);
      setNewClaim({
        title: '',
        category: 'Travel',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        receiptUrl: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit claim');
    }
  };

  const handleUpdateStatus = async (id, status, reviewNote) => {
    try {
      const res = await updateExpenseStatus(id, { status, reviewNote });
      toast.success(`Expense marked as ${status}`);
      setExpenses((prev) => prev.map((e) => (e._id === id ? res.data.expense : e)));
    } catch (err) {
      toast.error('Failed to update expense status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this claim?')) return;
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    if (filterStatus !== 'all' && e.status !== filterStatus) return false;
    return true;
  });

  const totalClaimAmount = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'reimbursed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100">
            <HiOutlineSparkles className="w-3.5 h-3.5" />
            Financial & Claims Management
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expenses & Reimbursements</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Submit business travel, hardware, and office reimbursement claims with ease.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchExpensesList}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all"
            title="Refresh"
          >
            <HiOutlineArrowPath className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
          >
            <HiOutlinePlus className="w-4 h-4" />
            New Expense Claim
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
            <HiOutlineBanknotes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Filtered Value</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">₹{totalClaimAmount.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <HiOutlineReceiptPercent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Approvals</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {expenses.filter((e) => e.status === 'pending').length} Claims
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <HiOutlineCheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Settled / Reimbursed</p>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">
              {expenses.filter((e) => e.status === 'reimbursed' || e.status === 'approved').length} Claims
            </h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto custom-scrollbar">
        {['all', 'pending', 'approved', 'reimbursed', 'rejected'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
              filterStatus === st
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Expense Records...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-20 text-center p-8">
            <HiOutlineReceiptPercent className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">No Expenses Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Submit your receipts or travel bills to get started with expense reimbursement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-6">Claim Details</th>
                  {isAdmin && <th className="py-4 px-6">Employee</th>}
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredExpenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{exp.title}</p>
                      {exp.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{exp.description}</p>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {exp.userId?.name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{exp.userId?.name || 'User'}</p>
                            <p className="text-[9px] text-slate-400">{exp.userId?.employeeId || ''}</p>
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-black text-slate-900 text-sm">
                      ₹{exp.amount?.toLocaleString('en-IN')}
                    </td>

                    <td className="py-4 px-6 text-slate-500 font-medium">
                      {new Date(exp.date || exp.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusBadge(exp.status)}`}>
                        {exp.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && exp.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(exp._id, 'approved')}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold text-[11px] transition-all"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason !== null) handleUpdateStatus(exp._id, 'rejected', reason);
                              }}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold text-[11px] transition-all"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isAdmin && exp.status === 'approved' && (
                          <button
                            onClick={() => handleUpdateStatus(exp._id, 'reimbursed')}
                            className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-[11px] transition-all"
                          >
                            Mark Reimbursed
                          </button>
                        )}

                        {(isAdmin || exp.status === 'pending') && (
                          <button
                            onClick={() => handleDelete(exp._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
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

      {/* New Claim Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-900">Submit Expense Claim</h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
                <HiOutlineXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Title / Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Client Dinner / Laptop Adapter"
                  value={newClaim.title}
                  onChange={(e) => setNewClaim({ ...newClaim, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newClaim.category}
                    onChange={(e) => setNewClaim({ ...newClaim, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Travel">Travel & Fuel</option>
                    <option value="Food & Dining">Food & Dining</option>
                    <option value="Hardware & Office Supplies">Hardware & Office</option>
                    <option value="Internet / Telecom">Internet / Mobile</option>
                    <option value="Training & Courses">Training</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newClaim.amount}
                    onChange={(e) => setNewClaim({ ...newClaim, amount: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Expense Date
                </label>
                <input
                  type="date"
                  value={newClaim.date}
                  onChange={(e) => setNewClaim({ ...newClaim, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows="3"
                  placeholder="Additional context or invoice details..."
                  value={newClaim.description}
                  onChange={(e) => setNewClaim({ ...newClaim, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-3 text-slate-600 hover:bg-slate-100 rounded-2xl text-xs font-bold uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
