
import { BusRoute, Student, FeeRecord, Standard, FeeStructure, Teacher, ExpenseCategory, User, SchoolSettings, SchoolEvent } from './types';

// Default configurations for new setups
export const DEFAULT_MEDIUMS = ['Kannada', 'English'];
export const DEFAULT_STANDARDS = ['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
export const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

export const INITIAL_BUS_ROUTES: BusRoute[] = [
  { id: 'b1', routeName: 'Route A - North', driverName: 'Ramesh', driverPhone: '9900112233', vehicleNo: 'KA-01-AB-1234', monthlyFee: 1500 },
  { id: 'b2', routeName: 'Route B - South', driverName: 'Suresh', driverPhone: '9900445566', vehicleNo: 'KA-02-CD-5678', monthlyFee: 1800 },
  { id: 'b3', routeName: 'Route C - East', driverName: 'Mahesh', driverPhone: '9900556677', vehicleNo: 'KA-03-EF-9012', monthlyFee: 1600 },
  { id: 'b4', routeName: 'Route D - West', driverName: 'Ganesh', driverPhone: '9900889900', vehicleNo: 'KA-04-GH-3456', monthlyFee: 1700 },
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Smt. Lakshmi', role: 'Teacher', phone: '9988776655', qualification: 'M.A, B.Ed', subjectSpecialization: 'Language', isClassTeacher: true, assignedClass: '10-A', assignedMedium: 'Kannada', monthlySalary: 30000 },
  { id: 't2', name: 'Mr. Rajesh', role: 'Teacher', phone: '9988776644', qualification: 'M.Sc, B.Ed', subjectSpecialization: 'Mathematics', isClassTeacher: false, monthlySalary: 32000 },
  { id: 't3', name: 'Mrs. Sarah', role: 'Teacher', phone: '9988776633', qualification: 'B.Sc, B.Ed', subjectSpecialization: 'Science', isClassTeacher: true, assignedClass: '9-A', assignedMedium: 'English', monthlySalary: 28000 },
  { id: 't4', name: 'Mr. Amit', role: 'Teacher', phone: '9988776622', qualification: 'B.A, B.Ed', subjectSpecialization: 'Social Science', isClassTeacher: false, monthlySalary: 29000 },
  { id: 't5', name: 'Mr. Ramesh', role: 'Driver', phone: '9900112233', qualification: '10th', monthlySalary: 15000 },
  { id: 't6', name: 'Mr. Suresh', role: 'Driver', phone: '9900445566', qualification: '10th', monthlySalary: 15500 },
  { id: 't7', name: 'Mr. Bhim', role: 'Security', phone: '9900998877', qualification: 'None', monthlySalary: 12000 },
  { id: 't8', name: 'Ms. Geeta', role: 'Admin', phone: '9900110011', qualification: 'B.Com', monthlySalary: 20000 },
];

export const INITIAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'ec1', name: 'Staff Salaries', color: '#3b82f6' },
  { id: 'ec2', name: 'Utilities (Electricity, Water)', color: '#f59e0b' },
  { id: 'ec3', name: 'Building Maintenance', color: '#10b981' },
  { id: 'ec4', name: 'Stationery & Supplies', color: '#8b5cf6' },
  { id: 'ec5', name: 'Transport Fuel & Maintenance', color: '#ef4444' },
  { id: 'ec6', name: 'Miscellaneous', color: '#64748b' },
];

export const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', password: 'admin123', name: 'Administrator', role: 'super_admin' }
];

