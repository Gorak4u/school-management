
import React, { useState, useEffect, useMemo } from 'react';
// FIX: Import SchoolSettings to use in props
import { Homework, Standard, Medium, Exam, MarkRecord, Student, SchoolSettings } from '../types';
import { generateHomeworkIdeas } from '../services/geminiService';
import { Sparkles, BookOpen, Send, Loader2, Plus, Trophy, GraduationCap, X, Search, Download, Printer, FileText, Calendar, PenTool } from 'lucide-react';
import { getMediumStyles } from '../utils/styles';
import { SECTIONS } from '../constants'; // Import Sections

interface AcademicsProps {
  homework: Homework[];
  students: Student[];
  exams: Exam[];
  marks: MarkRecord[];
  onAddHomework: (hw: Omit<Homework, 'id'>) => void;
  onAddExam: (exam: Omit<Exam, 'id'>) => void;
  onUpdateMarks: (record: MarkRecord) => void;
  // FIX: Add settings prop to the interface
  settings: SchoolSettings;
}

export const Academics: React.FC<AcademicsProps> = ({ 
  homework, 
  students, 
  exams, 
  marks,
  onAddHomework,
  onAddExam,
  onUpdateMarks,
  // FIX: Destructure settings from props
  settings
}) => {
  const [activeTab, setActiveTab] = useState<'homework' | 'marks'>('homework');
  const [loadingAI, setLoadingAI] = useState(false);
  
  // HW Form
  const [hwForm, setHwForm] = useState({
    standard: settings.standards[0] || '1',
    medium: settings.mediums[0] || 'Kannada',
    subject: 'Science',
    description: '',
    section: 'A'
  });

  // Marks State
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<Standard>(settings.standards[0] || '1');
  const [selectedMedium, setSelectedMedium] = useState<Medium>(settings.mediums[0] || 'Kannada');
  const [showExamModal, setShowExamModal] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  
  // Search & Reports
  const [marksSearchTerm, setMarksSearchTerm] = useState('');
  const [markCardModal, setMarkCardModal] = useState<{ isOpen: boolean; student: Student | null }>({ isOpen: false, student: null });

  // Auto-select latest exam
  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
       setSelectedExamId(exams[exams.length - 1].id);
    } else if (exams.length > 0 && showExamModal === false && newExamName === '') {
       setSelectedExamId(exams[exams.length - 1].id);
    }
  }, [exams]);

  const handleAIGenerate = async () => {
    if (!hwForm.subject) return;
    setLoadingAI(true);
    const ideas = await generateHomeworkIdeas(hwForm.subject, hwForm.standard, hwForm.medium);
    setHwForm(prev => ({ ...prev, description: ideas }));
    setLoadingAI(false);
  };

  const handleSubmitHW = (e: React.FormEvent) => {
    e.preventDefault();
    onAddHomework({
      ...hwForm,
      date: new Date().toISOString().split('T')[0]
    });
    setHwForm(prev => ({ ...prev, description: '' }));
  };

  const handleCreateExam = () => {
    if (newExamName.trim()) {
      onAddExam({
        name: newExamName,
        date: new Date().toISOString().split('T')[0],
        totalMarks: 100
      });
      setNewExamName('');
      setShowExamModal(false);
    } else {
      alert("Please enter an exam name");
    }
  };

  const handleMarkChange = (studentId: string, subject: string, value: string) => {
    if (!selectedExamId) return;
    const score = value === '' ? 0 : (parseInt(value) ?? 0);
    const existingRecord = marks.find(m => m.examId === selectedExamId && m.studentId === studentId);

    const updatedRecord: MarkRecord = existingRecord ? {
      ...existingRecord,
      subjects: { ...existingRecord.subjects, [subject]: score }
    } : {
      id: `m_${Date.now()}_${Math.random()}`,
      examId: selectedExamId,
      studentId,
      subjects: { [subject]: score }
    };
    onUpdateMarks(updatedRecord);
  };

  const handleExportMarks = () => {
    if (!selectedExamId) return;
    const examName = exams.find(e => e.id === selectedExamId)?.name || 'Exam';
    const subjects = ['Kannada/Eng', 'English', 'Hindi', 'Maths', 'Science', 'Social'];
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Student Name,Roll No,${subjects.join(',')},Total,Grade\n`;

    filteredStudents.forEach(student => {
       const record = marks.find(m => m.examId === selectedExamId && m.studentId === student.id);
       const scores = subjects.map(sub => record?.subjects[sub] || 0);
       const total = scores.reduce((a, b) => a + b, 0);
       const grade = calculateGrade(total, subjects.length * 100);
       
       csvContent += `"${student.name}",${student.rollNo},${scores.join(',')},${total},${grade}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${examName}_${selectedClass}_${selectedMedium}_Marks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateGrade = (obtained: number, max: number) => {
    const percentage = (obtained / max) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
  };

  const handlePrintCard = (student: Student) => {
    setMarkCardModal({ isOpen: true, student });
  };

  const printDocument = () => {
    window.print();
  };
  
  const downloadPDF = () => {
     const element = document.getElementById('printable-mark-card');
    if (!element) return;
    
    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
      const opt = {
        margin:       0.3,
        filename:     `MarkCard_${markCardModal.student?.name}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } else {
      printDocument();
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesClass = s.standard === selectedClass && s.medium === selectedMedium;
    const matchesSearch = s.name.toLowerCase().includes(marksSearchTerm.toLowerCase()) || 
                          s.id.toLowerCase().includes(marksSearchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const subjects = ['Kannada/Eng', 'English', 'Hindi', 'Maths', 'Science', 'Social'];
  const currentExam = exams.find(e => e.id === selectedExamId);

  // Color logic for homework cards
  const getMediumColor = (medium: Medium) => {
    const style = getMediumStyles(medium);
    return `border-l-[4px] ${style.bg} border-l-[${style.text}]`;
  };
  const getMediumBadge = (medium: Medium) => {
    const style = getMediumStyles(medium);
    return style.badge;
  };

  // Available classes based on medium for Homework
  const availableStandardsHW = useMemo(() => {
    if (settings.mediumSpecificStandards && settings.mediumSpecificStandards[hwForm.medium]) {
        return settings.mediumSpecificStandards[hwForm.medium];
    }
    return settings.standards;
  }, [hwForm.medium, settings]);

  // Available classes based on medium for Marks
  const availableStandardsMarks = useMemo(() => {
    if (settings.mediumSpecificStandards && settings.mediumSpecificStandards[selectedMedium]) {
        return settings.mediumSpecificStandards[selectedMedium];
    }
    return settings.standards;
  }, [selectedMedium, settings]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
        <button 
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'homework' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('homework')}
        >
          <BookOpen size={16} /> Homework
        </button>
        <button 
          className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'marks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setActiveTab('marks')}
        >
          <Trophy size={16} /> Exam Results
        </button>
      </div>

      {activeTab === 'homework' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Homework Creation Form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg shadow-indigo-50">
              <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold text-lg border-b border-indigo-50 pb-2">
                <Sparkles size={20} className="text-indigo-500" />
                <span>Assign Homework</span>
              </div>
              
              <form onSubmit={handleSubmitHW} className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                   <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Medium</label>
                    <select 
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={hwForm.medium}
                      onChange={e => setHwForm({...hwForm, medium: e.target.value as Medium})}
                    >
                      {settings.mediums.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class</label>
                     <select 
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={hwForm.standard}
                      onChange={e => setHwForm({...hwForm, standard: e.target.value as Standard})}
                    >
                      {availableStandardsHW.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Section</label>
                   <select 
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={hwForm.section}
                      onChange={e => setHwForm({...hwForm, section: e.target.value})}
                    >
                      {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject</label>
                   <input 
                      type="text" 
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. Mathematics" 
                      value={hwForm.subject}
                      onChange={e => setHwForm({...hwForm, subject: e.target.value})}
                    />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Content</label>
                    <button 
                      type="button" 
                      onClick={handleAIGenerate}
                      disabled={loadingAI}
                      className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded-md transition-colors"
                    >
                      {loadingAI ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10} />}
                      AI Draft
                    </button>
                  </div>
                  <textarea 
                    rows={5} 
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="Enter homework details..."
                    value={hwForm.description}
                    onChange={e => setHwForm({...hwForm, description: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:-translate-y-0.5"
                >
                  <Send size={18} />
                  Publish Assignment
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-slate-400"/> Recent Assignments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 pb-4">
              {homework.length > 0 ? homework.map(hw => (
                <div key={hw.id} className={`p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white ${getMediumColor(hw.medium)}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${getMediumBadge(hw.medium)}`}>
                       {hw.medium}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{hw.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-1">{hw.subject}</h4>
                  <div className="text-xs text-slate-500 font-semibold mb-3">
                     Class {hw.standard} • Section {hw.section}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{hw.description}</p>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-green-600 font-medium">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> SMS Notification Sent
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                  <BookOpen className="mx-auto text-slate-300 mb-2" size={32} />
                  <p className="text-slate-500 text-sm">No homework assigned yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // MARKS TAB
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col xl:flex-row gap-6 justify-between items-end">
              <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Active Exam</label>
                   <div className="flex gap-2">
                     <select 
                        value={selectedExamId}
                        onChange={(e) => setSelectedExamId(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                     >
                        <option value="">Select an Exam...</option>
                        {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.date})</option>)}
                     </select>
                     <button 
                        onClick={() => setShowExamModal(true)}
                        className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-200"
                        title="Create New Exam"
                     >
                        <Plus size={20} />
                     </button>
                   </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Medium</label>
                  <select 
                    value={selectedMedium} 
                    onChange={e => setSelectedMedium(e.target.value as Medium)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-slate-50"
                  >
                    {settings.mediums.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Class</label>
                  <select 
                    value={selectedClass} 
                    onChange={e => setSelectedClass(e.target.value as Standard)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none bg-slate-50"
                  >
                    {availableStandardsMarks.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="md:col-span-1">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search Student</label>
                   <div className="relative">
                      <input 
                         type="text"
                         placeholder="Name or ID..."
                         value={marksSearchTerm}
                         onChange={e => setMarksSearchTerm(e.target.value)}
                         className="w-full border border-slate-300 rounded-lg p-2.5 text-sm pl-9 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                   </div>
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={handleExportMarks} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 h-10">
                   <Download size={16} /> Export Marks
                 </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">Student</th>
                    {subjects.map(sub => <th key={sub} className="px-2 py-3 font-semibold text-slate-600 text-center w-24">{sub}</th>)}
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Total</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Grade</th>
                    <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map(student => {
                    const record = marks.find(m => m.examId === selectedExamId && m.studentId === student.id);
                    const totalMarks = subjects.reduce((sum, sub) => sum + (record?.subjects[sub] || 0), 0);
                    const grade = calculateGrade(totalMarks, subjects.length * 100);

                    return (
                      <tr key={student.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800">{student.name}</div>
                          <div className="text-xs text-slate-500">ID: {student.id}</div>
                        </td>
                        {subjects.map(sub => (
                          <td key={sub} className="px-2 py-2">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={record?.subjects[sub] ?? ''}
                              onChange={e => handleMarkChange(student.id, sub, e.target.value)}
                              className="w-20 border border-slate-200 rounded-md p-2 text-center text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{totalMarks}</td>
                        <td className="px-4 py-3 text-center font-semibold text-indigo-600">{grade}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => handlePrintCard(student)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Print Mark Card">
                            <Printer size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Exam Modal */}
          {showExamModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Exam</h3>
                <input 
                  type="text" 
                  value={newExamName}
                  onChange={e => setNewExamName(e.target.value)}
                  placeholder="e.g. Annual Exam 2025"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowExamModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                  <button onClick={handleCreateExam} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded">Create</button>
                </div>
              </div>
            </div>
          )}

          {/* Mark Card Modal */}
          {markCardModal.isOpen && markCardModal.student && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm printable-modal-container">
              <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b border-slate-100 no-print">
                  <h3 className="font-semibold text-slate-700">Mark Card Preview</h3>
                  <div className="flex gap-2">
                    <button onClick={downloadPDF} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"><Download size={16} /> PDF</button>
                    <button onClick={printDocument} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"><Printer size={16} /> Print</button>
                    <button onClick={() => setMarkCardModal({isOpen: false, student: null})} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={20} /></button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <div className="p-8 print:p-8" id="printable-mark-card">
                    {/* Mark Card Content */}
                    <header className="text-center border-b-2 border-slate-800 pb-6 mb-6 flex items-center justify-center gap-4">
                      {settings.schoolLogo && <img src={settings.schoolLogo} alt="Logo" className="h-16 w-16 object-contain" />}
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">{settings.name}</h1>
                        <p className="text-sm text-slate-600 mt-1">{settings.address}</p>
                      </div>
                    </header>
                    <div className="text-center mb-6">
                      <div className="inline-block px-4 py-1 bg-slate-100 border border-slate-300 rounded text-sm font-semibold uppercase tracking-wider">
                        {currentExam?.name || 'Progress Report'} - {settings.academicYear}
                      </div>
                    </div>
                    <div className="flex justify-between mb-8 text-sm">
                      <div>
                        <p><span className="font-semibold">Student Name:</span> {markCardModal.student.name}</p>
                        <p><span className="font-semibold">Father's Name:</span> {markCardModal.student.parentName}</p>
                      </div>
                      <div className="text-right">
                        <p><span className="font-semibold">Class:</span> {markCardModal.student.standard}-{markCardModal.student.section}</p>
                        <p><span className="font-semibold">Roll No:</span> {markCardModal.student.rollNo}</p>
                      </div>
                    </div>
                    <table className="w-full mb-8 border-collapse text-sm">
                       <thead>
                         <tr className="bg-slate-100 uppercase tracking-wider text-xs">
                           <th className="py-3 px-4 text-left border border-slate-200">Subject</th>
                           <th className="py-3 px-4 text-center border border-slate-200">Max Marks</th>
                           <th className="py-3 px-4 text-center border border-slate-200">Marks Obtained</th>
                         </tr>
                       </thead>
                       <tbody>
                          {(() => {
                            const record = marks.find(m => m.examId === selectedExamId && m.studentId === markCardModal.student?.id);
                            const totalObtained = subjects.reduce((sum, sub) => sum + (record?.subjects[sub] || 0), 0);
                            const maxTotal = subjects.length * 100;
                            const finalGrade = calculateGrade(totalObtained, maxTotal);

                            return (
                              <>
                                {subjects.map(sub => (
                                  <tr key={sub} className="border-b border-slate-200">
                                    <td className="py-2 px-4 border-l border-r border-slate-200 font-medium">{sub}</td>
                                    <td className="py-2 px-4 text-center border-r border-slate-200">100</td>
                                    <td className="py-2 px-4 text-center border-r border-slate-200">{record?.subjects[sub] || 0}</td>
                                  </tr>
                                ))}
                                <tr className="bg-slate-100 font-bold">
                                  <td className="py-3 px-4 text-right border border-slate-200">Total</td>
                                  <td className="py-3 px-4 text-center border border-slate-200">{maxTotal}</td>
                                  <td className="py-3 px-4 text-center border border-slate-200">{totalObtained}</td>
                                </tr>
                                <tr className="bg-slate-50 font-semibold">
                                  <td colSpan={2} className="py-3 px-4 text-right border border-slate-200">Final Grade</td>
                                  <td className="py-3 px-4 text-center border border-slate-200 text-lg text-indigo-600">{finalGrade}</td>
                                </tr>
                              </>
                            );
                          })()}
                       </tbody>
                    </table>
                    <div className="flex justify-between items-end mt-16 pt-8">
                       <div className="text-sm">
                          <p className="font-semibold">Remarks:</p>
                          <div className="w-64 h-8 border-b border-slate-400 mt-4"></div>
                       </div>
                       <div className="text-center">
                          <div className="h-12 w-32 mb-2 flex items-center justify-center">
                             {settings.principalSignature && <img src={settings.principalSignature} alt="Signature" className="h-full object-contain" />}
                          </div>
                          <p className="text-sm font-medium border-t border-slate-400 pt-1">Principal's Signature</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
