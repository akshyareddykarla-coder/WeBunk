import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User, School, Percent, ShieldCheck, Sun, Moon, LogOut, Save, Download, FileSpreadsheet
} from "lucide-react";
import { Profile, Subject } from "../types";

interface SettingsProps {
  profile: Profile;
  onUpdateProfile: (profile: Profile) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  subjects: Subject[];
}

export default function SettingsView({
  profile,
  onUpdateProfile,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  subjects
}: SettingsProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email || "alex.rivera@stanford.edu");
  const [collegeName, setCollegeName] = useState(profile.collegeName);
  const [branch, setBranch] = useState(profile.branch);
  const [year, setYear] = useState(profile.year);
  const [semester, setSemester] = useState(profile.semester);
  const [requirement, setRequirement] = useState(profile.attendanceRequirement);
  const [showSavedToast, setShowSavedToast] = useState(false);

  const handleExportCSV = () => {
    if (!subjects || subjects.length === 0) {
      alert("No attendance records to export.");
      return;
    }

    const headers = [
      "Subject Name",
      "Faculty",
      "Classes Attended",
      "Total Classes",
      "Attendance Percentage",
      "Current Streak",
      "Requirement Threshold (%)",
      "Status"
    ];

    const escapeCSV = (val: string) => {
      if (val === undefined || val === null) return "";
      const escaped = val.toString().replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const rows = subjects.map(sub => {
      const percentage = sub.total > 0 ? (sub.attended / sub.total) * 100 : 0;
      const status = percentage >= requirement ? "Safe" : "Warning";
      return [
        escapeCSV(sub.name),
        escapeCSV(sub.faculty || "TBD"),
        sub.attended,
        sub.total,
        `${percentage.toFixed(1)}%`,
        sub.streak,
        `${requirement}%`,
        status
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `WeBunk_Attendance_Backup_${dateStr}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      fullName,
      email,
      collegeName,
      branch,
      year,
      semester,
      attendanceRequirement: requirement,
      onboarded: true
    });
    
    // Show temporary success feedback
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Account Settings</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Manage your student credentials, academic parameters, and app theme.</p>
        </div>
      </div>

      {showSavedToast && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 rounded-xl text-emerald-800 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />
          Settings saved successfully! Calculations recomputed globally.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Profile and University */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6 text-xs font-semibold">
            
            {/* Section 1: Personal info */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-zinc-850 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" /> Personal Credentials
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1.5">Academic Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: College Info */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-zinc-850 flex items-center gap-2">
                <School className="w-4 h-4 text-indigo-600" /> College & Program Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1.5">University Name</label>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1.5">Branch / Major Course</label>
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1.5">Academic Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                    <option>Postgraduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1.5">Active Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs"
                  >
                    <option>1st Semester</option>
                    <option>2nd Semester</option>
                    <option>3rd Semester</option>
                    <option>4th Semester</option>
                    <option>5th Semester</option>
                    <option>6th Semester</option>
                    <option>7th Semester</option>
                    <option>8th Semester</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Target Threshold */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-zinc-850 flex items-center gap-2">
                <Percent className="w-4 h-4 text-indigo-600" /> Minimum Attendance Target
              </h3>
              
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                  <span>Attendance Requirement Threshold</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-extrabold text-base">{requirement}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={requirement}
                    onChange={(e) => setRequirement(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                  WeBunk uses this threshold to calculate warning alerts, bunk quotas, and required make-up lectures across all your logged academic subjects.
                </p>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-850 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>

        {/* Right side panel: App Settings, Logout */}
        <div className="space-y-6">
          {/* Appearance Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 pb-2 border-b border-slate-100 dark:border-zinc-850">
              Appearance Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-4">
              Toggle between standard Light and SaaS dark appearance modes.
            </p>

            <button
              onClick={onToggleDarkMode}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" /> Switch to Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-500" /> Switch to Dark Mode
                </>
              )}
            </button>
          </div>

          {/* Export Data Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4 pb-2 border-b border-slate-100 dark:border-zinc-850 flex items-center gap-2">
              <Download className="w-4 h-4 text-indigo-500" /> Export Backup
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-4">
              Download a complete local backup of your subject attendance records in CSV format.
            </p>

            <button
              onClick={handleExportCSV}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export Attendance CSV
            </button>
          </div>

          {/* Dangerous Zone Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-rose-600 dark:text-rose-400 text-sm mb-4 pb-2 border-b border-rose-100 dark:border-rose-950/20">
              Session Settings
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mb-4">
              Logout of your local WeBunk instance.
            </p>

            <button
              onClick={onLogout}
              className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout from WeBunk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
