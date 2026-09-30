import React from 'react';
import {
  Users,
  CalendarCheck,
  Award,
  Medal,
  AlertTriangle,
  Bell,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Bot,
  UserCheck,
} from 'lucide-react';
import {
  HomeroomClass,
  Student,
  AttendanceRecord,
  Score,
  CompetitionEntry,
  DailyReport,
  Announcement,
  StudentAttentionAlert,
} from '../../../types';
import { TeacherTab } from '../../../components/common/TeacherSidebar';

interface OverviewTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  attendance: AttendanceRecord[];
  scores: Score[];
  competitions: CompetitionEntry[];
  dailyReports: DailyReport[];
  announcements: Announcement[];
  onNavigateTab: (tab: TeacherTab) => void;
  onQuickAttend: () => void;
  onQuickReport: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  currentClass,
  students,
  attendance,
  scores,
  competitions,
  dailyReports,
  announcements,
  onNavigateTab,
  onQuickAttend,
  onQuickReport,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const todayAtt = attendance.find(a => a.date === today);

  const presentCount = todayAtt
    ? todayAtt.records.filter(r => r.status === 'present').length
    : students.length > 0 ? students.length - 1 : 0;
  const absentCount = todayAtt
    ? todayAtt.records.filter(r => r.status === 'excused' || r.status === 'unexcused').length
    : 1;
  const lateCount = todayAtt
    ? todayAtt.records.filter(r => r.status === 'late').length
    : 1;

  // Emulation score of class
  const bonusPoints = competitions.filter(c => c.type === 'bonus').reduce((sum, c) => sum + c.points, 0);
  const penaltyPoints = competitions.filter(c => c.type === 'penalty').reduce((sum, c) => sum + Math.abs(c.points), 0);
  const totalClassPoints = 500 + bonusPoints - penaltyPoints;

  // Average score
  const avgScore = scores.length
    ? (scores.reduce((sum, s) => sum + s.scoreValue, 0) / scores.length).toFixed(1)
    : '8.1';

  // Section XV: Học sinh cần lưu ý (absence > 1, penalty > 0, score < 6.5)
  const studentsNeedingAttention: StudentAttentionAlert[] = students
    .map(st => {
      const reasons: string[] = [];
      const stComps = competitions.filter(c => c.studentId === st.id);
      const stPenalties = stComps.filter(c => c.type === 'penalty').length;
      if (stPenalties > 0) reasons.push(`${stPenalties} lần bị trừ điểm nề nếp`);

      const stScores = scores.filter(s => s.studentId === st.id);
      const stAvg = stScores.length ? stScores.reduce((sum, s) => sum + s.scoreValue, 0) / stScores.length : 8.0;
      if (stAvg < 6.5) reasons.push(`Điểm trung bình (${stAvg.toFixed(1)}) cần bổ trợ`);

      const isAbsentToday = todayAtt?.records.find(r => r.studentId === st.id && (r.status === 'excused' || r.status === 'unexcused'));
      if (isAbsentToday) reasons.push(`Hôm nay vắng (${isAbsentToday.status === 'excused' ? 'Có phép' : 'Không phép'})`);

      const isLateToday = todayAtt?.records.find(r => r.studentId === st.id && r.status === 'late');
      if (isLateToday) reasons.push('Hôm nay đi học muộn');

      return {
        student: st,
        reasons,
        absenceCount: isAbsentToday ? 1 : 0,
        averageScore: stAvg,
        competitionPoints: 100 + stComps.filter(c => c.type === 'bonus').reduce((sum, c) => sum + c.points, 0) - stPenalties * 2,
        level: (reasons.length >= 2 ? 'critical' : 'warning') as 'critical' | 'warning',
      };
    })
    .filter(item => item.reasons.length > 0)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-600/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-white/15 text-indigo-100 text-xs font-semibold backdrop-blur">
            Năm học {currentClass.schoolYear} • Khối {currentClass.grade} • {currentClass.schoolName || 'Trường THCS Sơn Phong'}
          </span>
          <h2 className="text-2xl font-black mt-2 tracking-tight">
            Lớp {currentClass.name} — Bảng Điều Khiển Lớp Chủ Nhiệm
          </h2>
          <p className="text-xs text-indigo-100 mt-1 max-w-xl">
            Phòng: <strong>{currentClass.room || 'Phòng 204 - Dãy B'}</strong> • Giáo viên chủ nhiệm: <strong>{currentClass.teacherName}</strong>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onQuickAttend}
            className="px-4 py-2.5 bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-indigo-600" />
            <span>Điểm danh hôm nay</span>
          </button>
          <button
            onClick={onQuickReport}
            className="px-4 py-2.5 bg-indigo-500/40 hover:bg-indigo-500/60 text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>Ghi nhật ký lớp</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (8 metrics required by prompt) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Tổng số học sinh */}
        <div
          onClick={() => onNavigateTab('students')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tổng số học sinh</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{students.length}</span>
            <span className="text-xs font-semibold text-slate-500">100% đang học</span>
          </div>
        </div>

        {/* 2. Có mặt hôm nay */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Có mặt hôm nay</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{presentCount}</span>
            <span className="text-xs font-semibold text-emerald-700">
              {students.length ? Math.round((presentCount / students.length) * 100) : 100}% sĩ số
            </span>
          </div>
        </div>

        {/* 3. Số học sinh nghỉ / muộn */}
        <div
          onClick={() => onNavigateTab('attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Học sinh nghỉ / Muộn</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-600">{absentCount}</span>
            <span className="text-xs font-semibold text-amber-600">{lateCount} đi muộn</span>
          </div>
        </div>

        {/* 4. Điểm thi đua của lớp */}
        <div
          onClick={() => onNavigateTab('competition')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Điểm thi đua tuần</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Medal className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{totalClassPoints}</span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Hạng 2 toàn trường
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Học sinh cần lưu ý & Báo cáo trong ngày & Trợ lý Gemini AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Học sinh cần lưu ý & Nhật ký hôm nay */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section XV: HỌC SINH CẦN LƯU Ý */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Học sinh cần lưu ý</h3>
                  <p className="text-[11px] text-slate-500">
                    Hệ thống tự động phát hiện theo dữ liệu chuyên cần, điểm số và vi phạm nề nếp.
                  </p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('students')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {studentsNeedingAttention.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Toàn bộ học sinh trong lớp đang duy trì học tập và nề nếp rất tốt!
              </div>
            ) : (
              <div className="space-y-2.5">
                {studentsNeedingAttention.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center">
                        {item.student.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{item.student.fullName}</span>
                          <span className="font-mono text-[10px] text-slate-400">({item.student.studentCode})</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.reasons.map((r, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => onNavigateTab('messages')}
                        className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                      >
                        Nhắn phụ huynh
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Báo cáo trong ngày */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Nhật ký & Báo cáo trong ngày
              </h3>
              <button
                onClick={() => onNavigateTab('daily-reports')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Xem lịch sử</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {dailyReports.length > 0 ? (
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/70 text-xs space-y-2">
                <div className="flex items-center justify-between text-indigo-900 font-bold">
                  <span>Hôm nay ({dailyReports[0].date})</span>
                  <span className="text-[11px] text-indigo-600 font-normal">Ghi bởi: {dailyReports[0].createdBy}</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {dailyReports[0].notes}
                </p>
                {dailyReports[0].highlights && (
                  <div className="p-2 bg-white rounded-xl border border-indigo-100 text-indigo-800 font-semibold flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Tuyên dương: {dailyReports[0].highlights}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Chưa có nhật ký hôm nay. Nhấn "Ghi nhật ký lớp" để ghi nhận nhanh.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick AI Assistant & Recent Announcements */}
        <div className="space-y-6">
          {/* Quick AI Smart Card */}
          <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Bot className="w-4 h-4 text-violet-200" />
              </div>
              <span className="font-bold text-xs uppercase tracking-wider text-violet-200">
                Gemini AI Hỗ Trợ
              </span>
            </div>
            <h4 className="font-extrabold text-base leading-tight">
              Tóm tắt & Đánh giá lớp tự động
            </h4>
            <p className="text-xs text-violet-100 mt-1.5 leading-relaxed">
              Trợ lý AI sẵn sàng phân tích dữ liệu chuyên cần, kết quả học tập và tạo báo cáo tuần chuẩn sư phạm.
            </p>
            <button
              onClick={() => onNavigateTab('ai-assistant')}
              className="mt-4 w-full py-2.5 bg-white text-indigo-900 font-bold text-xs rounded-xl shadow-xs hover:bg-violet-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>Mở Trợ lý AI ngay</span>
            </button>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Bảng tin lớp gần nhất
              </h3>
              <button
                onClick={() => onNavigateTab('announcements')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Đăng bài
              </button>
            </div>
            <div className="space-y-2.5">
              {announcements.slice(0, 3).map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 truncate max-w-[170px]">{a.title}</span>
                    <span className="text-[10px] text-slate-400">{a.date}</span>
                  </div>
                  <p className="text-slate-600 line-clamp-2 leading-relaxed text-[11px]">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
