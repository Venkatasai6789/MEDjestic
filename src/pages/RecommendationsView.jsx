import React, { useState } from 'react';
import { Search, HeartHandshake } from 'lucide-react';

const RecommendationsView = ({ recommendations = {}, isDarkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtering recommendations based on search
  const filteredRecs = Object.entries(recommendations).filter(([key, value]) => {
    return key.toLowerCase().includes(searchQuery.toLowerCase()) || 
           value.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
           value.colorBin.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getRiskStyles = (risk) => {
    switch (risk) {
      case 'Critical':
        return 'bg-rose-100 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/50';
      case 'High':
        return 'bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400 border-orange-200 dark:border-orange-900/50';
      case 'Medium':
        return 'bg-amber-100 dark:bg-amber-950/30 text-amber-850 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-750 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getBinStyles = (bin) => {
    const text = bin.toLowerCase();
    if (text.includes('yellow')) return { dot: 'bg-yellow-400', border: 'border-yellow-200 dark:border-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20' };
    if (text.includes('red')) return { dot: 'bg-rose-500', border: 'border-rose-200 dark:border-rose-900/40', text: 'text-rose-800 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20' };
    if (text.includes('blue')) return { dot: 'bg-blue-500', border: 'border-blue-200 dark:border-blue-900/40', text: 'text-blue-800 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20' };
    return { dot: 'bg-slate-800 dark:bg-slate-200', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40' };
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Search Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-300">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2 font-sans">
            <HeartHandshake className="w-5 h-5 text-blue-500" />
            AI Disposal & Recycling Protocols
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Healthcare waste sorting reference manual</p>
        </div>

        <div className="relative w-full md:w-80">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search syringe, gloves, red bin..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-750 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Safety bins overview keys card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex gap-4 transition-colors duration-300">
          <span className="w-12 h-12 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-600 dark:text-yellow-400 font-bold text-sm shrink-0 border border-yellow-200/50 dark:border-yellow-900/30">
            Y
          </span>
          <div className="text-xs">
            <h4 className="font-bold text-slate-800 dark:text-white">Yellow Bin Category</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-1 leading-normal">For infectious biohazard products, body fluids, blood bags, expired pharmaceuticals, and sharp metal objects.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex gap-4 transition-colors duration-300">
          <span className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-450 font-bold text-sm shrink-0 border border-rose-200/50 dark:border-rose-900/30">
            R
          </span>
          <div className="text-xs">
            <h4 className="font-bold text-slate-800 dark:text-white">Red Bin Category</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-1 leading-normal">For heavily contaminated plastic IV tubes, syringes without needles, surgical gloves, and laboratory liquid reagents.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex gap-4 transition-colors duration-300">
          <span className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0 border border-blue-200/50 dark:border-blue-900/30">
            B
          </span>
          <div className="text-xs">
            <h4 className="font-bold text-slate-800 dark:text-white">Blue/Black Category</h4>
            <p className="text-slate-500 dark:text-slate-400 mt-1 leading-normal">Blue for non-contaminated glass/recyclable medical vials. Black for municipal waste, general PPE masks, paper bags, or food.</p>
          </div>
        </div>
      </div>

      {/* Main Database Table */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-colors duration-300">
        <div className="overflow-x-auto">
          {filteredRecs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-semibold">
              No matching disposal protocol found for "{searchQuery}".
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase">
                  <th className="pb-3 w-40">Waste Type</th>
                  <th className="pb-3 text-center w-28">Risk Profile</th>
                  <th className="pb-3 text-center w-36">Sorting Bin</th>
                  <th className="pb-3 text-center w-24">Recyclable</th>
                  <th className="pb-3">Action Required</th>
                  <th className="pb-3">Containment Precaution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-medium text-slate-650 dark:text-slate-300">
                {filteredRecs.map(([type, meta]) => {
                  const binKey = getBinStyles(meta.colorBin);
                  
                  return (
                    <tr key={type} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 font-bold text-slate-700 dark:text-white">{type}</td>
                      <td className="py-4 text-center">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getRiskStyles(meta.riskLevel)}`}>
                          {meta.riskLevel}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg border ${binKey.border} ${binKey.text} inline-flex items-center gap-1.5`}>
                          <span className={`w-2 h-2 rounded-full ${binKey.dot}`} />
                          {meta.colorBin}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`font-bold ${meta.recyclingPossibility.startsWith('Yes') ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {meta.recyclingPossibility}
                        </span>
                      </td>
                      <td className="py-4 pr-4 leading-normal text-slate-700 dark:text-slate-200">{meta.disposalMethod}</td>
                      <td className="py-4 text-slate-500 dark:text-slate-400 font-normal leading-normal text-[11px] max-w-xs">{meta.safetyPrecautions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default RecommendationsView;
