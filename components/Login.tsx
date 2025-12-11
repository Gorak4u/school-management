
import React, { useState } from 'react';
import { Lock, User as UserIcon, School, ArrowRight, ShieldAlert, Key } from 'lucide-react';
import { User, LoginProps } from '../types';

export const Login: React.FC<LoginProps> = ({ onLogin, users, onRecoverAccount, schoolName, schoolLogo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRecovery, setIsRecovery] = useState(false);
  
  // Recovery State
  const [recoveryKey, setRecoveryKey] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState({ type: '', text: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid username or password.');
      setUsername('');
      setPassword('');
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onRecoverAccount(recoveryKey, newAdminPass);
    if (success) {
        setRecoveryMessage({ type: 'success', text: 'Super Admin password reset successfully. Please login.' });
        setTimeout(() => {
            setIsRecovery(false);
            setRecoveryMessage({ type: '', text: '' });
            setRecoveryKey('');
            setNewAdminPass('');
        }, 2000);
    } else {
        setRecoveryMessage({ type: 'error', text: 'Invalid Master Recovery Key.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute top-40 -right-24 w-72 h-72 bg-pink-600 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="relative w-full max-w-sm animate-fadeIn">
        <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-8 z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4 bg-white/5 border border-white/10 shadow-lg w-28 h-28">
              {schoolLogo ? (
                <img src={schoolLogo} alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl">
                    <School className="text-indigo-400" size={40} />
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">{schoolName || 'School Management System'}</h1>
            <p className="text-sm text-slate-400 mt-1">Admin Portal</p>
          </div>

          {!isRecovery ? (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                <div className="relative">
                    <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    placeholder="Enter username"
                    style={{ colorScheme: 'dark' }} // Force input rendering for readability
                    />
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                </div>
                </div>
                
                <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                    <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                    placeholder="Enter password"
                    style={{ colorScheme: 'dark' }} // Force input rendering for readability
                    />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                </div>
                </div>

                {error && (
                <div className="text-red-400 text-xs text-center bg-red-900/30 p-2 rounded-md border border-red-500/30">
                    {error}
                </div>
                )}

                <button 
                type="submit" 
                className="group w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2"
                >
                <span>Secure Sign In</span>
                <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} />
                </button>
                
                <div className="text-center pt-2">
                    <button type="button" onClick={() => setIsRecovery(true)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                        Forgot Password?
                    </button>
                </div>
            </form>
          ) : (
            <form onSubmit={handleRecoverySubmit} className="space-y-6 animate-scaleIn">
                <div className="text-center text-amber-400 flex flex-col items-center gap-2 mb-4">
                    <ShieldAlert size={32} />
                    <h3 className="font-bold">Super Admin Recovery</h3>
                    <p className="text-xs text-slate-400">Enter the Master Recovery Key to reset the Super Admin password.</p>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Master Recovery Key</label>
                    <div className="relative">
                        <input 
                        type="password" 
                        value={recoveryKey}
                        onChange={(e) => setRecoveryKey(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
                        placeholder="Enter secret key"
                        style={{ colorScheme: 'dark' }}
                        />
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                    <div className="relative">
                        <input 
                        type="password" 
                        value={newAdminPass}
                        onChange={(e) => setNewAdminPass(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-500"
                        placeholder="Set new password"
                        style={{ colorScheme: 'dark' }}
                        />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    </div>
                </div>

                {recoveryMessage.text && (
                    <div className={`text-xs text-center p-2 rounded-md border ${recoveryMessage.type === 'success' ? 'bg-green-900/30 border-green-500/30 text-green-400' : 'bg-red-900/30 border-red-500/30 text-red-400'}`}>
                        {recoveryMessage.text}
                    </div>
                )}

                <div className="flex gap-3">
                    <button 
                        type="button" 
                        onClick={() => { setIsRecovery(false); setRecoveryMessage({type:'', text:''}); }}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors text-xs"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-amber-900/40 text-xs"
                    >
                        Reset Password
                    </button>
                </div>
            </form>
          )}
          
          <div className="text-center text-[10px] text-slate-500 tracking-wider uppercase pt-4 border-t border-slate-800 mt-6">
            © {new Date().getFullYear()} • School Management System
          </div>
        </div>
      </div>
    </div>
  );
};
