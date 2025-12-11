
import React, { useState, useEffect, useMemo } from 'react';
import { Command } from 'cmdk';
import { 
  LayoutDashboard, Users, IndianRupee, CalendarCheck, BookOpen, Bus, MessageSquare, 
  Settings, GraduationCap, Search, FilePlus, Banknote, FilePieChart
} from 'lucide-react';
import { Student } from '../types';

interface CommandPaletteProps {
  setActiveTab: (tab: string) => void;
  students: Student[];
  onStudentSelect: (student: Student) => void;
  isDarkMode: boolean;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Go to Students', icon: Users },
  { id: 'teachers', label: 'Go to Staff', icon: GraduationCap },
  { id: 'fees', label: 'Go to Fees', icon: IndianRupee },
  { id: 'attendance', label: 'Go to Attendance', icon: CalendarCheck },
  { id: 'academics', label: 'Go to Academics', icon: BookOpen },
  { id: 'reports', label: 'Go to Reports', icon: FilePieChart },
  { id: 'transport', label: 'Go to Transport', icon: Bus },
  { id: 'communications', label: 'Go to Communications', icon: MessageSquare },
  { id: 'settings', label: 'Go to Settings', icon: Settings },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ setActiveTab, students, onStudentSelect, isDarkMode }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runAction = (action: () => void) => {
    setOpen(false);
    // Introduce a small delay to ensure the Command Palette overlay (z-index 100) 
    // is fully removed before the target modal (z-index 50) attempts to open.
    // This prevents the "blurred screen" issue where the overlay might persist or trap focus.
    setTimeout(() => {
        action();
        setSearch(''); // Clear search after action
    }, 100);
  };

  const filteredNavItems = NAV_ITEMS.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredStudents = useMemo(() => {
    if (!search) return [];
    const lower = search.toLowerCase();
    return students.filter(s => 
        s.name.toLowerCase().includes(lower) || 
        s.id.toLowerCase().includes(lower) ||
        s.phone.includes(lower) ||
        s.parentName.toLowerCase().includes(lower)
    ).slice(0, 10);
  }, [students, search]);

  // Show quick actions only when search is empty or matches specific terms
  const showQuickActions = !search || "new student admission".includes(search.toLowerCase()) || "collect fees".includes(search.toLowerCase());

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <Command.Dialog 
        open={open} 
        onOpenChange={setOpen} 
        label="Global Command Menu" 
        shouldFilter={false} // Manual filtering for performance and correct global search
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[640px] w-full bg-white dark:bg-slate-800 shadow-2xl rounded-xl border border-slate-200 dark:border-slate-700 z-[200]"
      >
        <Command.Input 
          placeholder="Type a command or search students..." 
          value={search}
          onValueChange={setSearch}
          className="w-full p-4 text-base border-b border-slate-100 dark:border-slate-700 bg-transparent outline-none dark:text-white"
        />
        <Command.List className="max-h-[400px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
          {filteredNavItems.length === 0 && filteredStudents.length === 0 && !showQuickActions && (
             <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>
          )}
          
          {filteredNavItems.length > 0 && (
            <Command.Group heading="Navigation" className="text-xs font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                {filteredNavItems.map((item) => (
                <Command.Item 
                    key={item.id} 
                    onSelect={() => runAction(() => setActiveTab(item.id))}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/30 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-400"
                >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                </Command.Item>
                ))}
            </Command.Group>
          )}
          
          {showQuickActions && (
            <Command.Group heading="Quick Actions" className="text-xs font-bold text-slate-400 px-2 py-1 uppercase tracking-wider mt-2">
                <Command.Item 
                    onSelect={() => runAction(() => setActiveTab('students'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/30 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-400"
                >
                    <FilePlus size={18}/>
                    <span>New Student Admission</span>
                </Command.Item>
                <Command.Item 
                    onSelect={() => runAction(() => setActiveTab('fees'))}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/30 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-400"
                >
                    <Banknote size={18}/>
                    <span>Collect Fees</span>
                </Command.Item>
            </Command.Group>
          )}

          {filteredStudents.length > 0 && (
            <Command.Group heading="Students" className="text-xs font-bold text-slate-400 px-2 py-1 uppercase tracking-wider mt-2">
                {filteredStudents.map((student) => (
                <Command.Item 
                    key={student.id} 
                    onSelect={() => runAction(() => onStudentSelect(student))}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors aria-selected:bg-indigo-50 dark:aria-selected:bg-indigo-900/30 aria-selected:text-indigo-700 dark:aria-selected:text-indigo-400"
                >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-xs text-slate-400 ml-2">ID: {student.id}</span>
                    </div>
                    <span className="text-xs text-slate-400">
                    Class {student.standard}-{student.section}
                    </span>
                </Command.Item>
                ))}
            </Command.Group>
          )}
        </Command.List>
      </Command.Dialog>
    </div>
  );
};
