
import React, { useState, useMemo } from 'react';
import { Student, FeeRecord, BusRoute, SchoolSettings, StudentQuickViewModalProps } from '../types';
import { X, User, IndianRupee, Edit2, CreditCard, Printer, FileText, History, MapPin, Calendar, Droplets, Fingerprint, Users, TrendingUp } from 'lucide-react';
import { getMediumStyles } from '../utils/styles';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const StudentQuickViewModal: React.FC<StudentQuickViewModalProps> = ({
  isOpen, student, fees, busRoutes, settings, onClose, onUpdateFee, onEditStudent, onShowReceipt, onShowCertificate, onShowHistory, exams, marks
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'fees' | 'performance'>('profile');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);

  // Performance Data Hook (Moved UP before early return)
  const performanceData = useMemo(() => {
    if (!exams || !marks || !student) return [];
    
    // Sort exams by date
    const sortedExams = [...exams].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return sortedExams.map(exam => {
        const markRecord = marks.find(m => m.examId === exam.id && m.studentId === student.id);
        if (!markRecord) return null;
        
        const subjects = markRecord.subjects;
        // Explicitly cast to number[] to avoid 'unknown' type errors with reduce
        const totalObtained = (Object.values(subjects) as number[]).reduce((sum, val) => sum + val, 0);
        // Assuming 6 subjects with 100 marks each max
        const subjectCount = Object.keys(subjects).length;
        const maxMarks = (subjectCount * 100) || 600; 
        const percentage = Math.round((totalObtained / maxMarks) * 100);
        
        return {
            name: exam.name,
            percentage: percentage
        };
    }).filter((item): item is { name: string; percentage: number } => item !== null);
  }, [exams, marks, student]);

  // Early return MUST be after all hooks
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
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4">
            <button 
                onClick={() => setActiveTab('profile')} 
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'profile' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
                Profile
            </button>
            <button 
                onClick={() => setActiveTab('fees')} 
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'fees' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
                Fees & Payments
            </button>
            <button 
                onClick={() => setActiveTab('performance')} 
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'performance' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
                Performance
            </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {/* Student Header */}
          <div className="flex items-center gap-6 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            {student.photo ? (
              <img src={student.photo} alt={student.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md" />
            ) : (
              <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-2xl border-4 border-white shadow-md ${mediumStyles.badge.split(' ')[0]} ${mediumStyles.text}`}>
                {student.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-slate-900">{student.name}</h3>
              <p className="text-slate-500 font-medium text-sm">Class {student.standard}-{student.section} ({student.medium})</p>
              <div className="flex gap-2 mt-2">
                 <span className="bg-white text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200 font-mono">Roll: {student.rollNo}</span>
                 {student.stsId && <span className="bg-white text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200 font-mono">STS: {student.stsId}</span>}
              </div>
            </div>
            <div className="ml-auto flex flex-col gap-2">
              <button onClick={() => onEditStudent(student)} className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 rounded-lg transition-colors" title="Edit Profile">
                <Edit2 size={18} />
              </button>
            </div>
          </div>

          {activeTab === 'profile' && (
            <div className="space-y-6">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <User size={16} className="text-indigo-500"/> Personal Details
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                    <div><span className="text-slate-500 text-xs block mb-0.5">Date of Birth</span><span className="font-medium text-slate-800">{student.dob || '-'}</span></div>
                    <div><span className="text-slate-500 text-xs block mb-0.5">Gender</span><span className="font-medium text-slate-800">{student.gender || '-'}</span></div>
                    <div><span className="text-slate-500 text-xs block mb-0.5">Blood Group</span><span className="font-medium text-slate-800">{student.bloodGroup || '-'}</span></div>
                    <div><span className="text-slate-500 text-xs block mb-0.5">Religion / Caste</span><span className="font-medium text-slate-800">{student.religion || '-'} / {student.caste || '-'}</span></div>
                    <div><span className="text-slate-500 text-xs block mb-0.5">Aadhar No</span><span className="font-medium text-slate-800 font-mono">{student.aadharNo || '-'}</span></div>
                    </div>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Users size={16} className="text-emerald-500"/> Family & Contact
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                        <div><span className="text-slate-500 text-xs block mb-0.5">Father Name</span><span className="font-medium text-slate-800">{student.parentName}</span></div>
                        <div><span className="text-slate-500 text-xs block mb-0.5">Mother Name</span><span className="font-medium text-slate-800">{student.motherName || '-'}</span></div>
                        <div><span className="text-slate-500 text-xs block mb-0.5">Phone</span><span className="font-medium text-slate-800">{student.phone}</span></div>
                        <div><span className="text-slate-500 text-xs block mb-0.5">Village</span><span className="font-medium text-slate-800">{student.village || '-'}</span></div>
                        <div className="col-span-2"><span className="text-slate-500 text-xs block mb-0.5">Address</span><span className="font-medium text-slate-800">{student.address || '-'}</span></div>
                    </div>
                </div>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-6">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <IndianRupee size={16} className="text-green-600"/> Fee Overview
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-slate-50 rounded-lg"><p className="text-xs text-slate-500">Total</p><p className="text-lg font-bold text-slate-800">₹{totalFee.toLocaleString()}</p></div>
                    <div className="p-3 bg-green-50 rounded-lg"><p className="text-xs text-slate-500">Paid</p><p className="text-lg font-bold text-green-600">₹{totalPaid.toLocaleString()}</p></div>
                    <div className="p-3 bg-red-50 rounded-lg"><p className="text-xs text-slate-500">Balance</p><p className="text-lg font-bold text-red-600">₹{(totalFee - totalPaid).toLocaleString()}</p></div>
                    </div>
                </div>
                
                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Pending Dues</h4>
                    {pendingFees.length > 0 ? (
                    <div className="space-y-2">
                        {pendingFees.map(fee => (
                        <div key={fee.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-indigo-200 transition-colors">
                            <div className="flex items-center justify-between">
                            <div><span className="font-semibold text-slate-800 text-sm">{fee.type.replace('_', ' ')}</span><span className="text-xs text-slate-500 ml-2 block">Due: {fee.dueDate}</span></div>
                            <div className="text-right mr-4"><p className="font-bold text-red-600 text-sm">₹{(fee.amount - fee.paidAmount).toLocaleString()}</p><p className="text-[10px] text-slate-400">of ₹{fee.amount.toLocaleString()}</p></div>
                            <button onClick={() => handlePayClick(fee)} className="bg-green-100 text-green-700 hover:bg-green-200 p-2 rounded-lg"><CreditCard size={16} /></button>
                            </div>
                            {payingFeeId === fee.id && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2 items-center animate-fadeIn">
                                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="flex-1 border border-slate-300 rounded-lg p-2 text-sm" autoFocus placeholder="Amount"/>
                                <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="border border-slate-300 rounded-lg p-2 text-sm bg-white"><option>Cash</option><option>UPI</option><option>Bank</option></select>
                                <button onClick={handleConfirmPayment} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm hover:bg-indigo-700">Pay</button>
                                <button onClick={() => setPayingFeeId(null)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                            </div>
                            )}
                        </div>
                        ))}
                    </div>
                    ) : (
                    <div className="text-center py-6 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm font-medium">All dues cleared!</div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => onShowHistory(student)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors">
                        <History size={16} /> Payment History
                    </button>
                    <button onClick={() => onShowReceipt(student)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold transition-colors">
                        <Printer size={16} /> Fee Statement
                    </button>
                </div>
            </div>
          )}

          {activeTab === 'performance' && (
              <div className="space-y-6">
                  {performanceData.length > 0 ? (
                      <>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-64">
                            <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-purple-600"/> Exam Performance Trend</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}/>
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}}/>
                                    <Tooltip 
                                        formatter={(val) => [`${val}%`, 'Percentage']} 
                                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                    />
                                    <Line type="monotone" dataKey="percentage" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                            {performanceData.map((exam, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="font-medium text-slate-700 text-sm">{exam.name}</span>
                                    <span className={`font-bold text-sm ${exam.percentage >= 75 ? 'text-green-600' : exam.percentage >= 50 ? 'text-indigo-600' : 'text-red-600'}`}>
                                        {exam.percentage}%
                                    </span>
                                </div>
                            ))}
                        </div>
                      </>
                  ) : (
                      <div className="text-center py-12">
                          <TrendingUp size={32} className="mx-auto text-slate-300 mb-2"/>
                          <p className="text-slate-500 text-sm">No exam data available yet.</p>
                      </div>
                  )}
                  <button onClick={() => onShowCertificate(student)} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-semibold transition-colors">
                        <FileText size={16} /> Generate Certificate
                  </button>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
