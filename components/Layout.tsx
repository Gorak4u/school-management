
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, IndianRupee, CalendarCheck, BookOpen, Bus, MessageSquare,
  Menu, X, Settings, LogOut, GraduationCap, HardDrive, Cloud, Clock, Wallet, Banknote, FilePieChart, AlertTriangle,
  Calendar, Sheet, Key, Check, Search, ArrowRight, Bell, Sun, Moon, Command as CommandIcon
} from 'lucide-react';
import { LayoutProps, Student } from '../types';
import { getMediumStyles } from '../utils/styles';
import { CommandPalette } from './CommandPalette';

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
  children, activeTab, setActiveTab, settings, onLogout, saveStatus, lastGithubPushTime, githubSyncStatus, currentUser, onChangePassword,
  students, onGlobalSearchSelect, isDarkMode, toggleTheme
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [now, setNow] = useState(new Date());
  
  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const searchResults = students.filter(s => {
    if (!searchQuery) return false;
    const term = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      (s.stsId && s.stsId.toLowerCase().includes(term)) ||
      s.phone.includes(term)
    );
  }).slice(0, 5);

  const handleSearchResultClick = (student: Student) => {
    onGlobalSearchSelect(student);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const renderCloudSyncStatus = () => {
    switch (githubSyncStatus) {
      case 'pushing':
        return (
          <div className="flex items-center gap-2 text-yellow-400 animate-pulse text-[10px] font-medium">
            <Cloud size={12} />
            Syncing...
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400 text-[10px] font-medium" title="Cloud sync failed. Check internet or PAT.">
            <AlertTriangle size={12} />
            Sync Failed
          </div>
        );
      case 'success':
      case 'idle':
        if (lastGithubPushTime) {
          return (
            <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-medium">
              <Cloud size={12} />
              Synced: {lastGithubPushTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          );
        }
        return <div className="text-slate-500 text-[10px]">Cloud sync inactive.</div>;
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
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      <CommandPalette 
        setActiveTab={setActiveTab} 
        students={students} 
        onStudentSelect={onGlobalSearchSelect} 
        isDarkMode={isDarkMode}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* DARK SIDEBAR */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 transform transition-transform duration-300 ease-in-out shadow-2xl
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:relative lg:translate-x-0 flex flex-col
        `}>
          {/* Logo Area */}
          <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md">
            <div className="flex items-center gap-3 w-full">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-900/50 shrink-0">
                {settings.schoolLogo ? (
                  <img src={settings.schoolLogo} alt="Logo" className="h-full w-full object-cover rounded-xl" />
                ) : (
                  <span className="font-bold text-lg">{settings.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-white text-sm truncate leading-tight tracking-wide" title={settings.name}>
                  {settings.name}
                </h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5 truncate">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {filteredNavItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' 
                      : 'hover:bg-slate-800 hover:text-white'
                    }
                  `}
                >
                  <item.icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                  <span>{item.label}</span>
                  {isActive && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>}
                </button>
              )
            })}
          </nav>

          {/* Settings Tab - explicitly placed at bottom for visibility */}
          <div className="px-4 py-2 border-t border-slate-800/50">
             <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${activeTab === 'settings' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' 
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'
                  }
                `}
              >
                <Settings size={18} className={`${activeTab === 'settings' ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
                <span>Settings</span>
              </button>
          </div>

          {/* Footer / User Profile */}
          <div className="p-4 border-t border-slate-800 bg-slate-950">
             <div className="space-y-3 mb-4">
                <div className={`flex items-center gap-2 text-[10px] font-medium ${saveStatus === 'Saving...' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  <HardDrive size={12} />
                  Storage: {saveStatus}
                </div>
               {renderCloudSyncStatus()}
             </div>
             
             {currentUser && (
               <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                       {currentUser.name.charAt(0)}
                    </div>
                    <div className="overflow-hidden flex-1">
                        <div className="font-bold text-white text-xs truncate">{currentUser.name}</div>
                        <div className="text-slate-400 capitalize text-[10px]">{currentUser.role.replace('_', ' ')}</div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setIsPasswordModalOpen(true)} 
                        className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] font-bold py-1.5 rounded-lg transition-all"
                    >
                        <Key size={10} /> Password
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-bold py-1.5 rounded-lg transition-all"
                    >
                        <LogOut size={10} /> Sign Out
                    </button>
                 </div>
               </div>
             )}
          </div>
        </aside>

        <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-200 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/50'}`}>
          {/* Header */}
          <header className={`h-16 backdrop-blur-md border-b flex items-center justify-between px-6 shrink-0 z-30 sticky top-0 transition-colors duration-200 ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden p-2 rounded-lg ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'}`}>
                <Menu size={24} />
              </button>
              <div className="hidden lg:block">
                <h1 className={`text-xl font-bold capitalize tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {NAV_ITEMS.find(item => item.id === activeTab)?.label || (activeTab === 'settings' ? 'Settings' : 'Dashboard')}
                </h1>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="flex-1 max-w-xl mx-4 relative group hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                  <div className={`w-full flex items-center justify-between pl-10 pr-4 py-2 border-2 border-transparent rounded-xl text-sm transition-all cursor-text ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`} onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
                    <span>Type to search...</span>
                    <span className="text-[10px] border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5">⌘ K</span>
                  </div>
                </div>
            </div>

            <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
              <button 
                onClick={toggleTheme} 
                className={`p-2 rounded-full transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className={`hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <Clock size={16} className="text-indigo-500" />
                <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className={`w-px h-4 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-200'}`}></span>
                <span className="font-mono text-indigo-500 font-bold">{now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          </header>

          {/* Optional Banner below header */}
          {settings.schoolBanner && activeTab === 'dashboard' && (
            <div className="w-full h-32 md:h-40 bg-slate-900 overflow-hidden relative shadow-md shrink-0">
              <img src={settings.schoolBanner} alt="School Banner" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 md:p-8">
                 <div className="animate-fadeIn">
                    <h1 className="text-white text-2xl md:text-3xl font-bold drop-shadow-lg tracking-tight">{settings.name}</h1>
                    <p className="text-slate-300 text-sm font-medium">{settings.address}</p>
                 </div>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
            {children}
          </main>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scaleIn border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><Key size={18} className="text-indigo-600"/> Change Password</h3>
                    <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <form onSubmit={handleSubmitPassword} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Current Password</label>
                        <input type="password" required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={passData.old} onChange={e => setPassData({...passData, old: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                        <input type="password" required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm New Password</label>
                        <input type="password" required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} />
                    </div>
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all w-full">Update Password</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
