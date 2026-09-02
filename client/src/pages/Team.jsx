
import { useState, useEffect } from 'react';
import { getTeam } from '@/services/api';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlinePhone, HiOutlineIdentification } from 'react-icons/hi2';
import logo from '../assets/logo.png';

const Team = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const { data } = await getTeam();
      setTeam(data.team);
    } catch (err) {
      toast.error('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Our Team</h1>
        <p className="text-slate-500 font-medium mt-1">Meet the people who make MediaWave awesome.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {team.map((member) => (
          <div 
            key={member._id} 
            className="group relative bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 overflow-hidden"
          >
            {/* Status Dot */}
            <div className="absolute top-8 right-8 z-10">
              <div className="relative">
                <div className={`w-3.5 h-3.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_15px_rgba(16,185,129,0.5)]`} />
                {member.isActive && (
                  <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                )}
              </div>
            </div>

            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative flex flex-col items-center">
              {/* Header: Logo and Profile */}
              <div className="flex items-center justify-center gap-6 mb-8 w-full">
                <div className="w-24 h-10 flex items-center justify-center opacity-80">
                  <img src={logo} alt="MediaWave" className="w-full h-full object-contain" />
                </div>
                <div className="w-px h-12 bg-slate-200" />
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-50">
                    {member.profilePicture ? (
                      <img src={member.profilePicture} alt={member.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-500">
                        <HiOutlineUser className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity Details */}
              <div className="text-center w-full space-y-1 mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                  {member.name}
                </h3>
                <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] bg-indigo-50 py-1.5 px-4 rounded-full inline-block">
                  {member.jobRole || 'Team Member'}
                </p>
              </div>

              {/* ID Details */}
              <div className="w-full bg-slate-50/80 rounded-3xl p-6 space-y-4 border border-slate-100">
                <div className="flex items-center gap-4 group/item">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover/item:text-indigo-500 transition-colors">
                    <HiOutlineIdentification className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</p>
                    <p className="text-sm font-bold text-slate-700">{member.employeeId || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group/item text-left">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover/item:text-indigo-500 transition-colors">
                    <HiOutlinePhone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</p>
                    <p className="text-sm font-bold text-slate-700 truncate max-w-[180px]">
                      {member.contact ? member.contact : (member.email || 'No contact info')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Barcode-style Footer Decor */}
              <div className="mt-8 w-full opacity-10 group-hover:opacity-20 transition-opacity">
                <div className="flex justify-between h-8 items-end gap-1">
                  {[...Array(20)].map((_, i) => (
                    <div key={i} className="bg-slate-900" style={{ width: `${Math.random() * 4 + 1}px`, height: `${Math.random() * 100}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {team.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HiOutlineUser className="w-10 h-10 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No team members found</h2>
          <p className="text-slate-500">The team list will appear here once members are added.</p>
        </div>
      )}
    </div>
  );
};

export default Team;
