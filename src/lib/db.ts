import { supabase } from "../supabase";
import { Profile, Subject, TimetableSlot, Notification, ActivityLog } from "../types";

// ====================================================================
// PROFILE & AUTHENTICATION HELPERS
// ====================================================================

export async function getProfileAndDetails(userId: string): Promise<Profile | null> {
  if (!supabase) return null;

  try {
    // Query profiles and colleges
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*, colleges(name)")
      .eq("id", userId)
      .single();

    if (error) throw error;
    if (!profile) return null;

    // Retrieve Student or Admin specific details
    let studentId = undefined;
    let adminId = undefined;
    let branchName = "";
    let branchId = undefined;
    let semesterName = "";
    let semesterId = undefined;
    let sectionId = undefined;
    let sectionName = "";
    let attendanceRequirement = 75;
    let studentIdCode = "";
    let collegeEmail = "";
    let yearName = "";
 
    if (profile.role === "Student") {
      const { data: student, error: sErr } = await supabase
        .from("students")
        .select("*, branches(id, name), semesters(id, name), sections(id, name), academic_years(id, name)")
        .eq("profile_id", userId)
        .maybeSingle();
 
      if (!sErr && student) {
        studentId = student.id;
        branchName = student.branches?.name || "";
        branchId = student.branches?.id;
        semesterName = student.semesters?.name || "";
        semesterId = student.semesters?.id;
        sectionId = student.section_id;
        sectionName = student.sections?.name || "";
        attendanceRequirement = student.attendance_requirement;
        studentIdCode = student.student_id_code || "";
        collegeEmail = student.college_email || "";
        yearName = student.academic_years?.name || "";
      }
    } else {
      const { data: admin, error: aErr } = await supabase
        .from("admins")
        .select("*")
        .eq("profile_id", userId)
        .maybeSingle();
 
      if (!aErr && admin) {
        adminId = admin.id;
      }
    }
 
    return {
      id: profile.id,
      fullName: profile.full_name || "New User",
      collegeName: profile.colleges?.name || "No College assigned",
      college_id: profile.college_id,
      branch: branchName,
      branch_id: branchId,
      year: profile.role === "Student" ? (yearName || "1st Year") : "Staff",
      semester: semesterName || "1st Semester",
      semester_id: semesterId,
      section_id: sectionId,
      section: sectionName,
      attendanceRequirement,
      onboarded: !!profile.college_id,
      email: profile.email,
      role: profile.role,
      student_id: studentId,
      admin_id: adminId,
      studentIdCode: studentIdCode,
      collegeEmail: collegeEmail
    };
  } catch (err) {
    console.error("Error in getProfileAndDetails:", err);
    return null;
  }
}

