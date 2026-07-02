export interface Profile {
  id?: string;
  fullName: string;
  collegeName: string;
  college_id?: string;
  branch: string;
  branch_id?: string;
  year: string;
  semester: string;
  semester_id?: string;
  section_id?: string;
  section?: string;
  attendanceRequirement: number; // Default 75
  onboarded: boolean;
  email: string;
  role: 'Student' | 'College Admin' | 'student' | 'admin' | 'super_admin';
  student_id?: string;
  admin_id?: string;
  studentIdCode?: string;
  collegeEmail?: string;
}

export interface Subject {
  id: string;
  name: string;
  faculty: string;
  faculty_id?: string;
  attended: number;
  total: number;
  streak: number; // current consecutive presents
  college_id?: string;
  branch_id?: string;
  semester_id?: string;
}

export interface TimetableSlot {
  id: string;
  subjectId: string; // references Subject.id or can be manual text
  subjectName: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "09:50"
  room?: string;
  color?: string; // Hex or tailwind class for calendar styling
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string; // ISO string
  type: 'danger' | 'warning' | 'success' | 'info';
  read: boolean;
  college_id?: string;
  recipient_student_id?: string;
}

export interface ActivityLog {
  id: string;
  subjectName: string;
  action: 'present' | 'absent' | 'added' | 'deleted' | 'updated';
  timestamp: string; // ISO string
}

