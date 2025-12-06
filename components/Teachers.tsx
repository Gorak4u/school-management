
import React, { useState, useMemo } from 'react';
import { Teacher, SchoolSettings, Standard, Medium } from '../types';
import { Plus, Search, Edit2, Trash2, Phone, BookOpen, User, Upload, X, Banknote, TrendingUp, Filter, ShieldCheck, Truck, Users, Eye, EyeOff, BadgeCheck } from 'lucide-react';
import { compressImage } from '../utils/storage';
import { SECTIONS } from '../constants'; // Import Sections

interface TeachersProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  settings: SchoolSettings;
}

type Role = Teacher['role'] | 'All';

export const Teachers: React.FC<TeachersProps> = ({ teachers, onAddTeacher, onUpdateTeacher, onDeleteTeacher, settings }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIncrementModalOpen, setIsIncrementModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<Role>('All');
  const [revealedSalaries, setRevealedSalaries] = useState<Set<string>>(new Set());

  // Increment Modal State
  const [incrementType, setIncrementType] = useState<'Percentage' | 'Fixed'>('Percentage');
  const [incrementValue, setIncrementValue] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'Teacher' as Teacher['role'],
    phone: '',
    qualification: '',
    subjectSpecialization: '',
    isClassTeacher: false,
    photo: '',
    monthlySalary: 0
  });
  
  // Specific state for Assigned Class construction
  const [assignedStd, setAssignedStd] = useState<Standard>(settings.standards[0] || '1');
  const [assignedSec, setAssignedSec] = useState('A');
  const [assignedMed, setAssignedMed] = useState<Medium>(settings.mediums[0] || 'Kannada');
  
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesRole = filterRole === 'All' || t.role === filterRole;
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = t.name.toLowerCase().includes(lowerSearch) ||
                            t.phone.includes(lowerSearch) ||
                            (t.qualification && t.qualification.toLowerCase().includes(lowerSearch));
      return matchesRole && matchesSearch;
    });
  }, [teachers, searchTerm, filterRole]);

  const toggleSalaryVisibility = (id: string) => {
    setRevealedSalaries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    
    // Parse assigned class
    let std = settings.standards[0];
    let sec = 'A';
    if (teacher.assignedClass && teacher.assignedClass.includes('-')) {
        const parts = teacher.assignedClass.split('-');
        if (parts.length >= 2) {
            std = parts[0];
            sec = parts[1];
        }
    }
    
    setAssignedStd(std);
    setAssignedSec(sec);
    setAssignedMed(teacher.assignedMedium || settings.mediums[0]);

    setFormData({
      name: teacher.name,
      role: teacher.role || 'Teacher',
      phone: teacher.phone,
      qualification: teacher.qualification || '',
      subjectSpecialization: teacher.subjectSpecialization || '',
      isClassTeacher: teacher.isClassTeacher || false,
      photo: teacher.photo || '',
      monthlySalary: teacher.monthlySalary || 0,
    });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingTeacher(null);
    setAssignedStd(settings.standards[0] || '1');
    setAssignedSec('A');
    setAssignedMed(settings.mediums[0]);
    setFormData({
      name: '',
      role: 'Teacher',
      phone: '',
      qualification: '',
      subjectSpecialization: '',
      isClassTeacher: false,
      photo: '',
      monthlySalary: 0
    });
    setIsModalOpen(true);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setFormData({ ...formData, photo: compressedBase64 });
      } catch (error) {
        console.error("Image upload failed", error);
        alert("Failed to process image. Please try another one.");
      }
    }
  };

  const removePhoto = () => {
    setFormData({ ...formData, photo: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalAssignedClass = formData.isClassTeacher ? `${assignedStd}-${assignedSec}` : '';
    const finalAssignedMedium = formData.isClassTeacher ? assignedMed : undefined;

    if (editingTeacher) {
      onUpdateTeacher({
        ...editingTeacher,
        ...formData,
        assignedClass: finalAssignedClass,
        assignedMedium: finalAssignedMedium
      });
    } else {
      onAddTeacher({
          ...formData,
          assignedClass: finalAssignedClass,
          assignedMedium: finalAssignedMedium
      });
    }
    setIsModalOpen(false);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      onDeleteTeacher(id);
    }
  };
  
  const handleBulkIncrement = () => {
    const val = parseFloat(incrementValue);
    if (!val || val <= 0) return;
    if (window.confirm(`Are you sure you want to increase ALL staff salaries by ${incrementType === 'Percentage' ? val + '%' : '₹' + val}?`)) {
      teachers.forEach(teacher => {
        const currentSalary = teacher.monthlySalary || 0;
        const newSalary = incrementType === 'Percentage' 
            ? Math.round(currentSalary * (1 + val / 100))
            : currentSalary + val;
        onUpdateTeacher({ ...teacher, monthlySalary: newSalary });
      });
      setIsIncrementModalOpen(false);
      setIncrementValue('');
    }
  };
  
  const RoleIcon = ({ role }: { role: Teacher['role'] }) => {
    switch (role) {
      case 'Teacher': return <BookOpen size={14} />;
      case 'Driver': return <Truck size={14} />;
      case 'Security': return <ShieldCheck size={14} />;
      case 'Admin': return <Users size={14} />;
      default: return <User size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-auto flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search staff by name, phone, qualification..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select value={filterRole} onChange={e => setFilterRole(e.target.value as Role)} className="w-full md:w-40 p-2.5 bg-white border border-slate-200 rounded-xl text-sm"><option value="All">All Roles</option><option value="Teacher">Teachers</option><option value="Driver">Drivers</option><option value="Security">Security</option><option value="Admin">Admin</option><option value="Other">Other</option></select>
          <button onClick={() => setIsIncrementModalOpen(true)} className="px-4 py-2 bg-amber-100 text-amber-800 text-sm font-semibold rounded-xl hover:bg-amber-200 transition-colors"><TrendingUp size={16} /></button>
          <button onClick={handleAddNew} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"><Plus size={16} /> Add Staff</button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTeachers.map(teacher => (
          <div key={teacher.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-center flex flex-col group">
            <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-4 border-white shadow-lg">{teacher.photo ? (<img src={teacher.photo} alt={teacher.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-400"><User size={40} /></div>)}</div>
            <h3 className="font-bold text-lg text-slate-800">{teacher.name}</h3>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 mt-1 mb-3"><RoleIcon role={teacher.role} /><span>{teacher.role}</span></div>
            
            {/* Class Teacher Badge */}
            {teacher.isClassTeacher && teacher.assignedClass && (
                <div className="mb-3">
                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-100 px-2 py-1 rounded text-xs font-bold">
                        <BadgeCheck size={12}/> Class Teacher: {teacher.assignedClass} {teacher.assignedMedium ? `(${teacher.assignedMedium})` : ''}
                    </span>
                </div>
            )}

            {teacher.role === 'Teacher' && teacher.subjectSpecialization && (<p className="text-sm text-slate-600 mb-3">{teacher.subjectSpecialization}</p>)}
            <div className="text-xs text-slate-500 flex items-center justify-center gap-2 mb-4"><Phone size={12} /> {teacher.phone}</div>
            
            <div className="text-sm font-bold text-green-600 bg-green-50 border border-green-100 py-1 px-3 rounded-full mb-4 h-8 flex items-center justify-center">
              {revealedSalaries.has(teacher.id) ? (
                 <button onClick={() => toggleSalaryVisibility(teacher.id)} className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <EyeOff size={14}/> Hide Salary
                </button>
              ) : (
                <button onClick={() => toggleSalaryVisibility(teacher.id)} className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Eye size={14}/> Show Salary
                </button>
              )}
            </div>
             {revealedSalaries.has(teacher.id) && (
                 <p className="text-lg font-bold text-slate-800 -mt-2 mb-4">₹{(teacher.monthlySalary || 0).toLocaleString()} / month</p>
             )}
            <div className="mt-auto pt-4 border-t border-slate-100 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleEdit(teacher)} className="p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"><Edit2 size={16} /></button>
              <button onClick={() => handleDelete(teacher.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-lg"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{editingTeacher ? 'Edit Staff Details' : 'Add New Staff Member'}</h2><button onClick={() => setIsModalOpen(false)}><X/></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full bg-slate-100 overflow-hidden relative group">{formData.photo ? <img src={formData.photo} className="w-full h-full object-cover"/> : <User className="w-full h-full p-3 text-slate-300"/>}<label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"><Upload size={20}/><input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/></label></div><div><label className="text-sm font-medium text-slate-700">Profile Photo</label><div className="flex items-center gap-2 mt-1"><label className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded cursor-pointer">Change...<input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload}/></label>{formData.photo && <button type="button" onClick={removePhoto} className="text-xs text-red-600">Remove</button>}</div></div></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-medium">Full Name</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded text-sm"/></div><div><label className="text-xs font-medium">Phone Number</label><input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded text-sm"/></div></div>
                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-medium">Role / Designation</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Teacher['role']})} className="w-full p-2 border rounded text-sm bg-white"><option value="Teacher">Teacher</option><option value="Driver">Driver</option><option value="Security">Security</option><option value="Admin">Admin</option><option value="Other">Other</option></select></div><div><label className="text-xs font-medium">Qualification</label><input value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} className="w-full p-2 border rounded text-sm"/></div></div>
                    
                    {formData.role === 'Teacher' && (
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 space-y-4">
                            <div><label className="text-xs font-medium">Subject Specialization</label><input value={formData.subjectSpecialization} onChange={e => setFormData({...formData, subjectSpecialization: e.target.value})} className="w-full p-2 border rounded text-sm"/></div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2"><input type="checkbox" id="isClassTeacher" checked={formData.isClassTeacher} onChange={e => setFormData({...formData, isClassTeacher: e.target.checked})} /><label htmlFor="isClassTeacher" className="text-sm font-medium">Is Class Teacher?</label></div>
                                {formData.isClassTeacher && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs text-slate-500">Class</label>
                                            <select value={assignedStd} onChange={e => setAssignedStd(e.target.value)} className="w-full p-2 border rounded text-sm bg-white">
                                                {settings.standards.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500">Section</label>
                                            <select value={assignedSec} onChange={e => setAssignedSec(e.target.value)} className="w-full p-2 border rounded text-sm bg-white">
                                                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500">Medium</label>
                                            <select value={assignedMed} onChange={e => setAssignedMed(e.target.value)} className="w-full p-2 border rounded text-sm bg-white">
                                                {settings.mediums.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div><label className="text-xs font-medium flex items-center gap-2"><Banknote size={14}/> Monthly Salary (₹)</label><input required type="number" value={formData.monthlySalary} onChange={e => setFormData({...formData, monthlySalary: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded text-sm"/></div>
                    <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button><button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded">Save</button></div>
                </form>
            </div>
        </div>
      )}
      
      {isIncrementModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl"><h3 className="text-lg font-bold text-slate-800 mb-4">Bulk Salary Increment</h3><div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4"><button onClick={() => setIncrementType('Percentage')} className={`flex-1 py-1 rounded-md text-sm font-medium ${incrementType === 'Percentage' ? 'bg-white shadow' : ''}`}>Percentage (%)</button><button onClick={() => setIncrementType('Fixed')} className={`flex-1 py-1 rounded-md text-sm font-medium ${incrementType === 'Fixed' ? 'bg-white shadow' : ''}`}>Fixed Amount (₹)</button></div><div><label className="text-xs font-medium">Value</label><input type="number" value={incrementValue} onChange={e => setIncrementValue(e.target.value)} className="w-full p-2 border rounded mt-1" placeholder={incrementType === 'Percentage' ? 'e.g., 10 for 10%' : 'e.g., 1500'}/></div><div className="flex justify-end gap-2 mt-6"><button onClick={() => setIsIncrementModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button><button onClick={handleBulkIncrement} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded">Apply Increment</button></div></div></div>)}
    </div>
  );
};
