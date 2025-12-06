
import { openDB, deleteDB, IDBPDatabase } from 'idb';

const DB_NAME = 'SVS-School-DB';
const DB_VERSION = 8; // Incremented version for RBAC stores

const STORE_NAMES = [
  'students', 'fees', 'homework', 'routes', 'teachers',
  'feeStructure', 'smsLogs', 'exams', 'marks', 'settings',
  'isAuthenticated', 'timetables', 'events', 'notifications',
  'expenses', 'expenseCategories', 'salaryRecords', 'salaryAdvances',
  'appState', 'users', 'currentUser' // Stores for Users and Session
];

// Singleton to hold the database connection promise
let dbPromise: Promise<IDBPDatabase<any>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        STORE_NAMES.forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name);
          }
        });
      },
      blocked() {
        console.warn('Database open blocked: waiting for other connections to close...');
      },
      blocking() {
        console.warn('Database blocking a version change. Closing...');
        // If this connection is blocking a delete/upgrade, close it.
        if (dbPromise) {
            dbPromise.then(db => db.close());
            dbPromise = null;
        }
      },
      terminated() {
        console.error('Database connection terminated unexpectedly');
        dbPromise = null;
      }
    });
  }
  return dbPromise;
};

export const saveData = async (key: string, data: any) => {
  try {
    const db = await getDB();
    await db.put(key, data, 'data');
  } catch (err) {
    console.error(`Failed to save ${key}:`, err);
  }
};

export const loadData = async (key: string, defaultValue: any) => {
  try {
    const db = await getDB();
    const value = await db.get(key, 'data');
    return value !== undefined ? value : defaultValue;
  } catch (error) {
    console.error(`Error loading from IndexedDB for key: ${key}`, error);
    return defaultValue;
  }
};

export const getAllData = async () => {
    const db = await getDB();
    const data: Record<string, any> = {};
    for (const storeName of STORE_NAMES) {
        if (db.objectStoreNames.contains(storeName)) {
            data[storeName] = await db.get(storeName, 'data');
        }
    }
    return data;
};

export const restoreAllData = async (data: Record<string, any>) => {
    // 1. Perform Hard Reset to clear existing data
    await performHardReset();
    
    // 2. Re-open (create) database
    const db = await getDB();
    
    const existingStoreNames = STORE_NAMES.filter(name => db.objectStoreNames.contains(name));
    if (existingStoreNames.length === 0) return;

    const tx = db.transaction(existingStoreNames, 'readwrite');
    await Promise.all(
        existingStoreNames.map(storeName => {
            if (Object.prototype.hasOwnProperty.call(data, storeName)) {
                return tx.objectStore(storeName).put(data[storeName], 'data');
            }
            return Promise.resolve();
        })
    );
    await tx.done;
};

/**
 * Performs a complete "Hard Reset" of the database.
 * 1. Force closes any open connection.
 * 2. Attempts to delete the database file.
 * 3. If deletion fails (blocked), manually clears all object stores.
 */
export const performHardReset = async () => {
  console.log("Initiating Hard Reset...");

  // 1. Force Close Connection
  if (dbPromise) {
    try {
      const db = await dbPromise;
      db.close();
      console.log("Database connection closed.");
    } catch (e) {
      console.warn("Error closing DB connection:", e);
    }
    dbPromise = null;
  }

  // 2. Try Deleting Database
  try {
    await deleteDB(DB_NAME, {
      blocked: () => console.warn("Delete blocked by another tab/connection"),
    });
    console.log("Database deleted successfully.");
    return; // Success
  } catch (err) {
    console.warn("Failed to delete database file. Attempting manual store clear...", err);
  }

  // 3. Fallback: Re-open and clear stores manually
  try {
    // We intentionally call openDB directly here to get a fresh connection for clearing
    const db = await openDB(DB_NAME, DB_VERSION);
    const storeNames = db.objectStoreNames;
    
    if (storeNames.length > 0) {
       // Create a transaction for all stores
       // Note: 'readwrite' mode required
       const tx = db.transaction(Array.from(storeNames), 'readwrite');
       const promises = [];
       
       for (let i = 0; i < storeNames.length; i++) {
         const storeName = storeNames.item(i);
         if (storeName) {
            promises.push(tx.objectStore(storeName).clear());
         }
       }
       
       await Promise.all(promises);
       await tx.done;
    }
    
    db.close();
    console.log("All stores cleared manually.");
  } catch (fallbackErr) {
    console.error("Critical: Failed to clear data via fallback method.", fallbackErr);
    throw new Error("Could not reset database. Please restart the application.");
  }
};

// Backwards compatibility alias
export const clearAllData = performHardReset;