export async function saveProfileOnboarding(
  userId: string,
  collegeName: string,
  branchName: string,
  yearStr: string,
  semesterStr: string,
  requirement: number,
  initialSubjectNames: string[],
  sectionName?: string
): Promise<{ profile: Profile; subjects: Subject[] } | null> {
  if (!supabase) return null;

  try {
    // 1. Get or create college
    let collegeId = "";
    const { data: collegeCheck, error: cErr } = await supabase
      .from("colleges")
      .select("id")
      .eq("name", collegeName)
      .maybeSingle();

    if (collegeCheck) {
      collegeId = collegeCheck.id;
    } else {
      const { data: newCollege, error: newCErr } = await supabase
        .from("colleges")
        .insert({ name: collegeName })
        .select("id")
        .single();
      if (newCErr) throw newCErr;
      collegeId = newCollege.id;
    }

    // 2. Get or create branch
    let branchId = "";
    const { data: branchCheck } = await supabase
      .from("branches")
      .select("id")
      .eq("name", branchName)
      .eq("college_id", collegeId)
      .maybeSingle();

    if (branchCheck) {
      branchId = branchCheck.id;
    } else {
      const { data: newBranch, error: nbErr } = await supabase
        .from("branches")
        .insert({ name: branchName, college_id: collegeId })
        .select("id")
        .single();
      if (nbErr) throw nbErr;
      branchId = newBranch.id;
    }

    // 3. Get or create semester
    let semesterId = "";
    const { data: semCheck } = await supabase
      .from("semesters")
      .select("id")
      .eq("name", semesterStr)
      .eq("branch_id", branchId)
      .maybeSingle();

    if (semCheck) {
      semesterId = semCheck.id;
    } else {
      const { data: newSem, error: nsErr } = await supabase
        .from("semesters")
        .insert({ name: semesterStr, branch_id: branchId })
        .select("id")
        .single();
      if (nsErr) throw nsErr;
      semesterId = newSem.id;
    }

    // 3.2 Get or create academic year
    let academicYearId = "";
    const { data: ayCheck } = await supabase
      .from("academic_years")
      .select("id")
      .eq("name", yearStr)
      .eq("college_id", collegeId)
      .maybeSingle();

    if (ayCheck) {
      academicYearId = ayCheck.id;
    } else {
      const { data: newAy, error: newAyErr } = await supabase
        .from("academic_years")
        .insert({ name: yearStr, college_id: collegeId })
        .select("id")
        .single();
      if (newAyErr) throw newAyErr;
      academicYearId = newAy.id;
    }

    // 3.5 Get or create section if provided
    let sectionId = "";
    if (sectionName) {
      const { data: sectionCheck } = await supabase
        .from("sections")
        .select("id")
        .eq("name", sectionName)
        .eq("semester_id", semesterId)
        .maybeSingle();

      if (sectionCheck) {
        sectionId = sectionCheck.id;
      } else {
        const { data: newSec, error: nSecErr } = await supabase
          .from("sections")
          .insert({ name: sectionName, semester_id: semesterId })
          .select("id")
          .single();
        if (!nSecErr && newSec) {
          sectionId = newSec.id;
        }
      }
    }

    // 4. Update profiles table
    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        college_id: collegeId,
        full_name: initialNameFromMetadata(userId) || undefined
      })
      .eq("id", userId);
    if (pErr) throw pErr;

    // Fetch user metadata to extract student_id_code and college_email
    let metadataStudentId = "";
    let metadataCollegeEmail = "";
    try {
      const { data: { user } } = await supabase.auth.getUser();
      metadataStudentId = user?.user_metadata?.student_id_code || "";
      metadataCollegeEmail = user?.user_metadata?.college_email || "";
    } catch (metaErr) {
      console.warn("Could not retrieve auth metadata on onboarding:", metaErr);
    }

    // 5. Update students table
    const { data: studentRec, error: sErr } = await supabase
      .from("students")
      .update({
        college_id: collegeId,
        branch_id: branchId,
        academic_year_id: academicYearId || null,
        semester_id: semesterId,
        section_id: sectionId || null,
        attendance_requirement: requirement,
        student_id_code: metadataStudentId || null,
        college_email: metadataCollegeEmail || null
      })
      .eq("profile_id", userId)
      .select("*")
      .single();
    if (sErr) throw sErr;

    // 6. Seed subjects and map them
    const subjectsToReturn: Subject[] = [];
    for (const subName of initialSubjectNames) {
      // Create Subject in DB directly without mock faculty
      const { data: subject, error: subErr } = await supabase
        .from("subjects")
        .insert({
          name: subName,
          faculty_id: null,
          college_id: collegeId,
          branch_id: branchId,
          semester_id: semesterId
        })
        .select("*")
        .single();

      if (!subErr && subject) {
        subjectsToReturn.push({
          id: subject.id,
          name: subject.name,
          faculty: "TBD",
          faculty_id: null as any,
          attended: 0,
          total: 0,
          streak: 0,
          college_id: collegeId,
          branch_id: branchId,
          semester_id: semesterId
        });
      }
    }

    const finalProfile: Profile = {
      id: userId,
      fullName: "", // will be resolved
      collegeName,
      college_id: collegeId,
      branch: branchName,
      branch_id: branchId,
      year: yearStr,
      semester: semesterStr,
      semester_id: semesterId,
      section_id: sectionId || undefined,
      section: sectionName,
      attendanceRequirement: requirement,
      onboarded: true,
      email: "",
      role: "Student",
      student_id: studentRec.id
    };

    return { profile: finalProfile, subjects: subjectsToReturn };
  } catch (error) {
    console.error("Error in onboarding:", error);
    return null;
  }
}

