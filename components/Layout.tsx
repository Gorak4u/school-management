
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, IndianRupee, CalendarCheck, BookOpen, Bus, MessageSquare,
  Menu, X, Settings, LogOut, GraduationCap, HardDrive, Cloud, Clock, Wallet, Banknote, FilePieChart, AlertTriangle,
  Calendar, Sheet, Key, Check
} from 'lucide-react';
import { LayoutProps } from '../types';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'teacher'] },
  { id: 'students', label: 'Students', icon: Users, roles: ['super_admin', 'admin'] },
  { id: 'teachers', label: 'Staff & Teachers', icon: GraduationCap, roles: ['super_admin', 'admin'] },
  { id: 'fees', label: 'Fee Management', icon: IndianRupee, roles: ['super_admin', 'admin'] },
  { id: 'expenses', label: 'Expenses', icon: Wallet, roles: ['super_admin', 'admin'] },
  { id: 'salaries', label: 'Staff Salaries', icon: Banknote, roles: ['super_admin'] },
  { id: 'reports', label: 'Financial Reports', icon: FilePieChart, roles: ['super_admin', 'admin'] },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['super_admin', 'admin', 'teacher'] },
  { id: 'academics', label: 'Academics & Exams', icon: BookOpen, roles: ['super_admin', 'admin', 'teacher'] },
  { id: 'timetable', label: 'Timetable', icon: Sheet, roles: ['super_admin', 'admin', 'teacher'] },
  { id: 'calendar', label: 'Calendar & Events', icon: Calendar, roles: ['super_admin', 'admin', 'teacher'] },
  { id: 'transport', label: 'Transport', icon: Bus, roles: ['super_admin', 'admin', 'teacher'] },
  { id: 'communications', label: 'Communications', icon: MessageSquare, roles: ['super_admin', 'admin', 'teacher'] },
];

export const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, settings, onLogout, saveStatus, lastGithubPushTime, githubSyncStatus, currentUser, onChangePassword
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  
  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderCloudSyncStatus = () => {
    switch (githubSyncStatus) {
      case 'pushing':
        return (
          <div className="flex items-center justify-center gap-2 text-yellow-600 animate-pulse">
            <Cloud size={10} />
            Cloud Syncing...
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center gap-2 text-red-500" title="Cloud sync failed. Check internet or PAT.">
            <AlertTriangle size={10} />
            Sync Failed
          </div>
        );
      case 'success':
      case 'idle':
        if (lastGithubPushTime) {
          return (
            <div className="flex items-center justify-center gap-2 text-indigo-500">
              <Cloud size={10} />
              Last Cloud Sync: {lastGithubPushTime.toLocaleTimeString()}
            </div>
          );
        }
        return <div className="text-slate-400">Cloud sync inactive.</div>;
      default:
        return null;
    }
  };

  const filteredNavItems = NAV_ITEMS.filter(item => 
    !currentUser || item.roles.includes(currentUser.role)
  );

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
        alert("New passwords do not match.");
        return;
    }
    const success = await onChangePassword(passData.old, passData.new);
    if (success) {
        alert("Password changed successfully.");
        setIsPasswordModalOpen(false);
        setPassData({ old: '', new: '', confirm: '' });
    } else {
        alert("Incorrect current password.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white text-slate-800 transform transition-transform duration-300 ease-in-out shadow-lg border-r border-slate-200
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 flex flex-col
      `}>
        <div className="h-20 flex items-center justify-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {settings.schoolLogo ? (
              <img src={settings.schoolLogo} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                {settings.name.charAt(0)}
              </div>
            )}
            <div>
              <span className="font-bold text-lg text-slate-800 block leading-tight">School</span>
              <span className="font-bold text-lg text-slate-800 block leading-tight">Management</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors
                ${activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-3">
           <div className="text-[10px] text-center space-y-1 mb-2">
              <div className={`flex items-center justify-center gap-2 ${saveStatus === 'Saving...' ? 'text-yellow-600 animate-pulse' : 'text-green-600'}`}>
                <HardDrive size={10} />
                Browser Storage: {saveStatus}
              </div>
             {renderCloudSyncStatus()}
           </div>
           
           {currentUser && (
             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
               <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                     {currentUser.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                      <div className="font-bold text-slate-700 text-xs truncate">{currentUser.name}</div>
                      <div className="text-slate-500 capitalize text-[10px]">{currentUser.role.replace('_', ' ')}</div>
                  </div>
               </div>
               <button 
                  onClick={() => setIsPasswordModalOpen(true)} 
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 text-slate-600 text-[10px] font-bold py-2 rounded-lg transition-all"
               >
                  <Key size={12} /> Change Password
               </button>
             </div>
           )}

          {currentUser?.role === 'super_admin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-colors
                ${activeTab === 'settings' 
                  ? 'bg-slate-200 text-slate-800' 
                  : 'text-slate-500 hover:bg-slate-100'
                }
              `}
            >
              <Settings size={16} />
              <span>Settings</span>
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-500">
            <Menu size={24} />
          </button>
          <div className="hidden lg:block">
            <h1 className="text-xl font-bold text-slate-800 capitalize">
                {NAV_ITEMS.find(item => item.id === activeTab)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
            <Clock size={16} />
            <span>{now.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs">{now.toLocaleTimeString()}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl animate-scaleIn">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Key size={18}/> Change Password</h3>
                    <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmitPassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                        <input type="password" required className="w-full border rounded-lg p-2 text-sm" value={passData.old} onChange={e => setPassData({...passData, old: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                        <input type="password" required className="w-full border rounded-lg p-2 text-sm" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
                        <input type="password" required className="w-full border rounded-lg p-2 text-sm" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} />
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700 w-full">Update Password</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
