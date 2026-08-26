import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoginView from './pages/LoginView';
import DashboardView from './pages/DashboardView';
import CameraScanner from './components/CameraScanner';
import AnalyticsView from './pages/AnalyticsView';
import RecommendationsView from './pages/RecommendationsView';
import ReportsView from './pages/ReportsView';
import StaffView from './pages/StaffView';
import SettingsView from './pages/SettingsView';
import WasteChatbot from './components/WasteChatbot';

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [stats, setStats] = useState(null);
  const [entries, setEntries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recommendations, setRecommendations] = useState({});
  const [staff, setStaff] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Profile Edit Modal States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('ICU');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Floating Chatbot State
  const [chatbotFloatingOpen, setChatbotFloatingOpen] = useState(false);

  const handleOpenEditProfile = () => {
    if (!user) return;
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditDepartment(user.department || 'ICU');
    setEditError('');
    setEditSaving(false);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      setEditError('Name and email are required');
      return;
    }
    setEditSaving(true);
    setEditError('');

    try {
      const token = localStorage.getItem('token');
      if (token === 'offline_mock_token') {
        setUser(prev => ({
          ...prev,
          name: editName,
          email: editEmail,
          department: editDepartment
        }));
        setShowEditProfileModal(false);
        setEditSaving(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          department: editDepartment
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setShowEditProfileModal(false);
      refreshAllData();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this staff profile?");
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    if (token === 'offline_mock_token') {
      setStaff(prev => prev.filter(s => s.id !== staffId));
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/staff/${staffId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete staff profile');
      }
      refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this waste entry from the audit records?");
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    if (token === 'offline_mock_token') {
      setEntries(prev => prev.filter(e => e.id !== entryId));
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/waste/${entryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete waste entry');
      }
      refreshAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Check login on startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch data on login, active updates, or tab switching, and poll alerts
  useEffect(() => {
    if (user) {
      refreshAllData();
      
      // Setup real-time alerts polling interval
      const interval = setInterval(() => {
        refreshAllData();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [user, activeTab]);

  const fetchUser = async (token) => {
    try {
      if (token === 'offline_mock_token') {
        setUser({ name: 'Dr. Samuel', email: 'admin@medjestic.com', role: 'Admin', department: 'Administration' });
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Token expired');
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.warn("Auth token verification failed, logging out.");
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setActiveTab('dashboard');
  };

  const refreshAllData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // 1. Fetch Stats
      const statsRes = await fetch('http://localhost:5000/api/waste/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Logs
      const logsRes = await fetch('http://localhost:5000/api/waste', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setEntries(logsData);
      }

      // 3. Fetch Notifications
      const notifRes = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(notifData);
      }

      // 4. Fetch Recommendations (both Admin and Staff)
      const recRes = await fetch('http://localhost:5000/api/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecommendations(recData);
      }

      // Fetch Staff and Departments (Admin only)
      if (user?.role?.toLowerCase() === 'admin') {
        const staffRes = await fetch('http://localhost:5000/api/staff', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaff(staffData);
        }

        const deptRes = await fetch('http://localhost:5000/api/departments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          const mappedDepts = deptData.map(d => ({
            name: d.name,
            code: d.code,
            total: d.totalWaste,
            hazardous: d.hazardousWaste,
            carbon: d.carbonImpact,
            alerts: d.activeAlerts
          }));
          setDepartments(mappedDepts);
        }
      }

    } catch (err) {
      console.warn("Backend API not reachable. Seeding mock local states in browser memory.");
      seedOfflineMockData();
    }
  };

  // Seed detailed mock local data in browser memory if Node backend port 5000 is stopped
  const seedOfflineMockData = () => {
    // Stats mock
    setStats({
      kpis: { totalWaste: 2879.4, recyclableWaste: 1111.4, hazardousWaste: 1212.2, aiAccuracy: 94.2, activeDepartments: 8, dailyCount: 15 },
      cleaningEfficiency: { cleanedOnTime: 63, cleanedLate: 21, notCleaned: 16 },
      confusionMatrix: [
        { actual: 'Biomedical', predictedBiomedical: 94, predictedInfectious: 4, predictedPlastic: 1, predictedSharps: 1, predictedOther: 0 },
        { actual: 'Infectious', predictedBiomedical: 3, predictedInfectious: 92, predictedPlastic: 2, predictedSharps: 1, predictedOther: 2 },
        { actual: 'Plastic', predictedBiomedical: 0, predictedInfectious: 2, predictedPlastic: 96, predictedSharps: 0, predictedOther: 2 },
        { actual: 'Sharps', predictedBiomedical: 2, predictedInfectious: 2, predictedPlastic: 0, predictedSharps: 95, predictedOther: 1 },
        { actual: 'General', predictedBiomedical: 1, predictedInfectious: 3, predictedPlastic: 2, predictedSharps: 0, predictedOther: 94 }
      ],
      trends: [
        { date: 'Mon', waste: 12.5, count: 6, confidence: 93 },
        { date: 'Tue', waste: 14.2, count: 8, confidence: 95 },
        { date: 'Wed', waste: 9.8, count: 5, confidence: 91 },
        { date: 'Thu', waste: 18.4, count: 9, confidence: 94 },
        { date: 'Fri', waste: 11.2, count: 7, confidence: 92 },
        { date: 'Sat', waste: 8.5, count: 4, confidence: 96 },
        { date: 'Sun', waste: 15.6, count: 8, confidence: 95 }
      ]
    });

    // Logs mock
    setEntries([
      { id: 1, type: 'Gloves', category: 'Infectious Waste', confidence: 0.92, riskLevel: 'Medium', disposalMethod: 'Chemical Disinfection & Incineration', colorBin: 'Red Category', weight: 0.18, department: 'Emergency', timestamp: '2026-05-27 12:45:00', staffName: 'Nurse Sarah' },
      { id: 2, type: 'Syringes', category: 'Sharps Waste', confidence: 0.95, riskLevel: 'High', disposalMethod: 'Autoclaving & Shredding', colorBin: 'Yellow Category', weight: 0.08, department: 'ICU', timestamp: '2026-05-27 12:30:00', staffName: 'Dr. Samuel' },
      { id: 3, type: 'Body Tissue or Organ', category: 'Biohazard Waste', confidence: 0.94, riskLevel: 'Critical', disposalMethod: 'High-temp Incineration', colorBin: 'Yellow Category', weight: 0.65, department: 'Operation Theater', timestamp: '2026-05-27 12:10:00', staffName: 'Nurse Sarah' },
      { id: 4, type: 'Plastic Equipment', category: 'Recyclable Waste', confidence: 0.91, riskLevel: 'Low', disposalMethod: 'Decontaminate then Shredding & Polymer Recycling', colorBin: 'Blue Category', weight: 0.12, department: 'Radiology', timestamp: '2026-05-27 11:45:00', staffName: 'Nurse Sarah' },
      { id: 5, type: 'Masks', category: 'General Waste', confidence: 0.89, riskLevel: 'Low', disposalMethod: 'Municipal Landfill', colorBin: 'Black Category', weight: 0.04, department: 'General Ward', timestamp: '2026-05-27 11:15:00', staffName: 'Anny Farisha' },
      { id: 6, type: 'Syringe Needles', category: 'Sharps Waste', confidence: 0.96, riskLevel: 'Critical', disposalMethod: 'Puncture-proof containment followed by Encapsulation', colorBin: 'Yellow Category', weight: 0.02, department: 'ICU', timestamp: '2026-05-27 10:30:00', staffName: 'Dr. Samuel' },
      { id: 7, type: 'Gauze', category: 'Biohazard Waste', confidence: 0.93, riskLevel: 'Critical', disposalMethod: 'Autoclaving & Incineration', colorBin: 'Yellow Category', weight: 1.20, department: 'Laboratory', timestamp: '2026-05-27 09:15:00', staffName: 'Lab Tech David' }
    ]);

    // Alerts mock
    setNotifications([
      { id: 1, message: 'Hazardous Waste alert: Chemical waste overflow detected in Laboratory bin.', type: 'critical', timestamp: new Date().toISOString(), isRead: 0, department: 'Laboratory' },
      { id: 2, message: 'Compliance Notice: Monthly report audit is due for Emergency Department.', type: 'warning', timestamp: new Date().toISOString(), isRead: 0, department: 'Emergency' },
      { id: 3, message: 'System update: AI model waste classification threshold updated to 85%.', type: 'info', timestamp: new Date().toISOString(), isRead: 0, department: null }
    ]);

    // Recommendations mock
    setRecommendations({
      'Body Tissue or Organ': { category: 'Biohazard Waste', riskLevel: 'Critical', recyclingPossibility: 'No', disposalMethod: 'High-Temperature Incineration', colorBin: 'Yellow Category', environmentalImpact: 'Severe pathogenic and viral outbreak risk if improperly contained.', safetyPrecautions: 'Double bag in yellow biohazard bags. Incinerate immediately.' },
      'Glass Equipment': { category: 'Sharps Waste', riskLevel: 'High', recyclingPossibility: 'Partial (Material recycling after sterilization)', disposalMethod: 'Secure Containment & Landfill / Recycling', colorBin: 'Yellow Category', environmentalImpact: 'Laceration and infection risk from broken glass edges.', safetyPrecautions: 'Place in rigid puncture-resistant containers. Label clearly.' },
      'Metal Equipment': { category: 'Sharps Waste', riskLevel: 'High', recyclingPossibility: 'Partial (Sterilized scrap recycling)', disposalMethod: 'Secure Containment followed by Autoclaving', colorBin: 'Yellow Category', environmentalImpact: 'Lacerations and bloodborne pathogen cross-infection risk.', safetyPrecautions: 'Place in puncture-proof metal sharps bins. Seal when 75% full.' },
      'Plastic Equipment': { category: 'Recyclable Waste', riskLevel: 'Low', recyclingPossibility: 'Yes (Highly recyclable after sanitation)', disposalMethod: 'Decontaminate then Shredding & Polymer Recycling', colorBin: 'Blue Category', environmentalImpact: 'Diverts plastics from landfills; saves oil raw materials.', safetyPrecautions: 'Ensure no body fluids are inside. Sanitize before sorting.' },
      'Paper Equipment': { category: 'Biohazard Waste', riskLevel: 'Medium', recyclingPossibility: 'No', disposalMethod: 'Secure Incineration', colorBin: 'Yellow Category', environmentalImpact: 'Carries absorbed pharmaceutical or biological agents.', safetyPrecautions: 'Bag in yellow containers. Do not mix with municipal waste.' },
      'Syringe Needles': { category: 'Sharps Waste', riskLevel: 'Critical', recyclingPossibility: 'No', disposalMethod: 'Puncture-proof containment followed by Encapsulation', colorBin: 'Yellow Category', environmentalImpact: 'Extreme sharp injury and disease transmission risk.', safetyPrecautions: 'Dispose in rigid sharps boxes. Never recap.' },
      'Gauze': { category: 'Biohazard Waste', riskLevel: 'Critical', recyclingPossibility: 'No', disposalMethod: 'Autoclaving & Incineration', colorBin: 'Yellow Category', environmentalImpact: 'High infection risk from absorbed body fluids and pathogens.', safetyPrecautions: 'Seal in yellow biohazard bags immediately after use.' },
      'Gloves': { category: 'Infectious Waste', riskLevel: 'Medium', recyclingPossibility: 'No', disposalMethod: 'Chemical Disinfection & Incineration', colorBin: 'Red Category', environmentalImpact: 'Biohazard pathogen release risk if improperly bagged.', safetyPrecautions: 'Wear standard surgical PPE. Dispose immediately at point of use.' },
      'Masks': { category: 'General Waste', riskLevel: 'Low', recyclingPossibility: 'Partial', disposalMethod: 'Municipal sanitary Landfill', colorBin: 'Black Category', environmentalImpact: 'Methane emission and plastic polymer breakdown in landfill.', safetyPrecautions: 'Sanitize hands after disposal. Do not mix with biomedical bins.' },
      'Syringes': { category: 'Sharps Waste', riskLevel: 'High', recyclingPossibility: 'No', disposalMethod: 'Autoclaving & Shredding', colorBin: 'Yellow Category', environmentalImpact: 'High risk of needle stick injuries.', safetyPrecautions: 'Dispose in puncture-proof containers.' },
      'Tweezers': { category: 'Sharps Waste', riskLevel: 'Medium', recyclingPossibility: 'Partial', disposalMethod: 'Autoclaving & Secure Burial', colorBin: 'Yellow Category', environmentalImpact: 'Scratch and laceration risk. Potential pathogen vector.', safetyPrecautions: 'Sterilize in autoclave. Use rigid sharps containers.' }
    });

    // Staff mock
    setStaff([
      { id: 1, name: 'Dr. Samuel', email: 'admin@medjestic.com', role: 'Admin', department: 'Administration', status: 'Active', createdAt: '2026-05-01' },
      { id: 2, name: 'Anny Farisha', email: 'staff@medjestic.com', role: 'Staff', department: 'ICU', status: 'Active', createdAt: '2026-05-02' },
      { id: 3, name: 'Nurse Sarah', email: 'sarah@medjestic.com', role: 'Staff', department: 'Emergency', status: 'Active', createdAt: '2026-05-03' },
      { id: 4, name: 'Lab Tech David', email: 'david@medjestic.com', role: 'Staff', department: 'Laboratory', status: 'Active', createdAt: '2026-05-04' }
    ]);

    // Departments mock
    setDepartments([
      { name: 'ICU', code: 'ICU-01', totalWaste: 345.5, hazardousWaste: 120.2, carbonImpact: 85.0, activeAlerts: 0 },
      { name: 'Emergency', code: 'ER-02', totalWaste: 412.3, hazardousWaste: 189.5, carbonImpact: 104.2, activeAlerts: 1 },
      { name: 'Radiology', code: 'RAD-03', totalWaste: 98.4, hazardousWaste: 45.1, carbonImpact: 22.0, activeAlerts: 0 },
      { name: 'Operation Theater', code: 'OT-04', totalWaste: 689.8, hazardousWaste: 412.0, carbonImpact: 195.4, activeAlerts: 0 },
      { name: 'Laboratory', code: 'LAB-05', totalWaste: 278.2, hazardousWaste: 182.7, carbonImpact: 70.8, activeAlerts: 2 },
      { name: 'Pharmacy', code: 'PHAR-06', totalWaste: 154.6, hazardousWaste: 88.3, carbonImpact: 41.2, activeAlerts: 0 },
      { name: 'General Ward', code: 'WARD-07', totalWaste: 390.1, hazardousWaste: 42.5, carbonImpact: 76.5, activeAlerts: 0 },
      { name: 'Dental Department', code: 'DEN-08', totalWaste: 112.5, hazardousWaste: 61.2, carbonImpact: 28.0, activeAlerts: 0 }
    ].map(d => ({
      name: d.name,
      total: d.totalWaste,
      hazardous: d.hazardousWaste,
      carbon: d.carbonImpact,
      alerts: d.activeAlerts
    })));
  };

  const handleClearNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      refreshAllData();
    } catch (err) {
      // local fallback clear
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
      setDepartments(prev => prev.map(d => ({ ...n, alerts: 0 })));
    }
  };

  const renderActiveView = () => {
    const isStaff = user?.role?.toLowerCase() === 'staff';
    
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            stats={stats} 
            recentEntries={entries} 
            notifications={notifications}
            onRefresh={refreshAllData}
            onOpenScanner={() => setActiveTab('detection')}
            isDarkMode={isDarkMode}
          />
        );
      case 'detection':
        return (
          <CameraScanner 
            onWasteLogged={refreshAllData} 
            user={user} 
            isDarkMode={isDarkMode}
          />
        );
      case 'analytics':
        if (isStaff) return <DashboardView stats={stats} recentEntries={entries} isDarkMode={isDarkMode} />;
        return <AnalyticsView departmentData={departments} isDarkMode={isDarkMode} />;
      case 'recommendations':
        // Staff CAN view recommendations
        return <RecommendationsView recommendations={recommendations} isDarkMode={isDarkMode} />;
      case 'reports':
        // Staff CANNOT view reports audit
        if (isStaff) return <DashboardView stats={stats} recentEntries={entries} isDarkMode={isDarkMode} />;
        return <ReportsView stats={stats} recentEntries={entries} currentUser={user} onDeleteEntry={handleDeleteEntry} isDarkMode={isDarkMode} />;
      case 'staff':
        if (isStaff) return <DashboardView stats={stats} recentEntries={entries} isDarkMode={isDarkMode} />;
        return <StaffView staffList={staff} currentUser={user} onDeleteStaff={handleDeleteStaff} isDarkMode={isDarkMode} />;
      case 'settings':
        if (isStaff) return <DashboardView stats={stats} recentEntries={entries} isDarkMode={isDarkMode} />;
        return <SettingsView user={user} isDarkMode={isDarkMode} />;
      default:
        return <DashboardView stats={stats} recentEntries={entries} isDarkMode={isDarkMode} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500 text-xs font-semibold">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading MEDjestic Waste OS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-300">
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        notifications={notifications}
        onLogout={handleLogout} 
        onEditProfile={handleOpenEditProfile}
        isDarkMode={isDarkMode}
      />

      {/* Main Body */}
      <div className="flex-1 ml-72 flex flex-col min-h-screen">
        <Navbar 
          pageTitle={activeTab} 
          notifications={notifications} 
          onClearNotifications={handleClearNotifications} 
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(prev => !prev)}
        />
        
        <main className="flex-1 p-8 overflow-y-auto max-w-[1600px] mx-auto w-full">
          {renderActiveView()}
        </main>
      </div>

      {/* Floating Chatbot Bubble */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {chatbotFloatingOpen && (
          <div className="w-[420px] shadow-2xl mb-4 rounded-3xl overflow-hidden border border-slate-200/80 animate-in fade-in slide-in-from-bottom-5 duration-300">
            <WasteChatbot 
              setActiveTab={setActiveTab} 
              onClearNotifications={handleClearNotifications}
              stats={stats}
              user={user}
            />
          </div>
        )}
        <button
          onClick={() => setChatbotFloatingOpen(!chatbotFloatingOpen)}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all duration-350 cursor-pointer select-none border border-white/10 hover:shadow-xl"
          title="Open AI Waste Assistant"
        >
          {chatbotFloatingOpen ? (
            <span className="text-xl font-bold font-sans">✕</span>
          ) : (
            <Bot className="w-7 h-7" />
          )}
        </button>
      </div>

      {/* Profile Edit Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-250">
            <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-150 dark:border-slate-800 pb-3 mb-4">Edit Profile Settings</h3>
            
            {editError && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold text-center">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Full Name</label>
                <input 
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Email Address</label>
                <input 
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Assigned Department</label>
                <select 
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 appearance-none font-sans"
                >
                  {['ICU', 'Emergency', 'Radiology', 'Operation Theater', 'Laboratory', 'Pharmacy', 'General Ward', 'Dental Department'].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-650 dark:text-slate-300 font-bold rounded-xl text-xs active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs active:scale-95 transition-all flex items-center justify-center gap-1 shadow-md shadow-blue-500/10"
                >
                  {editSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
