import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  CalendarCheck,
  Award,
  Medal,
  Bell,
  MessageSquare,
  FileText,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
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

export const ParentDashboard: React.FC = () => {
  const { userProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'attendance' | 'competition' | 'reports' | 'messages'>('overview');

  const [classInfo, setClassInfo] = useState<HomeroomClass | null>(null);
  const [childInfo, setChildInfo] = useState<Student>({
    id: userProfile?.studentId || 'HS8A101',
    classId: '8A1',
    schoolYear: '2026 - 2027',
    fullName: 'Nguyễn Văn An',
    studentCode: 'HS8A101',
    dob: '2012-03-15',
    gender: 'Nam',
    address: 'Phường Sơn Phong, TP. Hội An',
    phone: '0912345601',
    parentPhone: '0987654301',
    fatherName: 'Nguyễn Văn Hùng',
    motherName: 'Trần Thị Mai',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [scores, setScores] = useState<Score[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  const teacherContact = {
    name: classInfo?.teacherName || 'Nguyễn Thị Minh Hòa',
    role: `GVCN lớp ${classInfo?.name || '8A1'} - ${classInfo?.schoolName || 'Trường THCS Sơn Phong'}`,
    phone: '0912.345.678',
    email: 'nguyenthiminhhoanvk12@gmail.com',
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const classList = await getClasses();
        const activeClass = classList?.[0] || null;
        setClassInfo(activeClass);

        const classId = activeClass?.id || 'class-8a1';
        const classStudents = activeClass ? await getStudentsByClass(activeClass.id) : [];

        // Identify which student belongs to this parent
        let student = classStudents.find(
          (s) =>
            s.id === userProfile?.studentId ||
            (userProfile?.linkedStudentIds && userProfile.linkedStudentIds.includes(s.id)) ||
            (s.parentPhone && userProfile?.phone && s.parentPhone === userProfile.phone) ||
            (s.parentPhone && userProfile?.username && s.parentPhone === userProfile.username)
        );

        if (!student && classStudents.length > 0) {
          student = classStudents[0];
        }

        if (student) {
          setChildInfo(student);
        }

        const studentId = student?.id || childInfo.id;
        const studentFullName = student?.fullName || childInfo.fullName;

        const fetchedScores = await getScoresByStudent(studentId);
        setScores(fetchedScores || []);

        const fetchedAnn = await getAnnouncements(classId);
        setAnnouncements(fetchedAnn || []);

        const fetchedReports = await getDailyReports(classId);
        setDailyReports(fetchedReports || []);

        const fetchedComp = await getCompetitionsByClass(classId);
        setCompetitions(fetchedComp?.filter(c => c.studentId === studentId || c.studentName === studentFullName) || []);

        const fetchedAtt = await getAttendanceHistory(classId);
        setAttendance(fetchedAtt || []);

        const teacherId = activeClass?.teacherId || 'demo-teacher-01';
        const teacherName = activeClass?.teacherName || 'Nguyễn Thị Minh Hòa';
        const conv = await getOrCreateConversation(
          classId,
          teacherId,
          teacherName,
          studentId,
          studentFullName,
          userProfile?.displayName || 'Phụ huynh em ' + studentFullName
        );
        setConversation(conv);
      } catch (err) {
        console.error('Error loading parent dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userProfile]);

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
        userProfile?.id || 'parent',
        userProfile?.displayName || 'Phụ huynh em Nguyễn Văn An',
        'parent',
        conversation.teacherId,
        newMessageText.trim()
      );
      setNewMessageText('');
    } catch (err) {
      console.error('Send parent message error:', err);
    }
  };

  const averageScore = scores.length
    ? (scores.reduce((sum, s) => sum + s.scoreValue, 0) / scores.length).toFixed(1)
    : '8.4';

  const totalBonus = competitions.filter(c => c.type === 'bonus').reduce((sum, c) => sum + c.points, 0);
  const totalPenalty = competitions.filter(c => c.type === 'penalty').reduce((sum, c) => sum + Math.abs(c.points), 0);
  const netPoints = 100 + totalBonus - totalPenalty;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Banner */}
      <header className="bg-amber-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <UserCheck className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-800 text-amber-200 border border-amber-600/40">
                  CỔNG THÔNG TIN PHỤ HUYNH
                </span>
                <span className="text-xs text-amber-200">
                  Lớp {classInfo?.name || '8A1'} • {classInfo?.schoolName || 'Trường THCS Sơn Phong'} • Năm học {classInfo?.schoolYear || '2026 - 2027'}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                Sổ liên lạc điện tử: Em {childInfo.fullName} (Lớp {classInfo?.name || '8A1'})
              </h1>
              <p className="text-[11px] text-amber-200">
                GVCN: <strong>{classInfo?.teacherName || 'Nguyễn Thị Minh Hòa'}</strong> • SĐT: <strong>0912.345.678</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={signOut}
              className="px-3 py-1.5 bg-amber-800/80 hover:bg-amber-900 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto pt-2">
          {[
            { id: 'overview', label: 'Tổng quan của con' },
            { id: 'academics', label: 'Kết quả học tập' },
            { id: 'attendance', label: 'Chuyên cần' },
            { id: 'competition', label: 'Rèn luyện & Nề nếp' },
            { id: 'reports', label: 'Nhật ký & Báo cáo' },
            { id: 'messages', label: 'Trao đổi với GVCN' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap rounded-t-xl transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-slate-50 text-amber-950 shadow-sm'
                  : 'text-amber-100 hover:bg-amber-800/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Đang tải sổ liên lạc của con...</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Child & Teacher Summary Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 font-extrabold text-lg flex items-center justify-center border border-amber-200">
                      10A1
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{childInfo.fullName}</h2>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200">
                          Đang theo học
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Mã HS: <strong className="font-mono text-slate-700">{childInfo.studentCode}</strong> • Ngày sinh: {childInfo.dob} • Giới tính: {childInfo.gender}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <span>{teacherContact.name}</span>
                      <span className="text-[10px] font-normal text-slate-500">({teacherContact.role})</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> {teacherContact.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {teacherContact.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Indicators */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500">Điểm TB học kỳ</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{averageScore}</span>
                      <span className="text-xs font-bold text-emerald-600">Học lực Giỏi</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500">Chuyên cần tháng này</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-2xl font-black text-emerald-600">100%</span>
                      <span className="text-xs text-slate-500">Không nghỉ buổi nào</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500">Điểm rèn luyện / Thi đua</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-600">{netPoints}</span>
                      <span className="text-xs text-slate-500">Top 3 của lớp</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <span className="text-xs font-semibold text-slate-500">Nhắc nhở / Lưu ý</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-700">Tốt, không vi phạm</span>
                    </div>
                  </div>
                </div>

                {/* Recent Daily Notes */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    Nhật ký nhận xét hàng ngày từ GVCN
                  </h3>
                  {dailyReports.length > 0 ? (
                    dailyReports.slice(0, 3).map((r) => (
                      <div key={r.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 font-semibold">
                          <span>Ngày {r.date}</span>
                          <span>Người ghi: {r.createdBy}</span>
                        </div>
                        <p className="text-slate-800 font-medium leading-relaxed">{r.notes}</p>
                        {r.academicStatus && (
                          <p className="text-slate-600">📖 Học tập: {r.academicStatus}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">Chưa có nhật ký ghi nhận.</p>
                  )}
                </div>
              </div>
            )}

            {/* ACADEMICS TAB */}
            {activeTab === 'academics' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Chi tiết kết quả học tập của con</h3>
                    <p className="text-xs text-slate-500">Bảng điểm cập nhật liên tục từ giáo viên bộ môn và GVCN.</p>
                  </div>
                  <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 font-bold rounded-xl text-xs">
                    Điểm TB: {averageScore}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Môn học</th>
                        <th className="py-2.5 px-3">Đầu điểm</th>
                        <th className="py-2.5 px-3 text-center">Điểm số</th>
                        <th className="py-2.5 px-3">Lời phê của giáo viên</th>
                        <th className="py-2.5 px-3">Ngày kiểm tra</th>
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
                          <td className="py-3 px-3 text-slate-600 italic">{sc.note || 'Làm bài tốt'}</td>
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
                <h3 className="text-base font-bold text-slate-900">Chi tiết chuyên cần & Điểm danh</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-xl font-bold text-emerald-700">22</span>
                    <p className="text-[11px] text-emerald-600">Số buổi có mặt</p>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <span className="text-xl font-bold text-amber-700">0</span>
                    <p className="text-[11px] text-amber-600">Nghỉ có phép</p>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                    <span className="text-xl font-bold text-rose-700">0</span>
                    <p className="text-[11px] text-rose-600">Nghỉ không phép</p>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                    <span className="text-xl font-bold text-indigo-700">0</span>
                    <p className="text-[11px] text-indigo-600">Đi học muộn</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden text-xs">
                  {attendance.map((att) => (
                    <div key={att.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-slate-800">Ngày {att.date}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-700">
                        Có mặt
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* COMPETITION TAB */}
            {activeTab === 'competition' && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Thi đua & Rèn luyện đạo đức nề nếp</h3>
                  <div className="text-right">
                    <span className="text-2xl font-black text-amber-600">{netPoints}</span>
                    <span className="text-xs text-slate-400 block">Tổng điểm rèn luyện</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {competitions.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{c.ruleTitle}</p>
                        <p className="text-slate-500">{c.note || 'GVCN ghi nhận'} • {c.date}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-100 text-emerald-700">
                        +{c.points} điểm
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">Báo cáo & Thông báo chung của lớp</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {announcements.map((a) => (
                    <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {a.targetAudience === 'all' ? 'Toàn thể phụ huynh & học sinh' : 'Dành cho phụ huynh'}
                        </span>
                        <span className="text-xs text-slate-400">{a.date}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{a.title}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{a.content}</p>
                      <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100">
                        Giáo viên đăng: <strong>{a.authorName}</strong>
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
                    <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-xs">
                      GV
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{teacherContact.name} (GVCN)</h4>
                      <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đang hoạt động • Kênh bảo mật phụ huynh & GVCN
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                  {messages.map((m) => {
                    const isMe = m.senderRole === 'parent';
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                          isMe
                            ? 'bg-amber-600 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                        }`}>
                          <p className="font-medium">{m.content}</p>
                          <span className={`text-[9px] block mt-1 ${isMe ? 'text-amber-100' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Nhắn tin riêng với cô giáo chủ nhiệm..."
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs transition cursor-pointer"
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
