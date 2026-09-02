import { useState, useEffect, useRef } from 'react';
import {
  getInternships,
  updateInternship,
  deleteInternship,
  getLeads,
} from '@/services/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  HiOutlineAcademicCap,
  HiOutlineUsers,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineDocumentText,
  HiOutlinePrinter,
  HiOutlineBanknotes,
  HiOutlineClipboardDocumentList,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineMagnifyingGlass,
  HiOutlineChevronDown,
  HiOutlineReceiptPercent,
} from 'react-icons/hi2';
import html2canvas from 'html2canvas';
import headerImg from '@/assets/header.jpg';
import footerImg from '@/assets/footer.png';

const STATUS_COLORS = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
};

const DOC_LABELS = {
  certificate: { label: 'Certificate', emoji: '🎓' },
  offerLetter: { label: 'Offer Letter', emoji: '📄' },
  completionLetter: { label: 'Completion Letter', emoji: '📃' },
  bill: { label: 'Bill', emoji: '🧾' },
};

// ── Bill Document Renderer ────────────────────────────────────────────────────
const BillDocument = ({ intern, billRef }) => {
  const now = intern.billDate ? new Date(intern.billDate) : new Date();
  const formattedDate = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const billNo = intern.billNumber || `MWT-BILL-${String(intern._id).slice(-6).toUpperCase()}`;

  return (
    <div ref={billRef} className="bg-white mx-auto" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'Arial, sans-serif', position: 'relative' }}>
      {/* Header */}
      <div className="w-full">
        <img src={headerImg} alt="Header" className="w-full object-contain" />
      </div>

      <div className="px-[50px] pt-6 pb-10 space-y-8">
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-[18px] font-black text-black uppercase tracking-[0.1em]">Internship Bill / Invoice</h2>
          <div className="w-24 h-[2px] bg-black mx-auto" />
        </div>

        {/* Bill Meta */}
        <table className="w-full border-collapse border-[2px] border-black text-[13px] table-fixed">
          <tbody>
            {[
              ['Bill Number', billNo],
              ['Bill Date', formattedDate],
              ['Intern Name', intern.name],
              ['Email / Contact', `${intern.email}${intern.phone ? ' | ' + intern.phone : ''}`],
              ['College / Institution', intern.college || '—'],
              ['Domain / Track', intern.domain],
              ['Internship Duration', !isNaN(intern.duration) ? `${intern.duration} ${Number(intern.duration) === 1 ? 'Month' : 'Months'}` : intern.duration],
              ['Managed By (Lead)', intern.leadManager?.name || '—'],
            ].map(([label, value]) => (
              <tr key={label}>
                <td className="border border-black p-3 font-black uppercase tracking-tight bg-slate-50 text-black w-[240px]">{label}</td>
                <td className="border border-black p-3 font-medium text-black">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Fee Table */}
        <table className="w-full border-collapse border-[2px] border-black text-[13px] table-fixed">
          <thead>
            <tr className="bg-slate-900 text-white uppercase text-[12px]">
              <th className="border border-black p-3 text-left font-black tracking-wider">#</th>
              <th className="border border-black p-3 text-left font-black tracking-wider">Description</th>
              <th className="border border-black p-3 text-center font-black tracking-wider w-[150px]">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black p-3 text-center font-black">01</td>
              <td className="border border-black p-3 font-medium">
                {intern.billDescription || `Internship Fee — ${intern.domain} (${!isNaN(intern.duration) ? `${intern.duration} ${Number(intern.duration) === 1 ? 'Month' : 'Months'}` : intern.duration})`}
              </td>
              <td className="border border-black p-3 text-center font-black">
                {Number(intern.billAmount || intern.fees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="bg-slate-50">
              <td className="border border-black p-3 text-[10px] font-black uppercase tracking-widest text-slate-500" colSpan={2}>
                Total Bill Amount
              </td>
              <td className="border border-black p-3 text-center font-black">
                ₹ {Number(intern.billAmount || intern.fees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="bg-slate-50 text-emerald-700">
              <td className="border border-black p-3 text-[10px] font-black uppercase tracking-widest" colSpan={2}>
                Amount Already Paid (-)
              </td>
              <td className="border border-black p-3 text-center font-black">
                ₹ {Number(intern.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr className="bg-slate-900 text-white font-black">
              <td className="border border-black p-4 uppercase tracking-widest font-black" colSpan={2}>
                Final Balance Due (INR)
              </td>
              <td className="border border-black p-4 text-center text-[16px]">
                ₹ {((Number(intern.billAmount || intern.fees || 0)) - (Number(intern.paidAmount || 0))).toLocaleString('en-IN', { minimumFractionDigits: 1 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Documents Issued */}
        {Object.values(intern.documents || {}).some(Boolean) && (
          <div>
            <p className="text-[13px] font-black uppercase tracking-widest text-black mb-2">Documents Issued:</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(intern.documents || {}).map(([key, val]) =>
                val ? (
                  <span key={key} className="inline-flex items-center gap-1.5 px-3 py-1 border border-black text-[12px] font-black uppercase tracking-widest">
                    {DOC_LABELS[key]?.emoji} {DOC_LABELS[key]?.label}
                  </span>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div className="flex items-center gap-3">
          <p className="text-[13px] font-black uppercase tracking-widest text-black">Payment Status:</p>
          <span className={`px-4 py-1 border-[2px] border-black text-[12px] font-black uppercase tracking-widest ${
            intern.billPaid === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 
            intern.billPaid === 'Partial' ? 'bg-amber-100 text-amber-800' : 
            intern.billPaid === 'Failed' ? 'bg-red-500 text-white' : 
            'bg-red-100 text-red-800'
          }`}>
            {intern.billPaid === 'Paid' ? '✓ PAID' : 
             intern.billPaid === 'Partial' ? '⚠ PARTIAL' : 
             intern.billPaid === 'Failed' ? '✖ FAILED' : 
             '⚠ UNPAID'}
          </span>
        </div>

        {/* Signature */}
        <div className="pt-16 pb-6">
          <div className="text-[14px] text-black text-left max-w-sm">
            <p className="font-black italic mb-16 opacity-90">Authorized Signature,</p>
            <div className="space-y-1">
              <p className="font-black uppercase tracking-widest pb-1.5 inline-block min-w-[250px] border-b-2 border-black">
                {intern.leadManager?.name || 'Authorized Signatory'}
              </p>
              <p className="font-black text-slate-700 pt-1 uppercase text-[12px] tracking-widest">
                {intern.leadManager?.jobRole || 'Internship Lead'} — MediaWave Technologies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full mt-auto">
        <img src={footerImg} alt="Footer" className="w-full object-contain" />
      </div>
    </div>
  );
};

// ── Edit / Manage Modal ─────────────────────────────────────────────────────
const ManageModal = ({ intern, users, onClose, onSave }) => {
  const [form, setForm] = useState({
    status: intern.status,
    leadManager: intern.leadManager?._id || '',
    fees: intern.fees || 0,
    notes: intern.notes || '',
    domain: intern.domain,
    duration: intern.duration,
    year: intern.year || '',
    startDate: intern.startDate ? intern.startDate.slice(0, 10) : '',
    endDate: intern.endDate ? intern.endDate.slice(0, 10) : '',
    documents: { ...{ certificate: false, offerLetter: false, completionLetter: false, bill: false }, ...(intern.documents || {}) },
    billNumber: intern.billNumber || '',
    billDate: intern.billDate ? intern.billDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
    billAmount: intern.billAmount || intern.fees || 0,
    paidAmount: intern.paidAmount || 0,
    billDescription: intern.billDescription || '',
    billPaid: intern.billPaid || 'Unpaid',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') setForm(f => ({ ...f, [name]: checked }));
    else setForm(f => ({ ...f, [name]: value }));
  };

  const handleDocToggle = (key) => setForm(f => ({ ...f, documents: { ...f.documents, [key]: !f.documents[key] } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(intern._id, form);
      toast.success('Internship updated');
      onClose();
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed top-[300px] inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Manage Intern</h3>
            <p className="text-slate-500 text-sm font-medium">{intern.name} · {intern.domain}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-900">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar flex-1">

          {/* Status, Lead & Year */}
          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Status</label>
              <div className="relative">
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 bg-white appearance-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  {['Pending', 'Active', 'Completed', 'Rejected'].map(s => <option key={s}>{s}</option>)}
                </select>
                <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Lead Manager</label>
              <div className="relative">
                <select name="leadManager" value={form.leadManager} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 bg-white appearance-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                  <option value="">— Assign Lead —</option>
                  {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.jobRole})</option>)}
                </select>
                <HiOutlineChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">College Year</label>
              <input type="text" name="year" value={form.year} onChange={handleChange}
                placeholder="e.g. 4th Year"
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>

          {/* Dates & Fees */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Duration</label>
              <input type="text" name="duration" value={form.duration} onChange={handleChange}
                placeholder="e.g. 3"
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Commencement Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Fees (₹)</label>
              <input type="number" name="fees" value={form.fees} onChange={handleChange}
                placeholder="0"
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Notes / Remarks</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
              placeholder="Internal notes..." />
          </div>

          {/* Documents */}
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Documents Given</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(DOC_LABELS).map(([key, { label, emoji }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleDocToggle(key)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${form.documents[key]
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                >
                  <span className="text-xl">{emoji}</span>
                  <span>{label}</span>
                  {form.documents[key] && <HiOutlineCheckCircle className="ml-auto w-5 h-5 text-emerald-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Bill Section */}
          <div className="bg-slate-50 rounded-2xl p-5 space-y-5 border border-slate-200">
            <h4 className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
              <HiOutlineReceiptPercent className="w-4 h-4 text-indigo-600" />
              Bill / Invoice Details
            </h4>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Bill Number</label>
                <input type="text" name="billNumber" value={form.billNumber} onChange={handleChange}
                  placeholder="MWT-BILL-001"
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Bill Date</label>
                <input type="date" name="billDate" value={form.billDate} onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Invoiced Amount (₹)</label>
                <input type="number" name="billAmount" value={form.billAmount} onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 bg-white focus:ring-2 focus:ring-indigo-100" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Amount Collected (₹)</label>
                <input type="number" name="paidAmount" value={form.paidAmount} onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-emerald-400 bg-white focus:ring-2 focus:ring-emerald-100" />
              </div>
              <div className="col-span-1 space-y-2">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Payment Status</label>
                <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
                  {['Unpaid', 'Partial', 'Paid', 'Failed'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, billPaid: s }))}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                        form.billPaid === s 
                          ? s === 'Paid' ? 'bg-emerald-500 text-white shadow-sm' 
                          : s === 'Partial' ? 'bg-amber-500 text-white shadow-sm'
                          : s === 'Failed' ? 'bg-red-500 text-white shadow-sm'
                          : 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Bill Description</label>
              <input type="text" name="billDescription" value={form.billDescription} onChange={handleChange}
                placeholder="e.g. Internship Fee — Web Development (3 Months)"
                className="w-full border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-400 bg-white focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>
        </div>

        {/* Actions - Fixed at bottom */}
        <div className="p-6 border-t border-slate-100 bg-white flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3.5 border-2 border-slate-200 rounded-2xl text-slate-700 font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Bill Preview Modal ──────────────────────────────────────────────────────
const BillModal = ({ intern, onClose }) => {
  const billRef = useRef(null);

  const handleExportPDF = async () => {
    if (!billRef.current) return;
    const toastId = toast.loading('Generating PDF...');
    try {
      const { jsPDF } = await import('jspdf');
      const canvas = await html2canvas(billRef.current, {
        useCORS: true, scale: 2, backgroundColor: '#ffffff',
        logging: false, allowTaint: true, scrollY: 0,
        windowHeight: billRef.current.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      const billNo = intern.billNumber || `MWT-${String(intern._id).slice(-6).toUpperCase()}`;
      pdf.save(`MediaWave_Internship_Bill_${billNo}.pdf`);
      toast.success('PDF Exported!', { id: toastId });
    } catch {
      toast.error('PDF generation failed.', { id: toastId });
    }
  };

  const handleExportImage = async () => {
    if (!billRef.current) return;
    const toastId = toast.loading('Generating Image...');
    try {
      const canvas = await html2canvas(billRef.current, {
        useCORS: true, scale: 2, backgroundColor: '#ffffff',
        logging: false, allowTaint: true, scrollY: 0,
        windowHeight: billRef.current.scrollHeight,
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const billNo = intern.billNumber || `MWT-${String(intern._id).slice(-6).toUpperCase()}`;
      link.download = `MediaWave_Internship_Bill_${billNo}.png`;
      link.href = imgData;
      link.click();
      toast.success('Image Exported!', { id: toastId });
    } catch {
      toast.error('Image generation failed.', { id: toastId });
    }
  };

  return (
    <div className="fixed h-[90vh] inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex flex-col" onClick={onClose}>
      {/* Top Control Bar */}
      <div className="shrink-0 p-4 flex items-center justify-between bg-slate-900/80 backdrop-blur border-b border-white/10" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <HiOutlineReceiptPercent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Internship Bill</h3>
            <p className="text-slate-400 text-xs">{intern.name} · {intern.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportImage}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            <HiOutlineDocumentText className="w-4 h-4" />
            Export Image
          </button>
          <button
            onClick={handleExportPDF}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            <HiOutlinePrinter className="w-4 h-4" />
            Export PDF
          </button>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20">
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* Document Preview */}
      <div className="flex-1 overflow-y-auto flex justify-center py-8 px-4" onClick={e => e.stopPropagation()}>
        <div className="shadow-2xl">
          <BillDocument intern={intern} billRef={billRef} />
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
const AdminInternships = () => {
  const { user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [showManage, setShowManage] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [billIntern, setBillIntern] = useState(null);

  useEffect(() => { load(); }, []);

  if (user?.role !== 'admin' && !user?.canManageInternships) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center">
          <HiOutlineXMark className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access Denied</h2>
        <p className="text-slate-500 font-medium italic">You do not have the required permissions to view intern records.</p>
      </div>
    );
  }

  const load = async () => {
    setLoading(true);
    try {
      const [iRes, uRes] = await Promise.all([getInternships(), getLeads()]);
      setInternships(Array.isArray(iRes.data) ? iRes.data : []);
      setUsers(uRes.data?.users || []);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id, data) => {
    const res = await updateInternship(id, data);
    setInternships(prev => (Array.isArray(prev) ? prev : []).map(i => i._id === id ? res.data : i));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this internship record?')) return;
    try {
      await deleteInternship(id);
      setInternships(prev => prev.filter(i => i._id !== id));
      toast.success('Record deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'College', 'Domain', 'Duration', 'Start Date', 'Status', 'Invoiced Amt', 'Paid Amt', 'Payments Status'];
    const rows = filtered.map(i => [
      i.name, i.email, i.phone || '', i.college || '', i.domain, i.duration,
      i.startDate ? new Date(i.startDate).toLocaleDateString() : '',
      i.status, i.billAmount || 0, i.paidAmount || 0, i.billPaid
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MediaWave_Internships_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filtered = (Array.isArray(internships) ? internships : []).filter(i => {
    const matchSearch = `${i.name} ${i.email} ${i.domain} ${i.college}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalInvoiced = internships.reduce((acc, i) => acc + (Number(i.billAmount) || 0), 0);
  const totalCollected = internships.reduce((acc, i) => acc + (Number(i.paidAmount) || 0), 0);

  const stats = [
    { label: 'Total Applicants', value: internships.length, icon: HiOutlineAcademicCap, bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { label: 'Total Invoiced', value: `₹${totalInvoiced.toLocaleString('en-IN')}`, icon: HiOutlineBanknotes, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Amount Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, icon: HiOutlineReceiptPercent, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Balance Pending', value: `₹${(totalInvoiced - totalCollected).toLocaleString('en-IN')}`, icon: HiOutlineClock, bg: 'bg-amber-50', text: 'text-amber-600' },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Loading Internship Data...</p>
    </div>
  );

  return (
    <div className="space-y-8 fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Internship <span className="text-indigo-600">Management</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Review applications, assign leads, manage documents & bills.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <HiOutlineDocumentText className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          <a
            href="/internship-enquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <HiOutlineArrowTopRightOnSquare className="w-4 h-4" />
            Public Enquiry Form
          </a>
        </div>
      </div>

      <div className='relative space-y-8'>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map(({ label, value, icon: Icon, bg, text }) => (
            <div key={label} className="glass-card p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${text}`} />
              </div>
              <div>
                <p className="text-2xl font-black text-slate-900">{value}</p>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, domain..."
              className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white text-slate-900 placeholder-slate-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['All', 'Pending', 'Active', 'Completed', 'Rejected'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${statusFilter === s
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  {['Applicant', 'Domain', 'Duration', 'Lead Manager', 'Fees / Payment', 'Status', 'Documents', 'Actions'].map(h => (
                    <th key={h} className="text-left px-5 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No internship records found
                    </td>
                  </tr>
                ) : filtered.map((intern) => (
                  <tr key={intern._id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Applicant */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                          {intern.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm">{intern.name}</p>
                          <p className="text-slate-400 text-[11px]">{intern.email}</p>
                          {intern.college && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-indigo-600 font-black text-[9px] uppercase tracking-tighter shrink-0">{intern.year || 'N/A'}</span>
                              <span className="text-slate-300 text-[10px]">/</span>
                              <span className="text-slate-400 text-[10px] italic truncate max-w-[120px]">{intern.college}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Domain */}
                    <td className="px-5 py-4">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-black uppercase tracking-wide border border-indigo-100">
                        {intern.domain}
                      </span>
                    </td>
                    {/* Duration */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {!isNaN(intern.duration) ? `${intern.duration} ${Number(intern.duration) === 1 ? 'Mo.' : 'Mos.'}` : intern.duration}
                      </p>
                      {intern.startDate && <p className="text-[11px] text-slate-400">{new Date(intern.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>}
                    </td>
                    {/* Lead */}
                    <td className="px-5 py-4">
                      {intern.leadManager ? (
                        <div>
                          <p className="font-black text-slate-800 text-[12px]">{intern.leadManager.name}</p>
                          <p className="text-slate-400 text-[10px]">{intern.leadManager.jobRole}</p>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[11px] italic">Unassigned</span>
                      )}
                    </td>
                    {/* Fees */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <p className="font-black text-slate-900 text-[12px]">
                          ₹{(intern.billAmount || intern.fees || 0).toLocaleString('en-IN')}
                        </p>
                        {((intern.billAmount || intern.fees || 0) - (intern.paidAmount || 0)) > 0 && (
                          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight">
                            Bal: ₹{((intern.billAmount || intern.fees || 0) - (intern.paidAmount || 0)).toLocaleString('en-IN')}
                          </p>
                        )}
                        {(intern.billAmount || intern.fees || 0) > 0 && ((intern.billAmount || intern.fees || 0) - (intern.paidAmount || 0)) <= 0 && (
                          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Fully Paid</p>
                        )}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border ${STATUS_COLORS[intern.status]}`}>
                        {intern.status}
                      </span>
                    </td>
                    {/* Documents */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(intern.documents || {}).map(([key, val]) =>
                          val ? (
                            <span key={key} title={DOC_LABELS[key]?.label} className="text-lg leading-none" aria-label={DOC_LABELS[key]?.label}>
                              {DOC_LABELS[key]?.emoji}
                            </span>
                          ) : null
                        )}
                        {!Object.values(intern.documents || {}).some(Boolean) && (
                          <span className="text-slate-300 text-[11px] italic">None</span>
                        )}
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedIntern(intern); setShowManage(true); }}
                          title="Manage"
                          className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-all"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setBillIntern(intern); setShowBill(true); }}
                          title="View/Print Bill"
                          className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all"
                        >
                          <HiOutlineReceiptPercent className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(intern._id)}
                          title="Delete"
                          className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>


        {/* Manage Modal */}
        {showManage && selectedIntern && (
          <ManageModal
            intern={selectedIntern}
            users={users}
            onClose={() => { setShowManage(false); setSelectedIntern(null); }}
            onSave={handleSave}
          />
        )}

        {/* Bill Modal */}
        {showBill && billIntern && (
          <BillModal
            intern={billIntern}
            onClose={() => { setShowBill(false); setBillIntern(null); }}
          />
        )}
      </div>


    </div>
  );
};

export default AdminInternships;
