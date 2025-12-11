
import React, { useState, useMemo } from 'react';
import { FeeRecord, ExpenseRecord, SalaryRecord, SchoolSettings, Student, Teacher, ExpenseCategory, SalaryAdvance } from '../types';
import { FilePieChart, Printer, Calendar, Download, ArrowDown, ArrowUp } from 'lucide-react';

interface ReportsProps {
  fees: FeeRecord[];
  expenses: ExpenseRecord[];
  salaryRecords: SalaryRecord[];
  salaryAdvances: SalaryAdvance[];
  settings: SchoolSettings;
  students: Student[];
  teachers: Teacher[];
  expenseCategories: ExpenseCategory[];
}

export const Reports: React.FC<ReportsProps> = ({ fees, expenses, salaryRecords, salaryAdvances, settings, students, teachers, expenseCategories }) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  const reportData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the whole end day

    // Income from Fees
    const feeIncome = fees
      .filter(f => f.datePaid && new Date(f.datePaid) >= start && new Date(f.datePaid) <= end)
      .sort((a, b) => new Date(b.datePaid!).getTime() - new Date(a.datePaid!).getTime());
      
    // Income from Advance Repayments (Cash Type only)
    const advanceRepayments = salaryAdvances.flatMap(adv => {
        if (!adv.repayments) return [];
        return adv.repayments
            .filter(rep => rep.type === 'Cash Repayment' && new Date(rep.date) >= start && new Date(rep.date) <= end)
            .map(rep => ({ ...rep, teacherId: adv.teacherId }));
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Expenses
    const generalExpenses = expenses
      .filter(e => new Date(e.date) >= start && new Date(e.date) <= end)
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    const salaryExpenses = salaryRecords
      .filter(s => new Date(s.datePaid) >= start && new Date(s.datePaid) <= end)
      .sort((a,b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime());

    const advancesGiven = salaryAdvances
      .filter(a => new Date(a.dateIssued) >= start && new Date(a.dateIssued) <= end)
      .sort((a,b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());

    const totalFeeIncome = feeIncome.reduce((sum, f) => sum + f.paidAmount, 0);
    const totalRepaymentIncome = advanceRepayments.reduce((sum, r) => sum + r.amount, 0);
    const totalIncome = totalFeeIncome + totalRepaymentIncome;

    const totalGeneralExpense = generalExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Salary Expense = Net Cash Paid (amount). Deductions are not new expense, they were paid as advances earlier.
    const totalSalaryExpense = salaryExpenses.reduce((sum, s) => sum + s.amount, 0); 
    const totalAdvancesExpense = advancesGiven.reduce((sum, a) => sum + a.amount, 0);

    const totalExpenditure = totalGeneralExpense + totalSalaryExpense + totalAdvancesExpense;

    return {
      feeIncome,
      advanceRepayments,
      generalExpenses,
      salaryExpenses,
      advancesGiven,
      totalIncome,
      totalExpenditure,
      net: totalIncome - totalExpenditure,
    };
  }, [startDate, endDate, fees, expenses, salaryRecords, salaryAdvances]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const { feeIncome, advanceRepayments, generalExpenses, salaryExpenses, advancesGiven, totalIncome, totalExpenditure, net } = reportData;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "Financial Report Summary\n";
    csvContent += `Period,"${startDate} to ${endDate}"\n`;
    csvContent += `Total Income,${totalIncome}\n`;
    csvContent += `Total Expenditure,${totalExpenditure}\n`;
    csvContent += `Net Profit/Loss,${net}\n\n`;

    csvContent += "Income Details (Fees & Repayments)\n";
    csvContent += "Date,Source,Details,Amount\n";
    feeIncome.forEach(item => {
        const student = students.find(s => s.id === item.studentId);
        csvContent += `${item.datePaid},Fee Collection,"${student ? student.name : 'N/A'} - ${item.type}",${item.paidAmount}\n`;
    });
    advanceRepayments.forEach(item => {
        const teacher = teachers.find(t => t.id === item.teacherId);
        csvContent += `${item.date},Advance Repayment,"From ${teacher ? teacher.name : 'Staff'}",${item.amount}\n`;
    });
    csvContent += "\n";

    csvContent += "Expenditure Details (Expenses, Salaries & Advances)\n";
    csvContent += "Date,Category,Details,Amount\n";
    generalExpenses.forEach(item => {
        const category = expenseCategories.find(c => c.id === item.categoryId);
        csvContent += `${item.date},"${category ? category.name : 'Uncategorized'}","${item.description.replace(/"/g, '""')}",${item.amount}\n`;
    });
    salaryExpenses.forEach(item => {
        const teacher = teachers.find(t => t.id === item.teacherId);
        const deductionText = item.advanceDeduction ? ` (Net Pay after ₹${item.advanceDeduction} advance deduction)` : '';
        csvContent += `${item.datePaid},"Staff Salary","${teacher ? teacher.name : 'N/A'}${deductionText}",${item.amount}\n`;
    });
    advancesGiven.forEach(item => {
        const teacher = teachers.find(t => t.id === item.teacherId);
        csvContent += `${item.dateIssued},"Salary Advance","Loan to ${teacher ? teacher.name : 'N/A'}",${item.amount}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Financial_Report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row gap-6 justify-between items-end">
          <h2 className="text-xl font-bold text-slate-800">Financial Report Generator</h2>
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded-lg p-2 text-sm w-full md:w-40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded-lg p-2 text-sm w-full md:w-40" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleExport} className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 h-10">
                <Download size={16} /> Export Excel
              </button>
              <button onClick={handlePrint} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 h-10">
                <Printer size={16} /> Print Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="printable-report" className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none">
        <header className="text-center border-b-2 border-slate-800 pb-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">{settings.name}</h1>
          <h2 className="text-xl font-semibold text-slate-700 mt-2">Income & Expenditure Report</h2>
          <p className="text-sm text-slate-500 mt-1">
            For the period from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
          </p>
        </header>

        <div className="grid grid-cols-3 gap-6 my-8">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-800 font-semibold">Total Income</p>
            <h3 className="text-2xl font-bold text-green-700">{formatCurrency(reportData.totalIncome)}</h3>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-semibold">Total Expenditure</p>
            <h3 className="text-2xl font-bold text-red-700">{formatCurrency(reportData.totalExpenditure)}</h3>
          </div>
          <div className={`p-4 rounded-lg border ${reportData.net >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
            <p className={`text-sm font-semibold ${reportData.net >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Net Profit / Loss</p>
            <h3 className={`text-2xl font-bold ${reportData.net >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>{formatCurrency(reportData.net)}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><ArrowUp className="text-green-500" /> Income</h3>
            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr className="text-left"><th className="p-2">Date</th><th className="p-2">Details</th><th className="p-2 text-right">Amount</th></tr></thead>
                <tbody className="divide-y">
                  {reportData.feeIncome.map(f => (
                    <tr key={f.id}>
                      <td className="p-2">{f.datePaid}</td>
                      <td className="p-2">Fees ({f.type})</td>
                      <td className="p-2 text-right">{formatCurrency(f.paidAmount)}</td>
                    </tr>
                  ))}
                  {reportData.advanceRepayments.map((r, i) => (
                    <tr key={`rep_${i}`} className="bg-green-50/50">
                      <td className="p-2">{r.date}</td>
                      <td className="p-2">Advance Repayment (Cash)</td>
                      <td className="p-2 text-right">{formatCurrency(r.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2"><ArrowDown className="text-red-500" /> Expenditure</h3>
            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50"><tr className="text-left"><th className="p-2">Date</th><th className="p-2">Details</th><th className="p-2 text-right">Amount</th></tr></thead>
                <tbody className="divide-y">
                  {reportData.generalExpenses.map(e => <tr key={e.id}><td className="p-2">{e.date}</td><td className="p-2">{e.description}</td><td className="p-2 text-right">{formatCurrency(e.amount)}</td></tr>)}
                  
                  {reportData.salaryExpenses.map(s => (
                    <tr key={s.id}>
                      <td className="p-2">{s.datePaid}</td>
                      <td className="p-2">
                        Salary
                        {s.advanceDeduction ? <span className="text-[10px] text-orange-600 block">(Ded: {formatCurrency(s.advanceDeduction)})</span> : null}
                      </td>
                      <td className="p-2 text-right">{formatCurrency(s.amount)}</td>
                    </tr>
                  ))}

                  {reportData.advancesGiven.map(a => (
                    <tr key={a.id} className="bg-orange-50/50">
                      <td className="p-2">{a.dateIssued}</td>
                      <td className="p-2">Salary Advance (Given)</td>
                      <td className="p-2 text-right">{formatCurrency(a.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <footer className="text-center mt-12 pt-6 border-t border-slate-200">
           <p className="text-xs text-slate-400">Report generated on {new Date().toLocaleString()}</p>
        </footer>
      </div>
    </div>
  );
};
