import React from 'react';
import { 
  LayoutDashboard, 
  ScanLine, 
  BarChart3, 
  HeartHandshake, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Stethoscope,
  Pencil
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, user, notifications = [], onLogout, onEditProfile, isDarkMode }) => {
  const alertsCount = notifications.filter(n => ['critical', 'warning'].includes(n.type) && !n.isRead).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'detection', label: 'Waste Detection', icon: ScanLine },
    { id: 'analytics', label: 'Department Analytics', icon: BarChart3, adminOnly: true },
    { id: 'recommendations', label: 'AI Recommendations', icon: HeartHandshake }, // staff can access
    { id: 'reports', label: 'Reports Audit', icon: FileText, adminOnly: true }, // admin only
    { id: 'staff', label: 'Staff Directory', icon: Users, adminOnly: true },
    { id: 'settings', label: 'System Settings', icon: Settings, adminOnly: true },
  ].filter(item => !item.adminOnly || user?.role?.toLowerCase() === 'admin');

  return (
    <aside className="w-72 bg-gradient-to-b from-blue-600 to-blue-800 dark:from-slate-900 dark:to-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 z-20 shadow-xl border-r border-blue-500/20 dark:border-slate-800 transition-colors duration-300">
      {/* Brand Header */}
      <div className="p-6 border-b border-blue-400/20 dark:border-slate-800 flex items-center gap-3">
        <div className="bg-white/10 dark:bg-slate-800 p-2.5 rounded-xl border border-white/20 dark:border-slate-700">
          <Stethoscope className="w-6 h-6 text-white dark:text-blue-400" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-wide font-sans">MEDjestic</h1>
          <span className="text-[10px] text-blue-100 dark:text-slate-400 uppercase tracking-widest font-semibold">Waste OS v2.1</span>
        </div>
      </div>

      {/* User Profile Header */}
      <div className="p-6 border-b border-blue-400/20 dark:border-slate-800 flex flex-col items-center text-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-white/30 dark:border-slate-700/50 overflow-hidden bg-blue-100 dark:bg-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300">
            <span className="text-2xl font-bold text-blue-700 dark:text-slate-200 font-sans">
              {user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'DS'}
            </span>
          </div>
          <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-blue-600 dark:border-slate-900 rounded-full shadow-md animate-pulse"></span>
        </div>
        <h2 className="mt-3 font-semibold text-lg leading-tight font-sans text-white dark:text-slate-200">{user?.name || 'Dr. Samuel'}</h2>
        <p className="text-xs text-blue-100/80 dark:text-slate-400 font-medium mt-0.5">{user?.role || 'Admin'} • {user?.department || 'Administration'}</p>
        <button 
          onClick={onEditProfile}
          className="mt-2.5 px-3 py-1 bg-white/10 hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700 border border-white/10 dark:border-slate-700 active:scale-95 transition-all text-[10px] font-bold text-blue-50 dark:text-slate-200 rounded-lg flex items-center gap-1 mx-auto cursor-pointer"
        >
          <Pencil className="w-2.5 h-2.5 text-blue-200 dark:text-slate-400" />
          Edit Profile
        </button>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm text-left group cursor-pointer ${
                isActive 
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-white shadow-md font-semibold scale-[1.02]' 
                  : 'text-blue-50 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-800/40 hover:text-white dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-blue-100 dark:text-slate-400 group-hover:scale-110'}`} />
              <span>{item.label}</span>
              {item.id === 'dashboard' && alertsCount > 0 && (
                <span className="ml-auto w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse shrink-0" title={`${alertsCount} Active Alerts`} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-blue-400/20 dark:border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-blue-100 dark:text-slate-400 hover:bg-red-500/20 hover:text-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-300 transition-all duration-300 text-sm font-medium text-left cursor-pointer"
        >
          <LogOut className="w-5 h-5 text-blue-200 dark:text-slate-400 group-hover:text-red-200" />
          <span>Logout System</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
