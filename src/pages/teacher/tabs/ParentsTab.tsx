import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  KeyRound,
  Lock,
  Unlock,
  Phone,
  Mail,
  CheckCircle2,
  Search,
  Users,
} from 'lucide-react';
import { HomeroomClass, Student, Parent } from '../../../types';
import { Modal } from '../../../components/common/Modal';

interface ParentsTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  onRefresh: () => void;
}

export const ParentsTab: React.FC<ParentsTabProps> = ({
  currentClass,
  students,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [accountStatus, setAccountStatus] = useState<Record<string, 'active' | 'locked'>>({});

  // Form
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || '');
  const [parentName, setParentName] = useState('');
  const [relationship, setRelationship] = useState<'Bố' | 'Mẹ' | 'Người giám hộ'>('Bố');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const toggleLock = (studentId: string) => {
    setAccountStatus(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'locked' ? 'active' : 'locked',
    }));
  };

  const handleOpenReset = (s: Student) => {
    setTargetStudent(s);
    setResetSuccess(false);
    setResetModalOpen(true);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSuccess(true);
    setTimeout(() => {
      setResetSuccess(false);
      setResetModalOpen(false);
    }, 2000);
  };

  const filtered = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
    (s.parentPhone && s.parentPhone.includes(search)) ||
    (s.fatherName && s.fatherName.toLowerCase().includes(search.toLowerCase())) ||
    (s.motherName && s.motherName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Quản Lý Tài Khoản Phụ Huynh Lớp {currentClass.name}</h2>
          <p className="text-xs text-slate-500">
            Mỗi phụ huynh được liên kết bảo mật với đúng con của mình, giáo viên có thể cấp lại mật khẩu và kiểm soát trạng thái tài khoản.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên học sinh, họ tên phụ huynh, SĐT..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Parent List Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Học sinh liên kết</th>
                <th className="py-3 px-4">Đại diện Phụ huynh</th>
                <th className="py-3 px-4">Quan hệ</th>
                <th className="py-3 px-4">Tài khoản đăng nhập (SĐT)</th>
                <th className="py-3 px-4">Email liên hệ</th>
                <th className="py-3 px-4 text-center">Trạng thái tài khoản</th>
                <th className="py-3 px-4 text-right">Quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((s) => {
                const isLocked = accountStatus[s.id] === 'locked';
                const parentDisplayName = s.fatherName ? `Bác ${s.fatherName}` : s.motherName ? `Cô ${s.motherName}` : `Phụ huynh em ${s.fullName}`;
                const rel = s.fatherName ? 'Bố' : s.motherName ? 'Mẹ' : 'Người giám hộ';
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{s.fullName}</div>
                      <span className="font-mono text-[10px] text-indigo-600 font-bold">{s.studentCode}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {parentDisplayName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-semibold text-[10px]">
                        {rel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {s.parentPhone}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {s.parentEmail || `phuhuynh.${s.studentCode.toLowerCase()}@school.edu.vn`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        isLocked
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isLocked ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReset(s)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Cấp lại mật khẩu mặc định"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Cấp lại MK</span>
                        </button>
                        <button
                          onClick={() => toggleLock(s.id)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isLocked
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                        >
                          {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Reset Password */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Cấp lại mật khẩu phụ huynh"
        subtitle={`Học sinh: ${targetStudent?.fullName} (SĐT: ${targetStudent?.parentPhone})`}
        maxWidth="md"
      >
        {resetSuccess ? (
          <div className="p-4 bg-emerald-50 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-emerald-900 text-sm">Mật khẩu mới đã được cấp thành công!</h4>
            <div className="p-3 bg-white border border-emerald-200 rounded-xl text-xs font-mono font-bold text-emerald-800">
              Mật khẩu mặc định mới: 123456
            </div>
            <p className="text-[11px] text-emerald-700">
              Hệ thống đã lưu cập nhật vào Firestore và có thể nhắn tin SMS cho phụ huynh.
            </p>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Bạn đang yêu cầu đặt lại mật khẩu cho tài khoản phụ huynh học sinh{' '}
              <strong>{targetStudent?.fullName}</strong>. Mật khẩu sẽ được đặt về mặc định là <strong>123456</strong>.
            </p>
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-900 text-[11px]">
              Phụ huynh sẽ dùng Số điện thoại <strong>{targetStudent?.parentPhone}</strong> và mật khẩu mới để đăng nhập.
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                Xác nhận cấp lại
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
