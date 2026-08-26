import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  Building, 
  AlertTriangle, 
  Leaf, 
  Users, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';

const AnalyticsView = ({ departmentData = [], isDarkMode }) => {
  // Sort departments by total waste
  const sortedDepts = [...departmentData].sort((a, b) => b.total - a.total);
  
  // Calculate aggregate metrics
  const totalWeightAll = departmentData.reduce((sum, d) => sum + d.total, 0);
  const totalHazardousAll = departmentData.reduce((sum, d) => sum + d.hazardous, 0);
  const totalCarbonAll = departmentData.reduce((sum, d) => sum + d.carbon, 0);
  const totalAlertsAll = departmentData.reduce((sum, d) => sum + d.alerts, 0);

  // Find most hazardous department
  const mostHazardousDept = sortedDepts[0]?.name || 'Operation Theater';

  const tooltipBg = isDarkMode ? '#1e293b' : '#fff';
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipText = isDarkMode ? '#fff' : '#000';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Aggregates Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Audited Areas</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white">{departmentData.length} Departments</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Active Section Alerts</span>
            <span className={`text-2xl font-black ${totalAlertsAll > 0 ? 'text-rose-600 dark:text-rose-450' : 'text-slate-800 dark:text-slate-200'}`}>
              {totalAlertsAll} pending
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 flex items-center justify-center shrink-0">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Carbon Emissions Offset</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450">{totalCarbonAll.toFixed(1)} Kg CO2</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center gap-4 transition-colors duration-300">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Highest Producer</span>
            <span className="text-lg font-black text-slate-800 dark:text-white truncate block max-w-[140px]">{mostHazardousDept}</span>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-colors duration-300">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-sm">Department Waste Generation Comparison</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Total vs. Hazardous weight output (Kg)</p>
        </div>

        <div className="h-80 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#f1f5f9'} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} formatter={(value) => `${value} kg`} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
              <Bar dataKey="total" name="Total Waste" fill="#0e94eb" radius={[6, 6, 0, 0]} barSize={24} />
              <Bar dataKey="hazardous" name="Hazardous Waste" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of details for each department */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-colors duration-300">
        <h3 className="font-bold text-slate-800 dark:text-white text-sm border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          Detailed Department Performance Metrics
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase">
                <th className="pb-3">Department Name</th>
                <th className="pb-3 text-center">Active Bins Alerts</th>
                <th className="pb-3 text-right">Total Waste (kg)</th>
                <th className="pb-3 text-right">Hazardous Load (kg)</th>
                <th className="pb-3 text-right">Carbon Footprint</th>
                <th className="pb-3 text-center">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-medium text-slate-600 dark:text-slate-300">
              {sortedDepts.map((dept, idx) => {
                const hazardousPercent = dept.total > 0 ? (dept.hazardous / dept.total) * 100 : 0;
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-3.5 font-bold text-slate-700 dark:text-white">{dept.name}</td>
                    <td className="py-3.5 text-center">
                      {dept.alerts > 0 ? (
                        <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 font-bold rounded-lg flex items-center gap-1.5 w-fit mx-auto animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          {dept.alerts} Alert{dept.alerts > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-lg flex items-center gap-1.5 w-fit mx-auto">
                          <ShieldCheck className="w-3 h-3" />
                          Compliant
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-slate-700 dark:text-slate-200">{dept.total.toFixed(1)} kg</td>
                    <td className="py-3.5 text-right font-mono">
                      <span className="text-slate-500 dark:text-slate-400">{dept.hazardous.toFixed(1)} kg</span>
                      <span className="text-[10px] text-rose-450 dark:text-rose-400 ml-1.5 font-semibold">
                        ({hazardousPercent.toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-mono text-emerald-600 dark:text-emerald-450">+{dept.carbon.toFixed(1)} kg CO2</td>
                    <td className="py-3.5 text-center">
                      <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto">
                        <div 
                          className={`h-full rounded-full ${
                            hazardousPercent > 50 ? 'bg-rose-500' :
                            hazardousPercent > 30 ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${100 - Math.min(100, hazardousPercent)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