export const INITIAL_SETTINGS: SchoolSettings = {
  name: "Shree Veerbhadreshwar School",
  address: "Nittur [B], Bhalki, Bidar - 585444",
  contact: "9900000000",
  academicYear: "2025-2026",
  principalName: "Principal Name",
  whatsAppGroups: [],
  schoolLogo: '',
  principalSignature: '',
  recoveryKey: 'admin-recovery-key',
  mediums: DEFAULT_MEDIUMS,
  standards: DEFAULT_STANDARDS,
  mediumSpecificStandards: {
    'Kannada': ['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    'English': ['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7']
  },
  smtpConfig: {
    host: 'smtp.gmail.com',
    port: 587,
    user: '',
    pass: '',
    fromEmail: '',
    senderName: 'SVS Admin',
    targetEmail: '',
    reportTimes: ["06:00", "23:30"] // Default 6 AM and 11:30 PM
  }
};

// --- HOLIDAY GENERATOR FOR 10 YEARS (2025-2035) ---

const FIXED_HOLIDAYS = [
  { day: '01-26', title: 'Republic Day', desc: 'National Holiday' },
  { day: '08-15', title: 'Independence Day', desc: 'National Holiday' },
  { day: '10-02', title: 'Gandhi Jayanti', desc: 'National Holiday' },
  { day: '11-01', title: 'Kannada Rajyotsava', desc: 'State Holiday' },
  { day: '12-25', title: 'Christmas', desc: 'Religious Holiday' },
  { day: '04-14', title: 'Ambedkar Jayanti', desc: 'Remembrance Day' },
  { day: '05-01', title: 'Labor Day', desc: 'International Workers Day' },
];

// Variable holidays map (approximate dates for major festivals)
const VARIABLE_HOLIDAYS: Record<string, { date: string, title: string }[]> = {
  '2025': [
    { date: '2025-01-14', title: 'Makara Sankranti' }, { date: '2025-02-26', title: 'Maha Shivaratri' },
    { date: '2025-03-14', title: 'Holi' }, { date: '2025-03-30', title: 'Ugadi' },
    { date: '2025-03-31', title: 'Ramzan (Id-ul-Fitr)' }, { date: '2025-04-18', title: 'Good Friday' },
    { date: '2025-06-07', title: 'Bakrid' }, { date: '2025-08-27', title: 'Ganesh Chaturthi' },
    { date: '2025-10-02', title: 'Vijayadashami' }, { date: '2025-10-20', title: 'Diwali' }
  ],
  '2026': [
    { date: '2026-01-14', title: 'Makara Sankranti' }, { date: '2026-02-15', title: 'Maha Shivaratri' },
    { date: '2026-03-03', title: 'Holi' }, { date: '2026-03-19', title: 'Ugadi' },
    { date: '2026-03-20', title: 'Ramzan (Id-ul-Fitr)' }, { date: '2026-04-03', title: 'Good Friday' },
    { date: '2026-09-14', title: 'Ganesh Chaturthi' }, { date: '2026-10-20', title: 'Vijayadashami' },
    { date: '2026-11-08', title: 'Diwali' }
  ],
  '2027': [
    { date: '2027-01-15', title: 'Makara Sankranti' }, { date: '2027-03-06', title: 'Maha Shivaratri' },
    { date: '2027-03-22', title: 'Holi' }, { date: '2027-04-07', title: 'Ugadi' },
    { date: '2027-03-09', title: 'Ramzan (Id-ul-Fitr)' }, { date: '2027-03-26', title: 'Good Friday' },
    { date: '2027-09-04', title: 'Ganesh Chaturthi' }, { date: '2027-10-09', title: 'Vijayadashami' },
    { date: '2027-10-29', title: 'Diwali' }
  ],
  '2028': [
    { date: '2028-01-15', title: 'Makara Sankranti' }, { date: '2028-02-23', title: 'Maha Shivaratri' },
    { date: '2028-03-11', title: 'Holi' }, { date: '2028-03-26', title: 'Ugadi' },
    { date: '2028-02-26', title: 'Ramzan (Id-ul-Fitr)' }, { date: '2028-04-14', title: 'Good Friday' },
    { date: '2028-08-23', title: 'Ganesh Chaturthi' }, { date: '2028-09-28', title: 'Vijayadashami' },
    { date: '2028-10-17', title: 'Diwali' }
  ],
  '2029': [
    { date: '2029-01-14', title: 'Makara Sankranti' }, { date: '2029-02-11', title: 'Maha Shivaratri' },
    { date: '2029-03-01', title: 'Holi' }, { date: '2029-03-16', title: 'Ugadi' },
    { date: '2029-02-15', title: 'Ramzan (Id-ul-Fitr)' }, { date: '2029-03-30', title: 'Good Friday' },
    { date: '2029-09-11', title: 'Ganesh Chaturthi' }, { date: '2029-10-17', title: 'Vijayadashami' },
    { date: '2029-11-05', title: 'Diwali' }
  ],
  '2030': [
    { date: '2030-01-14', title: 'Makara Sankranti' }, { date: '2030-03-02', title: 'Maha Shivaratri' },
    { date: '2030-03-19', title: 'Holi' }, { date: '2030-04-04', title: 'Ugadi' },
    { date: '2030-02-04', title: 'Ramzan (Id-ul-Fitr)' }, { date: '2030-04-19', title: 'Good Friday' },
    { date: '2030-08-31', title: 'Ganesh Chaturthi' }, { date: '2030-10-05', title: 'Vijayadashami' },
    { date: '2030-10-25', title: 'Diwali' }
  ],
  // Placeholder logic for 2031-2035 (can be filled with precise dates later, or users can add manually)
  // For now, we ensure fixed holidays are generated for these years.
};

export const generateIndianHolidays = (): SchoolEvent[] => {
  const holidays: SchoolEvent[] = [];
  const startYear = 2025;
  const endYear = 2035;

  for (let year = startYear; year <= endYear; year++) {
    const yearStr = year.toString();

    // 1. Add Fixed Holidays
    FIXED_HOLIDAYS.forEach(h => {
      holidays.push({
        id: `h_${year}_${h.day.replace('-', '')}`,
        title: h.title,
        date: `${year}-${h.day}`,
        type: 'Holiday',
        description: h.desc
      });
    });

    // 2. Add Variable Holidays if defined
    if (VARIABLE_HOLIDAYS[yearStr]) {
      VARIABLE_HOLIDAYS[yearStr].forEach((h, index) => {
        holidays.push({
          id: `h_${year}_var_${index}`,
          title: h.title,
          date: h.date,
          type: 'Holiday',
          description: 'Festival / Holiday'
        });
      });
    }
  }

  return holidays;
};

export const INDIAN_HOLIDAYS = generateIndianHolidays();

// Helper to generate default fee structure based on settings
export const generateDefaultFeeStructure = (): FeeStructure[] => {
  const fees: FeeStructure[] = [];
  const mediums = DEFAULT_MEDIUMS;
  
  // Specific standards for each medium
  const mediumStandards: Record<string, string[]> = {
    'Kannada': ['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    'English': ['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7']
  };

  mediums.forEach(medium => {
    const standards = mediumStandards[medium] || DEFAULT_STANDARDS;
    standards.forEach(std => {
      let fee = 5000;
      if (medium === 'English') fee = 10000;
      
      // Simple logic to increase fee for higher classes
      const stdIndex = DEFAULT_STANDARDS.indexOf(std);
      if (stdIndex > 5) fee += 2000;
      if (stdIndex > 8) fee += 3000;

      fees.push({ standard: std, medium: medium, tuitionFee: fee });
    });
  });

  return fees;
};

// --- DATA GENERATOR FOR 2000 STUDENTS ---
const NAMES = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharva", "Arav", "Dhruv", "Kabir", "Rian", "Aryan", "Aaditya", "Rudra", "Om", "Ananya", "Diya", "Saanvi", "Aadhya", "Pari", "Kiara", "Myra", "Aamna", "Prisha", "Riya", "Anvi", "Angel", "Avni", "Vani", "Navya", "Gauri", "Aditi", "Kavya", "Isha", "Jiya", "Raju", "Manjunath", "Basavaraj", "Shivakumar", "Ganesh", "Prakash", "Sunil", "Anil", "Sowmya", "Lakshmi", "Preeti", "Radha"];
const SURNAMES = ["Patil", "Kulkarni", "Deshpande", "Joshi", "Naik", "Shetty", "Rao", "Hegde", "Bhat", "Acharya", "Reddy", "Gowda", "Kumar", "Sharma", "Singh", "Verma", "Gupta", "Malhotra", "Khan", "Ahmed", "Hiremath", "Biradar", "Kamble", "Kote", "Badiger"];
const VILLAGES = ["Nittur", "Bhalki", "Humnabad", "Aurad", "Basavakalyan", "Bidar"];

const generateMockData = () => {
  const students: Student[] = [];
  const fees: FeeRecord[] = [];
  
  const mediums = DEFAULT_MEDIUMS;

  // Generate ~2000 students
  for (let i = 0; i < 2000; i++) {
    const medium = mediums[Math.floor(Math.random() * mediums.length)];
    
    // Distribute randomly based on medium availability
    let availableStds = ['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    if (medium === 'English') {
        availableStds = ['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7'];
    }
    
    const standardIndex = Math.floor(Math.pow(Math.random(), 1.5) * availableStds.length);
    const standard = availableStds[standardIndex];
    
    // Sections A-J
    const section = SECTIONS[Math.floor(Math.random() * 4)]; // Mostly A-D for realism, but app supports A-J
    
    const firstName = NAMES[Math.floor(Math.random() * NAMES.length)];
    const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
    const name = `${firstName} ${surname}`;
    const fatherName = `${NAMES[Math.floor(Math.random() * NAMES.length)]} ${surname}`;
    const motherName = NAMES[Math.floor(Math.random() * 20) + 20]; // Pick female names from latter half of list roughly
    
    const id = `s${20250000 + i}`;
    
    // Assign Bus (40% chance)
    const busRouteId = Math.random() > 0.6 ? INITIAL_BUS_ROUTES[Math.floor(Math.random() * INITIAL_BUS_ROUTES.length)].id : null;
    const village = VILLAGES[Math.floor(Math.random() * VILLAGES.length)];

    students.push({
      id,
      name,
      parentName: fatherName,
      motherName: motherName || 'Mother',
      phone: `9${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`,
      medium,
      standard,
      section,
      busRouteId,
      rollNo: (i % 60) + 1,
      address: `${village} Village, Tq. Bhalki`,
      village,
      bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'B-'][Math.floor(Math.random() * 5)],
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      dob: `${2010 + Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      caste: 'General',
      religion: 'Hindu',
      aadharNo: `${Math.floor(Math.random() * 10000)} ${Math.floor(Math.random() * 10000)} ${Math.floor(Math.random() * 10000)}`
    });

    // Generate Fees
    const tuitionFeeAmount = medium === 'English' ? 12000 : 6000; // Simplified logic
    const paidTuition = Math.random() > 0.3 ? tuitionFeeAmount : (Math.random() > 0.5 ? tuitionFeeAmount / 2 : 0);
    
    const tuitionFee: FeeRecord = {
      id: `f${i}_t`,
      studentId: id,
      type: 'Tuition',
      amount: tuitionFeeAmount,
      paidAmount: paidTuition,
      dueDate: '2025-06-01',
      status: paidTuition === tuitionFeeAmount ? 'Paid' : (paidTuition > 0 ? 'Partial' : 'Pending'),
      isArchived: false,
      payments: []
    };
    if (paidTuition > 0) {
      tuitionFee.payments = [{ date: '2025-05-15', amount: paidTuition, mode: 'Cash' }];
      tuitionFee.datePaid = '2025-05-15';
    }
    fees.push(tuitionFee);

    if (busRouteId) {
      const busFeeAmount = 15000;
      const paidBus = Math.random() > 0.5 ? busFeeAmount : 0;
      const busFee: FeeRecord = {
        id: `f${i}_b`,
        studentId: id,
        type: 'Bus',
        amount: busFeeAmount,
        paidAmount: paidBus,
        dueDate: '2025-06-05',
        status: paidBus === busFeeAmount ? 'Paid' : (paidBus > 0 ? 'Partial' : 'Pending'),
        isArchived: false,
        payments: []
      };
      if (paidBus > 0) {
        busFee.payments = [{ date: '2025-05-20', amount: paidBus, mode: 'UPI' }];
        busFee.datePaid = '2025-05-20';
      }
      fees.push(busFee);
    }
  }
  return { students, fees };
};

const mockData = generateMockData();

export const MOCK_STUDENTS: Student[] = mockData.students;
export const MOCK_FEES: FeeRecord[] = mockData.fees;
