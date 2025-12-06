# SVS School Management Software

A comprehensive, modern, and offline-capable School Management System designed for **Shree Veerbhadreshwar School, Nittur**. This application manages the entire student lifecycle, including admissions, fees, attendance, academics, transport, and communications.

## 🚀 Key Features

*   **Student Management**: Admission, Promotion, Editing, and detailed student profiles (including Photos).
*   **Fee Management**: 
    *   Dynamic Fee Structures for Kannada & English mediums.
    *   Class-wise, Route-wise, and Student-wise fee tracking.
    *   Payment recording with support for Partial payments.
    *   **Professional Receipt Generation** (Print & PDF).
    *   Arrears management (Previous year dues).
*   **Transport**: Manage Bus Routes, Drivers, and Route-specific fees.
*   **Academics**:
    *   Homework Assignment (with AI drafting).
    *   Exam Creation & Marks Entry.
    *   **Report Card Generation** (Auto-grading, Print & PDF).
*   **Attendance**: Daily attendance tracking with SMS notification integration.
*   **Communications**: 
    *   WhatsApp Web integration for direct messaging.
    *   Simulated SMS Gateway logs.
    *   AI-powered message composing.
*   **Data Security**:
    *   **Auto-Backup**: Automatically saves data to a local secure folder every 5 minutes.
    *   **Cloud Backup**: Integrates with Google Drive for 1-minute interval backups.
    *   **Manual Export/Restore**: Full JSON database export.
*   **Offline First**: Runs entirely in the browser using a high-capacity IndexedDB database.

## 🛠 Tech Stack

*   **Frontend**: React 18, TypeScript, Tailwind CSS
*   **Build Tool**: Vite
*   **Database**: IndexedDB (via `idb` library)
*   **Icons**: Lucide React
*   **Charts**: Recharts
*   **AI**: Google Gemini API (for homework ideas & drafting SMS)
*   **Desktop Wrapper**: Electron

---

## 💻 Installation & Setup

### Prerequisites
*   Node.js (LTS Version) installed on your machine.

### 1. Clone & Install
```bash
# Clone the repository (or extract the zip)
git clone <repository-url>
cd svs-school-management

# Install dependencies (Crucial Step)
npm install
```

### 2. Run as Web Application (Browser)
Ideal for development or running on a local network.
```bash
npm start
```
The app will open at `http://localhost:5173`.

---

## 📦 Building for Different Platforms (Windows, macOS)

This application can be packaged into a native installer for both Windows and macOS.

**Important Note**: To build for a specific platform (e.g., macOS), it is highly recommended to run the build command on that platform itself (i.e., use a Mac to build the `.dmg` file).

### Build for Windows (.exe Installer)
Run the following command in your terminal:
```bash
npm run electron:build:win
```
The output `SVS-School-Management-Setup-X.X.X.exe` file will be located in the `dist/` folder.

### Build for macOS (.dmg file)
Run the following command in your terminal:
```bash
npm run electron:build:mac
```
The output `SVS School Management-X.X.X.dmg` file will be located in the `dist/` folder.

---

## 🔐 Configuration

### Google Drive Backup
To enable cloud backups:
1.  Go to **Settings > Data & Operations**.
2.  Enter your Google Cloud **Client ID** and **API Key**.
3.  Click "Connect to Google Drive".

### Local Auto-Backup
1.  Go to **Settings > Data & Operations**.
2.  Click "Configure Local Backup Folder".
3.  Select a secure folder on your computer.
4.  The app will now save a `SVS_AutoBackup.json` file there every 5 minutes.

---

## 📄 License
Property of Shree Veerbhadreshwar School. Internal use only.