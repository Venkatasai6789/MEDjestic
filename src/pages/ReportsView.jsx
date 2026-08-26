import React, { useState } from 'react';
import { FileText, Download, CheckCircle, HelpCircle, FileSpreadsheet, Trash2 } from 'lucide-react';

const ReportsView = ({ stats, recentEntries = [], currentUser, onDeleteEntry, isDarkMode }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/reports/download', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hospital_Waste_Compliance_Report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Error downloading CSV file. Please make sure the backend is online.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Download Action Box */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-300">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/50 dark:border-blue-900/40">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Download Compliance Audit Sheets</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 leading-normal">Generate full raw CSV spreadsheet for external compliance reporting (WHO/OSHA).</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 no-print">
          <button 
            onClick={handleDownloadCSV}
            disabled={downloading}
            className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-655 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer border border-transparent dark:border-slate-700"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Compiling Log Sheets...' : 'Download CSV'}
          </button>
          <button 
            onClick={() => window.print()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Print PDF Compliance Report
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />
          <span>Report compiled and saved to downloads! Ready for EPA and healthcare auditor submission.</span>
        </div>
      )}

      {/* Reports Summary Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Weekly Stats overview */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft space-y-4 transition-colors duration-300">
          <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
            Monthly Audit Performance Targets
          </h4>

          <div className="space-y-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Monthly Recyclables Goal</span>
                <span className="text-blue-600 dark:text-blue-400">38.6% of 40%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: '96.5%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Incinerator Emission Compliance</span>
                <span className="text-emerald-600 dark:text-emerald-400">99.8% of 100%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.8%' }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Staff Segregation Training Rate</span>
                <span className="text-amber-500 dark:text-amber-400">88.5% of 95%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full" style={{ width: '93.1%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Audit guidelines warning */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col justify-between transition-colors duration-300">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              Environmental Impact Calculator
            </h4>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-normal">
              Every kilogram of plastic waste segregated and diverted from general incineration saves approximately **1.2 kg of CO2 emissions**. Puncture-proof boxes deep-buried sequester hazardous steel shapes safely.
            </p>
          </div>
          
          <div className="p-4 bg-blue-50/30 dark:bg-blue-955/10 border border-blue-100/50 dark:border-blue-900/30 rounded-xl mt-4 flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-blue-500 shrink-0" />
            <div className="text-[11px] leading-relaxed text-blue-600 dark:text-blue-400 font-medium">
              Need assistance? Ask **MEDjestic SmartBot** to write a report summary by typing: *"Show today's waste report summary"*.
            </div>
          </div>
        </div>

      </div>

      {/* Audit Log list */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-colors duration-300">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          Logged Segregations Audit Ledger
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase">
                <th className="pb-3">Timestamp</th>
                <th className="pb-3">Item Type</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Weight</th>
                <th className="pb-3">Department</th>
                <th className="pb-3">Officer Logged</th>
                <th className="pb-3 text-center">Audit ID</th>
                {currentUser?.role === 'Admin' && <th className="pb-3 text-center no-print">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-medium text-slate-650 dark:text-slate-300">
              {recentEntries.length === 0 ? (
                <tr>
                  <td colSpan={currentUser?.role === 'Admin' ? 8 : 7} className="py-8 text-center text-slate-455 dark:text-slate-500 font-semibold">
                    No entries in log database.
                  </td>
                </tr>
              ) : (
                recentEntries.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 font-mono text-slate-450 dark:text-slate-500">{row.timestamp}</td>
                    <td className="py-3 font-bold text-slate-700 dark:text-white">{row.type}</td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">{row.category}</td>
                    <td className="py-3 text-right font-mono font-bold text-slate-700 dark:text-white">{row.weight} kg</td>
                    <td className="py-3 text-slate-700 dark:text-slate-200 font-semibold">{row.department}</td>
                    <td className="py-3 text-slate-550 dark:text-slate-400">{row.staffName}</td>
                    <td className="py-3 text-center font-mono text-slate-400 dark:text-slate-500">#WST-00{row.id}</td>
                    {currentUser?.role === 'Admin' && (
                      <td className="py-3 text-center no-print">
                        <button
                          onClick={() => onDeleteEntry(row.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded transition-colors cursor-pointer"
                          title="Delete Waste Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Print Section */}
      <div className="hidden print:block print-section p-8 space-y-6">
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-section, .print-section * {
              visibility: visible;
            }
            .print-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-sans">MEDjestic Hospital Waste Management</h1>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Enterprise-Grade AI Detection & Analytics Platform</p>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold block">Compliance Report Audit</span>
            <span className="text-slate-500">Generated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border p-4 rounded-xl text-xs bg-slate-50/50">
          <div>
            <span className="text-slate-450 font-bold block">Total Waste Segmented:</span>
            <span className="text-sm font-extrabold text-slate-800">{stats?.kpis?.totalWaste || 2879.4} kg</span>
          </div>
          <div>
            <span className="text-slate-455 font-bold block">Recycling Sorting Rate:</span>
            <span className="text-sm font-extrabold text-slate-800">{stats?.kpis?.recyclableWaste || 1111.4} kg ({((stats?.kpis?.recyclableWaste / stats?.kpis?.totalWaste) * 100 || 38.6).toFixed(1)}%)</span>
          </div>
          <div>
            <span className="text-slate-455 font-bold block">AI Classification Accuracy:</span>
            <span className="text-sm font-extrabold text-slate-800">{stats?.kpis?.aiAccuracy || 94.2}%</span>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Logged Segregations Ledger</h3>
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-slate-400 font-bold uppercase">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Item Type</th>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Weight</th>
                <th className="pb-2">Department</th>
                <th className="pb-2">Officer</th>
                <th className="pb-2 text-center">Audit ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentEntries.map((row) => (
                <tr key={row.id}>
                  <td className="py-2 font-mono text-slate-500">{row.timestamp}</td>
                  <td className="py-2 font-bold text-slate-700">{row.type}</td>
                  <td className="py-2 text-slate-500">{row.category}</td>
                  <td className="py-2 text-right font-mono font-bold text-slate-700">{row.weight} kg</td>
                  <td className="py-2 text-slate-700 font-semibold">{row.department}</td>
                  <td className="py-2 text-slate-500">{row.staffName}</td>
                  <td className="py-2 text-center font-mono text-slate-400 font-bold">#WST-00{row.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t pt-4 text-center text-[9px] text-slate-400">
          This document is generated automatically by MEDjestic AI OS in compliance with WHO healthcare waste segregation protocols.
        </div>
      </div>

    </div>
  );
};

export default ReportsView;
