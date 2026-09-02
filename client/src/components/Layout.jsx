import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import { HiOutlineBars3, HiOutlineXMark, HiOutlineSignal } from 'react-icons/hi2';
import logo from '../assets/logo.png';

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { connected } = useSelector((state) => state.socket);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <div className="fixed bottom-6 right-8 z-[100] hidden md:flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 shadow-lg select-none group">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{connected ? 'Live Sync active' : 'Sync Offline'}</span>
        {connected && <HiOutlineSignal className="w-3 h-3 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />}
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-[60]">
        <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <div className="h-10 overflow-hidden flex items-center">
                <img src={logo} alt="MediaWave Logo" className="h-full object-contain" />
            </div>
        </div>
       <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
        >
          {isSidebarOpen ? <HiOutlineXMark className="w-6 h-6" /> : <HiOutlineBars3 className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Pass state to control mobile visibility */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-10 pb-24 transition-all duration-300 min-h-screen flex flex-col">
        <div className="max-w-7xl mx-auto w-full fade-in flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
