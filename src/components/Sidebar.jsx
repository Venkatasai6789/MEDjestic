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
  Pencil,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  user, 
  notifications = [], 
  onLogout, 
  onEditProfile, 
  isDarkMode,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const alertsCount = notifications.filter(n => ['critical', 'warning'].includes(n.type) && !n.isRead).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'detection', label: 'Waste Detection', icon: ScanLine },
    { id: 'analytics', label: 'Department Analytics', icon: BarChart3, adminOnly: true },
    { id: 'recommendations', label: 'AI Recommendations', icon: HeartHandshake },
    { id: 'reports', label: 'Reports Audit', icon: FileText, adminOnly: true },
    { id: 'staff', label: 'Staff Directory', icon: Users, adminOnly: true },
    { id: 'settings', label: 'System Settings', icon: Settings, adminOnly: true },
  ].filter(item => !item.adminOnly || user?.role?.toLowerCase() === 'admin');

  return (
    <aside 
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } bg-gradient-to-b from-blue-600 to-blue-800 dark:from-slate-900 dark:to-slate-950 text-white flex flex-col h-screen fixed left-0 top-0 z-30 shadow-xl border-r border-blue-500/20 dark:border-slate-800 transition-all duration-300 ease-in-out select-none`}
    >
      {/* Brand Header */}
      <div className={`p-3.5 border-b border-blue-400/20 dark:border-slate-800 flex ${
        isCollapsed ? 'flex-col items-center justify-center gap-2.5' : 'items-center justify-between'
      } min-h-[72px]`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div 
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expand Navigation Sidebar" : "MEDjestic Hospital OS"}
            className="bg-white/10 dark:bg-slate-800 p-2.5 rounded-xl border border-white/20 dark:border-slate-700 cursor-pointer hover:bg-white/20 transition-colors shrink-0"
          >
            <Stethoscope className="w-5 h-5 text-white dark:text-blue-400" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-200 truncate">
              <h1 className="font-bold text-lg tracking-wide font-sans leading-tight">MEDjestic</h1>
              <span className="text-[10px] text-blue-100 dark:text-slate-400 uppercase tracking-widest font-semibold block">Waste OS v2.1</span>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          type="button"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={`p-1.5 rounded-lg bg-white/10 hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700 text-blue-100 hover:text-white transition-all duration-200 cursor-pointer flex items-center justify-center ${
            isCollapsed ? 'w-8 h-8' : ''
          }`}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-white" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white" />
          )}
        </button>
      </div>

      {/* User Profile Header */}
      <div className={`border-b border-blue-400/20 dark:border-slate-800 flex flex-col items-center text-center transition-all duration-300 ${
        isCollapsed ? 'p-3' : 'p-5'
      }`}>
        <div className="relative">
          <div className={`${
            isCollapsed ? 'w-10 h-10' : 'w-16 h-16'
          } rounded-full border-2 border-white/30 dark:border-slate-700/50 overflow-hidden bg-blue-100 dark:bg-slate-800 flex items-center justify-center shadow-md transition-all duration-300`}>
            <span className={`${
              isCollapsed ? 'text-sm' : 'text-xl'
            } font-bold text-blue-700 dark:text-slate-200 font-sans`}>
              {user?.name ? user.name.split(' ').map(n=>n[0]).join('') : 'DS'}
            </span>
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-blue-600 dark:border-slate-900 rounded-full shadow-md animate-pulse"></span>
        </div>

        {!isCollapsed && (
          <div className="animate-in fade-in duration-200 mt-2.5 w-full">
            <h2 className="font-semibold text-base leading-tight font-sans text-white dark:text-slate-200 truncate">{user?.name || 'Dr. Samuel'}</h2>
            <p className="text-xs text-blue-100/80 dark:text-slate-400 font-medium mt-0.5 truncate">{user?.role || 'Admin'} • {user?.department || 'Administration'}</p>
            <button 
              onClick={onEditProfile}
              type="button"
              className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700 border border-white/10 dark:border-slate-700 active:scale-95 transition-all text-[10px] font-bold text-blue-50 dark:text-slate-200 rounded-lg flex items-center gap-1 mx-auto cursor-pointer"
            >
              <Pencil className="w-2.5 h-2.5 text-blue-200 dark:text-slate-400" />
              Edit Profile
            </button>
          </div>
        )}
      </div>

      {/* Nav Menu */}
      <nav className={`flex-1 overflow-y-auto space-y-1.5 transition-all duration-300 ${
        isCollapsed ? 'px-2 py-4' : 'px-3.5 py-5'
      }`}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              type="button"
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3.5 py-2.5'
              } rounded-xl transition-all duration-200 font-medium text-sm text-left group cursor-pointer relative ${
                isActive 
                  ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-white shadow-md font-semibold' 
                  : 'text-blue-50 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-slate-800/40 hover:text-white dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 shrink-0 ${
                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-blue-100 dark:text-slate-400 group-hover:scale-110'
              }`} />
              
              {!isCollapsed && (
                <span className="truncate flex-1 animate-in fade-in duration-150">{item.label}</span>
              )}

              {item.id === 'dashboard' && alertsCount > 0 && (
                <span 
                  className={`${
                    isCollapsed 
                      ? 'absolute top-2 right-2 w-2.5 h-2.5' 
                      : 'ml-auto w-2.5 h-2.5'
                  } rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse shrink-0`} 
                  title={`${alertsCount} Active Alerts`} 
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className={`border-t border-blue-400/20 dark:border-slate-800 transition-all duration-300 ${
        isCollapsed ? 'p-2' : 'p-3.5'
      }`}>
        <button
          onClick={onLogout}
          type="button"
          title={isCollapsed ? "Logout System" : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center p-3' : 'gap-3 px-3.5 py-3'
          } rounded-xl text-blue-100 dark:text-slate-400 hover:bg-red-500/20 hover:text-red-200 dark:hover:bg-red-950/20 dark:hover:text-red-300 transition-all duration-200 text-sm font-medium text-left cursor-pointer`}
        >
          <LogOut className="w-5 h-5 text-blue-200 dark:text-slate-400 group-hover:text-red-200 shrink-0" />
          {!isCollapsed && (
            <span className="truncate animate-in fade-in duration-150">Logout System</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
