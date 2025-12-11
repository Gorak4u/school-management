
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Students } from './components/Students';
import { Fees } from './components/Fees';
import { Academics } from './components/Academics';
import { Transport } from './components/Transport';
import { Communications } from './components/Communications';
import { Attendance } from './components/Attendance';
import { Login } from './components/Login';
import { LogoutScreen } from './components/LogoutScreen'; 
import { Settings } from './components/Settings';
import { Teachers } from './components/Teachers';
import { Expenses } from './components/Expenses';
import { Salaries } from './components/Salaries';
import { Reports } from './components/Reports';
import { TimetableComponent } from './components/Timetable';
import { Calendar } from './components/Calendar';
import { StudentQuickViewModal } from './components/StudentQuickViewModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CertificateModal } from './components/CertificateModal';
import { PaymentHistoryModal } from './components/PaymentHistoryModal'; // New
import { MOCK_STUDENTS, MOCK_FEES, INITIAL_BUS_ROUTES, INITIAL_TEACHERS, generateDefaultFeeStructure, INITIAL_EXPENSE_CATEGORIES, INITIAL_USERS, INITIAL_SETTINGS, INDIAN_HOLIDAYS } from './constants';
import { Student, FeeRecord, Homework, SMSLog, Exam, MarkRecord, SchoolSettings, Teacher, BusRoute, FeeStructure, Standard, WhatsAppGroup, ExpenseRecord, ExpenseCategory, SalaryRecord, SalaryAdvance, Timetable, SchoolEvent, User, EmailStatus } from './types';
import { loadData, saveData, performHardReset, getAllData, restoreAllData } from './utils/db'; 
import { pushDataToGithub } from './services/githubService';

