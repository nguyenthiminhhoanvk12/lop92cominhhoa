import React, { useState } from 'react';
import {
  BarChart3,
  CalendarCheck,
  Award,
  Medal,
  TrendingUp,
  PieChart,
  Calendar,
  Users,
} from 'lucide-react';
import { HomeroomClass, Student, AttendanceRecord, Score, CompetitionEntry } from '../../../types';

interface StatisticsTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  attendance: AttendanceRecord[];
  scores: Score[];
  competitions: CompetitionEntry[];
}

export const StatisticsTab: React.FC<StatisticsTabProps> = ({
  currentClass,
  students,
  attendance,
  scores,
  competitions,
}) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'semester' | 'year'>('month');

  // Academic Distribution
  const studentAverages = students.map(s => {
    const stScores = scores.filter(sc => sc.studentId === s.id);
    const avg = stScores.length ? stScores.reduce((sum, sc) => sum + sc.scoreValue, 0) / stScores.length : 8.0;
    return { student: s, avg };
  });

  const excellentCount = studentAverages.filter(a => a.avg >= 8.0).length;
  const goodCount = studentAverages.filter(a => a.avg >= 6.5 && a.avg < 8.0).length;
  const averageCount = studentAverages.filter(a => a.avg >= 5.0 && a.avg < 6.5).length;
  const weakCount = studentAverages.filter(a => a.avg < 5.0).length;

  const totalEvaluated = students.length || 1;
  const pctExcellent = Math.round((excellentCount / totalEvaluated) * 100);
  const pctGood = Math.round((goodCount / totalEvaluated) * 100);
  const pctAvg = Math.round((averageCount / totalEvaluated) * 100);
  const pctWeak = Math.round((weakCount / totalEvaluated) * 100);

  // Attendance Metrics
  const totalDaysRecorded = attendance.length || 1;
  let totalPresents = 0;
  let totalExcused = 0;
  let totalUnexcused = 0;
  let totalLate = 0;

  attendance.forEach(att => {
    att.records.forEach(r => {
      if (r.status === 'present') totalPresents++;
      else if (r.status === 'excused') totalExcused++;
      else if (r.status === 'unexcused') totalUnexcused++;
      else if (r.status === 'late') totalLate++;
    });
  });

  const totalSlots = (totalDaysRecorded * students.length) || 1;
  const attendanceRate = Math.min(100, Math.round(((totalPresents + totalLate) / totalSlots) * 100)) || 98;

  // Competition metrics
  const totalBonus = competitions.filter(c => c.type === 'bonus').length;
  const totalPenalties = competitions.filter(c => c.type === 'penalty').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Báo Cáo & Thống Kê Tổng Hợp Lớp {currentClass.name}</h2>
          <p className="text-xs text-slate-500">
            Phân tích số liệu trực quan về học lực, tỷ lệ chuyên cần và điểm rèn luyện nề nếp.
          </p>
        </div>

        {/* Time range tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
          {[
            { id: 'week', label: 'Theo Tuần' },
            { id: 'month', label: 'Theo Tháng' },
            { id: 'semester', label: 'Học Kỳ' },
            { id: 'year', label: 'Cả Năm' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                timeRange === t.id ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Tỷ lệ chuyên cần chung</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{attendanceRate}%</span>
            <span className="text-xs text-emerald-700 font-bold">Xuất sắc</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Học sinh đạt loại Giỏi</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-600">{excellentCount}</span>
            <span className="text-xs text-slate-500">({pctExcellent}%)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Lượt tuyên dương nề nếp</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-500">+{totalBonus}</span>
            <span className="text-xs text-slate-500">lượt thưởng</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Lượt vi phạm cần uốn nắn</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{totalPenalties}</span>
            <span className="text-xs text-slate-500">lượt trừ điểm</span>
          </div>
        </div>
      </div>

      {/* Visual Chart Bars Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phổ điểm học lực */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-600" />
              Phân Bổ Học Lực Cả Lớp
            </h3>
            <span className="text-xs text-slate-400">Sĩ số: {students.length} HS</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700">Giỏi (Điểm TB ≥ 8.0)</span>
                <span className="font-bold text-emerald-700">{excellentCount} HS ({pctExcellent}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctExcellent}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700">Khá (6.5 ≤ Điểm TB &lt; 8.0)</span>
                <span className="font-bold text-blue-700">{goodCount} HS ({pctGood}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctGood}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700">Trung bình (5.0 ≤ Điểm TB &lt; 6.5)</span>
                <span className="font-bold text-amber-700">{averageCount} HS ({pctAvg}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctAvg}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-slate-700">Yếu (Điểm TB &lt; 5.0)</span>
                <span className="font-bold text-rose-700">{weakCount} HS ({pctWeak}%)</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctWeak}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Phân tích chuyên cần */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              Tổng Hợp Chuyên Cần & Nề Nếp
            </h3>
            <span className="text-xs text-slate-400">Ghi nhận: {attendance.length} buổi học</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-[11px] text-emerald-700 font-semibold block">Số buổi có mặt đầy đủ</span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{totalPresents}</p>
              <span className="text-[10px] text-emerald-600 mt-0.5 block">Đạt nề nếp tốt</span>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-[11px] text-amber-700 font-semibold block">Nghỉ có đơn xin phép</span>
              <p className="text-2xl font-black text-amber-900 mt-1">{totalExcused}</p>
              <span className="text-[10px] text-amber-600 mt-0.5 block">Lý do ốm/việc nhà</span>
            </div>

            <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100">
              <span className="text-[11px] text-rose-700 font-semibold block">Nghỉ không phép</span>
              <p className="text-2xl font-black text-rose-900 mt-1">{totalUnexcused}</p>
              <span className="text-[10px] text-rose-600 mt-0.5 block">Cần liên hệ gia đình</span>
            </div>

            <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-100">
              <span className="text-[11px] text-indigo-700 font-semibold block">Số lần đi muộn</span>
              <p className="text-2xl font-black text-indigo-900 mt-1">{totalLate}</p>
              <span className="text-[10px] text-indigo-600 mt-0.5 block">Đã nhắc nhở đầu giờ</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
