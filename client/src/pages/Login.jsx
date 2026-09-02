import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { login } from '@/services/api';
import toast from 'react-hot-toast';
import { HiOutlineSignal, HiOutlineEye, HiOutlineEyeSlash, HiOutlineEnvelope, HiOutlineLockClosed } from 'react-icons/hi2';
import loginLogo from '../assets/login-logo.png';

const Login = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginUser: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(formData);
      authLogin(res.data.user, res.data.token);
      toast.success('Welcome to MediaWave!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background blobs for aesthetics */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[120px] opacity-60"></div>
      </div>

      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white shadow-xl shadow-indigo-100 border border-slate-100 mb-6 animate-float p-3">
            <img src={loginLogo} alt="MediaWave Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Media <span className="text-indigo-600">Wave</span> <span className="text-slate-400 text-lg uppercase font-bold tracking-widest block mt-1">Technologies</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Your office companion, simplified.</p>
        </div>

        <div className="bg-white rounded-3xl p-10 shadow-2xl shadow-indigo-900/5 border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email or Username</label>
              <div className="relative group">
                <HiOutlineEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all border-none shadow-sm"
                  placeholder="Enter email or username"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value.replace(/\s/g, '') })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
              <div className="relative group">
                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all border-none shadow-sm"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none mt-4 text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-slate-600 font-medium">Don't have an account?</p>
            <Link to="/register" className="text-indigo-600 font-black hover:underline mt-1 inline-block">Create one here</Link>
          </div>
        </div>

        {/* Demo Credentials Hint */}
        <div className="mt-8 p-6 bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 text-center text-sm font-medium text-slate-500 shadow-sm shadow-indigo-900/5">
          {/* <p>Demo Admin: <span className="text-slate-900 font-bold">admin / admin123</span></p> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
