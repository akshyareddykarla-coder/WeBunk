import { useState } from "react";
import { motion } from "motion/react";
import { School, BookOpen, GraduationCap, Percent, Plus, Trash2, ArrowRight } from "lucide-react";
import { Profile, Subject } from "../types";

interface OnboardingProps {
  initialCollege: string;
  initialName: string;
  onComplete: (profile: Profile, subjects: Subject[]) => void;
}

export default function Onboarding({ initialCollege, initialName, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [collegeName, setCollegeName] = useState(() => {
    return initialCollege || localStorage.getItem("webbunk_signup_college") || "";
  });
  const [branch, setBranch] = useState(() => {
    return localStorage.getItem("webbunk_signup_branch") || "";
  });
  const [year, setYear] = useState(() => {
    return localStorage.getItem("webbunk_signup_class_year") || "1st Year";
  });
  const [semester, setSemester] = useState(() => {
    return localStorage.getItem("webbunk_signup_semester") || "1st Semester";
  });
  const [section, setSection] = useState(() => {
    return localStorage.getItem("webbunk_signup_section") || "";
  });
  const [requirement, setRequirement] = useState(() => {
    const saved = localStorage.getItem("webbunk_signup_requirement");
    return saved ? Number(saved) : 75;
  });
  
  // Subject definition state (fully empty - no dummy subjects)
  const [subjectNames, setSubjectNames] = useState<string[]>([]);
  const [newSubName, setNewSubName] = useState("");

  const handleAddSubject = () => {
    if (!newSubName.trim()) return;
    if (subjectNames.includes(newSubName.trim())) return;
    setSubjectNames([...subjectNames, newSubName.trim()]);
    setNewSubName("");
  };

  const handleRemoveSubject = (index: number) => {
    setSubjectNames(subjectNames.filter((_, i) => i !== index));
  };

  const handleFinish = () => {
    const profile: Profile = {
      fullName: initialName || "",
      collegeName,
      branch,
      year,
      semester,
      section,
      attendanceRequirement: requirement,
      onboarded: true,
      email: "",
      role: 'Student'
    };

    // Construct default clean subjects
    const subjects: Subject[] = subjectNames.map((name, i) => ({
      id: `sub-custom-${Date.now()}-${i}`,
      name,
      faculty: "",
      attended: 0,
      total: 0,
      streak: 0
    }));

    onComplete(profile, subjects);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="max-w-xl w-full bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-zinc-800 shadow-2xl p-8">
        
        {/* Progress Tracker */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              <GraduationCap className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-slate-800 dark:text-white">WeBunk Onboarding</span>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">Step {step} of 2</span>
        </div>

        {step === 1 ? (
          /* STEP 1: ACADEMIC PROFILE */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Set Up Your Profile</h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400">Tell us about your college parameters to initialize your custom dashboard.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">College / University Name</label>
                <div className="relative">
                  <School className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="E.g., Stanford University"
                    className="pl-10 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">Branch / Major</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="E.g., Computer Science & Engineering"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Academic Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                  >
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                    <option>Postgraduate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Semester</label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
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
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Section</label>
                  <input
                    type="text"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. Section A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Minimum Attendance Threshold</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{requirement}%</span>
                </label>
                <div className="flex items-center gap-4">
                  <Percent className="w-5 h-5 text-slate-400" />
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={requirement}
                    onChange={(e) => setRequirement(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
                <span className="text-xxs text-slate-500 dark:text-zinc-400 mt-1 block">Usually 75% for most universities.</span>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none"
            >
              Continue to Subjects <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </motion.div>
        ) : (
          /* STEP 2: SUBJECTS LIST SETUP */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Configure Your Subjects</h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400">Add the subjects you are attending this semester. You can edit these later at any time.</p>
            </div>

            <div className="space-y-4">
              {/* Add subject bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <BookOpen className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                    placeholder="E.g., Operating Systems"
                    className="pl-10 w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Subject names list */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {subjectNames.length === 0 ? (
                  <div className="text-center py-6 text-sm text-slate-400">
                    No subjects added. Add at least one to continue.
                  </div>
                ) : (
                  subjectNames.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-xl"
                    >
                      <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200">{name}</span>
                      <button
                        onClick={() => handleRemoveSubject(index)}
                        className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-slate-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold shadow-md transition-colors"
              >
                Start Bunking!
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
