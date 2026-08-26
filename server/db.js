import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initDatabase();
  }
});

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function initDatabase() {
  try {
    // 1. Users Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        status TEXT DEFAULT 'Active',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Departments Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS Departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        code TEXT NOT NULL,
        activeAlerts INTEGER DEFAULT 0,
        totalWaste REAL DEFAULT 0.0,
        hazardousWaste REAL DEFAULT 0.0,
        carbonImpact REAL DEFAULT 0.0,
        staffCount INTEGER DEFAULT 0
      )
    `);

    // 3. WasteEntries Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS WasteEntries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        confidence REAL NOT NULL,
        riskLevel TEXT NOT NULL,
        disposalMethod TEXT NOT NULL,
        colorBin TEXT NOT NULL,
        weight REAL NOT NULL,
        department TEXT NOT NULL,
        imageUrl TEXT,
        timestamp TEXT NOT NULL,
        staffName TEXT NOT NULL,
        status TEXT DEFAULT 'Logged'
      )
    `);

    // 4. DetectionLogs Table (Real-time camera feed logs)
    await runAsync(`
      CREATE TABLE IF NOT EXISTS DetectionLogs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        imageUrl TEXT,
        confidence REAL NOT NULL,
        timestamp TEXT NOT NULL,
        department TEXT NOT NULL,
        processed INTEGER DEFAULT 0
      )
    `);

    // 5. Notifications Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS Notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        isRead INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL,
        department TEXT
      )
    `);

    // 6. waste_detections Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS waste_detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT NOT NULL,
        confidence REAL NOT NULL,
        x_min INTEGER,
        y_min INTEGER,
        x_max INTEGER,
        y_max INTEGER,
        timestamp TEXT NOT NULL,
        department TEXT NOT NULL,
        snapshot_path TEXT,
        disposal_recommendation TEXT
      )
    `);

    // 7. uploaded_images Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS uploaded_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        image_path TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        department TEXT NOT NULL
      )
    `);

    // 8. ai_predictions Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS ai_predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_type TEXT NOT NULL,
        predicted_class TEXT NOT NULL,
        confidence REAL NOT NULL,
        model_used TEXT NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);

    // 9. camera_logs Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS camera_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        department TEXT NOT NULL,
        detections_count INTEGER DEFAULT 0,
        snapshot_path TEXT
      )
    `);

    // 10. recycling_suggestions Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS recycling_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT UNIQUE NOT NULL,
        category TEXT NOT NULL,
        bin_color TEXT NOT NULL,
        suggestion TEXT NOT NULL,
        recycling_method TEXT NOT NULL,
        impact_score REAL NOT NULL
      )
    `);

    // 11. hazardous_alerts Table
    await runAsync(`
      CREATE TABLE IF NOT EXISTS hazardous_alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL,
        department TEXT NOT NULL,
        threshold_value REAL,
        current_value REAL
      )
    `);

    // Seed Data if Users are empty
    const userCount = await getAsync('SELECT COUNT(*) as count FROM Users');
    if (userCount.count === 0) {
      console.log('Seeding initial database content...');
      
      // Hash password for default users
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      const staffPassword = await bcrypt.hash('staff123', salt);

      // Create Admin
      await runAsync(
        'INSERT INTO Users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
        ['Dr. Samuel', 'admin@medjestic.com', hashedPassword, 'Admin', 'Administration']
      );

      // Create Staff
      await runAsync(
        'INSERT INTO Users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
        ['Anny Farisha', 'staff@medjestic.com', staffPassword, 'Staff', 'ICU']
      );
      await runAsync(
        'INSERT INTO Users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
        ['Nurse Sarah', 'sarah@medjestic.com', staffPassword, 'Staff', 'Emergency']
      );
      await runAsync(
        'INSERT INTO Users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)',
        ['Lab Tech David', 'david@medjestic.com', staffPassword, 'Staff', 'Laboratory']
      );

      // Seed Departments
      const depts = [
        { name: 'ICU', code: 'ICU-01', alerts: 0, total: 345.5, hazardous: 120.2, carbon: 85.0, staff: 14 },
        { name: 'Emergency', code: 'ER-02', alerts: 1, total: 412.3, hazardous: 189.5, carbon: 104.2, staff: 22 },
        { name: 'Radiology', code: 'RAD-03', alerts: 0, total: 98.4, hazardous: 45.1, carbon: 22.0, staff: 8 },
        { name: 'Operation Theater', code: 'OT-04', alerts: 0, total: 689.8, hazardous: 412.0, carbon: 195.4, staff: 19 },
        { name: 'Laboratory', code: 'LAB-05', alerts: 2, total: 278.2, hazardous: 182.7, carbon: 70.8, staff: 12 },
        { name: 'Pharmacy', code: 'PHAR-06', alerts: 0, total: 154.6, hazardous: 88.3, carbon: 41.2, staff: 9 },
        { name: 'General Ward', code: 'WARD-07', alerts: 0, total: 390.1, hazardous: 42.5, carbon: 76.5, staff: 28 },
        { name: 'Dental Department', code: 'DEN-08', alerts: 0, total: 112.5, hazardous: 61.2, carbon: 28.0, staff: 6 }
      ];

      for (const dept of depts) {
        await runAsync(
          'INSERT INTO Departments (name, code, activeAlerts, totalWaste, hazardousWaste, carbonImpact, staffCount) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [dept.name, dept.code, dept.alerts, dept.total, dept.hazardous, dept.carbon, dept.staff]
        );
      }

      // Seed historical waste logs matching the exact 9 classes
      const wasteCategories = [
        { type: 'Syringes', cat: 'Sharps Waste', risk: 'High', disp: 'Incineration', bin: 'White Category', w: 0.12, conf: 0.94 },
        { type: 'Gloves', cat: 'Infectious Waste', risk: 'Medium', disp: 'Chemical Disinfection & Incineration', bin: 'Red Category', w: 0.08, conf: 0.91 },
        { type: 'Masks', cat: 'General Waste', risk: 'Low', disp: 'Municipal Landfill', bin: 'Black Category', w: 0.05, conf: 0.89 },
        { type: 'Needles', cat: 'Sharps Waste', risk: 'Critical', disp: 'Encapsulation & Burial', bin: 'White Category', w: 0.02, conf: 0.96 },
        { type: 'Blood Bags', cat: 'Biohazard Waste', risk: 'Critical', disp: 'Incineration', bin: 'Yellow Category', w: 0.45, conf: 0.95 },
        { type: 'Plastic Bottles', cat: 'Recyclable Waste', risk: 'Low', disp: 'Certified Plastic Recycling', bin: 'Blue Category', w: 0.15, conf: 0.92 },
        { type: 'Biohazard Waste', cat: 'Biohazard Waste', risk: 'Critical', disp: 'Incineration', bin: 'Yellow Category', w: 1.20, conf: 0.93 },
        { type: 'Sharps Waste', cat: 'Sharps Waste', risk: 'High', disp: 'Autoclaving & Shredding', bin: 'White Category', w: 0.18, conf: 0.94 },
        { type: 'Pharmaceutical Waste', cat: 'Pharmaceutical Waste', risk: 'Medium', disp: 'Chemical Incineration', bin: 'Yellow Category', w: 0.35, conf: 0.88 }
      ];

      const staffList = ['Anny Farisha', 'Nurse Sarah', 'Lab Tech David', 'Dr. Samuel'];
      const deptList = ['ICU', 'Emergency', 'Radiology', 'Operation Theater', 'Laboratory', 'Pharmacy', 'General Ward', 'Dental Department'];

      // Generate seed entries over the last 15 days
      const now = new Date();
      for (let i = 20; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
        
        // Add 2-3 logs per day
        const numLogs = Math.floor(Math.random() * 2) + 2;
        for (let j = 0; j < numLogs; j++) {
          const item = wasteCategories[Math.floor(Math.random() * wasteCategories.length)];
          const weight = +(item.w * (0.8 + Math.random() * 0.4)).toFixed(2);
          const conf = +(item.conf - 0.05 + Math.random() * 0.08).toFixed(2);
          const dept = deptList[Math.floor(Math.random() * deptList.length)];
          const staff = staffList[Math.floor(Math.random() * staffList.length)];

          await runAsync(`
            INSERT INTO WasteEntries (type, category, confidence, riskLevel, disposalMethod, colorBin, weight, department, imageUrl, timestamp, staffName)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            item.type, item.cat, conf, item.risk, item.disp, item.bin, weight, dept, 
            `/assets/mock_${item.type.toLowerCase().replace(' ', '_')}.jpg`, 
            dateStr, staff
          ]);
        }
      }

      // Seed Notifications
      await runAsync(
        'INSERT INTO Notifications (message, type, timestamp, department) VALUES (?, ?, ?, ?)',
        ['Hazardous Waste alert: Chemical waste overflow detected in Laboratory bin.', 'critical', now.toISOString(), 'Laboratory']
      );
      await runAsync(
        'INSERT INTO Notifications (message, type, timestamp, department) VALUES (?, ?, ?, ?)',
        ['Compliance Notice: Monthly report audit is due for Emergency Department.', 'warning', now.toISOString(), 'Emergency']
      );
      await runAsync(
        'INSERT INTO Notifications (message, type, timestamp, department) VALUES (?, ?, ?, ?)',
        ['System update: AI model waste classification threshold updated to 85%.', 'info', now.toISOString(), null]
      );
      
      console.log('Database successfully seeded!');
    }

    // Seed Recycling Suggestions if empty
    const suggestionCount = await getAsync('SELECT COUNT(*) as count FROM recycling_suggestions');
    if (suggestionCount.count === 0) {
      console.log('Seeding recycling suggestions...');
      const recyclingData = [
        { name: 'Syringes', cat: 'Sharps Waste', bin: 'White', sug: 'Non-recyclable due to sharp risks. Autoclave and shred.', method: 'Incineration', score: 0.0 },
        { name: 'Gloves', cat: 'Infectious Waste', bin: 'Red', sug: 'Non-recyclable clinical gloves. Incinerate or autoclave.', method: 'Chemical Disinfection', score: 0.0 },
        { name: 'Masks', cat: 'General Waste', bin: 'Black', sug: 'General waste disposal. Safe for sanitary landfill.', method: 'Municipal Landfill', score: 0.2 },
        { name: 'Needles', cat: 'Sharps Waste', bin: 'White', sug: 'Critical danger. Contain in sharps boxes and concrete encapsulate.', method: 'Encapsulation', score: 0.0 },
        { name: 'Blood Bags', cat: 'Biohazard Waste', bin: 'Yellow', sug: 'Biohazard. Immediate high-temp incineration.', method: 'Incineration', score: 0.0 },
        { name: 'Plastic Bottles', cat: 'Recyclable Waste', bin: 'Blue', sug: 'Highly recyclable. Clean and ship to medical polymer pelletizer.', method: 'Polymer Shredding', score: 1.5 },
        { name: 'Biohazard Waste', cat: 'Biohazard Waste', bin: 'Yellow', sug: 'Highly infectious. Double bag and incinerate.', method: 'Incineration', score: 0.0 },
        { name: 'Sharps Waste', cat: 'Sharps Waste', bin: 'White', sug: 'Hazardous metals. Autoclave and securely landfill.', method: 'Incineration', score: 0.0 },
        { name: 'Pharmaceutical Waste', cat: 'Pharmaceutical Waste', bin: 'Yellow', sug: 'Toxic chemicals. Incinerate to prevent leaching.', method: 'Incineration', score: 0.0 }
      ];
      for (const item of recyclingData) {
        await runAsync(`
          INSERT OR IGNORE INTO recycling_suggestions (class_name, category, bin_color, suggestion, recycling_method, impact_score)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [item.name, item.cat, item.bin, item.sug, item.method, item.score]);
      }
    }

    // Seed Hazardous Alerts if empty
    const alertCount = await getAsync('SELECT COUNT(*) as count FROM hazardous_alerts');
    if (alertCount.count === 0) {
      console.log('Seeding hazardous alerts...');
      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await runAsync(`
        INSERT INTO hazardous_alerts (message, type, timestamp, department, threshold_value, current_value)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['Laboratory hazard threshold crossed: Cumulative waste exceeds 250kg.', 'critical', nowStr, 'Laboratory', 250.0, 278.2]);
      await runAsync(`
        INSERT INTO hazardous_alerts (message, type, timestamp, department, threshold_value, current_value)
        VALUES (?, ?, ?, ?, ?, ?)
      `, ['Operation Theater sharps frequency warning: Rapid increase in sharps detections.', 'warning', nowStr, 'Operation Theater', 5.0, 8.0]);
    }

  } catch (err) {
    console.error('Error seeding SQLite database:', err);
  }
}

export { db, runAsync, allAsync, getAsync };
export default db;