function initialNameFromMetadata(userId: string): string {
  // Safe helper
  return "Student";
}

// ====================================================================
// SUBJECTS & ATTENDANCE OPERATIONS
// ====================================================================

export async function fetchStudentSubjectsAndAttendance(
  collegeId: string,
  branchId: string,
  semesterId: string,
  studentId: string
): Promise<Subject[]> {
  if (!supabase) return [];

  try {
    // 1. Fetch all subjects belonging to college/branch/semester
    let query = supabase.from("subjects").select("*, faculty(id, name)");
    if (collegeId) query = query.eq("college_id", collegeId);
    if (branchId) query = query.eq("branch_id", branchId);
    if (semesterId) query = query.eq("semester_id", semesterId);

    const { data: subjects, error } = await query;
    if (error) throw error;
    if (!subjects) return [];

    // 2. Fetch all attendance logs for this student
    const { data: attendanceLogs, error: attError } = await supabase
      .from("attendance")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: false });

    if (attError) throw attError;

    // 3. Map subjects with counts
    return subjects.map(sub => {
      const logsForSub = attendanceLogs?.filter(log => log.subject_id === sub.id) || [];
      const attended = logsForSub.filter(log => log.status === "present").length;
      const total = logsForSub.length;

      // Calculate streak: order logs by date desc, count consecutive presents
      let streak = 0;
      for (const log of logsForSub) {
        if (log.status === "present") {
          streak++;
        } else {
          break;
        }
      }

      return {
        id: sub.id,
        name: sub.name,
        faculty: sub.faculty?.name || "TBD",
        faculty_id: sub.faculty_id,
        attended,
        total,
        streak,
        college_id: sub.college_id,
        branch_id: sub.branch_id,
        semester_id: sub.semester_id
      };
    });
  } catch (err) {
    console.error("Error in fetchStudentSubjectsAndAttendance:", err);
    return [];
  }
}

export async function markAttendance(
  studentId: string,
  subjectId: string,
  status: 'present' | 'absent'
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const todayStr = new Date().toISOString().split("T")[0];
    
    // Upsert attendance for today
    const { error } = await supabase
      .from("attendance")
      .upsert({
        student_id: studentId,
        subject_id: subjectId,
        date: todayStr,
        status: status,
        logged_at: new Date().toISOString()
      }, {
        onConflict: "student_id,subject_id,date"
      });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error in markAttendance:", err);
    return false;
  }
}

// ====================================================================
// TIMETABLE
// ====================================================================

export async function fetchStudentTimetable(semesterId: string): Promise<TimetableSlot[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("timetable")
      .select("*, subjects(id, name, college_id, semester_id)")
      .eq("subjects.semester_id", semesterId);

    if (error) throw error;
    if (!data) return [];

    // Filter out rows where subject didn't match the join (Supabase returns null on failed joins)
    const activeSlots = data.filter(slot => slot.subjects);

    return activeSlots.map(slot => ({
      id: slot.id,
      subjectId: slot.subject_id,
      subjectName: slot.subjects.name,
      day: slot.day,
      startTime: slot.start_time,
      endTime: slot.end_time,
      room: slot.room,
      color: slot.color
    }));
  } catch (err) {
    console.error("Error in fetchStudentTimetable:", err);
    return [];
  }
}

