import React, { useState } from 'react';
import {
  Settings,
  Download,
  School,
  Database,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit2,
  GraduationCap,
  Building,
} from 'lucide-react';
import { HomeroomClass, Student, Score, AttendanceRecord, CompetitionEntry } from '../../../types';
import { exportStudentsToExcel, exportScoresToExcel } from '../../../utils/excelUtils';
import { seedDemoClassData, updateClassAndSchoolProfile } from '../../../services/firestoreService';
import { useAuth } from '../../../context/AuthContext';
import { Modal } from '../../../components/common/Modal';

interface SettingsTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  scores: Score[];
  attendance: AttendanceRecord[];
  competitions: CompetitionEntry[];
  schoolYear: string;
  onSelectSchoolYear: (year: string) => void;
  teacherId: string;
  teacherName: string;
  onRefresh: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  currentClass,
  students,
  scores,
  attendance,
  competitions,
  schoolYear,
  onSelectSchoolYear,
  teacherId,
  teacherName,
  onRefresh,
}) => {
  const { userProfile, updateCurrentProfile } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Edit Teacher, Class, School in Settings
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formTeacherName, setFormTeacherName] = useState(currentClass.teacherName || teacherName || 'Nguyễn Thị Minh Hòa');
  const [formTeacherPhone, setFormTeacherPhone] = useState(userProfile?.phone || '0912345678');
  const [formTeacherEmail, setFormTeacherEmail] = useState(userProfile?.email || 'nguyenthiminhhoanvk12@gmail.com');
  const [formClassName, setFormClassName] = useState(currentClass.name || '8A1');
  const [formGrade, setFormGrade] = useState(currentClass.grade || '8');
  const [formRoom, setFormRoom] = useState(currentClass.room || 'Phòng 204 - Dãy B');
  const [formSchoolYear, setFormSchoolYear] = useState(currentClass.schoolYear || schoolYear || '2026 - 2027');
  const [formSchoolName, setFormSchoolName] = useState(currentClass.schoolName || 'Trường THCS Sơn Phong');
  const [formSchoolAddress, setFormSchoolAddress] = useState(currentClass.schoolAddress || 'Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam');
  const [formSchoolWard, setFormSchoolWard] = useState(currentClass.schoolWard || 'Phường Sơn Phong');
  const [formSchoolCity, setFormSchoolCity] = useState(currentClass.schoolCity || 'TP. Hội An');

  const handleOpenEdit = () => {
    setFormTeacherName(currentClass.teacherName || teacherName || 'Nguyễn Thị Minh Hòa');
    setFormTeacherPhone(userProfile?.phone || '0912345678');
    setFormTeacherEmail(userProfile?.email || 'nguyenthiminhhoanvk12@gmail.com');
    setFormClassName(currentClass.name || '8A1');
    setFormGrade(currentClass.grade || '8');
    setFormRoom(currentClass.room || 'Phòng 204 - Dãy B');
    setFormSchoolYear(currentClass.schoolYear || schoolYear || '2026 - 2027');
    setFormSchoolName(currentClass.schoolName || 'Trường THCS Sơn Phong');
    setFormSchoolAddress(currentClass.schoolAddress || 'Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam');
    setFormSchoolWard(currentClass.schoolWard || 'Phường Sơn Phong');
    setFormSchoolCity(currentClass.schoolCity || 'TP. Hội An');
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClassName.trim() || !formSchoolName.trim() || !formTeacherName.trim()) return;

    setSaving(true);
    try {
      await updateClassAndSchoolProfile(currentClass.id, teacherId, {
        name: formClassName.trim(),
        grade: formGrade.trim(),
        schoolYear: formSchoolYear.trim(),
        room: formRoom.trim(),
        schoolName: formSchoolName.trim(),
        schoolAddress: formSchoolAddress.trim(),
        schoolWard: formSchoolWard.trim(),
        schoolCity: formSchoolCity.trim(),
        teacherName: formTeacherName.trim(),
        teacherPhone: formTeacherPhone.trim(),
        teacherEmail: formTeacherEmail.trim(),
      });

      await updateCurrentProfile({
        displayName: formTeacherName.trim(),
        className: formClassName.trim(),
        grade: formGrade.trim(),
        schoolYear: formSchoolYear.trim(),
        schoolName: formSchoolName.trim(),
        schoolAddress: formSchoolAddress.trim(),
        schoolWard: formSchoolWard.trim(),
        schoolCity: formSchoolCity.trim(),
        phone: formTeacherPhone.trim(),
        email: formTeacherEmail.trim(),
      });

      setSuccessMsg('Đã cập nhật thành công tên GVCN, Lớp chủ nhiệm và Trường học!');
      setTimeout(() => setSuccessMsg(null), 4000);
      setEditModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Save profile in settings error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportAll = () => {
    // Export students and scores
    exportStudentsToExcel(students, currentClass.name);
    setTimeout(() => {
      exportScoresToExcel(scores, students, currentClass.name);
    }, 600);
  };

  const handleExportJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      class: currentClass,
      students,
      scores,
      attendance,
      competitions,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SaoLuu_Lop_${currentClass.name}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSeedDemo = async () => {
    if (confirm('Khởi tạo lớp mẫu "10A1" với 12 học sinh, đầy đủ điểm số, điểm danh và thi đua mẫu?')) {
      setSeeding(true);
      try {
        await seedDemoClassData(teacherId, teacherName);
        setSeedSuccess(true);
        setTimeout(() => setSeedSuccess(false), 3000);
        onRefresh();
      } catch (err) {
        console.error('Seed demo error:', err);
      } finally {
        setSeeding(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Cài Đặt Hệ Thống & Sao Lưu Dữ Liệu</h2>
        <p className="text-xs text-slate-500">
          Quản lý năm học, bảo vệ toàn vẹn dữ liệu Cloud Firestore và xuất báo cáo lưu trữ lâu dài.
        </p>
      </div>

      {seedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã khởi tạo thành công lớp mẫu vào Firestore!</span>
        </div>
      )}

      {/* Grid Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. School Year Configuration */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Quản Lý Năm Học</h3>
              <p className="text-xs text-slate-500">Dữ liệu từng năm học được phân tách độc lập an toàn.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="font-semibold text-slate-700 block">Năm học đang làm việc:</label>
            <div className="grid grid-cols-3 gap-2">
              {['2025-2026', '2026-2027', '2027-2028'].map((yr) => (
                <button
                  key={yr}
                  onClick={() => onSelectSchoolYear(yr)}
                  className={`p-2.5 rounded-xl font-bold border transition cursor-pointer text-center ${
                    schoolYear === yr
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Chuyển đổi năm học để xem lại hồ sơ học bạ cũ hoặc chuẩn bị cho niên khóa tiếp theo.
            </p>
          </div>
        </div>

        {/* 2. Data Backup & Export */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Sao Lưu & Xuất Dữ Liệu</h3>
              <p className="text-xs text-slate-500">Tải về toàn bộ bảng điểm, hồ sơ học sinh và báo cáo.</p>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <button
              onClick={handleExportAll}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Xuất toàn bộ Bảng điểm & DS Học sinh (Excel .xlsx)</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Sao lưu dữ liệu gốc (JSON Database Backup)</span>
            </button>
          </div>
        </div>

        {/* 3. Teacher, Class & School Profile Configuration */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Hồ Sơ Giáo Viên Chủ Nhiệm, Lớp & Trường Học</h3>
                <p className="text-xs text-slate-500">
                  Giáo viên có toàn quyền thay đổi tên của mình, tên lớp chủ nhiệm, phòng học và trường học bất kỳ lúc nào.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenEdit}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Thay đổi tên, lớp & trường</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400">Giáo viên chủ nhiệm</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{currentClass.teacherName || teacherName}</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{userProfile?.phone || '0912345678'}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400">Lớp chủ nhiệm</p>
              <p className="font-black text-indigo-900 text-sm mt-0.5">
                Lớp {currentClass.name} (Khối {currentClass.grade})
              </p>
              <p className="text-xs text-slate-500 mt-1">{currentClass.room || 'Phòng 204 - Dãy B'}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[11px] font-semibold text-slate-400">Trường học & Niên khóa</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{currentClass.schoolName || 'Trường THCS Sơn Phong'}</p>
              <p className="text-xs text-slate-500 mt-1">Năm học {currentClass.schoolYear || schoolYear}</p>
            </div>
          </div>
        </div>

        {/* 4. Demo Data Management */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Dữ Liệu Mẫu Thử Nghiệm (Demo Data)</h3>
              <p className="text-xs text-slate-500">
                Cho phép tạo một bộ dữ liệu lớp học hoàn chỉnh để thầy/cô hoặc hội đồng đánh giá kiểm tra đầy đủ tính năng.
              </p>
            </div>
          </div>

          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold">Lớp {currentClass.name} (Sĩ số {students.length} em, Đầy đủ điểm số, điểm danh, nề nếp)</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Dữ liệu mẫu được lưu trên Cloud Firestore và có thể cập nhật hoặc xóa bất cứ lúc nào.
              </p>
            </div>
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap self-start sm:self-auto"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Đang tạo...' : 'Nạp dữ liệu mẫu mới'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Thay đổi Tên GVCN, Lớp chủ nhiệm & Trường học"
        subtitle="Giáo viên có toàn quyền chỉnh sửa và cập nhật dữ liệu của lớp mình"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
            <h4 className="font-bold text-indigo-950 mb-2">1. Thông tin Giáo viên Chủ nhiệm</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên GVCN *</label>
                <input
                  type="text"
                  value={formTeacherName}
                  onChange={(e) => setFormTeacherName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={formTeacherPhone}
                  onChange={(e) => setFormTeacherPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium font-mono focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formTeacherEmail}
                  onChange={(e) => setFormTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">2. Thông tin Lớp Chủ Nhiệm</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên lớp *</label>
                <input
                  type="text"
                  value={formClassName}
                  onChange={(e) => setFormClassName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-black text-indigo-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khối *</label>
                <input
                  type="text"
                  value={formGrade}
                  onChange={(e) => setFormGrade(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Năm học *</label>
                <input
                  type="text"
                  value={formSchoolYear}
                  onChange={(e) => setFormSchoolYear(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phòng học</label>
                <input
                  type="text"
                  value={formRoom}
                  onChange={(e) => setFormRoom(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-2">3. Thông tin Trường Học</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Tên trường *</label>
                <input
                  type="text"
                  value={formSchoolName}
                  onChange={(e) => setFormSchoolName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-black focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ trường</label>
                <input
                  type="text"
                  value={formSchoolAddress}
                  onChange={(e) => setFormSchoolAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phường / Xã</label>
                <input
                  type="text"
                  value={formSchoolWard}
                  onChange={(e) => setFormSchoolWard(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Tỉnh / Thành phố</label>
                <input
                  type="text"
                  value={formSchoolCity}
                  onChange={(e) => setFormSchoolCity(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu thay đổi</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
