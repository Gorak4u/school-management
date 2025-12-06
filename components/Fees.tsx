
import React, { useState, useMemo } from 'react';
// FIX: Import SchoolSettings and other types
import { FeeRecord, Student, BusRoute, Standard, Medium, SchoolSettings } from '../types';
import { 
  Users, 
  Bus, 
  GraduationCap, 
  ChevronDown, 
  ChevronRight, 
  Search,
  Download,
  Printer,
  CreditCard,
  X,
  ChevronLeft,
  History // Import History icon
} from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import { getMediumStyles } from '../utils/styles';

interface FeesProps {
  fees: FeeRecord[];
  students: Student[];
  busRoutes: BusRoute[];
  onUpdateFee: (feeId: string, paymentAmount: number, paymentMode: string) => void;
  settings: SchoolSettings;
  onShowHistory: (student: Student) => void; // Add prop for history modal
}

type ViewMode = 'student' | 'class' | 'route';

export const Fees: React.FC<FeesProps> = ({ fees, students, busRoutes, onUpdateFee, settings, onShowHistory }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('student');
  
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [classSearchTerm, setClassSearchTerm] = useState('');
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const [filterMedium, setFilterMedium] = useState<Medium | 'All'>('All');
  const [filterClass, setFilterClass] = useState<Standard | 'All'>('All');
  const [filterRoute, setFilterRoute] = useState<string | 'All'>('All');
  const [showArchived, setShowArchived] = useState(false);
  
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Modal States
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; fee: FeeRecord | null; student: Student | null }>({
    isOpen: false, fee: null, student: null
  });
  const [receiptStudent, setReceiptStudent] = useState<Student | null>(null);

  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState('Cash');

  // --- Search & Aggregation Logic ---

  const getRouteName = (routeId: string | null | undefined) => {
    if (!routeId) return '';
    return busRoutes.find(r => r.id === routeId)?.routeName || '';
  };

  // 1. Student-wise Aggregation with Enhanced Search & Filtering
  const studentFeeSummary = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    
    return students.filter(s => !s.isAlumni).map(student => {
      const studentFees = fees.filter(f => f.studentId === student.id && (showArchived || !f.isArchived));
      const total = studentFees.reduce((sum, f) => sum + f.amount, 0);
      const paid = studentFees.reduce((sum, f) => sum + f.paidAmount, 0);
      const routeName = getRouteName(student.busRouteId);
      
      const tuitionTotal = studentFees.filter(f => f.type === 'Tuition').reduce((s, f) => s + f.amount, 0);
      const tuitionPaid = studentFees.filter(f => f.type === 'Tuition').reduce((s, f) => s + f.paidAmount, 0);
      const busTotal = studentFees.filter(f => f.type === 'Bus').reduce((s, f) => s + f.amount, 0);
      const busPaid = studentFees.filter(f => f.type === 'Bus').reduce((s, f) => s + f.paidAmount, 0);
      const arrearsTotal = studentFees.filter(f => f.type.includes('Arrears')).reduce((s, f) => s + f.amount, 0);
      const arrearsPaid = studentFees.filter(f => f.type.includes('Arrears')).reduce((s, f) => s + f.paidAmount, 0);

      return { student, fees: studentFees, total, paid, pending: total - paid, status: total === 0 ? 'No Fees' : (total === paid ? 'Paid' : (paid === 0 ? 'Pending' : 'Partial')), routeName, breakdown: { tuitionTotal, tuitionPaid, busTotal, busPaid, arrearsTotal, arrearsPaid } };
    }).filter(item => {
      const matchesSearch = !searchTerm || (
        item.student.name.toLowerCase().includes(lowerSearch) ||
        item.student.id.toLowerCase().includes(lowerSearch) ||
        item.student.phone.includes(lowerSearch) ||
        item.student.parentName.toLowerCase().includes(lowerSearch)
      );
      const matchesClass = filterClass === 'All' || item.student.standard === filterClass;
      const matchesMedium = filterMedium === 'All' || item.student.medium === filterMedium; // Added Medium filter
      const matchesRoute = filterRoute === 'All' || (filterRoute === 'None' ? !item.student.busRouteId : item.student.busRouteId === filterRoute);
      return matchesSearch && matchesClass && matchesMedium && matchesRoute;
    });
  }, [students, fees, searchTerm, filterClass, filterRoute, busRoutes, showArchived, filterMedium]);

  // Pagination Logic
  const totalPages = Math.ceil(studentFeeSummary.length / itemsPerPage);
  const currentItems = studentFeeSummary.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // 2. Class-wise Aggregation (Excludes Archived by default)
  const classFeeSummary = useMemo(() => {
    const groups: Record<string, { standard: string, medium: string, total: number, paid: number, students: number }> = {};
    const activeFees = fees.filter(f => !f.isArchived);
    students.filter(s => !s.isAlumni).forEach(student => {
      const key = `${student.standard}-${student.medium}`;
      if (!groups[key]) {
        groups[key] = { standard: student.standard, medium: student.medium, total: 0, paid: 0, students: 0 };
      }
      groups[key].students += 1;
      const sFees = activeFees.filter(f => f.studentId === student.id);
      sFees.forEach(f => {
        groups[key].total += f.amount;
        groups[key].paid += f.paidAmount;
      });
    });
    return Object.values(groups)
      .filter(cls => cls.standard.toLowerCase().includes(classSearchTerm.toLowerCase()))
      .sort((a, b) => a.standard.localeCompare(b.standard));
  }, [students, fees, classSearchTerm]);

  // 3. Route-wise Aggregation (Excludes Archived)
  const routeFeeSummary = useMemo(() => {
    const activeFees = fees.filter(f => !f.isArchived);
    return busRoutes.map(route => {
      const routeStudents = students.filter(s => s.busRouteId === route.id && !s.isAlumni);
      const routeFees = activeFees.filter(f => f.type === 'Bus' && routeStudents.some(s => s.id === f.studentId));
      const total = routeFees.reduce((sum, f) => sum + f.amount, 0);
      const paid = routeFees.reduce((sum, f) => sum + f.paidAmount, 0);
      return { route, studentCount: routeStudents.length, total, paid, pending: total - paid, pendingAmount: total - paid };
    }).filter(item => 
      item.route.routeName.toLowerCase().includes(routeSearchTerm.toLowerCase()) ||
      item.route.driverName.toLowerCase().includes(routeSearchTerm.toLowerCase())
    );
  }, [busRoutes, students, fees, routeSearchTerm]);

  // --- Actions ---

  const handleOpenPayment = (e: React.MouseEvent, fee: FeeRecord, student: Student) => {
    e.stopPropagation();
    const due = fee.amount - fee.paidAmount;
    setPaymentModal({ isOpen: true, fee, student });
    setPaymentAmount(due.toString());
    setPaymentMode('Cash');
  };

  const handleOpenReceipt = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    setReceiptStudent(student);
  };

  const handleOpenHistory = (e: React.MouseEvent, student: Student) => {
    e.stopPropagation();
    onShowHistory(student);
  };

  const submitPayment = () => {
    if (paymentModal.fee) {
      const amountToAdd = parseFloat(paymentAmount) || 0;
      if (amountToAdd > 0) {
        onUpdateFee(paymentModal.fee.id, amountToAdd, paymentMode);
      }
      setPaymentModal({ ...paymentModal, isOpen: false });
    }
  };

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (viewMode === 'student') {
      csvContent += "Student ID,Name,Parent,Phone,Class,Medium,Village,Route,Total Fees,Paid,Pending,Tuition Total,Tuition Paid,Tuition Balance,Bus Total,Bus Paid,Bus Balance,Arrears Total,Arrears Paid,Arrears Balance\n";
      studentFeeSummary.forEach(row => {
        const { tuitionTotal, tuitionPaid, busTotal, busPaid, arrearsTotal, arrearsPaid } = row.breakdown;
        const tuitionBalance = tuitionTotal - tuitionPaid;
        const busBalance = busTotal - busPaid;
        const arrearsBalance = arrearsTotal - arrearsPaid;
        csvContent += `${row.student.id},"${row.student.name}","${row.student.parentName}",${row.student.phone},${row.student.standard},${row.student.medium},"${row.student.village || ''}","${row.routeName}",${row.total},${row.paid},${row.pending},${tuitionTotal},${tuitionPaid},${tuitionBalance},${busTotal},${busPaid},${busBalance},${arrearsTotal},${arrearsPaid},${arrearsBalance}\n`;
      });
    } else if (viewMode === 'class') {
      csvContent += "Class,Medium,Total Students,Total Fees,Collected,Pending\n";
      classFeeSummary.forEach(row => {
        csvContent += `${row.standard},${row.medium},${row.students},${row.total},${row.paid},${row.total - row.paid}\n`;
      });
    } else {
      csvContent += "Route Name,Vehicle No,Driver,Students,Total Fees,Collected,Pending\n";
      routeFeeSummary.forEach(row => {
        csvContent += `"${row.route.routeName}",${row.route.vehicleNo},${row.route.driverName},${row.studentCount},${row.total},${row.paid},${row.pendingAmount}\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fees_export_${viewMode}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Helper Renderers ---
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Paid': return 'bg-green-100 text-green-700';
      case 'Partial': return 'bg-yellow-100 text-yellow-700';
      case 'Pending': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-100 text-slate-700';
    }
  };
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const activeFees = fees.filter(f => !f.isArchived);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-500 mb-1">Total Due (Current Year)</p><h3 className="text-2xl font-bold text-slate-800">{formatCurrency(activeFees.reduce((acc, f) => acc + f.amount, 0))}</h3></div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-500 mb-1">Collected</p><h3 className="text-2xl font-bold text-green-600">{formatCurrency(activeFees.reduce((acc, f) => acc + f.paidAmount, 0))}</h3></div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-sm text-slate-500 mb-1">Pending</p><h3 className="text-2xl font-bold text-red-500">{formatCurrency(activeFees.reduce((acc, f) => acc + (f.amount - f.paidAmount), 0))}</h3></div>
      </div>

      {/* Navigation Tabs & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-xl shadow-inner border border-slate-200">
            <button onClick={() => setViewMode('student')} className={`px-4 lg:px-6 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'student' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}><Users size={16} /> Student-wise</button>
            <button onClick={() => setViewMode('class')} className={`px-4 lg:px-6 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'class' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}><GraduationCap size={16} /> Class-wise</button>
            <button onClick={() => setViewMode('route')} className={`px-4 lg:px-6 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${viewMode === 'route' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'}`}><Bus size={16} /> Route-wise</button>
          </div>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 border border-green-200 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors shadow-sm ml-auto"><Download size={16} /> Export View</button>
        </div>

        {/* Filters */}
        {viewMode === 'student' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative lg:col-span-2"><input type="text" placeholder="Search name, phone, parent..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" /><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /></div>
            <select className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm bg-slate-50" value={filterMedium} onChange={(e) => setFilterMedium(e.target.value as any)}><option value="All">All Mediums</option>{settings.mediums.map(m => <option key={m} value={m}>{m}</option>)}</select>
            <select className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm bg-slate-50" value={filterClass} onChange={(e) => setFilterClass(e.target.value as any)}><option value="All">All Classes</option>{settings.standards.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <select className="w-full border border-slate-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm bg-slate-50" value={filterRoute} onChange={(e) => setFilterRoute(e.target.value)}><option value="All">All Routes</option><option value="None">Non-Transport</option>{busRoutes.map(r => <option key={r.id} value={r.id}>{r.routeName}</option>)}</select>
          </div>
        )}
        {(viewMode === 'class' || viewMode === 'route') && (
            <div className="relative lg:col-span-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <input 
                    type="text" 
                    placeholder={viewMode === 'class' ? 'Search by class...' : 'Search by route name, driver...'}
                    value={viewMode === 'class' ? classSearchTerm : routeSearchTerm}
                    onChange={(e) => viewMode === 'class' ? setClassSearchTerm(e.target.value) : setRouteSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border-transparent rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            </div>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {viewMode === 'student' && (
          <>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 font-semibold text-slate-700 w-10"></th><th className="px-6 py-4 font-semibold text-slate-700">Student Details</th><th className="px-6 py-4 font-semibold text-slate-700">Total Fee</th><th className="px-6 py-4 font-semibold text-slate-700">Paid</th><th className="px-6 py-4 font-semibold text-slate-700">Balance</th><th className="px-6 py-4 font-semibold text-slate-700">Status</th><th className="px-6 py-4 font-semibold text-slate-700 text-center">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{currentItems.length > 0 ? (currentItems.map((item) => { 
                const styles = getMediumStyles(item.student.medium);
                return (
                <React.Fragment key={item.student.id}><tr className={`cursor-pointer transition-colors ${expandedStudent === item.student.id ? 'bg-indigo-50/50' : styles.row}`} onClick={() => setExpandedStudent(expandedStudent === item.student.id ? null : item.student.id)}><td className="px-6 py-4 text-slate-400">{expandedStudent === item.student.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td><td className="px-6 py-4"><div className="font-medium text-slate-900">{item.student.name}</div><div className="text-xs text-slate-500 flex items-center gap-2">Class {item.student.standard} • {item.student.phone} <span className={`text-[10px] px-1.5 rounded border ${styles.badge}`}>{item.student.medium}</span></div> {item.student.village && <div className="text-xs text-slate-500 mt-0.5">Village: {item.student.village}</div>} {item.routeName && (<div className="text-xs text-indigo-500 flex items-center gap-1 mt-0.5"><Bus size={10} /> {item.routeName}</div>)} {item.breakdown.arrearsTotal > 0 && (<div className="text-xs mt-1 flex flex-wrap gap-x-3"><span className="font-semibold text-slate-500">Arrears:</span><span className="text-green-600">Paid: {formatCurrency(item.breakdown.arrearsPaid)}</span><span className="text-red-600 font-bold">Bal: {formatCurrency(item.breakdown.arrearsTotal - item.breakdown.arrearsPaid)}</span></div>)}</td><td className="px-6 py-4 font-medium text-slate-900">{formatCurrency(item.total)}</td><td className="px-6 py-4 text-green-600">{formatCurrency(item.paid)}</td><td className="px-6 py-4 text-red-600">{formatCurrency(item.pending)}</td><td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{item.status}</span></td><td className="px-6 py-4 text-center"><div className="flex justify-center gap-2"><button onClick={(e) => handleOpenHistory(e, item.student)} className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-md transition-colors border border-slate-200 text-xs"><History size={12} /> History</button><button onClick={(e) => handleOpenReceipt(e, item.student)} className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-md transition-colors border border-slate-200 text-xs"><Printer size={12} /> Receipt</button></div></td></tr>{expandedStudent === item.student.id && (<tr className="bg-indigo-50/50"><td colSpan={7} className="px-6 py-4"><div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-inner"><table className="w-full text-xs"><thead className="bg-slate-100 text-slate-600"><tr><th className="px-4 py-2 text-left">Fee Type</th><th className="px-4 py-2 text-left">Due Date</th><th className="px-4 py-2 text-right">Amount</th><th className="px-4 py-2 text-right">Paid</th><th className="px-4 py-2 text-right">Balance</th><th className="px-4 py-2 text-center">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{item.fees.map(fee => { const pending = fee.amount - fee.paidAmount; return (<tr key={fee.id} className={fee.isArchived ? "opacity-50" : ""}><td className="px-4 py-3 font-medium">{fee.type} {fee.type.includes('Arrears') && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1 rounded uppercase">Arrears</span>} {fee.isArchived && <span className="ml-2 text-[10px] bg-slate-200 text-slate-700 px-1 rounded">ARCHIVED</span>} {fee.academicYear && fee.previousStandard && (<div className="text-[10px] text-slate-500 font-normal mt-0.5">{fee.academicYear} • Class {fee.previousStandard}</div>)}</td><td className="px-4 py-3 text-slate-500">{fee.dueDate}</td><td className="px-4 py-3 text-right">{formatCurrency(fee.amount)}</td><td className="px-4 py-3 text-right text-green-600">{formatCurrency(fee.paidAmount)}</td><td className="px-4 py-3 text-right text-red-600">{formatCurrency(pending)}</td><td className="px-4 py-3"><div className="flex justify-center gap-2">{pending > 0 && !fee.isArchived && (<button onClick={(e) => handleOpenPayment(e, fee, item.student)} className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-md transition-colors border border-indigo-200"><CreditCard size={12} /> Pay</button>)}</div></td></tr>); })}</tbody></table></div></td></tr>)}</React.Fragment>)
            })) : (<tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No student records found matching the selected filters.</td></tr>)}</tbody></table></div>
            {totalPages > 1 && (<div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50"><span className="text-xs text-slate-500">Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, studentFeeSummary.length)} of {studentFeeSummary.length} entries</span><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 rounded hover:bg-slate-200 disabled:opacity-50"><ChevronLeft size={16} /></button><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 rounded hover:bg-slate-200 disabled:opacity-50"><ChevronRight size={16} /></button></div></div>)}
          </>
        )}
        {viewMode === 'class' && (<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 font-semibold text-slate-700">Class & Medium</th><th className="px-6 py-4 font-semibold text-slate-700">Total Students</th><th className="px-6 py-4 font-semibold text-slate-700">Total Fees</th><th className="px-6 py-4 font-semibold text-slate-700">Collected</th><th className="px-6 py-4 font-semibold text-slate-700">Pending</th><th className="px-6 py-4 font-semibold text-slate-700">Collection %</th></tr></thead><tbody className="divide-y divide-slate-100">{classFeeSummary.map((cls, idx) => { 
            const percent = cls.total > 0 ? Math.round((cls.paid / cls.total) * 100) : 0; 
            const styles = getMediumStyles(cls.medium);
            return (<tr key={idx} className="hover:bg-slate-50"><td className="px-6 py-4 font-medium text-slate-900"><div className="flex items-center gap-2"><span className="font-bold">Class {cls.standard}</span><span className={`text-xs px-2 py-0.5 rounded border ${styles.badge}`}>{cls.medium}</span></div></td><td className="px-6 py-4 text-slate-600">{cls.students}</td><td className="px-6 py-4 text-slate-900">{formatCurrency(cls.total)}</td><td className="px-6 py-4 text-green-600">{formatCurrency(cls.paid)}</td><td className="px-6 py-4 text-red-600">{formatCurrency(cls.total - cls.paid)}</td><td className="px-6 py-4"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }}></div></div><span className="text-xs font-medium text-slate-600">{percent}%</span></div></td></tr>); })}</tbody></table></div>)}
        {viewMode === 'route' && (<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b border-slate-200"><tr><th className="px-6 py-4 font-semibold text-slate-700">Bus Route</th><th className="px-6 py-4 font-semibold text-slate-700">Driver</th><th className="px-6 py-4 font-semibold text-slate-700">Students</th><th className="px-6 py-4 font-semibold text-slate-700">Bus Fees Total</th><th className="px-6 py-4 font-semibold text-slate-700">Collected</th><th className="px-6 py-4 font-semibold text-slate-700">Pending</th></tr></thead><tbody className="divide-y divide-slate-100">{routeFeeSummary.map((route, idx) => (<tr key={idx} className="hover:bg-slate-50"><td className="px-6 py-4"><div className="font-medium text-slate-900">{route.route.routeName}</div><div className="text-xs text-slate-500">{route.route.vehicleNo}</div></td><td className="px-6 py-4 text-slate-600">{route.route.driverName}</td><td className="px-6 py-4 text-slate-600">{route.studentCount}</td><td className="px-6 py-4 text-slate-900">{formatCurrency(route.total)}</td><td className="px-6 py-4 text-green-600">{formatCurrency(route.paid)}</td><td className="px-6 py-4 text-red-600">{formatCurrency(route.pendingAmount)}</td></tr>))}</tbody></table></div>)}
      </div>

      {paymentModal.isOpen && paymentModal.fee && paymentModal.student && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-800">Record Payment</h3><button onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })} className="text-slate-400 hover:text-slate-600"><X size={20} /></button></div><div className="bg-slate-50 p-4 rounded-lg mb-6"><div className="text-sm font-medium text-slate-900">{paymentModal.student.name}</div><div className="text-xs text-slate-500 mb-2">Class {paymentModal.student.standard}</div><div className="flex justify-between text-sm"><span className="text-slate-600">{paymentModal.fee.type} Fee</span><span className="font-bold text-slate-800">{formatCurrency(paymentModal.fee.amount)}</span></div><div className="flex justify-between text-xs mt-1"><span className="text-slate-500">Already Paid</span><span className="text-green-600">{formatCurrency(paymentModal.fee.paidAmount)}</span></div><div className="flex justify-between text-xs mt-1"><span className="text-slate-500">Balance</span><span className="text-red-600 font-medium">{formatCurrency(paymentModal.fee.amount - paymentModal.fee.paidAmount)}</span></div></div><div className="space-y-4"><div><label className="block text-xs font-medium text-slate-700 mb-1">Paying Amount (₹)</label><input type="number" autoFocus className="w-full border border-slate-300 rounded-lg p-3 text-lg font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} /></div><div><label className="block text-xs font-medium text-slate-700 mb-1">Payment Mode</label><select className="w-full border border-slate-300 rounded-lg p-2 text-sm" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}><option>Cash</option><option>UPI / PhonePe / GPay</option><option>Bank Transfer</option><option>Cheque</option></select></div><button onClick={submitPayment} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors">Confirm Payment</button></div></div></div>)}
      <ReceiptModal isOpen={!!receiptStudent} student={receiptStudent} fees={fees.filter(f => f.studentId === receiptStudent?.id)} settings={settings} onClose={() => setReceiptStudent(null)} />
    </div>
  );
};
