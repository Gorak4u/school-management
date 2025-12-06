import React, { useMemo } from 'react';
import { ReceiptModalProps, FeeRecord } from '../types';
import { X, Download, Printer } from 'lucide-react';

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, student, fees, settings, onClose }) => {
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-receipt');
    if (!element) return;
    
    const html2pdf = (window as any).html2pdf;
    if (html2pdf) {
      const opt = {
        margin:       0.5,
        filename:     `Receipt_${student?.name}_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    } else {
      alert("PDF library loading. Please use Print -> Save as PDF.");
      window.print();
    }
  };

  const receiptFees = useMemo(() => {
    if (!student) return [];
    return fees.filter(f => f.studentId === student?.id && !f.isArchived);
  }, [fees, student]);

  const { currentStats, arrearsStats, totalStats } = useMemo(() => {
    const current = receiptFees.filter(f => !f.type.includes('Arrears'));
    const arrears = receiptFees.filter(f => f.type.includes('Arrears'));

    const calc = (list: FeeRecord[]) => {
      const total = list.reduce((s, f) => s + f.amount, 0);
      const paid = list.reduce((s, f) => s + f.paidAmount, 0);
      const balance = total - paid;
      return { total, paid, balance };
    };

    const currentStats = calc(current);
    const arrearsStats = calc(arrears);
    const totalStats = {
      total: currentStats.total + arrearsStats.total,
      paid: currentStats.paid + arrearsStats.paid,
      balance: currentStats.balance + arrearsStats.balance
    };
    return { currentStats, arrearsStats, totalStats };
  }, [receiptFees]);

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm printable-modal-container">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden print:shadow-none print:w-full max-h-[90vh] flex flex-col print:max-h-none print:overflow-visible">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 no-print sticky top-0 bg-white z-10">
          <h3 className="font-semibold text-slate-700">Fee Statement Preview</h3>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 shadow-sm">
              <Download size={16} /> Download PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 shadow-sm">
              <Printer size={16} /> Print
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 print:p-8" id="printable-receipt">
            <header className="text-center border-b-2 border-slate-800 pb-6 mb-6 flex items-center justify-center gap-4">
               {settings.schoolLogo && <img src={settings.schoolLogo} alt="Logo" className="h-16 w-16 object-contain" />}
               <div>
                  <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">{settings.name}</h1>
                  <p className="text-sm text-slate-600 mt-1">{settings.address}</p>
                  <p className="text-sm text-slate-600">Contact: {settings.contact}</p>
               </div>
            </header>
            <div className="text-center mb-6">
               <div className="inline-block px-4 py-1 bg-slate-100 border border-slate-300 rounded text-sm font-semibold uppercase tracking-wider">
                  Fee Statement / Receipt
               </div>
            </div>

            <div className="flex justify-between mb-8">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Student Details</p>
                <p className="font-bold text-slate-900">{student.name}</p>
                <p className="text-sm text-slate-600">Class: {student.standard} ({student.medium})</p>
                <p className="text-sm text-slate-600">Parent: {student.parentName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Receipt Details</p>
                <p className="text-sm text-slate-600">Date: {new Date().toLocaleDateString()}</p>
                <p className="text-sm text-slate-600">Ref: #{Math.floor(Math.random() * 100000)}</p>
              </div>
            </div>

            <div className="mb-8 border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Summary</h4>
              </div>
              <div className="grid grid-cols-4 divide-x divide-slate-200 text-sm">
                <div className="bg-slate-50 font-medium text-slate-600 p-2 text-right">Description</div>
                <div className="bg-slate-50 font-medium text-slate-600 p-2 text-right">Total Payable</div>
                <div className="bg-slate-50 font-medium text-slate-600 p-2 text-right">Paid Amount</div>
                <div className="bg-slate-50 font-medium text-slate-600 p-2 text-right">Balance</div>

                <div className="p-2 text-right text-slate-800">Current Year</div>
                <div className="p-2 text-right text-slate-900">{formatCurrency(currentStats.total)}</div>
                <div className="p-2 text-right text-green-700">{formatCurrency(currentStats.paid)}</div>
                <div className="p-2 text-right text-red-600">{formatCurrency(currentStats.balance)}</div>

                <div className="p-2 text-right text-slate-800">Prev. Arrears</div>
                <div className="p-2 text-right text-slate-900">{formatCurrency(arrearsStats.total)}</div>
                <div className="p-2 text-right text-green-700">{formatCurrency(arrearsStats.paid)}</div>
                <div className="p-2 text-right text-red-600">{formatCurrency(arrearsStats.balance)}</div>

                <div className="p-2 text-right font-bold bg-slate-100 border-t border-slate-200">GRAND TOTAL</div>
                <div className="p-2 text-right font-bold bg-slate-100 border-t border-slate-200">{formatCurrency(totalStats.total)}</div>
                <div className="p-2 text-right font-bold bg-slate-100 border-t border-slate-200 text-green-700">{formatCurrency(totalStats.paid)}</div>
                <div className="p-2 text-right font-bold bg-slate-100 border-t border-slate-200 text-red-700">{formatCurrency(totalStats.balance)}</div>
              </div>
            </div>

            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Itemized Breakdown</h4>
            <table className="w-full mb-8 border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-xs">
                  <th className="py-3 px-4 text-left border-b border-slate-200">Description</th>
                  <th className="py-3 px-4 text-right border-b border-slate-200">Total Amount</th>
                  <th className="py-3 px-4 text-right border-b border-slate-200">Paid Amount</th>
                  <th className="py-3 px-4 text-right border-b border-slate-200">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {receiptFees.map(fee => (
                  <tr key={fee.id}>
                     <td className="py-3 px-4 font-medium text-slate-900">
                       {fee.type}
                       {fee.type.includes('Arrears') && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1 rounded uppercase">Arrears</span>}
                       {fee.academicYear && fee.previousStandard && (
                          <div className="text-xs text-slate-500 font-normal mt-0.5">
                             Academic Year: {fee.academicYear} | Class: {fee.previousStandard}
                          </div>
                       )}
                     </td>
                     <td className="py-3 px-4 text-right text-slate-900">{formatCurrency(fee.amount)}</td>
                     <td className="py-3 px-4 text-right text-green-700">{formatCurrency(fee.paidAmount)}</td>
                     <td className="py-3 px-4 text-right text-red-600 font-medium">{formatCurrency(fee.amount - fee.paidAmount)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300">
                  <td className="py-3 px-4 text-slate-800">TOTAL</td>
                  <td className="py-3 px-4 text-right text-slate-900">{formatCurrency(receiptFees.reduce((s, f) => s + f.amount, 0))}</td>
                  <td className="py-3 px-4 text-right text-green-700">{formatCurrency(receiptFees.reduce((s, f) => s + f.paidAmount, 0))}</td>
                  <td className="py-3 px-4 text-right text-red-600">{formatCurrency(receiptFees.reduce((s, f) => s + (f.amount - f.paidAmount), 0))}</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-between items-end mt-12 pt-8 border-t border-slate-200">
              <div className="text-xs text-slate-400">
                <p>Generated by SVS School Management Software</p>
                <p>{new Date().toLocaleString()}</p>
              </div>
              <div className="text-center">
                <div className="h-12 w-32 mb-2 flex items-center justify-center">
                  {settings.principalSignature && <img src={settings.principalSignature} alt="Signature" className="h-full object-contain" />}
                </div>
                <p className="text-sm font-medium text-slate-900 border-t border-slate-400 pt-1 px-8">Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};