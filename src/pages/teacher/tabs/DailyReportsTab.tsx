import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Calendar,
  Sparkles,
  User,
  Users,
  Trash2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { HomeroomClass, Student, DailyReport } from '../../../types';
import { saveDailyReport, deleteDailyReport } from '../../../services/firestoreService';
import { Modal } from '../../../components/common/Modal';

interface DailyReportsTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  reports: DailyReport[];
  onRefresh: () => void;
  teacherName: string;
}

export const DailyReportsTab: React.FC<DailyReportsTabProps> = ({
  currentClass,
  students,
  reports,
  onRefresh,
  teacherName,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);

  // Form states
  const [reportDate, setReportDate] = useState(todayStr);
  const [reportType, setReportType] = useState<'class' | 'student'>('class');
  const [targetStudentId, setTargetStudentId] = useState(students[0]?.id || '');
  const [academicStatus, setAcademicStatus] = useState('');
  const [disciplineStatus, setDisciplineStatus] = useState('');
  const [hygieneStatus, setHygieneStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [highlights, setHighlights] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    setReportDate(todayStr);
    setReportType('class');
    setAcademicStatus('Học sinh chú ý lắng nghe, hăng hái phát biểu xây dựng bài.');
    setDisciplineStatus('Nề nếp ổn định, không có trường hợp gây rối.');
    setHygieneStatus('Lớp học vệ sinh sạch sẽ, kê bàn ghế ngay ngắn.');
    setNotes('');
    setHighlights('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    setSaving(true);
    try {
      const student = reportType === 'student' ? students.find(s => s.id === targetStudentId) : undefined;
      await saveDailyReport({
        classId: currentClass.id,
        date: reportDate,
        type: reportType,
        studentId: student?.id,
        studentName: student?.fullName,
        academicStatus,
        disciplineStatus,
        hygieneStatus,
        notes: notes.trim(),
        highlights: highlights.trim(),
        createdBy: teacherName,
      });
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Save daily report error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xóa báo cáo này?')) {
      try {
        await deleteDailyReport(id);
        onRefresh();
      } catch (err) {
        console.error('Delete daily report error:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Báo Cáo & Nhật Ký Hàng Ngày Lớp {currentClass.name}</h2>
          <p className="text-xs text-slate-500">
            Ghi nhận tình hình học tập, nề nếp, vệ sinh và nhận xét từng học sinh. Phụ huynh có thể xem nhật ký của con mình.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo báo cáo mới</span>
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-xs text-slate-400">
            Chưa có báo cáo nào được tạo. Nhấn "Tạo báo cáo mới" để bắt đầu ghi nhật ký hôm nay.
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                    r.type === 'class' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {r.type === 'class' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    <span>{r.type === 'class' ? 'Báo cáo toàn lớp' : `Nhận xét riêng: ${r.studentName}`}</span>
                  </div>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày {r.date}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Người ghi: {r.createdBy}</span>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                    title="Xóa báo cáo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Main notes */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-800 leading-relaxed">
                {r.notes}
              </div>

              {/* Specific sections if class report */}
              {r.type === 'class' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  {r.academicStatus && (
                    <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100/60">
                      <span className="font-bold text-blue-900 block mb-0.5">📚 Học tập & Chuyên cần:</span>
                      <p className="text-slate-600 text-[11px]">{r.academicStatus}</p>
                    </div>
                  )}
                  {r.disciplineStatus && (
                    <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-100/60">
                      <span className="font-bold text-amber-900 block mb-0.5">⚖️ Nề nếp & Kỷ luật:</span>
                      <p className="text-slate-600 text-[11px]">{r.disciplineStatus}</p>
                    </div>
                  )}
                  {r.hygieneStatus && (
                    <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
                      <span className="font-bold text-emerald-900 block mb-0.5">🧹 Vệ sinh lớp học:</span>
                      <p className="text-slate-600 text-[11px]">{r.hygieneStatus}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Highlights */}
              {r.highlights && (
                <div className="p-2.5 bg-violet-50 rounded-xl border border-violet-100 text-violet-900 text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Thành tích nổi bật: {r.highlights}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Create Daily Report */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tạo báo cáo tình hình / Nhật ký ngày"
        subtitle={`Lớp ${currentClass.name} • GVCN: ${teacherName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày báo cáo</label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Đối tượng báo cáo</label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setReportType('class')}
                  className={`py-1.5 font-bold rounded-lg transition ${
                    reportType === 'class' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cả lớp
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('student')}
                  className={`py-1.5 font-bold rounded-lg transition ${
                    reportType === 'student' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Từng học sinh
                </button>
              </div>
            </div>
          </div>

          {reportType === 'student' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chọn học sinh cần nhận xét</label>
              <select
                value={targetStudentId}
                onChange={(e) => setTargetStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.studentCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'class' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Học tập & Chuyên cần</label>
                <input
                  type="text"
                  value={academicStatus}
                  onChange={(e) => setAcademicStatus(e.target.value)}
                  placeholder="Lớp chú ý bài..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nề nếp & Kỷ luật</label>
                <input
                  type="text"
                  value={disciplineStatus}
                  onChange={(e) => setDisciplineStatus(e.target.value)}
                  placeholder="Nề nếp tốt..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vệ sinh lớp học</label>
                <input
                  type="text"
                  value={hygieneStatus}
                  onChange={(e) => setHygieneStatus(e.target.value)}
                  placeholder="Sạch sẽ..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nội dung chi tiết / Nhận xét tổng kết *</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={reportType === 'class' ? 'Ghi nhận chi tiết hoạt động trong ngày của lớp...' : 'Nhận xét về ý thức, học tập, sự tiến bộ của em trong ngày...'}
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Thành tích nổi bật / Tuyên dương (tùy chọn)</label>
            <input
              type="text"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
              placeholder="Ví dụ: Khen ngợi tổ 2 trực nhật xuất sắc, em Nguyễn Văn An xung phong chữa bài..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
