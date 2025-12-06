import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { 
  LayoutDashboard, Users, IndianRupee, CalendarCheck, BookOpen, Bus, MessageSquare, 
  Settings, GraduationCap, Search, FilePlus
} from 'lucide-react';
import { Student } from '../types';

interface CommandPaletteProps {
  setActiveTab: (tab: string) => void;
  students: Student[];
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'teachers', label: 'Staff & Teachers', icon: GraduationCap },
  { id: 'fees', label: 'Fee Management', icon: IndianRupee },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'academics', label: 'Academics & Exams', icon: BookOpen },
  { id: 'calendar', label: 'Calendar & Events', icon: CalendarCheck },
  { id: 'transport', label: 'Transport', icon: Bus },
  { id: 'communications', label: 'Communications', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ setActiveTab, students }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    
    const customOpen = () => setOpen(true);

    document.addEventListener('keydown', down);
    document.addEventListener('open-command-palette', customOpen);
    return () => {
      document.removeEventListener('keydown', down);
      document.removeEventListener('open-command-palette', customOpen);
    };
  }, []);

  const runAction = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <Command.Dialog open={open} onOpenChange={setOpen} label="Global Command Menu">
      <Command.Input placeholder="Type a command or search..." />
      <Command.List>
        <Command.Empty>No results found.</Command.Empty>
        
        <Command.Group heading="Navigation">
          {NAV_ITEMS.map((item) => (
            <Command.Item key={item.id} onSelect={() => runAction(() => setActiveTab(item.id))}>
              <item.icon />
              <span>{item.label}</span>
            </Command.Item>
          ))}
        </Command.Group>
        
        <Command.Group heading="Quick Actions">
            <Command.Item onSelect={() => runAction(() => setActiveTab('students'))}>
              <FilePlus />
              New Student Admission
            </Command.Item>
            <Command.Item onSelect={() => runAction(() => setActiveTab('fees'))}>
              <IndianRupee />
              Record Fee Payment
            </Command.Item>
        </Command.Group>

        <Command.Group heading="Students">
          {students.slice(0, 100).map((student) => (
            <Command.Item key={student.id} onSelect={() => runAction(() => setActiveTab('students'))}>
              <Users />
              <span>{student.name}</span>
              <span className="text-xs text-slate-400 ml-auto">
                Class {student.standard}
              </span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
};
