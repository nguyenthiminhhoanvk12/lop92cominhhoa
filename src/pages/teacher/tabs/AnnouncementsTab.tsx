import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Send,
  Trash2,
  Users,
  UserCheck,
  User,
  Calendar,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { HomeroomClass, Student, Announcement } from '../../../types';
import { createAnnouncement, deleteAnnouncement } from '../../../services/firestoreService';
import { Modal } from '../../../components/common/Modal';

interface AnnouncementsTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  announcements: Announcement[];
  onRefresh: () => void;
  teacherName: string;
  teacherId: string;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({
  currentClass,
  students,
  announcements,
  onRefresh,
  teacherName,
  teacherId,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'students' | 'parents' | 'student_specific'>('all');
  const [targetStudentId, setTargetStudentId] = useState(students[0]?.id || '');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  const [saving, setSaving] = useState(false);

  const handleOpenAdd = () => {
    setTitle('');
    setContent('');
    setTargetAudience('all');
    setPriority('normal');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      const student = targetAudience === 'student_specific' ? students.find(s => s.id === targetStudentId) : undefined;
      await createAnnouncement({
        classId: currentClass.id,
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        targetStudentId: student?.id,
        targetStudentName: student?.fullName,
        authorName: teacherName,
        authorId: teacherId,
        priority,
        date: today,
      });
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Create announcement error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Xóa thông báo này?')) {
      try {
        await deleteAnnouncement(id);
        onRefresh();
      } catch (err) {
        console.error('Delete announcement error:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Bảng Tin Thông Báo Lớp {currentClass.name}</h2>
          <p className="text-xs text-slate-500">
            Đăng tin tức, lịch thi, nhắc nộp bài tập và thông báo họp phụ huynh với chế độ phân loại đối tượng chính xác.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Đăng thông báo mới</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-xs text-slate-400">
            Chưa có thông báo nào. Nhấn "Đăng thông báo mới" để chia sẻ thông tin tới lớp.
          </div>
        ) : (
          announcements.map((a) => {
            const priorityBadges = {
              normal: 'bg-slate-100 text-slate-700 border-slate-200',
              high: 'bg-amber-50 text-amber-800 border-amber-200',
              urgent: 'bg-rose-50 text-rose-800 border-rose-200',
            };
            const audienceLabels = {
              all: { label: 'Toàn thể học sinh & phụ huynh', icon: <Users className="w-3.5 h-3.5 text-indigo-600" /> },
              students: { label: 'Dành cho Học sinh', icon: <User className="w-3.5 h-3.5 text-emerald-600" /> },
              parents: { label: 'Dành cho Phụ huynh', icon: <UserCheck className="w-3.5 h-3.5 text-amber-600" /> },
              student_specific: { label: `Riêng em ${a.targetStudentName || 'học sinh'}`, icon: <User className="w-3.5 h-3.5 text-purple-600" /> },
            };

            return (
              <div
                key={a.id}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 bg-slate-50`}>
                        {audienceLabels[a.targetAudience]?.icon}
                        <span>{audienceLabels[a.targetAudience]?.label}</span>
                      </span>

                      {a.priority !== 'normal' && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityBadges[a.priority]}`}>
                          {a.priority === 'urgent' ? 'Khẩn cấp' : 'Quan trọng'}
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {a.date}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-slate-900 leading-snug">{a.title}</h3>
                  </div>

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition"
                    title="Xóa thông báo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">
                  {a.content}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Người đăng: <strong className="text-slate-700">{a.authorName}</strong></span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <Eye className="w-3.5 h-3.5" />
                    Đã xem: {a.readBy?.length || 0} lượt
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Create Announcement */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Đăng thông báo mới"
        subtitle={`Lớp ${currentClass.name} • Người đăng: ${teacherName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tiêu đề thông báo *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Kế hoạch thi giữa kỳ, Nhắc nộp sổ liên lạc..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Đối tượng nhận thông báo</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              >
                <option value="all">Toàn bộ (Học sinh & Phụ huynh)</option>
                <option value="students">Chỉ Học sinh</option>
                <option value="parents">Chỉ Phụ huynh</option>
                <option value="student_specific">Riêng một học sinh cụ thể</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              >
                <option value="normal">Bình thường</option>
                <option value="high">Quan trọng</option>
                <option value="urgent">Khẩn cấp</option>
              </select>
            </div>
          </div>

          {targetAudience === 'student_specific' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chọn học sinh nhận thông báo riêng</label>
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nội dung thông báo *</label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung thông báo đầy đủ, rõ ràng..."
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Đang gửi...' : 'Gửi thông báo'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
