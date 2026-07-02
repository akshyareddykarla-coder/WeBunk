import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Sparkles, AlertCircle, CheckCircle, HelpCircle, Loader2, ArrowRight, BrainCircuit, ShieldAlert } from "lucide-react";
import { Subject, Profile } from "../types";

interface RiskSubject {
  subjectName: string;
  percentage: number;
  riskLevel: "CRITICAL" | "WARNING" | "SAFE" | string;
  reason: string;
  actionNeeded: string;
}

interface AnalyzerResult {
  riskRankedSubjects: RiskSubject[];
  weeklyPlan: string;
  recommendation: string;
}

interface AIAnalyzerProps {
  subjects: Subject[];
  profile: Profile;
}

export default function AIAnalyzerView({ subjects, profile }: AIAnalyzerProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/gemini/analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          targetThreshold: profile.attendanceRequirement || 75
        })
      });

      if (!response.ok) {
        throw new Error("Failed to process analysis.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An error occurred while calling the Gemini analyzer.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    triggerAnalysis();
  }, [subjects]);

  const getRiskColor = (level: string) => {
    switch (level?.toUpperCase()) {
      case "CRITICAL":
        return {
          bg: "bg-rose-500/10 border-rose-500/30 text-rose-500",
          ring: "ring-rose-500/20",
          badge: "bg-rose-500 text-white"
        };
      case "WARNING":
        return {
          bg: "bg-amber-500/10 border-amber-500/30 text-amber-500",
          ring: "ring-amber-500/20",
          badge: "bg-amber-500 text-slate-950"
        };
      default:
        return {
          bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
          ring: "ring-emerald-500/20",
          badge: "bg-emerald-500 text-white"
        };
    }
  };

  return (
    <div className="space-y-6 font-sans pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-500" />
            AI Attendance Analyzer
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Smart on-demand Gemini-powered advice, consecutive class tracking, and bunk buffers.
          </p>
        </div>

        <button
          onClick={triggerAnalysis}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-xs font-bold shadow-md hover:from-indigo-500 hover:to-indigo-600 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Recalculating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Analyze Status
            </>
          )}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-slate-150 dark:border-zinc-800">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-800 dark:text-zinc-200">Consulting Gemini Advisor Core...</p>
          <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1 max-w-sm text-center">
            Structuring custom risk thresholds, streak plans, and consecutive class goals mathematically.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400">Analysis Error</h4>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">{error}</p>
            <button
              onClick={triggerAnalysis}
              className="text-xs font-black text-rose-800 dark:text-rose-400 underline mt-2 hover:opacity-80"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Level Strategic Panels */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Strategy Plan Card */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500/5 via-transparent to-indigo-500/10 dark:from-indigo-950/20 dark:to-transparent border border-slate-150 dark:border-indigo-900/20 rounded-2xl p-6 shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
              
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                This Week's Attendance Strategy
              </h3>
              
              <p className="text-xs text-slate-600 dark:text-zinc-300 font-medium leading-relaxed">
                {result.weeklyPlan}
              </p>
            </div>

            {/* Risk-Ranked Subject List */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mb-5 pb-2 border-b border-slate-100 dark:border-zinc-850 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Risk-Ranked Subject Standings
              </h3>

              <div className="space-y-4">
                {result.riskRankedSubjects && result.riskRankedSubjects.length > 0 ? (
                  result.riskRankedSubjects.map((sub, idx) => {
                    const colors = getRiskColor(sub.riskLevel);
                    return (
                      <div
                        key={idx}
                        className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-sm ${colors.bg}`}
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-xs text-slate-800 dark:text-white">
                              {sub.subjectName}
                            </span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${colors.badge}`}>
                              {sub.riskLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                            {sub.reason}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>{sub.actionNeeded}</span>
                          </div>
                        </div>

                        {/* Metric pill */}
                        <div className="flex flex-col items-start md:items-end justify-center">
                          <span className="text-2xl font-black text-slate-800 dark:text-zinc-100 leading-none">
                            {sub.percentage}%
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold mt-1">
                            Current Standing
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs font-bold text-slate-400 text-center py-6">
                    No active subject metrics available. Add subjects to begin tracking.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Action Callouts */}
          <div className="space-y-6">
            {/* Critical Recommendation Panel */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-zinc-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
              
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
              </div>

              <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider block mb-1">
                KEY RECOMMENDATION
              </span>
              
              <h4 className="text-sm font-black text-white mb-3">
                Action Required Immediately
              </h4>

              <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                {result.recommendation}
              </p>
            </div>

            {/* Attendance Targets Cheat-Sheet */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4 text-slate-400 dark:text-zinc-500">
                Attendance Rules Reference
              </h4>

              <div className="space-y-4 text-xs font-bold">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-800 dark:text-zinc-200">Safe Standing</span>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Maintain attendance at least 5-10% above your {profile.attendanceRequirement || 75}% threshold for buffering during midterms.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-800 dark:text-zinc-200">Warning Threshold</span>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Within 5% of target limits. Avoid any further bunking until consecutive attendance buffer stabilizes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-800 dark:text-zinc-200">Critical De-registration</span>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                      Any subject below {profile.attendanceRequirement || 75}% risk de-registration or hall ticket blocking. Prioritize recovering immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
