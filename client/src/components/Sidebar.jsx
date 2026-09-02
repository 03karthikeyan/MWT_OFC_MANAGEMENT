import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  HiOutlineHome,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineUsers,
  HiOutlineArrowRightOnRectangle,
  HiOutlineDocumentText,
  HiOutlineUserCircle,
  HiOutlineAcademicCap,
  HiOutlineGlobeAlt,
  HiOutlineChevronDown,
  HiOutlineBuildingOffice2,
  HiOutlineSignal,
  HiOutlineMegaphone,
  HiOutlineCalculator,
  HiOutlineBell,
  HiOutlineXMark,
  HiOutlineBriefcase,
} from 'react-icons/hi2';
import logo from '../assets/logo.png';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openSection, setOpenSection] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [pendingOnDuty, setPendingOnDuty] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [allNotifs, setAllNotifs] = useState([]);
  const [showNotifPopup, setShowNotifPopup] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      const fetchPendingCounts = async () => {
        try {
          const { getPendingLeavesCount, getPendingOnDutyCount } = await import('@/services/api');
          const [leavesRes, onDutyRes] = await Promise.all([
            getPendingLeavesCount(),
            getPendingOnDutyCount()
          ]);
          setPendingLeaves(leavesRes.data.count);
          setPendingOnDuty(onDutyRes.data.count);
        } catch (err) {
          console.error('Failed to fetch pending counts');
        }
      };
      
      fetchPendingCounts();
      const interval = setInterval(fetchPendingCounts, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const fetchNotifs = async () => {
        try {
          const { getMyNotifications } = await import('@/services/api');
          const res = await getMyNotifications();
          const notifs = res.data.notifications || [];
          setAllNotifs(notifs);
          setUnreadNotifs(notifs.length);
        } catch (err) {
          console.error('Failed to fetch notifications');
        }
      };
      
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const fetchReqsCount = async () => {
        try {
          const { getPendingRequestsCount } = await import('@/services/api');
          const res = await getPendingRequestsCount();
          setPendingRequests(res.data.count);
        } catch (err) {
          console.error('Failed to fetch requests count');
        }
      };
      
      fetchReqsCount();
      const interval = setInterval(fetchReqsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Sound and Total Count Notification Effect
  const prevTotalRef = useRef(0);
  const totalNotifications = pendingLeaves + pendingRequests + unreadNotifs;

  useEffect(() => {
    if (totalNotifications > prevTotalRef.current && prevTotalRef.current !== 0) {
      // Play a clean, professional ping sound
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.volume = 0.5;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked: This is expected in many browsers until user interacts
          });
        }
      } catch (e) {}
    }
    prevTotalRef.current = totalNotifications;
  }, [totalNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/login');
    if (setIsOpen) setIsOpen(false);
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024 && setIsOpen) {
      setIsOpen(false);
    }
  };

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

  const sections = [
    {
      id: 'office',
      label: 'Office Workspace',
      icon: HiOutlineBuildingOffice2,
      items: [
        { name: 'Work Journal', icon: HiOutlineClipboardDocumentList, path: user?.role === 'admin' ? '/admin/work-updates' : '/work-updates' },
        { name: 'Time Logs & Leave Calendar', icon: HiOutlineCalendarDays, path: user?.role === 'admin' ? '/admin/attendance' : '/attendance' },
        { name: 'Leave & Time Off', icon: HiOutlineClock, path: user?.role === 'admin' ? '/admin/leaves' : '/leaves' },
        { name: 'On Duty Register', icon: HiOutlineBriefcase, path: user?.role === 'admin' ? '/admin/on-duty' : '/on-duty' },
        { name: 'My Payslips', icon: HiOutlineDocumentText, path: '/payslips', hideAdmin: true },
        { name: 'Team', icon: HiOutlineUsers, path: '/team' },
        { name: 'Announcements', icon: HiOutlineMegaphone, path: '/admin/announcements', adminOnly: true },
        { name: 'Requests & Reviews', icon: HiOutlineClipboardDocumentList, path: user?.role === 'admin' ? '/admin/requests' : '/requests' },
        { name: 'Manage Members', icon: HiOutlineUsers, path: '/admin/members', adminOnly: true },
        { name: 'Payroll Central', icon: HiOutlineCalculator, path: '/admin/payroll', adminOnly: true },
        { name: 'My Profile', icon: HiOutlineUserCircle, path: '/profile' },
      ]
    },
    {
      id: 'internship',
      label: 'Internship Program',
      icon: HiOutlineAcademicCap,
      items: [
        { name: 'Intern Dashboard', icon: HiOutlineUsers, path: user?.role === 'admin' ? '/admin/internships' : '/internships', internshipOnly: true },
        { name: 'Enquiry Details', icon: HiOutlineDocumentText, path: '/admin/internship-enquiries', internshipOnly: true },
        { name: 'Enquiry Form', icon: HiOutlineClipboardDocumentList, path: '/internship-form' },
      ]
    },
    {
      id: 'client',
      label: 'Client Resources',
      icon: HiOutlineGlobeAlt,
      items: [
        { name: 'Active Projects', icon: HiOutlineSignal, path: '/active-projects' },
        { name: 'Portfolios', icon: HiOutlineDocumentText, path: '/portfolios' },
      ]
    },
    {
      id: 'enquiry',
      label: 'Enquiry & Lead',
      icon: HiOutlineUserCircle,
      items: [
        { name: 'Enquiries', icon: HiOutlineClipboardDocumentList, path: '/enquiries' },
        { name: 'Leads', icon: HiOutlineDocumentText, path: '/leads' },
      ]
    }
  ];

  return (
    <aside className={`w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col shadow-sm select-none z-[70] transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center w-full">
            <div className="w-full h-16 overflow-hidden flex items-center">
              <img src={logo} alt="MediaWave Logo" className="w-full h-16 object-contain object-left" />
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-4 mt-2 overflow-y-auto custom-scrollbar">
        {/* Top Level Dashboard Link */}
        <NavLink
            to={user?.role === 'admin' ? '/admin' : '/dashboard'}
            onClick={handleNavClick}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
                    isActive ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm border border-indigo-100/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
            }
        >
            <HiOutlineHome className={`w-5 h-5 ${location.pathname === (user?.role === 'admin' ? '/admin' : '/dashboard') ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Dashboard View</span>
            {(pendingLeaves + pendingOnDuty + pendingRequests + unreadNotifs) > 0 && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
        </NavLink>

        <div className="h-[1px] bg-slate-100 mx-2 my-2" />

        {sections.map((section) => (
          <div key={section.id} className="space-y-1">
            <button
              onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                openSection === section.id ? 'bg-slate-50 text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <section.icon className={`w-5 h-5 ${openSection === section.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{section.label}</span>
              </div>
              <HiOutlineChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${openSection === section.id ? 'rotate-180 text-indigo-600' : 'text-slate-300'}`} />
            </button>

            {openSection === section.id && (
              <div className="space-y-1 mt-1 ml-4 pl-3 border-l-2 border-slate-100 fade-in">
                {section.items
                  .filter(item => {
                    if (item.adminOnly) return user?.role === 'admin';
                    if (item.internshipOnly) return user?.role === 'admin' || user?.canManageInternships;
                    return true;
                  })
                  .filter(item => (item.hideAdmin && user?.role === 'admin' ? false : true))
                  .map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={handleNavClick}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative ${
                          isActive && item.path !== '#'
                            ? 'bg-indigo-50 text-indigo-600 font-bold' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      <span className="text-[13px]">{item.name}</span>
                      {item.badge && (
                        <span className="ml-auto text-[7px] font-black uppercase bg-slate-900 text-white px-1.5 py-0.5 rounded tracking-widest shadow-lg shadow-slate-200">
                          {item.badge}
                        </span>
                      )}
                      {item.name === 'Leave & Time Off' && user?.role === 'admin' && pendingLeaves > 0 && (
                        <span className="absolute left-6 top-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                      {item.name === 'On Duty Register' && user?.role === 'admin' && pendingOnDuty > 0 && (
                        <span className="absolute left-6 top-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                      {item.name === 'Requests & Reviews' && pendingRequests > 0 && (
                        <span className="absolute left-6 top-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                      )}
                    </NavLink>
                  ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-4 mb-4 shadow-sm">
          <NavLink to="/profile" onClick={handleNavClick} className="flex items-center gap-3 mb-4 group cursor-pointer">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-indigo-700 font-bold group-hover:scale-105 transition-transform overflow-hidden border border-slate-100">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-900 truncate group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{user?.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black uppercase tracking-widest ${
                    jobRoleColors[user?.jobRole] || jobRoleColors.Staff
                  }`}>
                    {user?.jobRole || 'Staff'}
                  </span>
                </div>
            </div>
          </NavLink>
          
          <div className="flex items-center justify-between gap-2 px-2 pb-2 relative">
            {/* Notification Popup Panel */}
            {showNotifPopup && (
              <div className="absolute bottom-16 left-2 right-2 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-2 z-[100] animate-in slide-in-from-bottom-4 duration-300 max-h-[350px] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Live Broadcasts</h3>
                  <button onClick={() => setShowNotifPopup(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                    <HiOutlineXMark className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1">
                  {allNotifs.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 h-full rounded-[1.5rem] m-2">
                       <HiOutlineMegaphone className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">No active priority broadcasts found</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      {allNotifs.map((notif) => (
                        <div key={notif._id} className={`p-4 rounded-[1.5rem] group hover:scale-[0.98] transition-all cursor-default border ${
                          notif.type === 'urgent' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-xl h-fit ${
                              notif.type === 'urgent' ? 'bg-rose-100 text-rose-600' : 'bg-white text-indigo-600'
                            }`}>
                              <HiOutlineMegaphone className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                               <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tighter leading-none mb-1">{notif.title}</p>
                               <p className="text-[9px] font-medium text-slate-500 leading-tight line-clamp-2">{notif.message}</p>
                               <p className="text-[7px] font-black text-slate-300 uppercase tracking-widest mt-2">
                                 {new Date(notif.createdAt).toLocaleDateString()}
                               </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div 
              onClick={() => setShowNotifPopup(!showNotifPopup)}
              className={`flex-1 flex items-center justify-center rounded-xl py-2 shadow-sm border relative group cursor-pointer transition-all ${
                showNotifPopup ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-100 hover:bg-indigo-50'
              }`}
            >
              <HiOutlineBell className={`w-5 h-5 transition-colors ${showNotifPopup ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} />
              {totalNotifications > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 shadow-sm animate-bounce ${
                  showNotifPopup ? 'bg-slate-900 border-indigo-600' : 'bg-red-500 border-white'
                }`}>
                  {totalNotifications}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-[0.1em] bg-white rounded-xl border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm"
            >
              <HiOutlineArrowRightOnRectangle className="w-4 h-4" />
              Exit
            </button>
          </div>
        </div>
        <p className="text-[9px] text-center text-slate-400 font-black uppercase tracking-[0.2em]">
          MediaWave v1.2.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
