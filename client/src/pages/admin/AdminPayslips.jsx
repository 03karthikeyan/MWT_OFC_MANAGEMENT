import { useState, useEffect, useRef } from 'react';
import { getUsers, generatePayslip, getUserPayslips, removePayslip } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineDocumentText, 
  HiOutlineTrash, 
  HiOutlineXMark, 
  HiOutlinePlus, 
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineCalculator,
  HiOutlinePrinter,
  HiOutlinePhoto
} from 'react-icons/hi2';
import html2canvas from 'html2canvas';

// Import images to ensure Vite path resolution
import headerImg from '@/assets/header.jpg';
import footerImg from '@/assets/footer.png';

const AdminPayslips = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [payslipHistory, setPayslipHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSlip, setViewingSlip] = useState(null);
  const printRef = useRef(null);

  const [payslipData, setPayslipData] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    daysPayable: 30,
    hrSignatory: 'CHANDRU S',
    commencementDate: '',
    earnings: { basicSalary: 0, houseRentAllowance: 0, specialAllowance: 0, leaveTravelAllowance: 0, medicalAllowance: 0 },
    deductions: { tds: 0, professionalTax: 0, pfEmployerContribution: 0, esicEmployerContribution: 0, salaryDeduction: 0 }
  });

  const MONTHS_LIST = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    if (selectedUser && payslipData.month) {
        const joinDate = selectedUser.dateOfJoining ? new Date(selectedUser.dateOfJoining) : new Date();
        const year = new Date().getFullYear();
        const monthIndex = MONTHS_LIST.indexOf(payslipData.month);
        
        if (monthIndex !== -1) {
            // Create a new date using the selected month and year, but preserving the user's joining day
            const newDate = new Date(year, monthIndex, joinDate.getDate());
            setPayslipData(prev => ({ ...prev, commencementDate: newDate.toISOString().split('T')[0] }));
        }
    }
  }, [payslipData.month, selectedUserId]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      const userList = users.find(u => u._id === selectedUserId);
      setSelectedUser(userList);
      loadHistory(selectedUserId);
    } else {
      setSelectedUser(null);
      setPayslipHistory([]);
    }
  }, [selectedUserId, users]);

  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load team list');
    }
  };

  const loadHistory = async (userId) => {
    setLoading(true);
    try {
      const res = await getUserPayslips(userId);
      setPayslipHistory(res.data || []);
    } catch (err) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return toast.error('Please select an employee first');

    try {
        const grossPay = Object.values(payslipData.earnings).reduce((a, b) => Number(a) + Number(b), 0);
        const totalDeductions = Object.values(payslipData.deductions).reduce((a, b) => Number(a) + Number(b), 0);
        const netSalary = grossPay - totalDeductions;

        await generatePayslip(selectedUserId, { 
          ...payslipData, 
          month: `${payslipData.month} ${new Date().getFullYear()}`,
          grossPay, 
          totalDeductions, 
          netSalary 
        });
        
        toast.success(`Payslip generated for ${selectedUser.name}`);
        loadHistory(selectedUserId);
    } catch (err) {
        toast.error('Generation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this record forever?')) {
        try {
            await removePayslip(id);
            toast.success('Record deleted');
            loadHistory(selectedUserId);
        } catch (err) {
            toast.error('Delete failed');
        }
    }
  };

  const handleView = (slip) => {
    loadUsers(); // Force refresh user list to get latest bank details
    setViewingSlip(slip);
    setShowViewModal(true);
  };

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    const toastId = toast.loading('Generating High-Res Image...');
    try {
        const canvas = await html2canvas(printRef.current, {
            useCORS: true,
            scale: 3,
            backgroundColor: '#ffffff',
            logging: false,
            allowTaint: true
        });
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.download = `AdminExport_MediaWave_${viewingSlip.month.replace(' ', '_')}.jpg`;
        link.click();
        toast.success('Export Successful', { id: toastId });
    } catch (err) {
        toast.error('Export failed. Use Print instead.', { id: toastId });
    }
  };

  return (
    <div className="space-y-8 fade-in h-screen overflow-y-auto custom-scrollbar no-print-scroll pb-20">
       {/* Isolation Styles for Print */}
       <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .print-wrapper, .print-wrapper * { visibility: visible; }
          .print-wrapper { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Payroll <span className="text-indigo-600">Central</span></h1>
        <p className="text-slate-500 mt-1 font-medium italic">Generate and verify official company statements.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 no-print">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 ml-1">Select Teammate</label>
            <select 
                className="input-field font-bold focus:ring-indigo-600"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
            >
                <option value="">Choose an employee...</option>
                {users.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.employeeId || 'No ID'})</option>
                ))}
            </select>
          </div>

          {selectedUser ? (
            <form onSubmit={handleGenerate} className="space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="glass-card p-8 bg-white border-2 border-indigo-50 shadow-indigo-100/50">
                    <div className="flex items-center gap-4 mb-8 pb-4 border-b border-indigo-50">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                            <HiOutlinePlus className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase">New Issuance</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedUser.name}</p>
                                <span className="text-[10px] text-slate-300">•</span>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                    Commencement: {payslipData.commencementDate ? new Date(payslipData.commencementDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : (selectedUser.dateOfJoining ? new Date(selectedUser.dateOfJoining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NOT SET')}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Month</label>
                            <select className="input-field font-bold" value={payslipData.month} onChange={(e) => setPayslipData({ ...payslipData, month: e.target.value })}>
                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Days</label>
                            <input type="number" className="input-field font-bold" value={payslipData.daysPayable} onChange={(e) => setPayslipData({ ...payslipData, daysPayable: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">HR Admin</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700 uppercase"
                                value={payslipData.hrSignatory}
                                onChange={(e) => setPayslipData({ ...payslipData, hrSignatory: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Commencement Date</label>
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-black text-slate-700"
                                value={payslipData.commencementDate}
                                onChange={(e) => setPayslipData({ ...payslipData, commencementDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                        <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest pb-2 border-b border-indigo-100">Earnings Components (+)</h4>
                             {Object.keys(payslipData.earnings).map(key => (
                                 <div key={key} className="flex items-center justify-between group">
                                     <label className="text-[10px] font-black text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                                     <input type="number" className="w-24 text-right bg-white border border-slate-200 rounded-xl text-xs font-black p-2 focus:ring-2 focus:ring-indigo-600 transition-all outline-none" value={payslipData.earnings[key]} onChange={(e) => setPayslipData({ ...payslipData, earnings: { ...payslipData.earnings, [key]: e.target.value } })} />
                                 </div>
                             ))}
                        </div>
                        <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest pb-2 border-b border-rose-100">Deductions Components (-)</h4>
                             {Object.keys(payslipData.deductions).map(key => (
                                 <div key={key} className="flex items-center justify-between group">
                                     <label className="text-[10px] font-black text-slate-500 uppercase">{key.replace(/([A-Z])/g, ' $1')}</label>
                                     <input type="number" className="w-24 text-right bg-white border border-slate-200 rounded-xl text-xs font-black p-2 focus:ring-2 focus:ring-rose-600 transition-all outline-none" value={payslipData.deductions[key]} onChange={(e) => setPayslipData({ ...payslipData, deductions: { ...payslipData.deductions, [key]: e.target.value } })} />
                                 </div>
                             ))}
                        </div>
                    </div>

                    <div className="mt-8 bg-slate-900 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
                        <div className="text-center md:text-left relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Net Compensation</p>
                            <p className="text-3xl font-black text-white">₹ {(
                                Object.values(payslipData.earnings).reduce((a, b) => Number(a) + Number(b), 0) - 
                                Object.values(payslipData.deductions).reduce((a, b) => Number(a) + Number(b), 0)
                            ).toLocaleString('en-IN')}</p>
                        </div>
                        <button type="submit" className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl relative z-10">
                           Verify & Finalize
                        </button>
                    </div>
                </div>
            </form>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 glass-card bg-slate-50 border-slate-100 border-dashed border-2">
                <HiOutlineUserGroup className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Ready for payroll processing</p>
            </div>
          )}
        </div>

        <div className="no-print">
            <div className="glass-card p-6 h-[700px] flex flex-col">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <HiOutlineCalendar className="w-5 h-5 text-indigo-600" />
                    Distributed Archives
                </h3>
                <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-2">
                    {payslipHistory.map(slip => (
                        <div key={slip._id} className="p-4 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between group hover:border-indigo-100 hover:shadow-lg transition-all cursor-pointer" onClick={() => handleView(slip)}>
                             <div>
                                <p className="text-[11px] font-black text-slate-900 uppercase">{slip.month}</p>
                                <p className="text-[10px] font-bold text-indigo-600 mt-1">₹ {slip.summary.netSalary.toLocaleString()}</p>
                             </div>
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg"><HiOutlineDocumentText className="w-5 h-5"/></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(slip._id); }} className="p-2 text-slate-400 hover:text-rose-500 bg-slate-50 rounded-lg"><HiOutlineTrash className="w-5 h-5"/></button>
                             </div>
                        </div>
                    ))}
                    {payslipHistory.length === 0 && <p className="text-center py-20 text-slate-300 font-bold uppercase tracking-[0.2em] text-[9px]">No historical data</p>}
                </div>
            </div>
        </div>
      </div>

      {showViewModal && viewingSlip && selectedUser && (
        <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/90 backdrop-blur-xl no-print-backdrop print-wrapper">
          <div className="w-full sm:max-w-4xl min-h-screen sm:min-h-0 sm:my-2 bg-white sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl relative max-h-[98vh]">
            <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 shrink-0 no-print gap-4">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                      <HiOutlineDocumentText className="w-5 h-5" />
                  </div>
                  <div>
                      <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{viewingSlip.month}</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedUser.name}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <button onClick={handleDownloadImage} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-100">
                      <HiOutlinePhoto className="w-4 h-4" /> Export JPG
                  </button>
                  <button onClick={() => window.print()} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-slate-100">
                      <HiOutlinePrinter className="w-4 h-4" /> Print
                  </button>
                  <button onClick={() => setShowViewModal(false)} className="w-10 h-10 rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><HiOutlineXMark className="w-6 h-6"/></button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-white custom-scrollbar print:overflow-visible print-section">
                <div ref={printRef} className="bg-white mx-auto print:mx-0 p-0" style={{ width: '210mm', minHeight: '297mm', position: 'relative' }}>
                    <div className="w-full"><img src={headerImg} alt="Header" className="w-full object-contain" /></div>
                    <div className="px-[60px] py-10 space-y-10">
                        <div className="text-center space-y-2">
                            <h2 className="text-[26px] font-black text-black border-b-[4px] border-black inline-block px-14 pb-1 uppercase tracking-[0.05em]">Pay Slip</h2>
                            <p className="text-[14px] font-black text-slate-700 uppercase tracking-[0.4em]">{viewingSlip.month}</p>
                        </div>
                        <table className="w-full border-collapse border-[2.5px] border-black text-[12.5px] table-fixed">
                            <tbody>
                                {[
                                    ['Employee Name', selectedUser.name],
                                    ['Position Held', selectedUser.jobRole],
                                    ['Division', selectedUser.department || 'IT'],
                                    ['Commencement Date', payslipData.commencementDate ? new Date(payslipData.commencementDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (selectedUser.dateOfJoining ? new Date(selectedUser.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NOT SPECIFIED')],
                                    ['Employee Identifier', selectedUser.employeeId || 'MWT-19-0126'],
                                    ['Bank Name', selectedUser.bankName || 'MISSING BANK DETAILS'],
                                    ['Bank Account No', selectedUser.bankAccountNo || 'MISSING BANK DETAILS'],
                                    ['IFSC Code', selectedUser.ifscCode || 'MISSING BANK DETAILS'],
                                    ['Billable Days', viewingSlip.daysPayable || '30']
                                ].map(([label, value]) => (
                                    <tr key={label}>
                                        <td className="border border-black p-3 font-black w-[250px] uppercase tracking-tight bg-slate-50 text-black">{label}</td>
                                        <td className="border border-black p-3 uppercase font-medium text-black">{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <table className="w-full border-collapse border-[2.5px] border-black text-[12.5px] table-fixed">
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
                                        <td className="border border-black p-3 text-black font-semibold bg-white">{eL}</td>
                                        <td className="border border-black p-3 text-center font-black bg-white">{viewingSlip.earnings[eK] > 0 ? Number(viewingSlip.earnings[eK]).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</td>
                                        <td className="border border-black p-3 text-black font-semibold bg-white">{dL}</td>
                                        <td className="border border-black p-3 text-center font-black bg-white">{viewingSlip.deductions[dK] > 0 ? Number(viewingSlip.deductions[dK]).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</td>
                                    </tr>
                                ))}
                                <tr className="font-black bg-slate-50 uppercase tracking-widest text-[11px]">
                                    <td className="border border-black p-3.5">Gross Total (A)</td>
                                    <td className="border border-black p-3.5 text-center">{Number(viewingSlip.summary.grossPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="border border-black p-3.5">Net Deductions (B)</td>
                                    <td className="border border-black p-3.5 text-center">{Number(viewingSlip.summary.totalDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                                <tr className="font-black uppercase bg-slate-900 text-white">
                                    <td className="border border-black p-4 tracking-[0.1em]">Net Disbursement (A-B)</td>
                                    <td className="border border-black p-4 text-center text-lg">{Number(viewingSlip.summary.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="border border-black bg-white shadow-none" colSpan={2}></td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="pt-24 pb-12">
                            <div className="text-[14px] text-black text-left max-w-sm">
                                <p className="font-black italic mb-20 opacity-90">Sincerely Yours,</p>
                                <div className="space-y-1">
                                    <p className="font-black uppercase tracking-widest border-b-[3.5px] border-black pb-1.5 inline-block min-w-[250px]">
                                        {viewingSlip.hrSignatory || 'CHANDRU S'}
                                    </p>
                                    <p className="font-black text-slate-800 pt-1 uppercase text-[12px] tracking-widest text-left">Authorized Head of HR Department</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full mt-auto"><img src={footerImg} alt="Footer" className="w-full object-contain" /></div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayslips;
