import React, { useState, useEffect } from 'react';
import { Bell, Calendar, CheckSquare, ShieldAlert, Sun, Moon } from 'lucide-react';

const Navbar = ({ pageTitle, notifications = [], onClearNotifications, isDarkMode, onToggleTheme }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [time, setTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm transition-colors duration-300">
      {/* Page Title & Navigation Info */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-sans tracking-tight capitalize">{pageTitle}</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Smart Medical Waste OS / Workspace</p>
      </div>

      {/* Quick Action Widgets */}
      <div className="flex items-center gap-6">
        {/* Live Date Time Display */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 text-slate-650 dark:text-slate-300 text-xs font-semibold transition-colors">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>
            {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all hover:scale-105 duration-200 cursor-pointer"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-650" />}
        </button>

        {/* Notifications Icon & Popover */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative hover:scale-105 duration-200 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Drawer */}
          {showDropdown && (
            <>
              {/* Overlay background to click out */}
              <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)} />
              
              <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-150 dark:border-slate-800 py-3 z-30 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5 font-sans">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    Security & Hazard Alerts
                  </h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => {
                        onClearNotifications();
                        setShowDropdown(false);
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      Clear all
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto mt-2">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-455 dark:text-slate-500 text-xs font-medium">
                      No notifications or warnings logged.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`px-4 py-3 border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors flex gap-3 ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-950/20' : ''}`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'critical' ? 'bg-rose-500' :
                          n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1">
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
