import React, { useState } from 'react';
import {
  Medal,
  Plus,
  Minus,
  Trophy,
  Award,
  Sparkles,
  Settings,
  Trash2,
  Calendar,
  CheckCircle2,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { HomeroomClass, Student, CompetitionRule, CompetitionEntry } from '../../../types';
import {
  saveCompetitionRule,
  deleteCompetitionRule,
  addCompetitionEntry,
  deleteCompetitionEntry,
} from '../../../services/firestoreService';
import { Modal } from '../../../components/common/Modal';

interface CompetitionTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  rules: CompetitionRule[];
  competitions: CompetitionEntry[];
  onRefresh: () => void;
  teacherName: string;
}

export const CompetitionTab: React.FC<CompetitionTabProps> = ({
  currentClass,
  students,
  rules,
  competitions,
  onRefresh,
  teacherName,
}) => {
  const [addEntryModalOpen, setAddEntryModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);

  // Add entry state
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [selectedRuleId, setSelectedRuleId] = useState(rules[0]?.id || '');
  const [customNote, setCustomNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Add rule state
  const [ruleTitle, setRuleTitle] = useState('');
  const [rulePoints, setRulePoints] = useState(1);
  const [ruleType, setRuleType] = useState<'bonus' | 'penalty'>('bonus');
  const [ruleCategory, setRuleCategory] = useState('Học tập');

  // Calculate Student Leaderboard
  const studentScoresMap = students.map((s) => {
    const stEntries = competitions.filter(c => c.studentId === s.id);
    const bonus = stEntries.filter(c => c.type === 'bonus').reduce((sum, c) => sum + c.points, 0);
    const penalty = stEntries.filter(c => c.type === 'penalty').reduce((sum, c) => sum + Math.abs(c.points), 0);
    const total = 100 + bonus - penalty;
    return {
      student: s,
      bonus,
      penalty,
      total,
      entriesCount: stEntries.length,
    };
  }).sort((a, b) => b.total - a.total);

  // Add Competition Entry
  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    const student = students.find(s => s.id === selectedStudentId);
    const rule = rules.find(r => r.id === selectedRuleId);
    if (!student || !rule) return;

    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      await addCompetitionEntry({
        classId: currentClass.id,
        studentId: student.id,
        studentName: student.fullName,
        ruleId: rule.id,
        ruleTitle: rule.title,
        points: rule.points,
        type: rule.type,
        note: customNote.trim() || rule.title,
        date: today,
        recordedBy: teacherName,
      });
      setAddEntryModalOpen(false);
      setCustomNote('');
      onRefresh();
    } catch (err) {
      console.error('Add competition entry error:', err);
    } finally {
      setSaving(false);
    }
  };

  // Add Rule
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleTitle.trim()) return;
    setSaving(true);
    try {
      await saveCompetitionRule({
        classId: currentClass.id,
        title: ruleTitle.trim(),
        points: ruleType === 'bonus' ? Math.abs(rulePoints) : -Math.abs(rulePoints),
        type: ruleType,
        category: ruleCategory,
      });
      setRuleModalOpen(false);
      setRuleTitle('');
      onRefresh();
    } catch (err) {
      console.error('Save rule error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tiêu chí này?')) {
      try {
        await deleteCompetitionRule(id);
        onRefresh();
      } catch (err) {
        console.error('Delete rule error:', err);
      }
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (confirm('Xóa bản ghi thi đua này?')) {
      try {
        await deleteCompetitionEntry(id);
        onRefresh();
      } catch (err) {
        console.error('Delete entry error:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Thi Đua & Rèn Luyện Nề Nếp Lớp {currentClass.name}</h2>
          <p className="text-xs text-slate-500">
            Hệ thống tính điểm tự động bắt đầu từ 100 điểm, cộng/trừ linh hoạt theo các tiêu chí sư phạm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRuleModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cài đặt tiêu chí</span>
          </button>

          <button
            onClick={() => setAddEntryModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ghi nhận điểm thi đua</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {studentScoresMap.slice(0, 3).map((item, idx) => {
          const podiumMeta = [
            { rank: 'Hạng 1', color: 'from-amber-400 to-amber-600', ring: 'ring-amber-400/40', badge: 'bg-amber-100 text-amber-800' },
            { rank: 'Hạng 2', color: 'from-slate-300 to-slate-500', ring: 'ring-slate-300/40', badge: 'bg-slate-100 text-slate-800' },
            { rank: 'Hạng 3', color: 'from-amber-600 to-orange-700', ring: 'ring-amber-600/40', badge: 'bg-orange-100 text-orange-800' },
          ][idx];

          return (
            <div
              key={item.student.id}
              className={`bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4 relative overflow-hidden ring-2 ${podiumMeta.ring}`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${podiumMeta.color} text-white font-black text-lg flex items-center justify-center shadow-md`}>
                #{idx + 1}
              </div>
              <div className="flex-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${podiumMeta.badge}`}>
                  {podiumMeta.rank}
                </span>
                <h4 className="font-extrabold text-sm text-slate-900 mt-1">{item.student.fullName}</h4>
                <p className="text-[11px] text-slate-400">{item.student.studentCode}</p>
                <div className="flex items-center gap-3 mt-1.5 text-xs font-semibold">
                  <span className="text-emerald-600">+{item.bonus}</span>
                  <span className="text-rose-500">-{item.penalty}</span>
                  <span className="font-bold text-slate-900 ml-auto text-sm">{item.total} đ</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Container: Full Leaderboard & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Leaderboard Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Bảng xếp hạng thi đua lớp {currentClass.name}
            </h3>
            <span className="text-xs text-slate-400">Xếp hạng theo tổng điểm rèn luyện</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Hạng</th>
                  <th className="py-3 px-4">Học sinh</th>
                  <th className="py-3 px-4">Mã HS</th>
                  <th className="py-3 px-4 text-center">Điểm cộng</th>
                  <th className="py-3 px-4 text-center">Điểm trừ</th>
                  <th className="py-3 px-4 text-right">Tổng điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studentScoresMap.map((item, idx) => (
                  <tr key={item.student.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-700">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-[11px] ${
                        idx === 0 ? 'bg-amber-100 text-amber-800 font-bold' : idx === 1 ? 'bg-slate-200 text-slate-700 font-bold' : idx === 2 ? 'bg-orange-100 text-orange-800 font-bold' : 'text-slate-400'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.student.fullName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{item.student.studentCode}</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">+{item.bonus}</td>
                    <td className="py-3 px-4 text-center font-bold text-rose-500">-{item.penalty}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-black rounded-lg text-xs font-mono">
                        {item.total} đ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Recent Emulation Records */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col">
          <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center justify-between">
            <span>Nhật ký ghi nhận gần nhất</span>
            <span className="text-xs text-slate-400 font-normal">{competitions.length} lượt</span>
          </h3>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px]">
            {competitions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Chưa có bản ghi thi đua nào.
              </div>
            ) : (
              competitions.map((entry) => (
                <div key={entry.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{entry.studentName}</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      entry.type === 'bonus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {entry.points > 0 ? `+${entry.points}` : entry.points} đ
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{entry.ruleTitle}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{entry.date}</span>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Add Competition Entry */}
      <Modal
        isOpen={addEntryModalOpen}
        onClose={() => setAddEntryModalOpen(false)}
        title="Ghi nhận điểm thi đua cho học sinh"
        subtitle="Chọn học sinh và tiêu chí tương ứng để cộng hoặc trừ điểm."
        maxWidth="md"
      >
        <form onSubmit={handleAddEntry} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chọn học sinh *</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chọn tiêu chí thi đua *</label>
            <select
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            >
              <optgroup label="Điểm Cộng (+)">
                {rules.filter(r => r.type === 'bonus').map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} (+{r.points} điểm)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Điểm Trừ (-)">
                {rules.filter(r => r.type === 'penalty').map(r => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.points} điểm)
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ghi chú cụ thể (tùy chọn)</label>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Ví dụ: Xung phong giải bài tập Toán khó..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddEntryModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              {saving ? 'Đang lưu...' : 'Xác nhận ghi điểm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Settings Rules */}
      <Modal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        title="Quản lý tiêu chí cộng/trừ điểm thi đua"
        subtitle="Giáo viên có toàn quyền tự tạo, điều chỉnh và xóa các tiêu chí."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Create new rule inline form */}
          <form onSubmit={handleSaveRule} className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-3">
            <h4 className="font-bold text-indigo-900 text-xs">Thêm tiêu chí thi đua mới:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={ruleTitle}
                  onChange={(e) => setRuleTitle(e.target.value)}
                  placeholder="Tên tiêu chí (vd: Đạt giải hội thi...)"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as any)}
                  className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                >
                  <option value="bonus">Cộng (+)</option>
                  <option value="penalty">Trừ (-)</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={rulePoints}
                  onChange={(e) => setRulePoints(Number(e.target.value))}
                  className="w-16 px-2 py-2 bg-white border border-slate-200 rounded-xl font-bold text-center"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-indigo-600 text-white font-bold rounded-xl shadow-xs"
              >
                + Thêm tiêu chí
              </button>
            </div>
          </form>

          {/* Rules list */}
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
            {rules.map((r) => (
              <div key={r.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">{r.title}</p>
                  <span className="text-[10px] text-slate-400">{r.category}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                    r.type === 'bonus' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {r.points > 0 ? `+${r.points}` : r.points} điểm
                  </span>
                  <button
                    onClick={() => handleDeleteRule(r.id)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    title="Xóa tiêu chí"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
