import React, { useState } from 'react';
import { Cpu, Sliders, Database } from 'lucide-react';

const SettingsView = ({ user, isDarkMode }) => {
  const [confidence, setConfidence] = useState(85);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [voiceAssist, setVoiceAssist] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetData = () => {
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* AI Controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft space-y-6 transition-colors duration-300">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-500" />
          AI Classification Parameters
        </h3>

        <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Detection Confidence Threshold</span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">{confidence}%</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="99" 
              value={confidence}
              onChange={(e) => setConfidence(e.target.value)}
              className="w-full h-1.5 bg-slate-150 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Predictions scoring lower than this threshold will be flagged as "Unclassified / General Waste" to prevent biohazard escapes.</p>
          </div>
        </div>
      </div>

      {/* Smart Alerts */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft space-y-6 transition-colors duration-300">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-500" />
          System Preferences
        </h3>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 block">Critical Overflow Audio Alarm</span>
              <span className="text-[10px] text-slate-455 dark:text-slate-400 mt-0.5">Triggers audible alarm if critical biohazard wastes fill above 75% capacity.</span>
            </div>
            <button 
              onClick={() => setSoundAlerts(!soundAlerts)}
              className={`w-12 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer ${soundAlerts ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${soundAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-4">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 block">Voice-Enabled SmartBot Guidance</span>
              <span className="text-[10px] text-slate-455 dark:text-slate-400 mt-0.5">Enables Text-To-Speech audio guidance for waste safety sorting.</span>
            </div>
            <button 
              onClick={() => setVoiceAssist(!voiceAssist)}
              className={`w-12 h-6 rounded-full p-1 transition-all duration-300 cursor-pointer ${voiceAssist ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${voiceAssist ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Security & Database seed controls */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft space-y-6 transition-colors duration-300">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-500" />
          Database Management
        </h3>

        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-200 block">Wipe Log Databases</span>
              <span className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5">Resets the active waste entries and notifications logs databases back to demo seeds.</span>
            </div>
            <button 
              onClick={handleResetData}
              className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold border border-rose-100 dark:border-rose-900/50 rounded-xl transition-all w-fit shrink-0 cursor-pointer"
            >
              Reset Logs Database
            </button>
          </div>

          {resetSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-medium animate-in fade-in duration-200">
              Database successfully purged and seeded! Recharts dashboards initialized.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default SettingsView;
