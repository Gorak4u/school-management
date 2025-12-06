
import React, { useState } from 'react';
import { 
  Users, IndianRupee, Clock, Bus, Search, Wallet, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Student, DashboardProps } from '../types';
import { getMediumStyles } from '../utils/styles';

export const Dashboard: React.FC<DashboardProps> = ({ students, fees, expenses, salaryRecords, settings, onStudentSelect, onQuickLinkClick, busRoutes }) => {
  const activeStudents = students.filter(s => !s.isAlumni);
  const collectedFees = fees.filter(f => !f.isArchived).reduce((sum, f) => sum + f.paidAmount, 0);
  const totalGeneralExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSalaryExpenses = salaryRecords.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = totalGeneralExpenses + totalSalaryExpenses;
  
  const [searchQuery, setSearchQuery] = useState('');
  const searchResults = students.filter(s => {
    if (!searchQuery) return false;
    const term = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      (s.stsId && s.stsId.toLowerCase().includes(term)) ||
      s.phone.includes(term)
    );
  }).slice(0, 5);

  const handleSelect = (student: Student) => {
    onStudentSelect(student);
    setSearchQuery('');
  };

  const stats = [
    { label: 'Total Students', value: activeStudents.length, icon: Users, color: 'text-blue-600 bg-blue-100' },
    { label: 'Income (Fees)', value: `₹${(collectedFees / 1000).toFixed(1)}k`, icon: IndianRupee, color: 'text-green-600 bg-green-100' },
    { label: 'Total Expenses', value: `₹${(totalExpenses / 1000).toFixed(1)}k`, icon: Wallet, color: 'text-red-600 bg-red-100' },
    { label: 'Transport Users', value: activeStudents.filter(s => s.busRouteId).length, icon: Bus, color: 'text-orange-600 bg-orange-100' },
  ];

  const chartData = [
    { name: 'Apr', income: collectedFees * 0.1, expense: totalExpenses * 0.15 },
    { name: 'May', income: collectedFees * 0.15, expense: totalExpenses * 0.2 },
    { name: 'Jun', income: collectedFees * 0.3, expense: totalExpenses * 0.1 },
    { name: 'Jul', income: collectedFees * 0.2, expense: totalExpenses * 0.25 },
    { name: 'Aug', income: collectedFees * 0.15, expense: totalExpenses * 0.15 },
    { name: 'Sep', income: collectedFees * 0.1, expense: totalExpenses * 0.15 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* New Global Search Section */}
      <div className="relative z-20">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Global Search: Enter Name, ID, STS ID, or Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-base focus:ring-2 focus:ring-indigo-500 outline-none transition-all hover:shadow-md"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden max-h-96 overflow-y-auto animate-fadeIn">
            {searchResults.length > 0 ? (
              searchResults.map(student => {
                const styles = getMediumStyles(student.medium);
                return (
                <div 
                  key={student.id} 
                  onClick={() => handleSelect(student)}
                  className={`p-4 border-b border-slate-50 cursor-pointer flex items-center gap-4 transition-colors ${styles.row}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${styles.badge.split(' ')[0]} ${styles.text}`}>
                    {student.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {student.name}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide border ${styles.badge}`}>
                        {student.medium}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span>Class {student.standard}-{student.section}</span>
                      <span>•</span>
                      <span>ID: {student.id}</span>
                      <span>•</span>
                      <span>{student.phone}</span>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300" />
                </div>
              )})
            ) : (
              <div className="p-4 text-center text-slate-500 text-sm">No students found matching "{searchQuery}"</div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              {index === 1 && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+12%</span>}
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</h3>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Financial Overview</h3>
              <p className="text-xs text-slate-500">Income vs Expenses (Last 6 Months)</p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Income
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-2 h-2 rounded-full bg-red-400"></span> Expenses
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={() => onQuickLinkClick('new_admission')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Users size={18} />
                </div>
                <span className="font-semibold">New Admission</span>
              </div>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => onQuickLinkClick('fees')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <IndianRupee size={18} />
                </div>
                <span className="font-semibold">Record Fee Payment</span>
              </div>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <button 
              onClick={() => onQuickLinkClick('communications')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  <Clock size={18} />
                </div>
                <span className="font-semibold">Send Notifications</span>
              </div>
              <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
