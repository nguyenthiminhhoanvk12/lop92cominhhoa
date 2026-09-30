import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  Medal,
  Bell,
  MessageSquare,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  User,
  Star,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  Student,
  Score,
  AttendanceRecord,
  CompetitionEntry,
  Announcement,
  DailyReport,
  Conversation,
  Message,
} from '../../types';
import {
  getClasses,
  getStudentsByClass,
  getScoresByStudent,
  getAttendanceHistory,
  getCompetitionsByClass,
  getAnnouncements,
  getDailyReports,
  getOrCreateConversation,
  subscribeToMessages,
  sendMessage,
} from '../../services/firestoreService';
import { HomeroomClass } from '../../types';

export const StudentDashboard: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'scores' | 'attendance' | 'competition' | 'announcements' | 'messages'>('overview');

  const [classInfo, setClassInfo] = useState<HomeroomClass | null>(null);
  const [studentInfo, setStudentInfo] = useState<Student | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  // Load student data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const classList = await getClasses();
        const activeClass = classList?.[0] || null;
        setClassInfo(activeClass);

        const classId = activeClass?.id || 'class-8a1';
        const classStudents = activeClass ? await getStudentsByClass(activeClass.id) : [];

        // Identify which student is logged in
        let currentStudent = classStudents.find(
          (s) =>
            s.id === userProfile?.studentId ||
            s.studentCode.toLowerCase() === userProfile?.username?.toLowerCase() ||
            s.fullName === userProfile?.displayName
        );

        if (!currentStudent && classStudents.length > 0) {
          currentStudent = classStudents[0];
        }

        const fallbackStudent: Student = {
          id: currentStudent?.id || userProfile?.studentId || 'HS8A101',
          classId,
          schoolYear: activeClass?.schoolYear || '2026 - 2027',
          fullName: currentStudent?.fullName || userProfile?.displayName || 'Nguyễn Văn An',
          studentCode: currentStudent?.studentCode || 'HS8A101',
          dob: currentStudent?.dob || '2012-03-15',
          gender: currentStudent?.gender || 'Nam',
          address: currentStudent?.address || 'Phường Sơn Phong, TP. Hội An',
          phone: currentStudent?.phone || '0912345601',
          parentPhone: currentStudent?.parentPhone || '0987654301',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const activeStudent = currentStudent || fallbackStudent;
        setStudentInfo(activeStudent);

        // Fetch scores
        const fetchedScores = await getScoresByStudent(activeStudent.id);
        setScores(fetchedScores || []);

        // Fetch announcements & daily reports
        const fetchedAnn = await getAnnouncements(classId);
        setAnnouncements(fetchedAnn || []);

        const fetchedReports = await getDailyReports(classId);
        setDailyReports(fetchedReports || []);

        // Fetch competitions
        const fetchedComp = await getCompetitionsByClass(classId);
        setCompetitions(fetchedComp?.filter(c => c.studentId === activeStudent.id || c.studentName === activeStudent.fullName) || []);

        // Fetch attendance
        const fetchedAtt = await getAttendanceHistory(classId);
        setAttendance(fetchedAtt || []);

        // Setup chat conversation with homeroom teacher
        const teacherId = activeClass?.teacherId || 'demo-teacher-01';
        const teacherName = activeClass?.teacherName || 'Nguyễn Thị Minh Hòa';
        const conv = await getOrCreateConversation(classId, teacherId, teacherName, activeStudent.id, activeStudent.fullName);
        setConversation(conv);
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userProfile]);

  // Subscribe to chat messages
  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = subscribeToMessages(conversation.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !conversation) return;
    try {
      await sendMessage(
        conversation.id,
        conversation.classId,
        studentInfo?.id || 'student',
        studentInfo?.fullName || 'Học sinh',
        'student',
        conversation.teacherId,
        newMessageText.trim()
      );
      setNewMessageText('');
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  // Calculations
  const averageScore = scores.length
    ? (scores.reduce((sum, s) => sum + s.scoreValue, 0) / scores.length).toFixed(1)
    : '8.4';

  const totalBonus = competitions.filter(c => c.type === 'bonus').reduce((sum, c) => sum + c.points, 0);
  const totalPenalty = competitions.filter(c => c.type === 'penalty').reduce((sum, c) => sum + Math.abs(c.points), 0);
  const netPoints = 100 + totalBonus - totalPenalty;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner */}
      <header className="bg-emerald-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <GraduationCap className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-200 border border-emerald-600/40">
                  CỔNG THÔNG TIN HỌC SINH
                </span>
                <span className="text-xs text-emerald-200">
                  Lớp {classInfo?.name || '8A1'} • {classInfo?.schoolName || 'Trường THCS Sơn Phong'} • Năm học {classInfo?.schoolYear || '2026 - 2027'}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                Xin chào, {studentInfo?.fullName || userProfile?.displayName}! 👋
              </h1>
              <p className="text-[11px] text-emerald-200">
                GVCN: <strong>{classInfo?.teacherName || 'Nguyễn Thị Minh Hòa'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-emerald-200">Mã học sinh</p>
              <p className="text-sm font-mono font-bold">{studentInfo?.studentCode || 'HS8A101'}</p>
            </div>
            <button
              onClick={signOut}
              className="px-3 py-1.5 bg-emerald-800/80 hover:bg-emerald-900 text-xs font-semibold rounded-lg transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto pt-2">
          {[
            { id: 'overview', label: 'Tổng quan' },
            { id: 'scores', label: 'Bảng điểm' },
            { id: 'attendance', label: 'Chuyên cần' },
            { id: 'competition', label: 'Điểm thi đua' },
            { id: 'announcements', label: 'Bảng tin lớp' },
            { id: 'messages', label: 'Hỏi thầy/cô' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-50 text-emerald-900 shadow-sm'
                  : 'text-emerald-100 hover:bg-emerald-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Đang tải dữ liệu học tập...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-semibold">Điểm TB học tập</span>
                      <Award className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{averageScore}</span>
                      <span className="text-xs text-emerald-600 font-bold">Xếp loại: Giỏi</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-semibold">Chuyên cần hôm nay</span>
                      <CalendarCheck className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="text-sm font-bold text-slate-800">Có mặt đúng giờ</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-semibold">Điểm thi đua nề nếp</span>
                      <Medal className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-600">{netPoints}</span>
                      <span className="text-xs text-slate-500 font-medium">Hạng 3 / 12</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                      <span className="text-xs font-semibold">Thông báo mới</span>
                      <Bell className="w-4 h-4 text-rose-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{announcements.length}</span>
                      <span className="text-xs text-slate-500">bài đăng gần đây</span>
                    </div>
                  </div>
                </div>

                {/* Timetable & Tasks */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Recent Daily Report & Teacher Advice */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-600" />
                          Nhận xét & Báo cáo từ Giáo viên chủ nhiệm
                        </h3>
                        <span className="text-xs text-slate-400">Gần nhất</span>
                      </div>
                      {dailyReports.length > 0 ? (
                        <div className="space-y-3">
                          {dailyReports.slice(0, 2).map((r) => (
                            <div key={r.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                              <div className="flex items-center justify-between text-slate-500 mb-1 font-semibold">
                                <span>Ngày {r.date} • {r.createdBy}</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed font-medium">{r.notes}</p>
                              {r.highlights && (
                                <p className="mt-1 text-emerald-700 font-semibold">⭐ {r.highlights}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-4 text-center">Chưa có nhận xét nào được ghi.</p>
                      )}
                    </div>

                    {/* Schedule / Timetable Preview */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                      <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        Lịch học ngày hôm nay (Thứ Tư)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                        {[
                          { period: 'Tiết 1', subject: 'Toán học', teacher: 'Thầy Cường', room: 'A203' },
                          { period: 'Tiết 2', subject: 'Ngữ Văn', teacher: 'Cô Thảo', room: 'A203' },
                          { period: 'Tiết 3', subject: 'Tiếng Anh', teacher: 'Cô Lan', room: 'A203' },
                          { period: 'Tiết 4', subject: 'Vật Lý', teacher: 'Thầy Minh', room: 'Lab 1' },
                          { period: 'Tiết 5', subject: 'Tin Học', teacher: 'Thầy Tuấn', room: 'Phòng Máy 2' },
                        ].map((p, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col justify-between">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase">{p.period}</span>
                            <span className="font-bold text-slate-800 my-1">{p.subject}</span>
                            <span className="text-[10px] text-slate-500">{p.teacher}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right 1 Col: Latest Announcements */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-3">
                      <Bell className="w-4 h-4 text-amber-500" />
                      Thông báo từ lớp
                    </h3>
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {announcements.slice(0, 3).map((a) => (
                        <div key={a.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 truncate max-w-[180px]">{a.title}</span>
                            <span className="text-[10px] text-slate-400">{a.date}</span>
                          </div>
                          <p className="text-slate-600 line-clamp-3 leading-relaxed">{a.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCORES TAB */}
            {activeTab === 'scores' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Bảng kết quả học tập cá nhân</h3>
                    <p className="text-xs text-slate-500">Chỉ học sinh và phụ huynh em mới có quyền xem bảng điểm này.</p>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
                    Điểm TB: {averageScore} / 10
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Môn học</th>
                        <th className="py-2.5 px-3">Loại điểm</th>
                        <th className="py-2.5 px-3 text-center">Điểm số</th>
                        <th className="py-2.5 px-3">Nhận xét của giáo viên</th>
                        <th className="py-2.5 px-3">Ngày nhập</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {scores.map((sc) => (
                        <tr key={sc.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-800">{sc.subject}</td>
                          <td className="py-3 px-3 text-slate-600">{sc.scoreType}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                              sc.scoreValue >= 8.0 ? 'bg-emerald-100 text-emerald-800' : sc.scoreValue >= 6.5 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {sc.scoreValue.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 italic">{sc.note || '—'}</td>
                          <td className="py-3 px-3 text-slate-400">{sc.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ATTENDANCE TAB */}
            {activeTab === 'attendance' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-slate-900">Lịch sử chuyên cần cá nhân</h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-xl font-bold text-emerald-700">100%</span>
                    <p className="text-[11px] text-emerald-600 font-medium">Tỷ lệ đi học</p>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                    <span className="text-xl font-bold text-indigo-700">22</span>
                    <p className="text-[11px] text-indigo-600 font-medium">Buổi có mặt</p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <span className="text-xl font-bold text-amber-700">0</span>
                    <p className="text-[11px] text-amber-600 font-medium">Nghỉ có phép</p>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                    <span className="text-xl font-bold text-rose-700">0</span>
                    <p className="text-[11px] text-rose-600 font-medium">Nghỉ không phép / Muộn</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                  {attendance.map((att) => {
                    const record = att.records.find(r => r.studentId === studentInfo?.id || r.studentName === studentInfo?.fullName);
                    return (
                      <div key={att.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="font-semibold text-slate-800">Ngày {att.date}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700">
                          {record?.status === 'present' ? 'Có mặt' : record?.status === 'excused' ? 'Nghỉ có phép' : 'Có mặt'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* COMPETITION TAB */}
            {activeTab === 'competition' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Thi đua & Rèn luyện nề nếp</h3>
                    <p className="text-xs text-slate-500">Điểm khởi đầu 100 điểm, cộng/trừ theo các hành vi tích cực hoặc nhắc nhở.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-600">{netPoints}</span>
                    <span className="text-xs text-slate-400 block">Tổng điểm rèn luyện</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {competitions.length > 0 ? (
                    competitions.map((c) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{c.ruleTitle}</p>
                          <p className="text-slate-500">{c.note || 'Theo ghi nhận GVCN'} • Ngày {c.date}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                          c.type === 'bonus' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {c.points > 0 ? `+${c.points}` : c.points} điểm
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Chưa có ghi nhận thi đua riêng. Em đang duy trì nề nếp rất tốt!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ANNOUNCEMENTS TAB */}
            {activeTab === 'announcements' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Bảng tin & Thông báo từ Giáo viên chủ nhiệm</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {announcements.map((a) => (
                    <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700">
                          {a.targetAudience === 'all' ? 'Toàn lớp' : 'Học sinh'}
                        </span>
                        <span className="text-xs text-slate-400">{a.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{a.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
                      <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                        Người đăng: <strong>{a.authorName}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MESSAGES TAB */}
            {activeTab === 'messages' && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[550px] overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                      GV
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Cô Nguyễn Thị Minh Hoàn (GVCN)</h4>
                      <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Kênh trao đổi riêng tư với giáo viên
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Hãy gửi lời chào hoặc câu hỏi thắc mắc tới thầy/cô chủ nhiệm.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === studentInfo?.id || m.senderRole === 'student';
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-tr-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                          }`}>
                            <p className="font-medium">{m.content}</p>
                            <span className={`text-[9px] block mt-1 ${isMe ? 'text-emerald-100' : 'text-slate-400'}`}>
                              {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Nhập tin nhắn gửi thầy/cô chủ nhiệm..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
