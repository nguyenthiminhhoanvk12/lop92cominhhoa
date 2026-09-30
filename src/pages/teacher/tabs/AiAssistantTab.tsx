import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  FileText,
  MessageSquare,
  Users,
  Award,
  Calendar,
  Send,
  Copy,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { HomeroomClass, Student, AttendanceRecord, Score, CompetitionEntry, DailyReport } from '../../../types';
import {
  summarizeClassSituation,
  generateWeeklyReport,
  draftStudentFeedback,
  draftParentNotification,
} from '../../../services/geminiService';
import { createAnnouncement } from '../../../services/firestoreService';

interface AiAssistantTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  attendance: AttendanceRecord[];
  scores: Score[];
  competitions: CompetitionEntry[];
  dailyReports: DailyReport[];
  teacherName: string;
  teacherId: string;
  onRefresh: () => void;
}

export const AiAssistantTab: React.FC<AiAssistantTabProps> = ({
  currentClass,
  students,
  attendance,
  scores,
  competitions,
  dailyReports,
  teacherName,
  teacherId,
  onRefresh,
}) => {
  const [activeTask, setActiveTask] = useState<'summary' | 'weeklyReport' | 'studentComment' | 'parentNotice'>('summary');
  const [loading, setLoading] = useState(false);
  const [outputContent, setOutputContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [announcementPosted, setAnnouncementPosted] = useState(false);

  // States for student comments
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');

  // States for parent notice
  const [noticeTopic, setNoticeTopic] = useState('Nhắc nhở chuẩn bị cho đợt kiểm tra giữa học kỳ');
  const [noticeDetails, setNoticeDetails] = useState('Đề nghị phụ huynh đôn đốc các con tự giác ôn tập theo đề cương và có mặt đúng giờ.');

  const handleGenerateSummary = async () => {
    setLoading(true);
    setOutputContent('');
    try {
      const res = await summarizeClassSituation({
        className: currentClass.name,
        students,
        attendance,
        scores,
        competitions,
        reports: dailyReports,
      });
      setOutputContent(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    setLoading(true);
    setOutputContent('');
    try {
      const res = await generateWeeklyReport({
        className: currentClass.name,
        weekNumber: 6,
        students,
        attendance,
        scores,
        competitions,
      });
      setOutputContent(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStudentComment = async () => {
    setLoading(true);
    setOutputContent('');
    try {
      const st = students.find(s => s.id === selectedStudentId);
      if (!st) return;
      const stScores = scores.filter(s => s.studentId === st.id);
      const stComps = competitions.filter(c => c.studentId === st.id);
      const res = await draftStudentFeedback(st, stScores, stComps);
      setOutputContent(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateParentNotice = async () => {
    setLoading(true);
    setOutputContent('');
    try {
      const res = await draftParentNotification(noticeTopic, noticeDetails, currentClass.name);
      setOutputContent(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!outputContent) return;
    navigator.clipboard.writeText(outputContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePostToAnnouncements = async () => {
    if (!outputContent) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      await createAnnouncement({
        classId: currentClass.id,
        title: noticeTopic || `Thông báo từ GVCN lớp ${currentClass.name}`,
        content: outputContent,
        targetAudience: 'parents',
        authorName: teacherName,
        authorId: teacherId,
        priority: 'high',
        date: today,
      });
      setAnnouncementPosted(true);
      setTimeout(() => setAnnouncementPosted(false), 3000);
      onRefresh();
    } catch (err) {
      console.error('Post announcement error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 p-6 rounded-3xl text-white shadow-lg shadow-violet-600/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-violet-200 text-[11px] font-bold backdrop-blur flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Gemini 2.5 Flash
            </span>
            <span className="text-xs text-violet-200">Bảo mật dữ liệu sư phạm</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Trợ Lý Giáo Viên Chủ Nhiệm Thông Minh</h2>
          <p className="text-xs text-violet-100 mt-1 max-w-xl">
            Tự động tổng hợp dữ liệu lớp học, soạn báo cáo tuần/tháng, viết nhận xét học bạ và dự thảo thông báo phụ huynh.
          </p>
        </div>
      </div>

      {/* Task Selector Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'summary', title: 'Tóm tắt tình hình lớp', icon: <Sparkles className="w-4 h-4 text-violet-600" /> },
          { id: 'weeklyReport', title: 'Soạn báo cáo tuần', icon: <FileText className="w-4 h-4 text-indigo-600" /> },
          { id: 'studentComment', title: 'Soạn nhận xét học bạ', icon: <Users className="w-4 h-4 text-emerald-600" /> },
          { id: 'parentNotice', title: 'Soạn thông báo phụ huynh', icon: <MessageSquare className="w-4 h-4 text-amber-600" /> },
        ].map((t) => {
          const active = activeTask === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTask(t.id as any);
                setOutputContent('');
              }}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                active
                  ? 'bg-white border-violet-400 ring-2 ring-violet-500/20 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="p-2 bg-slate-50 rounded-xl w-fit mb-2">{t.icon}</div>
              <span className="font-bold text-xs text-slate-900">{t.title}</span>
            </button>
          );
        })}
      </div>

      {/* Workspace */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
        {/* Controls based on active task */}
        {activeTask === 'summary' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Tóm tắt tình hình lớp {currentClass.name}</h3>
              <p className="text-xs text-slate-500">
                Gemini sẽ đọc dữ liệu sĩ số ({students.length} HS), chuyên cần hôm nay, điểm thi đua và đưa ra đánh giá toàn diện.
              </p>
            </div>
            <button
              onClick={handleGenerateSummary}
              disabled={loading}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{loading ? 'Đang phân tích...' : 'Bắt đầu tổng hợp'}</span>
            </button>
          </div>
        )}

        {activeTask === 'weeklyReport' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Soạn thảo báo cáo công tác tuần</h3>
              <p className="text-xs text-slate-500">
                Tạo văn bản báo cáo theo chuẩn sư phạm gửi Ban giám hiệu nhà trường.
              </p>
            </div>
            <button
              onClick={handleGenerateWeeklyReport}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>{loading ? 'Đang soạn thảo...' : 'Tạo báo cáo tuần'}</span>
            </button>
          </div>
        )}

        {activeTask === 'studentComment' && (
          <div className="space-y-4 pb-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Soạn nhận xét sổ liên lạc / Học bạ</h3>
                <p className="text-xs text-slate-500">
                  Dựa trên điểm trung bình thực tế và điểm rèn luyện của học sinh để đưa ra lời nhận xét chân thành, chuẩn mực.
                </p>
              </div>
              <button
                onClick={handleGenerateStudentComment}
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{loading ? 'Đang viết nhận xét...' : 'Soạn nhận xét em này'}</span>
              </button>
            </div>

            <div className="w-full sm:w-80 text-xs">
              <label className="block font-semibold text-slate-700 mb-1">Chọn học sinh:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.studentCode})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTask === 'parentNotice' && (
          <div className="space-y-4 pb-4 border-b border-slate-100 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Soạn thông báo gửi Phụ huynh</h3>
                <p className="text-xs text-slate-500">
                  AI chỉ tạo bản dự thảo. Giáo viên luôn xem trước và xác nhận trước khi gửi.
                </p>
              </div>
              <button
                onClick={handleGenerateParentNotice}
                disabled={loading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                <span>{loading ? 'Đang soạn thảo...' : 'Tạo dự thảo thông báo'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chủ đề cần thông báo</label>
                <input
                  type="text"
                  value={noticeTopic}
                  onChange={(e) => setNoticeTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ý chính cần truyền đạt</label>
                <input
                  type="text"
                  value={noticeDetails}
                  onChange={(e) => setNoticeDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Output Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-violet-600" />
              Kết quả phản hồi từ Gemini AI:
            </h4>
            {outputContent && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Đã chép!' : 'Sao chép'}</span>
                </button>
                {activeTask === 'parentNotice' && (
                  <button
                    onClick={handlePostToAnnouncements}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Xác nhận đăng lên Bảng tin</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {announcementPosted && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã đăng nội dung thành công lên Bảng tin lớp cho phụ huynh!</span>
            </div>
          )}

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-800 leading-relaxed min-h-[220px] whitespace-pre-line">
            {outputContent ? (
              outputContent
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bot className="w-8 h-8 text-slate-300 mb-2" />
                <p>Nhấn vào các nút thao tác ở trên để trợ lý AI thực thi.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
