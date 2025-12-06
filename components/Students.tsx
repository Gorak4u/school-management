
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, Download, ChevronLeft, ChevronRight, Edit2, Upload, User, Trash2, ArrowUpCircle, LogOut, CheckCircle, FileSpreadsheet, MessageCircle, AlertTriangle, BadgeIndianRupee, CreditCard, X, FileText, Eye } from 'lucide-react';
import { Student, Medium, Standard, BusRoute, FeeStructure, Teacher, FeeRecord, SchoolSettings, StudentsProps } from '../types';
import { compressImage } from '../utils/storage';
import { getMediumStyles } from '../utils/styles';
import { SECTIONS } from '../constants'; // Import Sections

export const Students: React.FC<StudentsProps> = ({ 
  students, 
  onAddStudent, 
  onUpdateStudent, 
  onPromoteStudent,
  onDeleteStudent,
  onShowCertificate,
  onViewStudent,
  busRoutes, 
  feeStructure, 
  teachers,
  fees,
  settings,
  initialStudentToEdit,
  onEditHandled,
  openAddModal,
  onAddModalOpened
}) => {
  const [filterMedium, setFilterMedium] = useState<Medium | 'All'>('All');
  const [filterStandard, setFilterStandard] = useState<Standard | 'All'>('All');
  const [filterRoute, setFilterRoute] = useState<string | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [promoteModal, setPromoteModal] = useState<{ isOpen: boolean; student: Student | null }>({ isOpen: false, student: null });
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; student: Student | null }>({ isOpen: false, student: null });
  const [idCardModal, setIdCardModal] = useState<{ isOpen: boolean; student: Student | null }>({ isOpen: false, student: null });

  
  const [promotionAction, setPromotionAction] = useState<'promote' | 'exit'>('promote');
  const [nextStandard, setNextStandard] = useState<Standard>('1');

  const [showAlumni, setShowAlumni] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [newStudent, setNewStudent] = useState({
    name: '',
    parentName: '', // Father's Name
    motherName: '',
    phone: '',
    medium: settings.mediums[0] || '',
    standard: settings.standards[0] || '',
    section: 'A',
    busRouteId: '',
    rollNo: 1,
    admissionDiscount: 0,
    photo: '',
    stsId: '',
    dob: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    bloodGroup: '',
    caste: '',
    religion: '',
    aadharNo: '',
    address: '',
    village: ''
  });

  // Handle opening edit modal from dashboard
  useEffect(() => {
    if (initialStudentToEdit) {
      handleOpenEdit(initialStudentToEdit);
      onEditHandled(); // Signal that we've handled the request
    }
  }, [initialStudentToEdit]);
  
  // Handle opening add modal from dashboard quick link
  useEffect(() => {
    if (openAddModal) {
      handleOpenAdd();
      onAddModalOpened(); // Reset the trigger
    }
  }, [openAddModal]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (showAlumni && !s.isAlumni) return false;
      if (!showAlumni && s.isAlumni) return false;

      const matchesMedium = filterMedium === 'All' || s.medium === filterMedium;
      const matchesStandard = filterStandard === 'All' || s.standard === filterStandard;
      const matchesRoute = filterRoute === 'All' || (filterRoute === 'None' ? !s.busRouteId : s.busRouteId === filterRoute);
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.stsId && s.stsId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            s.parentName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesMedium && matchesStandard && matchesRoute && matchesSearch;
    });
  }, [students, filterMedium, filterStandard, filterRoute, searchTerm, showAlumni]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const currentStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewStudent({ 
      name: '', parentName: '', motherName: '', phone: '', medium: settings.mediums[0], standard: settings.standards[0], section: 'A', 
      busRouteId: '', rollNo: 1, admissionDiscount: 0, photo: '', stsId: '', 
      dob: '', gender: 'Male', bloodGroup: '', caste: '', religion: '', aadharNo: '', address: '', village: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingId(student.id);
    setNewStudent({ 
      ...student, 
      busRouteId: student.busRouteId || '', 
      admissionDiscount: 0, 
      photo: student.photo || '', 
      stsId: student.stsId || '',
      motherName: student.motherName || '',
      dob: student.dob || '',
      gender: student.gender || 'Male',
      bloodGroup: student.bloodGroup || '',
      caste: student.caste || '',
      religion: student.religion || '',
      aadharNo: student.aadharNo || '',
      address: student.address || '',
      village: student.village || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenPromote = (student: Student) => {
    // Dynamic Promotion logic
    const standardsList = settings.standards;
    const currentIndex = standardsList.indexOf(student.standard);
    const nextStd = (currentIndex !== -1 && currentIndex < standardsList.length - 1) ? standardsList[currentIndex + 1] : student.standard;
    setNextStandard(nextStd);
    setPromotionAction('promote');
    setPromoteModal({ isOpen: true, student });
  };
  
  const handleOpenIdCard = (student: Student) => {
    setIdCardModal({ isOpen: true, student });
  };
  
  const handlePrintIdCard = () => {
    window.print();
  };


  const handlePromoteSubmit = () => {
    if (promoteModal.student) {
      onPromoteStudent(promoteModal.student.id, promotionAction, nextStandard);
      setPromoteModal({ isOpen: false, student: null });
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.student) {
      onDeleteStudent(deleteModal.student.id);
      setDeleteModal({ isOpen: false, student: null });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file);
        setNewStudent({ ...newStudent, photo: compressedBase64 });
      } catch (error) {
        console.error("Image upload failed", error);
      }
    }
  };
  
  const removePhoto = () => {
    setNewStudent({ ...newStudent, photo: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { admissionDiscount, ...studentData } = newStudent;
    if (editingId) {
       const originalStudent = students.find(s => s.id === editingId);
       onUpdateStudent({ id: editingId, ...studentData, busRouteId: studentData.busRouteId || null, isAlumni: originalStudent ? originalStudent.isAlumni : false });
    } else {
       onAddStudent({ ...studentData, busRouteId: studentData.busRouteId || null, isAlumni: false }, admissionDiscount);
    }
    setIsModalOpen(false);
  };

  const handleExport = () => {
    const headers = [
      'Student ID', 'STS ID', 'Name', 'Gender', 'DOB', 'Roll No', 'Class', 'Section', 'Medium', 
      'Father Name', 'Mother Name', 'Phone', 'Address', 'Village',
      'Caste', 'Religion', 'Blood Group', 'Aadhar No', 'Bus Route'
    ];
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    
    filteredStudents.forEach(s => {
       const routeName = s.busRouteId ? (busRoutes.find(r => r.id === s.busRouteId)?.routeName || 'Assigned') : 'None';
       const row = [
         s.id, s.stsId || '', `"${s.name}"`, s.gender || '', s.dob || '', s.rollNo, s.standard, s.section, s.medium,
         `"${s.parentName}"`, `"${s.motherName || ''}"`, s.phone, `"${s.address || ''}"`, `"${s.village || ''}"`,
         s.caste || '', s.religion || '', s.bloodGroup || '', `"${s.aadharNo || ''}"`, `"${routeName}"`
       ];
       csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Students_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${finalPhone}`, '_blank');
  };

  const getClassTeacher = (std: Standard, sec: string, med: Medium) => {
    const target = `${std}-${sec}`.toLowerCase().trim();
    const teacher = teachers.find(t => {
      const matchClass = (t.assignedClass || '').toLowerCase().trim() === target;
      // If teacher has no medium assigned, they match any medium (legacy support).
      // If they have medium assigned, it must match the student's medium.
      const matchMedium = !t.assignedMedium || t.assignedMedium === med;
      return matchClass && matchMedium;
    });
    return teacher ? teacher.name : '-';
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Modern Filter Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col lg:flex-row justify-between gap-6 mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <User size={24} />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Student Directory</h2>
                <p className="text-xs text-slate-500">{filteredStudents.length} records found</p>
             </div>
          </div>
          <div className="flex gap-3">
             <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm">
               <FileSpreadsheet size={18} /> Export List
             </button>
             <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-200">
               <Plus size={18} /> Add Student
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, ID..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
           <select className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={filterMedium} onChange={(e) => setFilterMedium(e.target.value as any)}>
             <option value="All">All Mediums</option>
             {settings.mediums.map(m => <option key={m} value={m}>{m} Medium</option>)}
           </select>

           <select className="bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={filterStandard} onChange={(e) => setFilterStandard(e.target.value as any)}>
             <option value="All">All Classes</option>
             {settings.standards.map(s => <option key={s} value={s}>{s}</option>)}
           </select>

           <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 rounded-xl">
              <input type="checkbox" id="showAlumni" checked={showAlumni} onChange={e => setShowAlumni(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="showAlumni" className="text-sm font-medium text-slate-600 cursor-pointer select-none">Show Alumni</label>
           </div>
        </div>
      </div>

      {/* Modern Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 font-semibold text-slate-600">Student</th>
                <th className="px-6 py-5 font-semibold text-slate-600">Medium & Class</th>
                <th className="px-6 py-5 font-semibold text-slate-600">Parent / Contact</th>
                <th className="px-6 py-5 font-semibold text-slate-600">Personal Info</th>
                <th className="px-6 py-5 font-semibold text-slate-600">Transport</th>
                <th className="px-6 py-5 font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentStudents.length > 0 ? currentStudents.map((student) => {
                const styles = getMediumStyles(student.medium);
                return (
                <tr key={student.id} className={`transition-colors group ${styles.row}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                       {student.photo ? (
                        <img src={student.photo} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm ${styles.badge.split(' ')[0]} ${styles.text}`}>
                          {student.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-800 text-base">{student.name}</div>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                           <span className="text-slate-500">ID: {student.id}</span>
                           {student.stsId && <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">STS: {student.stsId}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                       <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${styles.badge}`}>
                         {student.medium}
                       </span>
                       <span className="text-sm font-semibold text-slate-700">Class {student.standard} <span className="text-slate-400 font-normal">|</span> Sec {student.section}</span>
                       <span className="text-xs text-slate-500">Roll: {student.rollNo} • Teacher: {getClassTeacher(student.standard, student.section, student.medium)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 font-medium">{student.parentName}</div>
                    {student.motherName && <div className="text-slate-500 text-xs">M: {student.motherName}</div>}
                    <div className="text-slate-500 text-xs mt-1 flex items-center gap-2">
                       <div className="flex items-center gap-1"><User size={10} /> {student.phone}</div>
                       <button onClick={() => handleWhatsApp(student.phone)} className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full p-0.5" title="Chat on WhatsApp">
                          <MessageCircle size={12} />
                       </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-600 space-y-0.5">
                      {student.dob && <div>DOB: {student.dob}</div>}
                      {student.gender && <div>{student.gender}</div>}
                      {student.bloodGroup && <div>Blood: {student.bloodGroup}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     {student.busRouteId ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                          <CheckCircle size={12} /> Bus User {student.village && `(${student.village})`}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs pl-2">Own Transport {student.village && `(${student.village})`}</span>
                      )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onViewStudent(student)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => onShowCertificate(student)} className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="Certificate">
                        <FileText size={16} />
                      </button>
                      <button onClick={() => handleOpenIdCard(student)} className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" title="ID Card">
                        <CreditCard size={16} />
                      </button>
                      <button onClick={() => handleOpenEdit(student)} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      {!student.isAlumni && (
                        <button onClick={() => handleOpenPromote(student)} className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Promote/Exit">
                          <ArrowUpCircle size={16} />
                        </button>
                      )}
                      <button onClick={() => setDeleteModal({isOpen: true, student})} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}) : (
                 <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No students match your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-medium text-slate-500">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 transition-all shadow-sm">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-50 transition-all shadow-sm">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                 <h2 className="text-2xl font-bold text-slate-800">{editingId ? 'Edit Student Details' : 'New Student Admission'}</h2>
                 <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><LogOut size={24} className="rotate-180" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                 {/* 1. Basic Info & Photo */}
                 <div className="flex flex-col md:flex-row gap-8">
                    {/* Photo Uploader */}
                    <div className="w-full md:w-48 flex-shrink-0 flex flex-col items-center gap-4">
                       <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center relative group">
                          {newStudent.photo ? (
                            <img src={newStudent.photo} alt="Student" className="w-full h-full object-cover" />
                          ) : (
                            <User size={48} className="text-slate-300" />
                          )}
                          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                             <Upload className="text-white" size={24} />
                             <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                          </label>
                       </div>
                       <div className="flex items-center gap-2">
                          <label className="text-xs text-slate-500 font-medium text-center cursor-pointer hover:text-indigo-600">
                             Click to upload
                             <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                          </label>
                          {newStudent.photo && (
                            <button type="button" onClick={removePhoto} className="text-red-500 hover:text-red-700" title="Remove photo">
                              <Trash2 size={14} />
                            </button>
                          )}
                       </div>
                    </div>
                    
                    {/* Primary Fields */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Full Name *</label>
                          <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                             value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required placeholder="Student's full name" />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">STS ID (Optional)</label>
                          <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                             value={newStudent.stsId} onChange={e => setNewStudent({...newStudent, stsId: e.target.value})} placeholder="State Tracking ID" />
                       </div>
                       
                       <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Date of Birth</label>
                          <input type="date" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                             value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} />
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Gender</label>
                          <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
                             value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value as any})}>
                               <option value="Male">Male</option>
                               <option value="Female">Female</option>
                               <option value="Other">Other</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 {/* 2. Academic Info */}
                 <div className={`p-6 rounded-xl border bg-slate-50 border-slate-200`}>
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 text-slate-800`}>
                      <ArrowUpCircle size={16}/> Academic Details ({newStudent.medium})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Medium</label>
                          <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white" 
                             value={newStudent.medium} onChange={e => setNewStudent({...newStudent, medium: e.target.value as Medium})}>
                             {settings.mediums.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Class</label>
                          <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white" 
                             value={newStudent.standard} onChange={e => setNewStudent({...newStudent, standard: e.target.value as Standard})}>
                             {settings.standards.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Section</label>
                          <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white" 
                             value={newStudent.section} onChange={e => setNewStudent({...newStudent, section: e.target.value})}>
                             {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                       <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Roll Number</label>
                          <input type="number" min="1" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                             value={newStudent.rollNo} onChange={e => setNewStudent({...newStudent, rollNo: parseInt(e.target.value) || 0})} />
                       </div>
                    </div>
                 </div>

                 {/* 3. Family & Contact */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                       <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Family Information</h3>
                       <div className="space-y-4">
                          <div>
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Father Name *</label>
                             <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                                value={newStudent.parentName} onChange={e => setNewStudent({...newStudent, parentName: e.target.value})} required />
                          </div>
                          <div>
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Mother Name</label>
                             <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                                value={newStudent.motherName} onChange={e => setNewStudent({...newStudent, motherName: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Religion</label>
                                <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                                   value={newStudent.religion} onChange={e => setNewStudent({...newStudent, religion: e.target.value})} />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Caste</label>
                                <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                                   value={newStudent.caste} onChange={e => setNewStudent({...newStudent, caste: e.target.value})} />
                             </div>
                          </div>
                       </div>
                    </div>
                    <div>
                       <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Contact & Personal</h3>
                       <div className="space-y-4">
                          <div>
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Mobile Number *</label>
                             <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                                value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} required />
                          </div>
                           <div>
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Village / City</label>
                             <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                                value={newStudent.village} onChange={e => setNewStudent({...newStudent, village: e.target.value})} />
                          </div>
                          <div>
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Address</label>
                             <textarea rows={1} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                                value={newStudent.address} onChange={e => setNewStudent({...newStudent, address: e.target.value})} />
                          </div>
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Blood Group</label>
                                <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white" 
                                   value={newStudent.bloodGroup} onChange={e => setNewStudent({...newStudent, bloodGroup: e.target.value})}>
                                     <option value="">Select...</option>
                                     {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                </select>
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Aadhar No</label>
                                <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                                   value={newStudent.aadharNo} onChange={e => setNewStudent({...newStudent, aadharNo: e.target.value})} />
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* 4. Transport & Fees (Only for new) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                    <div>
                       <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Transport Route</label>
                       <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-white" 
                          value={newStudent.busRouteId} onChange={e => setNewStudent({...newStudent, busRouteId: e.target.value})}>
                          <option value="">No Transport (Own Arrangement)</option>
                          {busRoutes.map(r => <option key={r.id} value={r.id}>{r.routeName} - ₹{r.monthlyFee}/pm</option>)}
                       </select>
                    </div>
                    {!editingId && (
                       <div>
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Admission Discount (₹)</label>
                          <input type="number" min="0" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" 
                             value={newStudent.admissionDiscount} onChange={e => setNewStudent({...newStudent, admissionDiscount: parseFloat(e.target.value) || 0})} 
                             placeholder="Discount on Tuition Fee"
                          />
                       </div>
                    )}
                 </div>

                 {/* Action Buttons */}
                 <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-8 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5">
                       {editingId ? 'Update Student Details' : 'Complete Admission'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
      
      {/* Promote Modal */}
      {promoteModal.isOpen && promoteModal.student && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
               <h3 className="text-xl font-bold text-slate-800 mb-2">Promote Student</h3>
               <p className="text-slate-500 text-sm mb-6">Action for <span className="font-semibold text-slate-800">{promoteModal.student.name}</span></p>
               
               <div className="space-y-3 mb-6">
                  <button onClick={() => setPromotionAction('promote')} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${promotionAction === 'promote' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                     <div className="font-bold text-slate-900 flex items-center gap-2"><ArrowUpCircle size={18}/> Promote to Next Class</div>
                     <div className="text-xs text-slate-500 mt-1">Moves student to next standard and generates new fees.</div>
                  </button>
                  <button onClick={() => setPromotionAction('exit')} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${promotionAction === 'exit' ? 'border-red-600 bg-red-50' : 'border-slate-100 hover:border-slate-200'}`}>
                     <div className="font-bold text-slate-900 flex items-center gap-2"><LogOut size={18}/> Mark as Alumni</div>
                     <div className="text-xs text-slate-500 mt-1">Student leaves school. Pending fees remain as arrears.</div>
                  </button>
               </div>

               {promotionAction === 'promote' && (
                  <div className="mb-6">
                     <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">Promote To</label>
                     <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none" value={nextStandard} onChange={e => setNextStandard(e.target.value as Standard)}>
                        {settings.standards.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                  </div>
               )}

               <div className="flex justify-end gap-3">
                  <button onClick={() => setPromoteModal({isOpen: false, student: null})} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button onClick={handlePromoteSubmit} className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl">Confirm</button>
               </div>
            </div>
         </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scaleIn">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-4 mx-auto">
                 <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Student?</h3>
              <p className="text-slate-500 text-sm text-center mb-6">
                 Are you sure you want to permanently delete <span className="font-bold text-slate-800">{deleteModal.student.name}</span>?
                 <br/><br/>
                 <span className="text-red-600 font-semibold text-xs">Warning: This will also remove all associated Fee records and Exam results for this student. This action cannot be undone.</span>
              </p>
              <div className="flex gap-3">
                 <button onClick={() => setDeleteModal({isOpen: false, student: null})} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                    Cancel
                 </button>
                 <button onClick={handleDeleteConfirm} className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-lg shadow-red-200 transition-colors">
                    Delete
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* ID Card Modal */}
      {idCardModal.isOpen && idCardModal.student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm printable-modal-container">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden print:shadow-none print:w-full">
            <div className="p-4 flex justify-between items-center border-b border-slate-100 no-print">
              <h3 className="font-bold text-slate-800">ID Card Preview</h3>
              <div className="flex gap-2">
                <button onClick={handlePrintIdCard} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">Print</button>
                <button onClick={() => setIdCardModal({ isOpen: false, student: null })} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div id="printable-id-card" className="p-4 bg-slate-100">
              <div className="w-[3.375in] h-[2.125in] mx-auto bg-white rounded-xl shadow-lg p-0 flex border border-slate-200 font-sans relative overflow-hidden">
                {/* Header with Logo and School Name */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-indigo-700 flex items-center px-3 gap-2">
                  {settings.schoolLogo ? (
                    <img src={settings.schoolLogo} alt="logo" className="h-8 w-8 object-contain bg-white p-1 rounded-full"/>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center font-bold text-indigo-700">
                      {settings.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-white font-bold text-[11px] uppercase tracking-wider">{settings.name}</h2>
                    <p className="text-indigo-200 text-[6px] -mt-0.5">{settings.address}</p>
                  </div>
                </div>

                {/* Main content */}
                <div className="pt-14 flex w-full">
                  <div className="w-1/3 text-center px-2">
                    <div className="w-20 h-20 rounded-full bg-slate-200 border-2 border-white shadow-md overflow-hidden mx-auto">
                      {idCardModal.student.photo ? (
                        <img src={idCardModal.student.photo} className="w-full h-full object-cover" alt={idCardModal.student.name} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100">
                          <User size={32} className="text-slate-400" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-2/3 pr-2 py-1 text-slate-800 text-[9px] grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 content-start">
                    <span className="font-semibold text-slate-500">Name:</span>
                    <span className="font-bold text-xs uppercase">{idCardModal.student.name}</span>
                    <span className="font-semibold text-slate-500">Class:</span>
                    <span className="font-bold">{idCardModal.student.standard}-{idCardModal.student.section}</span>
                    <span className="font-semibold text-slate-500">Parent:</span>
                    <span className="font-bold">{idCardModal.student.parentName}</span>
                    <span className="font-semibold text-slate-500">Contact:</span>
                    <span className="font-bold">{idCardModal.student.phone}</span>
                     <span className="font-semibold text-slate-500">Village:</span>
                    <span className="font-bold">{idCardModal.student.village || 'N/A'}</span>
                    <span className="font-semibold text-slate-500">Blood:</span>
                    <span className="font-bold">{idCardModal.student.bloodGroup || 'N/A'}</span>
                    <span className="font-semibold text-slate-500">DOB:</span>
                    <span className="font-bold">{idCardModal.student.dob || 'N/A'}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 h-10 flex justify-between items-center px-3 border-t border-slate-100">
                    <div className="text-center">
                        {/* Barcode placeholder */}
                        <div className="w-16 h-4 bg-white flex items-center justify-between p-0.5 space-x-px">
                            <span className="w-1 h-full bg-black"></span><span className="w-0.5 h-full bg-black"></span>
                            <span className="w-0.5 h-full bg-black"></span><span className="w-1 h-full bg-black"></span>
                            <span className="w-0.5 h-full bg-black"></span><span className="w-1 h-full bg-black"></span>
                        </div>
                        <p className="text-[6px] font-mono mt-0.5">SVS-{idCardModal.student.id}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-24 h-6 mb-0.5 flex items-center justify-center">
                          {settings.principalSignature && <img src={settings.principalSignature} className="h-full object-contain" />}
                        </div>
                        <p className="text-[7px] font-bold text-slate-700 border-t border-slate-400 pt-0.5">Principal's Signature</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
