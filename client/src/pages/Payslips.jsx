import { useState, useEffect, useRef } from 'react';
import { fetchMyPayslips } from '@/services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineDocumentText,
  HiOutlineXMark,
  HiOutlinePlus,
  HiOutlineInformationCircle,
  HiOutlinePrinter,
  HiOutlinePhoto
} from 'react-icons/hi2';
import { useAuth } from '@/context/AuthContext';
import html2canvas from 'html2canvas';

// Import images to ensure Vite path resolution
import headerImg from '@/assets/header.jpg';
import footerImg from '@/assets/footer.png';

const Payslips = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const { user, loadUser } = useAuth();
  const printRef = useRef(null);

  useEffect(() => {
    loadPayslips();
    loadUser(); // Refresh user data to get latest commencement date/bank details
  }, []);

  const loadPayslips = async () => {
    try {
      const res = await fetchMyPayslips();
      setPayslips(res.data);
    } catch (err) {
      toast.error('Could not load your payslips');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
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

  const handleDownloadImage = async () => {
    if (!printRef.current) return;
    const toastId = toast.loading('Exporting High-Res Image...');
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
      toast.success('Successfully Downloaded', { id: toastId });
    } catch (err) {
      toast.error('Export failed. Please try "Print" instead.', { id: toastId });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Accessing Secure Vault...</p>
    </div>
  );

  return (
    <div className="space-y-8 fade-in">
      {/* Isolation Styles for Print */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .print-wrapper, .print-wrapper * { visibility: visible; }
          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Financial <span className="text-indigo-600">Records</span></h1>
          <p className="text-slate-500 mt-1 font-medium italic">Professional access to your official monthly statements.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {!showViewModal && payslips.map((slip) => (
          <div
            key={slip._id}
            className="glass-card p-6 group hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden active:scale-[0.98]"
            onClick={() => { setSelectedPayslip(slip); setShowViewModal(true); }}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                <HiOutlineDocumentText className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Verified Vault</span>
            </div>
            <div className="mt-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{slip.month}</h3>
              <p className="text-sm font-black text-indigo-600 mt-2 font-mono">₹ {slip.summary.netSalary.toLocaleString()}</p>
            </div>
          </div>
        ))}
        {payslips.length === 0 && (
          <p className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">No records found</p>
        )}
      </div>

      {showViewModal && selectedPayslip && (
        <div className="flex items-start justify-center overflow-y-auto no-print-backdrop">
          <div className="w-full sm:max-w-4xl min-h-screen sm:min-h-0 sm:my-2 bg-white sm:rounded-[32px] overflow-hidden flex flex-col  relative max-h-[98vh]">

            {/* Modal Control Header (UI only) */}
            <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50/50 shrink-0 no-print gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                  <HiOutlineDocumentText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{selectedPayslip.month}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadImage}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                >
                  <HiOutlinePhoto className="w-4 h-4" />
                  Download JPG
                </button>
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg active:scale-95"
                >
                  <HiOutlinePrinter className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-slate-400 hover:text-slate-900 border border-slate-100"
                >
                  <HiOutlineXMark className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Actual Document Section */}
            <div className="flex overflow-y-auto print:overflow-visible bg-white custom-scrollbar print-wrapper">
              <div ref={printRef} className="bg-white mx-auto print:mx-0 p-0" style={{ width: '210mm', minHeight: '297mm', position: 'relative' }}>

                {/* Letterhead Header */}
                <div className="w-full">
                  <img src={headerImg} alt="Header" className="w-full object-contain" />
                </div>

                <div className="px-[5px] md:px-[50px] pt-0 md:pt-0 py-10 space-y-10">
                  {/* Document Title */}
                  <div className="text-center space-y-2">
                    <h2 className="text-[15px] font-black text-black  inline-block px-10 pb-1 pt-1 uppercase tracking-[0.05em]">Pay Slip <span className="text-[16px] font-black bold text-slate-700 uppercase tracking-[0.4em]">{selectedPayslip.month}</span></h2>
                  </div>

                  {/* Info Table */}
                  <table className="w-full border-collapse border-[2.5px] border-black text-[13px] table-fixed">
                    <tbody>
                      {[
                        ['Employee Name', user.name],
                        ['Position Held', user.jobRole],
                        ['Division', user.department || 'IT'],
                        ['Commencement Date', selectedPayslip.commencementDate ? new Date(selectedPayslip.commencementDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : (user.dateOfJoining ? new Date(user.dateOfJoining).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'NOT SPECIFIED')],
                        ['Employee Identifier', user.employeeId || 'MWT-19-0126'],
                        ['Bank Name', user.bankName || 'Not Provided'],
                        ['Bank Account No', user.bankAccountNo || 'Not Provided'],
                        ['IFSC Code', user.ifscCode || 'Not Provided'],
                        ['Billable Days', selectedPayslip.daysPayable || '30']
                      ].map(([label, value]) => (
                        <tr key={label}>
                          <td className="border border-black p-3 font-black w-[250px] uppercase tracking-tight bg-slate-50 text-black">{label}</td>
                          <td className="border border-black p-3 uppercase font-medium text-black">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Salary Table */}
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
                        <td className="border border-black p-3.5">Gross Total (A)</td>
                        <td className="border border-black p-3.5 text-center">{Number(selectedPayslip.summary.grossPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black p-3.5">Net Deductions (B)</td>
                        <td className="border border-black p-3.5 text-center">{Number(selectedPayslip.summary.totalDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      <tr className="font-black uppercase bg-slate-900 text-white">
                        <td className="border border-black p-4 tracking-[0.1em]">Net Disbursement (A-B)</td>
                        <td className="border border-black p-4 text-center text-lg">{Number(selectedPayslip.summary.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="border border-black bg-white" colSpan={2}></td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Footer Signature Section */}
                  <div className="pt-24 pb-12">
                    <div className="text-[14px] text-black text-left max-w-sm">
                      <p className="font-black italic mb-20 opacity-90">Sincerely Yours,</p>
                      <div className="space-y-1">
                        <p className="font-black uppercase tracking-widest  pb-1.5 inline-block min-w-[250px]">
                          {selectedPayslip.hrSignatory || 'CHANDRU S'}
                        </p>
                        <p className="font-black text-slate-800 pt-1 uppercase text-[12px] tracking-widest">Head of HR Department</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Letterhead Footer */}
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

export default Payslips;