// ====================================================================
// NOTIFICATIONS
// ====================================================================

export async function fetchStudentNotifications(collegeId: string, studentId: string): Promise<Notification[]> {
  if (!supabase) return [];

  try {
    // Select where college matches AND (recipient is null OR recipient is me)
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("college_id", collegeId)
      .or(`recipient_student_id.is.null,recipient_student_id.eq.${studentId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    return data.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      timestamp: n.created_at,
      type: n.type as any,
      read: n.read,
      college_id: n.college_id,
      recipient_student_id: n.recipient_student_id
    }));
  } catch (err) {
    console.error("Error in fetchStudentNotifications:", err);
    return [];
  }
}

export async function markNotificationAsRead(notifId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notifId);
    return !error;
  } catch (e) {
    return false;
  }
}

export async function broadcastNotification(
  collegeId: string,
  title: string,
  message: string,
  type: 'danger' | 'warning' | 'success' | 'info',
  recipientId?: string
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("notifications")
      .insert({
        college_id: collegeId,
        title,
        message,
        type,
        recipient_student_id: recipientId || null
      });
    return !error;
  } catch (e) {
    return false;
  }
}

// ====================================================================
// ADMIN SPECIFIC OPERATIONS
// ====================================================================

export interface CollegeAdminDetails {
  branches: any[];
  semesters: any[];
  sections: any[];
  faculty: any[];
  subjects: any[];
  timetable: any[];
  calendar: any[];
  holidays: any[];
  students: any[];
}

export async function fetchAdminCollegeDetails(collegeId: string): Promise<CollegeAdminDetails> {
  const empty: CollegeAdminDetails = {
    branches: [],
    semesters: [],
    sections: [],
    faculty: [],
    subjects: [],
    timetable: [],
    calendar: [],
    holidays: [],
    students: []
  };

  if (!supabase || !collegeId) return empty;

  try {
    // 1. Branches
    const { data: branches } = await supabase.from("branches").select("*").eq("college_id", collegeId);
    
    // 2. Semesters (via branches join)
    const { data: semesters } = await supabase
      .from("semesters")
      .select("*, branches(id, name, college_id)")
      .eq("branches.college_id", collegeId);

    // 3. Sections (via semesters -> branches join)
    const { data: sections } = await supabase
      .from("sections")
      .select("*, semesters(id, name, branches(id, name, college_id))")
      .eq("semesters.branches.college_id", collegeId);

    // 4. Faculty
    const { data: faculty } = await supabase.from("faculty").select("*").eq("college_id", collegeId);

    // 5. Subjects
    const { data: subjects } = await supabase
      .from("subjects")
      .select("*, faculty(id, name)")
      .eq("college_id", collegeId);

    // 6. Timetable
    const { data: timetable } = await supabase
      .from("timetable")
      .select("*, subjects(id, name, college_id)")
      .eq("subjects.college_id", collegeId);

    // 7. Academic Calendar
    const { data: calendar } = await supabase.from("academic_calendar").select("*").eq("college_id", collegeId);

    // 8. Holidays
    const { data: holidays } = await supabase.from("holidays").select("*").eq("college_id", collegeId);

    // 9. Students (with profiles info)
    const { data: students } = await supabase
      .from("students")
      .select("*, profiles(id, email, full_name)")
      .eq("college_id", collegeId);

    return {
      branches: branches || [],
      semesters: semesters?.filter(s => s.branches) || [],
      sections: sections?.filter(s => s.semesters?.branches) || [],
      faculty: faculty || [],
      subjects: subjects || [],
      timetable: timetable?.filter(t => t.subjects) || [],
      calendar: calendar || [],
      holidays: holidays || [],
      students: students?.filter(s => s.profiles) || []
    };
  } catch (err) {
    console.error("Error in fetchAdminCollegeDetails:", err);
    return empty;
  }
}
