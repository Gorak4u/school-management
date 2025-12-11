
import React from 'react';

export type Medium = string; // Generalized from specific literals
export type Standard = string; // Generalized from specific literals

export interface Student {
  id: string;
  name: string;
  parentName: string; // Father's Name
  phone: string;
  medium: Medium;
  standard: Standard;
  section: string;
  busRouteId?: string | null; // If null, no bus
  rollNo: number;
  isAlumni?: boolean; // True if student has completed 10th or left
  photo?: string; // Base64 encoded thumbnail string
  stsId?: string; // State Student ID (Optional)
  
  // Extended Details
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  motherName?: string;
  caste?: string;
  subCaste?: string; // New
  category?: string; // New: GM, 2A, 2B, etc.
  religion?: string;
  aadharNo?: string;
  address?: string;
  village?: string; // New Village/City field
  familyIncome?: string; // New
  email?: string; // New
  
  // Banking & Previous School
  bankAccountNo?: string; // New
  bankIfsc?: string; // New
  bankName?: string; // New
  previousSchool?: string; // New
  admissionRemarks?: string; // New
}

export interface Teacher {
  id: string;
  name: string;
  role: 'Teacher' | 'Driver' | 'Security' | 'Admin' | 'Other'; // New Role Field
  phone: string;
  qualification?: string;
  subjectSpecialization?: string; // Optional for non-teachers
  isClassTeacher?: boolean;
  assignedClass?: string; // Format: "10-A"
  assignedMedium?: string; // New: To distinguish class teacher by medium
  photo?: string; // Base64 encoded thumbnail string
  monthlySalary: number; // New field for salary
}

export interface SalaryRecord {
  id: string;
  teacherId: string;
  amount: number; // Net Cash Paid
  month: number; // 1-12
  year: number;
  datePaid: string; // YYYY-MM-DD
  advanceDeduction?: number; // Amount deducted from salary to repay advance
}

export interface SalaryAdvance {
  id: string;
  teacherId: string;
  amount: number; // Original Advance Amount
  balance: number; // Remaining amount to be repaid
  dateIssued: string;
  status: 'Pending' | 'Repaid';
  notes?: string;
  repayments?: {
    date: string;
    amount: number;
    type: 'Salary Deduction' | 'Cash Repayment';
  }[];
}

export interface FeeStructure {
  standard: Standard;
  medium: Medium;
  tuitionFee: number;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  type: 'Tuition' | 'Bus' | 'Books' | 'Other' | 'Tuition_Arrears' | 'Bus_Arrears';
  amount: number;
  paidAmount: number;
  dueDate: string;
  datePaid?: string; // Last payment date
  status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  isArchived?: boolean;
  academicYear?: string;
  previousStandard?: string;
  // New: Detailed payment history
  payments?: {
    date: string;
    amount: number;
    mode: string;
    refNo?: string; // New: Receipt Reference Number
    receiverName?: string; // New: User who collected payment
  }[];
}

export interface AttendanceRecord {
  id: string;
  date: string;
  studentId: string;
  status: 'Present' | 'Absent' | 'Late' | 'Leave';
}

export interface Exam {
  id: string;
  name: string; // e.g., "Midterm Exam"
  date: string;
  totalMarks: number;
}

export interface MarkRecord {
  id: string;
  examId: string;
  studentId: string;
  subjects: Record<string, number>; // e.g., { "Maths": 90, "Science": 85 }
}

export interface Homework {
  id: string;
  date: string;
  standard: Standard;
  medium: Medium;
  section: string;
  subject: string;
  description: string;
}

export interface SchoolEvent {
  id: string;
  date: string; // YYYY-MM-DD format
  title: string;
  type: 'Holiday' | 'Exam' | 'Event' | 'Meeting';
  description?: string;
}

export interface Timetable {
  id: string; // e.g., "10-A-Kannada"
  standard: Standard;
  section: string;
  medium: Medium;
  schedule: {
    [day: string]: { // e.g., "Monday"
      subject: string;
      teacherId: string;
    }[];
  };
}

export interface BusRoute {
  id: string;
  routeName: string;
  driverName: string;
  driverPhone: string;
  vehicleNo: string;
  monthlyFee: number;
  driverPhoto?: string; // Base64 encoded thumbnail string
}

export interface SMSLog {
  id: string;
  date: string;
  recipient: string;
  message: string;
  type: 'Homework' | 'Absence' | 'Fee' | 'General';
  status: 'Sent' | 'Failed';
  method?: 'WhatsApp' | 'SMS';
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  categoryId: string;
  amount: number;
  description: string;
}

export interface WhatsAppGroup {
  id: string;
  className: string; // e.g. "Class 10-A Parents"
  groupLink: string; // The WhatsApp group link (e.g., https://chat.whatsapp.com/...)
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  senderName?: string;
  fromEmail?: string;
  targetEmail?: string; // Email to receive the daily reports
  reportTimes: string[]; // e.g. ["06:00", "23:30"] - Times to send auto reports
}

export interface EmailStatus {
  success: boolean;
  timestamp: string;
  message?: string;
  recipient?: string;
}

export interface SchoolSettings {
  name: string;
  address: string;
  contact: string;
  academicYear: string;
  principalName: string;
  whatsAppGroups?: WhatsAppGroup[];
  schoolLogo?: string;
  schoolBanner?: string; // New: Full width banner
  principalSignature?: string;
  recoveryKey: string; 
  
