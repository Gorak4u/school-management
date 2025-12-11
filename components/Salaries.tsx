
import React, { useState } from 'react';
import { Teacher, SalaryRecord, SalaryAdvance } from '../types';
import { Banknote, CheckCircle, Calendar, Filter, User, X, CreditCard, ArrowRight, RefreshCw, Plus, Wallet, FileText, Download } from 'lucide-react';

interface SalariesProps {
  teachers: Teacher[];
  salaryRecords: SalaryRecord[];
  salaryAdvances: SalaryAdvance[];
  onAddSalaryRecord: (record: Omit<SalaryRecord, 'id'>) => void;
  onAddSalaryAdvance: (advance: Omit<SalaryAdvance, 'id'>) => void;
  onUpdateSalaryAdvance: (advance: SalaryAdvance) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const Salaries: React.FC<SalariesProps> = ({ teachers, salaryRecords, salaryAdvances, onAddSalaryRecord, onAddSalaryAdvance, onUpdateSalaryAdvance }) => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'advances'>('payroll');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; teacher: Teacher | null; totalAdvance: number; pendingAdvances: SalaryAdvance[] }>({ isOpen: false, teacher: null, totalAdvance: 0, pendingAdvances: [] });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [advanceDeduction, setAdvanceDeduction] = useState('');
  const [advanceModal, setAdvanceModal] = useState(false);
  const [newAdvance, setNewAdvance] = useState({ teacherId: '', amount: '', notes: '' });
  const [repaymentModal, setRepaymentModal] = useState<{ isOpen: boolean; advance: SalaryAdvance | null }>({ isOpen: false, advance: null });
  const [repaymentAmount, setRepaymentAmount] = useState('');

  const handleOpenPaymentModal = (teacher: Teacher, balance: number) => {
    const pending = salaryAdvances.filter(a => a.teacherId === teacher.id && a.status === 'Pending');
    const totalPending = pending.reduce((sum, a) => sum + a.balance, 0);

    setPaymentModal({ isOpen: true, teacher, totalAdvance: totalPending, pendingAdvances: pending });
    setPaymentAmount(balance.toString());
    setAdvanceDeduction('');
  };

  const handleSubmitPayment = () => {
    if (!paymentModal.teacher || !paymentAmount) return;
    const payAmt = parseFloat(paymentAmount);
    const deductAmt = parseFloat(advanceDeduction) || 0;
    
    onAddSalaryRecord({
      teacherId: paymentModal.teacher.id,
      amount: payAmt - deductAmt, 
      month: selectedMonth,
      year: selectedYear,
      datePaid: new Date().toISOString().split('T')[0],
      advanceDeduction: deductAmt
    });

    if (deductAmt > 0) {
      let remainingDeduction = deductAmt;
      const sortedAdvances = [...paymentModal.pendingAdvances].sort((a, b) => new Date(a.dateIssued).getTime() - new Date(b.dateIssued).getTime());
      
      sortedAdvances.forEach(adv => {
        if (remainingDeduction <= 0) return;
        const deductionForThis = Math.min(adv.balance, remainingDeduction);
        const newBalance = adv.balance - deductionForThis;
        const newRepayments = [...(adv.repayments || []), { date: new Date().toISOString().split('T')[0], amount: deductionForThis, type: 'Salary Deduction' as const }];
        onUpdateSalaryAdvance({ ...adv, balance: newBalance, status: newBalance === 0 ? 'Repaid' : 'Pending', repayments: newRepayments });
        remainingDeduction -= deductionForThis;
      });
    }
    setPaymentModal({ isOpen: false, teacher: null, totalAdvance: 0, pendingAdvances: [] });
  };

  const handleIssueAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdvance.teacherId && newAdvance.amount) {
      onAddSalaryAdvance({
        teacherId: newAdvance.teacherId,
        amount: parseFloat(newAdvance.amount),
        balance: parseFloat(newAdvance.amount),
        dateIssued: new Date().toISOString().split('T')[0],
        status: 'Pending',
        notes: newAdvance.notes,
        repayments: []
      });
      setAdvanceModal(false);
      setNewAdvance({ teacherId: '', amount: '', notes: '' });
    }
  };

  const handleCashRepayment = () => {
    if (!repaymentModal.advance || !repaymentAmount) return;
    const amount = parseFloat(repaymentAmount);
    if (amount <= 0 || amount > repaymentModal.advance.balance) {
      alert("Invalid Amount");
      return;
    }
    const newBalance = repaymentModal.advance.balance - amount;
    const newRepayments = [...(repaymentModal.advance.repayments || []), { date: new Date().toISOString().split('T')[0], amount: amount, type: 'Cash Repayment' as const }];
    onUpdateSalaryAdvance({ ...repaymentModal.advance, balance: newBalance, status: newBalance === 0 ? 'Repaid' : 'Pending', repayments: newRepayments });
    setRepaymentModal({ isOpen: false, advance: null });
    setRepaymentAmount('');
  };

  const handleExportSalaries = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Staff ID,Staff Name,Role,Total Salary,Cash Paid,Advance Deducted,Balance\n";

    teachers.forEach(teacher => {
      const payments = salaryRecords.filter(r => r.teacherId === teacher.id && r.month === selectedMonth && r.year === selectedYear);
      const cashPaid = payments.reduce((s, p) => s + p.amount, 0);
      const deducted = payments.reduce((s, p) => s + (p.advanceDeduction || 0), 0);
      const totalCredited = cashPaid + deducted;
      const salary = teacher.monthlySalary || 0;
      const balance = salary - totalCredited;
      
      const row = [
        teacher.id,
        `"${teacher.name}"`,
        teacher.role,
        salary,
        cashPaid,
        deducted,
        balance > 0 ? balance : 0
      ].join(',');
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Salaries_${MONTHS[selectedMonth-1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const years = Array.from({ length: 21 }, (_, i) => currentYear - 5 + i).sort((a,b) => b-a);
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit border border-slate-200">
        <button className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'payroll' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('payroll')}><Banknote size={16} /> Payroll</button>
        <button className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${activeTab === 'advances' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setActiveTab('advances')}><Wallet size={16} /> Salary Advances</button>
      </div>

      {activeTab === 'payroll' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">Monthly Payroll for {MONTHS[selectedMonth-1]} {selectedYear}</h2>
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="border rounded-lg p-2 text-sm w-full md:w-40 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Select Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select>
              <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="border rounded-lg p-2 text-sm w-full md:w-40 bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"><option value="">Select Month</option>{MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}</select>
              <button onClick={handleExportSalaries} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 flex items-center gap-2"><Download size={16}/> Export</button>
            </div>
          </div>
          <div className="space-y-4">
            {teachers.map(teacher => {
              const payments = salaryRecords.filter(r => r.teacherId === teacher.id && r.month === selectedMonth && r.year === selectedYear);
              const cashPaid = payments.reduce((s, p) => s + p.amount, 0);
              const deducted = payments.reduce((s, p) => s + (p.advanceDeduction || 0), 0);
              const totalCredited = cashPaid + deducted;
              const salary = teacher.monthlySalary || 0;
              const balance = salary - totalCredited;
              const status = salary === 0 ? 'N/A' : (balance <= 0 ? 'Paid' : (totalCredited > 0 ? 'Partial' : 'Due'));
              return (
                <div key={teacher.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    {teacher.photo ? <img src={teacher.photo} className="w-12 h-12 rounded-full object-cover"/> : <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">{teacher.name.charAt(0)}</div>}
                    <div><p className="font-bold text-slate-800">{teacher.name}</p><p className="text-xs text-slate-500">{teacher.role}</p></div>
                  </div>
                  <div className="w-full md:w-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center md:text-right">
                    <div><p className="text-xs text-slate-500">Salary</p><p className="font-semibold">₹{salary.toLocaleString()}</p></div>
                    <div><p className="text-xs text-slate-500">Paid (Cash)</p><p className="font-semibold text-green-600">₹{cashPaid.toLocaleString()}</p></div>
                    <div><p className="text-xs text-slate-500">Deducted</p><p className="font-semibold text-orange-600">₹{deducted.toLocaleString()}</p></div>
                    <div className={`p-2 rounded-lg ${status === 'Paid' ? 'bg-green-100' : status === 'Partial' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                      <p className="text-xs">Balance</p><p className={`font-bold ${status === 'Paid' ? 'text-green-700' : status === 'Partial' ? 'text-yellow-700' : 'text-red-700'}`}>₹{balance > 0 ? balance.toLocaleString() : 0}</p>
                    </div>
                  </div>
                  <div className="w-full md:w-auto flex justify-end">
                    {balance > 0 ? <button onClick={() => handleOpenPaymentModal(teacher, balance)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">Pay</button> : <div className="px-4 py-2 text-green-700 text-sm font-semibold flex items-center gap-2"><CheckCircle size={16}/> Paid</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'advances' && (
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
               <div><h2 className="text-xl font-bold text-slate-800">Salary Advances</h2><p className="text-xs text-slate-500 mt-1">Track loans and advance payments to staff</p></div>
               <button onClick={() => setAdvanceModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2"><Plus size={16} /> Issue Advance</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {salaryAdvances.length > 0 ? salaryAdvances.slice().reverse().map(adv => {
                  const teacher = teachers.find(t => t.id === adv.teacherId);
                  return (
                     <div key={adv.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full">
                        <div className="flex justify-between items-start mb-3">
                           <div><h3 className="font-bold text-slate-800">{teacher?.name || 'Unknown Staff'}</h3><p className="text-xs text-slate-500">{adv.dateIssued}</p></div>
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${adv.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{adv.status}</span>
                        </div>
                        <div className="mb-4 space-y-2"><div className="flex justify-between text-sm"><span className="text-slate-500">Advance Amount</span><span className="font-bold text-slate-900">₹{adv.amount.toLocaleString()}</span></div><div className="flex justify-between text-sm"><span className="text-slate-500">Outstanding Balance</span><span className="font-bold text-red-600">₹{adv.balance.toLocaleString()}</span></div></div>
                        {adv.notes && (<div className="text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic mb-4">"{adv.notes}"</div>)}
                        <div className="mt-auto pt-3 border-t border-slate-100 flex justify-end">{adv.balance > 0 && (<button onClick={() => { setRepaymentModal({ isOpen: true, advance: adv }); setRepaymentAmount(''); }} className="text-xs font-semibold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"><RefreshCw size={12} /> Record Cash Repayment</button>)}</div>
                     </div>);
               }) : (<div className="col-span-full text-center py-12 text-slate-500"><FileText className="mx-auto text-slate-300 mb-2" size={32}/><p>No advances issued yet.</p></div>)}
            </div>
         </div>
      )}

      {paymentModal.isOpen && paymentModal.teacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Record Salary Payment</h3>
              <button onClick={() => setPaymentModal({ isOpen: false, teacher: null, totalAdvance: 0, pendingAdvances: [] })} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg mb-6 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-600">Staff Name</span><span className="font-medium text-slate-900">{paymentModal.teacher.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Month</span><span className="font-medium text-slate-900">{MONTHS[selectedMonth-1]} {selectedYear}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-600">Full Salary</span><span className="font-bold text-slate-800">₹{(paymentModal.teacher.monthlySalary || 0).toLocaleString()}</span></div>
              {paymentModal.totalAdvance > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-600">Pending Advance</span>
                  <span className="font-bold text-red-600">₹{paymentModal.totalAdvance.toLocaleString()}</span>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payable Amount (₹)</label>
                <input type="number" autoFocus className="w-full border border-slate-300 rounded-lg p-3 text-lg font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
              </div>
              {paymentModal.totalAdvance > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Deduct from Salary (for Advance)</label>
                  <input type="number" max={Math.min(parseFloat(paymentAmount), paymentModal.totalAdvance)} className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={advanceDeduction} onChange={e => setAdvanceDeduction(e.target.value)} />
                </div>
              )}
              <div className="text-right text-lg font-bold mt-2">
                 Net Cash Paid: <span className="text-green-700">₹{( (parseFloat(paymentAmount) || 0) - (parseFloat(advanceDeduction) || 0) ).toLocaleString()}</span>
              </div>
              <button onClick={handleSubmitPayment} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {advanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Issue Salary Advance</h3>
            <form onSubmit={handleIssueAdvance} className="space-y-4">
              <select value={newAdvance.teacherId} onChange={e => setNewAdvance({...newAdvance, teacherId: e.target.value})} className="w-full border rounded p-2 text-sm"><option value="">Select Staff...</option>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
              <input type="number" placeholder="Amount (₹)" value={newAdvance.amount} onChange={e => setNewAdvance({...newAdvance, amount: e.target.value})} className="w-full border rounded p-2 text-sm" />
              <textarea placeholder="Notes (Optional)" value={newAdvance.notes} onChange={e => setNewAdvance({...newAdvance, notes: e.target.value})} className="w-full border rounded p-2 text-sm h-20"/>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setAdvanceModal(false)} className="px-4 py-2 text-sm text-slate-600 rounded">Cancel</button><button type="submit" className="px-4 py-2 text-sm text-white bg-indigo-600 rounded">Issue</button></div>
            </form>
          </div>
        </div>
      )}

      {repaymentModal.isOpen && repaymentModal.advance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Record Cash Repayment</h3>
            <div className="text-sm mb-4"><p>For: <span className="font-bold">{teachers.find(t=>t.id === repaymentModal.advance?.teacherId)?.name}</span></p><p>Outstanding: <span className="font-bold text-red-600">₹{repaymentModal.advance.balance.toLocaleString()}</span></p></div>
            <input type="number" placeholder="Repayment Amount" value={repaymentAmount} onChange={e => setRepaymentAmount(e.target.value)} className="w-full border rounded p-2 text-sm"/>
            <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setRepaymentModal({isOpen:false, advance:null})} className="px-4 py-2 text-sm text-slate-600 rounded">Cancel</button><button onClick={handleCashRepayment} className="px-4 py-2 text-sm text-white bg-indigo-600 rounded">Record</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
