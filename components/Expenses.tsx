import React, { useState, useMemo } from 'react';
import { ExpenseCategory, ExpenseRecord } from '../types';
import { Plus, Trash2, Edit2, X, Tag, PieChart, Wallet } from 'lucide-react';
import { ResponsiveContainer, Pie, Cell, Tooltip, Legend } from 'recharts';

interface ExpensesProps {
  expenses: ExpenseRecord[];
  categories: ExpenseCategory[];
  onAddExpense: (expense: Omit<ExpenseRecord, 'id'>) => void;
  onUpdateCategories: (categories: ExpenseCategory[]) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, categories, onAddExpense, onUpdateCategories }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    categoryId: categories[0]?.id || '',
    amount: '',
    description: ''
  });

  const [editableCategories, setEditableCategories] = useState<ExpenseCategory[]>(categories);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddExpense({
      ...formData,
      amount: parseFloat(formData.amount)
    });
    setFormData({ date: new Date().toISOString().split('T')[0], categoryId: categories[0]?.id || '', amount: '', description: '' });
    setIsModalOpen(false);
  };
  
  const handleSaveCategories = () => {
    onUpdateCategories(editableCategories);
    setIsCategoryModalOpen(false);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() === '') return;
    const newCategory: ExpenseCategory = {
      id: `ec_${Date.now()}`,
      name: newCategoryName,
      color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
    };
    setEditableCategories([...editableCategories, newCategory]);
    setNewCategoryName('');
  };
  
  const handleDeleteCategory = (id: string) => {
    if (expenses.some(e => e.categoryId === id)) {
      alert("Cannot delete category as it is assigned to one or more expenses.");
      return;
    }
    setEditableCategories(editableCategories.filter(c => c.id !== id));
  };

  const categorySummary = useMemo(() => {
    const summary = categories.map(cat => ({
      ...cat,
      total: expenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0)
    }));
    return summary.filter(s => s.total > 0).sort((a,b) => b.total - a.total);
  }, [expenses, categories]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <p className="text-sm text-slate-500 mb-1">Total Expenses (All Time)</p>
          <h3 className="text-4xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</h3>
        </div>
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-slate-800">Expense Distribution</h3>
            <button onClick={() => setIsCategoryModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-medium">
              <Tag size={14} /> Manage Categories
            </button>
          </div>
           <div className="h-40">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={categorySummary} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} fill="#8884d8">
                   {categorySummary.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                 </Pie>
                 <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                 <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '12px'}}/>
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
        
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Wallet size={20} className="text-slate-400"/> Expense Log</h3>
           <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-md">
              <Plus size={16} /> Log New Expense
           </button>
        </div>
        <div className="overflow-y-auto max-h-[50vh]">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-slate-50 z-10">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Description</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length > 0 ? expenses.slice().reverse().map(exp => {
                const category = categories.find(c => c.id === exp.categoryId);
                return (
                <tr key={exp.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{exp.date}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1.5 w-fit" style={{ backgroundColor: category?.color+'20', color: category?.color }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{backgroundColor: category?.color}}></div>
                      {category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{exp.description}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-800">₹{exp.amount.toLocaleString()}</td>
                </tr>
              )}) : (
                <tr><td colSpan={4} className="text-center py-12 text-slate-500">No expenses logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && ( <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Log New Expense</h2><button onClick={() => setIsModalOpen(false)}><X/></button></div><form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-medium text-slate-700 mb-1 block">Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required /></div><div><label className="text-xs font-medium text-slate-700 mb-1 block">Amount (₹)</label><input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full border rounded-lg p-2 text-sm" placeholder="e.g. 5000" required /></div></div><div><label className="text-xs font-medium text-slate-700 mb-1 block">Category</label><select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border rounded-lg p-2 text-sm" required><option value="">Select Category...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className="text-xs font-medium text-slate-700 mb-1 block">Description</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg p-2 text-sm h-24" placeholder="e.g. Monthly electricity bill" required/></div><div className="flex justify-end gap-2 pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Expense</button></div></form></div></div> )}
      {isCategoryModalOpen && ( <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Manage Categories</h2><button onClick={() => setIsCategoryModalOpen(false)}><X/></button></div><div className="space-y-2 mb-4 max-h-60 overflow-y-auto">{editableCategories.map(cat => (<div key={cat.id} className="flex items-center justify-between p-2 bg-slate-50 rounded"><span className="text-sm font-medium text-slate-700">{cat.name}</span><button onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={16} className="text-red-500"/></button></div>))}</div><div className="flex gap-2"><input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New category name" className="flex-1 p-2 border rounded text-sm"/><button onClick={handleAddCategory} className="px-4 bg-green-600 text-white rounded font-medium text-sm">Add</button></div><div className="flex justify-end gap-2 pt-4 mt-4 border-t"><button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button><button onClick={handleSaveCategories} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Categories</button></div></div></div> )}
    </div>
  );
};