  // Dynamic Configuration
  mediums: string[];
  standards: string[];
  
  // New: Mapping of Medium to available Standards
  mediumSpecificStandards?: Record<string, string[]>;
  
  // Automation
  smtpConfig?: SmtpConfig;
}

export type UserRole = 'super_admin' | 'admin' | 'teacher';

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for listing, required for auth/creation
  name: string;
  role: UserRole;
}

export interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  settings: SchoolSettings;
  onLogout: () => void;
  saveStatus: 'Saved' | 'Saving...';
  lastGithubPushTime: Date | null;
  githubSyncStatus: 'idle' | 'pushing' | 'success' | 'error';
  currentUser: User | null;
  onChangePassword: (oldPass: string, newPass: string) => Promise<boolean>;
  
  // Global Search Props
  students: Student[];
  onGlobalSearchSelect: (student: Student) => void;

  // Theme Props
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export interface LoginProps {
  onLogin: (user: User) => void;
  users: User[];
  schoolName: string;
  schoolLogo?: string;
  onRecoverAccount: (key: string, newPass: string) => boolean;
}

export interface DashboardProps {
  students: Student[];
  fees: FeeRecord[];
  expenses: ExpenseRecord[];
  salaryRecords: SalaryRecord[];
  settings: SchoolSettings;
  onStudentSelect: (student: Student) => void;
  onQuickLinkClick: (action: string) => void; 
  busRoutes: BusRoute[];
  onAutoEmailSent?: (status: EmailStatus) => void; // New Prop
}

export interface StudentsProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>, admissionDiscount: number) => void;
  onUpdateStudent: (student: Student) => void;
  onPromoteStudent: (studentId: string, action: 'promote' | 'exit', nextStandard?: Standard) => void;
  onDeleteStudent: (id: string) => void;
  onShowCertificate: (student: Student) => void;
  onViewStudent: (student: Student) => void; // New prop
  busRoutes: BusRoute[];
  feeStructure: FeeStructure[];
  teachers: Teacher[];
  fees: FeeRecord[];
  settings: SchoolSettings;
  initialStudentToEdit: Student | null;
  onEditHandled: () => void;
  openAddModal: boolean; 
  onAddModalOpened: () => void; 
}

export interface StudentQuickViewModalProps {
  isOpen: boolean;
  student: Student | null;
  fees: FeeRecord[];
  busRoutes: BusRoute[];
  settings: SchoolSettings;
  onClose: () => void;
  onUpdateFee: (feeId: string, paymentAmount: number, paymentMode: string) => void;
  onEditStudent: (student: Student) => void;
  onShowReceipt: (student: Student) => void;
  onShowCertificate: (student: Student) => void;
  onShowHistory: (student: Student) => void; 
  exams?: Exam[]; // New
  marks?: MarkRecord[]; // New
}

export interface ReceiptModalProps {
  isOpen: boolean;
  student: Student | null;
  fees: FeeRecord[];
  settings: SchoolSettings;
  onClose: () => void;
}

export interface CertificateModalProps {
  isOpen: boolean;
  student: Student | null;
  settings: SchoolSettings;
  onClose: () => void;
}

export interface PaymentHistoryModalProps {
  isOpen: boolean;
  student: Student | null;
  fees: FeeRecord[];
  onClose: () => void;
}

export interface SettingsProps {
  settings: SchoolSettings;
  feeStructure: FeeStructure[];
  onSave: (settings: SchoolSettings) => void;
  onSaveFeeStructure: (fees: FeeStructure[]) => void;
  onRepopulate: () => void; 
  onFormat: () => void;     
  onPromoteStudents: () => void;
  onAddWhatsAppGroup: (group: Omit<WhatsAppGroup, 'id'>) => void;
  onDeleteWhatsAppGroup: (id: string) => void;
  onConfigureAutoBackup: () => void;
  isAutoBackupActive: boolean;
  lastBackupTime: Date | null;
  githubPat: string;
  githubRepo: string; // New
  onSaveGithubConfig: (config: { pat: string; repo: string }) => void; // Updated
  onForgetGithubConfig: () => void; // Updated
  onManualGithubSync: () => Promise<{ success: boolean; message: string; }>;
  lastGithubPushTime: Date | null;
  githubSyncStatus: 'idle' | 'pushing' | 'success' | 'error';
  currentUser: User | null;
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onDeleteUser: (id: string) => void;
  onAdminResetPassword: (userId: string, newPass: string) => void;
  lastEmailStatus?: EmailStatus; // New Prop
  
  // Data props for backup/restore
  students: Student[];
  teachers: Teacher[];
  fees: FeeRecord[];
  expenses: ExpenseRecord[];
  onImportData: (data: any) => Promise<void>;
}

export interface FeesProps {
  fees: FeeRecord[];
  students: Student[];
  busRoutes: BusRoute[];
  onUpdateFee: (feeId: string, paymentAmount: number, paymentMode: string) => void;
  settings: SchoolSettings;
  onShowHistory: (student: Student) => void;
}

export interface TeachersProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  settings: SchoolSettings; // Added settings prop
}

export interface TimetableProps {
  timetables: Timetable[];
  teachers: Teacher[];
  onSaveTimetable: (timetable: Timetable) => void;
  settings: SchoolSettings; // Added Settings
}
