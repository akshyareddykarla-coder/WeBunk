import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building, GraduationCap, Users, Calendar, Bell, Shield, Plus, Trash2, 
  BookOpen, Clock, Sparkles, RefreshCw, Send, CheckCircle, MapPin
} from "lucide-react";
import { supabase } from "../supabase";
import { fetchAdminCollegeDetails, CollegeAdminDetails, broadcastNotification } from "../lib/db";
import { Profile } from "../types";

interface AdminProps {
  profile: Profile;
  onLogout: () => void;
}

export default function AdminView({ profile, onLogout }: AdminProps) {
  const [dbData, setDbData] = useState<CollegeAdminDetails>({
    branches: [],
    semesters: [],
    sections: [],
    faculty: [],
    subjects: [],
    timetable: [],
    calendar: [],
    holidays: [],
    students: []
  });
  const [loading, setLoading] = useState(false);
  const [subTab, setSubTab] = useState<"structure" | "faculty" | "timetable" | "calendar" | "students" | "notifications" | "announcements">("structure");
  const [successMsg, setSuccessMsg] = useState("");

  // Announcements states
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnTitle, setNewAnnTitle] = useState("");
  const [newAnnContent, setNewAnnContent] = useState("");

  // Input states for creation
  const [newBranch, setNewBranch] = useState("");
  const [newSemester, setNewSemester] = useState("");
  const [selBranchId, setSelBranchId] = useState("");

  const [newSection, setNewSection] = useState("");
  const [selSemesterId, setSelSemesterId] = useState("");

  const [newFacultyName, setNewFacultyName] = useState("");
  const [newFacultyEmail, setNewFacultyEmail] = useState("");
  const [newFacultyDept, setNewFacultyDept] = useState("");

  const [newSubjectName, setNewSubjectName] = useState("");
  const [selFacultyId, setSelFacultyId] = useState("");
  const [selSubBranchId, setSelSubBranchId] = useState("");
  const [selSubSemId, setSelSubSemId] = useState("");

  const [newSlotSubId, setNewSlotSubId] = useState("");
  const [newSlotDay, setNewSlotDay] = useState<any>("Monday");
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("09:50");
  const [newSlotRoom, setNewSlotRoom] = useState("");
  const [newSlotColor, setNewSlotColor] = useState("indigo");

  const [newEventName, setNewEventName] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [newEventDate, setNewEventDate] = useState("");

  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");

  const [notifTitle, setNotifTitle] = useState("");
  const [notifMsg, setNotifMsg] = useState("");
  const [notifType, setNotifType] = useState<'danger' | 'warning' | 'success' | 'info'>("info");
  const [notifRecipientId, setNotifRecipientId] = useState("");

  const collegeId = profile.college_id;

  const loadData = async () => {
    if (!collegeId) return;
    setLoading(true);
    try {
      const details = await fetchAdminCollegeDetails(collegeId);
      setDbData(details);

      if (supabase) {
        const { data: annData } = await supabase
          .from("announcements")
          .select("*")
          .eq("college_id", collegeId)
          .order("created_at", { ascending: false });
        if (annData) {
          setAnnouncements(annData);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [collegeId]);

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Add handlers
  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !collegeId || !newBranch.trim()) return;

    const { error } = await supabase
      .from("branches")
      .insert({ name: newBranch.trim(), college_id: collegeId });

    if (error) {
      alert(error.message);
    } else {
      setNewBranch("");
      triggerSuccess("Department/Branch added successfully!");
      loadData();
    }
  };

  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selBranchId || !newSemester.trim()) return;

    const { error } = await supabase
      .from("semesters")
      .insert({ name: newSemester.trim(), branch_id: selBranchId });

    if (error) {
      alert(error.message);
    } else {
      setNewSemester("");
      triggerSuccess("Semester tier configured successfully!");
      loadData();
    }
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !selSemesterId || !newSection.trim()) return;

    const { error } = await supabase
      .from("sections")
      .insert({ name: newSection.trim(), semester_id: selSemesterId });

    if (error) {
      alert(error.message);
    } else {
      setNewSection("");
      triggerSuccess("Class Section created!");
      loadData();
    }
  };

  const handleAddFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !collegeId || !newFacultyName.trim()) return;

    const { error } = await supabase
      .from("faculty")
      .insert({
        name: newFacultyName.trim(),
        email: newFacultyEmail.trim() || null,
        college_id: collegeId,
        department: newFacultyDept.trim() || null
      });

    if (error) {
      alert(error.message);
    } else {
      setNewFacultyName("");
      setNewFacultyEmail("");
      setNewFacultyDept("");
      triggerSuccess("Faculty profile registered!");
      loadData();
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !collegeId || !newSubjectName.trim()) return;

    const { error } = await supabase
      .from("subjects")
      .insert({
        name: newSubjectName.trim(),
        faculty_id: selFacultyId || null,
        college_id: collegeId,
        branch_id: selSubBranchId || null,
        semester_id: selSubSemId || null
      });

    if (error) {
      alert(error.message);
    } else {
      setNewSubjectName("");
      triggerSuccess("Course subject published!");
      loadData();
    }
  };

  const handleAddTimetableSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !newSlotSubId) return;

    const { error } = await supabase
      .from("timetable")
      .insert({
        subject_id: newSlotSubId,
        day: newSlotDay,
        start_time: newSlotStart,
        end_time: newSlotEnd,
        room: newSlotRoom.trim() || null,
        color: newSlotColor
      });

    if (error) {
      alert(error.message);
    } else {
      setNewSlotRoom("");
      triggerSuccess("Timetable schedule slot added!");
      loadData();
    }
  };

  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !collegeId || !newEventName.trim() || !newEventDate) return;

    const { error } = await supabase
      .from("academic_calendar")
      .insert({
        event_name: newEventName.trim(),
        description: newEventDesc.trim() || null,
        event_date: newEventDate,
        college_id: collegeId
      });

    if (error) {
      alert(error.message);
    } else {
      setNewEventName("");
      setNewEventDesc("");
      setNewEventDate("");
      triggerSuccess("Academic Calendar event published!");
      loadData();
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !collegeId || !newHolidayName.trim() || !newHolidayDate) return;

    const { error } = await supabase
      .from("holidays")
      .insert({
        name: newHolidayName.trim(),
        holiday_date: newHolidayDate,
        college_id: collegeId
      });

    if (error) {
      alert(error.message);
    } else {
      setNewHolidayName("");
      setNewHolidayDate("");
      triggerSuccess("Holiday added successfully!");
      loadData();
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collegeId || !notifTitle.trim() || !notifMsg.trim()) return;

    const success = await broadcastNotification(
      collegeId,
      notifTitle.trim(),
      notifMsg.trim(),
      notifType,
      notifRecipientId || undefined
    );

    if (success) {
      setNotifTitle("");
      setNotifMsg("");
      triggerSuccess("Notification broadcast dispatched!");
      loadData();
    } else {
      alert("Failed to send notification.");
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !collegeId || !newAnnTitle.trim() || !newAnnContent.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .insert({
          title: newAnnTitle.trim(),
          content: newAnnContent.trim(),
          college_id: collegeId
        });
      if (error) throw error;
      setNewAnnTitle("");
      setNewAnnContent("");
      triggerSuccess("Announcement published successfully!");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!supabase) return;
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);
      if (error) throw error;
      triggerSuccess("Announcement deleted.");
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete generic function
  const handleDeleteRow = async (tableName: string, id: string) => {
    if (!supabase) return;
    if (!confirm("Are you sure you want to delete this record? This action is irreversible.")) return;

    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) {
      alert(error.message);
    } else {
      triggerSuccess("Record deleted successfully.");
      loadData();
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Admin Greeting header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-2">
          <Building className="w-64 h-64 text-indigo-500" />
        </div>
        <div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-0.5">ADMIN CONSOLE</span>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Welcome, Administrator
          </h2>
          <p className="text-xs text-slate-400 font-medium max-w-xl">
            SaaS Registrar System for <strong className="text-indigo-400">{profile.collegeName}</strong>. Add departments, map courses, publish master timetables, and broadcast real-time notices.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition-colors"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-950 border border-indigo-900/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 fill-indigo-900" />
            Live Cloud
          </span>
        </div>
      </div>

      {/* Real-time Alerts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Menu Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 dark:border-zinc-800 pb-1 shrink-0 scrollbar-none">
        {[
          { id: "structure", label: "Academic Layout", icon: <Building className="w-4 h-4" /> },
          { id: "faculty", label: "Staff & Faculty", icon: <Users className="w-4 h-4" /> },
          { id: "timetable", label: "Weekly Schedule", icon: <Clock className="w-4 h-4" /> },
          { id: "calendar", label: "Academic Calendar", icon: <Calendar className="w-4 h-4" /> },
          { id: "students", label: "Student Roster", icon: <GraduationCap className="w-4 h-4" /> },
          { id: "notifications", label: "Broadcast News", icon: <Bell className="w-4 h-4" /> },
          { id: "announcements", label: "Announcements", icon: <Bell className="w-4 h-4" /> }
        ].map((tab) => {
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer border ${
                isActive 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                  : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inner Panels */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-bold">Querying live Supabase databases...</p>
          </div>
        ) : (
          <div>
            
            {/* PANEL 1: COLLEGE STRUCTURE */}
            {subTab === "structure" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    Departments & Branches
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Manage degree paths of your college campus.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Form & List */}
                  <div className="space-y-4">
                    <form onSubmit={handleAddBranch} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Add Department</span>
                      <input
                        type="text"
                        required
                        value={newBranch}
                        onChange={(e) => setNewBranch(e.target.value)}
                        placeholder="E.g., Computer Science"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      />
                      <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                        Add Department
                      </button>
                    </form>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrolled Branches</span>
                      {dbData.branches.length === 0 ? (
                        <p className="text-xs text-slate-400">No departments configured yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {dbData.branches.map(b => (
                            <div key={b.id} className="flex items-center justify-between py-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{b.name}</span>
                              <button onClick={() => handleDeleteRow("branches", b.id)} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Semesters Form */}
                  <div className="space-y-4">
                    <form onSubmit={handleAddSemester} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Add Semester Tier</span>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Branch Category</label>
                        <select
                          required
                          value={selBranchId}
                          onChange={(e) => setSelBranchId(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                        >
                          <option value="">-- Choose Branch --</option>
                          {dbData.branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Semester Name</label>
                        <input
                          type="text"
                          required
                          value={newSemester}
                          onChange={(e) => setNewSemester(e.target.value)}
                          placeholder="E.g., 1st Semester, 6th Semester"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                      <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                        Configure Semester
                      </button>
                    </form>

                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registered Semesters</span>
                      {dbData.semesters.length === 0 ? (
                        <p className="text-xs text-slate-400">No semesters mapped yet.</p>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                          {dbData.semesters.map(s => (
                            <div key={s.id} className="flex items-center justify-between py-2">
                              <div>
                                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{s.name}</span>
                                <span className="text-[9px] text-indigo-500 font-bold block">({s.branches?.name})</span>
                              </div>
                              <button onClick={() => handleDeleteRow("semesters", s.id)} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 2: STAFF & FACULTY */}
            {subTab === "faculty" && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Staff, Teachers, & Faculty Profiles
                    </h3>
                    <p className="text-xs text-slate-400 font-medium font-sans">Register teachers and map them to appropriate core semester classes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Register Faculty Profile */}
                  <form onSubmit={handleAddFaculty} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Register Teacher Profile</span>
                    <input
                      type="text"
                      required
                      value={newFacultyName}
                      onChange={(e) => setNewFacultyName(e.target.value)}
                      placeholder="Professor Full Name"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                    />
                    <input
                      type="email"
                      value={newFacultyEmail}
                      onChange={(e) => setNewFacultyEmail(e.target.value)}
                      placeholder="Email address (optional)"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={newFacultyDept}
                      onChange={(e) => setNewFacultyDept(e.target.value)}
                      placeholder="Department / Branch field"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                    />
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                      Add Teacher
                    </button>
                  </form>

                  {/* Map Course Subject */}
                  <form onSubmit={handleAddSubject} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Map Subject Syllabus</span>
                    <input
                      type="text"
                      required
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="Course Subject Name"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                    />
                    <select
                      value={selFacultyId}
                      onChange={(e) => setSelFacultyId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                    >
                      <option value="">-- Assigned Instructor --</option>
                      {dbData.faculty.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selSubBranchId}
                        onChange={(e) => setSelSubBranchId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="">-- Branch --</option>
                        {dbData.branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <select
                        value={selSubSemId}
                        onChange={(e) => setSelSubSemId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="">-- Semester --</option>
                        {dbData.semesters.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.branches?.name})</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                      Publish Subject
                    </button>
                  </form>
                </div>

                {/* Listing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">Instructors Directory</span>
                    {dbData.faculty.length === 0 ? (
                      <p className="text-xs text-slate-400">No faculty members enrolled yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {dbData.faculty.map(f => (
                          <div key={f.id} className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{f.name}</span>
                              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block">{f.email || "No email"} • {f.department || "No department"}</span>
                            </div>
                            <button onClick={() => handleDeleteRow("faculty", f.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">Published Subjects</span>
                    {dbData.subjects.length === 0 ? (
                      <p className="text-xs text-slate-400">No subjects published yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {dbData.subjects.map(s => (
                          <div key={s.id} className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{s.name}</span>
                              <span className="text-[10px] text-indigo-500 font-bold block">Faculty: {s.faculty?.name || "Unassigned"}</span>
                            </div>
                            <button onClick={() => handleDeleteRow("subjects", s.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 3: WEEKLY SCHEDULE / TIMETABLE */}
            {subTab === "timetable" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    Class Scheduling & Weekly Timetable
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Create and adjust timetable slots for active courses.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Form */}
                  <form onSubmit={handleAddTimetableSlot} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3 shrink-0 h-fit">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Schedule Class Block</span>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Subject</label>
                      <select
                        required
                        value={newSlotSubId}
                        onChange={(e) => setNewSlotSubId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="">-- Choose Subject --</option>
                        {dbData.subjects.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Day of Week</label>
                      <select
                        value={newSlotDay}
                        onChange={(e) => setNewSlotDay(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      >
                        <option>Monday</option>
                        <option>Tuesday</option>
                        <option>Wednesday</option>
                        <option>Thursday</option>
                        <option>Friday</option>
                        <option>Saturday</option>
                        <option>Sunday</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Start Time</label>
                        <input
                          type="text"
                          required
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          placeholder="e.g. 09:00"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">End Time</label>
                        <input
                          type="text"
                          required
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          placeholder="e.g. 09:50"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Room/Hall</label>
                        <input
                          type="text"
                          value={newSlotRoom}
                          onChange={(e) => setNewSlotRoom(e.target.value)}
                          placeholder="e.g. LHC-101"
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500">Visual Color</label>
                        <select
                          value={newSlotColor}
                          onChange={(e) => setNewSlotColor(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white text-indigo-500 font-bold"
                        >
                          <option value="indigo">🟪 Indigo</option>
                          <option value="emerald">🟩 Emerald</option>
                          <option value="rose">🟥 Rose</option>
                          <option value="amber">🟨 Amber</option>
                          <option value="teal">🟦 Teal</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                      Register Timetable Slot
                    </button>
                  </form>

                  {/* Timetable List Grid */}
                  <div className="md:col-span-2 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Scheduled Timetable Slots</span>
                    {dbData.timetable.length === 0 ? (
                      <p className="text-xs text-slate-400">No timetable slots scheduled yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                        {dbData.timetable.map(slot => (
                          <div key={slot.id} className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 px-2 py-0.5 rounded font-black uppercase">
                                {slot.day} • {slot.start_time} - {slot.end_time}
                              </span>
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 mt-1">{slot.subjects?.name}</h4>
                              {slot.room && (
                                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Location: {slot.room}</span>
                              )}
                            </div>
                            <button onClick={() => handleDeleteRow("timetable", slot.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 4: ACADEMIC CALENDAR & HOLIDAYS */}
            {subTab === "calendar" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    Academic Calendar & University Holidays
                  </h3>
                  <p className="text-xs text-slate-400 font-medium font-sans">Set term dates, exams, orientation weeks, and official holidays.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Calendar Event form */}
                  <form onSubmit={handleAddCalendarEvent} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Configure Academic Event</span>
                    <input
                      type="text"
                      required
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      placeholder="Event name (e.g. Midterm Exams)"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                    />
                    <textarea
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      placeholder="Event details/description"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white h-16 resize-none"
                    />
                    <input
                      type="date"
                      required
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                    />
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                      Publish Event
                    </button>
                  </form>

                  {/* Holiday form */}
                  <form onSubmit={handleAddHoliday} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3 h-fit">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Declare Holiday Date</span>
                    <input
                      type="text"
                      required
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                      placeholder="Holiday Description (e.g. Labor Day)"
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                    />
                    <input
                      type="date"
                      required
                      value={newHolidayDate}
                      onChange={(e) => setNewHolidayDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                    />
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                      Declare Holiday
                    </button>
                  </form>
                </div>

                {/* Lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">Academic Term Calendar</span>
                    {dbData.calendar.length === 0 ? (
                      <p className="text-xs text-slate-400">No calendar events logged yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {dbData.calendar.map(event => (
                          <div key={event.id} className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-mono font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 px-2 py-0.5 rounded uppercase">
                                {event.event_date}
                              </span>
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 mt-1">{event.event_name}</h4>
                              <p className="text-[10px] text-slate-400">{event.description}</p>
                            </div>
                            <button onClick={() => handleDeleteRow("academic_calendar", event.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">Campus Holiday Schedule</span>
                    {dbData.holidays.length === 0 ? (
                      <p className="text-xs text-slate-400">No holiday declarations made.</p>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {dbData.holidays.map(hol => (
                          <div key={hol.id} className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 px-2 py-0.5 rounded uppercase">
                                {hol.holiday_date}
                              </span>
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 mt-1">{hol.name}</h4>
                            </div>
                            <button onClick={() => handleDeleteRow("holidays", hol.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 5: STUDENTS DIRECTORY */}
            {subTab === "students" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Enrolled Students Directory
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">View the list of registered student accounts in your college.</p>
                </div>

                {dbData.students.length === 0 ? (
                  <div className="p-10 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl text-center">
                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-600 dark:text-zinc-400 font-bold">No students have been added yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-150 dark:border-zinc-800 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-150 dark:border-zinc-800">
                          <th className="p-3 font-bold text-slate-600">Student ID</th>
                          <th className="p-3 font-bold text-slate-600">Student Name</th>
                          <th className="p-3 font-bold text-slate-600">Personal Email</th>
                          <th className="p-3 font-bold text-slate-600">College Email</th>
                          <th className="p-3 font-bold text-slate-600">Attendance Target</th>
                          <th className="p-3 font-bold text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {dbData.students.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/10">
                            <td className="p-3 font-semibold font-mono text-slate-800 dark:text-zinc-300">
                              {s.student_id_code || "N/A"}
                            </td>
                            <td className="p-3 font-bold text-slate-900 dark:text-zinc-200">
                              {s.profiles?.full_name || "N/A"}
                            </td>
                            <td className="p-3 font-medium text-slate-500">
                              {s.profiles?.email || "N/A"}
                            </td>
                            <td className="p-3 font-medium text-slate-500">
                              {s.college_email || "N/A"}
                            </td>
                            <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                              {s.attendance_requirement}%
                            </td>
                            <td className="p-3">
                              <button onClick={() => handleDeleteRow("students", s.id)} className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PANEL 6: BROADCAST NOTIFICATIONS */}
            {subTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    Broadcast Notification Center
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Dispatch warnings or notifications directly to your student's dashboard logs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Send Form */}
                  <form onSubmit={handleSendBroadcast} className="p-5 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Dispatch Message</span>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Broadcast Title</label>
                      <input
                        type="text"
                        required
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        placeholder="e.g. Extreme Weather Warning"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Alert Priority Level</label>
                      <select
                        value={notifType}
                        onChange={(e) => setNotifType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white font-bold"
                      >
                        <option value="info">🟦 Info / General Bulletin</option>
                        <option value="success">🟩 Success / Praise Announcements</option>
                        <option value="warning">🟨 Warning / Schedule Shifts</option>
                        <option value="danger">🟥 Danger / Mandatory Warning</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Recipient Student (Optional)</label>
                      <select
                        value={notifRecipientId}
                        onChange={(e) => setNotifRecipientId(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      >
                        <option value="">Broadcast to All Students in Campus</option>
                        {dbData.students.map(s => (
                          <option key={s.id} value={s.id}>{s.profiles?.full_name} ({s.profiles?.email})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Notification Message</label>
                      <textarea
                        required
                        value={notifMsg}
                        onChange={(e) => setNotifMsg(e.target.value)}
                        placeholder="Type the message body details here..."
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white h-24 resize-none"
                      />
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
                      <Send className="w-3.5 h-3.5" /> Dispatch Alert
                    </button>
                  </form>

                  {/* History feed */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Recent Campus Broadcasts</span>
                    <div className="p-1 space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                      {dbData.students.length === 0 ? (
                        <p className="text-xs text-slate-400">Roster notifications stream empty.</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xxs text-slate-400 font-bold uppercase">Showing recent alert logs dispatched via DB:</p>
                          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                            <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-400 font-bold">Dynamic Notification Ledger</p>
                            <p className="text-xxs text-slate-400 mt-1">Submit the dispatch form to trigger instant, cloud-saved bulletins.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 7: CAMPUS ANNOUNCEMENTS */}
            {subTab === "announcements" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    Campus Announcements Manager
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Publish official announcements and bulletins visible to all students on the dashboard.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Create Announcement Form */}
                  <form onSubmit={handleAddAnnouncement} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-4 h-fit">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Publish Announcement</span>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Title</label>
                      <input
                        type="text"
                        required
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        placeholder="e.g. Midterm Examination Schedule"
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Content / Announcement Details</label>
                      <textarea
                        required
                        value={newAnnContent}
                        onChange={(e) => setNewAnnContent(e.target.value)}
                        placeholder="Write the full announcement bulletin contents here..."
                        className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 dark:text-white h-32 resize-none"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer">
                      Publish Announcement
                    </button>
                  </form>

                  {/* List of Announcements */}
                  <div className="md:col-span-2 space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Published Announcements Bulletin</span>
                    {announcements.length === 0 ? (
                      <p className="text-xs text-slate-400">No announcements have been published yet.</p>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {announcements.map((ann) => (
                          <div key={ann.id} className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 rounded-xl flex justify-between items-start gap-4">
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 px-2 py-0.5 rounded uppercase">
                                {new Date(ann.created_at).toLocaleDateString([], { dateStyle: 'medium' })}
                              </span>
                              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">{ann.title}</h4>
                              <p className="text-xs text-slate-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">{ann.content}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteAnnouncement(ann.id)} 
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* Admin Panel Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-zinc-800 pt-4 text-xs font-semibold">
        <span className="text-slate-400">Authenticated as college administrator</span>
        <button onClick={onLogout} className="text-rose-600 dark:text-rose-400 hover:underline cursor-pointer">
          Logout console
        </button>
      </div>

    </div>
  );
}
