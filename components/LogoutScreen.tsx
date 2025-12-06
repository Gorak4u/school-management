import React from 'react';
import { LogIn, School } from 'lucide-react';

interface LogoutScreenProps {
  onLoginAgain: () => void;
}

export const LogoutScreen: React.FC<LogoutScreenProps> = ({ onLoginAgain }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute -bottom-24 -right-12 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      
      <div className="relative w-full max-w-sm text-center animate-fadeIn">
        <div className="relative bg-slate-900/60 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-8 z-10">
          <div className="inline-block p-3 bg-slate-800/80 border border-slate-700 rounded-xl mb-4">
            <School className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Logout Successful</h1>
          <p className="text-sm text-slate-400 mt-2">
            Thank you for using the SVS Admin Portal.
          </p>
          <button 
            onClick={onLoginAgain}
            className="group w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 mt-8"
          >
            <LogIn size={16} />
            <span>Log In Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};