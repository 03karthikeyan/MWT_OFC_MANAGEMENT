import React, { useState, useEffect } from 'react';
import {
  FaAndroid,
  FaDownload,
  FaQrcode,
  FaShieldAlt,
  FaRocket,
  FaClock,
  FaCalendarAlt,
  FaFilePdf,
  FaCopy,
  FaCheck,
  FaLaptopCode,
  FaUserShield,
  FaMapMarkerAlt,
  FaMobileAlt,
  FaCheckCircle,
  FaHeadset,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaBars,
  FaTimes,
  FaBriefcase,
  FaReceipt,
  FaDesktop,
  FaGraduationCap,
  FaFingerprint,
  FaExternalLinkAlt,
  FaGlobe,
  FaUsers,
  FaBuilding,
  FaSun,
  FaBolt,
  FaChevronRight,
  FaHome,
  FaThLarge,
  FaCog,
  FaQuestionCircle,
  FaCloud,
  FaEnvelope,
  FaPhoneAlt,
  FaLinkedinIn,
  FaYoutube,
  FaTwitter,
  FaFacebookF,
  FaInstagram,
  FaAngleRight,
  FaChartLine
} from 'react-icons/fa';
import {
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineLocationMarker,
  HiOutlineDocumentText,
  HiOutlineChatAlt2,
  HiOutlineArrowRight,
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineShieldExclamation
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import favicoLogo from '../assets/favico.png';

const LandingPage = () => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeNav, setActiveNav] = useState('home');
  const [newsletterEmail, setNewsletterEmail] = useState('');

  // Scroll Spy: Automatically update active nav link on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;

      const sections = [
        { id: 'faq', el: document.getElementById('faq') },
        { id: 'features', el: document.getElementById('features') },
        { id: 'guide', el: document.getElementById('guide') },
        { id: 'download', el: document.getElementById('download') },
        { id: 'home', el: document.getElementById('home') },
      ];

      for (const section of sections) {
        if (section.el) {
          const top = section.el.offsetTop;
          if (scrollPosition >= top) {
            if (section.id === 'download') {
              setActiveNav('home');
            } else {
              setActiveNav(section.id);
            }
            return;
          }
        }
      }

      setActiveNav('home');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll handler with header offset
  const scrollToSection = (e, id) => {
    e.preventDefault();
    setActiveNav(id);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -80; // Sticky header height offset
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success('Thank you for subscribing to Media Wave updates!');
    setNewsletterEmail('');
  };

  // APK file details
  const apkInfo = {
    version: 'v1.0.0 (Build 104 - ARM64)',
    releaseDate: 'October 2026',
    fileSize: '27.5 MB',
    minAndroid: 'Android 8.0 & above (ARM64 Optimized)',
    fileName: 'MediaWave-Technologies-v1.0.0.apk',
    downloadUrl: '/MediaWave-v1.0.0.apk',
  };

  // Resolve Web Portal URL dynamically
  const getWebPortalUrl = () => {
    if (import.meta.env.VITE_WEB_PORTAL_URL) {
      return import.meta.env.VITE_WEB_PORTAL_URL;
    }
    if (typeof window !== 'undefined') {
      if (window.location.port === '5174') {
        return 'https://mwt-ofc-management.vercel.app/login';
      }
      return `${window.location.origin}/login`;
    }
    return '/login';
  };

  const getInternshipUrl = () => {
    if (import.meta.env.VITE_INTERNSHIP_PORTAL_URL) {
      return import.meta.env.VITE_INTERNSHIP_PORTAL_URL;
    }
    if (typeof window !== 'undefined') {
      if (window.location.port === '5174') {
        return 'https://mwt-ofc-management.vercel.app/enquiries';
      }
      return `${window.location.origin}/internship-enquiry`;
    }
    return '/internship-enquiry';
  };

  const webPortalUrl = getWebPortalUrl();
  const internshipUrl = getInternshipUrl();

  const handleDownload = () => {
    setDownloading(true);
    toast.success('Starting APK download for Media Wave Technologies App...', {
      duration: 4000,
      icon: '🚀'
    });

    const link = document.createElement('a');
    link.href = apkInfo.downloadUrl;
    link.setAttribute('download', apkInfo.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloading(false);
    }, 2500);
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${apkInfo.downloadUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    toast.success('Direct APK download link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const faqs = [
    {
      q: 'How do I install the Media Wave Technologies APK on my Android smartphone?',
      a: '1. Click the "Direct Employee Download" button or scan the QR code. 2. Once downloaded, tap the notification or open your Downloads folder and tap the APK file. 3. If prompted with "Install unknown apps", tap Settings and toggle "Allow from this source". 4. Tap "Install" and open the application to sign in with your corporate credentials.'
    },
    {
      q: 'What credentials should employees use to log in?',
      a: 'Use your official Media Wave Technologies registered email/username and the secure password issued by the IT/HR department. If you need account activation or a password reset, contact your HR administrator or IT helpdesk.'
    },
    {
      q: 'Why does the app require GPS and Camera permissions?',
      a: 'GPS location is required during Punch-In and Punch-Out to ensure accurate geo-tagged attendance within designated office boundaries and on-duty client locations. Camera permission is used for optional selfie check-in verification and uploading receipts/work attachments.'
    },
    {
      q: 'Can I access both the Mobile App and the Web Portal with the same account?',
      a: 'Yes! Your employee account is synchronized across the Android mobile application and the desktop web portal. Any task logged, punch recorded, or leave requested on mobile immediately reflects on your web dashboard in real time.'
    },
    {
      q: 'How do I receive future app updates?',
      a: 'When an update is released, you can visit this page anytime and download the latest APK build directly. Installing the updated APK over the existing app will update it seamlessly without losing your login session.'
    }
  ];

  // Comprehensive Mobile App & Web Features Matrix
  const appFeatures = [
    {
      id: 'attendance',
      title: 'Smart Geo-Attendance',
      subtitle: 'GPS Punch In/Out with Geofence Verification',
      icon: <HiOutlineLocationMarker className="w-6 h-6 text-[#0284c7]" />,
      badge: 'Geo-Fenced',
      description: 'Instant 1-tap attendance check-in with high-precision GPS geofencing. Automatically logs timestamps, verifies office boundary, and tracks working hours with break management.',
      highlights: ['Office Geofence Boundary Check', 'Selfie / Location Verification', 'Monthly Attendance Calendar', 'Late-in & Early-out Tracking']
    },
    {
      id: 'worklogs',
      title: 'Daily Work Updates & Tasks',
      subtitle: 'Milestones, Task Logging & Standups',
      icon: <HiOutlineDocumentText className="w-6 h-6 text-[#1e40af]" />,
      badge: 'Real-time Sync',
      description: 'Submit daily deliverables, link work updates directly to assigned client projects, upload screenshots/files, and maintain transparent productivity reports for management.',
      highlights: ['Structured Task Breakdowns', 'Project Association & Milestones', 'Manager Review & Lead Feedback', 'Exportable Work History']
    },
    {
      id: 'leaves',
      title: 'Leaves & On-Duty (OD) Portal',
      subtitle: 'Fast Requests with Instant Approvals',
      icon: <FaCalendarAlt className="w-5 h-5 text-[#0284c7]" />,
      badge: 'Instant Approvals',
      description: 'Submit leave applications (Casual, Sick, Earned) and on-duty client visit requests in seconds. Monitor approval statuses and remaining quota with real-time push alerts.',
      highlights: ['Leave Balance Quota Tracker', 'On-Duty (OD) Field Tracking', 'Instant Push Notifications', 'Public Holiday Calendar Sync']
    },
    {
      id: 'payslips',
      title: 'Digital Payslips & Tax Vault',
      subtitle: 'Encrypted Salary Slips & Tax Summaries',
      icon: <FaFilePdf className="w-5 h-5 text-rose-600" />,
      badge: 'Encrypted PDF',
      description: 'Securely access your monthly salary slips, breakdown of allowances, deductions, and tax records. Download verified PDF payslips on your phone anytime.',
      highlights: ['One-Click PDF Generation', 'Full Earnings Breakdown', 'Yearly Tax Statements', '256-Bit Encrypted Storage']
    },
    {
      id: 'chat',
      title: 'Team Connect & Live Chat',
      subtitle: 'Real-time Messaging & Announcements',
      icon: <HiOutlineChatAlt2 className="w-6 h-6 text-[#1e40af]" />,
      badge: 'Socket.IO Live',
      description: 'Connect directly with peers, department channels, and stay updated with official company announcements and policy updates in a unified messaging hub.',
      highlights: ['Real-Time WebSocket Chat', 'Company Notice Board', 'Team Project Channels', 'Priority Broadcast Alerts']
    },
    {
      id: 'projects',
      title: 'Active Projects & Portfolio',
      subtitle: 'Sprint Deliverables & Client Milestones',
      icon: <FaBriefcase className="w-5 h-5 text-[#0284c7]" />,
      badge: 'Project CRM',
      description: 'Track ongoing client projects, sprint milestones, team assignments, and showcase completed company portfolios with live progress tracking.',
      highlights: ['Project Milestone Tracking', 'Team Role Allocations', 'Client Deliverable Reviews', 'Portfolio Showcase']
    },
    {
      id: 'expenses',
      title: 'Expense Claims & Settlements',
      subtitle: 'Fast Reimbursement & Receipt Upload',
      icon: <FaReceipt className="w-5 h-5 text-amber-600" />,
      badge: 'Financial Flow',
      description: 'Submit official travel, client meeting, and office expense reimbursement requests with attached digital bills and receipts for rapid approval.',
      highlights: ['Receipt & Bill Attachment', 'Multi-Level Approval Workflow', 'Status & Settlement Tracking', 'Automated Expense Reports']
    },
    {
      id: 'assets',
      title: 'Asset & Hardware Management',
      subtitle: 'Company Equipment & Asset Requests',
      icon: <FaDesktop className="w-5 h-5 text-[#1e40af]" />,
      badge: 'Resource Mgmt',
      description: 'Monitor allocated corporate hardware (laptops, accessories), raise maintenance tickets, and request new technical resources in one centralized place.',
      highlights: ['Hardware Inventory Tracking', 'Maintenance Ticket Logging', 'Resource Request Approvals', 'Asset Return Verification']
    },
    {
      id: 'internships',
      title: 'Internship & Lead Enquiry CRM',
      subtitle: 'Student Applications & Business Leads',
      icon: <FaGraduationCap className="w-5 h-5 text-[#0284c7]" />,
      badge: 'Talent & Leads',
      description: 'Manage incoming student internship enquiries, review candidate applications, schedule interviews, and organize business client leads.',
      highlights: ['Direct Online Application Form', 'Candidate Pipeline Tracking', 'Resume Review & Verification', 'Client Lead CRM Integration']
    },
    {
      id: 'security',
      title: 'Enterprise Security & Biometrics',
      subtitle: 'Role-Based Access & Token Encryption',
      icon: <FaFingerprint className="w-5 h-5 text-emerald-600" />,
      badge: 'ISO 27001 Grade',
      description: 'Built with biometric device locking, JWT session encryption, role-based permissions (Admin, Lead, Employee), and end-to-end encrypted API communications.',
      highlights: ['Biometric / Fingerprint Unlock', 'JWT Session Authentication', 'Role-Based Access Controls', 'Zero Data Leak Architecture']
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans selection:bg-[#0284c7] selection:text-white">

      {/* SOFT CYAN & BLUE AMBIENT BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] right-[10%] w-[600px] h-[600px] bg-gradient-to-bl from-blue-100/70 via-cyan-100/50 to-transparent rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[20%] left-[-5%] w-[500px] h-[500px] bg-gradient-to-tr from-cyan-100/40 to-blue-50/50 rounded-full blur-[120px]"></div>
      </div>

      {/* TOP EXACT NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

          {/* BRAND LOGO: EXACT FAVICO ICON + MEDIA WAVE TECHNOLOGIES */}
          <a href="#" className="flex items-center gap-3.5 group">
            <img
              src={favicoLogo}
              alt="Media Wave Technologies Icon"
              className="h-10 w-auto object-contain transform group-hover:scale-105 transition-transform duration-300"
            />
            <div className="flex flex-col text-left">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0f2942] leading-none">
                MEDIA WAVE
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-bold text-slate-500 mt-1">
                TECHNOLOGIES
              </span>
            </div>
          </a>

          {/* CENTER NAVIGATION LINKS (EXACT SAME AS IMAGE) */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a
              href="#home"
              onClick={(e) => scrollToSection(e, 'home')}
              className={`transition-colors py-1 relative ${activeNav === 'home' ? 'text-[#0284c7] font-bold' : 'hover:text-[#0284c7]'}`}
            >
              Home
              {activeNav === 'home' && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0284c7] rounded-full animate-fadeIn"></span>
              )}
            </a>

            <a
              href="#guide"
              onClick={(e) => scrollToSection(e, 'guide')}
              className={`transition-colors py-1 relative ${activeNav === 'guide' ? 'text-[#0284c7] font-bold' : 'hover:text-[#0284c7]'}`}
            >
              How It Works
              {activeNav === 'guide' && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0284c7] rounded-full animate-fadeIn"></span>
              )}
            </a>
            <a
              href="#features"
              onClick={(e) => scrollToSection(e, 'features')}
              className={`transition-colors py-1 relative ${activeNav === 'features' ? 'text-[#0284c7] font-bold' : 'hover:text-[#0284c7]'}`}
            >
              Features
              {activeNav === 'features' && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0284c7] rounded-full animate-fadeIn"></span>
              )}
            </a>
            <a
              href="#faq"
              onClick={(e) => scrollToSection(e, 'faq')}
              className={`transition-colors py-1 relative ${activeNav === 'faq' ? 'text-[#0284c7] font-bold' : 'hover:text-[#0284c7]'}`}
            >
              Help & FAQ
              {activeNav === 'faq' && (
                <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-[#0284c7] rounded-full animate-fadeIn"></span>
              )}
            </a>
          </nav>

          {/* RIGHT ACTION BUTTONS (EXACT PILL STYLES) */}
          <div className="hidden sm:flex items-center gap-3">

            {/* GET APK DEEP NAVY PILL */}
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 rounded-full bg-[#0f2942] hover:bg-[#1e3a8a] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-slate-900/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <FaDownload className="text-sm text-cyan-300" />
              <span>GET APK</span>
            </button>

            {/* WEB LOGIN WHITE & BLUE PILL */}
            <a
              href={webPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 border-2 border-[#0284c7] text-[#0284c7] text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <FaUserShield className="text-sm text-[#0284c7]" />
              <span>WEB LOGIN</span>
            </a>
          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-[#0284c7] focus:outline-none"
            >
              {mobileMenuOpen ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* MOBILE SLIDE-DOWN DRAWER */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-4 animate-fadeIn shadow-xl">
            <nav className="flex flex-col space-y-3 text-sm font-bold text-slate-700 text-left">
              <a
                href="#home"
                onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'home'); }}
                className={`py-2 px-3 rounded-lg flex items-center gap-2 ${activeNav === 'home' ? 'bg-blue-50 text-[#0284c7]' : 'hover:bg-blue-50 text-[#0f2942]'}`}
              >
                Home
              </a>
              <a
                href="#features"
                onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'features'); }}
                className={`py-2 px-3 rounded-lg ${activeNav === 'features' ? 'bg-blue-50 text-[#0284c7]' : 'hover:bg-blue-50'}`}
              >
                Features
              </a>
              <a
                href="#guide"
                onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'guide'); }}
                className={`py-2 px-3 rounded-lg ${activeNav === 'guide' ? 'bg-blue-50 text-[#0284c7]' : 'hover:bg-blue-50'}`}
              >
                How It Works
              </a>
              <a
                href="#faq"
                onClick={(e) => { setMobileMenuOpen(false); scrollToSection(e, 'faq'); }}
                className={`py-2 px-3 rounded-lg ${activeNav === 'faq' ? 'bg-blue-50 text-[#0284c7]' : 'hover:bg-blue-50'}`}
              >
                Help & FAQ
              </a>
              <a href={internshipUrl} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="py-2 px-3 rounded-lg hover:bg-blue-50">
                Internship Portal
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
              <button
                onClick={() => { setMobileMenuOpen(false); handleDownload(); }}
                className="w-full py-3 rounded-full bg-[#0f2942] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
              >
                <FaDownload className="text-cyan-300" /> GET APK (v1.0)
              </button>

              <a
                href={webPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-full bg-white border-2 border-[#0284c7] text-[#0284c7] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <FaUserShield className="text-[#0284c7]" /> Web Login
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION (MATCHING EXACT COMPOSITION FROM IMAGE) */}
      <section id="home" className="relative z-10 pt-10 pb-16 lg:pt-14 lg:pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">

            {/* HERO TEXT CONTENT (LEFT COLUMN) */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">

              {/* LIVE RELEASE BADGE PILL */}
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-50/90 border border-blue-200 text-[#0f2942] text-xs font-bold mb-6 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Official Employee App Release • Version 1.0.0</span>
                <span className="bg-[#0284c7] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  LIVE
                </span>
              </div>

              {/* MAIN HERO HEADLINE */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-[#0f2942] leading-[1.1] mb-6">
                Next-Gen Enterprise <br />
                <span className="text-[#0284c7]">
                  Workforce & Mobile
                </span> <br />
                <span className="text-[#0284c7]">
                  Ecosystem
                </span>
              </h1>

              {/* HERO SUBTITLE */}
              <p className="text-base text-slate-600 leading-relaxed mb-8 max-w-xl font-normal">
                Engineered exclusively for Media Wave Technologies personnel. Experience instant GPS attendance punching, daily work updates, fast leave requests, secure payslip downloads, expense tracking, and real-time team collaboration — directly from your Android phone.
              </p>

              {/* ACTION BUTTONS (EXACT STYLES FROM IMAGE) */}
              <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto mb-10">

                {/* PRIMARY BLUE DOWNLOAD BUTTON */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <FaDownload className="text-sm" />
                  <span>DIRECT EMPLOYEE DOWNLOAD</span>
                  <FaChevronRight className="text-xs ml-1" />
                </button>

                {/* SCAN QR CODE BUTTON */}
                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#0f2942] font-bold text-xs sm:text-sm transition-all shadow-xs hover:border-[#0284c7]"
                >
                  <FaQrcode className="text-base text-[#0284c7]" />
                  <span>Scan QR Code</span>
                </button>

                {/* WEB PORTAL BUTTON */}
                <a
                  href={webPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#0f2942] font-bold text-xs sm:text-sm transition-all shadow-xs hover:border-[#0284c7]"
                >
                  <FaGlobe className="text-base text-[#0284c7]" />
                  <span>Web Portal</span>
                </a>
              </div>

              {/* MINI FEATURE PILLS STRIP (EXACT 5 BADGES) */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0284c7] flex items-center justify-center">
                    <FaMapMarkerAlt />
                  </div>
                  <span>GPS Attendance</span>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#1e40af] flex items-center justify-center">
                    <HiOutlineDocumentText />
                  </div>
                  <span>Leave Management</span>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-cyan-50 text-[#0284c7] flex items-center justify-center">
                    <FaFilePdf />
                  </div>
                  <span>Payslip Downloads</span>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#0284c7] flex items-center justify-center">
                    <FaUsers />
                  </div>
                  <span>Team Collaboration</span>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FaShieldAlt />
                  </div>
                  <span>Secure & Reliable</span>
                </div>
              </div>

            </div>

            {/* HERO 3D PHONE MOCKUP & FLOATING CARDS (RIGHT COLUMN) */}
            <div className="lg:col-span-5 flex justify-center items-center relative">

              {/* SOFT AMBIENT BLUE BLOB SHAPE (EXACT MATCH FROM IMAGE) */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-200/50 via-blue-100/60 to-transparent rounded-full filter blur-2xl transform scale-95 pointer-events-none"></div>

              {/* MODERN SMARTPHONE FRAME */}
              <div className="relative w-[290px] sm:w-[310px] rounded-[48px] bg-slate-900 p-3 shadow-2xl shadow-blue-900/20 border-[5px] border-slate-800 ring-1 ring-slate-900/40 z-10">

                {/* DYNAMIC ISLAND NOTCH */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-950 rounded-full z-20 flex items-center justify-between px-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-800 ring-1 ring-slate-700"></div>
                  <div className="w-6 h-1 bg-slate-800 rounded-full"></div>
                </div>

                {/* PHONE SCREEN CONTENT */}
                <div className="w-full h-[570px] bg-gradient-to-b from-[#081226] via-[#060c1d] to-[#040814] rounded-[38px] overflow-hidden flex flex-col relative text-white select-none">

                  {/* APP STATUS BAR */}
                  <div className="pt-3 px-6 flex justify-between items-center text-[10px] text-slate-400 font-semibold z-10">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-emerald-400">● 5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* APP HEADER */}
                  <div className="mt-3 px-4 pb-3 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={favicoLogo} alt="M" className="h-6 w-auto object-contain" />
                      <div className="text-left">
                        <div className="text-xs font-bold text-white tracking-wide">Media Wave App</div>
                        <div className="text-[9px] text-slate-400 font-medium">Connected • Office V1.0</div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-[#1e40af] text-white flex items-center justify-center text-[10px] font-bold">
                      MW
                    </div>
                  </div>

                  {/* SCREEN BODY */}
                  <div className="flex-1 p-3.5 space-y-3 overflow-hidden text-left">

                    {/* GREETING CARD */}
                    <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/20">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Good Morning,</div>
                          <div className="text-sm font-black text-white mt-0.5">Alex Vance</div>
                          <div className="text-[10px] text-slate-400">Software Engineer - IT Dept</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* LIVE ATTENDANCE CARD */}
                    <div className="p-3 rounded-2xl bg-[#091124] border border-blue-900/40 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-200 flex items-center gap-1.5 text-[11px]">
                          <span className="text-emerald-400">💚</span> Live Attendance
                        </span>
                        <span className="text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> On Time
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-950/80 p-2 rounded-xl border border-slate-800/60">
                        <div>
                          <div className="text-[9px] text-slate-400">Punch In Time</div>
                          <div className="text-xs font-bold text-white">09:02 AM</div>
                        </div>
                        <div className="h-5 w-px bg-slate-800"></div>
                        <div>
                          <div className="text-[9px] text-slate-400">Current Status</div>
                          <div className="text-xs font-bold text-emerald-400">Punched In</div>
                        </div>
                      </div>

                      <button className="w-full py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-[11px] font-bold shadow-md flex items-center justify-center gap-1.5">
                        <FaMapMarkerAlt className="text-xs" />
                        <span>Log GPS Punch Out</span>
                      </button>
                    </div>

                    {/* 3 QUICK ACTIONS (DAILY TASKS, LEAVE REQ, PAYSLIP PDF) */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-[#091124] border border-slate-800 text-center flex flex-col items-center">
                        <HiOutlineDocumentText className="text-[#0284c7] text-base mb-1" />
                        <span className="text-[9px] font-semibold text-slate-200">Daily Tasks</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#091124] border border-slate-800 text-center flex flex-col items-center">
                        <FaCalendarAlt className="text-emerald-400 text-sm mb-1" />
                        <span className="text-[9px] font-semibold text-slate-200">Leave Req.</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[#091124] border border-slate-800 text-center flex flex-col items-center">
                        <FaFilePdf className="text-rose-400 text-sm mb-1" />
                        <span className="text-[9px] font-semibold text-slate-200">Payslip PDF</span>
                      </div>
                    </div>

                  </div>

                  {/* PHONE BOTTOM TAB BAR */}
                  <div className="py-2.5 px-5 border-t border-slate-800/80 bg-slate-950 flex justify-around items-center text-slate-400 text-xs">
                    <span className="text-[#0284c7] font-bold flex flex-col items-center text-[9px] gap-0.5">
                      <span className="text-sm">🏠</span> Home
                    </span>
                    <span className="hover:text-white flex flex-col items-center text-[9px] gap-0.5">
                      <span className="text-sm">📋</span> Tasks
                    </span>
                    <span className="hover:text-white flex flex-col items-center text-[9px] gap-0.5">
                      <span className="text-sm">📅</span> Leave
                    </span>
                    <span className="hover:text-white flex flex-col items-center text-[9px] gap-0.5">
                      <span className="text-sm">⠇</span> More
                    </span>
                  </div>

                  {/* HOME INDICATOR */}
                  <div className="pb-1.5 pt-0.5 flex justify-center bg-slate-950">
                    <div className="w-20 h-1 bg-slate-600 rounded-full"></div>
                  </div>

                </div>

              </div>

              {/* 2 FLOATING WHITE CARDS ON THE RIGHT (EXACT MATCH FROM IMAGE) */}
              <div className="absolute -right-4 sm:-right-8 top-16 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl hidden sm:flex items-center gap-3 text-xs text-left z-20 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base border border-emerald-100">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <div className="font-extrabold text-[#0f2942]">Real-time GPS Tracking</div>
                  <div className="text-[10px] text-slate-500 font-medium">Accurate & Secure</div>
                </div>
              </div>

              <div className="absolute -right-4 sm:-right-8 bottom-20 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xl hidden sm:flex items-center gap-3 text-xs text-left z-20">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-base border border-blue-100">
                  <FaShieldAlt />
                </div>
                <div>
                  <div className="font-extrabold text-[#0f2942]">Your Work Our Priority</div>
                  <div className="text-[10px] text-slate-500 font-medium">Safe • Smart • Simple</div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* STATS BAR ROW (EXACT 4 STATS WITH DIVIDERS FROM IMAGE) */}
      <section className="relative z-10 py-8 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">

            {/* STAT 1 */}
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-xl shrink-0">
                <FaUsers />
              </div>
              <div>
                <div className="text-2xl font-black text-[#0f2942] leading-none">20+</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Active Employees</div>
              </div>
            </div>

            {/* STAT 2 */}
            <div className="flex items-center gap-3.5 p-2 border-l border-slate-100 md:border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#0284c7] flex items-center justify-center text-xl shrink-0">
                <FaBuilding />
              </div>
              <div>
                <div className="text-2xl font-black text-[#0f2942] leading-none">5+</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Partner Companies</div>
              </div>
            </div>

            {/* STAT 3 */}
            <div className="flex items-center gap-3.5 p-2 border-l border-slate-100 md:border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                <FaShieldAlt />
              </div>
              <div>
                <div className="text-2xl font-black text-[#0f2942] leading-none">99.9%</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">System Uptime</div>
              </div>
            </div>

            {/* STAT 4 */}
            <div className="flex items-center gap-3.5 p-2 border-l border-slate-100 md:border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1e40af] flex items-center justify-center text-xl shrink-0">
                <FaBolt />
              </div>
              <div>
                <div className="text-2xl font-black text-[#0f2942] leading-none">24/7</div>
                <div className="text-xs font-semibold text-slate-500 mt-1">Support</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* RECENT UPDATED APK & DIRECT DOWNLOAD HUB SECTION */}
      <section id="download" className="relative z-10 py-16 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0f2942] text-xs font-bold uppercase tracking-wider mb-3">
              <FaAndroid className="text-sm text-emerald-600" /> Direct Mobile Distribution
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2942] tracking-tight">
              Recent Updated APK Download Hub
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Employees can directly download and install the latest APK build on their Android smartphones with zero store friction.
            </p>
          </div>

          {/* MAIN DOWNLOAD CARD */}
          <div className="max-w-4xl mx-auto rounded-3xl bg-white border-2 border-blue-100 p-6 sm:p-10 shadow-xl shadow-blue-900/5 relative overflow-hidden">

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">

              {/* LEFT: APK DETAILS & DOWNLOAD BUTTON */}
              <div className="md:col-span-8 flex flex-col items-start text-left">

                <div className="flex items-center gap-3.5 mb-4">
                  <img src={favicoLogo} alt="Logo" className="h-12 w-auto object-contain" />
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-[#0f2942]">Media Wave Mobile App</h3>
                    <p className="text-xs text-slate-500">Package: <span className="text-[#0284c7] font-mono font-semibold">com.mediawave.hrms</span></p>
                  </div>
                </div>

                {/* VERSION SPEC PILLS */}
                <div className="flex flex-wrap gap-2.5 mb-6 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[#0f2942] font-bold shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Latest Release: {apkInfo.version}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium shadow-xs">
                    📦 Size: {apkInfo.fileSize}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium shadow-xs">
                    📱 {apkInfo.minAndroid}
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold shadow-xs flex items-center gap-1">
                    <FaShieldAlt className="text-xs text-emerald-600" /> Verified Clean
                  </span>
                </div>

                {/* WHAT'S NEW BULLETS */}
                <div className="w-full p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-6 text-left shadow-xs">
                  <div className="text-xs font-bold text-[#0f2942] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <HiOutlineSparkles className="text-sm text-[#0284c7]" /> What's New in this Build (October 2026):
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                    <li><strong className="text-[#0f2942]">Precision Geo-Fencing:</strong> Instant 1-tap Attendance check-in with accurate GPS verification.</li>
                    <li><strong className="text-[#0f2942]">Payslips Download:</strong> Direct high-resolution PDF download with full earnings & deductions breakdown.</li>
                    <li><strong className="text-[#0f2942]">Daily Tasks & OD Requests:</strong> Real-time manager review, milestone tracking, and push alerts.</li>
                    <li><strong className="text-[#0f2942]">Expense Claims & Assets:</strong> Digital bill upload and hardware asset allocation requests.</li>
                  </ul>
                </div>

                {/* PRIMARY ACTIONS */}
                <div className="flex flex-wrap gap-3 w-full">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <FaDownload className="text-base" />
                    <span>{downloading ? 'Downloading APK...' : 'Download APK Direct (v1.0.0)'}</span>
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-xs"
                  >
                    {copiedLink ? <FaCheck className="text-emerald-600" /> : <FaCopy className="text-[#0284c7]" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy APK Link'}</span>
                  </button>
                </div>

              </div>

              {/* RIGHT: QR CODE FOR MOBILE SCANNING */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center shadow-xs">
                <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-blue-200 mb-4">
                  <svg className="w-36 h-36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="24" height="24" rx="4" fill="#0f2942" />
                    <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="18" width="8" height="8" rx="1" fill="#0284c7" />

                    <rect x="66" y="10" width="24" height="24" rx="4" fill="#0f2942" />
                    <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                    <rect x="74" y="18" width="8" height="8" rx="1" fill="#0284c7" />

                    <rect x="10" y="66" width="24" height="24" rx="4" fill="#0f2942" />
                    <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                    <rect x="18" y="74" width="8" height="8" rx="1" fill="#0284c7" />

                    <rect x="40" y="12" width="6" height="6" fill="#0f2942" />
                    <rect x="50" y="14" width="8" height="6" fill="#0284c7" />
                    <rect x="42" y="24" width="12" height="6" fill="#0f2942" />
                    <rect x="12" y="42" width="6" height="8" fill="#0f2942" />
                    <rect x="24" y="44" width="8" height="6" fill="#0284c7" />
                    <rect x="40" y="40" width="20" height="20" rx="3" fill="#1e40af" />
                    <rect x="46" y="46" width="8" height="8" fill="white" />
                    <rect x="68" y="42" width="10" height="6" fill="#0f2942" />
                    <rect x="80" y="48" width="8" height="8" fill="#0284c7" />
                    <rect x="42" y="68" width="8" height="8" fill="#0f2942" />
                    <rect x="54" y="74" width="10" height="6" fill="#0284c7" />
                    <rect x="68" y="66" width="8" height="10" fill="#0f2942" />
                    <rect x="80" y="78" width="8" height="10" fill="#0284c7" />
                  </svg>
                </div>
                <div className="text-xs font-bold text-[#0f2942] mb-1 flex items-center justify-center gap-1">
                  <FaQrcode className="text-[#0284c7]" /> Scan with Phone Camera
                </div>
                <p className="text-[11px] text-slate-500 max-w-[200px]">
                  Point your smartphone camera to immediately download the APK.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* HOW TO INSTALL & USE (STEP-BY-STEP VISUAL GUIDE) */}
      <section id="guide" className="relative z-10 py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0f2942] text-xs font-bold uppercase tracking-wider mb-3">
              <FaMobileAlt className="text-sm text-[#0284c7]" /> Easy Setup Guide
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2942] tracking-tight">
              How to Install & Use the App
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Get up and running in less than 2 minutes by following these 4 straightforward steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* STEP 1 */}
            <div className="relative p-7 rounded-3xl bg-[#f8fafc] border border-slate-200/90 hover:border-[#0284c7] transition-all group flex flex-col shadow-xs hover:shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0284c7] border border-blue-200 flex items-center justify-center text-lg font-black mb-4 group-hover:scale-105 transition-transform">
                01
              </div>
              <h3 className="text-lg font-bold text-[#0f2942] mb-2">
                Download APK
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">
                Tap the <strong className="text-[#0284c7]">Download APK</strong> button on this page or scan the QR code using your smartphone's camera.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <FaCheckCircle className="text-xs text-emerald-600" /> Direct & Fast Download
              </div>
            </div>

            {/* STEP 2 */}
            <div className="relative p-7 rounded-3xl bg-[#f8fafc] border border-slate-200/90 hover:border-[#1e40af] transition-all group flex flex-col shadow-xs hover:shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#1e40af] border border-indigo-200 flex items-center justify-center text-lg font-black mb-4 group-hover:scale-105 transition-transform">
                02
              </div>
              <h3 className="text-lg font-bold text-[#0f2942] mb-2">
                Allow Unknown Apps
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">
                When prompted by Android security, tap <strong className="text-[#1e40af]">Settings</strong> and enable <strong className="text-[#0f2942]">"Allow from this source"</strong> for Chrome or Files.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-[#1e40af] font-bold flex items-center gap-1">
                <FaShieldAlt className="text-xs" /> Standard Android Security Step
              </div>
            </div>

            {/* STEP 3 */}
            <div className="relative p-7 rounded-3xl bg-[#f8fafc] border border-slate-200/90 hover:border-[#0284c7] transition-all group flex flex-col shadow-xs hover:shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-[#0284c7] border border-cyan-200 flex items-center justify-center text-lg font-black mb-4 group-hover:scale-105 transition-transform">
                03
              </div>
              <h3 className="text-lg font-bold text-[#0f2942] mb-2">
                Sign In with Credentials
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">
                Launch the Media Wave App and log in using your registered employee email/username and password provided by HR.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-[#0284c7] font-bold flex items-center gap-1">
                <FaUserShield className="text-xs" /> Encrypted Session Token
              </div>
            </div>

            {/* STEP 4 */}
            <div className="relative p-7 rounded-3xl bg-[#f8fafc] border border-slate-200/90 hover:border-emerald-500 transition-all group flex flex-col shadow-xs hover:shadow-md">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-lg font-black mb-4 group-hover:scale-105 transition-transform">
                04
              </div>
              <h3 className="text-lg font-bold text-[#0f2942] mb-2">
                Punch In & Collaborate!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed flex-1">
                Grant GPS Location permission to enable 1-tap Attendance Punching, submit daily task updates, check leaves, and view payslips.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <FaRocket className="text-xs text-emerald-600" /> Ready to Work
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FULL COMPREHENSIVE FEATURES GRID (ALL 10 MODULES) */}
      <section id="features" className="relative z-10 py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0f2942] text-xs font-bold uppercase tracking-wider mb-3">
              <HiOutlineSparkles className="text-sm text-[#0284c7]" /> Complete Ecosystem Breakdown
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2942] tracking-tight">
              Powerful Features Engineered for Modern Teams
            </h2>
            <p className="mt-3 text-base text-slate-600">
              All 10 core modules designed to streamline attendance, operations, finance, and internal communication.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {appFeatures.map((feature) => (
              <div
                key={feature.id}
                className="p-7 rounded-3xl bg-white border border-slate-200/90 hover:border-[#0284c7] transition-all duration-300 flex flex-col justify-between group shadow-xs hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform shadow-xs">
                      {feature.icon}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0f2942] border border-blue-200 text-[10px] font-bold uppercase tracking-wider">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-[#0f2942] mb-1 group-hover:text-[#0284c7] transition-colors">
                    {feature.title}
                  </h3>
                  <div className="text-xs font-semibold text-[#0284c7] mb-3">
                    {feature.subtitle}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Key Highlights:</div>
                  <ul className="space-y-1.5">
                    {feature.highlights.map((h, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-center gap-2">
                        <FaCheck className="text-[10px] text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) */}
      <section id="faq" className="relative z-10 py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0f2942] text-xs font-bold uppercase tracking-wider mb-3">
              <FaInfoCircle className="text-xs text-[#0284c7]" /> Employee Help Desk
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0f2942] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Clear answers to common questions regarding installation, permissions, and features.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-slate-50 border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#0f2942] flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-white text-[#0284c7] text-xs font-bold flex items-center justify-center shrink-0 border border-blue-200 shadow-xs">
                        {index + 1}
                      </span>
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <FaChevronUp className="text-[#0284c7] text-xs shrink-0" />
                    ) : (
                      <FaChevronDown className="text-slate-400 text-xs shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* IT SUPPORT CALLOUT */}
          <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-white text-[#0284c7] flex items-center justify-center text-xl shrink-0 shadow-xs border border-blue-100">
                <FaHeadset />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0f2942]">Need Installation or Login Assistance?</h4>
                <p className="text-xs text-slate-600">Our IT operations support team is available during regular office hours.</p>
              </div>
            </div>
            <a
              href="mailto:support@mediawavetech.com"
              className="px-5 py-2.5 rounded-xl bg-[#0f2942] hover:bg-[#1e40af] text-white font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap shadow-sm"
            >
              Contact IT Support
            </a>
          </div>

        </div>
      </section>

      {/* QR CODE POPUP MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-8 rounded-3xl bg-white border border-slate-200 text-center shadow-2xl">

            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:text-black flex items-center justify-center text-sm font-bold"
            >
              ✕
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-[#0284c7] flex items-center justify-center text-2xl mb-4 border border-blue-200">
              <FaQrcode />
            </div>

            <h3 className="text-xl font-black text-[#0f2942] mb-1">Scan to Install APK</h3>
            <p className="text-xs text-slate-500 mb-6">
              Use your smartphone camera or Google Lens to download directly to your Android device.
            </p>

            <div className="p-4 bg-white rounded-2xl shadow-md inline-block mb-6 border-2 border-blue-200">
              <svg className="w-48 h-48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="100" height="100" fill="white" />
                <rect x="10" y="10" width="24" height="24" rx="4" fill="#0f2942" />
                <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                <rect x="18" y="18" width="8" height="8" rx="1" fill="#0284c7" />

                <rect x="66" y="10" width="24" height="24" rx="4" fill="#0f2942" />
                <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                <rect x="74" y="18" width="8" height="8" rx="1" fill="#0284c7" />

                <rect x="10" y="66" width="24" height="24" rx="4" fill="#0f2942" />
                <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                <rect x="18" y="74" width="8" height="8" rx="1" fill="#0284c7" />

                <rect x="40" y="12" width="6" height="6" fill="#0f2942" />
                <rect x="50" y="14" width="8" height="6" fill="#0284c7" />
                <rect x="42" y="24" width="12" height="6" fill="#0f2942" />
                <rect x="12" y="42" width="6" height="8" fill="#0f2942" />
                <rect x="24" y="44" width="8" height="6" fill="#0284c7" />
                <rect x="40" y="40" width="20" height="20" rx="3" fill="#1e40af" />
                <rect x="46" y="46" width="8" height="8" fill="white" />
                <rect x="68" y="42" width="10" height="6" fill="#0f2942" />
                <rect x="80" y="48" width="8" height="8" fill="#0284c7" />
                <rect x="42" y="68" width="8" height="8" fill="#0f2942" />
                <rect x="54" y="74" width="10" height="6" fill="#0284c7" />
                <rect x="68" y="66" width="8" height="10" fill="#0f2942" />
                <rect x="80" y="78" width="8" height="10" fill="#0284c7" />
              </svg>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Download on this Device
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="px-5 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LUXURY DEEP NAVY FOOTER (EXACT MATCH WITH REFERENCE DESIGN) */}
      <footer className="relative bg-[#021024] text-slate-300 pt-16 pb-12 overflow-hidden border-t-2 border-cyan-500/20">

        {/* SUBTLE AMBIENT GLOW */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-12">

            {/* COLUMN 1: BRAND & CREDENTIALS (4 COLS) */}
            <div className="lg:col-span-4 flex flex-col items-start text-left pr-0 lg:pr-4">
              <div className="flex items-center gap-3.5 mb-3">
                <img
                  src={favicoLogo}
                  alt="Media Wave Technologies Logo"
                  className="h-11 w-auto object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-wider text-white uppercase leading-none">
                    Media Wave
                  </span>
                  <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase leading-tight mt-1">
                    Technologies
                  </span>
                </div>
              </div>

              <h4 className="text-sm font-bold text-cyan-400 mb-3">
                Enterprise Software & Innovation
              </h4>

              <p className="text-xs text-slate-400 leading-relaxed mb-6 max-w-sm">
                We build modern, scalable and secure software solutions for businesses. From mobile apps to cloud platforms, we help ideas turn into real products.
              </p>

              {/* SECURITY & SLA BADGES */}
              <div className="flex flex-wrap items-center gap-3 w-full">
                <div className="flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-[#041a38] border border-blue-900/60 shadow-sm flex-1 sm:flex-initial">
                  <div className="w-8 h-8 rounded-lg bg-[#0284c7] text-white flex items-center justify-center shrink-0">
                    <FaShieldAlt className="text-sm" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-tight">ISO 27001</div>
                    <div className="text-[10px] text-slate-400">Certified Security</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 px-3.5 rounded-xl bg-[#041a38] border border-blue-900/60 shadow-sm flex-1 sm:flex-initial">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <FaChartLine className="text-sm" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-white leading-tight">99.9%</div>
                    <div className="text-[10px] text-slate-400">Uptime SLA</div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: QUICK LINKS (2 COLS) */}
            <div className="lg:col-span-2 text-left">
              <h4 className="text-sm font-bold text-white mb-1">
                Quick Links
              </h4>
              <div className="w-7 h-[2.5px] bg-cyan-400 rounded-full mb-5"></div>

              <ul className="space-y-3 text-xs font-medium">
                <li>
                  <a href="#" onClick={() => setActiveNav('home')} className="text-slate-400 hover:text-white flex items-center justify-between group transition-colors">
                    <span className="flex items-center gap-2.5">
                      <FaHome className="text-slate-400 group-hover:text-cyan-400 text-sm transition-colors" /> Home
                    </span>
                    <FaChevronRight className="text-[10px] text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </a>
                </li>
                <li>
                  <a href="#features" onClick={() => setActiveNav('features')} className="text-slate-400 hover:text-white flex items-center justify-between group transition-colors">
                    <span className="flex items-center gap-2.5">
                      <FaThLarge className="text-slate-400 group-hover:text-cyan-400 text-sm transition-colors" /> Features
                    </span>
                    <FaChevronRight className="text-[10px] text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </a>
                </li>
                <li>
                  <a href="#guide" onClick={() => setActiveNav('guide')} className="text-slate-400 hover:text-white flex items-center justify-between group transition-colors">
                    <span className="flex items-center gap-2.5">
                      <FaCog className="text-slate-400 group-hover:text-cyan-400 text-sm transition-colors" /> How It Works
                    </span>
                    <FaChevronRight className="text-[10px] text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </a>
                </li>
                <li>
                  <a href="#faq" onClick={() => setActiveNav('faq')} className="text-slate-400 hover:text-white flex items-center justify-between group transition-colors">
                    <span className="flex items-center gap-2.5">
                      <FaQuestionCircle className="text-slate-400 group-hover:text-cyan-400 text-sm transition-colors" /> Help & FAQ
                    </span>
                    <FaChevronRight className="text-[10px] text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </a>
                </li>
                <li>
                  <a href={internshipUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white flex items-center justify-between group transition-colors">
                    <span className="flex items-center gap-2.5">
                      <FaBriefcase className="text-slate-400 group-hover:text-cyan-400 text-sm transition-colors" /> Internship Portal
                    </span>
                    <FaChevronRight className="text-[10px] text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </a>
                </li>
              </ul>
            </div>

            {/* COLUMN 3: OUR PRODUCTS (2 COLS) */}
            <div className="lg:col-span-2 text-left">
              <h4 className="text-sm font-bold text-white mb-1">
                Our Products
              </h4>
              <div className="w-7 h-[2.5px] bg-cyan-400 rounded-full mb-5"></div>

              <ul className="space-y-3 text-xs font-medium">
                <li>
                  <button onClick={handleDownload} className="w-full text-slate-400 hover:text-white flex items-center justify-between group transition-colors text-left">
                    <span className="flex items-center gap-2.5">
                      <FaMobileAlt className="text-slate-400 group-hover:text-cyan-400 text-sm transition-colors" /> Media Wave App
                    </span>
                    <FaChevronRight className="text-[10px] text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </button>
                </li>
                <li>
                  <a href={webPortalUrl} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white flex items-center justify-between group transition-colors">
                    <span className="flex items-center gap-2.5">
                      <FaGlobe className="text-slate-400 group-hover:text-cyan-400 text-sm transition-colors" /> Web Portals
                    </span>
                    <FaChevronRight className="text-[10px] text-slate-600 group-hover:text-cyan-400 transition-colors" />
                  </a>
                </li>
              </ul>
            </div>

            {/* COLUMN 4: SUPPORT & OFFICE (2 COLS) */}
            <div className="lg:col-span-2 text-left">
              <h4 className="text-sm font-bold text-white mb-1">
                Support & Office
              </h4>
              <div className="w-7 h-[2.5px] bg-cyan-400 rounded-full mb-5"></div>

              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <FaMapMarkerAlt className="text-cyan-400 text-sm mt-0.5 shrink-0" />
                  <span className="text-[11px] leading-relaxed text-slate-300">
                    Media Wave Technologies,<br />
                    WD-54, Anantha Bhavanam Complex, Second floor, 17/52, Puthur High Rd, Tiruchirappalli, Tamil Nadu 620017
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <FaEnvelope className="text-cyan-400 text-sm shrink-0" />
                  <a href="mailto:info@mediawavetech.com" className="text-xs text-slate-300 hover:text-cyan-400 transition-colors">
                    info@mediawavetech.com
                  </a>
                </div>

                <div className="flex items-center gap-2.5">
                  <FaPhoneAlt className="text-cyan-400 text-sm shrink-0" />
                  <a href="tel:+919994445678" className="text-xs text-slate-300 hover:text-cyan-400 transition-colors">
                    +91 999 444 5678
                  </a>
                </div>

                {/* OFFICE HOURS CARD */}
                <div className="mt-3 p-3 rounded-xl bg-[#041a38] border border-blue-900/50">
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Office Hours
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Mon – Fri 9:30 AM – 6:00 PM
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 5: STAY CONNECTED (2 COLS) */}
            <div className="lg:col-span-2 text-left">
              <h4 className="text-sm font-bold text-white mb-1">
                Stay Connected
              </h4>
              <div className="w-7 h-[2.5px] bg-cyan-400 rounded-full mb-5"></div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Get the latest updates, product releases and career opportunities.
              </p>

              {/* NEWSLETTER INPUT BOX */}
              <form onSubmit={handleNewsletterSubmit} className="relative flex items-center bg-[#051c3c] border border-slate-700/60 rounded-full p-1 pl-3.5 mb-5 shadow-inner">
                <FaEnvelope className="text-slate-400 text-xs mr-2 shrink-0" />
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-transparent text-xs text-white placeholder-slate-400 focus:outline-none w-full pr-2"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold tracking-wide transition-all shadow-md shrink-0"
                >
                  Subscribe
                </button>
              </form>

              {/* SOCIAL MEDIA ICONS */}
              <div className="flex items-center gap-2">
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-full bg-[#051c3c] hover:bg-[#0284c7] text-slate-300 hover:text-white border border-slate-700/50 flex items-center justify-center text-xs transition-all shadow-xs"
                >
                  <FaLinkedinIn />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-8 h-8 rounded-full bg-[#051c3c] hover:bg-[#0284c7] text-slate-300 hover:text-white border border-slate-700/50 flex items-center justify-center text-xs transition-all shadow-xs"
                >
                  <FaYoutube />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                  className="w-8 h-8 rounded-full bg-[#051c3c] hover:bg-[#0284c7] text-slate-300 hover:text-white border border-slate-700/50 flex items-center justify-center text-xs transition-all shadow-xs"
                >
                  <FaTwitter />
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-full bg-[#051c3c] hover:bg-[#0284c7] text-slate-300 hover:text-white border border-slate-700/50 flex items-center justify-center text-xs transition-all shadow-xs"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-[#051c3c] hover:bg-[#0284c7] text-slate-300 hover:text-white border border-slate-700/50 flex items-center justify-center text-xs transition-all shadow-xs"
                >
                  <FaInstagram />
                </a>
              </div>
            </div>

          </div>

          {/* BOTTOM COPYRIGHT & LEGAL BAR */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="text-center md:text-left">
              © 2026 <strong className="text-white">Media Wave Technologies.</strong> All rights reserved.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-slate-400">
              <a href="#faq" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <span className="text-slate-700">|</span>
              <a href="#faq" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
              <span className="text-slate-700">|</span>
              <a href="#faq" className="hover:text-cyan-400 transition-colors">Security Overview</a>
            </div>

            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              System Status: Online
            </div>
          </div>

        </div>

        {/* BOTTOM DECORATIVE OCEAN WAVE ACCENT */}
        <div className="w-full overflow-hidden leading-none mt-10 -mb-12 pointer-events-none opacity-25">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-14 text-cyan-600">
            <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z" fill="currentColor"></path>
          </svg>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
