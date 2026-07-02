import { Subject, Profile, TimetableSlot, Notification, ActivityLog } from "./types";

// Precise attendance math for WeBunk
export interface AttendanceStats {
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  safeBunks: number;
  requiredToAttend: number;
  message: string;
}

export function calculateSubjectStats(
  attended: number,
  total: number,
  requirement: number
): AttendanceStats {
  if (total === 0) {
    return {
      percentage: 100,
      status: 'safe',
      safeBunks: 0,
      requiredToAttend: 0,
      message: "No classes held yet. You are safe!"
    };
  }

  const percentage = (attended / total) * 100;

  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (percentage < requirement) {
    status = 'danger';
  } else if (percentage < requirement + 5) {
    status = 'warning';
  }

  let safeBunks = 0;
  let requiredToAttend = 0;
  let message = "";

  if (percentage >= requirement) {
    // Math: (attended / (total + B)) >= req / 100
    // B <= (attended * 100 - req * total) / req
    const maxB = Math.floor((attended * 100 - requirement * total) / requirement);
    safeBunks = Math.max(0, maxB);
    if (safeBunks > 0) {
      message = `You can safely bunk ${safeBunks} more class${safeBunks > 1 ? 'es' : ''}.`;
    } else {
      message = "You are on the limit! Attending the next class is highly recommended.";
    }
  } else {
    // Math: ((attended + C) / (total + C)) >= req / 100
    // C >= (req * total - attended * 100) / (100 - req)
    const minC = Math.ceil((requirement * total - attended * 100) / (100 - requirement));
    requiredToAttend = Math.max(0, minC);
    message = `You need to attend the next ${requiredToAttend} class${requiredToAttend > 1 ? 'es' : ''} to recover.`;
  }

  return {
    percentage,
    status,
    safeBunks,
    requiredToAttend,
    message
  };
}

// Global statistics helper
export function calculateOverallStats(subjects: Subject[], requirement: number) {
  let totalAttended = 0;
  let totalClasses = 0;

  subjects.forEach(s => {
    totalAttended += s.attended;
    totalClasses += s.total;
  });

  const percentage = totalClasses > 0 ? (totalAttended / totalClasses) * 100 : 100;
  
  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (percentage < requirement) {
    status = 'danger';
  } else if (percentage < requirement + 5) {
    status = 'warning';
  }

  // Calculate global safe bunks or required attendances
  let safeBunks = 0;
  let requiredToAttend = 0;

  if (percentage >= requirement) {
    const maxB = Math.floor((totalAttended * 100 - requirement * totalClasses) / requirement);
    safeBunks = Math.max(0, maxB);
  } else {
    const minC = Math.ceil((requirement * totalClasses - totalAttended * 100) / (100 - requirement));
    requiredToAttend = Math.max(0, minC);
  }

  return {
    totalAttended,
    totalClasses,
    percentage,
    status,
    safeBunks,
    requiredToAttend
  };
}

// Default Seed Data
export const DEFAULT_PROFILE: Profile = {
  fullName: "",
  collegeName: "",
  branch: "",
  year: "",
  semester: "",
  attendanceRequirement: 75,
  onboarded: false,
  email: "",
  role: 'Student'
};

export const DEFAULT_SUBJECTS: Subject[] = [];

export const DEFAULT_TIMETABLE: TimetableSlot[] = [];

export const DEFAULT_NOTIFICATIONS: Notification[] = [];

export const DEFAULT_ACTIVITY: ActivityLog[] = [];
