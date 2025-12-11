
import * as XLSX from 'xlsx';
import { getAllData } from './db';

// Helper to convert array of objects to worksheet
const jsonToSheet = (data: any[]) => {
  return XLSX.utils.json_to_sheet(data);
};

export const exportFullDatabaseToExcel = async () => {
  try {
    const allData = await getAllData();
    const wb = XLSX.utils.book_new();

    // Students Sheet
    if (allData.students) {
      // Flatten or clean data if necessary (e.g. remove base64 photos to save space/time, or keep them)
      // Keeping base64 might make the file huge. Let's omit photo for Excel export to be safe for editing.
      const cleanStudents = (allData.students as any[]).map(({ photo, ...rest }) => rest);
      XLSX.utils.book_append_sheet(wb, jsonToSheet(cleanStudents), "Students");
    }

    // Fees Sheet
    if (allData.fees) {
      // Flatten payments array for better representation or just stringify?
      // For editing purposes, let's keep it simple. Payments detail might be hard to edit in flat excel.
      // We'll export the raw record.
      const feesData = (allData.fees as any[]).map(f => ({
        ...f,
        payments: JSON.stringify(f.payments) // Serialize complex objects
      }));
      XLSX.utils.book_append_sheet(wb, jsonToSheet(feesData), "Fees");
    }

    // Staff
    if (allData.teachers) {
        const cleanTeachers = (allData.teachers as any[]).map(({ photo, ...rest }) => rest);
        XLSX.utils.book_append_sheet(wb, jsonToSheet(cleanTeachers), "Staff");
    }

    // Expenses
    if (allData.expenses) {
        XLSX.utils.book_append_sheet(wb, jsonToSheet(allData.expenses), "Expenses");
    }

    // Settings (Single row)
    if (allData.settings) {
        const { schoolLogo, schoolBanner, principalSignature, ...restSettings } = allData.settings;
        XLSX.utils.book_append_sheet(wb, jsonToSheet([restSettings]), "Settings");
    }

    // Write file
    XLSX.writeFile(wb, `SVS_Full_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    return false;
  }
};

export const parseExcelDatabase = async (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'binary' });
        const result: any = {};

        // Helper to parse sheet
        const parseSheet = (name: string) => {
            const ws = wb.Sheets[name];
            if (ws) return XLSX.utils.sheet_to_json(ws);
            return [];
        };

        // Students
        const students = parseSheet("Students");
        if (students.length) result.students = students;

        // Fees
        const feesRaw = parseSheet("Fees");
        if (feesRaw.length) {
            result.fees = feesRaw.map((f: any) => ({
                ...f,
                payments: f.payments ? JSON.parse(f.payments) : []
            }));
        }

        // Staff
        const staff = parseSheet("Staff");
        if (staff.length) result.teachers = staff;

        // Expenses
        const expenses = parseSheet("Expenses");
        if (expenses.length) result.expenses = expenses;

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
