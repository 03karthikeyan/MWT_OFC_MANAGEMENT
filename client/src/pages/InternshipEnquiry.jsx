import { useState } from 'react';
import { submitInternshipEnquiry } from '@/services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineAcademicCap,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineBuildingLibrary,
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineSparkles,
  HiOutlineCodeBracket,
  HiOutlinePaintBrush,
  HiOutlineChartBar,
  HiOutlineMegaphone,
  HiOutlineCpuChip,
} from 'react-icons/hi2';
import logo from '../assets/logo.png';

const DOMAINS = [
  { label: 'Web Development', icon: HiOutlineCodeBracket, color: 'bg-blue-50 text-blue-600' },
  { label: 'UI/UX Design', icon: HiOutlinePaintBrush, color: 'bg-rose-50 text-rose-600' },
  { label: 'Digital Marketing', icon: HiOutlineMegaphone, color: 'bg-amber-50 text-amber-600' },
  { label: 'Data Analytics', icon: HiOutlineChartBar, color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Flutter/Mobile', icon: HiOutlineCpuChip, color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Other', icon: HiOutlineSparkles, color: 'bg-slate-50 text-slate-600' },
];

const DURATIONS = [1, 2, 3, 6, 'Other'];

const InternshipEnquiry = ({ sidebarMode = false }) => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', college: '', year: '',
    domain: '', duration: 1, notes: '',
    customDomain: '', customDuration: '',
    startDate: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const selectDomain = (d) => setForm({ ...form, domain: d });
  const selectDuration = (d) => setForm({ ...form, duration: d });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.domain) {
      toast.error('Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const submissionData = {
        ...form,
        domain: form.domain === 'Other' ? form.customDomain : form.domain,
        duration: form.duration === 'Other' ? form.customDuration : form.duration,
      };

      if (!submissionData.domain || !submissionData.duration) {
        toast.error('Please specify the domain/duration for your internship.');
        return;
      }

      await submitInternshipEnquiry(submissionData);
      setSubmitted(true);
      toast.success('Enquiry submitted! We will contact you soon.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className={`${sidebarMode ? '' : 'min-h-screen bg-slate-50'} flex flex-col items-center justify-center px-4 py-12`}>
        <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 text-center space-y-6 border border-slate-100">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto">
            <HiOutlineCheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Success!</h2>
          <p className="text-slate-500 font-medium">
            Thank you <span className="text-indigo-600 font-bold">{form.name}</span>. The enquiry for <span className="text-indigo-600 font-bold">{form.domain}</span> has been received.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ name:'',email:'',phone:'',college:'', year: '',domain:'',duration:1,notes:'',customDomain:'',customDuration:'', startDate: '' }); }}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${sidebarMode ? '' : 'min-h-screen bg-slate-50'} font-sans selection:bg-indigo-100 selection:text-indigo-900`}>
      {!sidebarMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200/30 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-200/20 rounded-full blur-[100px]" />
        </div>
      )}

      <div className={`relative ${sidebarMode ? 'max-w-4xl' : 'max-w-5xl mx-auto py-12 lg:py-20'} px-0 flex flex-col lg:flex-row gap-12 items-start`}>
        
        {/* Left Side: Branding & Info - Only shown in public mode */}
        {!sidebarMode && (
          <div className="w-full lg:w-2/5 space-y-8 lg:sticky lg:top-12 px-6">
            <div className="w-48 h-12 flex items-center">
              <img src={logo} alt="MediaWave" className="h-full object-contain" />
            </div>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
                  <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hiring for Summer 2026</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight">
                Launch your <span className="text-indigo-600">career</span> with our experts.
              </h1>
              <p className="text-slate-500 text-lg font-medium max-w-sm">
                Our internship program offers hands-on experience on live industry projects. Learn, grow, and build your future.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 pt-4">
              {[
                { icon: HiOutlineCheckCircle, text: 'Live Project Experience' },
                { icon: HiOutlineCheckCircle, text: 'Mentorship by Industry Leads' },
                { icon: HiOutlineCheckCircle, text: 'Professional Certification' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4" />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right Side: Form */}
        <div className={`w-full ${sidebarMode ? 'lg:w-full' : 'lg:w-3/5 px-6'}`}>
          {sidebarMode && (
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Internship <span className="text-indigo-600">Enquiry Form</span></h1>
              <p className="text-slate-500 mt-1 font-medium italic">Fill the form below to register a new intern candidate.</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className={`bg-white ${sidebarMode ? 'rounded-3xl' : 'rounded-[40px] shadow-xl shadow-slate-200/50'} border border-slate-100 p-8 lg:p-12 space-y-10`}>
            
            {/* Form Section: Identity */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shrink-0">
                  <HiOutlineUser className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Candidate Identity</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { name: 'name', label: 'Full Name', icon: HiOutlineUser, type: 'text', placeholder: 'Enter candidate name' },
                  { name: 'email', label: 'Work Email', icon: HiOutlineEnvelope, type: 'email', placeholder: 'candidate@email.com' },
                  { name: 'phone', label: 'Contact Number', icon: HiOutlinePhone, type: 'tel', placeholder: '+91' },
                  { name: 'college', label: 'Institution Name (Optional)', icon: HiOutlineBuildingLibrary, type: 'text', placeholder: 'College/University name' },
                  { name: 'year', label: 'Current Year', icon: HiOutlineAcademicCap, type: 'text', placeholder: 'e.g. 3rd Year' },
                ].map(({ name, label, icon: Icon, type, placeholder }) => (
                  <div key={name} className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pl-1">{label}</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <input
                        type={type}
                        name={name}
                        value={form[name]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all font-bold text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Section: Domain */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shrink-0">
                  <HiOutlineSparkles className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider">Specialization</h2>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {DOMAINS.map(({ label, icon: Icon, color }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => selectDomain(label)}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 text-center active:scale-95 ${
                      form.domain === label
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                        : 'border-slate-50 bg-slate-50 hover:bg-slate-100 hover:border-slate-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{label}</span>
                  </button>
                ))}
              </div>

              {form.domain === 'Other' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pl-1 mb-2">Specify Domain</label>
                  <input
                    type="text"
                    name="customDomain"
                    value={form.customDomain}
                    onChange={handleChange}
                    placeholder="Enter your field of specialization"
                    className="w-full bg-slate-50 border border-indigo-100 rounded-2xl py-4 px-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all font-bold text-sm"
                  />
                </div>
              )}
            </div>

            {/* Form Section: Timeframe */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pl-1">Duration Preference</label>
                    <div className="flex flex-wrap gap-2">
                         {DURATIONS.map((months) => (
                             <button
                                 key={months}
                                 type="button"
                                 onClick={() => selectDuration(months)}
                                 className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                                     form.duration === months
                                     ? 'bg-slate-950 text-white shadow-xl shadow-slate-200'
                                     : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                 }`}
                             >
                                 {months === 'Other' ? 'Other Period' : `${months} ${months === 1 ? 'Month' : 'Months'}`}
                             </button>
                         ))}
                     </div>
                     {form.duration === 'Other' && (
                        <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                            <input
                                type="text"
                                name="customDuration"
                                value={form.customDuration}
                                onChange={handleChange}
                                placeholder="e.g. 6 Weeks, 1 Year"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all font-bold text-sm"
                            />
                        </div>
                     )}
                </div>

                <div className="space-y-4">
                   <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pl-1">Commencement Date</label>
                   <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all font-bold text-sm"
                   />
                </div>

                <div className="space-y-4">
                   <label className="block text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 pl-1">Additional Notes</label>
                   <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Candidate skills, portfolio links, or referrals."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-200 transition-all font-bold text-sm resize-none"
                   />
                </div>
            </div>

            {/* Submission */}
            <div className="pt-4">
                <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 hover:shadow-2xl hover:shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50"
                >
                {loading ? (sidebarMode ? 'Saving Record...' : 'Processing Enquiry...') : (
                    <>
                    {sidebarMode ? 'Save Intern Enquiry' : 'Submit Application'}
                    <HiOutlineArrowRight className="w-5 h-5" />
                    </>
                )}
                </button>
            </div>
          </form>
          {!sidebarMode && (
            <p className="mt-8 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
              © 2026 MediaWave Technologies · Secure Form
            </p>
          )}
        </div>
      </div>
    </div>
  );
};


export default InternshipEnquiry;

