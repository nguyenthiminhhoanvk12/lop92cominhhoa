import React, { useState } from 'react';
import {
  Award,
  Plus,
  Settings,
  Download,
  Save,
  CheckCircle2,
  Trash2,
  Edit2,
  Filter,
  Calculator,
} from 'lucide-react';
import { HomeroomClass, Student, Score, ScoreConfig } from '../../../types';
import { saveScore, deleteScore } from '../../../services/firestoreService';
import { exportScoresToExcel } from '../../../utils/excelUtils';
import { Modal } from '../../../components/common/Modal';

interface ScoresTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  scores: Score[];
  onRefresh: () => void;
}

export const ScoresTab: React.FC<ScoresTabProps> = ({
  currentClass,
  students,
  scores,
  onRefresh,
}) => {
  const subjectsList = ['Toán', 'Ngữ Văn', 'Tiếng Anh', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Lịch Sử', 'Địa Lý', 'Tin Học'];
  const [selectedSubject, setSelectedSubject] = useState('Toán');

  // Dynamic Score Types
  const [scoreTypes, setScoreTypes] = useState<string[]>([
    'Điểm thường xuyên',
    'Điểm 15 phút',
    'Điểm 1 tiết',
    'Điểm giữa kỳ',
    'Điểm cuối kỳ',
  ]);
  const [selectedScoreType, setSelectedScoreType] = useState('Điểm giữa kỳ');

  // Input state for batch score entry
  const [studentScoreInputs, setStudentScoreInputs] = useState<Record<string, { val: string; note: string }>>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Config modal
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  // Individual score edit modal
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [editingScore, setEditingScore] = useState<Score | null>(null);

  const handleScoreInputChange = (studentId: string, val: string) => {
    setStudentScoreInputs(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { note: '' }),
        val,
      },
    }));
  };

  const handleNoteInputChange = (studentId: string, note: string) => {
    setStudentScoreInputs(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || { val: '' }),
        note,
      },
    }));
  };

  const handleSaveBatch = async () => {
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      for (const st of students) {
        const input = studentScoreInputs[st.id];
        if (input && input.val !== '') {
          const numVal = parseFloat(input.val);
          if (!isNaN(numVal) && numVal >= 0 && numVal <= 10) {
            // Check if existing
            const existing = scores.find(
              s => s.studentId === st.id && s.subject === selectedSubject && s.scoreType === selectedScoreType
            );

            await saveScore({
              id: existing?.id,
              classId: currentClass.id,
              schoolYear: currentClass.schoolYear,
              studentId: st.id,
              studentName: st.fullName,
              subject: selectedSubject,
              scoreType: selectedScoreType,
              scoreValue: numVal,
              maxScore: 10,
              note: input.note || existing?.note || '',
              date: today,
            });
          }
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onRefresh();
    } catch (err) {
      console.error('Save scores error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddScoreType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    if (!scoreTypes.includes(newTypeName.trim())) {
      setScoreTypes(prev => [...prev, newTypeName.trim()]);
      setSelectedScoreType(newTypeName.trim());
    }
    setNewTypeName('');
    setConfigModalOpen(false);
  };

  const handleDeleteScore = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bản ghi điểm này?')) {
      try {
        await deleteScore(id);
        onRefresh();
      } catch (err) {
        console.error('Delete score error:', err);
      }
    }
  };

  // Filtered scores by subject
  const currentSubjectScores = scores.filter(s => s.subject === selectedSubject);

  return (
    <div className="space-y-6">
      {/* Top Bar with Subject & Score Type Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quản Lý Điểm Số Lớp {currentClass.name}</h2>
          <p className="text-xs text-slate-500">
            Hỗ trợ cấu hình đa dạng các đầu điểm thường xuyên, định kỳ và tự động tính điểm trung bình học tập.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setConfigModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Thêm loại điểm</span>
          </button>

          <button
            onClick={() => exportScoresToExcel(scores, students, currentClass.name)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Bảng Điểm</span>
          </button>

          <button
            onClick={handleSaveBatch}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Đang lưu...' : 'Lưu bảng điểm'}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Điểm số môn {selectedSubject} đã được cập nhật an toàn lên Cloud Firestore!</span>
        </div>
      )}

      {/* Selectors Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Chọn Môn Học</label>
          <div className="flex flex-wrap gap-1.5">
            {subjectsList.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  selectedSubject === sub
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Chọn Loại Điểm Nhập Nhanh</label>
          <div className="flex flex-wrap gap-1.5">
            {scoreTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedScoreType(type)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  selectedScoreType === type
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Score Entry Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Nhập Điểm Môn {selectedSubject} — {selectedScoreType}
            </h3>
            <p className="text-xs text-slate-400">
              Thang điểm 10 (ví dụ: 8.5, 9.0). Điểm sẽ tự động đồng bộ tới học sinh và phụ huynh.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
            <Calculator className="w-3.5 h-3.5" />
            <span>Tự tính điểm trung bình</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4 text-center">Điểm hiện có</th>
                <th className="py-3 px-4 text-center w-32">Nhập điểm ({selectedScoreType})</th>
                <th className="py-3 px-4">Lời phê / Nhận xét</th>
                <th className="py-3 px-4 text-center">Điểm TB môn {selectedSubject}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {students.map((st, idx) => {
                const stScores = currentSubjectScores.filter(s => s.studentId === st.id);
                const existingCurrent = stScores.find(s => s.scoreType === selectedScoreType);
                const avgSub = stScores.length
                  ? (stScores.reduce((sum, s) => sum + s.scoreValue, 0) / stScores.length).toFixed(1)
                  : '—';

                const inputVal = studentScoreInputs[st.id]?.val ?? (existingCurrent ? String(existingCurrent.scoreValue) : '');
                const inputNote = studentScoreInputs[st.id]?.note ?? (existingCurrent?.note || '');

                return (
                  <tr key={st.id} className="hover:bg-indigo-50/20 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{st.studentCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{st.fullName}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {stScores.map(sc => (
                          <span
                            key={sc.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              sc.scoreValue >= 8.0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}
                            title={`${sc.scoreType}: ${sc.scoreValue}`}
                          >
                            {sc.scoreValue}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="10"
                        value={inputVal}
                        onChange={(e) => handleScoreInputChange(st.id, e.target.value)}
                        placeholder="0.0"
                        className="w-20 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-hidden"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={inputNote}
                        onChange={(e) => handleNoteInputChange(st.id, e.target.value)}
                        placeholder="Nhận xét bài làm..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium focus:bg-white"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-bold font-mono text-xs">
                        {avgSub}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Score Type Modal */}
      <Modal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        title="Thêm loại điểm mới cho lớp"
        subtitle="Giáo viên có thể tự do mở rộng các loại điểm theo quy định trường học."
        maxWidth="md"
      >
        <form onSubmit={handleAddScoreType} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên loại điểm mới</label>
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="Ví dụ: Kiểm tra chuyên đề, Bài tập nhóm, Dự án STEM..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfigModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              Thêm loại điểm
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
