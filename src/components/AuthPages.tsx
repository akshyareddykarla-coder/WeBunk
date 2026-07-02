import React, { useState } from "react";
import { motion } from "motion/react";
import { BookOpen, Mail, Lock, User, School, ArrowLeft, ShieldCheck, Sparkles, UserCheck } from "lucide-react";
import { supabase } from "../supabase";

function calculatePasswordStrength(pass: string) {
  let score = 0;
  if (!pass) return { score, text: "None", color: "bg-slate-200", textClass: "text-slate-400" };
  
  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[a-z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score, text: "Very Weak", color: "bg-rose-500", textClass: "text-rose-500" };
  if (score === 2) return { score, text: "Weak", color: "bg-orange-400", textClass: "text-orange-400" };
  if (score === 3) return { score, text: "Medium", color: "bg-amber-400", textClass: "text-amber-400" };
  if (score === 4) return { score, text: "Strong", color: "bg-indigo-500", textClass: "text-indigo-500" };
  return { score, text: "Very Strong", color: "bg-emerald-500", textClass: "text-emerald-500" };
}

interface AuthProps {
  onSuccess: (
    user: { email: string; name: string; college: string; role: 'Student' | 'College Admin'; id: string },
    isNewUser: boolean
  ) => void;
  onNavigateToLanding: () => void;
}

