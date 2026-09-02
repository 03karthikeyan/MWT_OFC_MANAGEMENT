import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineIdentification,
  HiOutlineShieldCheck,
  HiOutlinePencilSquare,
  HiOutlineCamera,
  HiOutlineBuildingLibrary,
} from 'react-icons/hi2';
import ProfileModal from '../components/ProfileModal';

const Profile = () => {
  const { user, loadUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPassSection, setShowPassSection] = useState(false);
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profilePicture: '',
  });

  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  useEffect(() => {
    // No local state needed for name/email since we use ProfileModal or display directly from user context
  }, [user]);

  // Removed local update functions as they are now in ProfileModal

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passData.currentPassword) {
      return toast.error('Enter your current password');
    }
    if (passData.newPassword.length < 4) {
      return toast.error('New password must be at least 4 characters');
    }
    if (passData.newPassword !== passData.confirmNewPassword) {
      return toast.error('New passwords do not match');
    }
    setLoading(true);
    try {
      await updateProfile({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPassData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setShowPassSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  const jobRoleColors = {
    Developer: 'bg-blue-50 text-blue-600 border-blue-200',
    HR: 'bg-rose-50 text-rose-600 border-rose-200',
    CEO: 'bg-amber-50 text-amber-600 border-amber-200',
    Manager: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    Designer: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    'Flutter Developer': 'bg-cyan-50 text-cyan-600 border-cyan-200',
    'Team Leader': 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
    Accounts: 'bg-slate-100 text-slate-700 border-slate-200',
    Staff: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const roleStyle = jobRoleColors[user?.jobRole] || jobRoleColors.Staff;

  return (
    <div className="space-y-6 px-2 md:px-0 max-w-2xl mx-auto fade-in">
      {/* Profile Header Card */}
      <div className="glass-card overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-8 py-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
          <div className="flex items-center gap-5 relative z-10">
            <div className="relative group">
              <div className="w-32 h-32 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-5xl font-black shadow-2xl border border-white/30 overflow-hidden hover:scale-105 transition-transform">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user?.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">{user?.name}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${roleStyle}`}>
                  {user?.jobRole || 'Staff'}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                  user?.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-white/20 text-white border border-white/30'
                }`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <HiOutlineIdentification className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</p>
              <p className="text-sm font-bold text-slate-900">{user?.employeeId || 'Pending'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <HiOutlineUser className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</p>
              <p className="text-sm font-bold text-slate-900">@{user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <HiOutlineEnvelope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
              <p className="text-sm font-bold text-slate-900">{user?.email || 'Not set'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <HiOutlineBuildingLibrary className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Name</p>
              <p className="text-sm font-bold text-slate-900">{user?.bankName || 'Not updated'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <HiOutlineIdentification className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account No</p>
              <p className="text-sm font-bold text-slate-900">{user?.bankAccountNo || 'Not updated'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <HiOutlineShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IFSC Code</p>
              <p className="text-sm font-bold text-slate-900">{user?.ifscCode || 'Not updated'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Section */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <HiOutlinePencilSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Edit Profile</h2>
              <p className="text-xs text-slate-400 font-medium">Update your name and email</p>
            </div>
          </div>
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-2"
            >
              <HiOutlinePencilSquare className="w-4 h-4" />
              Edit Profile
            </button>
        </div>

          <div className="p-6 text-center text-sm text-slate-400 font-medium py-10">
            Click <span className="text-indigo-600 font-bold">Edit Profile</span> in the section above to update your information.
          </div>
        </div>
        <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />

      {/* Change Password Section */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <HiOutlineShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Security</h2>
              <p className="text-xs text-slate-400 font-medium">Change your password</p>
            </div>
          </div>
          {!showPassSection && (
            <button
              onClick={() => setShowPassSection(true)}
              className="px-4 py-2 text-sm font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all"
            >
              Change Password
            </button>
          )}
        </div>

        {showPassSection ? (
          <form onSubmit={handlePasswordChange} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Current Password</label>
              <div className="relative group">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  className="input-field pl-12 pr-12"
                  placeholder="••••••••"
                  value={passData.currentPassword}
                  onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showCurrentPass ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative group">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  className="input-field pl-12 pr-12"
                  placeholder="••••••••"
                  value={passData.newPassword}
                  onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showNewPass ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Confirm New Password</label>
              <div className="relative group">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  className="input-field pl-12"
                  placeholder="••••••••"
                  value={passData.confirmNewPassword}
                  onChange={(e) => setPassData({ ...passData, confirmNewPassword: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 text-white py-3 px-6 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-100 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </div>
                ) : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPassSection(false);
                  setPassData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                }}
                className="py-3 px-6 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 text-center text-sm text-slate-400 font-medium py-10">
            Click <span className="text-amber-600 font-bold">Change Password</span> to update your credentials.
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
