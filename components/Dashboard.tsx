
import React, { useState, useEffect } from 'react';
import { 
  Users, IndianRupee, Clock, Bus, Search, Wallet, ArrowRight, TrendingUp, Calendar, UserCheck, Cake, BarChart3,
  UserPlus, FileText, Send, PieChart, AlertCircle, Download, Mail, Bell, Loader2
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { Student, DashboardProps } from '../types';
import { getMediumStyles } from '../utils/styles';
import { loadData, saveData } from '../utils/db';
import * as XLSX from 'xlsx';

export const Dashboard: React.FC<DashboardProps> = ({ students, fees, expenses, salaryRecords, settings, onStudentSelect, onQuickLinkClick, busRoutes, onAutoEmailSent }) => {
  const [showTimeAlert, setShowTimeAlert] = useState<string | null>(null);
  const [isSendingManual, setIsSendingManual] = useState(false);

  // --- Real-time Date Logic ---
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Calculate Today's Financials
  const todaysPayments = React.useMemo(() => {
    return fees.flatMap(f => {
      const pList = f.payments || [];
      return pList.filter(p => p.date === todayStr).map(p => {
        const student = students.find(s => s.id === f.studentId);
        return {
          studentName: student?.name || 'Unknown',
          class: student?.standard || '-',
          section: student?.section || '-',
          medium: student?.medium || '-',
          amount: p.amount,
          mode: p.mode,
          type: f.type,
          id: f.studentId 
        };
      });
    });
  }, [fees, students, todayStr]);

  const todaysExpenses = React.useMemo(() => {
    const general = expenses.filter(e => e.date === todayStr).map(e => ({ type: 'General', desc: e.description, amount: e.amount }));
    const salaries = salaryRecords.filter(s => s.datePaid === todayStr).map(s => ({ type: 'Salary', desc: 'Staff Salary Payment', amount: s.amount }));
    return [...general, ...salaries];
  }, [expenses, salaryRecords, todayStr]);

  const todaysIncomeTotal = todaysPayments.reduce((sum, p) => sum + p.amount, 0);
  const todaysExpenseTotal = todaysExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todaysNet = todaysIncomeTotal - todaysExpenseTotal;

  // --- End 24hr Logic ---

  const activeStudents = students.filter(s => !s.isAlumni);
  const collectedFees = fees.filter(f => !f.isArchived).reduce((sum, f) => sum + f.paidAmount, 0);
  const totalGeneralExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSalaryExpenses = salaryRecords.reduce((sum, s) => sum + s.amount, 0);
  const totalExpenses = totalGeneralExpenses + totalSalaryExpenses;
  
  const boys = activeStudents.filter(s => s.gender === 'Male').length;
  const girls = activeStudents.filter(s => s.gender === 'Female').length;
  const genderData = [
    { name: 'Boys', value: boys, color: '#6366f1' }, 
    { name: 'Girls', value: girls, color: '#ec4899' }, 
  ];

  const stats = [
    { 
      label: 'Total Students', 
      value: activeStudents.length, 
      icon: Users, 
      gradient: 'from-blue-500 to-blue-600', 
      shadow: 'shadow-blue-200 dark:shadow-none' 
    },
    { 
      label: 'Total Fees Collected', 
      value: `₹${(collectedFees / 100000).toFixed(2)}L`, 
      icon: IndianRupee, 
      gradient: 'from-emerald-500 to-emerald-600', 
      shadow: 'shadow-emerald-200 dark:shadow-none' 
    },
    { 
      label: 'Total Expenses', 
      value: `₹${(totalExpenses / 100000).toFixed(2)}L`, 
      icon: Wallet, 
      gradient: 'from-red-500 to-red-600', 
      shadow: 'shadow-red-200 dark:shadow-none' 
    },
    { 
      label: 'Net Cash Flow', 
      value: `₹${((collectedFees - totalExpenses) / 100000).toFixed(2)}L`, 
      icon: (collectedFees - totalExpenses) >= 0 ? TrendingUp : AlertCircle, 
      gradient: (collectedFees - totalExpenses) >= 0 ? 'from-indigo-500 to-purple-600' : 'from-orange-500 to-red-600', 
      shadow: 'shadow-indigo-200 dark:shadow-none' 
    },
  ];

  const generateReportText = () => {
      return `Daily Management Report for ${settings.name}
Date: ${todayStr}

--- FINANCIAL SUMMARY (Today) ---
Total Fees Collected: ₹${todaysIncomeTotal.toLocaleString()}
Total Expenses: ₹${todaysExpenseTotal.toLocaleString()}
Net Cash Flow: ₹${todaysNet.toLocaleString()}

--- OVERALL SUMMARY ---
Total Active Students: ${activeStudents.length}
Current Year Total Collections: ₹${collectedFees.toLocaleString()}
Current Year Total Expenses: ₹${totalExpenses.toLocaleString()}

System generated report.`;
  };

  const classFeeData = React.useMemo(() => {
    const data: Record<string, { collected: number; pending: number; total: number }> = {};
    const activeFees = fees.filter(f => !f.isArchived);
    settings.standards.forEach(std => { data[std] = { collected: 0, pending: 0, total: 0 }; });
    activeFees.forEach(fee => {
        const student = students.find(s => s.id === fee.studentId);
        if (student && !student.isAlumni && data[student.standard]) {
            data[student.standard].collected += fee.paidAmount;
            data[student.standard].pending += (fee.amount - fee.paidAmount);
            data[student.standard].total += fee.amount;
        }
    });
    return Object.entries(data).map(([name, val]) => ({ name: `Cls ${name}`, rawName: name, Collected: val.collected, Pending: val.pending, Total: val.total }));
  }, [fees, students, settings.standards]);

  const generateExcelWorkbook = () => {
    const totalFeeDemand = fees.filter(f => !f.isArchived).reduce((acc, f) => acc + f.amount, 0);
    const totalFeePending = totalFeeDemand - collectedFees;
    
    // Summary Sheet Data
    const summaryData = [
        ["METRIC", "VALUE"],
        ["Report Generated On", new Date().toLocaleString()],
        ["School Name", settings.name],
        ["Academic Year", settings.academicYear],
        ["", ""],
        ["--- TODAY'S ACTIVITY ---", ""],
        ["Fees Collected Today", todaysIncomeTotal],
        ["Expenses Incurred Today", todaysExpenseTotal],
        ["Net Cash Flow Today", todaysNet],
        ["Transaction Count", todaysPayments.length],
        ["", ""],
        ["--- OVERALL STATISTICS ---", ""],
        ["Total Active Students", activeStudents.length],
        ["Total Staff", new Set(salaryRecords.map(s => s.teacherId)).size],
        ["Total Fee Demand", totalFeeDemand],
        ["Total Fee Collected", collectedFees],
        ["Total Fee Pending", totalFeePending],
        ["Collection Efficiency", `${((collectedFees / totalFeeDemand) * 100).toFixed(2)}%`],
        ["Total Expenditure (YTD)", totalExpenses],
    ];

    // Detailed Today's Collections
    const dailyCollectionData = [
        ["Receipt No", "Student Name", "Class", "Section", "Medium", "Fee Type", "Mode", "Amount"],
        ...todaysPayments.map((p, idx) => [
            `REC-${todayStr.replace(/-/g, '')}-${idx+1}`,
            p.studentName,
            p.class,
            p.section,
            p.medium,
            p.type,
            p.mode,
            p.amount
        ]),
        ["", "", "", "", "", "", "TOTAL", todaysIncomeTotal]
    ];

    // Detailed Today's Expenses
    const dailyExpenseData = [
        ["Type", "Description", "Amount"],
        ...todaysExpenses.map(e => [e.type, e.desc, e.amount]),
        ["", "TOTAL", todaysExpenseTotal]
    ];

    // Class Performance Data
    const classPerformanceData = [
        ["Class", "Total Fee Demand", "Collected", "Pending", "Collection %"],
        ...classFeeData.map(c => [
            c.rawName,
            c.Total,
            c.Collected,
            c.Pending,
            `${((c.Collected / c.Total) * 100).toFixed(1)}%`
        ])
    ];

    // 2. Create Workbook
    const wb = XLSX.utils.book_new();
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    const wsDailyColl = XLSX.utils.aoa_to_sheet(dailyCollectionData);
    const wsDailyExp = XLSX.utils.aoa_to_sheet(dailyExpenseData);
    const wsClasses = XLSX.utils.aoa_to_sheet(classPerformanceData);

    // Auto-width
    const wscols = [{wch: 25}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
    wsSummary['!cols'] = [{wch: 30}, {wch: 20}];
    wsDailyColl['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");
    XLSX.utils.book_append_sheet(wb, wsDailyColl, "Today's Collections");
    XLSX.utils.book_append_sheet(wb, wsDailyExp, "Today's Expenses");
    XLSX.utils.book_append_sheet(wb, wsClasses, "Class Performance");

    return wb;
  };

  // Check for Scheduling using Configured Times
  useEffect(() => {
    const checkTime = async () => {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
        
        // Use configured times or default to fallback
        const reportTimes = settings.smtpConfig?.reportTimes || ["06:00", "23:30"];
        
        const isScheduledTime = reportTimes.includes(currentTimeStr);

        if (isScheduledTime) {
            const timeLabel = currentTimeStr;
            setShowTimeAlert(timeLabel);

            // AUTO EMAIL LOGIC
            if (settings.smtpConfig && settings.smtpConfig.host) {
                const appState = await loadData('appState', {});
                const lastSentISO = appState.lastAutoEmailSent;
                
                // Allow multiple reports per day, but only ONE per scheduled minute.
                // If lastSent was more than 2 minutes ago, or it's null, we can send.
                const shouldSend = !lastSentISO || (now.getTime() - new Date(lastSentISO).getTime() > 2 * 60 * 1000);

                if (shouldSend) {
                    const { ipcRenderer } = (window as any).require ? (window as any).require('electron') : { ipcRenderer: null };
                    if (ipcRenderer) {
                        try {
                            const reportBody = generateReportText();
                            // Generate Excel Attachment
                            const wb = generateExcelWorkbook();
                            const excelBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

                            const res = await ipcRenderer.invoke('send-email', {
                                smtpConfig: settings.smtpConfig,
                                mailOptions: {
                                    to: settings.smtpConfig.targetEmail || settings.smtpConfig.user,
                                    subject: `[Auto] ${timeLabel} Report - ${settings.name}`,
                                    text: reportBody,
                                    attachments: [
                                        {
                                            filename: `SVS_Daily_Report_${todayStr}.xlsx`,
                                            content: excelBase64,
                                            encoding: 'base64'
                                        }
                                    ]
                                }
                            });
                            
                            // Callback to App.tsx to update global state and settings UI
                            if (onAutoEmailSent) {
                                onAutoEmailSent({
                                    success: res.success,
                                    timestamp: now.toISOString(),
                                    message: res.success ? 'Auto-report sent successfully.' : (res.error || 'Failed to send.'),
                                    recipient: settings.smtpConfig.targetEmail || settings.smtpConfig.user
                                });
                            }
                            
                            if (res.success) {
                                console.log("Auto-email sent successfully");
                            } else {
                                console.error("Auto-email failed", res.error);
                            }
                        } catch (err) {
                            console.error("Failed to send auto email", err);
                            if (onAutoEmailSent) {
                                onAutoEmailSent({
                                    success: false,
                                    timestamp: now.toISOString(),
                                    message: (err as Error).message || 'Unknown error occurred.',
                                    recipient: settings.smtpConfig.targetEmail || settings.smtpConfig.user
                                });
                            }
                        }
                    }
                }
            }
        } else {
            setShowTimeAlert(null);
        }
    };
    
    checkTime(); 
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [settings.smtpConfig, todaysIncomeTotal, todaysExpenseTotal]); // Dependencies for text generation

  const upcomingBirthdays = activeStudents.filter(s => {
    if (!s.dob) return false;
    const today = new Date();
    const dob = new Date(s.dob);
    const dobThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (dobThisYear < today) dobThisYear.setFullYear(today.getFullYear() + 1);
    const diffTime = dobThisYear.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays >= 0 && diffDays <= 7;
  }).sort((a,b) => a.dob!.localeCompare(b.dob!)).slice(0, 3);

  const criticalFees = fees.filter(f => !f.isArchived && f.status !== 'Paid' && (f.amount - f.paidAmount) > 10000).length;
  const missingDataStudents = activeStudents.filter(s => !s.phone || !s.parentName).length;

  const chartData = [
    { name: 'Apr', income: collectedFees * 0.1, expense: totalExpenses * 0.15 },
    { name: 'May', income: collectedFees * 0.15, expense: totalExpenses * 0.2 },
    { name: 'Jun', income: collectedFees * 0.3, expense: totalExpenses * 0.1 },
    { name: 'Jul', income: collectedFees * 0.2, expense: totalExpenses * 0.25 },
    { name: 'Aug', income: collectedFees * 0.15, expense: totalExpenses * 0.15 },
    { name: 'Sep', income: collectedFees * 0.1, expense: totalExpenses * 0.15 },
  ];

  const handleEmailReport = async () => {
    setIsSendingManual(true);
    const reportBody = generateReportText();
    
    // Check if Electron and SMTP Configured
    if (settings.smtpConfig?.host && (window as any).require) {
        if (!window.confirm("Send daily report with Excel attachment using configured SMTP?")) {
            setIsSendingManual(false);
            return;
        }

        try {
            const { ipcRenderer } = (window as any).require('electron');
            const wb = generateExcelWorkbook();
            const excelBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

            const res = await ipcRenderer.invoke('send-email', {
                smtpConfig: settings.smtpConfig,
                mailOptions: {
                    to: settings.smtpConfig.targetEmail || settings.smtpConfig.user,
                    subject: `Daily Report - ${todayStr}`,
                    text: reportBody,
                    attachments: [
                        {
                            filename: `SVS_Daily_Report_${todayStr}.xlsx`,
                            content: excelBase64,
                            encoding: 'base64'
                        }
                    ]
                }
            });

            if (res.success) {
                alert("Email sent successfully!");
            } else {
                alert("Failed to send email: " + res.error);
            }
        } catch (e) {
            alert("Error sending email: " + (e as Error).message);
        }
    } else {
        // Fallback for Web or No SMTP
        const wb = generateExcelWorkbook();
        XLSX.writeFile(wb, `SVS_Management_Report_${todayStr}.xlsx`);
        
        setTimeout(() => {
            window.open(`mailto:?subject=${encodeURIComponent(`Daily Report - ${todayStr}`)}&body=${encodeURIComponent(reportBody + "\n\n(Please attach the downloaded Excel report manually)")}`);
        }, 1000);
    }
    setIsSendingManual(false);
  };

  const handleExportDashboard = () => {
    const wb = generateExcelWorkbook();
    XLSX.writeFile(wb, `SVS_Management_Report_${todayStr}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
      
      {!settings.schoolBanner && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Overview</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Welcome back! Here's what's happening today.</p>
            </div>
        </div>
      )}

      {showTimeAlert && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-xl shadow-lg flex justify-between items-center animate-blob">
              <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full"><Bell size={20} /></div>
                  <div>
                      <h3 className="font-bold text-sm">{showTimeAlert} Report</h3>
                      <p className="text-xs opacity-90">
                        {settings.smtpConfig?.host ? "Sending auto-email report via SMTP..." : "Time for daily report. Please send manually or configure SMTP."}
                      </p>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={handleEmailReport} className="bg-white text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition-colors">Manual Email</button>
                  <button onClick={handleExportDashboard} className="bg-indigo-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-900 transition-colors">Export Excel</button>
              </div>
          </div>
      )}

      <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 px-1 gap-4">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white">Quick Actions</h3>
             <div className="flex gap-2">
                <button 
                    onClick={handleEmailReport} 
                    disabled={isSendingManual}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 dark:shadow-none transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                    title="Send daily email with Excel attachment"
                >
                    {isSendingManual ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />} 
                    {isSendingManual ? 'Sending...' : 'Send Daily Email'}
                </button>
                <button 
                    onClick={handleExportDashboard} 
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-200 dark:shadow-none transition-all hover:-translate-y-0.5"
                >
                    <Download size={16} /> Export Management Report
                </button>
             </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button 
                  onClick={() => onQuickLinkClick('new_admission')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 hover:-translate-y-1 transition-all group"
                >
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <UserPlus size={24} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">New Admission</span>
                </button>

                <button 
                  onClick={() => onQuickLinkClick('fees')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500 hover:-translate-y-1 transition-all group"
                >
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <IndianRupee size={24} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Collect Fees</span>
                </button>

                <button 
                  onClick={() => onQuickLinkClick('communications')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 hover:-translate-y-1 transition-all group"
                >
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Send size={24} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Send SMS</span>
                </button>

                <button 
                  onClick={() => onQuickLinkClick('attendance')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500 hover:-translate-y-1 transition-all group"
                >
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl mb-3 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <UserCheck size={24} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Attendance</span>
                </button>

                <button 
                  onClick={() => onQuickLinkClick('reports')}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500 hover:-translate-y-1 transition-all group"
                >
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-xl mb-3 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <FileText size={24} />
                  </div>
                  <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">Reports</span>
                </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br ${stat.gradient} text-white shadow-xl ${stat.shadow} hover:-translate-y-1 transition-transform duration-300`}>
            <div className="relative z-10 flex justify-between items-start">
               <div>
                  <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className="text-3xl font-bold">{stat.value}</h3>
               </div>
               <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <stat.icon size={24} className="text-white" />
               </div>
            </div>
            {/* Decorative background shapes */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-2xl"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <BarChart3 size={20} className="text-indigo-600 dark:text-indigo-400"/> Fee Collection by Class
                </h3>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">Real-time Data</div>
            </div>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classFeeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b', fontWeight: 500}} interval={0}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#64748b'}} tickFormatter={(val) => `₹${val/1000}k`}/>
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', backgroundColor: '#fff'}}
                            formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                        />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}}/>
                        <Bar dataKey="Collected" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                        <Bar dataKey="Pending" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-500"/> Needs Attention
            </h3>
            <div className="flex-1 space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-red-600 shadow-sm shrink-0">
                        <IndianRupee size={18}/>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Critical Dues</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{criticalFees} records have {'>'} ₹10k pending fees.</p>
                        <button onClick={() => onQuickLinkClick('fees')} className="text-xs font-semibold text-red-600 mt-2 hover:underline">View List</button>
                    </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-blue-600 shadow-sm shrink-0">
                        <UserCheck size={18}/>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Data Cleanup</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{missingDataStudents} students missing phone/parent info.</p>
                        <button onClick={() => onQuickLinkClick('students')} className="text-xs font-semibold text-blue-600 mt-2 hover:underline">Update Profiles</button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><TrendingUp size={20} className="text-emerald-500"/> Financial Trend</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Income vs Expenses (Last 6 Months)</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#fff'}}
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="income" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none h-72 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2"><PieChart size={20} className="text-blue-500"/> Demographics</h3>
                <div className="flex-1 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie 
                                data={genderData} 
                                cx="50%" cy="50%" 
                                innerRadius={50} outerRadius={70} 
                                paddingAngle={5} 
                                dataKey="value"
                                stroke="none"
                            >
                                {genderData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none'}}/>
                        </RechartsPieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                        <div className="text-center">
                            <span className="block text-3xl font-bold text-slate-800 dark:text-white">{activeStudents.length}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400">Total Students</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Cake size={20} className="text-pink-500"/> Birthdays (7 Days)
                </h3>
                {upcomingBirthdays.length > 0 ? (
                    <div className="space-y-3">
                        {upcomingBirthdays.map(s => (
                            <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-600 group" onClick={() => onStudentSelect(s)}>
                                <div className="w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
                                    {s.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Class {s.standard} • <span className="text-pink-600 dark:text-pink-400 font-medium">{new Date(s.dob!).getDate()} {new Date(s.dob!).toLocaleString('default', { month: 'short' })}</span></p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <Cake size={32} className="mx-auto text-slate-200 dark:text-slate-600 mb-2"/>
                        <p className="text-xs text-slate-400">No upcoming birthdays this week.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