function App() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogoutMessage, setShowLogoutMessage] = useState(false); 
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [busRoutes, setBusRoutes] = useState<BusRoute[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [feeStructure, setFeeStructure] = useState<FeeStructure[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(INITIAL_SETTINGS);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Saving...'>('Saved');
  const isResetting = useRef(false);
  
  // Concurrency Lock for Background Backups
  const isBackingUp = useRef(false);
  
  const [autoBackupHandle, setAutoBackupHandle] = useState<any>(null);
  const [lastBackupTime, setLastBackupTime] = useState<Date | null>(null);

  const [githubPat, setGithubPat] = useState('');
  const [githubRepo, setGithubRepo] = useState('Gorak4u/svs-school-management'); // New state for repo
  const [lastGithubPushTime, setLastGithubPushTime] = useState<Date | null>(null);
  const [githubSyncStatus, setGithubSyncStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  
  // Email Automation State
  const [lastEmailStatus, setLastEmailStatus] = useState<EmailStatus | undefined>(undefined);

  const [quickViewStudent, setQuickViewStudent] = useState<Student | null>(null);
  const [studentToEditFromDashboard, setStudentToEditFromDashboard] = useState<Student | null>(null);
  const [openAddStudentModal, setOpenAddStudentModal] = useState(false); 
  const [receiptModalStudent, setReceiptModalStudent] = useState<Student | null>(null);
  const [certificateModalStudent, setCertificateModalStudent] = useState<Student | null>(null);
  const [historyModalStudent, setHistoryModalStudent] = useState<Student | null>(null); // New

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  const verifyPermission = async (fileHandle: any) => { if (!fileHandle?.queryPermission) return false; try { const options = { mode: 'readwrite' as const }; if ((await fileHandle.queryPermission(options)) === 'granted') return true; if ((await fileHandle.requestPermission(options)) === 'granted') return true; } catch (error) { console.error("Permission verification failed:", error); } return false; };

  useEffect(() => {
    const loadInitialData = async () => {
      // CHANGE: Inverted logic. Default to FALSE (Clean Slate). Only load mocks if explicitly requested.
      const shouldLoadMocks = localStorage.getItem('SVS_LOAD_DEMO_DATA') === 'true';
      
      // Load dark mode preference from local storage (not DB for faster UI paint)
      const storedTheme = localStorage.getItem('SVS_THEME');
      if (storedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }

      const [ loadedAuth, loadedUser, loadedStudents, loadedFees, loadedHomework, loadedRoutes, loadedTeachers, loadedFeeStructure, loadedSms, loadedExams, loadedMarks, loadedSettings, loadedExpenses, loadedExpCats, loadedSalaries, loadedAdvances, loadedTimetables, loadedEvents, loadedAppState, loadedUsers ] = await Promise.all([
        loadData('isAuthenticated', false),
        loadData('currentUser', null),
        loadData('students', shouldLoadMocks ? MOCK_STUDENTS : []),
        loadData('fees', shouldLoadMocks ? MOCK_FEES : []),
        loadData('homework', []),
        loadData('routes', shouldLoadMocks ? INITIAL_BUS_ROUTES : []),
        loadData('teachers', shouldLoadMocks ? INITIAL_TEACHERS : []),
        loadData('feeStructure', generateDefaultFeeStructure()),
        loadData('smsLogs', []),
        loadData('exams', []),
        loadData('marks', []),
        loadData('settings', INITIAL_SETTINGS),
        loadData('expenses', []),
        loadData('expenseCategories', INITIAL_EXPENSE_CATEGORIES),
        loadData('salaryRecords', []),
        loadData('salaryAdvances', []),
        loadData('timetables', []),
        loadData('events', INDIAN_HOLIDAYS), // Updated to use the 10-year generator
        loadData('appState', { backupHandle: null, lastGithubPushTime: null, githubPat: '', githubRepo: 'Gorak4u/svs-school-management' }),
        loadData('users', INITIAL_USERS) // Load users or seed initial
      ]);
      setIsAuthenticated(loadedAuth); setCurrentUser(loadedUser); setStudents(loadedStudents); setFees(loadedFees); setHomework(loadedHomework); setBusRoutes(loadedRoutes); setTeachers(loadedTeachers); setFeeStructure(loadedFeeStructure); setSmsLogs(loadedSms); setExams(loadedExams); setMarks(loadedMarks); setSettings(loadedSettings); setExpenses(loadedExpenses); setExpenseCategories(loadedExpCats); setSalaryRecords(loadedSalaries); setSalaryAdvances(loadedAdvances); setTimetables(loadedTimetables); setEvents(loadedEvents.length > 0 ? loadedEvents : INDIAN_HOLIDAYS); setUsers(loadedUsers);
      if (loadedAppState) {
        if (loadedAppState.backupHandle && await verifyPermission(loadedAppState.backupHandle)) setAutoBackupHandle(loadedAppState.backupHandle);
        else if (loadedAppState.backupHandle) { console.warn("Permission for auto-backup directory was lost."); await saveData('appState', { ...loadedAppState, backupHandle: null }); }
        if (loadedAppState.lastGithubPushTime) setLastGithubPushTime(new Date(loadedAppState.lastGithubPushTime));
        if (loadedAppState.githubPat) setGithubPat(loadedAppState.githubPat);
        if (loadedAppState.githubRepo) setGithubRepo(loadedAppState.githubRepo);
        if (loadedAppState.lastEmailStatus) setLastEmailStatus(loadedAppState.lastEmailStatus);
      }
      setLoading(false);
    };
    loadInitialData();
  }, []);

  // Sync document title with settings name
  useEffect(() => {
    document.title = settings.name || "School Management System";
  }, [settings.name]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('SVS_THEME', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('SVS_THEME', 'light');
    }
  };

  const triggerSave = async (key: string, data: any) => { if (isResetting.current) return; setSaveStatus('Saving...'); await saveData(key, data); setTimeout(() => setSaveStatus('Saved'), 600); };
  useEffect(() => { if (!loading) triggerSave('students', students) }, [students]);
  useEffect(() => { if (!loading) triggerSave('fees', fees) }, [fees]);
  useEffect(() => { if (!loading) triggerSave('homework', homework) }, [homework]);
  useEffect(() => { if (!loading) triggerSave('routes', busRoutes) }, [busRoutes]);
  useEffect(() => { if (!loading) triggerSave('teachers', teachers) }, [teachers]);
  useEffect(() => { if (!loading) triggerSave('feeStructure', feeStructure) }, [feeStructure]);
  useEffect(() => { if (!loading) triggerSave('smsLogs', smsLogs) }, [smsLogs]);
  useEffect(() => { if (!loading) triggerSave('exams', exams) }, [exams]);
  useEffect(() => { if (!loading) triggerSave('marks', marks) }, [marks]);
  useEffect(() => { if (!loading) triggerSave('settings', settings) }, [settings]);
  useEffect(() => { if (!loading) triggerSave('expenses', expenses) }, [expenses]);
  useEffect(() => { if (!loading) triggerSave('expenseCategories', expenseCategories) }, [expenseCategories]);
  useEffect(() => { if (!loading) triggerSave('salaryRecords', salaryRecords) }, [salaryRecords]);
  useEffect(() => { if (!loading) triggerSave('salaryAdvances', salaryAdvances) }, [salaryAdvances]);
  useEffect(() => { if (!loading) triggerSave('timetables', timetables) }, [timetables]);
  useEffect(() => { if (!loading) triggerSave('events', events) }, [events]);
  useEffect(() => { if (!loading) triggerSave('users', users) }, [users]);
  useEffect(() => { if (!loading) triggerSave('isAuthenticated', isAuthenticated) }, [isAuthenticated]);
  useEffect(() => { if (!loading) triggerSave('currentUser', currentUser) }, [currentUser]);

  const handleLogin = (user: User) => { setIsAuthenticated(true); setCurrentUser(user); setShowLogoutMessage(false); };
  const handleLogout = () => { setIsAuthenticated(false); setCurrentUser(null); setShowLogoutMessage(true); setActiveTab('dashboard'); };
  
  const handleConfigureAutoBackup = async () => { try { if ((window as any).showDirectoryPicker) { const handle = await (window as any).showDirectoryPicker(); const appState = await loadData('appState', {}); await saveData('appState', { ...appState, backupHandle: handle }); setAutoBackupHandle(handle); await performAutoBackup(handle); alert("Auto-backup configured successfully."); } else { alert("Your browser does not support this feature."); } } catch (err) { if ((err as Error).name !== 'AbortError') { alert("Could not configure auto-backup."); console.error("Backup setup failed:", err); } } };

  const performAutoBackup = async (handle: any) => { if (!handle || isResetting.current) return; try { const allData = await getAllData(); const fileHandle = await handle.getFileHandle('SVS_AutoBackup.json', { create: true }); const writable = await fileHandle.createWritable(); await writable.write(JSON.stringify({ timestamp: new Date().toISOString(), data: allData }, null, 2)); await writable.close(); setLastBackupTime(new Date()); } catch (err) { console.error("Auto backup failed", err); } };

  useEffect(() => { if (!autoBackupHandle) return; const interval = setInterval(() => performAutoBackup(autoBackupHandle), 5 * 60 * 1000); return () => clearInterval(interval); }, [autoBackupHandle]);
  
  const performGithubBackup = async () => {
      // Added concurrency check: isBackingUp.current
      if (!githubPat || !githubRepo || !navigator.onLine || isResetting.current || isBackingUp.current) return;
      
      isBackingUp.current = true;
      setGithubSyncStatus('pushing');
      
      try {
          const allData = await getAllData();
          const backupData = { timestamp: new Date().toISOString(), data: allData };
          const now = new Date();
          const year = now.getFullYear();
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const day = now.getDate().toString().padStart(2, '0');
          const timestamp = now.toISOString().replace(/[:.]/g, '-');
          
          // 1. Backup Main Data
          const mainFileName = `SVS_Backup_${timestamp}.json`;
          const mainPath = `${year}/${month}/${day}/${mainFileName}`;
          await pushDataToGithub(githubPat, githubRepo, backupData, mainPath);

          // 2. Backup Credentials separately (Users + Recovery Key)
          const credsFileName = `SVS_Credentials_${timestamp}.json`;
          const credsPath = `credentials/${credsFileName}`;
          
          const securePayload = { 
            users: allData.users, 
            masterRecoveryKey: settings.recoveryKey,
            timestamp: new Date().toISOString() 
          };
          
          await pushDataToGithub(githubPat, githubRepo, securePayload, credsPath);

          setLastGithubPushTime(now);
          const appState = await loadData('appState', {});
          await saveData('appState', { ...appState, lastGithubPushTime: now });
          setGithubSyncStatus('success');
      } catch (e) { 
          // Silent fail - only update status, do not alert
          console.error("Github backup failed silently:", e);
          setGithubSyncStatus('error'); 
      } finally {
          isBackingUp.current = false;
      }
  };

  useEffect(() => { const interval = setInterval(performGithubBackup, 5 * 60 * 1000); return () => clearInterval(interval); }, [githubPat, githubRepo]);

  const handleManualGithubSync = async () => { setGithubSyncStatus('pushing'); await performGithubBackup(); if(githubSyncStatus !== 'error') return { success: true, message: "Sync successful!" }; return { success: false, message: "Sync failed." }; };
  const handleSaveGithubConfig = async (config: { pat: string; repo: string }) => { setGithubPat(config.pat); setGithubRepo(config.repo); const appState = await loadData('appState', {}); await saveData('appState', { ...appState, githubPat: config.pat, githubRepo: config.repo }); alert("GitHub config saved. Auto-sync is active."); };
  const handleForgetGithubConfig = async () => { setGithubPat(''); setGithubRepo(''); const appState = await loadData('appState', {}); await saveData('appState', { ...appState, githubPat: '', githubRepo: '' }); alert("GitHub config forgotten. Auto-sync is disabled."); };

  // Handle Email Status Updates
  const handleAutoEmailSent = async (status: EmailStatus) => {
      setLastEmailStatus(status);
      const appState = await loadData('appState', {});
      await saveData('appState', { ...appState, lastEmailStatus: status, lastAutoEmailSent: status.success ? status.timestamp : appState.lastAutoEmailSent });
  };

  const handleRepopulate = async () => { 
    if (isResetting.current) return; 
    isResetting.current = true; 
    try { 
        await performHardReset(); 
        // OPT-IN to mocks
        localStorage.setItem('SVS_LOAD_DEMO_DATA', 'true'); 
        alert("Data reset successfully! Demo data will be loaded."); 
        window.location.reload(); 
    } catch (err) { isResetting.current = false; } 
  };

  const handleFormat = async () => { 
    if (isResetting.current) return; 
    isResetting.current = true; 
    try { 
        await performHardReset(); 
        // REMOVE opt-in (Clean Slate)
        localStorage.removeItem('SVS_LOAD_DEMO_DATA'); 
        alert("Data formatted successfully! System is now clean."); 
        window.location.reload(); 
    } catch (err) { isResetting.current = false; } 
  };
  
  const handleImportData = async (data: any) => { await restoreAllData(data); };

  const handleAddStudent = (newStudentData: Omit<Student, 'id'>, admissionDiscount: number) => { const newId = `s${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`; const newStudent: Student = { ...newStudentData, id: newId }; const feeConfig = feeStructure.find(f => f.standard === newStudent.standard && f.medium === newStudent.medium); const finalTuition = Math.max(0, (feeConfig ? feeConfig.tuitionFee : 5000) - admissionDiscount); const feeYear = parseInt(settings.academicYear.split('-')[0]) || new Date().getFullYear(); const newFees: FeeRecord[] = [{ id: `f_${newId}_t`, studentId: newId, type: 'Tuition', amount: finalTuition, paidAmount: 0, dueDate: `${feeYear}-06-01`, status: finalTuition > 0 ? 'Pending' : 'Paid', isArchived: false, payments: [] }]; if (newStudent.busRouteId) { const route = busRoutes.find(r => r.id === newStudent.busRouteId); if (route) newFees.push({ id: `f_${newId}_b`, studentId: newId, type: 'Bus', amount: route.monthlyFee * 10, paidAmount: 0, dueDate: `${feeYear}-06-05`, status: 'Pending', isArchived: false, payments: [] }); } setStudents([...students, newStudent]); setFees([...fees, ...newFees]); };
  const handleUpdateStudent = (updatedStudent: Student) => setStudents(students.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  const handleDeleteStudent = (id: string) => { setStudents(students.filter(s => s.id !== id)); setFees(fees.filter(f => f.studentId !== id)); setMarks(marks.filter(m => m.studentId !== id)); };
  
  // Updated Promotion Logic using dynamic settings.standards
  const handlePromoteStudents = () => { 
    const nextYearInt = parseInt(settings.academicYear.split('-')[0]) + 1; 
    const nextAcademicYear = `${nextYearInt}-${nextYearInt + 1}`; 
    const standardsList = settings.standards; // Use dynamic standards

    const updatedStudents = students.map(student => { 
      if (student.isAlumni) return student; 
      const idx = standardsList.indexOf(student.standard); 
      const nextStd = (idx !== -1 && idx < standardsList.length - 1) ? standardsList[idx + 1] : student.standard; 
      return { 
        ...student, 
        standard: nextStd, 
        isAlumni: !(idx !== -1 && idx < standardsList.length - 1) 
      }; 
    }); 
    
    const updatedFees = fees.map(f => { 
      if (f.status === 'Paid' || f.isArchived) return { ...f, isArchived: true }; 
      const pendingAmount = f.amount - f.paidAmount; 
      if (pendingAmount > 0) { 
        const newType = f.type.includes('Bus') ? 'Bus_Arrears' : 'Tuition_Arrears'; 
        return { ...f, type: newType as FeeRecord['type'], amount: pendingAmount, paidAmount: 0, status: 'Pending' as FeeRecord['status'], isArchived: false, academicYear: settings.academicYear, previousStandard: students.find(s => s.id === f.studentId)?.standard }; 
      } 
      return { ...f, isArchived: true }; 
    }); 
    
    const newFees: FeeRecord[] = updatedStudents.filter(s => !s.isAlumni).flatMap(student => { 
      const feeConfig = feeStructure.find(f => f.standard === student.standard && f.medium === student.medium); 
      const tuition = feeConfig ? feeConfig.tuitionFee : 5000; 
      const studentFees: FeeRecord[] = [{ id: `f_${student.id}_${nextYearInt}_t`, studentId: student.id, type: 'Tuition', amount: tuition, paidAmount: 0, dueDate: `${nextYearInt}-06-01`, status: 'Pending', isArchived: false, payments: [] }]; 
      if (student.busRouteId) { 
        const route = busRoutes.find(r => r.id === student.busRouteId); 
        if (route) studentFees.push({ id: `f_${student.id}_${nextYearInt}_b`, studentId: student.id, type: 'Bus', amount: route.monthlyFee * 10, paidAmount: 0, dueDate: `${nextYearInt}-06-05`, status: 'Pending', isArchived: false, payments: [] }); 
      } 
      return studentFees; 
    }); 
    
    setStudents(updatedStudents); 
    setFees([...updatedFees, ...newFees]); 
    setSettings({ ...settings, academicYear: nextAcademicYear }); 
    alert(`Promoted students to ${nextAcademicYear}.`); 
  };

  const handlePromoteSingleStudent = (studentId: string, action: 'promote' | 'exit', nextStandard?: Standard) => { 
    const student = students.find(s => s.id === studentId); 
    if (!student) return; 
    const updatedStudent = { ...student, isAlumni: action === 'exit', standard: nextStandard || student.standard }; 
    setStudents(students.map(s => s.id === studentId ? updatedStudent : s)); 
    
    const updatedFees = fees.map(f => { 
      if (f.studentId !== studentId || f.isArchived) return f; 
      const pending = f.amount - f.paidAmount; 
      if (pending > 0) { 
        const newType = f.type.includes('Bus') ? 'Bus_Arrears' : 'Tuition_Arrears'; 
        return { ...f, type: newType as FeeRecord['type'], amount: pending, paidAmount: 0, status: 'Pending' as FeeRecord['status'], academicYear: settings.academicYear, previousStandard: student.standard }; 
      } 
      return { ...f, isArchived: true }; 
    }); 
    
    let newFees: FeeRecord[] = []; 
    if (action === 'promote' && nextStandard) { 
      const feeConfig = feeStructure.find(f => f.standard === nextStandard && f.medium === student.medium); 
      const tuition = feeConfig ? feeConfig.tuitionFee : 5000; 
      const nextYearInt = parseInt(settings.academicYear.split('-')[0]) + 1; 
      newFees.push({ id: `f_${student.id}_${Date.now()}_t`, studentId: student.id, type: 'Tuition', amount: tuition, paidAmount: 0, dueDate: `${nextYearInt}-06-01`, status: 'Pending', isArchived: false, payments: [] }); 
      if (student.busRouteId) { 
        const route = busRoutes.find(r => r.id === student.busRouteId); 
        if (route) newFees.push({ id: `f_${student.id}_${Date.now()}_b`, studentId: student.id, type: 'Bus', amount: route.monthlyFee * 10, paidAmount: 0, dueDate: `${nextYearInt}-06-05`, status: 'Pending', isArchived: false, payments: [] }); 
      } 
    } 
    setFees([...updatedFees, ...newFees]); 
    alert(`${student.name} has been ${action === 'promote' ? 'promoted' : 'marked as alumni'}.`); 
  };

  const handleUpdateFee = (feeId: string, paymentAmount: number, paymentMode: string) => {
    // 1. Generate Receipt Reference Number
    const dateObj = new Date();
    // Format: RECYYMMDD-Rand (e.g. REC231025-4521)
    const datePart = dateObj.toISOString().slice(2, 10).replace(/-/g, ''); 
    const randPart = Math.floor(1000 + Math.random() * 9000);
    const refNo = `REC${datePart}-${randPart}`;

    // 2. Identify Receiver
    const receiverName = currentUser?.name || 'System';

    setFees(fees.map(f => { 
        if (f.id === feeId) { 
            const newPayment = { 
                date: new Date().toISOString().split('T')[0], 
                amount: paymentAmount, 
                mode: paymentMode,
                refNo: refNo,
                receiverName: receiverName
            }; 
            const updatedPayments = [...(f.payments || []), newPayment]; 
            const newPaidAmount = updatedPayments.reduce((sum, p) => sum + p.amount, 0); 
            const newStatus = newPaidAmount >= f.amount ? 'Paid' : 'Partial'; 
            return { 
                ...f, 
                payments: updatedPayments, 
                paidAmount: newPaidAmount, 
                status: newStatus, 
                datePaid: newPayment.date 
            }; 
        } 
        return f; 
    })); 
  };

  const handleAddHomework = (hw: Omit<Homework, 'id'>) => setHomework([...homework, { ...hw, id: `hw_${Date.now()}` }]);
  const handleSendSMS = (log: SMSLog) => setSmsLogs([...smsLogs, log]);
  const handleAddExam = (exam: Omit<Exam, 'id'>) => setExams([...exams, { ...exam, id: `ex_${Date.now()}` }]);
  const handleUpdateMarks = (record: MarkRecord) => { const existing = marks.some(m => m.examId === record.examId && m.studentId === record.studentId); if(existing) setMarks(marks.map(m => (m.examId === record.examId && m.studentId === record.studentId) ? record : m)); else setMarks([...marks, record]); };
  const handleAddRoute = (route: Omit<BusRoute, 'id'>) => setBusRoutes([...busRoutes, { ...route, id: `br_${Date.now()}` }]);
  const handleUpdateRoute = (route: BusRoute) => setBusRoutes(busRoutes.map(r => r.id === route.id ? route : r));
  const handleDeleteRoute = (id: string) => { setStudents(students.map(s => s.busRouteId === id ? { ...s, busRouteId: null } : s)); setBusRoutes(busRoutes.filter(r => r.id !== id)); };
  const handleAddTeacher = (teacher: Omit<Teacher, 'id'>) => setTeachers([...teachers, { ...teacher, id: `t_${Date.now()}` }]);
  const handleUpdateTeacher = (teacher: Teacher) => setTeachers(teachers.map(t => t.id === teacher.id ? teacher : t));
  const handleDeleteTeacher = (id: string) => setTeachers(teachers.filter(t => t.id !== id));
  const handleAddExpense = (exp: Omit<ExpenseRecord, 'id'>) => setExpenses([...expenses, { ...exp, id: `exp_${Date.now()}` }]);
  const handleUpdateCategories = (cats: ExpenseCategory[]) => setExpenseCategories(cats);
  const handleAddSalaryRecord = (rec: Omit<SalaryRecord, 'id'>) => setSalaryRecords([...salaryRecords, { ...rec, id: `sal_${Date.now()}` }]);
  const handleAddSalaryAdvance = (adv: Omit<SalaryAdvance, 'id'>) => setSalaryAdvances([...salaryAdvances, { ...adv, id: `adv_${Date.now()}` }]);
  const handleUpdateSalaryAdvance = (adv: SalaryAdvance) => setSalaryAdvances(salaryAdvances.map(a => a.id === adv.id ? adv : a));
  const handleSaveTimetable = (tt: Timetable) => { if (timetables.some(t => t.id === tt.id)) setTimetables(timetables.map(t => t.id === tt.id ? tt : t)); else setTimetables([...timetables, tt]); };
  const handleAddEvent = (event: Omit<SchoolEvent, 'id'>) => setEvents([...events, { ...event, id: `ev_${Date.now()}` }]);
  const handleUpdateEvent = (event: SchoolEvent) => setEvents(events.map(e => e.id === event.id ? event : e));
  const handleDeleteEvent = (id: string) => setEvents(events.filter(e => e.id !== id));
  const handleAddWhatsAppGroup = (group: Omit<WhatsAppGroup, 'id'>) => { const newGroup = { ...group, id: `wg_${Date.now()}` }; setSettings(prev => ({ ...prev, whatsAppGroups: [...(prev.whatsAppGroups || []), newGroup] })); };
  const onDeleteWhatsAppGroup = (id: string) => setSettings(prev => ({ ...prev, whatsAppGroups: (prev.whatsAppGroups || []).filter(g => g.id !== id) }));
  const handleQuickLink = (action: string) => { if (action === 'new_admission') { setActiveTab('students'); setOpenAddStudentModal(true); } else setActiveTab(action); };
  
  const handleAddUser = (user: Omit<User, 'id'>) => setUsers([...users, { ...user, id: `u_${Date.now()}` }]);
  const handleDeleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));

  // --- Password Management Logic ---
  const handleChangePassword = async (oldPass: string, newPass: string): Promise<boolean> => {
    if (!currentUser) return false;
    if (currentUser.password !== oldPass) return false;
    const updatedUser = { ...currentUser, password: newPass };
    const updatedUsers = users.map(u => u.id === currentUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    setCurrentUser(updatedUser); 
    return true;
  };

  const handleAdminResetPassword = (userId: string, newPass: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, password: newPass } : u));
    alert("Password reset successfully!");
  };

  const handleRecoverAccount = (key: string, newPass: string): boolean => {
    if (key === settings.recoveryKey) {
        const adminUser = users.find(u => u.role === 'super_admin');
        if (adminUser) {
            setUsers(users.map(u => u.id === adminUser.id ? { ...u, password: newPass } : u));
            return true;
        }
    }
    return false;
  };

  const handleGlobalSearchSelect = (student: Student) => {
    setQuickViewStudent(student);
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-semibold text-lg"><div className="animate-pulse">Loading SVS Database...</div></div>;
  if (showLogoutMessage) return <LogoutScreen onLoginAgain={() => setShowLogoutMessage(false)} />;
  if (!isAuthenticated) return <Login onLogin={handleLogin} users={users} onRecoverAccount={handleRecoverAccount} schoolName={settings.name} schoolLogo={settings.schoolLogo} />;
  
  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        settings={settings} 
        onLogout={handleLogout} 
        saveStatus={saveStatus} 
        lastGithubPushTime={lastGithubPushTime} 
        githubSyncStatus={githubSyncStatus} 
        currentUser={currentUser} 
        onChangePassword={handleChangePassword}
        students={students}
        onGlobalSearchSelect={handleGlobalSearchSelect}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      >
        {activeTab === 'dashboard' && <Dashboard students={students} fees={fees} expenses={expenses} salaryRecords={salaryRecords} settings={settings} onStudentSelect={setQuickViewStudent} onQuickLinkClick={handleQuickLink} busRoutes={busRoutes} onAutoEmailSent={handleAutoEmailSent} />}
        {activeTab === 'students' && <Students students={students} onAddStudent={handleAddStudent} onUpdateStudent={handleUpdateStudent} onPromoteStudent={handlePromoteSingleStudent} onDeleteStudent={handleDeleteStudent} busRoutes={busRoutes} feeStructure={feeStructure} teachers={teachers} fees={fees} settings={settings} onShowCertificate={setCertificateModalStudent} onViewStudent={setQuickViewStudent} initialStudentToEdit={studentToEditFromDashboard} onEditHandled={() => setStudentToEditFromDashboard(null)} openAddModal={openAddStudentModal} onAddModalOpened={() => setOpenAddStudentModal(false)} />}
        {activeTab === 'fees' && <Fees fees={fees} students={students} busRoutes={busRoutes} onUpdateFee={handleUpdateFee} settings={settings} onShowHistory={setHistoryModalStudent} />}
        {activeTab === 'academics' && <Academics homework={homework} onAddHomework={handleAddHomework} students={students} exams={exams} marks={marks} onAddExam={handleAddExam} onUpdateMarks={handleUpdateMarks} settings={settings} />}
        {activeTab === 'transport' && <Transport routes={busRoutes} students={students} onAddRoute={handleAddRoute} onUpdateRoute={handleUpdateRoute} onDeleteRoute={handleDeleteRoute} />}
        {activeTab === 'communications' && <Communications logs={smsLogs} onSend={handleSendSMS} whatsAppGroups={settings.whatsAppGroups || []} />}
        {activeTab === 'attendance' && <Attendance students={students} onSave={() => {}} />}
        {activeTab === 'teachers' && <Teachers teachers={teachers} onAddTeacher={handleAddTeacher} onUpdateTeacher={handleUpdateTeacher} onDeleteTeacher={handleDeleteTeacher} settings={settings} />}
        {activeTab === 'expenses' && <Expenses expenses={expenses} categories={expenseCategories} onAddExpense={handleAddExpense} onUpdateCategories={handleUpdateCategories} />}
        {activeTab === 'salaries' && (currentUser?.role === 'super_admin' ? <Salaries teachers={teachers} salaryRecords={salaryRecords} salaryAdvances={salaryAdvances} onAddSalaryRecord={handleAddSalaryRecord} onAddSalaryAdvance={handleAddSalaryAdvance} onUpdateSalaryAdvance={handleUpdateSalaryAdvance} /> : <div className="p-8 text-center text-red-500 font-bold">Access Denied. Super Admin only.</div>)}
        {activeTab === 'reports' && <Reports fees={fees} expenses={expenses} salaryRecords={salaryRecords} salaryAdvances={salaryAdvances} settings={settings} students={students} teachers={teachers} expenseCategories={expenseCategories} />}
        {activeTab === 'timetable' && <TimetableComponent timetables={timetables} teachers={teachers} onSaveTimetable={handleSaveTimetable} settings={settings} />}
        {activeTab === 'calendar' && <Calendar events={events} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent} />}
        
        {/* Pass extra props to Settings for backup/restore */}
        {activeTab === 'settings' && <Settings settings={settings} feeStructure={feeStructure} onSave={setSettings} onSaveFeeStructure={setFeeStructure} onRepopulate={handleRepopulate} onFormat={handleFormat} onPromoteStudents={handlePromoteStudents} onAddWhatsAppGroup={handleAddWhatsAppGroup} onDeleteWhatsAppGroup={onDeleteWhatsAppGroup} onConfigureAutoBackup={handleConfigureAutoBackup} isAutoBackupActive={!!autoBackupHandle} lastBackupTime={lastBackupTime} githubPat={githubPat} githubRepo={githubRepo} onSaveGithubConfig={handleSaveGithubConfig} onForgetGithubConfig={handleForgetGithubConfig} onManualGithubSync={handleManualGithubSync} lastGithubPushTime={lastGithubPushTime} githubSyncStatus={githubSyncStatus} currentUser={currentUser} users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} onAdminResetPassword={handleAdminResetPassword} students={students} teachers={teachers} fees={fees} expenses={expenses} onImportData={handleImportData} lastEmailStatus={lastEmailStatus} />}
      </Layout>
      <StudentQuickViewModal 
        isOpen={!!quickViewStudent} 
        student={quickViewStudent} 
        fees={fees.filter(f => f.studentId === quickViewStudent?.id)} 
        busRoutes={busRoutes} 
        settings={settings} 
        onClose={() => setQuickViewStudent(null)} 
        onUpdateFee={handleUpdateFee} 
        onEditStudent={(s) => { setActiveTab('students'); setStudentToEditFromDashboard(s); setQuickViewStudent(null); }} 
        onShowReceipt={setReceiptModalStudent} 
        onShowCertificate={setCertificateModalStudent} 
        onShowHistory={setHistoryModalStudent} 
        exams={exams} // Pass Exams for analytics
        marks={marks} // Pass Marks for analytics
      />
      <ReceiptModal isOpen={!!receiptModalStudent} student={receiptModalStudent} fees={fees.filter(f => f.studentId === receiptModalStudent?.id)} settings={settings} onClose={() => setReceiptModalStudent(null)} />
      <CertificateModal isOpen={!!certificateModalStudent} student={certificateModalStudent} settings={settings} onClose={() => setCertificateModalStudent(null)} />
      <PaymentHistoryModal isOpen={!!historyModalStudent} student={historyModalStudent} fees={fees} onClose={() => setHistoryModalStudent(null)} />
    </>
  );
}

export default App;
