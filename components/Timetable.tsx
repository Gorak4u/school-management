
import React, { useState } from 'react';
import { Timetable, Teacher, Standard, Medium, TimetableProps } from '../types';
import { Plus, Printer, Save, Trash2, X } from 'lucide-react';
import { getMediumStyles } from '../utils/styles';
import { SECTIONS } from '../constants'; // Import A-J Sections

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = 8; // 8 periods per day

export const TimetableComponent: React.FC<TimetableProps> = ({ timetables, teachers, onSaveTimetable, settings }) => {
  // Initialize with safe defaults from settings
  const [medium, setMedium] = useState<Medium>(settings.mediums[0] || 'Kannada');
  const [standard, setStandard] = useState<Standard>(settings.standards[0] || '1');
  const [section, setSection] = useState('A');
  const [isEditing, setIsEditing] = useState(false);

  const timetableId = `${standard}-${section}-${medium}`;

  // Filter only teaching staff for assignment
  const teachingStaff = teachers.filter(t => (t.role || 'Teacher') === 'Teacher');

  const currentTimetable = timetables.find(t => t.id === timetableId) || {
    id: timetableId,
    standard,
    section,
    medium,
    schedule: {},
  };
  
  // Local state for editing to prevent partial saves
  const [editableSchedule, setEditableSchedule] = useState(currentTimetable.schedule);

  // Sync editable schedule when the selection changes (if not editing)
  React.useEffect(() => {
      setEditableSchedule(currentTimetable.schedule);
  }, [timetableId, timetables]);

  const handleCellChange = (day: string, periodIndex: number, key: 'subject' | 'teacherId', value: string) => {
    const newSchedule = { ...editableSchedule };
    if (!newSchedule[day]) {
      newSchedule[day] = Array(PERIODS).fill({ subject: '', teacherId: '' });
    }
    const newDayPeriods = [...newSchedule[day]];
    newDayPeriods[periodIndex] = { ...newDayPeriods[periodIndex], [key]: value };
    newSchedule[day] = newDayPeriods;
    setEditableSchedule(newSchedule);
  };

  const handleSave = () => {
    const newTimetable: Timetable = {
      id: timetableId, // Ensure ID matches current selection
      standard,
      section,
      medium,
      schedule: editableSchedule
    };
    onSaveTimetable(newTimetable);
    setIsEditing(false);
  };

  const getTeacherName = (id: string) => teachers.find(t => t.id === id)?.name || 'N/A';
  
  const handlePrint = () => {
    const printContent = document.getElementById('printable-timetable-area');
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');
    
    if (printWindow && printContent) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Timetable - ${standard} ${section}</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { font-family: sans-serif; }
                        @media print {
                            .no-print { display: none; }
                            table { page-break-inside: auto; }
                            tr { page-break-inside: avoid; page-break-after: auto; }
                            thead { display: table-header-group; }
                            tfoot { display: table-footer-group; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
  };

  const styles = getMediumStyles(medium);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Medium</label>
              <select 
                value={medium} 
                onChange={e => setMedium(e.target.value as Medium)}
                className={`border rounded-lg p-2 text-sm w-full md:w-40 font-medium ${styles.badge} outline-none`}
                disabled={isEditing}
              >
                {settings.mediums.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
              <select 
                value={standard} 
                onChange={e => setStandard(e.target.value as Standard)}
                className="border rounded-lg p-2 text-sm w-full md:w-40 bg-slate-50 outline-none"
                disabled={isEditing}
              >
                {settings.standards.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
             <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
              <select 
                value={section} 
                onChange={e => setSection(e.target.value)}
                className="border rounded-lg p-2 text-sm w-full md:w-40 bg-slate-50 outline-none"
                disabled={isEditing}
              >
                {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-sm font-medium transition-colors"
              >
                Edit Timetable
              </button>
            ) : (
               <div className="flex gap-2">
                 <button 
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                 <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Save size={16} /> Save Changes
                </button>
               </div>
            )}
             <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                <Printer size={16} /> Print
              </button>
          </div>
        </div>
      </div>
      
      <div id="printable-timetable-area" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4">
        {/* Color Coded Header based on Medium */}
        <div className={`text-center mb-4 p-4 border rounded-lg ${styles.bg} ${styles.border}`}>
            <h2 className={`text-xl font-bold ${styles.text}`}>Class Timetable</h2>
            <p className={`text-md font-semibold ${styles.text}`}>Class {standard}-{section} ({medium} Medium)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm text-center">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2 font-semibold text-slate-600 w-24">Day</th>
                {[...Array(PERIODS)].map((_, i) => (
                  <th key={i} className="border border-slate-200 p-2 font-semibold text-slate-600">Period {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day}>
                  <td className="border border-slate-200 p-2 font-bold text-slate-700 bg-slate-50/50">{day}</td>
                  {[...Array(PERIODS)].map((_, periodIndex) => {
                    const periodData = editableSchedule[day]?.[periodIndex];
                    return (
                      <td key={periodIndex} className="border border-slate-200 p-1 align-top h-24 w-32 relative group">
                        {isEditing ? (
                          <div className="flex flex-col h-full gap-1">
                            <input 
                              type="text" 
                              placeholder="Subject"
                              value={periodData?.subject || ''}
                              onChange={(e) => handleCellChange(day, periodIndex, 'subject', e.target.value)}
                              className="w-full text-xs p-1 border border-slate-200 rounded outline-none focus:border-indigo-400 focus:bg-indigo-50"
                            />
                            <select
                              value={periodData?.teacherId || ''}
                              onChange={(e) => handleCellChange(day, periodIndex, 'teacherId', e.target.value)}
                              className="w-full text-[10px] p-1 border border-slate-200 rounded outline-none bg-white"
                            >
                              <option value="">- Teacher -</option>
                              {teachingStaff.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                        ) : (
                          <div className="p-1 h-full flex flex-col justify-center">
                            {periodData?.subject ? (
                                <>
                                    <p className="font-bold text-slate-800 break-words">{periodData.subject}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{getTeacherName(periodData.teacherId)}</p>
                                </>
                            ) : <span className="text-slate-300">-</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
