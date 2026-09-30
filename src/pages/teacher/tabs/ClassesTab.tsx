import React, { useState } from 'react';
import {
  School,
  Edit2,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  ShieldCheck,
  UserCheck,
  Users,
  GraduationCap,
  Save,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';
import { HomeroomClass, Student } from '../../../types';
import { updateClassAndSchoolProfile } from '../../../services/firestoreService';
import { Modal } from '../../../components/common/Modal';
import { useAuth } from '../../../context/AuthContext';

interface ClassesTabProps {
  classes: HomeroomClass[];
  currentClass: HomeroomClass;
  onSelectClass: (c: HomeroomClass) => void;
  onRefresh: () => void;
  schoolYear: string;
  onSelectSchoolYear: (year: string) => void;
  teacherId: string;
  teacherName: string;
}

export const ClassesTab: React.FC<ClassesTabProps> = ({
  currentClass,
  onRefresh,
  teacherId,
  teacherName,
}) => {
  const { updateCurrentProfile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Form states for class & school & teacher profile
  const [className, setClassName] = useState(currentClass.name || '8A1');
  const [grade, setGrade] = useState(currentClass.grade || '8');
  const [room, setRoom] = useState(currentClass.room || 'Phòng 204 - Dãy B');
  const [formSchoolYear, setFormSchoolYear] = useState(currentClass.schoolYear || '2026 - 2027');
  const [schoolName, setSchoolName] = useState(currentClass.schoolName || 'Trường THCS Sơn Phong');
  const [schoolAddress, setSchoolAddress] = useState(currentClass.schoolAddress || 'Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam');
  const [schoolWard, setSchoolWard] = useState(currentClass.schoolWard || 'Phường Sơn Phong');
  const [schoolCity, setSchoolCity] = useState(currentClass.schoolCity || 'TP. Hội An');
  const [formTeacherName, setFormTeacherName] = useState(teacherName || currentClass.teacherName || 'Nguyễn Thị Minh Hòa');
  const [teacherPhone, setTeacherPhone] = useState('0912345678');
  const [teacherEmail, setTeacherEmail] = useState('nguyenthiminhhoanvk12@gmail.com');

  const handleOpenEdit = () => {
    setClassName(currentClass.name);
    setGrade(currentClass.grade);
    setRoom(currentClass.room || '');
    setFormSchoolYear(currentClass.schoolYear);
    setSchoolName(currentClass.schoolName || 'Trường THCS Sơn Phong');
    setSchoolAddress(currentClass.schoolAddress || 'Phường Sơn Phong, TP. Hội An');
    setSchoolWard(currentClass.schoolWard || 'Phường Sơn Phong');
    setSchoolCity(currentClass.schoolCity || 'TP. Hội An');
    setFormTeacherName(currentClass.teacherName || teacherName);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim() || !schoolName.trim() || !formTeacherName.trim()) return;

    setLoading(true);
    try {
      await updateClassAndSchoolProfile(currentClass.id, teacherId, {
        name: className.trim(),
        grade: grade.trim(),
        schoolYear: formSchoolYear.trim(),
        room: room.trim(),
        schoolName: schoolName.trim(),
        schoolAddress: schoolAddress.trim(),
        schoolWard: schoolWard.trim(),
        schoolCity: schoolCity.trim(),
        teacherName: formTeacherName.trim(),
        teacherPhone: teacherPhone.trim(),
        teacherEmail: teacherEmail.trim(),
      });

      await updateCurrentProfile({
        displayName: formTeacherName.trim(),
        className: className.trim(),
        grade: grade.trim(),
        schoolYear: formSchoolYear.trim(),
        schoolName: schoolName.trim(),
        schoolAddress: schoolAddress.trim(),
        schoolWard: schoolWard.trim(),
        schoolCity: schoolCity.trim(),
        phone: teacherPhone.trim(),
        email: teacherEmail.trim(),
      });

      setModalOpen(false);
      setStatusMsg('Cập nhật thành công tên GVCN, Lớp chủ nhiệm và Trường học!');
      setTimeout(() => setStatusMsg(null), 4000);
      onRefresh();
    } catch (err) {
      console.error('Save class profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[11px] font-bold border border-indigo-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
              Mô Hình 1 Giáo Viên = 1 Lớp Chủ Nhiệm
            </span>
            <span className="text-xs text-indigo-200">Đồng bộ Cloud Firestore</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Hồ Sơ Lớp Chủ Nhiệm & Trường Học</h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
            Mỗi giáo viên chỉ được quản lý duy nhất 1 lớp chủ nhiệm và là Quản trị viên (Admin) của lớp mình. Không chia sẻ hoặc truy cập chéo dữ liệu của lớp khác.
          </p>
        </div>

        <button
          onClick={handleOpenEdit}
          className="px-4 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer self-start md:self-auto"
        >
          <Edit2 className="w-4 h-4 text-indigo-600" />
          <span>Chỉnh sửa hồ sơ Lớp & Trường</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border bg-emerald-50 text-emerald-800 border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Architecture Model Visualization */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          Sơ đồ kiến trúc quản lý lớp chủ nhiệm
        </h3>

        <div className="flex flex-col items-center py-4 bg-slate-50 rounded-2xl border border-slate-100">
          {/* Level 1: Teacher Admin */}
          <div className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl shadow-md text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              GIÁO VIÊN / ADMIN
            </span>
            <p className="font-black text-sm mt-1">{currentClass.teacherName}</p>
            <p className="text-[11px] text-indigo-100">Toàn quyền quản trị tài khoản & dữ liệu lớp</p>
          </div>

          {/* Arrow */}
          <div className="w-0.5 h-6 bg-indigo-300 my-1"></div>

          {/* Level 2: 1 Homeroom Class */}
          <div className="px-8 py-3 bg-white border-2 border-indigo-500 text-slate-900 rounded-2xl shadow-sm text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              DUY NHẤT 1 LỚP CHỦ NHIỆM
            </span>
            <p className="font-black text-base mt-1 text-indigo-950">
              Lớp {currentClass.name} (Khối {currentClass.grade})
            </p>
            <p className="text-xs text-slate-500">
              {currentClass.schoolName} • Năm học {currentClass.schoolYear}
            </p>
          </div>

          {/* Fork Arrow */}
          <div className="w-0.5 h-6 bg-indigo-300 my-1"></div>
          <div className="w-48 sm:w-64 h-0.5 bg-indigo-300"></div>
          <div className="flex justify-between w-48 sm:w-64">
            <div className="w-0.5 h-4 bg-indigo-300"></div>
            <div className="w-0.5 h-4 bg-indigo-300"></div>
          </div>

          {/* Level 3: Students & Parents */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-md px-4 mt-1">
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">HỌC SINH</span>
              <p className="text-xs font-bold text-emerald-950 mt-0.5">Sĩ số: {currentClass.studentCount || 12} em</p>
              <p className="text-[10px] text-emerald-700">Xem điểm, điểm danh, nề nếp bản thân</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">PHỤ HUYNH</span>
              <p className="text-xs font-bold text-amber-950 mt-0.5">Liên kết phụ huynh</p>
              <p className="text-[10px] text-amber-700">Theo dõi con & trao đổi với GVCN</p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid (3 Cards as required by Section II & III) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: THÔNG TIN GIÁO VIÊN CHỦ NHIỆM */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <GraduationCap className="w-5 h-5" />
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">1. Giáo Viên Chủ Nhiệm</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Họ và tên GVCN</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{currentClass.teacherName}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Vai trò trong lớp</p>
                <span className="inline-block mt-0.5 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-md border border-indigo-200 text-[11px]">
                  Giáo viên chủ nhiệm & Admin
                </span>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Tài khoản đăng nhập (Username)</p>
                <p className="font-mono font-bold text-indigo-700 mt-0.5">admin.minhhoa</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Số điện thoại liên hệ</p>
                <p className="font-mono font-bold text-slate-800 mt-0.5">0912.345.678</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Email công vụ</p>
                <p className="font-medium text-slate-700 mt-0.5">nguyenthiminhhoanvk12@gmail.com</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>teacherId:</span>
            <span className="font-bold text-slate-600">{currentClass.teacherId}</span>
          </div>
        </div>

        {/* Card 2: THÔNG TIN LỚP CHỦ NHIỆM */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <Users className="w-5 h-5" />
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">2. Lớp Chủ Nhiệm</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Tên lớp chủ nhiệm</p>
                <p className="font-black text-slate-900 text-lg mt-0.5 text-indigo-900">Lớp {currentClass.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">Khối</p>
                  <p className="font-bold text-slate-800 mt-0.5">Khối {currentClass.grade}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">Năm học</p>
                  <p className="font-bold text-slate-800 mt-0.5">{currentClass.schoolYear}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Phòng học cố định</p>
                <p className="font-bold text-slate-800 mt-0.5">{currentClass.room || 'Phòng 204 - Dãy B'}</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Tổng số học sinh lớp</p>
                <p className="font-black text-slate-900 mt-0.5 text-sm">{currentClass.studentCount || 12} học sinh</p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Quy chế quản lý</p>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200 inline-block mt-0.5">
                  ✓ Duy nhất 1 GVCN phụ trách
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>classId:</span>
            <span className="font-bold text-slate-600">{currentClass.id}</span>
          </div>
        </div>

        {/* Card 3: THÔNG TIN TRƯỜNG HỌC */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <School className="w-5 h-5" />
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">3. Thông Tin Trường</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Tên trường</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {currentClass.schoolName || 'Trường THCS Sơn Phong'}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Địa chỉ trường</p>
                <p className="font-medium text-slate-700 mt-0.5">
                  {currentClass.schoolAddress || 'Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">Phường / Xã</p>
                  <p className="font-bold text-slate-800 mt-0.5">{currentClass.schoolWard || 'Phường Sơn Phong'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-semibold text-[11px]">Tỉnh / Thành phố</p>
                  <p className="font-bold text-slate-800 mt-0.5">{currentClass.schoolCity || 'TP. Hội An'}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-semibold text-[11px]">Cơ sở dữ liệu đám mây</p>
                <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-semibold border border-indigo-200 inline-block mt-0.5">
                  Cloud Firestore Realtime DB
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-400 font-mono">
            <div className="flex justify-between">
              <span>schoolId:</span>
              <span className="font-bold text-slate-600">{currentClass.schoolId || 'school-thcs-son-phong'}</span>
            </div>
            <div className="flex justify-between">
              <span>schoolYearId:</span>
              <span className="font-bold text-slate-600">{currentClass.schoolYearId || 'year-2026-2027'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Chỉnh sửa Hồ sơ Lớp chủ nhiệm & Trường học"
        subtitle="Cập nhật thông tin nhận diện lớp chủ nhiệm và trường học trên Cloud Firestore"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Thông tin GVCN */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Thông tin Giáo viên Chủ nhiệm</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên GVCN *</label>
                <input
                  type="text"
                  value={formTeacherName}
                  onChange={(e) => setFormTeacherName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>

          {/* Thông tin Lớp */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Thông tin Lớp Chủ Nhiệm</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên lớp *</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="8A1"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khối *</label>
                <input
                  type="text"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="8"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Năm học *</label>
                <input
                  type="text"
                  value={formSchoolYear}
                  onChange={(e) => setFormSchoolYear(e.target.value)}
                  placeholder="2026 - 2027"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phòng học</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Phòng 204 - Dãy B"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Thông tin Trường */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-bold text-slate-800 mb-2">Thông tin Trường Học</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Tên trường *</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Trường THCS Sơn Phong"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ trường</label>
                <input
                  type="text"
                  value={schoolAddress}
                  onChange={(e) => setSchoolAddress(e.target.value)}
                  placeholder="Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phường / Xã</label>
                <input
                  type="text"
                  value={schoolWard}
                  onChange={(e) => setSchoolWard(e.target.value)}
                  placeholder="Phường Sơn Phong"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tỉnh / Thành phố</label>
                <input
                  type="text"
                  value={schoolCity}
                  onChange={(e) => setSchoolCity(e.target.value)}
                  placeholder="TP. Hội An"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {loading ? 'Đang lưu...' : 'Lưu hồ sơ Lớp & Trường'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
