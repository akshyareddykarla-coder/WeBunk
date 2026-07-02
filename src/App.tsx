import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

import { Profile, Subject, TimetableSlot, Notification, ActivityLog } from "./types";
import { 
  DEFAULT_PROFILE, DEFAULT_SUBJECTS, DEFAULT_TIMETABLE, DEFAULT_NOTIFICATIONS, DEFAULT_ACTIVITY,
  calculateSubjectStats
} from "./utils";

// Database operations
import { supabase } from "./supabase";
import { 
  getProfileAndDetails, 
  saveProfileOnboarding, 
  fetchStudentSubjectsAndAttendance, 
  markAttendance, 
  fetchStudentTimetable, 
  fetchStudentNotifications,
  markNotificationAsRead
} from "./lib/db";

// Views
import LandingPage from "./components/LandingPage";
import { SignIn } from "./components/AuthPages";
import Onboarding from "./components/Onboarding";
import NavbarAndSidebar from "./components/NavbarAndSidebar";
import DashboardView from "./components/DashboardView";
import SubjectsView from "./components/SubjectsView";
import TimetableView from "./components/TimetableView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsView from "./components/SettingsView";
import NotificationsView from "./components/NotificationsView";
import AdminView from "./components/AdminView";
import SuperAdminView from "./components/SuperAdminView";
import AIAnalyzerView from "./components/AIAnalyzerView";
import SectionChatbot from "./components/SectionChatbot";

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("webbunk_dark_mode");
    return saved === "true";
  });

  // Current session/page state
  const [currentPage, setCurrentPage] = useState<
    "landing" | "signin" | "signup" | "onboarding" | "dashboard" | "subjects" | "timetable" | "analytics" | "notifications" | "settings" | "ai-analyzer"
  >("landing");

  // User details
  const [activeUser, setActiveUser] = useState<{ email: string; name: string; college: string; role: 'Student' | 'College Admin'; id: string } | null>(null);

  // Database models
  const [profile, setProfile] = useState<Profile>(() => {
    const saved = localStorage.getItem("webbunk_profile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem("webbunk_subjects");
    return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
  });

  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => {
    const saved = localStorage.getItem("webbunk_timetable");
    return saved ? JSON.parse(saved) : DEFAULT_TIMETABLE;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem("webbunk_notifications");
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("webbunk_activity");
    return saved ? JSON.parse(saved) : DEFAULT_ACTIVITY;
  });

  // Global search input for filtering subjects
  const [searchQuery, setSearchQuery] = useState("");
  const [dbLoading, setDbLoading] = useState(false);

  // Sync Supabase Authentication States
  useEffect(() => {
    if (!supabase) return;

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setDbLoading(true);
        const userProfile = await getProfileAndDetails(session.user.id);
        if (userProfile) {
          setProfile(userProfile);
          const formattedUser = {
            id: session.user.id,
            email: session.user.email || "",
            name: userProfile.fullName,
            college: userProfile.collegeName,
            role: userProfile.role
          };
          setActiveUser(formattedUser);
          localStorage.setItem("webbunk_active_user", JSON.stringify(formattedUser));

          if (!userProfile.onboarded && userProfile.role === "Student") {
            const savedCollege = localStorage.getItem("webbunk_signup_college") || userProfile.collegeName || "";
            const savedBranch = localStorage.getItem("webbunk_signup_branch") || "";
            const savedClassYear = localStorage.getItem("webbunk_signup_class_year") || "1st Year";
            const savedSemester = localStorage.getItem("webbunk_signup_semester") || "1st Semester";
            const savedSection = localStorage.getItem("webbunk_signup_section") || "";
            const savedRequirement = Number(localStorage.getItem("webbunk_signup_requirement")) || 75;

            const res = await saveProfileOnboarding(
              session.user.id,
              savedCollege,
              savedBranch,
              savedClassYear,
              savedSemester,
              savedRequirement,
              ["Mathematics", "Physics", "Computer Science"],
              savedSection
            );
            if (res) {
              setProfile({
                ...userProfile,
                ...res.profile,
                onboarded: true
              });
              setSubjects(res.subjects);
            }
            setCurrentPage("dashboard");
          } else {
            setCurrentPage("dashboard");
          }
        }
        setDbLoading(false);
      } else {
        // User logged out or no session
        setActiveUser(null);
        localStorage.removeItem("webbunk_active_user");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch student data on login / change
  useEffect(() => {
    const syncStudentDbData = async () => {
      if (!supabase || !activeUser || activeUser.role !== "Student" || !profile.college_id) return;
      setDbLoading(true);
      
      try {
        const studentId = profile.student_id;
        const collegeId = profile.college_id;
        const branchId = profile.branch_id;
        const semesterId = profile.semester_id;

        if (studentId && collegeId) {
          // Fetch real subjects with live attendance counts
          const liveSubjects = await fetchStudentSubjectsAndAttendance(
            collegeId,
            branchId || "",
            semesterId || "",
            studentId
          );
          if (liveSubjects.length > 0) {
            setSubjects(liveSubjects);
          }

          // Fetch live timetable schedules
          if (semesterId) {
            const liveSlots = await fetchStudentTimetable(semesterId);
            if (liveSlots.length > 0) {
              setTimetable(liveSlots);
            }
          }

          // Fetch live notifications and alerts
          const liveNotifs = await fetchStudentNotifications(collegeId, studentId);
          if (liveNotifs.length > 0) {
            setNotifications(liveNotifs);
          }
        }
      } catch (err) {
        console.error("Error loading student live database metrics:", err);
      } finally {
        setDbLoading(false);
      }
    };

    syncStudentDbData();
  }, [activeUser, profile.id, profile.student_id, profile.college_id]);

  // Save states to localStorage when updated (as client-side caching fallback)
  useEffect(() => {
    localStorage.setItem("webbunk_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("webbunk_subjects", JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem("webbunk_timetable", JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem("webbunk_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("webbunk_activity", JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem("webbunk_dark_mode", String(isDarkMode));
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Auth Success Handler
  const handleAuthSuccess = async (
    user: { email: string; name: string; college: string; role: 'Student' | 'College Admin'; id: string },
    isNewUser: boolean
  ) => {
    setActiveUser(user);
    localStorage.setItem("webbunk_active_user", JSON.stringify(user));

    if (isNewUser) {
      // Clear data for fresh start on sign up
      const freshProfile: Profile = {
        id: user.id,
        fullName: user.name,
        collegeName: user.college,
        branch: "",
        year: "1st Year",
        semester: "1st Semester",
        attendanceRequirement: 75,
        onboarded: false,
        email: user.email,
        role: user.role
      };
      setProfile(freshProfile);
      setSubjects([]);
      setTimetable([]);
      setNotifications([
        {
          id: `welcome-${Date.now()}`,
          title: "Welcome onboard!",
          message: "Finish your WeBunk profile onboarding to plan subjects and tracks.",
          timestamp: new Date().toISOString(),
          type: "info",
          read: false
        }
      ]);
      setActivityLogs([]);
      
      if (user.role === "Student") {
        const savedCollege = localStorage.getItem("webbunk_signup_college") || user.college || "";
        const savedBranch = localStorage.getItem("webbunk_signup_branch") || "";
        const savedClassYear = localStorage.getItem("webbunk_signup_class_year") || "1st Year";
        const savedSemester = localStorage.getItem("webbunk_signup_semester") || "1st Semester";
        const savedSection = localStorage.getItem("webbunk_signup_section") || "";
        const savedRequirement = Number(localStorage.getItem("webbunk_signup_requirement")) || 75;

        if (supabase) {
          setDbLoading(true);
          const res = await saveProfileOnboarding(
            user.id,
            savedCollege,
            savedBranch,
            savedClassYear,
            savedSemester,
            savedRequirement,
            ["Mathematics", "Physics", "Computer Science"],
            savedSection
          );
          if (res) {
            setProfile({
              ...freshProfile,
              ...res.profile,
              onboarded: true
            });
            setSubjects(res.subjects);
          }
          setDbLoading(false);
        } else {
          setProfile({
            ...freshProfile,
            collegeName: savedCollege,
            branch: savedBranch,
            year: savedClassYear,
            semester: savedSemester,
            section: savedSection,
            attendanceRequirement: savedRequirement,
            onboarded: true
          });
          setSubjects([
            { id: "1", name: "Mathematics", attended: 0, total: 0 },
            { id: "2", name: "Physics", attended: 0, total: 0 },
            { id: "3", name: "Computer Science", attended: 0, total: 0 }
          ]);
        }
        setCurrentPage("dashboard");
      } else {
        setCurrentPage("dashboard"); // Admin doesn't onboard as student
      }
    } else {
      setDbLoading(true);
      const userProfile = await getProfileAndDetails(user.id);
      if (userProfile) {
        setProfile(userProfile);
        setCurrentPage("dashboard");
      } else {
        setCurrentPage("dashboard");
      }
      setDbLoading(false);
    }
  };

  const handleOnboardingComplete = async (newProfile: Profile, initialSubjects: Subject[]) => {
    if (supabase && activeUser) {
      setDbLoading(true);
      const res = await saveProfileOnboarding(
        activeUser.id,
        newProfile.collegeName,
        newProfile.branch,
        newProfile.year,
        newProfile.semester,
        newProfile.attendanceRequirement,
        initialSubjects.map(s => s.name),
        newProfile.section
      );

      if (res) {
        setProfile({
          ...profile,
          ...res.profile,
          fullName: activeUser.name,
          email: activeUser.email,
          section: newProfile.section
        });
        setSubjects(res.subjects);
      }
      setDbLoading(false);
    } else {
      // Local fallback onboarding
      setProfile(newProfile);
      setSubjects(initialSubjects);
    }

    // Start with a clean empty timetable, no mock slots
    setTimetable([]);

    // Initial welcome notifications
    setNotifications([
      {
        id: `n-onb-${Date.now()}`,
        title: "Onboarding Completed!",
        message: "You are ready to Track Smart and Bunk Smarter! Check your dashboard suggestions.",
        timestamp: new Date().toISOString(),
        type: "success",
        read: false
      }
    ]);

    setActivityLogs([
      {
        id: `act-onb-${Date.now()}`,
        subjectName: "System",
        action: "added",
        timestamp: new Date().toISOString()
      }
    ]);

    setCurrentPage("dashboard");
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setActiveUser(null);
    localStorage.removeItem("webbunk_active_user");
    setCurrentPage("landing");
  };

  // SUBJECT INCREMENT CHECKS WITH SUPABASE WRITE
  const handleMarkPresent = async (subId: string) => {
    if (supabase && profile.student_id) {
      await markAttendance(profile.student_id, subId, "present");
    }

    setSubjects(prev => prev.map(sub => {
      if (sub.id !== subId) return sub;
      const nextAttended = sub.attended + 1;
      const nextTotal = sub.total + 1;
      const nextStreak = (sub.streak || 0) + 1;

      // Log activity
      const logId = `log-${Date.now()}`;
      setActivityLogs(logs => [
        {
          id: logId,
          subjectName: sub.name,
          action: "present",
          timestamp: new Date().toISOString()
        },
        ...logs
      ]);

      // Check if attendance status improves or reaches comfortable buffers
      const prevStats = calculateSubjectStats(sub.attended, sub.total, profile.attendanceRequirement);
      const nextStats = calculateSubjectStats(nextAttended, nextTotal, profile.attendanceRequirement);

      if (prevStats.status === 'danger' && nextStats.status !== 'danger') {
        const notifId = `notif-${Date.now()}`;
        setNotifications(notifs => [
          {
            id: notifId,
            title: `Attendance Restored: ${sub.name}`,
            message: `Awesome! Your attendance in '${sub.name}' has climbed back above your target threshold.`,
            timestamp: new Date().toISOString(),
            type: "success",
            read: false
          },
          ...notifs
        ]);
      }

      return {
        ...sub,
        attended: nextAttended,
        total: nextTotal,
        streak: nextStreak
      };
    }));
  };

  const handleMarkAbsent = async (subId: string) => {
    if (supabase && profile.student_id) {
      await markAttendance(profile.student_id, subId, "absent");
    }

    setSubjects(prev => prev.map(sub => {
      if (sub.id !== subId) return sub;
      const nextAttended = sub.attended;
      const nextTotal = sub.total + 1;
      const nextStreak = 0; // reset streak on absence

      // Log activity
      const logId = `log-${Date.now()}`;
      setActivityLogs(logs => [
        {
          id: logId,
          subjectName: sub.name,
          action: "absent",
          timestamp: new Date().toISOString()
        },
        ...logs
      ]);

      // Trigger danger notifications if attendance slips below target
      const prevStats = calculateSubjectStats(sub.attended, sub.total, profile.attendanceRequirement);
      const nextStats = calculateSubjectStats(nextAttended, nextTotal, profile.attendanceRequirement);

      if (prevStats.status !== 'danger' && nextStats.status === 'danger') {
        const notifId = `notif-${Date.now()}`;
        setNotifications(notifs => [
          {
            id: notifId,
            title: `Attendance Warning: ${sub.name}`,
            message: `Warning! Your attendance in '${sub.name}' has fallen to ${nextStats.percentage.toFixed(1)}%, slipping below your ${profile.attendanceRequirement}% threshold.`,
            timestamp: new Date().toISOString(),
            type: "danger",
            read: false
          },
          ...notifs
        ]);
      }

      return {
        ...sub,
        attended: nextAttended,
        total: nextTotal,
        streak: nextStreak
      };
    }));
  };

  // SUBJECTS CRUD
  const handleAddSubject = async (name: string, faculty: string, attended: number, total: number) => {
    let newId = `sub-manual-${Date.now()}`;
    if (supabase && profile.college_id) {
      try {
        const { data, error } = await supabase
          .from("subjects")
          .insert({
            name,
            college_id: profile.college_id,
            branch_id: profile.branch_id || null,
            semester_id: profile.semester_id || null
          })
          .select("id")
          .single();
        if (!error && data) {
          newId = data.id;
        }
      } catch (e) {
        console.error(e);
      }
    }

    const newSub: Subject = {
      id: newId,
      name,
      faculty,
      attended,
      total,
      streak: 0
    };
    setSubjects(prev => [newSub, ...prev]);

    setActivityLogs(logs => [
      {
        id: `log-add-${Date.now()}`,
        subjectName: name,
        action: "added",
        timestamp: new Date().toISOString()
      },
      ...logs
    ]);
  };

  const handleEditSubject = async (id: string, name: string, faculty: string, attended: number, total: number) => {
    if (supabase) {
      await supabase
        .from("subjects")
        .update({ name })
        .eq("id", id);
    }

    setSubjects(prev => prev.map(sub => {
      if (sub.id !== id) return sub;
      return {
        ...sub,
        name,
        faculty,
        attended,
        total
      };
    }));

    setActivityLogs(logs => [
      {
        id: `log-edit-${Date.now()}`,
        subjectName: name,
        action: "updated",
        timestamp: new Date().toISOString()
      },
      ...logs
    ]);
  };

  const handleDeleteSubject = async (id: string) => {
    const matched = subjects.find(s => s.id === id);
    if (!matched) return;

    if (supabase) {
      await supabase.from("subjects").delete().eq("id", id);
    }

    setSubjects(prev => prev.filter(s => s.id !== id));
    setTimetable(prev => prev.filter(t => t.subjectId !== id && t.subjectName !== matched.name));

    setActivityLogs(logs => [
      {
        id: `log-del-${Date.now()}`,
        subjectName: matched.name,
        action: "deleted",
        timestamp: new Date().toISOString()
      },
      ...logs
    ]);
  };

  // TIMETABLE CRUD
  const handleAddSlot = async (subId: string, name: string, day: any, start: string, end: string, room: string) => {
    let newId = `slot-manual-${Date.now()}`;
    if (supabase) {
      const { data, error } = await supabase
        .from("timetable")
        .insert({
          subject_id: subId,
          day,
          start_time: start,
          end_time: end,
          room
        })
        .select("id")
        .single();
      if (!error && data) {
        newId = data.id;
      }
    }

    const newSlot: TimetableSlot = {
      id: newId,
      subjectId: subId,
      subjectName: name,
      day,
      startTime: start,
      endTime: end,
      room
    };
    setTimetable(prev => [...prev, newSlot]);
  };

  const handleDeleteSlot = async (id: string) => {
    if (supabase) {
      await supabase.from("timetable").delete().eq("id", id);
    }
    setTimetable(prev => prev.filter(s => s.id !== id));
  };

  // NOTIFICATIONS ACTIONS
  const handleMarkRead = async (id: string) => {
    if (supabase) {
      await markNotificationAsRead(id);
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleUpdateProfile = async (updated: Profile) => {
    if (supabase && activeUser) {
      await supabase
        .from("profiles")
        .update({ full_name: updated.fullName })
        .eq("id", activeUser.id);

      if (profile.student_id) {
        await supabase
          .from("students")
          .update({ attendance_requirement: updated.attendanceRequirement })
          .eq("id", profile.student_id);
      }
    }
    setProfile(updated);
  };

  // Switch between views inside Dashboard frame
  const renderDashboardViewContent = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <DashboardView
            subjects={subjects}
            profile={profile}
            timetable={timetable}
            activityLogs={activityLogs}
            onMarkPresent={handleMarkPresent}
            onMarkAbsent={handleMarkAbsent}
            setActiveTab={setCurrentPage}
          />
        );
      case "subjects":
        return (
          <SubjectsView
            subjects={subjects}
            profile={profile}
            onAddSubject={handleAddSubject}
            onEditSubject={handleEditSubject}
            onDeleteSubject={handleDeleteSubject}
            onMarkPresent={handleMarkPresent}
            onMarkAbsent={handleMarkAbsent}
            searchValue={searchQuery}
          />
        );
      case "timetable":
        return (
          <TimetableView
            timetable={timetable}
            subjects={subjects}
            profile={profile}
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
          />
        );
      case "analytics":
        return (
          <AnalyticsView
            subjects={subjects}
            profile={profile}
          />
        );
      case "notifications":
        return (
          <NotificationsView
            notifications={notifications}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onClearAll={handleClearAll}
          />
        );
      case "settings":
        return (
          <SettingsView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            onLogout={handleLogout}
            subjects={subjects}
          />
        );
      case "ai-analyzer":
        return (
          <AIAnalyzerView
            subjects={subjects}
            profile={profile}
          />
        );
      default:
        return (
          <div className="text-center py-20 font-sans">
            <h2 className="text-2xl font-black text-slate-800">404 - View Not Found</h2>
            <p className="text-sm text-slate-500 mt-2">The selected dashboard tab cannot be loaded.</p>
            <button 
              onClick={() => setCurrentPage("dashboard")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
            >
              Return to Dashboard Home
            </button>
          </div>
        );
    }
  };

  // MAIN STATE ROUTER
  if (currentPage === "landing") {
    return (
      <LandingPage 
        onGetStarted={() => setCurrentPage("signup")} 
        onSignIn={() => setCurrentPage("signin")} 
      />
    );
  }

  if (currentPage === "signin" || currentPage === "signup") {
    return (
      <SignIn 
        onSuccess={handleAuthSuccess} 
        onNavigateToLanding={() => setCurrentPage("landing")} 
      />
    );
  }

  if (currentPage === "onboarding") {
    return (
      <Onboarding
        initialCollege={activeUser?.college || ""}
        initialName={activeUser?.name || ""}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Route College Admin role to the dedicated, robust, and beautiful console
  if (activeUser?.role === "College Admin" || activeUser?.role === "admin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-300">
        <NavbarAndSidebar
          activeTab="settings"
          setActiveTab={() => {}}
          profile={profile}
          notifications={[]}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onLogout={handleLogout}
          searchValue=""
          onSearchChange={() => {}}
        />
        <main className="pt-20 pb-8 pl-0 md:pl-64 min-h-screen">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <AdminView profile={profile} onLogout={handleLogout} />
          </div>
        </main>
      </div>
    );
  }

  // Route Super Admin role to the platform administration portal
  if (activeUser?.role === "super_admin" || activeUser?.role === "super admin") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-300">
        <NavbarAndSidebar
          activeTab="settings"
          setActiveTab={() => {}}
          profile={profile}
          notifications={[]}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onLogout={handleLogout}
          searchValue=""
          onSearchChange={() => {}}
        />
        <main className="pt-20 pb-8 pl-0 md:pl-64 min-h-screen">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <SuperAdminView profile={profile} onLogout={handleLogout} />
          </div>
        </main>
      </div>
    );
  }

  // CORE STUDENT CONTAINER LAYOUT WITH NAV & SIDEBAR
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-300">
      <NavbarAndSidebar
        activeTab={currentPage}
        setActiveTab={setCurrentPage}
        profile={profile}
        notifications={notifications}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onLogout={handleLogout}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main content body spacing */}
      <main className="pt-20 pb-20 md:pb-8 pl-0 md:pl-64 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {dbLoading && (
            <div className="mb-4 text-center py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 text-xxs font-black tracking-widest rounded-xl animate-pulse">
              SYNCING WITH SUPABASE REAL-TIME CLOUD DATABASE...
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {renderDashboardViewContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Section Chatbot Co-pilot */}
      <SectionChatbot
        subjects={subjects}
        profile={profile}
        timetable={timetable}
      />
    </div>
  );
}
