

import React, { useState } from 'react';
import { SchoolEvent } from '../types';
// FIX: Switched to individual sub-path imports from date-fns to resolve module resolution errors.
// The single import from 'date-fns' below was causing errors. It has been replaced by individual sub-path imports for each function.
import { addMonths } from 'date-fns/addMonths';
import { eachDayOfInterval } from 'date-fns/eachDayOfInterval';
import { endOfISOWeek } from 'date-fns/endOfISOWeek';
import { endOfMonth } from 'date-fns/endOfMonth';
import { format } from 'date-fns/format';
import { isSameDay } from 'date-fns/isSameDay';
import { isSameMonth } from 'date-fns/isSameMonth';
import { isToday } from 'date-fns/isToday';
import { startOfISOWeek } from 'date-fns/startOfISOWeek';
import { startOfMonth } from 'date-fns/startOfMonth';
import { ChevronLeft, ChevronRight, Plus, Edit, Trash2, X, Sun, Briefcase, GraduationCap, PartyPopper } from 'lucide-react';

interface CalendarProps {
  events: SchoolEvent[];
  onAddEvent: (event: Omit<SchoolEvent, 'id'>) => void;
  onUpdateEvent: (event: SchoolEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const eventTypes = {
  Holiday: { icon: Sun, color: 'bg-red-100 text-red-700' },
  Exam: { icon: GraduationCap, color: 'bg-blue-100 text-blue-700' },
  Event: { icon: PartyPopper, color: 'bg-green-100 text-green-700' },
  Meeting: { icon: Briefcase, color: 'bg-yellow-100 text-yellow-700' },
};

export const Calendar: React.FC<CalendarProps> = ({ events, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [eventForm, setEventForm] = useState({ title: '', type: 'Event' as SchoolEvent['type'], description: '' });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = startOfISOWeek(monthStart);
  const endDate = endOfISOWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setEditingEvent(null);
    setEventForm({ title: '', type: 'Event', description: '' });
    setIsModalOpen(true);
  };
  
  const handleEditEvent = (event: SchoolEvent) => {
    setSelectedDate(new Date(event.date));
    setEditingEvent(event);
    setEventForm({ title: event.title, type: event.type, description: event.description || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    if (editingEvent) {
      onUpdateEvent({ ...editingEvent, ...eventForm });
    } else {
      onAddEvent({ ...eventForm, date: format(selectedDate, 'yyyy-MM-dd') });
    }
    setIsModalOpen(false);
  };
  
  const handleDelete = () => {
    if (editingEvent) {
      onDeleteEvent(editingEvent.id);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 h-[calc(100vh-8rem)] flex flex-col">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft/></button>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white w-48 text-center">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronRight/></button>
        </div>
        <button onClick={() => handleDayClick(new Date())} className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white font-semibold rounded-lg hover:bg-accent-700 transition-colors shadow-md shadow-accent-500/20">
          <Plus size={18} /> Add Event
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 flex-1 text-center text-sm text-slate-600 dark:text-slate-300">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="font-bold py-2">{day}</div>
        ))}
        {days.map(day => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.date), day));
          return (
            <div 
              key={day.toString()} 
              onClick={() => handleDayClick(day)}
              className={`border border-slate-100 dark:border-slate-800 p-2 flex flex-col cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!isSameMonth(day, monthStart) ? 'bg-slate-50 dark:bg-slate-800/20 text-slate-400' : 'bg-white dark:bg-slate-900'}`}
            >
              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${isToday(day) ? 'bg-accent-600 text-white' : ''}`}>
                {format(day, 'd')}
              </span>
              <div className="flex-1 overflow-y-auto mt-1 space-y-1">
                {dayEvents.map(event => {
                  const EType = eventTypes[event.type];
                  return (
                    <div key={event.id} onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }} className={`p-1 rounded text-[10px] font-semibold text-left flex items-center gap-1 ${EType.color}`}>
                      <EType.icon size={10} />
                      <span className="truncate">{event.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Event Modal */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingEvent ? 'Edit Event' : 'Add Event'} for {format(selectedDate, 'MMMM d, yyyy')}</h3>
              <button onClick={() => setIsModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <input required value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent"/>
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value as any})} className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                  {Object.keys(eventTypes).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <textarea value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} className="w-full mt-1 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-transparent h-24"/>
              </div>
              <div className="flex justify-between items-center pt-4">
                <div>
                  {editingEvent && (
                    <button type="button" onClick={handleDelete} className="px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg flex items-center gap-2">
                      <Trash2 size={16}/> Delete
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                   <button type="submit" className="px-6 py-2 bg-accent-600 text-white font-semibold rounded-lg hover:bg-accent-700">{editingEvent ? 'Update' : 'Create'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};