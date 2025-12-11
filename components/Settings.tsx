
import React, { useState, useEffect } from 'react';
import { SchoolSettings, FeeStructure, Standard, Medium, WhatsAppGroup, SettingsProps, UserRole, Student, Teacher, FeeRecord, ExpenseRecord, SmtpConfig } from '../types';
import { Save, RefreshCw, Database, IndianRupee, ArrowUpCircle, Lock, Unlock, Download, Upload, AlertTriangle, CheckCircle, FolderHeart, Clock, Cloud, MessageCircle, Trash2, Palette, Image, HardDrive, Github, Loader2, Users, UserPlus, Key, Plus, BookOpen, Eye, EyeOff, FileSpreadsheet, LayoutTemplate, FileJson, Mail, Zap, X, AlertCircle, Folder } from 'lucide-react';
import { getAllData, restoreAllData } from '../utils/db'; // Use IndexedDB functions
import { compressImage } from '../utils/storage';
import { exportFullDatabaseToExcel, parseExcelDatabase } from '../utils/excel';

export const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  feeStructure, 
  onSave, 
  onSaveFeeStructure, 
  onRepopulate, 
  onFormat,
  onPromoteStudents,
  onAddWhatsAppGroup,
  onDeleteWhatsAppGroup,
  onConfigureAutoBackup,
  isAutoBackupActive,
  lastBackupTime,
  githubPat,
  githubRepo,
  onSaveGithubConfig,
  onForgetGithubConfig,
  onManualGithubSync,
  lastGithubPushTime,
  githubSyncStatus,
  currentUser,
  users,
  onAddUser,
  onDeleteUser,
  onAdminResetPassword,
  onImportData,
  lastEmailStatus
}) => {
  const [form, setForm] = useState<SchoolSettings>(settings);
  const [fees, setFees] = useState<FeeStructure[]>(feeStructure);
  const [activeTab, setActiveTab] = useState<'general' | 'fees' | 'operations' | 'users' | 'academics' | 'automation'>('general');
  const [saved, setSaved] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [newGroup, setNewGroup] = useState({ className: '', groupLink: '' });

  // GitHub State
  const [patInput, setPatInput] = useState('');
  const [repoInput, setRepoInput] = useState(githubRepo);
  const [pushMessage, setPushMessage] = useState('');

  // User Mgmt State
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'teacher' as UserRole });
  const [resetModal, setResetModal] = useState<{ isOpen: boolean; userId: string; username: string }>({ isOpen: false, userId: '', username: '' });
  const [newResetPass, setNewResetPass] = useState('');

  // Academic Config State
  const [newMedium, setNewMedium] = useState('');
  const [newStandard, setNewStandard] = useState('');
  const [selectedMediumConfig, setSelectedMediumConfig] = useState<string>('');

  // Recovery Key Visibility
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  
  // Automation State
  const [smtpForm, setSmtpForm] = useState<SmtpConfig>({
      host: '', port: 587, user: '', pass: '', senderName: settings.name, fromEmail: '', targetEmail: '', reportTimes: []
  });
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [newReportTime, setNewReportTime] = useState('');

  // Storage Paths
  const [appPaths, setAppPaths] = useState<{ userData: string; temp: string; documents: string } | null>(null);

  useEffect(() => {
    setForm(settings);
    setFees(feeStructure);
    if (settings.mediums.length > 0 && !selectedMediumConfig) {
        setSelectedMediumConfig(settings.mediums[0]);
    }
    if (settings.smtpConfig) {
        setSmtpForm(prev => ({...prev, ...settings.smtpConfig}));
    }
  }, [settings, feeStructure]);

  // Fetch App Paths on Mount
  useEffect(() => {
    if ((window as any).require) {
        try {
            const { ipcRenderer } = (window as any).require('electron');
            ipcRenderer.invoke('get-app-paths').then(setAppPaths);
        } catch (e) { console.error("Could not fetch app paths", e); }
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'schoolLogo' | 'principalSignature' | 'schoolBanner') => {
    const file = e.target.files?.[0];
    if (file) {
      const size = field === 'schoolBanner' ? 1200 : (field === 'schoolLogo' ? 128 : 200);
      const compressed = await compressImage(file, size, 0.8);
      setForm(prev => ({...prev, [field]: compressed }));
    }
  };
  
  const removeAsset = (field: 'schoolLogo' | 'principalSignature' | 'schoolBanner') => {
    if (isEditing) {
      if (window.confirm("Are you sure you want to remove this image?")) {
        setForm(prev => ({...prev, [field]: '' }));
      }
    }
  };

  const handleUnlockEdit = () => {
    if (isEditing) {
      setIsEditing(false);
      return;
    }
    if (currentUser?.role !== 'super_admin') {
      alert("ACCESS DENIED: Only the Super Admin (Principal) can modify system settings.");
      return;
    }
    setIsEditing(true);
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm("CAUTION: You are about to update system-wide settings. \n\nAre you sure?")) return;

    // Merge smtp settings into main form
    const updatedSettings = { ...form, smtpConfig: smtpForm };
    
    onSave(updatedSettings);
    onSaveFeeStructure(fees);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  // ... (Existing handlers) ...
  const handleAddGroup = (e: React.FormEvent) => { e.preventDefault(); if (newGroup.className && newGroup.groupLink) { onAddWhatsAppGroup(newGroup); setNewGroup({ className: '', groupLink: '' }); } };
  const handleDeleteGroup = (id: string) => { if (window.confirm("Delete this group?")) { onDeleteWhatsAppGroup(id); } };
  const handleSaveGitConfig = () => { if (!window.confirm("Update Cloud Backup credentials?")) return; onSaveGithubConfig({ pat: patInput || githubPat, repo: repoInput || githubRepo }); setPatInput(''); };
  const handleForgetGit = () => { if (window.confirm("Remove GitHub credentials?")) { onForgetGithubConfig(); } };
  const handleManualSync = async () => { setPushMessage('Syncing...'); const result = await onManualGithubSync(); setPushMessage(result.message); };
  const handleRepopulateClick = () => { if (window.confirm("WARNING: RESET to Demo Data?")) onRepopulate(); };
  const handleFormatClick = () => { if (window.confirm("CRITICAL: DELETE ALL DATA?")) onFormat(); };
  const handlePromote = () => { if (window.confirm("End Academic Year? This promotes all students.")) onPromoteStudents(); };
  
  const handleBackup = async () => { const success = await exportFullDatabaseToExcel(); if (success) alert("Excel export started."); else alert("Failed to export."); };
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !window.confirm("Overwrite data with Excel?")) return; parseExcelDatabase(file).then(data => { onImportData(data).then(() => { alert("Restore successful! Reloading..."); window.location.reload(); }); }).catch(err => { console.error(err); alert("Failed to parse Excel."); }); };
  const handleJsonExport = async () => { const data = await getAllData(); const jsonStr = JSON.stringify(data, null, 2); const blob = new Blob([jsonStr], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `SVS_Full_Backup_${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); };
  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file || !window.confirm("Overwrite data with JSON?")) return; const reader = new FileReader(); reader.onload = async (event) => { try { const json = JSON.parse(event.target?.result as string); const dataToRestore = json.data ? json.data : json; await onImportData(dataToRestore); alert("Backup restored. Reloading..."); window.location.reload(); } catch (err) { alert("Invalid JSON."); } }; reader.readAsText(file); };
  
  const handleAddUserSubmit = (e: React.FormEvent) => { e.preventDefault(); if (users.some(u => u.username === newUser.username)) { alert("Username exists!"); return; } onAddUser(newUser); setNewUser({ name: '', username: '', password: '', role: 'teacher' }); };
  const handleDeleteUserWrapper = (id: string) => { if (window.confirm("Delete this user?")) { onDeleteUser(id); } };

  // ... (Academics Handlers) ...
  const handleAddMedium = () => { if (newMedium && !form.mediums.includes(newMedium)) { if (window.confirm(`Add '${newMedium}'?`)) { setForm(prev => ({...prev, mediums: [...prev.mediums, newMedium]})); setNewMedium(''); } } };
  const handleRemoveMedium = (m: string) => { if (window.confirm(`Remove '${m}'?`)) setForm(prev => ({...prev, mediums: prev.mediums.filter(item => item !== m)})); };
  const handleAddStandard = () => { if (newStandard && !form.standards.includes(newStandard)) { setForm(prev => ({...prev, standards: [...prev.standards, newStandard]})); setNewStandard(''); } };
  const handleRemoveStandard = (s: string) => { if (window.confirm(`Remove Class '${s}'?`)) setForm(prev => ({...prev, standards: prev.standards.filter(item => item !== s)})); };
  const handleToggleStandardForMedium = (med: string, std: string) => { if (!isEditing) return; const currentList = (form.mediumSpecificStandards || {})[med] || form.standards; let newList; if (currentList.includes(std)) newList = currentList.filter(s => s !== std); else newList = [...currentList, std].sort((a,b) => form.standards.indexOf(a) - form.standards.indexOf(b)); setForm(prev => ({ ...prev, mediumSpecificStandards: { ...prev.mediumSpecificStandards, [med]: newList } })); };
  
  const updateFee = (standard: Standard, medium: Medium, amount: number) => { const exists = fees.some(f => f.standard === standard && f.medium === medium); if (exists) setFees(fees.map(f => f.standard === standard && f.medium === medium ? { ...f, tuitionFee: amount } : f)); else setFees([...fees, { standard, medium, tuitionFee: amount }]); };
  const getFee = (standard: Standard, medium: Medium) => fees.find(f => f.standard === standard && f.medium === medium)?.tuitionFee || 0;

  const inputClass = (isEditing: boolean) => `w-full border rounded-lg p-2 outline-none transition-colors ${isEditing ? 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500' : 'bg-slate-100 border-transparent text-slate-500 cursor-not-allowed'}`;
  const maskPat = (pat: string) => { if (!pat || pat.length < 12) return ''; return `${pat.substring(0, 4)}...${pat.substring(pat.length - 4)}`; };
  const confirmResetPassword = () => { if (resetModal.userId && newResetPass) { if (window.confirm(`Reset password for '${resetModal.username}'?`)) { onAdminResetPassword(resetModal.userId, newResetPass); setResetModal({ isOpen: false, userId: '', username: '' }); setNewResetPass(''); } } };

  const fillGmailDefaults = () => {
    setSmtpForm(prev => ({
        ...prev,
        host: 'smtp.gmail.com',
        port: 587
    }));
  };

  const handleAddReportTime = () => {
      if (newReportTime && !smtpForm.reportTimes.includes(newReportTime)) {
          setSmtpForm(prev => ({ ...prev, reportTimes: [...prev.reportTimes, newReportTime].sort() }));
          setNewReportTime('');
      }
  };

  const handleRemoveReportTime = (time: string) => {
      setSmtpForm(prev => ({ ...prev, reportTimes: prev.reportTimes.filter(t => t !== time) }));
  };

  // Automation Handlers
  const handleTestEmail = async () => {
      setTestingEmail(true);
      // Use electron IPC to send test email
      let ipcRenderer;
      try {
        if ((window as any).require) {
            ipcRenderer = (window as any).require('electron').ipcRenderer;
        }
      } catch (e) {
        console.warn("Electron require failed", e);
      }
      
      // Browser environment check (fallback if not in Electron)
      if (!ipcRenderer) {
          alert("Email automation requires the Desktop App (Electron). Browser version does not support SMTP.");
          setTestingEmail(false);
          return;
      }
      
      try {
          const result = await ipcRenderer.invoke('send-email', {
              smtpConfig: smtpForm,
              mailOptions: {
                  to: smtpForm.targetEmail || smtpForm.user,
                  subject: 'SVS Test Email',
                  text: 'This is a test email from SVS School Management Software. Your configuration is working!'
              }
          });
          
          if (result.success) {
              alert("Test email sent successfully! Please check your inbox (and spam folder).");
          } else {
              const errorMessage = result.error;
              const details = result.details || {};
              let detailedHelp = "";
              
              // Map common Node.js error codes to user friendly help
              if (errorMessage.includes("Invalid login") || details.code === 'EAUTH') {
                  detailedHelp = "\n\n❌ Authentication Failed: Please check your email and password.\n💡 Tip: For Gmail, you MUST use a 16-character 'App Password', not your login password.";
              } else if (errorMessage.includes("ETIMEDOUT")) {
                  detailedHelp = "\n\n❌ Connection Timed Out: Firewall or Antivirus blocking port " + smtpForm.port + ".\n💡 Tip: Try disabling antivirus temporarily or check internet connection.";
              } else if (errorMessage.includes("ESOCKET")) {
                  detailedHelp = "\n\n❌ Socket Error: The server rejected the connection type.\n💡 Tip: If using port 465, ensure the server supports implicit SSL.";
              }
              
              alert(`Failed to send email:\n${errorMessage}${detailedHelp}`);
          }
      } catch (e) {
          console.error(e);
          alert("Error communicating with mailer process: " + (e as Error).message);
      } finally {
          setTestingEmail(false);
      }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 inline-flex flex-wrap">
        {[ 
          { id: 'general', label: 'General', icon: Database }, 
          { id: 'academics', label: 'Academics', icon: BookOpen },
          { id: 'fees', label: 'Fees', icon: IndianRupee }, 
          { id: 'operations', label: 'Data Ops', icon: ArrowUpCircle }, 
          { id: 'automation', label: 'Automation', icon: Zap },
          { id: 'users', label: 'Users', icon: Users } 
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          <div className="p-8">
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
                <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">School Name</label><input type="text" disabled={!isEditing} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass(isEditing)} /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Address</label><textarea disabled={!isEditing} value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={3} className={inputClass(isEditing)} /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact</label><input type="text" disabled={!isEditing} value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label><input type="text" disabled={!isEditing} value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})} className={inputClass(isEditing)} /></div>
                </div>
                <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Principal Name</label><input type="text" disabled={!isEditing} value={form.principalName} onChange={e => setForm({...form, principalName: e.target.value})} className={inputClass(isEditing)} /></div>
                <div className="md:col-span-2 bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2"><Key size={14}/> Master Recovery Key</label>
                  <div className="flex gap-2 items-center"><div className="relative flex-1"><input type={showRecoveryKey ? "text" : "password"} disabled={!isEditing} value={form.recoveryKey} onChange={e => setForm({...form, recoveryKey: e.target.value})} className={`${inputClass(isEditing)} font-mono pr-10`} /><button type="button" onClick={() => setShowRecoveryKey(!showRecoveryKey)} disabled={!isEditing} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>{showRecoveryKey ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div><label className="block text-sm font-medium text-slate-700 mb-2">School Logo</label><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">{form.schoolLogo ? <img src={form.schoolLogo} className="w-full h-full object-cover"/> : <Image className="text-slate-400"/>}</div><div className="flex flex-col gap-2"><label className={`text-xs px-2 py-1 rounded border border-slate-200 bg-slate-100 cursor-pointer ${!isEditing ? 'opacity-50' : ''}`}><input type="file" disabled={!isEditing} onChange={e => handleFileChange(e, 'schoolLogo')} className="hidden" />Change...</label>{form.schoolLogo && isEditing && <button type="button" onClick={() => removeAsset('schoolLogo')} className="text-xs text-red-600">Remove</button>}</div></div></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-2">Principal Signature</label><div className="flex items-center gap-4"><div className="w-24 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">{form.principalSignature ? <img src={form.principalSignature} className="h-full object-contain p-2"/> : <Image className="text-slate-400"/>}</div><div className="flex flex-col gap-2"><label className={`text-xs px-2 py-1 rounded border border-slate-200 bg-slate-100 cursor-pointer ${!isEditing ? 'opacity-50' : ''}`}><input type="file" disabled={!isEditing} onChange={e => handleFileChange(e, 'principalSignature')} className="hidden" />Change...</label>{form.principalSignature && isEditing && <button type="button" onClick={() => removeAsset('principalSignature')} className="text-xs text-red-600">Remove</button>}</div></div></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-slate-700 mb-2">School Banner</label><div className="w-full h-32 bg-slate-100 border border-slate-200 rounded-xl overflow-hidden relative group flex items-center justify-center">{form.schoolBanner ? <img src={form.schoolBanner} className="w-full h-full object-cover" /> : <LayoutTemplate size={32} className="text-slate-400"/>}{isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-4"><label className="cursor-pointer bg-white px-3 py-2 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-2"><Upload size={14}/> Upload<input type="file" accept="image/*" onChange={e => handleFileChange(e, 'schoolBanner')} className="hidden"/></label>{form.schoolBanner && <button onClick={() => removeAsset('schoolBanner')} className="bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Trash2 size={14}/> Remove</button>}</div>}</div></div>
                </div>
              </div>
            )}

            {activeTab === 'academics' && (
              <div className="grid grid-cols-1 gap-8 animate-fadeIn max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200"><h3 className="font-bold text-lg text-slate-800 mb-4">Instruction Mediums</h3><div className="flex gap-2 mb-4"><input disabled={!isEditing} value={newMedium} onChange={e=>setNewMedium(e.target.value)} placeholder="e.g. CBSE" className="flex-1 p-2 border rounded text-sm"/><button type="button" disabled={!isEditing} onClick={handleAddMedium} className="bg-indigo-600 text-white px-3 rounded"><Plus size={16}/></button></div><div className="space-y-2 max-h-60 overflow-y-auto">{form.mediums.map((m, idx) => (<div key={idx} className="flex justify-between items-center bg-white p-2 rounded border shadow-sm"><span className="text-sm font-medium">{m}</span>{isEditing && <button onClick={() => handleRemoveMedium(m)} className="text-red-500 p-1"><Trash2 size={14}/></button>}</div>))}</div></div>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200"><h3 className="font-bold text-lg text-slate-800 mb-4">Classes</h3><div className="flex gap-2 mb-4"><input disabled={!isEditing} value={newStandard} onChange={e=>setNewStandard(e.target.value)} placeholder="e.g. 11" className="flex-1 p-2 border rounded text-sm"/><button type="button" disabled={!isEditing} onClick={handleAddStandard} className="bg-indigo-600 text-white px-3 rounded"><Plus size={16}/></button></div><div className="space-y-2 max-h-60 overflow-y-auto">{form.standards.map((s, idx) => (<div key={idx} className="flex justify-between items-center bg-white p-2 rounded border shadow-sm"><div className="flex items-center gap-2"><span className="text-xs text-slate-400 w-4">{idx+1}.</span><span className="text-sm font-medium">{s}</span></div>{isEditing && <button onClick={() => handleRemoveStandard(s)} className="text-red-500 p-1"><Trash2 size={14}/></button>}</div>))}</div></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><h3 className="font-bold text-lg text-slate-800 mb-2">Class Configuration</h3><div className="flex gap-2 mb-4 border-b pb-1">{form.mediums.map(m => (<button key={m} onClick={() => setSelectedMediumConfig(m)} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${selectedMediumConfig === m ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-slate-500'}`}>{m} Medium</button>))}</div>{selectedMediumConfig && <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">{form.standards.map(std => { const allowedList = (form.mediumSpecificStandards && form.mediumSpecificStandards[selectedMediumConfig]) || form.standards; const isChecked = allowedList.includes(std); return (<div key={std} onClick={() => handleToggleStandardForMedium(selectedMediumConfig, std)} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100'} ${!isEditing ? 'opacity-70 cursor-not-allowed' : ''}`}><div className={`w-4 h-4 rounded border flex items-center justify-center ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>{isChecked && <CheckCircle size={12} className="text-white"/>}</div><span className={`text-sm font-medium ${isChecked ? 'text-indigo-900' : 'text-slate-500'}`}>{std}</span></div>)})}</div>}</div>
              </div>
            )}

            {activeTab === 'fees' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">{form.mediums.map(medium => (<div key={medium} className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h3 className="font-bold text-slate-800 mb-4 border-b pb-2 border-slate-200">{medium} Medium Fees</h3><div className="space-y-3">{form.standards.filter(s => { const allowed = (form.mediumSpecificStandards && form.mediumSpecificStandards[medium]) || form.standards; return allowed.includes(s); }).map(std => (<div key={std} className="flex items-center justify-between"><span className="text-sm font-medium text-slate-600">{std}</span><input type="number" disabled={!isEditing} value={getFee(std, medium)} onChange={e => updateFee(std, medium, +e.target.value)} className={`${inputClass(isEditing)} w-28 text-right`} /></div>))}</div></div>))}</div>}
            
            {activeTab === 'operations' && (
              <div className="space-y-8 max-w-3xl mx-auto animate-fadeIn">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Database size={20} className="text-blue-600"/> Data Import / Export</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><button type="button" onClick={handleBackup} className="p-4 bg-white border border-green-200 rounded-lg text-left hover:bg-green-50 shadow-sm"><div className="font-bold flex items-center gap-2 text-green-700"><FileSpreadsheet size={18}/> Export Excel</div></button><label className="p-4 bg-white border border-blue-200 rounded-lg text-left hover:bg-blue-50 cursor-pointer shadow-sm"><div className="font-bold flex items-center gap-2 text-blue-700"><Upload size={18}/> Import Excel</div><input type="file" accept=".xlsx" className="hidden" onChange={handleRestore} /></label><button type="button" onClick={handleJsonExport} className="p-4 bg-white border border-indigo-200 rounded-lg text-left hover:bg-indigo-50 shadow-sm"><div className="font-bold flex items-center gap-2 text-indigo-700"><FileJson size={18}/> Export JSON</div></button><label className="p-4 bg-white border border-purple-200 rounded-lg text-left hover:bg-purple-50 cursor-pointer shadow-sm"><div className="font-bold flex items-center gap-2 text-purple-700"><Upload size={18}/> Import JSON</div><input type="file" accept=".json" className="hidden" onChange={handleJsonImport} /></label></div></div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h3 className="font-bold text-lg text-slate-800 mb-4">Auto-Backup</h3><div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm"><div className="flex items-center justify-between mb-2"><h4 className="font-bold text-slate-700 flex items-center gap-2"><HardDrive size={18}/> Local Auto-Backup</h4><span className={`text-xs px-2 py-1 rounded-full font-bold ${isAutoBackupActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{isAutoBackupActive ? 'Active' : 'Inactive'}</span></div><div className="flex items-center gap-4"><button type="button" onClick={onConfigureAutoBackup} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">{isAutoBackupActive ? 'Change Folder' : 'Configure'}</button>{lastBackupTime && <span className="text-xs text-slate-400">Last: {lastBackupTime.toLocaleTimeString()}</span>}</div></div></div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><div className="flex items-center justify-between mb-2"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Github size={20} /> GitHub Auto-Sync</h3><span className={`text-xs px-2 py-1 rounded-full font-bold ${githubPat ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{githubPat ? 'Active' : 'Inactive'}</span></div><div className="space-y-4"><div><label className="block text-xs font-medium text-slate-700 mb-1">Repo</label><input type="text" value={repoInput} onChange={(e) => setRepoInput(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" /></div><div><label className="block text-xs font-medium text-slate-700 mb-1">PAT</label><input type="password" value={patInput} onChange={(e) => setPatInput(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" /></div></div><div className="mt-4 flex items-center justify-between"><div className="flex gap-2"><button type="button" onClick={handleSaveGitConfig} className="px-4 py-2 bg-slate-800 text-white text-sm rounded-lg">Save</button><button type="button" onClick={handleManualSync} className="px-4 py-2 border rounded-lg text-sm">{githubSyncStatus === 'pushing' ? <Loader2 size={16} className="animate-spin"/> : 'Sync Now'}</button></div></div></div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h3 className="font-bold text-lg text-slate-800 mb-4">WhatsApp Groups</h3><form onSubmit={handleAddGroup} className="flex gap-2 mb-4"><input placeholder="Class Name" value={newGroup.className} onChange={e=>setNewGroup(prev=>({...prev, className: e.target.value}))} className="flex-1 p-2 border rounded text-sm"/><input placeholder="Link URL" value={newGroup.groupLink} onChange={e=>setNewGroup(prev=>({...prev, groupLink: e.target.value}))} className="flex-1 p-2 border rounded text-sm"/><button type="submit" className="px-4 bg-green-600 text-white text-sm rounded">Add</button></form>{(settings.whatsAppGroups || []).map(g => (<div key={g.id} className="flex justify-between items-center p-2 hover:bg-slate-100 rounded"><p className="text-sm">{g.className}</p><button type="button" onClick={() => handleDeleteGroup(g.id)}><Trash2 size={16} className="text-red-500"/></button></div>))}</div>
                
                {appPaths && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><Folder size={20}/> Storage Locations</h3>
                        <div className="space-y-3">
                            <div className="bg-white p-3 rounded border border-slate-200">
                                <div className="text-xs font-bold text-slate-500 uppercase">User Data (Database)</div>
                                <div className="text-xs font-mono text-slate-700 mt-1 break-all">{appPaths.userData}</div>
                            </div>
                            <div className="bg-white p-3 rounded border border-slate-200">
                                <div className="text-xs font-bold text-slate-500 uppercase">Temporary Files</div>
                                <div className="text-xs font-mono text-slate-700 mt-1 break-all">{appPaths.temp}</div>
                            </div>
                        </div>
                    </div>
                )}

                {currentUser?.role === 'super_admin' && (<div className="pt-8 border-t border-slate-200 space-y-4"><h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">Danger Zone</h3><div className="grid grid-cols-1 gap-4"><button type="button" onClick={handlePromote} className="p-4 border border-amber-200 rounded-lg text-left hover:bg-amber-50 "><div className="font-bold flex items-center gap-2 text-amber-700"><CheckCircle/>End of Academic Year</div></button><div className="grid grid-cols-2 gap-4"><button type="button" onClick={handleRepopulateClick} className="p-4 border border-blue-200 rounded-lg text-left hover:bg-blue-50"><div className="font-bold flex items-center gap-2 text-blue-700"><RefreshCw size={18}/> Repopulate Demo</div></button><button type="button" onClick={handleFormatClick} className="p-4 border border-red-200 rounded-lg text-left hover:bg-red-50"><div className="font-bold flex items-center gap-2 text-red-700"><Trash2 size={18}/> Format All</div></button></div></div></div>)}
              </div>
            )}

            {activeTab === 'automation' && (
                <div className="max-w-3xl mx-auto animate-fadeIn space-y-6">
                    {/* Last Status Card */}
                    {lastEmailStatus && (
                      <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${lastEmailStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                         <div className={`p-2 rounded-full shrink-0 ${lastEmailStatus.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
                            {lastEmailStatus.success ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
                         </div>
                         <div>
                            <h4 className="font-bold text-sm">Last Automated Report Status</h4>
                            <p className="text-xs mt-1 font-medium opacity-90">{lastEmailStatus.message}</p>
                            <div className="flex gap-4 mt-2 text-[10px] opacity-75 font-mono">
                               <span>Time: {new Date(lastEmailStatus.timestamp).toLocaleString()}</span>
                               <span>To: {lastEmailStatus.recipient}</span>
                            </div>
                         </div>
                      </div>
                    )}

                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-indigo-900 mb-2 flex items-center gap-2"><Zap size={20}/> Email Automation (Desktop Only)</h3>
                        <p className="text-sm text-indigo-700 mb-4">
                            Configure SMTP settings to enable automatic daily reports. 
                            This feature requires the application to be running in the desktop environment (Electron).
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">SMTP Host</label>
                                    {isEditing && (
                                        <button 
                                            type="button" 
                                            onClick={fillGmailDefaults} 
                                            className="text-[10px] text-indigo-600 font-bold hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded"
                                        >
                                            Auto-fill Gmail
                                        </button>
                                    )}
                                </div>
                                <input disabled={!isEditing} value={smtpForm.host} onChange={e => setSmtpForm({...smtpForm, host: e.target.value})} placeholder="smtp.gmail.com" className={inputClass(isEditing)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SMTP Port</label>
                                <input type="number" disabled={!isEditing} value={smtpForm.port} onChange={e => setSmtpForm({...smtpForm, port: parseInt(e.target.value)})} placeholder="587" className={inputClass(isEditing)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email User</label>
                                <input disabled={!isEditing} value={smtpForm.user} onChange={e => setSmtpForm({...smtpForm, user: e.target.value})} placeholder="school@gmail.com" className={inputClass(isEditing)} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password / App Password</label>
                                <div className="relative">
                                    <input type={showSmtpPass ? "text" : "password"} disabled={!isEditing} value={smtpForm.pass} onChange={e => setSmtpForm({...smtpForm, pass: e.target.value})} className={inputClass(isEditing)} />
                                    <button type="button" onClick={() => setShowSmtpPass(!showSmtpPass)} disabled={!isEditing} className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 ${!isEditing ? 'hidden' : ''}`}>{showSmtpPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                </div>
                                {smtpForm.host.includes('gmail') && (
                                    <div className="bg-amber-100 border border-amber-200 rounded p-2 mt-2">
                                        <p className="text-[10px] text-amber-800 flex items-start gap-1 font-semibold">
                                            <AlertCircle size={12} className="mt-0.5 shrink-0"/>
                                            Important for Gmail:
                                        </p>
                                        <p className="text-[10px] text-amber-700 mt-1 pl-4 leading-tight">
                                            You must use an <strong>App Password</strong> if 2FA is enabled. Your regular login password will NOT work.
                                            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="underline ml-1">Generate here</a>.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Email (Receiver)</label>
                                <input disabled={!isEditing} value={smtpForm.targetEmail} onChange={e => setSmtpForm({...smtpForm, targetEmail: e.target.value})} placeholder="admin@school.com, principal@school.com" className={inputClass(isEditing)} />
                                <p className="text-[10px] text-slate-400 mt-1">Separate multiple emails with commas</p>
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sender Name</label>
                                <input disabled={!isEditing} value={smtpForm.senderName} onChange={e => setSmtpForm({...smtpForm, senderName: e.target.value})} placeholder="SVS Admin" className={inputClass(isEditing)} />
                            </div>
                        </div>

                        {/* Scheduled Reports Config */}
                        <div className="mt-6 border-t border-indigo-200 pt-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Scheduled Report Times (24h format)</label>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {smtpForm.reportTimes && smtpForm.reportTimes.map((time, idx) => (
                                    <div key={idx} className="flex items-center bg-white px-3 py-1 rounded-full border border-indigo-200 text-sm font-mono text-indigo-700">
                                        {time}
                                        {isEditing && (
                                            <button onClick={() => handleRemoveReportTime(time)} className="ml-2 text-red-500 hover:text-red-700">
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {smtpForm.reportTimes?.length === 0 && <span className="text-sm text-slate-400 italic">No reports scheduled</span>}
                            </div>
                            
                            {isEditing && (
                                <div className="flex gap-2 max-w-xs">
                                    <input 
                                        type="time" 
                                        value={newReportTime} 
                                        onChange={e => setNewReportTime(e.target.value)} 
                                        className="border rounded-lg p-1.5 text-sm flex-1"
                                    />
                                    <button 
                                        onClick={handleAddReportTime}
                                        disabled={!newReportTime}
                                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleTestEmail} disabled={isEditing || !smtpForm.host || testingEmail} className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                {testingEmail ? <Loader2 size={16} className="animate-spin"/> : <Mail size={16} />} 
                                {testingEmail ? 'Sending...' : 'Send Test Email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'users' && currentUser?.role === 'super_admin' && (
              <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                    <UserPlus size={20}/> Create New User
                  </h3>
                  <form onSubmit={handleAddUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">Full Name</label>
                        <input required value={newUser.name} onChange={e => setNewUser(prev => ({...prev, name: e.target.value}))} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. John Doe"/>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">Role</label>
                        <select value={newUser.role} onChange={e => setNewUser(prev => ({...prev, role: e.target.value as UserRole}))} className="w-full border rounded-lg p-2 text-sm">
                          <option value="super_admin">Super Admin</option>
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">Username</label>
                        <input required value={newUser.username} onChange={e => setNewUser(prev => ({...prev, username: e.target.value}))} className="w-full border rounded-lg p-2 text-sm"/>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-700 mb-1 block">Password</label>
                        <input required type="password" value={newUser.password} onChange={e => setNewUser(prev => ({...prev, password: e.target.value}))} className="w-full border rounded-lg p-2 text-sm"/>
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700">Create</button>
                    </div>
                  </form>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-700">Existing Users</div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="p-4">Name</th>
                        <th className="p-4">Username</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="p-4 font-medium text-slate-800">{u.name}</td>
                          <td className="p-4 text-slate-500">{u.username}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {u.id !== currentUser.id && (
                                <>
                                  <button onClick={() => setResetModal({ isOpen: true, userId: u.id, username: u.username })} className="text-amber-500 hover:bg-amber-50 p-2 rounded" title="Reset Password"><Lock size={16}/></button>
                                  {u.username !== 'admin' && (
                                    <button onClick={() => handleDeleteUserWrapper(u.id)} className="text-red-500 hover:bg-red-50 p-2 rounded" title="Delete User"><Trash2 size={16}/></button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-4">
            <button type="button" onClick={handleUnlockEdit} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isEditing ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
              {isEditing ? <Unlock size={16} /> : <Lock size={16} />} {isEditing ? 'Editing Enabled' : 'Unlock to Edit'}
            </button>
            <button type="button" onClick={handleSubmit} disabled={!isEditing} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${saved ? 'bg-green-600 shadow-green-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
              <Save size={18} /> {saved ? 'Saved' : 'Save All Settings'}
            </button>
          </div>
        </div>

      {resetModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
                <h3 className="font-bold text-slate-800 mb-4">Reset Password for {resetModal.username}</h3>
                <input type="password" placeholder="Enter new password" className="w-full border rounded-lg p-2 text-sm mb-4" value={newResetPass} onChange={e => setNewResetPass(e.target.value)} />
                <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setResetModal({ isOpen: false, userId: '', username: '' })} className="px-4 py-2 text-sm text-slate-600 rounded">Cancel</button>
                    <button type="button" onClick={confirmResetPassword} className="px-4 py-2 text-sm text-white bg-amber-600 rounded font-bold">Reset</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
