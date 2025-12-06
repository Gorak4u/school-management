import React, { useMemo } from 'react';
import { PaymentHistoryModalProps } from '../types';
import { X, History } from 'lucide-react';

export const PaymentHistoryModal: React.FC<PaymentHistoryModalProps> = ({ isOpen, student, fees, onClose }) => {
  
  const paymentHistory = useMemo(() => {
    if (!student) return [];
    
    const allPayments = fees
      .filter(f => f.studentId === student.id && f.payments && f.payments.length > 0)
      .flatMap(f => f.payments!.map(p => ({ ...p, feeType: f.type })));
      
    return allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [student, fees]);

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-scaleIn max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <History className="text-indigo-600" size={24} />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Payment History</h2>
              <p className="text-sm text-slate-500">{student.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto pr-2">
          {paymentHistory.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Fee Type</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Payment Mode</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paymentHistory.map((payment, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{new Date(payment.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{payment.feeType.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-600">{payment.mode}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <p className="text-slate-500">No payment history found for this student.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
