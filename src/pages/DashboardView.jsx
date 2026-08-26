import React from 'react';
import { 
  Trash2, 
  Recycle, 
  AlertOctagon, 
  Cpu, 
  Boxes, 
  Building,
  RefreshCw,
  Plus
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import StatCard from '../components/StatCard';

const COLORS = ['#0e94eb', '#38aef9', '#a5f3fc', '#1565c0', '#06b6d4', '#e11d48', '#f59e0b', '#64748b'];
const RISK_COLORS = {
  Low: '#64748b',
  Medium: '#f59e0b',
  High: '#f43f5e',
  Critical: '#9f1239'
};

const DashboardView = ({ stats, recentEntries = [], onRefresh, onOpenScanner, isDarkMode }) => {
  const kpis = stats?.kpis || {
    totalWaste: 2879.4,
    recyclableWaste: 1111.4,
    hazardousWaste: 1212.2,
    aiAccuracy: 94.2,
    activeDepartments: 8,
    dailyCount: 15,
    precision: 93.8,
    recall: 92.4,
    f1: 93.1
  };

  // Convert cleaning efficiency to Recharts format
  const cleaningData = [
    { name: 'Cleaned on time', value: stats?.cleaningEfficiency?.cleanedOnTime || 63, color: '#1565c0' },
    { name: 'Cleaned late', value: stats?.cleaningEfficiency?.cleanedLate || 21, color: '#06b6d4' },
    { name: 'Not cleaned', value: stats?.cleaningEfficiency?.notCleaned || 16, color: '#f59e0b' }
  ];

  const tooltipBg = isDarkMode ? '#1e293b' : '#fff';
  const tooltipBorder = isDarkMode ? '#334155' : '#e2e8f0';
  const tooltipText = isDarkMode ? '#fff' : '#000';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Dynamic Refresh Bar */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-colors duration-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Live waste metrics syncing ...</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onOpenScanner}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Waste Scan
          </button>
          <button 
            onClick={onRefresh}
            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 active:scale-95 transition-all cursor-pointer"
            title="Refresh Stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label="Total Waste Logged" 
          value={`${kpis.totalWaste.toLocaleString()} Kg`} 
          subtext="Cumulative hospital generation"
          icon={Trash2}
          color="blue"
        />
        <StatCard 
          label="Recyclable Sorting Rate" 
          value={`${kpis.recyclableWaste.toLocaleString()} Kg`} 
          subtext={`${((kpis.recyclableWaste / kpis.totalWaste) * 100).toFixed(1)}% of overall waste`}
          icon={Recycle}
          color="emerald"
        />
        <StatCard 
          label="Biohazard / Hazardous Waste" 
          value={`${kpis.hazardousWaste.toLocaleString()} Kg`} 
          subtext="Critical incineration recommended"
          icon={AlertOctagon}
          color="rose"
        />
        <StatCard 
          label="AI Model Accuracy" 
          value={`${kpis.aiAccuracy}%`} 
          subtext="YOLOv8 & CNN classification rate"
          icon={Cpu}
          color="indigo"
        />
        <StatCard 
          label="Active Tracking Sections" 
          value={`${kpis.activeDepartments} Depts`} 
          subtext="Hospital sections monitoring"
          icon={Building}
          color="blue"
        />
        <StatCard 
          label="Today's Waste Collections" 
          value={`${kpis.dailyCount} bins`} 
          subtext="Segregation batches logged today"
          icon={Boxes}
          color="amber"
        />
      </div>

      {/* Main Charts & Analytics Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Graphs & Logs */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Trend & Bin Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Donut Cleaning Schedule (Reference Image 1) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft md:col-span-5 flex flex-col justify-between transition-colors duration-300">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Bin Cleaning Schedule</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Weekly Performance Audit</p>
              </div>
              
              <div className="h-44 my-2 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cleaningData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {cleaningData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} 
                      formatter={(value) => `${value}%`} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute text-center">
                  <span className="text-xl font-extrabold text-slate-800 dark:text-white">84%</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block uppercase">Efficiency</span>
                </div>
              </div>

              {/* Legend details */}
              <div className="space-y-1 text-xs">
                {cleaningData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-slate-650 dark:text-slate-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-white">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Waste Generation Trend */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft md:col-span-7 flex flex-col justify-between transition-colors duration-300">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Waste Production Trend</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Cumulative output last 7 days</p>
              </div>

              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} 
                      formatter={(value) => [`${value} kg`, 'Total Waste']} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="waste" 
                      stroke="#0e94eb" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#0e94eb', strokeWidth: 2, stroke: isDarkMode ? '#1e293b' : '#fff' }} 
                      activeDot={{ r: 6 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* AI Model Evaluation Metrics & Validation Summary */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-colors duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm font-sans">YOLOv8 & CNN Inference Metrics</h3>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Active Model Validation Summary</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Accuracy</span>
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 block mt-1">{kpis.aiAccuracy}%</span>
              </div>
              <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Precision</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">{kpis.precision || 93.8}%</span>
              </div>
              <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Recall</span>
                <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 block mt-1">{kpis.recall || 92.4}%</span>
              </div>
              <div className="p-3 bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/60 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">F1-Score</span>
                <span className="text-base font-extrabold text-amber-500 dark:text-amber-400 block mt-1">{kpis.f1 || 93.1}%</span>
              </div>
            </div>
          </div>

          {/* Daily Collections Area Graph & Department Bar Chart */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Daily Collections Area Graph */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft md:col-span-6 flex flex-col justify-between transition-colors duration-300">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Daily Collections Audit</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Daily logged collection volumes (kg)</p>
              </div>
              <div className="h-44 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} 
                      formatter={(value) => [`${value} kg`, 'Volume']} 
                    />
                    <Area type="monotone" dataKey="waste" stroke="#10b981" fill={isDarkMode ? 'rgba(16, 185, 129, 0.1)' : '#e6f4ea'} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Department Comparison Total vs Hazardous Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft md:col-span-6 flex flex-col justify-between transition-colors duration-300">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Department Waste Generation</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Total vs Hazardous Waste comparison</p>
              </div>
              <div className="h-44 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.departmentComparison || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText }} 
                      formatter={(value) => [`${value} kg`]} 
                    />
                    <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold' }} />
                    <Bar dataKey="total" fill="#0e94eb" radius={[4, 4, 0, 0]} name="Total Waste" />
                    <Bar dataKey="hazardous" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Hazardous Waste" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active Logs Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-colors duration-300">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Real-time Segregation Feed</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Latest waste logs logged in system</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase">
                    <th className="pb-3">Item Type</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Section</th>
                    <th className="pb-3 text-center">Confidence</th>
                    <th className="pb-3 text-center">Risk</th>
                    <th className="pb-3 text-right">Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {recentEntries.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-455 dark:text-slate-500 font-medium">
                        No waste entries logged. Run scanner to add logs!
                      </td>
                    </tr>
                  ) : (
                    recentEntries.slice(0, 5).map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors group">
                        <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">{entry.type}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 font-medium">{entry.category}</td>
                        <td className="py-3 text-slate-500 dark:text-slate-400 font-semibold">{entry.department}</td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold rounded">
                            {(entry.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="font-bold text-[10px] uppercase" style={{ color: RISK_COLORS[entry.riskLevel] || '#64748b' }}>
                            {entry.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200">{entry.weight} kg</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        {/* Right Side: Chatbot & Confusion Matrix */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* AI Confusion Matrix */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-soft transition-colors duration-300">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">AI Confusion Matrix</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase">Prediction Validation Ratios (%)</p>
            </div>
            
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-center text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-455 dark:text-slate-500 font-bold">
                    <th className="text-left pb-2">Act \ Pred</th>
                    <th className="pb-2 text-blue-600 dark:text-blue-400">Bio</th>
                    <th className="pb-2 text-rose-600 dark:text-rose-400">Inf</th>
                    <th className="pb-2 text-emerald-600 dark:text-emerald-400">Pla</th>
                    <th className="pb-2 text-amber-600 dark:text-amber-400">Sha</th>
                    <th className="pb-2 text-slate-500">Gen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50 font-medium text-slate-600 dark:text-slate-350">
                  {stats?.confusionMatrix?.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="text-left font-bold text-slate-700 dark:text-slate-200 py-2.5">{row.actual}</td>
                      <td className={`py-2.5 font-bold ${i===0 ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-705 dark:text-blue-300 rounded' : ''}`}>{row.predictedBiomedical}%</td>
                      <td className={`py-2.5 font-bold ${i===1 ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-705 dark:text-rose-300 rounded' : ''}`}>{row.predictedInfectious}%</td>
                      <td className={`py-2.5 font-bold ${i===2 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-705 dark:text-emerald-300 rounded' : ''}`}>{row.predictedPlastic}%</td>
                      <td className={`py-2.5 font-bold ${i===3 ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-705 dark:text-amber-300 rounded' : ''}`}>{row.predictedSharps}%</td>
                      <td className={`py-2.5 font-bold ${i===4 ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded' : ''}`}>{row.predictedOther}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 text-[9px] text-slate-400 dark:text-slate-500 font-semibold text-center leading-normal">
              Based on validation set of 1,200 simulated items.
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default DashboardView;
