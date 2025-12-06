import React, { useState, useEffect } from 'react';
import { SchoolSettings, FeeStructure, Standard, Medium, WhatsAppGroup, SettingsProps, UserRole } from '../types';
import { Save, RefreshCw, Database, IndianRupee, ArrowUpCircle, Lock, Unlock, Download, Upload, AlertTriangle, CheckCircle, FolderHeart, Clock, Cloud, MessageCircle, Trash2, Palette, Image, HardDrive, Github, Loader2, Users, UserPlus, Key, Plus, BookOpen, Eye, EyeOff } from 'lucide-react';
import { getAllData, restoreAllData } from '../utils/db'; // Use IndexedDB functions
import { compressImage } from '../utils/storage';

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
  onAdminResetPassword
}) => {
  const [form, setForm] = useState<SchoolSettings>(settings);
  const [fees, setFees] = useState<FeeStructure[]>(feeStructure);
  const [activeTab, setActiveTab] = useState<'general' | 'fees' | 'operations' | 'users' | 'academics'>('general');
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

  // Recovery Key Visibility
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);

  // Sync local state with props when they change (e.g. after data reload/repopulate)
  useEffect(() => {
    setForm(settings);
    setFees(feeStructure);
  }, [settings, feeStructure]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'schoolLogo' | 'principalSignature') => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file, field === 'schoolLogo' ? 128 : 200, 0.8);
      setForm(prev => ({...prev, [field]: compressed }));
    }
  };
  
  const removeAsset = (field: 'schoolLogo' | 'principalSignature') => {
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
    
    // Strict Check: Only Super Admin can unlock
    if (currentUser?.role !== 'super_admin') {
      alert("ACCESS DENIED: Only the Super Admin (Principal) can modify system settings.");
      return;
    }
    
    setIsEditing(true);
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!window.confirm("CAUTION: You are about to update system-wide settings. This may affect fees, reports, and receipts. \n\nAre you sure you want to proceed?")) {
        return;
    }

    onSave(form);
    onSaveFeeStructure(fees);
    setSaved(true);
    setIsEditing(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroup.className && newGroup.groupLink) {
      onAddWhatsAppGroup(newGroup);
      setNewGroup({ className: '', groupLink: '' });
    }
  };
  
  const handleDeleteGroup = (id: string) => {
    if (window.confirm("Are you sure you want to delete this WhatsApp group link?")) {
      onDeleteWhatsAppGroup(id);
    }
  };
  
  const handleSaveGitConfig = () => {
    if (!window.confirm("CAUTION: You are updating the Cloud Backup credentials. Ensure the PAT and Repository are correct. Continue?")) return;

    const patToSave = patInput || githubPat;
    const repoToSave = repoInput || githubRepo;
    if (!patToSave) {
        alert("Please enter a Personal Access Token.");
        return;
    }
    if (!repoToSave) {
        alert("Please enter a GitHub Repository.");
        return;
    }
    onSaveGithubConfig({ pat: patToSave, repo: repoToSave });
    setPatInput(''); // Clear PAT input after saving
  };
  
  const handleForgetGit = () => {
    if (window.confirm("Are you sure you want to remove GitHub credentials? Automatic cloud backups will STOP immediately.")) {
      onForgetGithubConfig();
    }
  };

  const handleManualSync = async () => {
    setPushMessage('Syncing...');
    const result = await onManualGithubSync();
    setPushMessage(result.message);
  };

  const handleRepopulateClick = () => { if (window.confirm("WARNING: This will wipe current data and RESTORE the 2000 demo students/records. \n\nAll current data will be lost. Continue?")) onRepopulate(); };
  const handleFormatClick = () => { if (window.confirm("CRITICAL WARNING: This will PERMANENTLY DELETE ALL DATA and leave the database completely empty. \n\nThis action cannot be undone. Are you sure?")) onFormat(); };
  const handlePromote = () => { if (window.confirm("CAUTION: You are about to end the academic year.\n\n- All students will be promoted to the next class.\n- Current fees will be archived.\n- New fee dues will be generated.\n\nDo you want to proceed?")) onPromoteStudents(); };
  
  const handleBackup = async () => {
    const allData = await getAllData();
    const blob = new Blob([JSON.stringify({timestamp: new Date().toISOString(), version: '2.0-indexedDB', data: allData}, null, 2)], {type: "application/json"});
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SVS_Backup_DB_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };
  
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !window.confirm("CRITICAL CAUTION: Restoring will completely OVERWRITE all current data with the contents of this backup file.\n\nAre you sure you want to proceed?")) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.data) throw new Error("Invalid backup file");
        
        await restoreAllData(parsed.data);

        alert("Restore successful. The application will now reload.");
        window.location.reload();
      } catch (err) {
        console.error(err);
        alert("Failed to restore data. The backup file might be corrupted or invalid.");
      }
    };
    reader.readAsText(file);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (users.some(u => u.username === newUser.username)) {
      alert("Username already exists!");
      return;
    }
    onAddUser(newUser);
    setNewUser({ name: '', username: '', password: '', role: 'teacher' });
  };
  
  const handleDeleteUserWrapper = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user? They will no longer be able to log in.")) {
      onDeleteUser(id);
    }
  };

  // -- Dynamic Config Handlers --
  const handleAddMedium = () => {
    if (newMedium && !form.mediums.includes(newMedium)) {
      if (window.confirm(`Add new medium '${newMedium}'?`)) {
        setForm(prev => ({...prev, mediums: [...prev.mediums, newMedium]}));
        setNewMedium('');
      }
    }
  };
  const handleRemoveMedium = (m: string) => {
    if (window.confirm(`CAUTION: Are you sure you want to remove '${m}' medium? \n\nThis may cause display issues for students currently assigned to this medium.`)) {
      setForm(prev => ({...prev, mediums: prev.mediums.filter(item => item !== m)}));
    }
  };
  const handleAddStandard = () => {
    if (newStandard && !form.standards.includes(newStandard)) {
      setForm(prev => ({...prev, standards: [...prev.standards, newStandard]}));
      setNewStandard('');
    }
  };
  const handleRemoveStandard = (s: string) => {
    if (window.confirm(`CAUTION: Are you sure you want to remove Class '${s}'? \n\nThis may break promotion logic and student records for this class.`)) {
      setForm(prev => ({...prev, standards: prev.standards.filter(item => item !== s)}));
    }
  };

  const updateFee = (standard: Standard, medium: Medium, amount: number) => {
    // Check if entry exists
    const exists = fees.some(f => f.standard === standard && f.medium === medium);
    if (exists) {
      setFees(fees.map(f => f.standard === standard && f.medium === medium ? { ...f, tuitionFee: amount } : f));
    } else {
      setFees([...fees, { standard, medium, tuitionFee: amount }]);
    }
  };
  
  const getFee = (standard: Standard, medium: Medium) => fees.find(f => f.standard === standard && f.medium === medium)?.tuitionFee || 0;

  const inputClass = (isEditing: boolean) => `w-full border rounded-lg p-2 outline-none transition-colors ${isEditing ? 'bg-white border-slate-300 focus:ring-2 focus:ring-indigo-500' : 'bg-slate-100 border-transparent text-slate-500 cursor-not-allowed'}`;
  
  const maskPat = (pat: string) => {
    if (!pat || pat.length < 12) return '';
    return `${pat.substring(0, 4)}...${pat.substring(pat.length - 4)}`;
  };
  
  const confirmResetPassword = () => {
    if (resetModal.userId && newResetPass) {
        if (window.confirm(`Are you sure you want to reset the password for user '${resetModal.username}'?`)) {
            onAdminResetPassword(resetModal.userId, newResetPass);
            setResetModal({ isOpen: false, userId: '', username: '' });
            setNewResetPass('');
        }
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-slate-100 p-1 rounded-xl w-fit border border-slate-200 inline-flex flex-wrap">
        {[ 
          { id: 'general', label: 'General', icon: Database }, 
          { id: 'academics', label: 'Academic Config', icon: BookOpen }, // New Tab
          { id: 'fees', label: 'Fee Structure', icon: IndianRupee }, 
          { id: 'operations', label: 'Data & Operations', icon: ArrowUpCircle }, 
          { id: 'users', label: 'Users & Roles', icon: Users } 
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
          <div className="p-8">
            {activeTab === 'general' && (
              <div className="space-y-6 max-w-3xl mx-auto animate-fadeIn">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                  <input type="text" disabled={!isEditing} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClass(isEditing)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <textarea disabled={!isEditing} value={form.address} onChange={e => setForm({...form, address: e.target.value})} rows={3} className={inputClass(isEditing)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact</label><input type="text" disabled={!isEditing} value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className={inputClass(isEditing)} /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label><input type="text" disabled={!isEditing} value={form.academicYear} onChange={e => setForm({...form, academicYear: e.target.value})} className={inputClass(isEditing)} /></div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Principal Name</label>
                  <input type="text" disabled={!isEditing} value={form.principalName} onChange={e => setForm({...form, principalName: e.target.value})} className={inputClass(isEditing)} />
                </div>
                {/* Recovery Key Config */}
                <div className="md:col-span-2 bg-amber-50 p-4 rounded-lg border border-amber-100">
                  <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2"><Key size={14}/> Master Recovery Key</label>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <input 
                            type={showRecoveryKey ? "text" : "password"} 
                            disabled={!isEditing} 
                            value={form.recoveryKey} 
                            onChange={e => setForm({...form, recoveryKey: e.target.value})} 
                            className={`${inputClass(isEditing)} font-mono pr-10`} 
                            placeholder="Secret key for admin recovery" 
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowRecoveryKey(!showRecoveryKey)}
                            disabled={!isEditing}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {showRecoveryKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <span className="text-xs text-amber-600">Used for Super Admin password reset. Keep safe!</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">School Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        {form.schoolLogo ? <img src={form.schoolLogo} className="w-full h-full object-cover"/> : <Image className="text-slate-400"/>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className={`text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <input type="file" disabled={!isEditing} onChange={e => handleFileChange(e, 'schoolLogo')} className="hidden" />
                          <span className="cursor-pointer bg-slate-100 px-2 py-1 rounded-md border border-slate-200">Change...</span>
                        </label>
                        {form.schoolLogo && isEditing && (
                          <button type="button" onClick={() => removeAsset('schoolLogo')} className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1">
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Principal Signature</label>
                     <div className="flex items-center gap-4">
                      <div className="w-24 h-16 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                        {form.principalSignature ? <img src={form.principalSignature} className="h-full object-contain p-2"/> : <Image className="text-slate-400"/>}
                      </div>
                       <div className="flex flex-col gap-2">
                        <label className={`text-xs file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <input type="file" disabled={!isEditing} onChange={e => handleFileChange(e, 'principalSignature')} className="hidden" />
                          <span className="cursor-pointer bg-slate-100 px-2 py-1 rounded-md border border-slate-200">Change...</span>
                        </label>
                         {form.principalSignature && isEditing && (
                          <button type="button" onClick={() => removeAsset('principalSignature')} className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1">
                            <Trash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NEW ACADEMIC CONFIG TAB */}
            {activeTab === 'academics' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn max-w-4xl mx-auto">
                {/* Manage Mediums */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Instruction Mediums</h3>
                  <div className="flex gap-2 mb-4">
                    <input disabled={!isEditing} value={newMedium} onChange={e=>setNewMedium(e.target.value)} placeholder="e.g. CBSE, Urdu" className="flex-1 p-2 border rounded text-sm"/>
                    <button type="button" disabled={!isEditing} onClick={handleAddMedium} className="bg-indigo-600 text-white px-3 rounded hover:bg-indigo-700 disabled:opacity-50"><Plus size={16}/></button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {form.mediums.map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm">
                        <span className="text-sm font-medium">{m}</span>
                        {isEditing && <button type="button" onClick={() => handleRemoveMedium(m)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Manage Standards */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-lg text-slate-800 mb-4">Classes / Standards</h3>
                  <div className="flex gap-2 mb-4">
                    <input disabled={!isEditing} value={newStandard} onChange={e=>setNewStandard(e.target.value)} placeholder="e.g. Nursery, 11, 12" className="flex-1 p-2 border rounded text-sm"/>
                    <button type="button" disabled={!isEditing} onClick={handleAddStandard} className="bg-indigo-600 text-white px-3 rounded hover:bg-indigo-700 disabled:opacity-50"><Plus size={16}/></button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {form.standards.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-4">{idx+1}.</span>
                          <span className="text-sm font-medium">{s}</span>
                        </div>
                        {isEditing && <button type="button" onClick={() => handleRemoveStandard(s)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 italic">* The order here determines the promotion path (e.g. 1st item promotes to 2nd).</p>
                </div>
              </div>
            )}

            {/* DYNAMIC FEE STRUCTURE TAB */}
            {activeTab === 'fees' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {form.mediums.map(medium => (
                  <div key={medium} className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 border-b pb-2 border-slate-200">{medium} Medium Fees</h3>
                    <div className="space-y-3">
                      {form.standards.map(std => (
                        <div key={std} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">{std}</span>
                          <input 
                            type="number" 
                            disabled={!isEditing} 
                            value={getFee(std, medium)} 
                            onChange={e => updateFee(std, medium, +e.target.value)} 
                            className={`${inputClass(isEditing)} w-28 text-right`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'operations' && (
              <div className="space-y-8 max-w-3xl mx-auto animate-fadeIn">
                
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-800 space-y-1">
                   <p className="font-bold mb-2 flex items-center gap-2"><Database size={14}/> Default Storage Locations</p>
                   <p><span className="font-semibold">Windows:</span> %APPDATA%\SVS School Management</p>
                   <p><span className="font-semibold">macOS:</span> ~/Library/Application Support/SVS School Management</p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-4">Data Management</h3>
                    
                    <div className="mb-6 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-700 flex items-center gap-2"><HardDrive size={18} className="text-indigo-600"/> Local Auto-Backup</h4>
                          <span className={`text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 ${isAutoBackupActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {isAutoBackupActive ? <CheckCircle size={12}/> : null} {isAutoBackupActive ? 'Active' : 'Inactive'}
                          </span>
                       </div>
                       <p className="text-xs text-slate-500 mb-4">Select a folder to automatically save a backup every 5 minutes.</p>
                       <div className="flex items-center gap-4">
                          <button type="button" onClick={onConfigureAutoBackup} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm">
                             {isAutoBackupActive ? 'Change Folder' : 'Configure'}
                          </button>
                          {lastBackupTime && <span className="text-xs text-slate-400">Last: {lastBackupTime.toLocaleTimeString()}</span>}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button type="button" onClick={handleBackup} className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-100 transition-colors"><div className="font-bold flex items-center gap-2"><Download/>Export Database</div><p className="text-xs text-slate-500 mt-1">Download a full backup of all data.</p></button>
                      <label className="p-4 border border-slate-200 rounded-lg text-left hover:bg-slate-100 transition-colors cursor-pointer"><div className="font-bold flex items-center gap-2"><Upload/>Restore Database</div><p className="text-xs text-slate-500 mt-1">Import a backup file to overwrite data.</p><input type="file" accept=".json" className="hidden" onChange={handleRestore} /></label>
                    </div>
                </div>
                
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Github size={20} /> GitHub Auto-Sync</h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 ${githubPat ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                           {githubPat ? <CheckCircle size={12}/> : null} {githubPat ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Enter your repository and a Personal Access Token (PAT) to enable automatic cloud backups every 5 minutes.</p>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">GitHub Repository (owner/repo)</label>
                        <input
                          type="text"
                          value={repoInput}
                          onChange={(e) => setRepoInput(e.target.value)}
                          placeholder="e.g., Gorak4u/svs-school-management"
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Personal Access Token (PAT)</label>
                        <input
                          type="password"
                          value={patInput}
                          onChange={(e) => setPatInput(e.target.value)}
                          placeholder={githubPat ? "Enter a new token to overwrite" : "ghp_..."}
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                        />
                      </div>
                    </div>
                    
                    {githubPat && (
                       <div className="mt-4 p-2 bg-white rounded-lg border border-slate-200 flex justify-between items-center">
                          <p className="text-sm text-slate-600">
                             Saved Token: <span className="font-mono font-bold">{maskPat(githubPat)}</span>
                          </p>
                          <button type="button" onClick={handleForgetGit} className="text-xs text-red-600 font-semibold hover:bg-red-50 p-1 rounded">Forget</button>
                       </div>
                    )}
                    
                    <div className="mt-4 flex items-center justify-between">
                       <div className="flex gap-2">
                           <button
                             type="button"
                             onClick={handleSaveGitConfig}
                             className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900"
                           >
                             <Save size={16} /> Save Config
                           </button>
                           <button
                             type="button"
                             onClick={handleManualSync}
                             disabled={!githubPat || !githubRepo || githubSyncStatus === 'pushing'}
                             className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50"
                           >
                             {githubSyncStatus === 'pushing' ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                             Sync Now
                           </button>
                       </div>
                       <div className="text-xs text-slate-500">
                        {lastGithubPushTime ? `Last sync: ${lastGithubPushTime.toLocaleTimeString()}` : 'No sync yet.'}
                       </div>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-lg text-slate-800 mb-4">WhatsApp Group Management</h3>
                  <form onSubmit={handleAddGroup} className="flex gap-2 mb-4"><input placeholder="Class Name (e.g. 10-A Parents)" value={newGroup.className} onChange={e=>setNewGroup(prev=>({...prev, className: e.target.value}))} className="flex-1 p-2 border border-slate-300 rounded text-sm"/><input placeholder="Group Link URL" value={newGroup.groupLink} onChange={e=>setNewGroup(prev=>({...prev, groupLink: e.target.value}))} className="flex-1 p-2 border border-slate-300 rounded text-sm"/><button type="submit" className="px-4 bg-green-600 text-white font-semibold text-sm rounded hover:bg-green-700">Add</button></form>
                  {(settings.whatsAppGroups || []).map(g => (<div key={g.id} className="flex justify-between items-center p-2 hover:bg-slate-100 rounded"><p className="text-sm">{g.className}</p><button type="button" onClick={() => handleDeleteGroup(g.id)}><Trash2 size={16} className="text-red-500"/></button></div>))}
                </div>

                {currentUser?.role === 'super_admin' && (
                  <div className="pt-8 border-t border-slate-200 space-y-4">
                    <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider">Danger Zone</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <button type="button" onClick={handlePromote} className="p-4 border border-amber-200 rounded-lg text-left hover:bg-amber-50 "><div className="font-bold flex items-center gap-2 text-amber-700"><CheckCircle/>End of Academic Year</div><p className="text-xs text-slate-500 mt-1">Promotes all students to the next standard and archives fees.</p></button>
                      <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={handleRepopulateClick} className="p-4 border border-blue-200 rounded-lg text-left hover:bg-blue-50">
                          <div className="font-bold flex items-center gap-2 text-blue-700"><RefreshCw size={18}/> Repopulate Demo Data</div>
                          <p className="text-xs text-slate-500 mt-1">Reset to 2000 sample students.</p>
                        </button>
                        <button type="button" onClick={handleFormatClick} className="p-4 border border-red-200 rounded-lg text-left hover:bg-red-50">
                          <div className="font-bold flex items-center gap-2 text-red-700"><Trash2 size={18}/> Format & Clear All</div>
                          <p className="text-xs text-slate-500 mt-1">Delete ALL data. 0 Records.</p>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'users' && currentUser?.role === 'super_admin' && (
              <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2"><UserPlus size={20}/> Create New User</h3>
                  <form onSubmit={handleAddUserSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-medium text-slate-700 mb-1 block">Full Name</label><input required value={newUser.name} onChange={e => setNewUser(prev => ({...prev, name: e.target.value}))} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. John Doe"/></div>
                      <div><label className="text-xs font-medium text-slate-700 mb-1 block">Role</label><select value={newUser.role} onChange={e => setNewUser(prev => ({...prev, role: e.target.value as UserRole}))} className="w-full border rounded-lg p-2 text-sm"><option value="super_admin">Super Admin (Principal)</option><option value="admin">Admin (Clerk)</option><option value="teacher">Teacher</option></select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-medium text-slate-700 mb-1 block">Username</label><input required value={newUser.username} onChange={e => setNewUser(prev => ({...prev, username: e.target.value}))} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. math_teacher"/></div>
                      <div><label className="text-xs font-medium text-slate-700 mb-1 block">Password</label><input required type="password" value={newUser.password} onChange={e => setNewUser(prev => ({...prev, password: e.target.value}))} className="w-full border rounded-lg p-2 text-sm" placeholder="*******"/></div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-indigo-700">Create User</button>
                    </div>
                  </form>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-700">Existing Users</div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500"><tr><th className="p-4">Name</th><th className="p-4">Username</th><th className="p-4">Role</th><th className="p-4 text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="p-4 font-medium text-slate-800">{u.name}</td>
                          <td className="p-4 text-slate-500">{u.username}</td>
                          <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : u.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{u.role.replace('_', ' ')}</span></td>
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
      </div>

      {/* Admin Reset Password Modal */}
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