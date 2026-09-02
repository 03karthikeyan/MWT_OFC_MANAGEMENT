import { useState, useEffect, useRef } from 'react';
import { getUsers, addUser, deleteUser, updateUser, generatePayslip, getUserPayslips, removePayslip } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlinePlus, 
  HiOutlineTrash, 
  HiOutlineXMark, 
  HiOutlineUsers, 
  HiOutlinePencilSquare, 
  HiOutlineDocumentText,
  HiOutlineIdentification,
  HiOutlineCalendar,
  HiOutlinePrinter,
  HiOutlinePhoto,
  HiOutlineCalculator
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import html2canvas from 'html2canvas';

// Import images
import headerImg from '@/assets/header.jpg';
import footerImg from '@/assets/footer.png';

const Members = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // 'general' or 'payslips'
  const printRef = useRef(null);

  const jobRoleColors = {
    Developer: 'bg-blue-50 text-blue-600 border-blue-100',
    HR: 'bg-rose-50 text-rose-600 border-rose-100',
    CEO: 'bg-amber-50 text-amber-600 border-amber-100',
    Manager: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    Designer: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Flutter Developer': 'bg-cyan-50 text-cyan-600 border-cyan-100',
    'Team Leader': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
    Accounts: 'bg-slate-100 text-slate-700 border-slate-200',
    Staff: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  
  // Member Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'user',
    jobRole: 'Staff',
    employeeId: '',
    contact: '',
    department: 'IT',
    dateOfJoining: new Date().toISOString().split('T')[0],
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
    canManageInternships: false,
    canManageEnquiries: false,
    canManageLeads: false,
    status: 'enquiry',
  });

  // Payslip Form State
  const [payslipData, setPayslipData] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    daysPayable: 30,
    hrSignatory: 'CHANDRU S',
    earnings: { basicSalary: 0, houseRentAllowance: 0, specialAllowance: 0, leaveTravelAllowance: 0, medicalAllowance: 0 },
    deductions: { tds: 0, professionalTax: 0, pfEmployerContribution: 0, esicEmployerContribution: 0, salaryDeduction: 0 }
  });

  const [userPayslips, setUserPayslips] = useState([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data?.users || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPayslips = async (userId) => {
    setLoadingPayslips(true);
    try {
      const res = await getUserPayslips(userId);
      setUserPayslips(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load payslip history');
    } finally {
      setLoadingPayslips(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        const res = await updateUser(currentUser._id, formData);
        toast.success(`${formData.name} updated successfully`);
        setCurrentUser(res.data.user); // Update current selected user with fresh database data
      } else {
        await addUser(formData);
        toast.success('Account initialized successfully');
      }
      // Don't close modal immediately if editing, allow viewing payslips with new data
      // but if user wants it closed, we can. For now, let's just refresh list.
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed');
    }
  };

  const handleAddPayslip = async (e) => {
    e.preventDefault();
    try {
      const grossPay = Object.values(payslipData.earnings).reduce((a, b) => Number(a) + Number(b), 0);
      const totalDeductions = Object.values(payslipData.deductions).reduce((a, b) => Number(a) + Number(b), 0);
      const netSalary = grossPay - totalDeductions;

      await generatePayslip(currentUser._id, { 
        ...payslipData, 
        month: `${payslipData.month} ${new Date().getFullYear()}`,
        grossPay, 
        totalDeductions, 
        netSalary 
      });
      toast.success('Official Payslip Generated');
      loadUserPayslips(currentUser._id);
    } catch (err) {
      toast.error('Generation failed');
    }
  };

  const handleDeletePayslip = async (id) => {
    if (window.confirm('Erase this financial record?')) {
      try {
        await removePayslip(id);
        toast.success('Record Deleted');
        loadUserPayslips(currentUser._id);
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Permanently remove this member from the database?')) {
      try {
        await deleteUser(id);
        toast.success('Member removed');
        loadUsers();
      } catch (err) {
        toast.error(err.response?.data?.message || 'System error');
      }
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await updateUser(userId, { status: newStatus });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: newStatus } : u));
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleEdit = (user) => {
    setIsEdit(true);
    setCurrentUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      username: user.username,
      password: '',
      role: user.role,
      jobRole: user.jobRole || 'Staff',
      employeeId: user.employeeId || '',
      contact: user.contact || '',
      department: user.department || 'IT',
      dateOfJoining: user.dateOfJoining ? new Date(user.dateOfJoining).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      bankName: user.bankName || '',
      bankAccountNo: user.bankAccountNo || '',
      ifscCode: user.ifscCode || '',
      canManageInternships: user.canManageInternships || false,
      canManageEnquiries: user.canManageEnquiries || false,
      canManageLeads: user.canManageLeads || false,
      status: user.status || 'enquiry',
    });
    setActiveTab('general');
    loadUserPayslips(user._id);
    setShowModal(true);
  };

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    const toastId = toast.loading('Exporting High-Res Statement...');
    try {
        const canvas = await html2canvas(printRef.current, {
            useCORS: true,
            scale: 3,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: true,
            scrollY: 0,
            windowHeight: printRef.current.scrollHeight,
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.download = `MediaWave_Payslip_${selectedPayslip.month.replace(' ', '_')}.jpg`;
        link.click();
        toast.success('Downloaded Successfully', { id: toastId });
    } catch (err) {
        toast.error('Export failed. Use Print instead.', { id: toastId });
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    const toastId = toast.loading('Generating PDF...');
    try {
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(printRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        scrollY: 0,
        windowHeight: printRef.current.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MediaWave_Payslip_${selectedPayslip.month.replace(' ', '_')}.pdf`);
      toast.success('PDF Exported Successfully', { id: toastId });
    } catch (err) {
      toast.error('PDF Generation failed.', { id: toastId });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', username: '', password: '', role: 'user', jobRole: 'Staff', employeeId: '', contact: '', department: 'IT', dateOfJoining: new Date().toISOString().split('T')[0], bankName: '', bankAccountNo: '', ifscCode: '', canManageInternships: false, canManageEnquiries: false, canManageLeads: false, status: 'enquiry' });
    setIsEdit(false);
    setCurrentUser(null);
    setActiveTab('general');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Database...</p>
    </div>
  );

  return (
    <div className="space-y-6 px-2 md:px-0 relative min-h-screen">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .print-wrapper, .print-wrapper * { visibility: visible; }
          .print-wrapper { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fade-in space-y-6 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Team <span className="text-indigo-600">Database</span></h1>
            <p className="text-slate-500 mt-1 font-medium italic">Manage official records and financial documents.</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
          >
            <HiOutlinePlus className="w-5 h-5" />
            Add Member
          </button>
        </div>

        <div className="glass-card shadow-xl shadow-indigo-900/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Member Identity</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden md:table-cell">Emp ID</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Permission</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-indigo-50/20 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-3xl bg-white shadow-xl shadow-indigo-100/50 flex items-center justify-center text-indigo-600 font-black border border-slate-100 overflow-hidden text-lg">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{user.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${jobRoleColors[user.jobRole] || jobRoleColors.Staff}`}>
                              {user.jobRole || 'Staff'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold truncate tracking-widest">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 hidden md:table-cell">
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 tracking-widest">
                        {user.employeeId || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <select
                        value={user.status || 'enquiry'}
                        onChange={(e) => handleStatusChange(user._id, e.target.value)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer transition-all ${
                          user.status === 'joined' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-2 focus:ring-emerald-200' :
                          user.status === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-2 focus:ring-rose-200' :
                          'bg-amber-50 text-amber-700 border-amber-200 focus:ring-2 focus:ring-amber-200'
                        }`}
                      >
                        <option value="enquiry">Enquiry</option>
                        <option value="joined">Joined</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-slate-600 border-slate-100'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                         <button
                          onClick={() => handleEdit(user)}
                          className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                          title="View Profile/Payslips"
                        >
                          <HiOutlinePencilSquare className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Delete User"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 bg-slate-900/90 backdrop-blur-xl overflow-y-auto no-print">
          <div className="bg-white rounded-[32px] w-full max-w-4xl shadow-2xl relative border border-white/20 fade-in my-4 flex flex-col overflow-hidden max-h-[95vh]">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-3xl bg-slate-900 flex items-center justify-center text-white shadow-2xl">
                  {currentUser?.profilePicture ? (
                      <img src={currentUser.profilePicture} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                      <HiOutlineUsers className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {isEdit ? currentUser?.name : 'Create Account'}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {activeTab === 'general' ? 'Core Identity & Payroll Config' : 'Distributed Document History'}
                      </p>
                      {isEdit && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Tabs */}
            {isEdit && (
              <div className="px-8 flex items-center gap-10 border-b border-slate-50 shrink-0 bg-slate-50/30">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`py-5 text-xs font-black tracking-[0.2em] uppercase transition-all relative ${
                    activeTab === 'general' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  General Profile
                  {activeTab === 'general' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full animate-in slide-in-from-left duration-300"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('payslips')}
                  className={`py-5 text-xs font-black tracking-[0.2em] uppercase transition-all relative ${
                    activeTab === 'payslips' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Statement History
                  {activeTab === 'payslips' && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-full animate-in slide-in-from-left duration-300"></div>}
                </button>
              </div>
            )}

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
              {activeTab === 'general' ? (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Legal Full Name</label>
                      <div className="relative group">
                        <HiOutlineIdentification className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                        <input
                          type="text"
                          required
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-12 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700"
                          placeholder="Employee Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Official ID</label>
                       <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-indigo-700"
                        placeholder="MWT-XX-XXXX"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Username</label>
                      <input
                        type="text"
                        required
                        disabled={isEdit}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700 disabled:opacity-40"
                        placeholder="johndoe"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        {isEdit ? 'Update Password (Leave blank to keep)' : 'Initial Credential'}
                      </label>
                      <input
                        type="password"
                        required={!isEdit}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Department</label>
                       <input
                        type="text"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700"
                        placeholder="e.g. IT, Design, Flutter"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Role</label>
                       <select
                         className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700"
                         value={formData.jobRole}
                         onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                       >
                           {Object.keys(jobRoleColors).map(role => (
                               <option key={role} value={role}>{role}</option>
                           ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Permission Tier</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="admin">ADMIN (MANAGER ACCESS)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Lifecycle Status</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="enquiry">ENQUIRY</option>
                            <option value="joined">JOINED</option>
                            <option value="rejected">REJECTED</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Corporate Email</label>
                       <input
                        type="email"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700"
                        placeholder="member@mediawave.tech"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Commencement Date</label>
                       <input
                        type="date"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700"
                        value={formData.dateOfJoining}
                        onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Special Permissions</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div 
                          onClick={() => setFormData({ ...formData, canManageInternships: !formData.canManageInternships })}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-4 cursor-pointer active:scale-[0.98] ${formData.canManageInternships ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                        >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${formData.canManageInternships ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                                {formData.canManageInternships && <span className="text-[10px]">✓</span>}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Internships</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Manage applications access</p>
                            </div>
                        </div>

                        <div 
                          onClick={() => setFormData({ ...formData, canManageEnquiries: !formData.canManageEnquiries })}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-4 cursor-pointer active:scale-[0.98] ${formData.canManageEnquiries ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                        >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${formData.canManageEnquiries ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                                {formData.canManageEnquiries && <span className="text-[10px]">✓</span>}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Enquiries</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Full access to client enquiries</p>
                            </div>
                        </div>

                        <div 
                          onClick={() => setFormData({ ...formData, canManageLeads: !formData.canManageLeads })}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-4 cursor-pointer active:scale-[0.98] ${formData.canManageLeads ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 opacity-60'}`}
                        >
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${formData.canManageLeads ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200'}`}>
                                {formData.canManageLeads && <span className="text-[10px]">✓</span>}
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Sales Leads</p>
                                <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Full access to business leads</p>
                            </div>
                        </div>
                      </div>
                  </div>

                  {/* Financial Configuration Section */}
                  <div className="bg-indigo-50/30 p-8 rounded-[32px] border border-indigo-50/50 space-y-6">
                      <div className="flex items-center gap-3 mb-2">
                          <p className="text-xs font-black text-indigo-700 tracking-widest uppercase">Payroll & Disbursement Protocol</p>
                          <div className="flex-1 h-px bg-indigo-100"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Bank Name</label>
                           <input
                            type="text"
                            className="w-full bg-white border border-indigo-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all text-sm font-black text-slate-900"
                            placeholder="e.g. Canara Bank"
                            value={formData.bankName}
                            onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Number</label>
                           <input
                            type="text"
                            className="w-full bg-white border border-indigo-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all text-sm font-black text-slate-900"
                            placeholder="772XXXXXXXXX"
                            value={formData.bankAccountNo}
                            onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">IFSC Code</label>
                           <input
                            type="text"
                            className="w-full bg-white border border-indigo-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 transition-all text-sm font-black text-slate-900 uppercase"
                            placeholder="CNRB000XXXX"
                            value={formData.ifscCode}
                            onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                          />
                        </div>
                      </div>
                  </div>

                  <div className="pt-4 sticky bottom-0 bg-white py-4 border-t border-slate-50">
                    <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-3xl text-sm font-black shadow-2xl shadow-indigo-200 uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all active:scale-[0.99]">
                      {isEdit ? 'Sync & Update Profile' : 'Initialize Member Account'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-10 min-h-[500px]">
                  {/* Generation Suite */}
                  <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><HiOutlineCalculator className="w-40 h-40 text-slate-900 -rotate-12" /></div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                      Salary Issuance Suite (FY 2026)
                    </h3>
                    <form onSubmit={handleAddPayslip} className="space-y-8 relative z-10">
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filing Period</label>
                            <select className="input-field py-3.5 text-xs font-black bg-white" value={payslipData.month} onChange={(e) => setPayslipData({ ...payslipData, month: e.target.value })}>
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Billable Days</label>
                            <input type="number" className="input-field py-3.5 text-xs font-black bg-white" value={payslipData.daysPayable} onChange={(e) => setPayslipData({ ...payslipData, daysPayable: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authorized Head</label>
                            <input type="text" className="input-field py-3.5 text-xs font-black bg-white" value={payslipData.hrSignatory} onChange={(e) => setPayslipData({ ...payslipData, hrSignatory: e.target.value })} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-8 bg-white/60 backdrop-blur-sm rounded-[32px] border border-white">
                        <div className="space-y-5">
                            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pb-3 border-b border-indigo-100 flex justify-between">Earnings (Credits) <span>(+)</span></h4>
                            {Object.entries({
                                basicSalary: 'Basic Compensation',
                                houseRentAllowance: 'Rental Allowance',
                                specialAllowance: 'Special Component',
                                leaveTravelAllowance: 'LTA Program',
                                medicalAllowance: 'Healthcare Reimb.'
                            }).map(([key, label]) => (
                                <div key={key} className="flex items-center justify-between gap-6">
                                    <label className="text-[10px] font-black text-slate-500 uppercase leading-none">{label}</label>
                                    <input type="number" className="w-28 text-right bg-slate-50/80 border-none rounded-xl text-xs font-black p-2.5 focus:ring-2 focus:ring-indigo-600 transition-all" value={payslipData.earnings[key]} onChange={(e) => setPayslipData({ ...payslipData, earnings: { ...payslipData.earnings, [key]: e.target.value } })} />
                                </div>
                            ))}
                        </div>
                        <div className="space-y-5">
                            <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest pb-3 border-b border-rose-100 flex justify-between">Deductions (Debits) <span>(-)</span></h4>
                            {Object.entries({
                                tds: 'Tax Deducted (TDS)',
                                professionalTax: 'Prof. Privilege Tax',
                                pfEmployerContribution: 'EPF Scheme',
                                esicEmployerContribution: 'ESIC Scheme',
                                salaryDeduction: 'Adjustment/Misc'
                            }).map(([key, label]) => (
                                <div key={key} className="flex items-center justify-between gap-6">
                                    <label className="text-[10px] font-black text-slate-500 uppercase leading-none">{label}</label>
                                    <input type="number" className="w-28 text-right bg-slate-50/80 border-none rounded-xl text-xs font-black p-2.5 focus:ring-2 focus:ring-rose-600 transition-all font-mono" value={payslipData.deductions[key]} onChange={(e) => setPayslipData({ ...payslipData, deductions: { ...payslipData.deductions, [key]: e.target.value } })} />
                                </div>
                            ))}
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-2xl">
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
                        <div className="text-center md:text-left relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 opacity-50">Net Disbursement Amount</p>
                            <p className="text-4xl font-black text-white tracking-tighter">₹ {(
                                Object.values(payslipData.earnings).reduce((a, b) => Number(a) + Number(b), 0) - 
                                Object.values(payslipData.deductions).reduce((a, b) => Number(a) + Number(b), 0)
                            ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <button type="submit" className="w-full md:w-auto px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 hover:text-slate-900 transition-all shadow-indigo-900/50 relative z-10 active:scale-95">
                           Issue Statement
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Archives List */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                      <HiOutlineCalendar className="w-5 h-5 text-indigo-600" />
                      Archives: Financial Year 2026
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {loadingPayslips ? (
                        <p className="col-span-2 text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Accessing Vault...</p>
                      ) : userPayslips.length === 0 ? (
                        <div className="col-span-2 py-20 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center gap-2">
                           <HiOutlineDocumentText className="w-12 h-12 text-slate-200" />
                           <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No historical data found</p>
                        </div>
                      ) : (
                        userPayslips.map((slip) => (
                          <div key={slip._id} className="p-6 bg-white border border-slate-100 rounded-[32px] group hover:border-indigo-500/20 hover:shadow-2xl hover:shadow-indigo-900/5 transition-all cursor-pointer ring-0 hover:ring-8 hover:ring-indigo-50/30 flex items-center justify-between" onClick={() => { setSelectedPayslip(slip); setShowViewModal(true); }}>
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                                    <HiOutlineDocumentText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{slip.month}</p>
                                    <p className="text-[10px] font-black text-indigo-600 mt-1 uppercase">₹ {slip.summary.netSalary.toLocaleString()}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                <button className="p-2.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl" title="Detailed View"><HiOutlinePencilSquare className="w-5 h-5"/></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeletePayslip(slip._id); }} className="p-2.5 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-xl" title="Delete Permanent"><HiOutlineTrash className="w-5 h-5"/></button>
                             </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* High-Fidelity Payslip Viewer (Same as Payslips.jsx) */}
      {showViewModal && selectedPayslip && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-slate-900/90 backdrop-blur-xl no-print-backdrop">
          <div className="w-full sm:max-w-4xl min-h-screen sm:min-h-0 sm:my-2 bg-white sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative max-h-[98vh]">
            
            {/* Control Header */}
            <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 shrink-0 no-print gap-4">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                      <HiOutlineDocumentText className="w-5 h-5" />
                  </div>
                  <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedPayslip.month}</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentUser?.name}</p>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={handleDownloadImage} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                      <HiOutlinePhoto className="w-4 h-4" /> Export JPG
                  </button>
                  <button onClick={handleDownloadPDF} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg active:scale-95">
                      <HiOutlinePrinter className="w-4 h-4" /> Export PDF
                  </button>
                  <button onClick={() => setShowViewModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-slate-900 border border-slate-100 transition-all">
                      <HiOutlineXMark className="w-6 h-6" />
                  </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto print:overflow-visible bg-white custom-scrollbar print-wrapper">
              <div ref={printRef} className="bg-white mx-auto print:mx-0 p-0" style={{ width: '210mm', minHeight: '297mm', position: 'relative' }}>
                  
                  {/* Letterhead Header */}
                  <div className="w-full">
                      <img src={headerImg} alt="Header" className="w-full object-contain" />
                  </div>

                  <div className="px-[60px] py-10 space-y-10 text-left">
                      <div className="text-center space-y-2">
                          <h2 className="text-[26px] font-black text-black border-b-[4px] border-black inline-block px-14 pb-1 uppercase tracking-[0.05em]">Pay Slip</h2>
                          <p className="text-[16px] font-black text-slate-700 uppercase tracking-[0.4em]">{selectedPayslip.month}</p>
                      </div>

                      <table className="w-full border-collapse border-[2.5px] border-black text-[13px] table-fixed">
                          <tbody>
                              {[
                                  ['Employee Name', currentUser?.name],
                                  ['Position Held', currentUser?.jobRole],
                                  ['Division', currentUser?.department || 'IT'],
                                  ['Commencement Date', currentUser?.dateOfJoining ? new Date(currentUser.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NOT SPECIFIED'],
                                  ['Employee Identifier', currentUser?.employeeId || 'MWT-19-0126'],
                                  ['Bank Name', currentUser?.bankName || 'Not Provided'],
                                  ['Bank Account No', currentUser?.bankAccountNo || 'Not Provided'],
                                  ['IFSC Code', currentUser?.ifscCode || 'Not Provided'],
                                  ['Billable Days', selectedPayslip.daysPayable || '30']
                              ].map(([label, value]) => (
                                  <tr key={label}>
                                      <td className="border border-black p-3 font-black w-[250px] uppercase tracking-tight bg-slate-50 text-black">{label}</td>
                                      <td className="border border-black p-3 uppercase font-medium text-black">{value}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>

                      <table className="w-full border-collapse border-[2.5px] border-black text-[13px] table-fixed">
                          <thead>
                               <tr className="bg-slate-100 uppercase">
                                  <th className="border border-black p-3.5 text-left font-black w-1/4 tracking-tighter">Earnings (Credits)</th>
                                  <th className="border border-black p-3.5 text-center w-1/4 tracking-tighter">Amount (INR)</th>
                                  <th className="border border-black p-3.5 text-left font-black w-1/4 tracking-tighter">Deductions (Debits)</th>
                                  <th className="border border-black p-3.5 text-center w-1/4 tracking-tighter">Amount (INR)</th>
                               </tr>
                          </thead>
                          <tbody>
                              {[
                                  ['basicSalary', 'Basic Salary', 'tds', 'TDS'],
                                  ['houseRentAllowance', 'House Rent Allowance', 'professionalTax', 'Professional Tax'],
                                  ['specialAllowance', 'Special Allowance', 'pfEmployerContribution', 'PF Employer Contribution'],
                                  ['leaveTravelAllowance', 'Leave & Travel Allowance', 'esicEmployerContribution', 'ESIC Employer Contribution'],
                                  ['medicalAllowance', 'Medical Allowance', 'salaryDeduction', 'Salary Deduction']
                              ].map(([eK, eL, dK, dL], idx) => (
                                  <tr key={idx}>
                                      <td className="border border-black p-3 uppercase text-black font-semibold bg-white">{eL}</td>
                                      <td className="border border-black p-3 text-center font-black bg-white">
                                          {selectedPayslip.earnings[eK] > 0 ? Number(selectedPayslip.earnings[eK]).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                      </td>
                                      <td className="border border-black p-3 uppercase text-black font-semibold bg-white">{dL}</td>
                                      <td className="border border-black p-3 text-center font-black bg-white">
                                          {selectedPayslip.deductions[dK] > 0 ? Number(selectedPayslip.deductions[dK]).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
                                      </td>
                                  </tr>
                              ))}
                              <tr className="font-black bg-slate-50 uppercase tracking-widest text-[11px]">
                                  <td className="border border-black p-3.5 text-left">Gross Total (A)</td>
                                  <td className="border border-black p-3.5 text-center">{Number(selectedPayslip.summary.grossPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  <td className="border border-black p-3.5 text-left">Net Deductions (B)</td>
                                  <td className="border border-black p-3.5 text-center">{Number(selectedPayslip.summary.totalDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="font-black uppercase bg-slate-900 text-white">
                                  <td className="border border-black p-4 tracking-[0.1em] text-left">Net Disbursement (A-B)</td>
                                  <td className="border border-black p-4 text-center text-lg">{Number(selectedPayslip.summary.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                  <td className="border border-black bg-white" colSpan={2}></td>
                                </tr>
                          </tbody>
                      </table>

                      <div className="pt-24 pb-12">
                          <div className="text-[14px] text-black text-left max-w-sm">
                              <p className="font-black italic mb-20 opacity-90">Sincerely Yours,</p>
                              <div className="space-y-1">
                                  <p className="font-black uppercase tracking-widest border-b-[3.5px] border-black pb-1.5 inline-block min-w-[250px]">
                                      {selectedPayslip.hrSignatory || 'CHANDRU S'}
                                  </p>
                                  <p className="font-black text-slate-800 pt-1 uppercase text-[12px] tracking-widest">Authorized Head of HR Department</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="w-full mt-auto">
                      <img src={footerImg} alt="Footer" className="w-full object-contain" />
                  </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
