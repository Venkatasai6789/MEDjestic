import React from 'react';
import { Users, ShieldAlert, Award, Calendar, Shield, Trash2 } from 'lucide-react';

const StaffTable = ({ title, icon: Icon, list, currentUser, onDeleteStaff }) => {
  if (list.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-semibold">
        No active {title.toLowerCase()} accounts registered in system.
      </div>
    );
  }

  const showActions = !!onDeleteStaff;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-colors duration-300">
      <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-blue-500" />
        {title} Roster ({list.length})
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase">
              <th className="pb-3">Name</th>
              <th className="pb-3">Email Address</th>
              <th className="pb-3">Assigned Role</th>
              <th className="pb-3">Department/Section</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Joined Date</th>
              {showActions && <th className="pb-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-medium text-slate-600 dark:text-slate-300">
            {list.map((person) => (
              <tr key={person.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <span className={`w-7 h-7 rounded-full font-extrabold flex items-center justify-center text-[10px] ${
                    person.role === 'Admin' 
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-650 dark:text-indigo-300' 
                      : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-300'
                  }`}>
                    {person.name.split(' ').map(n=>n[0]).join('')}
                  </span>
                  {person.name}
                </td>
                <td className="py-3.5 text-slate-500 dark:text-slate-400">{person.email}</td>
                <td className="py-3.5">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    person.role === 'Admin' 
                      ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-150 dark:border-indigo-900/50' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-300'
                  }`}>
                    {person.role}
                  </span>
                </td>
                <td className="py-3.5 text-slate-700 dark:text-slate-200 font-semibold">{person.department || 'N/A'}</td>
                <td className="py-3.5">
                  <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg flex items-center gap-1.5 w-fit">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {person.status}
                  </span>
                </td>
                <td className="py-3.5 text-slate-400 dark:text-slate-500 font-mono">
                  {person.createdAt ? person.createdAt.split(' ')[0] : '2026-05-01'}
                </td>
                {showActions && (
                  <td className="py-3.5 text-right">
                    {person.id !== currentUser?.id ? (
                      <button
                        onClick={() => onDeleteStaff(person.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
                        title={`Delete ${person.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded">
                        You
                      </span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StaffView = ({ staffList = [], currentUser, onDeleteStaff, isDarkMode }) => {
  const admins = staffList.filter(p => p.role === 'Admin');
  const clinicalStaff = staffList.filter(p => p.role !== 'Admin');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Logged Personnel</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white">{staffList.length} Active Officers</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Training Certifications</span>
            <span className="text-2xl font-black text-emerald-600">100% Verified</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Incident Logs</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white">0 Reported</span>
          </div>
        </div>
      </div>

      {/* System Administrators Roster */}
      <StaffTable 
        title="System Administrators" 
        icon={Shield} 
        list={admins} 
        currentUser={currentUser} 
        onDeleteStaff={onDeleteStaff} 
      />

      {/* Clinical Operations Roster */}
      <StaffTable 
        title="Clinical Operations" 
        icon={Users} 
        list={clinicalStaff} 
        currentUser={currentUser} 
        onDeleteStaff={onDeleteStaff} 
      />

    </div>
  );
};

export default StaffView;
