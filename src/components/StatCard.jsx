import React from 'react';

const StatCard = ({ label, value, subtext, icon: Icon, color = 'blue' }) => {
  const colorMaps = {
    blue: {
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-450/10',
      border: 'hover:border-blue-300 dark:hover:border-blue-800'
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-450/10',
      border: 'hover:border-emerald-300 dark:hover:border-emerald-800'
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 dark:bg-rose-450/10',
      border: 'hover:border-rose-300 dark:hover:border-rose-800'
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:bg-amber-450/10',
      border: 'hover:border-amber-300 dark:hover:border-amber-800'
    },
    indigo: {
      iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 dark:bg-indigo-450/10',
      border: 'hover:border-indigo-300 dark:hover:border-indigo-800'
    }
  };

  const theme = colorMaps[color] || colorMaps.blue;

  return (
    <div className={`p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-all duration-300 hover:shadow-med hover:-translate-y-1 ${theme.border} flex justify-between items-center group`}>
      <div className="space-y-2">
        <span className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider block">{label}</span>
        <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white font-sans tracking-tight leading-none group-hover:scale-[1.01] transition-transform duration-300">
          {value}
        </h3>
        <p className="text-[11px] font-semibold text-slate-455 dark:text-slate-500 flex items-center gap-1">
          {subtext}
        </p>
      </div>

      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:rotate-6 ${theme.iconBg}`}>
        <Icon className="w-7 h-7" />
      </div>
    </div>
  );
};

export default StatCard;
