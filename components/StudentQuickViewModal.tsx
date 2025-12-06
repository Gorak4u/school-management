
import React, { useState } from 'react';
import { Student, FeeRecord, BusRoute, SchoolSettings, StudentQuickViewModalProps } from '../types';
import { X, User, IndianRupee, Edit2, CreditCard, Printer, FileText, History, MapPin, Calendar, Droplets, Fingerprint, Users } from 'lucide-react';
import { getMediumStyles } from '../utils/styles';

export const StudentQuickViewModal: React.FC<StudentQuickViewModalProps> = ({
  isOpen, student, fees, busRoutes, settings, onClose, onUpdateFee, onEditStudent, onShowReceipt, onShowCertificate, onShowHistory
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const totalFee = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.reduce((sum, f) => sum + f.paidAmount, 0);
  const pendingFees = fees.filter(f => f.status !== 'Paid');

  const handlePayClick = (fee: FeeRecord) => {
    setPayingFeeId(fee.id);
    setPaymentAmount((fee.amount - fee.paidAmount).toString());
    setPaymentMode('Cash');
  };
  
  const handleConfirmPayment = () => {
    if (!payingFeeId) return;
    const fee = fees.find(f => f.id === payingFeeId);
    if (!fee) return;
    
    const paymentAmt = parseFloat(paymentAmount) || 0;
    if (paymentAmt <= 0 || paymentAmt > (fee.amount - fee.paidAmount)) {
      alert("Invalid payment amount.");
      return;
    }

    onUpdateFee(fee.id, paymentAmt, paymentMode);
    
    setPayingFeeId(null);
    setPaymentAmount('');
  };

  const mediumStyles = getMediumStyles(student.medium);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-scaleIn max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-800">Student Quick View</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {/* Student Header */}
          <div className="flex items-center gap-4 mb-6">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg" />
            ) : (
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl border-4 border-white shadow-lg ${mediumStyles.badge.split(' ')[0]} ${mediumStyles.text}`}>
                {student.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{student.name}</h3>
              <p className="text-slate-500">Class {student.standard}-{student.section} ({student.medium})</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => onShowHistory(student)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold">
                <History size={16} /> History
              </button>
              <button onClick={() => onEditStudent(student)} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold">
                <Edit2 size={16} /> Edit
              </button>
            </div>
          </div>

          {/* Profile Details Section */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <User size={16} className="text-indigo-500"/> Profile Information
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-sm">
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">STS ID</span>
                <span className="font-medium text-slate-800">{student.stsId || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Date of Birth</span>
                <span className="font-medium text-slate-800 flex items-center gap-1"><Calendar size={12}/> {student.dob || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Gender</span>
                <span className="font-medium text-slate-800">{student.gender || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Blood Group</span>
                <span className="font-medium text-slate-800 flex items-center gap-1"><Droplets size={12}/> {student.bloodGroup || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Father Name</span>
                <span className="font-medium text-slate-800">{student.parentName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Mother Name</span>
                <span className="font-medium text-slate-800">{student.motherName || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Religion / Caste</span>
                <span className="font-medium text-slate-800">{student.religion || '-'} / {student.caste || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Aadhar No</span>
                <span className="font-medium text-slate-800 flex items-center gap-1"><Fingerprint size={12}/> {student.aadharNo || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-xs block mb-0.5">Village / City</span>
                <span className="font-medium text-slate-800 flex items-center gap-1"><MapPin size={12}/> {student.village || '-'}</span>
              </div>
              <div className="col-span-2 md:col-span-3">
                <span className="text-slate-500 text-xs block mb-0.5">Address</span>
                <span className="font-medium text-slate-800">{student.address || '-'}</span>
              </div>
            </div>
          </div>

          {/* Fee Summary */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm mb-6">
            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <IndianRupee size={16} className="text-green-600"/> Fee Summary
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-2 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Total Fee</p>
                <p className="text-xl font-bold text-slate-800">₹{totalFee.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg">
                <p className="text-xs text-slate-500">Paid</p>
                <p className="text-xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <p className="text-xs text-slate-500">Balance</p>
                <p className="text-xl font-bold text-red-600">₹{(totalFee - totalPaid).toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Pending Fees List */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2">Pending Payments</h4>
            {pendingFees.length > 0 ? (
              <div className="space-y-2">
                {pendingFees.map(fee => (
                  <div key={fee.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-indigo-200 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">{fee.type.replace('_', ' ')}</span>
                        <span className="text-xs text-slate-500 ml-2">(Due: {fee.dueDate})</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">₹{(fee.amount - fee.paidAmount).toLocaleString()}</p>
                        <p className="text-xs text-slate-400">of ₹{fee.amount.toLocaleString()}</p>
                      </div>
                      <button onClick={() => handlePayClick(fee)} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-semibold">
                        <CreditCard size={14} /> Record Payment
                      </button>
                    </div>
                    {payingFeeId === fee.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 items-center animate-fadeIn">
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={e => setPaymentAmount(e.target.value)}
                          className="flex-1 border border-slate-300 rounded-lg p-2 text-sm"
                          autoFocus
                          placeholder="Amount"
                        />
                        <select
                          value={paymentMode}
                          onChange={e => setPaymentMode(e.target.value)}
                          className="border border-slate-300 rounded-lg p-2 text-sm bg-white"
                        >
                          <option>Cash</option>
                          <option>UPI</option>
                          <option>Bank</option>
                        </select>
                        <button onClick={handleConfirmPayment} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-700">Confirm</button>
                        <button onClick={() => setPayingFeeId(null)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-green-50 text-green-700 rounded-lg border border-green-200">
                All dues cleared. No pending fees.
              </div>
            )}
          </div>
           <div className="mt-6 text-center">
             <button onClick={() => onShowReceipt(student)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
               View Full Fee Statement & Receipt
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};
