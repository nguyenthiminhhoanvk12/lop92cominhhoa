export type UserRole = 'teacher_admin' | 'teacher' | 'student' | 'parent';
export type AccountStatus = 'active' | 'locked' | 'disabled';

export interface UserProfile {
  id: string;
  username: string;
  password?: string;
  email?: string;
  displayName: string;
  role: UserRole;
  status: AccountStatus;
  phone?: string;
  teacherId?: string;
  classId?: string;
  className?: string;
  grade?: string;
  schoolId?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolWard?: string;
  schoolCity?: string;
  schoolYearId?: string;
  schoolYear?: string;
  studentId?: string; // For student or parent
  linkedStudentIds?: string[]; // Parents can link to multiple students
  linkedStudentName?: string;
  avatarUrl?: string;
  lastLoginAt?: string;
  isAdmin?: boolean; // Teacher = Admin
  createdAt?: string;
  updatedAt?: string;
}

export interface SchoolYear {
  id: string;
  name: string; // e.g. "2026 - 2027", "2025 - 2026"
  isCurrent: boolean;
}

export interface HomeroomClass {
  id: string;
  name: string; // e.g. "8A1"
  grade: string; // e.g. "8" or "Khối 8"
  schoolYear: string; // e.g. "2026 - 2027"
  schoolYearId?: string;
  schoolId?: string;
  schoolName?: string;
  schoolAddress?: string;
  schoolWard?: string;
  schoolCity?: string;
  teacherId: string;
  teacherName: string;
  room?: string;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  studentId?: string;
  classId: string;
  teacherId?: string;
  schoolId?: string;
  schoolYearId?: string;
  schoolYear: string;
  fullName: string;
  studentCode: string;
  dob: string; // YYYY-MM-DD
  gender: 'Nam' | 'Nữ' | 'Khác';
  address: string;
  phone?: string;
  fatherName?: string;
  motherName?: string;
  parentPhone: string;
  parentEmail?: string;
  userId?: string; // Linked Firebase Auth UID
  status: 'active' | 'transferred' | 'suspended';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  parentId?: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  teacherId?: string;
  schoolId?: string;
  schoolYearId?: string;
  fullName: string;
  relationship: 'Cha' | 'Mẹ' | 'Người giám hộ' | 'Bố';
  phone: string;
  email?: string;
  userId?: string; // Linked Firebase Auth UID
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'excused' | 'unexcused' | 'late';

export interface StudentAttendanceItem {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  recordedBy: string;
  records: StudentAttendanceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ScoreConfig {
  id: string;
  classId: string;
  name: string; // e.g., "Miệng", "15 phút", "1 tiết", "Giữa kỳ", "Cuối kỳ"
  code: string;
  weight: number; // e.g., 1, 2, 3
  maxScore: number; // default 10
}

export interface Score {
  id: string;
  classId: string;
  schoolYear: string;
  studentId: string;
  studentName: string;
  subject: string; // e.g. "Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý", "Hóa Học", "Sinh Học", "Lịch Sử", "Địa Lý", "GDCD", "Tin Học"
  scoreType: string; // e.g. "Điểm thường xuyên", "Giữa kỳ", "Cuối kỳ"
  scoreValue: number; // 0 - 10
  maxScore: number;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionRule {
  id: string;
  classId?: string;
  title: string;
  points: number; // e.g. +1, +2, -1, -3
  type: 'bonus' | 'penalty';
  category: string; // "Học tập", "Nề nếp", "Chuyên cần", "Phong trào"
  createdAt?: string;
}

export interface CompetitionEntry {
  id: string;
  classId: string;
  studentId: string;
  studentName: string;
  ruleId?: string;
  ruleTitle: string;
  points: number;
  type: 'bonus' | 'penalty';
  note?: string;
  date: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyReport {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  type: 'class' | 'student';
  studentId?: string;
  studentName?: string;
  academicStatus?: string;
  disciplineStatus?: string;
  hygieneStatus?: string;
  attendanceSummary?: string;
  notes: string;
  highlights?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  classId: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'students' | 'parents' | 'student_specific';
  targetStudentId?: string;
  targetStudentName?: string;
  authorName: string;
  authorId: string;
  priority: 'normal' | 'high' | 'urgent';
  date: string;
  readBy: string[]; // List of user IDs or student IDs that acknowledged
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  classId: string;
  teacherId: string;
  teacherName: string;
  parentId?: string;
  parentName?: string;
  studentId: string;
  studentName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadTeacher: number;
  unreadParent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  classId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  content: string;
  createdAt: string;
}

export interface StudentAttentionAlert {
  student: Student;
  reasons: string[];
  absenceCount: number;
  averageScore?: number;
  competitionPoints: number;
  level: 'warning' | 'critical' | 'info';
}
