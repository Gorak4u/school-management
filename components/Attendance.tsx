
import React, { useState, useEffect } from 'react';
import { Student, Standard, Medium } from '../types';
import { Check, X, Clock, Send, Save, CheckCheck, UserX, Download, Loader2 } from 'lucide-react';
import { draftNotificationMessage } from '../services/geminiService';

interface AttendanceProps {
  students: Student[];
  onSave: (date: string, records: any[]) => void;
}

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export const Attendance: React.FC<AttendanceProps> = ({ students, onSave }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [medium, setMedium] = useState<Medium>('Kannada');
  const [standard, setStandard] = useState<Standard>('10');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loadingSMS, setLoadingSMS] = useState(false);
  const [saved, setSaved] = useState(false);

  // Derive lists from student data to allow dynamic selection even if not explicitly passed (though passing settings is better)
  // For robustness, we will extract unique mediums and standards from the student list if settings prop isn't available, 
  // or default to a safe fallback. Ideally AttendanceProps should include settings.
  // Assuming students list contains valid medium/standards from current settings.
  const availableMediums = Array.from(new Set(students.map(s => s.medium))).sort();
  const availableStandards = Array.from(new Set(students.map(s => s.standard))).sort(); // Simple sort, settings based sort would be better

  const filteredStudents = students.filter(s => s.medium === medium && s.standard === standard);

  // Initialize attendance for filtered students
  useEffect(() => {
    const initial: Record<string, AttendanceStatus> = {};
    filteredStudents.forEach(s => {
      initial[s.id] = attendance[s.id] || 'Present';
    });
    setAttendance(prev => ({ ...prev, ...initial }));
    setSaved(false);
  }, [medium, standard, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
    setSaved(false);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newAttendance = { ...attendance };
    filteredStudents.forEach(s => {
      newAttendance[s.id] = status;
    });
    setAttendance(newAttendance);
    setSaved(false);
  };

  const handleSave = () => {
    const records = filteredStudents.map(s => ({
      studentId: s.id,
      status: attendance[s.id],
      date,
      remarks: remarks[s.id] || ''
    }));
    onSave(date, records);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleNotifyAbsentees = async () => {
    const absentees = filteredStudents.filter(s => attendance[s.id] === 'Absent');
    if (absentees.length === 0) {
      alert("No absentees to notify.");
      return;
    }
    
    setLoadingSMS(true);
    const sampleMsg = await draftNotificationMessage('Absence', `Student is absent on ${date}`);
    setLoadingSMS(false);
    
    alert(`Simulated sending SMS to ${absentees.length} parents.\n\nTemplate used: "${sampleMsg}"`);
  };

  const handleExportAttendance = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Roll No,Student ID,Student Name,Status,Remarks\n";

    filteredStudents.forEach(student => {
      const status = attendance[student.id] || 'N/A';
      const remark = remarks[student.id] || '';
      const row = [
        student.rollNo,
        student.id,
        `"${student.name}"`,
        status,
        `"${remark.replace(/"/g, '""')}"` // Escape double quotes
      ].join(',');
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${standard}_${medium}_${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl shadow-sm border bg-slate-50 border-slate-200`}>
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Daily Attendance Log</h2>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded-lg p-2 text-sm w-full md:w-40" />
            <select value={medium} onChange={e => setMedium(e.target.value as Medium)} className="border rounded-lg p-2 text-sm w-full md:w-40">
              {availableMediums.length > 0 ? availableMediums.map(m => <option key={m} value={m}>{m}</option>) : <option value="Kannada">Kannada</option>}
            </select>
            <select value={standard} onChange={e => setStandard(e.target.value as Standard)} className="border rounded-lg p-2 text-sm w-full md:w-40">
              {availableStandards.length > 0 ? availableStandards.map(s => <option key={s} value={s}>{s}</option>) : <option value="1">1</option>}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div className="flex gap-2 mb-4 md:mb-0">
            <button onClick={() => handleMarkAll('Present')} className="px-3 py-1.5 text-xs font-semibold bg-green-100 text-green-700 rounded-md hover:bg-green-200 flex items-center gap-1"><CheckCheck size={14}/> Mark All Present</button>
            <button onClick={() => handleMarkAll('Absent')} className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center gap-1"><UserX size={14}/> Mark All Absent</button>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportAttendance} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-2"><Download size={16}/> Export</button>
            <button onClick={handleNotifyAbsentees} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center gap-2" disabled={loadingSMS}>
              {loadingSMS ? <Loader2 size={16} className="animate-spin" /> : <Send size={16}/>} Notify Absentees
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
              {saved ? <Check size={16}/> : <Save size={16}/>} {saved ? 'Saved!' : 'Save Attendance'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="py-2 text-left">Student</th><th className="py-2 text-center">Status</th><th className="py-2 text-left">Remarks</th></tr></thead>
            <tbody>
              {filteredStudents.length > 0 ? filteredStudents.map(student => (
                <tr key={student.id} className="border-b">
                  <td className="py-3"><div className="font-medium">{student.name}</div><div className="text-xs text-slate-500">ID: {student.id}</div></td>
                  <td className="py-3">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handleStatusChange(student.id, 'Present')} className={`p-2 rounded-lg ${attendance[student.id] === 'Present' ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-green-100'}`}><Check size={16}/></button>
                      <button onClick={() => handleStatusChange(student.id, 'Absent')} className={`p-2 rounded-lg ${attendance[student.id] === 'Absent' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-red-100'}`}><X size={16}/></button>
                      <button onClick={() => handleStatusChange(student.id, 'Leave')} className={`p-2 rounded-lg ${attendance[student.id] === 'Leave' ? 'bg-yellow-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-yellow-100'}`}><Clock size={16}/></button>
                    </div>
                  </td>
                  <td className="py-3">
                    <input type="text" value={remarks[student.id] || ''} onChange={e => setRemarks(p => ({...p, [student.id]: e.target.value}))} placeholder="Optional remarks..." className="w-full border-slate-200 rounded-md p-1.5 text-xs"/>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="text-center py-8 text-slate-500">No students found for {medium} Medium, Class {standard}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
