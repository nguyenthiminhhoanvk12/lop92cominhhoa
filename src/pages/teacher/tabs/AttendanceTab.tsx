import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Save,
  Calendar,
  Send,
  Filter,
  BarChart3,
  UserCheck,
} from 'lucide-react';
import {
  HomeroomClass,
  Student,
  AttendanceRecord,
  AttendanceStatus,
  StudentAttendanceItem,
} from '../../../types';
import { saveAttendance, createAnnouncement } from '../../../services/firestoreService';
import { Modal } from '../../../components/common/Modal';

interface AttendanceTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  attendanceHistory: AttendanceRecord[];
  onRefresh: () => void;
  teacherName: string;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  currentClass,
  students,
  attendanceHistory,
  onRefresh,
  teacherName,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; note: string }>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [notifyTargetStudent, setNotifyTargetStudent] = useState<Student | null>(null);
  const [notifyNote, setNotifyNote] = useState('');

  // Load existing records for selectedDate
  useEffect(() => {
    const existing = attendanceHistory.find(a => a.date === selectedDate);
    const initialMap: Record<string, { status: AttendanceStatus; note: string }> = {};

    students.forEach((s) => {
      const match = existing?.records.find(r => r.studentId === s.id);
      if (match) {
        initialMap[s.id] = { status: match.status, note: match.note || '' };
      } else {
        initialMap[s.id] = { status: 'present', note: '' };
      }
    });

    setRecords(initialMap);
  }, [selectedDate, students, attendanceHistory]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; note: string }> = {};
    students.forEach(s => {
      updated[s.id] = { status: 'present', note: '' };
    });
    setRecords(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formattedRecords: StudentAttendanceItem[] = students.map(s => ({
        studentId: s.id,
        studentName: s.fullName,
        status: records[s.id]?.status || 'present',
        note: records[s.id]?.note || '',
      }));

      await saveAttendance(currentClass.id, selectedDate, formattedRecords, teacherName);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefresh();
    } catch (err) {
      console.error('Save attendance error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenNotify = (s: Student) => {
    setNotifyTargetStudent(s);
    const curStatus = records[s.id]?.status;
    const defaultReason = curStatus === 'excused' ? 'nghỉ học có phép' : curStatus === 'unexcused' ? 'nghỉ học không phép' : 'đi học muộn';
    setNotifyNote(`Thông báo: Em ${s.fullName} hôm nay (${selectedDate}) ${defaultReason}. Đề nghị gia đình liên hệ phối hợp với GVCN.`);
    setNotifyModalOpen(true);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyTargetStudent) return;
    try {
      await createAnnouncement({
        classId: currentClass.id,
        title: `[Chuyên cần] Báo vắng/muộn học sinh ${notifyTargetStudent.fullName}`,
        content: notifyNote,
        targetAudience: 'parents',
        targetStudentId: notifyTargetStudent.id,
        targetStudentName: notifyTargetStudent.fullName,
        authorName: teacherName,
        authorId: currentClass.teacherId,
        priority: 'high',
        date: selectedDate,
      });
      setNotifyModalOpen(false);
      alert(`Đã gửi thông báo đến phụ huynh em ${notifyTargetStudent.fullName}!`);
    } catch (err) {
      console.error('Send alert error:', err);
    }
  };

  // Metrics for selectedDate
  const presentCount = Object.values(records).filter(r => r.status === 'present').length;
  const excusedCount = Object.values(records).filter(r => r.status === 'excused').length;
  const unexcusedCount = Object.values(records).filter(r => r.status === 'unexcused').length;
  const lateCount = Object.values(records).filter(r => r.status === 'late').length;

  return (
    <div className="space-y-6">
      {/* Top Bar with Date & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Điểm Danh Hàng Ngày Lớp {currentClass.name}</h2>
          <p className="text-xs text-slate-500">
            Giáo viên có thể điểm danh toàn bộ lớp tức thì và thông báo ngay cho phụ huynh học sinh nghỉ/muộn.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Ngày:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-indigo-700 outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={handleMarkAllPresent}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tất cả có mặt</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu điểm danh'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Dữ liệu điểm danh ngày {selectedDate} đã được lưu thành công trên Firestore!</span>
        </div>
      )}

      {/* 4 Summary Stats for Selected Date */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Có mặt</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Nghỉ có phép</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{excusedCount}</p>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Nghỉ không phép</span>
            <p className="text-2xl font-black text-rose-600 mt-1">{unexcusedCount}</p>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Đi muộn</span>
            <p className="text-2xl font-black text-indigo-600 mt-1">{lateCount}</p>
          </div>
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Attendance Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">
            Danh sách điểm danh ngày {selectedDate} ({students.length} học sinh)
          </h3>
          <span className="text-xs text-slate-400">Chọn 1 trong 4 trạng thái cho từng học sinh</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Học sinh</th>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4 text-center">Trạng thái điểm danh</th>
                <th className="py-3 px-4">Ghi chú (Lý do)</th>
                <th className="py-3 px-4 text-right">Báo phụ huynh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {students.map((s, idx) => {
                const currentStatus = records[s.id]?.status || 'present';
                const currentNote = records[s.id]?.note || '';
                const isAbnormal = currentStatus !== 'present';

                return (
                  <tr
                    key={s.id}
                    className={`transition ${isAbnormal ? 'bg-amber-50/20' : 'hover:bg-slate-50/60'}`}
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.fullName}</div>
                      <span className="text-[10px] text-slate-400">SĐT PH: {s.parentPhone}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">{s.studentCode}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl w-fit mx-auto border border-slate-200/80">
                        {[
                          { id: 'present', label: 'Có mặt', activeColor: 'bg-emerald-600 text-white' },
                          { id: 'excused', label: 'Có phép', activeColor: 'bg-amber-500 text-white' },
                          { id: 'unexcused', label: 'Không phép', activeColor: 'bg-rose-600 text-white' },
                          { id: 'late', label: 'Đi muộn', activeColor: 'bg-indigo-600 text-white' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleStatusChange(s.id, opt.id as AttendanceStatus)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                              currentStatus === opt.id
                                ? `${opt.activeColor} shadow-xs`
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={currentNote}
                        onChange={(e) => handleNoteChange(s.id, e.target.value)}
                        placeholder={isAbnormal ? 'Nhập lý do...' : 'Ghi chú...'}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isAbnormal ? (
                        <button
                          onClick={() => handleOpenNotify(s)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Báo PH</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">Bình thường</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notify Parent Modal */}
      <Modal
        isOpen={notifyModalOpen}
        onClose={() => setNotifyModalOpen(false)}
        title="Gửi thông báo vắng/muộn cho phụ huynh"
        subtitle={`Học sinh: ${notifyTargetStudent?.fullName} (SĐT: ${notifyTargetStudent?.parentPhone})`}
        maxWidth="md"
      >
        <form onSubmit={handleSendNotification} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nội dung thông báo</label>
            <textarea
              rows={4}
              value={notifyNote}
              onChange={(e) => setNotifyNote(e.target.value)}
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
            Thông báo này sẽ xuất hiện ngay trên Bảng tin và Dashboard của Phụ huynh em {notifyTargetStudent?.fullName}.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setNotifyModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi thông báo</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
