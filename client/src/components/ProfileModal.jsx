
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  HiOutlineUser, 
  HiOutlineEnvelope, 
  HiOutlineXMark, 
  HiOutlineCamera,
  HiOutlineDevicePhoneMobile,
  HiOutlineIdentification,
  HiOutlineBuildingLibrary,
  HiOutlineShieldCheck
} from 'react-icons/hi2';

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, loadUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profilePicture: '',
    contact: '',
    bankName: '',
    bankAccountNo: '',
    ifscCode: '',
  });

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        profilePicture: user.profilePicture || '',
        contact: user.contact || '',
        bankName: user.bankName || '',
        bankAccountNo: user.bankAccountNo || '',
        ifscCode: user.ifscCode || '',
      });
    }
  }, [user, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        return toast.error('Image size must be less than 4MB');
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');
    setLoading(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
      await loadUser();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto transition-all duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="relative z-20 shrink-0 h-44 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800">
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all backdrop-blur-md z-10"
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
          
          <div className="absolute -bottom-14 left-8 flex items-end gap-4 w-full pr-16 bg-transparent">
            {/* Profile Picture */}
            <div className="w-28 h-28 rounded-[2.5rem] bg-white p-1.5 shadow-2xl relative overflow-hidden group flex-shrink-0">
              {formData.profilePicture ? (
                <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover rounded-[2rem]" />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <HiOutlineUser className="w-12 h-12" />
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                <HiOutlineCamera className="w-8 h-8" />
              </label>
            </div>

            {/* Name Pill - Matching User Image */}
            <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-[2rem] shadow-xl border border-white/50 flex items-center gap-3 flex-1 mb-2 transform transition-transform hover:scale-[1.02]">
               <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                 <HiOutlineUser className="w-4 h-4" />
               </div>
               <input
                 type="text"
                 required
                 className="bg-transparent text-lg font-black text-slate-900 outline-none w-full placeholder:text-slate-300"
                 placeholder="Your Name"
                 value={formData.name}
                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
               />
            </div>
          </div>
        </div>

        <div className="p-8 pt-20 h-[500px] overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 group-focus-within:bg-indigo-50 transition-all">
                  <HiOutlineEnvelope className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  className="w-full bg-slate-50/50 border border-slate-100/80 rounded-[2rem] py-4 pl-16 pr-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-sm"
                  placeholder="name@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

             <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Contact Details</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-focus-within:text-indigo-600 group-focus-within:bg-indigo-50 transition-all">
                  <HiOutlineDevicePhoneMobile className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  className="w-full bg-slate-50/50 border border-slate-100/80 rounded-[2rem] py-4 pl-16 pr-6 outline-none focus:border-indigo-500 focus:bg-white transition-all text-sm font-bold text-slate-700 shadow-sm"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Bank Name</label>
                <div className="relative group">
                  <HiOutlineBuildingLibrary className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    className="w-full bg-slate-50/50 border border-slate-100/80 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all text-xs font-bold text-slate-700"
                    placeholder="e.g. HDFC Bank"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Account No</label>
                <div className="relative group">
                  <HiOutlineIdentification className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    className="w-full bg-slate-50/50 border border-slate-100/80 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all text-xs font-bold text-slate-700"
                    placeholder="e.g. 50100XXXX"
                    value={formData.bankAccountNo}
                    onChange={(e) => setFormData({ ...formData, bankAccountNo: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">IFSC Code</label>
                <div className="relative group">
                  <HiOutlineShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input
                    type="text"
                    className="w-full bg-slate-50/50 border border-slate-100/80 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-indigo-500 focus:bg-white transition-all text-xs font-bold text-slate-700 uppercase"
                    placeholder="e.g. CNRB000XXXX"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4">
              <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100/80">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Employee ID</p>
                 <p className="text-xs font-black text-indigo-700">{user?.employeeId || 'N/A'}</p>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100/80">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">System Role</p>
                 <p className="text-xs font-black text-indigo-700">{user?.jobRole || 'Staff'}</p>
              </div>
            </div>

            <div className="flex gap-4 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-md">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-[1.5rem] text-sm font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