export function SignIn({ onSuccess, onNavigateToLanding }: AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(true);

  // Sign Up form states
  const [fullName, setFullName] = useState("");
  const [collegeName, setCollegeName] = useState("Vardhaman College of Engineering");
  const [role, setRole] = useState<'Student' | 'College Admin'>("Student");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Additional student registration states
  const [studentId, setStudentId] = useState("");
  const [collegeEmail, setCollegeEmail] = useState("");
  const [branch, setBranch] = useState("CSM");
  const [classYear, setClassYear] = useState("1");
  const [semester, setSemester] = useState("Semester 1");
  const [section, setSection] = useState("A");
  const [attendanceRequirement, setAttendanceRequirement] = useState(75);

  const [regStep, setRegStep] = useState(1);
  const [collegesList, setCollegesList] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function loadColleges() {
      if (supabase) {
        const { data, error } = await supabase
          .from("colleges")
          .select("id, name, status")
          .eq("status", "active")
          .order("name", { ascending: true });
        if (!error && data) {
          setCollegesList(data);
          if (data.length > 0) {
            setCollegeName(data[0].name);
          }
        }
      }
    }
    loadColleges();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    let loginEmail = email;

    if (!email.includes("@")) {
      if (supabase) {
        try {
          const { data: studentMatch, error: sError } = await supabase
            .from("students")
            .select("id, profile_id, profiles(email)")
            .eq("student_id_code", email)
            .maybeSingle();

          if (studentMatch && (studentMatch as any).profiles?.email) {
            loginEmail = (studentMatch as any).profiles.email;
          } else {
            // Also try by UUID just in case
            const { data: studentMatchId } = await supabase
              .from("students")
              .select("id, profile_id, profiles(email)")
              .eq("id", email)
              .maybeSingle();

            if (studentMatchId && (studentMatchId as any).profiles?.email) {
              loginEmail = (studentMatchId as any).profiles.email;
            } else {
              setError("No registered student profile matches this Student ID.");
              setLoading(false);
              return;
            }
          }
        } catch (dbErr) {
          console.error("Failed to query student ID:", dbErr);
          setError("Database error resolving Student ID. Please log in using your registered email.");
          setLoading(false);
          return;
        }
      } else {
        // Local offline simulation
        const localId = localStorage.getItem("webbunk_signup_studentid");
        const localEmail = localStorage.getItem("webbunk_signup_email");
        if (localId && localEmail && localId.trim().toLowerCase() === email.trim().toLowerCase()) {
          loginEmail = localEmail;
        } else {
          setError("No offline profile matches this Student ID. Use your registered email.");
          setLoading(false);
          return;
        }
      }
    }

    if (supabase) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (data?.user) {
          // Fetch user profile from profiles table to check role and college_id
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*, colleges(name)")
            .eq("id", data.user.id)
            .single();

          if (profileError) {
            console.warn("Could not load user profile, using fallback auth:", profileError);
          }

          onSuccess(
            {
              id: data.user.id,
              email: data.user.email || loginEmail,
              name: profile?.full_name || loginEmail.split("@")[0].toUpperCase(),
              college: profile?.colleges?.name || "",
              role: (profile?.role as 'Student' | 'College Admin') || "Student"
            },
            false
          );
        }
      } catch (err: any) {
        console.error("Supabase sign in failed:", err);
        setError(err.message || "An unexpected error occurred during sign in.");
      }
    } else {
      // Local fallback simulation
      const savedCollege = localStorage.getItem("webbunk_signup_college") || "";
      const savedName = localStorage.getItem("webbunk_signup_fullname") || loginEmail.split("@")[0].toUpperCase();
      setTimeout(() => {
        onSuccess(
          {
            id: "local-user-id",
            email: loginEmail,
            name: savedName,
            college: savedCollege,
            role: "Student"
          },
          false
        );
      }, 500);
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    if (supabase) {
      try {
        const { error: authError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin
          }
        });
        if (authError) {
          setError(authError.message);
        }
      } catch (err: any) {
        setError(err.message || "Google sign in failed.");
      }
    } else {
      const savedCollege = localStorage.getItem("webbunk_signup_college") || "";
      onSuccess(
        {
          id: "google-local-id",
          email: "google.user@example.edu",
          name: "Google Student",
          college: savedCollege,
          role: "Student"
        },
        false
      );
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!fullName || !collegeName || !signUpEmail || !signUpPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (role === "Student" && !studentId) {
      setError("Please specify your Student ID.");
      setLoading(false);
      return;
    }

    if (!signUpEmail.includes("@")) {
      setError("Please enter a valid personal email address.");
      setLoading(false);
      return;
    }

    // Password policy validation (simplified for user-friendliness)
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (supabase) {
      try {
        // Enforce Student ID Uniqueness
        if (role === "Student") {
          const { data: existingStudent, error: checkError } = await supabase
            .from("students")
            .select("id")
            .eq("student_id_code", studentId)
            .maybeSingle();

          if (existingStudent) {
            setError(`Student ID "${studentId}" is already registered. Please check or contact your college admin.`);
            setLoading(false);
            return;
          }
        }

        const dbSemester = semester === "Semester 2" ? "2nd Semester" : "1st Semester";
        const dbClassYear = 
          classYear === "1" ? "1st Year" :
          classYear === "2" ? "2nd Year" :
          classYear === "3" ? "3rd Year" :
          classYear === "4" ? "4th Year" :
          classYear;

        // Sign up with Supabase. Metadata is passed to raw_user_meta_data
        // which triggers database triggers to sync tables.
        const { data, error: authError } = await supabase.auth.signUp({
          email: signUpEmail,
          password: signUpPassword,
          options: {
            data: {
              full_name: fullName,
              college_name: collegeName,
              role: role,
              branch: branch,
              class_year: dbClassYear,
              semester: dbSemester,
              section: section,
              attendance_requirement: attendanceRequirement,
              student_id_code: studentId || null,
              college_email: collegeEmail || null
            }
          }
        });

        if (authError) {
          if (authError.message === "{}" || authError.status === 500) {
            setError("Registration failed (500): Please ensure you have run the updated SQL schema in your Supabase SQL Editor and disabled 'Confirm email' under Auth > Providers > Email in your Supabase dashboard.");
          } else {
            setError(authError.message);
          }
          setLoading(false);
          return;
        }

        if (data?.user) {
          localStorage.setItem("webbunk_signup_college", collegeName);
          localStorage.setItem("webbunk_signup_branch", branch);
          localStorage.setItem("webbunk_signup_class_year", dbClassYear);
          localStorage.setItem("webbunk_signup_semester", dbSemester);
          localStorage.setItem("webbunk_signup_section", section);
          localStorage.setItem("webbunk_signup_requirement", String(attendanceRequirement));
          localStorage.setItem("webbunk_signup_studentid", studentId);
          localStorage.setItem("webbunk_signup_email", signUpEmail);

          onSuccess(
            {
              id: data.user.id,
              email: signUpEmail,
              name: fullName,
              college: collegeName,
              role: role
            },
            true
          );
        }
      } catch (err: any) {
        console.error("Supabase sign up failed:", err);
        setError(err.message || "An unexpected error occurred during signup.");
      }
    } else {
      const dbSemester = semester === "Semester 2" ? "2nd Semester" : "1st Semester";
      const dbClassYear = 
        classYear === "1" ? "1st Year" :
        classYear === "2" ? "2nd Year" :
        classYear === "3" ? "3rd Year" :
        classYear === "4" ? "4th Year" :
        classYear;

      // Local fallback simulation
      localStorage.setItem("webbunk_signup_college", collegeName);
      localStorage.setItem("webbunk_signup_branch", branch);
      localStorage.setItem("webbunk_signup_class_year", dbClassYear);
      localStorage.setItem("webbunk_signup_semester", dbSemester);
      localStorage.setItem("webbunk_signup_section", section);
      localStorage.setItem("webbunk_signup_requirement", String(attendanceRequirement));
      localStorage.setItem("webbunk_signup_studentid", studentId);
      localStorage.setItem("webbunk_signup_email", signUpEmail);

      setTimeout(() => {
        onSuccess(
          {
            id: "local-user-id",
            email: signUpEmail,
            name: fullName,
            college: collegeName,
            role: role
          },
          true
        );
      }, 500);
    }
    setLoading(false);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setError("");
    setLoading(true);

    if (supabase) {
      try {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
          redirectTo: `${window.location.origin}/reset-password`
        });
        if (resetError) {
          setError(resetError.message);
        } else {
          setForgotSent(true);
        }
      } catch (err: any) {
        setError(err.message || "Forgot password reset failed.");
      }
    } else {
      setForgotSent(true);
    }
    setLoading(false);
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-zinc-400">
            We will send you instructions to reset your password.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow-xl border border-slate-150 dark:border-zinc-800 rounded-2xl sm:px-10">
            {forgotSent ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mb-4">
                  <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Email Sent</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
                  We have sent password recovery instructions to <strong className="text-slate-700 dark:text-zinc-300">{forgotEmail}</strong>.
                </p>
                <button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotSent(false);
                  }}
                  className="mt-6 w-full py-2.5 px-4 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleForgotPasswordSubmit}>
                {error && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40 rounded-lg text-rose-700 dark:text-rose-400 text-xs font-semibold">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                    Email address
                  </label>
                  <div className="mt-1.5 relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="pl-10 w-full px-4 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-colors disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Recovery Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-5">
          <button
            onClick={onNavigateToLanding}
            className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg cursor-pointer"
          >
            <BookOpen className="w-6 h-6" />
          </button>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {isSignUpMode ? "Register for WeBunk" : "Log In to WeBunk"}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 dark:text-zinc-400">
          {isSignUpMode ? (
            <>
              Already have saved credentials?{" "}
              <button
                onClick={() => {
                  setIsSignUpMode(false);
                  setError("");
                }}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer"
              >
                Log In
              </button>
            </>
          ) : (
            <>
              Need to create an account?{" "}
              <button
                onClick={() => {
                  setIsSignUpMode(true);
                  setError("");
                }}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer"
              >
                Register
              </button>
            </>
          )}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-4 shadow-xl border border-slate-150 dark:border-zinc-800 rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40 rounded-lg text-rose-700 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          {!supabase && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-lg text-amber-850 dark:text-amber-400 text-[11px] font-semibold">
              ⚠️ Running in offline simulation mode. Configure VITE_SUPABASE_ANON_KEY to enable live cloud sync.
            </div>
          )}

          {isSignUpMode ? (
            /* MULTI-STEP SIGN UP WIZARD */
            <div className="space-y-6">
              {/* Step Indicators */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5 select-none">
                  <span>Step {regStep} of 6</span>
                  <span>{Math.round((regStep / 6) * 100)}% Complete</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-350"
                    style={{ width: `${(regStep / 6) * 100}%` }}
                  />
                </div>
              </div>

              {regStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Select Your College</h3>
                    <p className="text-xxs text-slate-400 font-medium">Select your university campus to load mapped courses.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">College / University</label>
                    <div className="relative">
                      <School className="absolute left-3 top-3 w-5 h-5 text-slate-400 pointer-events-none" />
                      <select
                        value={collegeName}
                        onChange={(e) => setCollegeName(e.target.value)}
                        className="pl-10 w-full px-4 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      >
                        {collegesList.length > 0 ? (
                           collegesList.map((col) => (
                            <option key={col.id} value={col.name}>{col.name}</option>
                          ))
                        ) : (
                          <option value="Vardhaman College of Engineering">Vardhaman College of Engineering</option>
                        )}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => setRegStep(2)}
                    className="w-full flex justify-center py-2.5 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                  >
                    Next Step
                  </button>
                </div>
              )}

              {regStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Select Your Branch</h3>
                    <p className="text-xxs text-slate-400 font-medium">Choose your primary branch or major of study.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Academic Branch</label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="CSM">CSM (Computer Science & Machine Learning)</option>
                      <option value="CSE">CSE (Computer Science & Engineering)</option>
                      <option value="ECE">ECE (Electronics & Communications)</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRegStep(1)}
                      className="w-1/3 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setRegStep(3)}
                      className="flex-1 py-2.5 rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-center"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {regStep === 3 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Select Your Class Year</h3>
                    <p className="text-xxs text-slate-400 font-medium">Choose your current academic year level of study.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Academic Year</label>
                    <select
                      value={classYear}
                      onChange={(e) => setClassYear(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRegStep(2)}
                      className="w-1/3 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setRegStep(4)}
                      className="flex-1 py-2.5 rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-center"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {regStep === 4 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Select Your Section</h3>
                    <p className="text-xxs text-slate-400 font-medium">Specify your assigned classroom section division.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Class Section</label>
                    <select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
                      <option value="C">Section C</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRegStep(3)}
                      className="w-1/3 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setRegStep(5)}
                      className="flex-1 py-2.5 rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-center"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {regStep === 5 && (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Select Your Semester</h3>
                    <p className="text-xxs text-slate-400 font-medium">Choose your current running semester term.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">Semester Term</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRegStep(4)}
                      className="w-1/3 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setRegStep(6)}
                      className="flex-1 py-2.5 rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-center"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {regStep === 6 && (
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Create Account Credentials</h3>
                    <p className="text-xxs text-slate-400 font-medium">Enter your login details to finalize your profile setup.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-355 mb-0.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="pl-10 w-full px-3 py-2 text-xs rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-755 dark:text-zinc-350 mb-0.5">Student ID / Roll No</label>
                      <input
                        type="text"
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. VCE-CSE-25"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-755 dark:text-zinc-350 mb-0.5">Target Attendance</label>
                      <select
                        value={attendanceRequirement}
                        onChange={(e) => setAttendanceRequirement(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      >
                        <option value="50">50% Min</option>
                        <option value="65">65% Tier</option>
                        <option value="75">75% Standard</option>
                        <option value="85">85% High</option>
                        <option value="90">90% Elite</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-355 mb-0.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        placeholder="you@university.edu"
                        className="pl-10 w-full px-3 py-2 text-xs rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-355 mb-0.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 w-full px-3 py-2 text-xs rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-355 mb-0.5">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 w-full px-3 py-2 text-xs rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setRegStep(5)}
                      className="w-1/4 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex justify-center py-2.5 px-4 rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                    >
                      {loading ? "Creating..." : "Create Account"}
                    </button>
                  </div>

                  {/* Google Sign In mock option */}
                  <div className="mt-4 border-t border-slate-100 dark:border-zinc-850 pt-4">
                    <button
                      type="button"
                      onClick={() => alert("Google SSO Integration requires OAuth consent screen validation. Please complete standard form credentials.")}
                      className="w-full inline-flex justify-center items-center gap-2 py-2.5 border border-slate-250 dark:border-zinc-800 rounded-lg shadow-sm bg-slate-50 dark:bg-zinc-950 text-xs font-bold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                    >
                      <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12.54 10.24h11.09c.12.62.18 1.28.18 2.02 0 3.12-.86 5.75-2.4 8.01a11.08 11.08 0 01-8.87 4.73c-6.19 0-11.2-5.01-11.2-11.2S6.35.8 12.54.8c3.02 0 5.56 1.11 7.51 2.92l-3.03 2.91c-1.01-.97-2.61-2.09-4.48-2.09-3.83 0-6.95 3.17-6.95 7.07s3.12 7.07 6.95 7.07c4.15 0 5.7-2.83 5.96-4.5h-5.96v-4.04z" />
                      </svg>
                      Sign In with Google
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSignIn}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Email or Student ID
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu or VCE-CSE-25-014"
                    className="pl-10 w-full px-4 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300">
                  Password
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 w-full px-4 py-2.5 rounded-lg border border-slate-250 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded animate-none"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700 dark:text-zinc-400 font-medium">
                    Remember me
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  Forgot your password?
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </form>
          )}


        </div>
      </div>
    </div>
  );
}
