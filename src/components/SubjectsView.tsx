import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Plus, Edit, Trash2, CheckCircle2, XCircle, Search, Sparkles, AlertCircle, BookOpen, User2, Save, X
} from "lucide-react";
import { Subject, Profile } from "../types";
import { calculateSubjectStats } from "../utils";

interface SubjectsProps {
  subjects: Subject[];
  profile: Profile;
  onAddSubject: (name: string, faculty: string, attended: number, total: number) => void;
  onEditSubject: (id: string, name: string, faculty: string, attended: number, total: number) => void;
  onDeleteSubject: (id: string) => void;
  onMarkPresent: (id: string) => void;
  onMarkAbsent: (id: string) => void;
  searchValue: string;
}

export default function SubjectsView({
  subjects,
  profile,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onMarkPresent,
  onMarkAbsent,
  searchValue
}: SubjectsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subject | null>(null);

  // Form states
  const [subName, setSubName] = useState("");
  const [faculty, setFaculty] = useState("");
  const [attended, setAttended] = useState(0);
  const [total, setTotal] = useState(0);

  const requirement = profile.attendanceRequirement;

  // Filter subjects based on navigation search
  const filteredSubjects = subjects.filter(
    s => s.name.toLowerCase().includes(searchValue.toLowerCase()) || 
         s.faculty.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subName.trim()) return;
    onAddSubject(subName.trim(), faculty.trim() || "TBD", attended, total);
    // Reset form
    setSubName("");
    setFaculty("");
    setAttended(0);
    setTotal(0);
    setShowAddModal(false);
  };

  const handleStartEdit = (sub: Subject) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setFaculty(sub.faculty);
    setAttended(sub.attended);
    setTotal(sub.total);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub || !subName.trim()) return;
    onEditSubject(editingSub.id, subName.trim(), faculty.trim() || "TBD", attended, total);
    // Reset form
    setEditingSub(null);
    setSubName("");
    setFaculty("");
    setAttended(0);
    setTotal(0);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Subject Logs</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">Track and log daily attendance. Watch safe-bunks update instantly.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none"
        >
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-850 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-slate-950 dark:text-white text-base">Add New Academic Subject</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAdd} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="E.g., Operating Systems"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 mb-1">Faculty / Instructor</label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="E.g., Prof. Sarah Jenkins"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1">Lectures Attended</label>
                  <input
                    type="number"
                    min="0"
                    value={attended}
                    onChange={(e) => setAttended(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1">Total Lectures Held</label>
                  <input
                    type="number"
                    min="0"
                    value={total}
                    onChange={(e) => setTotal(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSub && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-850 p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="font-bold text-slate-950 dark:text-white text-base">Edit Subject Parameters</h3>
              <button 
                onClick={() => setEditingSub(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 dark:text-zinc-300 mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-zinc-300 mb-1">Faculty / Instructor</label>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1">Lectures Attended</label>
                  <input
                    type="number"
                    min="0"
                    value={attended}
                    onChange={(e) => setAttended(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-zinc-300 mb-1">Total Lectures Held</label>
                  <input
                    type="number"
                    min="0"
                    value={total}
                    onChange={(e) => setTotal(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Update Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {filteredSubjects.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-zinc-400">No subjects found matching "{searchValue}". Add one to start tracking!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((sub) => {
            const stats = calculateSubjectStats(sub.attended, sub.total, requirement);
            
            return (
              <div 
                key={sub.id} 
                className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                {/* Visual Accent Bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  stats.status === 'safe' 
                    ? 'bg-emerald-500' 
                    : stats.status === 'warning' 
                    ? 'bg-amber-500' 
                    : 'bg-rose-500'
                }`} />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium flex items-center gap-1 mt-0.5">
                        <User2 className="w-3.5 h-3.5" />
                        {sub.faculty}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(sub)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteSubject(sub.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Core Attendance Metrics */}
                  <div className="flex items-end gap-2.5 my-4">
                    <span className="text-3xl font-black text-slate-950 dark:text-white">
                      {stats.percentage.toFixed(0)}%
                    </span>
                    <span className="text-xs text-slate-500 dark:text-zinc-400 font-bold mb-1.5">
                      ({sub.attended}/{sub.total} held)
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ml-auto mb-1.5 ${
                      stats.status === 'safe' 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' 
                        : stats.status === 'warning'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30'
                    }`}>
                      {stats.status}
                    </span>
                  </div>

                  {/* Progress slide */}
                  <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.status === 'safe' 
                          ? 'bg-emerald-500' 
                          : stats.status === 'warning' 
                          ? 'bg-amber-500' 
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, stats.percentage)}%` }}
                    />
                  </div>

                  {/* Calculation insights text */}
                  <div className="p-3 bg-slate-50/50 dark:bg-zinc-950/40 rounded-xl border border-slate-150/40 dark:border-zinc-850 text-[11px] text-slate-600 dark:text-zinc-300 font-semibold mb-4 leading-relaxed">
                    {stats.message}
                  </div>
                </div>

                {/* Quick Increment log buttons */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-zinc-850 mt-2">
                  <button
                    onClick={() => onMarkPresent(sub.id)}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-50 dark:shadow-none"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Present
                  </button>
                  <button
                    onClick={() => onMarkAbsent(sub.id)}
                    className="flex-1 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Absent
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
