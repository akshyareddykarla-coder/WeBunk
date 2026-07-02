import { useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, LineChart, Line } from "recharts";
import { BarChart3, TrendingUp, Calendar, AlertCircle, Sparkles } from "lucide-react";
import { Subject, Profile } from "../types";

interface AnalyticsProps {
  subjects: Subject[];
  profile: Profile;
}

export default function AnalyticsView({ subjects, profile }: AnalyticsProps) {
  const requirement = profile.attendanceRequirement;

  // Chart 1: Subject-wise Comparison
  const subjectComparisonData = subjects.map(s => {
    const percentage = s.total > 0 ? (s.attended / s.total) * 100 : 100;
    return {
      name: s.name.length > 15 ? s.name.slice(0, 15) + "..." : s.name,
      Attendance: Math.round(percentage),
      Required: requirement
    };
  });

  // Chart 2: Attendance Trends (Simulating cumulative weekly growth)
  const trendData = [
    { week: "Wk 1", Actual: 72, Target: requirement },
    { week: "Wk 2", Actual: 74, Target: requirement },
    { week: "Wk 3", Actual: 78, Target: requirement },
    { week: "Wk 4", Actual: 76, Target: requirement },
    { week: "Wk 5", Actual: 81, Target: requirement },
    { week: "Wk 6", Actual: 83, Target: requirement },
  ];

  // Chart 3: Weekly distribution (Present vs Absent)
  const weeklyDistributionData = [
    { name: "Mon", Present: 4, Absent: 1 },
    { name: "Tue", Present: 3, Absent: 2 },
    { name: "Wed", Present: 5, Absent: 0 },
    { name: "Thu", Present: 4, Absent: 1 },
    { name: "Fri", Present: 2, Absent: 3 },
    { name: "Sat", Present: 3, Absent: 1 },
  ];

  // Simulated heat map for calendar tracking
  const heatMapGrid = [
    { day: "Mon", status: ["present", "present", "absent", "present"] },
    { day: "Tue", status: ["present", "absent", "absent", "present"] },
    { day: "Wed", status: ["present", "present", "present", "present"] },
    { day: "Thu", status: ["present", "present", "absent", "present"] },
    { day: "Fri", status: ["present", "absent", "present", "absent"] },
    { day: "Sat", status: ["present", "present", "present", "absent"] },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Attendance Analytics</h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400">Deep-dive into metrics, visual trends, and weekday breakdowns.</p>
      </div>

      {/* Grid of Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Panel 1: Subject Attendance Comparison */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Subject Attendance (%) vs Target Threshold
          </h3>
          <div className="h-72 text-[10px] font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.08)" />
                <XAxis dataKey="name" stroke="#888888" tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#888888" tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", color: "#ffffff", borderRadius: "10px" }}
                  itemStyle={{ color: "#ffffff" }}
                />
                <Legend />
                <Bar dataKey="Attendance" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="Required" fill="#f43f5e" radius={[2, 2, 0, 0]} barSize={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 2: Attendance Progression Line Trend */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Cumulative Attendance Progression
          </h3>
          <div className="h-72 text-[10px] font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.08)" />
                <XAxis dataKey="week" stroke="#888888" tickLine={false} />
                <YAxis domain={[50, 100]} stroke="#888888" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", color: "#ffffff", borderRadius: "10px" }} />
                <Legend />
                <Area type="monotone" dataKey="Actual" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" />
                <Area type="monotone" dataKey="Target" stroke="#f43f5e" strokeWidth={1} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 3: Mon-Sat Present vs Absent breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            Weekday Logs Distribution (Lectures Count)
          </h3>
          <div className="h-72 text-[10px] font-bold">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.08)" />
                <XAxis dataKey="name" stroke="#888888" tickLine={false} />
                <YAxis stroke="#888888" tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", color: "#ffffff", borderRadius: "10px" }} />
                <Legend />
                <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="Absent" fill="#f43f5e" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel 4: Weekday Attendance Heatmap matrix */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
              Lectures Attendance Grid (Heatmap)
            </h3>

            <div className="space-y-3.5">
              {heatMapGrid.map((row, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 w-12">{row.day}</span>
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    {row.status.map((status, blockIdx) => (
                      <div 
                        key={blockIdx}
                        className={`h-8 rounded-lg border flex items-center justify-center text-[10px] font-bold ${
                          status === 'present' 
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-200/50 text-emerald-800 dark:text-emerald-400' 
                            : 'bg-rose-100 dark:bg-rose-950/40 border-rose-200/50 text-rose-800 dark:text-rose-400'
                        }`}
                      >
                        {status === 'present' ? 'P' : 'A'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-6 pt-3 border-t border-slate-100 dark:border-zinc-850">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/50" />
              Present (Attended Lecture)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-100 dark:bg-rose-950/40 border border-rose-200/50" />
              Absent (Bunked Lecture)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
