import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Users,
  GraduationCap,
  KeyRound,
  Lock,
  Unlock,
  Ban,
  CheckCircle2,
  Edit2,
  Plus,
  Search,
  Link,
  Unlink,
  Clock,
  Phone,
  Mail,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  School,
  Layers,
} from 'lucide-react';
import { HomeroomClass, Student, UserProfile, UserRole, AccountStatus } from '../../../types';
import {
  getAllAccounts,
  createAccount,
  updateAccount,
  changeAccountPassword,
  setAccountStatus,
  linkParentToStudent,
  unlinkParentFromStudent,
  createStudentWithAccount,
  createTeacherWithClass,
} from '../../../services/firestoreService';
import { Modal } from '../../../components/common/Modal';

interface AccountManagementTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  onRefresh: () => void;
}

export const AccountManagementTab: React.FC<AccountManagementTabProps> = ({
  currentClass,
  students,
  onRefresh,
}) => {
  const [activeGroup, setActiveGroup] = useState<'teacher' | 'student' | 'parent'>('student');
  const [accounts, setAccounts] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [createStudentModalOpen, setCreateStudentModalOpen] = useState(false);
  const [createTeacherModalOpen, setCreateTeacherModalOpen] = useState(false);
  const [createParentModalOpen, setCreateParentModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [targetAccount, setTargetAccount] = useState<UserProfile | null>(null);

  // 1. Form state: Create Student With Account
  const [stFullName, setStFullName] = useState('');
  const [stCode, setStCode] = useState('');
  const [stDob, setStDob] = useState('2012-01-01');
  const [stGender, setStGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [stAddress, setStAddress] = useState('Phường Sơn Phong, TP. Hội An');
  const [stPhone, setStPhone] = useState('');
  const [stParentName, setStParentName] = useState('');
  const [stParentRelationship, setStParentRelationship] = useState<'Cha' | 'Mẹ' | 'Người giám hộ'>('Cha');
  const [stParentPhone, setStParentPhone] = useState('');
  const [stParentEmail, setStParentEmail] = useState('');
  const [stUsername, setStUsername] = useState('');
  const [stPassword, setStPassword] = useState('123456');
  const [stAutoParentAccount, setStAutoParentAccount] = useState(true);

  // 2. Form state: Create Teacher With Homeroom Class
  const [tcDisplayName, setTcDisplayName] = useState('');
  const [tcUsername, setTcUsername] = useState('');
  const [tcPassword, setTcPassword] = useState('123456');
  const [tcEmail, setTcEmail] = useState('');
  const [tcPhone, setTcPhone] = useState('');
  const [tcClassName, setTcClassName] = useState('8A2');
  const [tcGrade, setTcGrade] = useState('8');
  const [tcSchoolYear, setTcSchoolYear] = useState('2026 - 2027');
  const [tcSchoolName, setTcSchoolName] = useState(currentClass.schoolName || 'Trường THCS Sơn Phong');
  const [tcSchoolAddress, setTcSchoolAddress] = useState(currentClass.schoolAddress || 'Phường Sơn Phong, TP. Hội An');
  const [tcSchoolWard, setTcSchoolWard] = useState(currentClass.schoolWard || 'Phường Sơn Phong');
  const [tcSchoolCity, setTcSchoolCity] = useState(currentClass.schoolCity || 'TP. Hội An');
  const [tcRoom, setTcRoom] = useState('Phòng 205');

  // 3. Form state: Create Parent Standalone Account
  const [prFullName, setPrFullName] = useState('');
  const [prRelationship, setPrRelationship] = useState<'Cha' | 'Mẹ' | 'Người giám hộ'>('Cha');
  const [prPhone, setPrPhone] = useState('');
  const [prEmail, setPrEmail] = useState('');
  const [prPassword, setPrPassword] = useState('123456');
  const [prStudentId, setPrStudentId] = useState(students[0]?.id || '');

  // 4. Form state: Edit Account & Change Password
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('123456');

  // Link student state
  const [linkStudentId, setLinkStudentId] = useState(students[0]?.id || '');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const list = await getAllAccounts();
      setAccounts(list || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Open Create Student Modal
  const handleOpenCreateStudent = () => {
    const nextNum = students.length + 1;
    const defaultCode = `HS8A1${String(nextNum).padStart(2, '0')}`;
    setStFullName('');
    setStCode(defaultCode);
    setStDob('2012-05-15');
    setStGender('Nam');
    setStAddress('Phường Sơn Phong, TP. Hội An');
    setStPhone('');
    setStParentName('');
    setStParentRelationship('Cha');
    setStParentPhone(`09876543${String(nextNum).padStart(2, '0')}`);
    setStParentEmail('');
    setStUsername(defaultCode.toLowerCase());
    setStPassword('123456');
    setStAutoParentAccount(true);
    setCreateStudentModalOpen(true);
  };

  // Submit Create Student
  const handleSubmitCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stFullName.trim() || !stUsername.trim()) return;

    setLoading(true);
    try {
      await createStudentWithAccount({
        fullName: stFullName.trim(),
        studentCode: stCode.trim(),
        dob: stDob,
        gender: stGender,
        address: stAddress.trim(),
        phone: stPhone.trim(),
        fatherName: stParentRelationship === 'Cha' ? stParentName.trim() : undefined,
        motherName: stParentRelationship === 'Mẹ' ? stParentName.trim() : undefined,
        parentPhone: stParentPhone.trim(),
        parentEmail: stParentEmail.trim(),
        username: stUsername.trim().toLowerCase(),
        password: stPassword || '123456',
        classId: currentClass.id,
        className: currentClass.name,
        teacherId: currentClass.teacherId,
        schoolId: currentClass.schoolId || 'school-thcs-son-phong',
        schoolYearId: currentClass.schoolYearId || 'year-2026-2027',
        schoolYear: currentClass.schoolYear,
        createParentAccount: stAutoParentAccount,
        parentRelationship: stParentRelationship,
      });

      setCreateStudentModalOpen(false);
      showStatus(`Tạo học sinh ${stFullName} & cấp tài khoản thành công!`);
      await fetchAccounts();
      onRefresh();
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi tạo tài khoản học sinh', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Create Teacher Modal
  const handleOpenCreateTeacher = () => {
    setTcDisplayName('');
    setTcUsername('gvcn.moi');
    setTcPassword('123456');
    setTcEmail('');
    setTcPhone('');
    setTcClassName('8A2');
    setTcGrade('8');
    setTcSchoolYear(currentClass.schoolYear || '2026 - 2027');
    setTcSchoolName(currentClass.schoolName || 'Trường THCS Sơn Phong');
    setTcSchoolAddress(currentClass.schoolAddress || 'Phường Sơn Phong, TP. Hội An');
    setTcSchoolWard(currentClass.schoolWard || 'Phường Sơn Phong');
    setTcSchoolCity(currentClass.schoolCity || 'TP. Hội An');
    setTcRoom('Phòng 205');
    setCreateTeacherModalOpen(true);
  };

  // Submit Create Teacher
  const handleSubmitCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tcDisplayName.trim() || !tcUsername.trim() || !tcClassName.trim()) return;

    setLoading(true);
    try {
      await createTeacherWithClass({
        displayName: tcDisplayName.trim(),
        username: tcUsername.trim().toLowerCase(),
        password: tcPassword.trim() || '123456',
        email: tcEmail.trim(),
        phone: tcPhone.trim(),
        className: tcClassName.trim(),
        grade: tcGrade.trim(),
        schoolYear: tcSchoolYear.trim(),
        schoolName: tcSchoolName.trim(),
        schoolAddress: tcSchoolAddress.trim(),
        schoolWard: tcSchoolWard.trim(),
        schoolCity: tcSchoolCity.trim(),
        room: tcRoom.trim(),
      });

      setCreateTeacherModalOpen(false);
      showStatus(`Tạo hồ sơ giáo viên ${tcDisplayName} (GVCN Lớp ${tcClassName}) thành công!`);
      await fetchAccounts();
      onRefresh();
    } catch (err: any) {
      showStatus(err.message || 'Lỗi tạo tài khoản giáo viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Create Parent Modal
  const handleOpenCreateParent = () => {
    setPrFullName('');
    setPrRelationship('Cha');
    setPrPhone('0987654399');
    setPrEmail('');
    setPrPassword('123456');
    setPrStudentId(students[0]?.id || '');
    setCreateParentModalOpen(true);
  };

  // Submit Create Parent
  const handleSubmitCreateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prFullName.trim() || !prPhone.trim()) return;

    setLoading(true);
    try {
      const selectedStudent = students.find((s) => s.id === prStudentId);
      await createAccount({
        username: prPhone.trim(),
        password: prPassword.trim() || '123456',
        displayName: `${prFullName.trim()} (${prRelationship} em ${selectedStudent?.fullName || 'học sinh'})`,
        email: prEmail.trim(),
        phone: prPhone.trim(),
        role: 'parent',
        status: 'active',
        studentId: prStudentId || undefined,
        linkedStudentIds: prStudentId ? [prStudentId] : [],
        linkedStudentName: selectedStudent ? selectedStudent.fullName : undefined,
        classId: currentClass.id,
        className: currentClass.name,
        isAdmin: false,
        lastLoginAt: new Date().toISOString(),
      });

      setCreateParentModalOpen(false);
      showStatus(`Tạo tài khoản phụ huynh ${prFullName} thành công!`);
      await fetchAccounts();
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi tạo tài khoản phụ huynh', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (acc: UserProfile) => {
    setTargetAccount(acc);
    setFormDisplayName(acc.displayName);
    setFormUsername(acc.username);
    setFormEmail(acc.email || '');
    setFormPhone(acc.phone || '');
    setEditModalOpen(true);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccount) return;

    setLoading(true);
    try {
      await updateAccount(targetAccount.id, {
        displayName: formDisplayName.trim(),
        username: formUsername.trim().toLowerCase(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
      });
      setEditModalOpen(false);
      showStatus('Cập nhật thông tin tài khoản thành công!');
      await fetchAccounts();
    } catch (err: any) {
      showStatus(err.message || 'Lỗi khi cập nhật tài khoản', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Change Password Modal
  const handleOpenPassword = (acc: UserProfile) => {
    setTargetAccount(acc);
    setNewPasswordInput('123456');
    setPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccount || !newPasswordInput.trim()) return;

    setLoading(true);
    try {
      await changeAccountPassword(targetAccount.id, newPasswordInput.trim());
      setPasswordModalOpen(false);
      showStatus(`Đã đổi mật khẩu cho "${targetAccount.displayName}" thành công!`);
      await fetchAccounts();
    } catch (err: any) {
      showStatus(err.message || 'Lỗi đổi mật khẩu', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick Reset Password to default "123456"
  const handleQuickResetPassword = async (acc: UserProfile) => {
    if (confirm(`Đặt lại mật khẩu cho tài khoản "${acc.displayName}" về mặc định "123456"?`)) {
      setLoading(true);
      try {
        await changeAccountPassword(acc.id, '123456');
        showStatus(`Đã đặt lại mật khẩu cho "${acc.displayName}" về mặc định (123456)!`);
        await fetchAccounts();
      } catch (err: any) {
        showStatus(err.message || 'Lỗi đặt lại mật khẩu', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Change Status: Lock / Unlock / Disable / Activate
  const handleSetStatus = async (acc: UserProfile, newStatus: AccountStatus) => {
    const actionText =
      newStatus === 'locked' ? 'khóa' : newStatus === 'disabled' ? 'vô hiệu hóa' : 'mở khóa / kích hoạt lại';
    if (confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${acc.displayName}"?`)) {
      setLoading(true);
      try {
        await setAccountStatus(acc.id, newStatus);
        showStatus(`Đã ${actionText} tài khoản thành công!`);
        await fetchAccounts();
      } catch (err: any) {
        showStatus(err.message || 'Lỗi thay đổi trạng thái', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Link / Unlink Parent
  const handleOpenLink = (acc: UserProfile) => {
    setTargetAccount(acc);
    setLinkStudentId(students[0]?.id || '');
    setLinkModalOpen(true);
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAccount || !linkStudentId) return;

    const student = students.find((s) => s.id === linkStudentId);
    if (!student) return;

    setLoading(true);
    try {
      await linkParentToStudent(targetAccount.id, student.id, student.fullName);
      setLinkModalOpen(false);
      showStatus(`Đã liên kết phụ huynh với học sinh ${student.fullName}!`);
      await fetchAccounts();
    } catch (err: any) {
      showStatus(err.message || 'Lỗi liên kết phụ huynh', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (parentId: string, studentId: string) => {
    if (confirm('Bạn có chắc chắn muốn hủy liên kết học sinh này khỏi tài khoản phụ huynh?')) {
      setLoading(true);
      try {
        await unlinkParentFromStudent(parentId, studentId);
        showStatus('Đã hủy liên kết học sinh thành công!');
        await fetchAccounts();
      } catch (err: any) {
        showStatus(err.message || 'Lỗi hủy liên kết', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filtered accounts for current group
  const groupAccounts = accounts.filter((a) => {
    if (activeGroup === 'teacher') return a.role === 'teacher' || a.role === 'teacher_admin';
    return a.role === activeGroup;
  });

  const filtered = groupAccounts.filter(
    (a) =>
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (a.username && a.username.toLowerCase().includes(search.toLowerCase())) ||
      (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
      (a.phone && a.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              Đặc Quyền Quản Trị Viên (Admin)
            </span>
            <span className="text-xs text-slate-300">Giáo viên là người duy nhất quản trị tài khoản lớp</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Trung Tâm Quản Lý Tài Khoản & Phân Quyền</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Mô hình phân cấp: <strong>Giáo viên (Admin) → 1 Lớp Chủ Nhiệm → Học sinh & Phụ huynh</strong>. Giáo viên có toàn quyền cấp tài khoản, đổi username, đặt lại mật khẩu và khóa/mở khóa.
          </p>
        </div>

        {/* Action Buttons: Explicit "+ TẠO TÀI KHOẢN HỌC SINH" requested */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreateStudent}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-amber-300" />
            <span>+ TẠO TÀI KHOẢN HỌC SINH</span>
          </button>

          <button
            onClick={handleOpenCreateParent}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Tạo TK Phụ huynh</span>
          </button>

          <button
            onClick={handleOpenCreateTeacher}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <School className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Cấp TK Giáo viên</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Role Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveGroup('student')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeGroup === 'student'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tài khoản Học sinh</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeGroup === 'student' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {accounts.filter((a) => a.role === 'student').length}
            </span>
          </button>

          <button
            onClick={() => setActiveGroup('parent')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeGroup === 'parent'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Tài khoản Phụ huynh</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeGroup === 'parent' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {accounts.filter((a) => a.role === 'parent').length}
            </span>
          </button>

          <button
            onClick={() => setActiveGroup('teacher')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeGroup === 'teacher'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Tài khoản Giáo viên (Admin)</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                activeGroup === 'teacher' ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {accounts.filter((a) => a.role === 'teacher' || a.role === 'teacher_admin').length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, username, sđt..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Account Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Tên hiển thị & Vai trò</th>
                <th className="py-3 px-4">Tên đăng nhập (Username)</th>
                {activeGroup === 'student' && <th className="py-3 px-4">Lớp chủ nhiệm</th>}
                {activeGroup === 'student' && <th className="py-3 px-4">SĐT Phụ huynh</th>}
                {activeGroup === 'parent' && <th className="py-3 px-4">Học sinh liên kết</th>}
                {activeGroup === 'teacher' && <th className="py-3 px-4">Lớp & Trường phụ trách</th>}
                <th className="py-3 px-4">Thông tin liên hệ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4">Đăng nhập gần nhất</th>
                <th className="py-3 px-4 text-right">Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Không tìm thấy tài khoản nào phù hợp
                  </td>
                </tr>
              ) : (
                filtered.map((acc) => {
                  const isLocked = acc.status === 'locked';
                  const isDisabled = acc.status === 'disabled';

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-50 transition ${isLocked || isDisabled ? 'bg-slate-50/60' : ''}`}
                    >
                      {/* Name & Role */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              acc.role === 'teacher' || acc.role === 'teacher_admin'
                                ? 'bg-indigo-100 text-indigo-700'
                                : acc.role === 'student'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {acc.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{acc.displayName}</p>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {acc.id.slice(0, 14)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-100">
                          {acc.username}
                        </span>
                      </td>

                      {/* Student Class */}
                      {activeGroup === 'student' && (
                        <td className="py-3 px-4 font-bold text-slate-700">{acc.className || currentClass.name}</td>
                      )}

                      {/* Student Linked Parent */}
                      {activeGroup === 'student' && (
                        <td className="py-3 px-4">
                          {students.find((s) => s.id === acc.studentId)?.parentPhone ? (
                            <span className="text-slate-700 font-mono font-semibold">
                              {students.find((s) => s.id === acc.studentId)?.parentPhone}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa liên kết</span>
                          )}
                        </td>
                      )}

                      {/* Parent Linked Student */}
                      {activeGroup === 'parent' && (
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {acc.linkedStudentName ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-emerald-700">{acc.linkedStudentName}</span>
                                <button
                                  onClick={() => handleUnlink(acc.id, acc.studentId || '')}
                                  className="text-[10px] text-rose-500 hover:text-rose-700 cursor-pointer"
                                  title="Hủy liên kết"
                                >
                                  (Hủy)
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenLink(acc)}
                                className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-bold text-[10px] border border-amber-200 hover:bg-amber-100 flex items-center gap-1 cursor-pointer"
                              >
                                <Link className="w-3 h-3" />
                                <span>+ Liên kết HS</span>
                              </button>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Teacher Homeroom Info */}
                      {activeGroup === 'teacher' && (
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">
                            Lớp {acc.className || currentClass.name} ({acc.grade || currentClass.grade})
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {acc.schoolName || currentClass.schoolName} • {acc.schoolYear || currentClass.schoolYear}
                          </p>
                        </td>
                      )}

                      {/* Contact */}
                      <td className="py-3 px-4 text-slate-600">
                        {acc.phone && <p className="font-mono font-medium">{acc.phone}</p>}
                        {acc.email && <p className="text-[11px] text-slate-400">{acc.email}</p>}
                        {!acc.phone && !acc.email && <span className="text-slate-400 italic">—</span>}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            acc.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : acc.status === 'locked'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {acc.status === 'active' ? 'Hoạt động' : acc.status === 'locked' ? 'Đã khóa' : 'Vô hiệu hóa'}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {acc.lastLoginAt
                          ? new Date(acc.lastLoginAt).toLocaleString('vi-VN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Chưa đăng nhập'}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Sửa thông tin */}
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Chỉnh sửa thông tin đăng nhập"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Đặt lại mật khẩu nhanh về 123456 */}
                          <button
                            onClick={() => handleQuickResetPassword(acc)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Đặt lại mật khẩu về 123456"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Đổi mật khẩu tùy chọn */}
                          <button
                            onClick={() => handleOpenPassword(acc)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Nhập mật khẩu mới tùy ý"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Khóa / Mở khóa */}
                          {isLocked ? (
                            <button
                              onClick={() => handleSetStatus(acc, 'active')}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Mở khóa tài khoản"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetStatus(acc, 'locked')}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Khóa tài khoản"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Vô hiệu hóa / Kích hoạt lại */}
                          {isDisabled ? (
                            <button
                              onClick={() => handleSetStatus(acc, 'active')}
                              className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md hover:bg-emerald-100 cursor-pointer"
                              title="Kích hoạt lại tài khoản"
                            >
                              Kích hoạt
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetStatus(acc, 'disabled')}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Vô hiệu hóa tài khoản"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TẠO TÀI KHOẢN HỌC SINH (FORM HOÀN CHỈNH) */}
      <Modal
        isOpen={createStudentModalOpen}
        onClose={() => setCreateStudentModalOpen(false)}
        title="+ TẠO TÀI KHOẢN HỌC SINH"
        subtitle={`Lớp chủ nhiệm: ${currentClass.name} • Trường THCS Sơn Phong • Năm học ${currentClass.schoolYear}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitCreateStudent} className="space-y-4 text-xs">
          {/* Section A: THÔNG TIN HỌC SINH */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              1. Thông Tin Cá Nhân Học Sinh
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên học sinh *</label>
                <input
                  type="text"
                  value={stFullName}
                  onChange={(e) => setStFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã học sinh *</label>
                <input
                  type="text"
                  value={stCode}
                  onChange={(e) => setStCode(e.target.value)}
                  placeholder="Ví dụ: HS8A113"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium font-mono focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  value={stDob}
                  onChange={(e) => setStDob(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                <select
                  value={stGender}
                  onChange={(e) => setStGender(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Địa chỉ thường trú</label>
                <input
                  type="text"
                  value={stAddress}
                  onChange={(e) => setStAddress(e.target.value)}
                  placeholder="Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại học sinh</label>
                <input
                  type="text"
                  value={stPhone}
                  onChange={(e) => setStPhone(e.target.value)}
                  placeholder="0912345678 (nếu có)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section B: THÔNG TIN PHỤ HUYNH */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              2. Thông Tin Phụ Huynh Liên Kết
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ tên cha / mẹ / người giám hộ</label>
                <input
                  type="text"
                  value={stParentName}
                  onChange={(e) => setStParentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mối quan hệ</label>
                <select
                  value={stParentRelationship}
                  onChange={(e) => setStParentRelationship(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Cha">Cha / Bố</option>
                  <option value="Mẹ">Mẹ</option>
                  <option value="Người giám hộ">Người giám hộ</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại phụ huynh *</label>
                <input
                  type="text"
                  value={stParentPhone}
                  onChange={(e) => setStParentPhone(e.target.value)}
                  placeholder="0987654321 (dùng làm username PH)"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email phụ huynh</label>
                <input
                  type="email"
                  value={stParentEmail}
                  onChange={(e) => setStParentEmail(e.target.value)}
                  placeholder="phuhuynh@gmail.com"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section C: TÀI KHOẢN ĐĂNG NHẬP */}
          <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100">
            <h4 className="font-black text-indigo-950 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              3. Thiết Lập Tài Khoản Đăng Nhập
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-indigo-950 mb-1">Username Học sinh *</label>
                <input
                  type="text"
                  value={stUsername}
                  onChange={(e) => setStUsername(e.target.value)}
                  placeholder="hs8a113"
                  required
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl font-medium font-mono focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-indigo-950 mb-1">Mật khẩu ban đầu *</label>
                <input
                  type="text"
                  value={stPassword}
                  onChange={(e) => setStPassword(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl font-medium font-mono focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-indigo-100/80">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-900">
                <input
                  type="checkbox"
                  checked={stAutoParentAccount}
                  onChange={(e) => setStAutoParentAccount(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                />
                <span>Đồng thời tạo tài khoản cho Phụ huynh (Username là SĐT, Mật khẩu: 123456) & liên kết ngay</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateStudentModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {loading ? 'Đang tạo...' : 'Xác nhận tạo học sinh & cấp tài khoản'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: TẠO TÀI KHOẢN GIÁO VIÊN & HỒ SƠ LỚP */}
      <Modal
        isOpen={createTeacherModalOpen}
        onClose={() => setCreateTeacherModalOpen(false)}
        title="+ CẤP TÀI KHOẢN GIÁO VIÊN CHỦ NHIỆM"
        subtitle="Mỗi giáo viên chỉ quản lý duy nhất 1 lớp chủ nhiệm và là Quản trị viên (Admin) của lớp đó."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitCreateTeacher} className="space-y-4 text-xs">
          {/* Thông tin giáo viên */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              Thông Tin Giáo Viên Chủ Nhiệm
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và tên giáo viên *</label>
                <input
                  type="text"
                  value={tcDisplayName}
                  onChange={(e) => setTcDisplayName(e.target.value)}
                  placeholder="Ví dụ: Trần Văn Nam"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username đăng nhập *</label>
                <input
                  type="text"
                  value={tcUsername}
                  onChange={(e) => setTcUsername(e.target.value)}
                  placeholder="gvcn.nam"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mật khẩu ban đầu *</label>
                <input
                  type="text"
                  value={tcPassword}
                  onChange={(e) => setTcPassword(e.target.value)}
                  placeholder="123456"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={tcPhone}
                  onChange={(e) => setTcPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={tcEmail}
                  onChange={(e) => setTcEmail(e.target.value)}
                  placeholder="giaovien@school.edu.vn"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>

          {/* Thông tin lớp & trường */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-indigo-600" />
              Thông Tin Lớp Chủ Nhiệm Duy Nhất & Trường Học
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên lớp chủ nhiệm *</label>
                <input
                  type="text"
                  value={tcClassName}
                  onChange={(e) => setTcClassName(e.target.value)}
                  placeholder="8A2"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khối *</label>
                <input
                  type="text"
                  value={tcGrade}
                  onChange={(e) => setTcGrade(e.target.value)}
                  placeholder="8"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Năm học *</label>
                <input
                  type="text"
                  value={tcSchoolYear}
                  onChange={(e) => setTcSchoolYear(e.target.value)}
                  placeholder="2026 - 2027"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Tên trường *</label>
                <input
                  type="text"
                  value={tcSchoolName}
                  onChange={(e) => setTcSchoolName(e.target.value)}
                  placeholder="Trường THCS Sơn Phong"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phòng học</label>
                <input
                  type="text"
                  value={tcRoom}
                  onChange={(e) => setTcRoom(e.target.value)}
                  placeholder="Phòng 205"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateTeacherModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {loading ? 'Đang tạo...' : 'Xác nhận cấp tài khoản Giáo viên'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: TẠO TÀI KHOẢN PHỤ HUYNH RIÊNG BIỆT */}
      <Modal
        isOpen={createParentModalOpen}
        onClose={() => setCreateParentModalOpen(false)}
        title="+ TẠO TÀI KHOẢN PHỤ HUYNH"
        subtitle="Tạo tài khoản và liên kết trực tiếp với hồ sơ học sinh trong lớp."
        maxWidth="md"
      >
        <form onSubmit={handleSubmitCreateParent} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ và tên phụ huynh *</label>
            <input
              type="text"
              value={prFullName}
              onChange={(e) => setPrFullName(e.target.value)}
              placeholder="Ví dụ: Trần Văn Cường"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mối quan hệ *</label>
              <select
                value={prRelationship}
                onChange={(e) => setPrRelationship(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              >
                <option value="Cha">Cha / Bố</option>
                <option value="Mẹ">Mẹ</option>
                <option value="Người giám hộ">Người giám hộ</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại (Username) *</label>
              <input
                type="text"
                value={prPhone}
                onChange={(e) => setPrPhone(e.target.value)}
                placeholder="0987654302"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Học sinh liên kết *</label>
            <select
              value={prStudentId}
              onChange={(e) => setPrStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mật khẩu ban đầu *</label>
              <input
                type="text"
                value={prPassword}
                onChange={(e) => setPrPassword(e.target.value)}
                placeholder="123456"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={prEmail}
                onChange={(e) => setPrEmail(e.target.value)}
                placeholder="phuhuynh@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateParentModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {loading ? 'Đang tạo...' : 'Xác nhận tạo tài khoản Phụ huynh'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: CHỈNH SỬA THÔNG TIN ĐĂNG NHẬP */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Chỉnh sửa thông tin đăng nhập"
        subtitle={`Tài khoản: ${targetAccount?.displayName}`}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
            <input
              type="text"
              value={formDisplayName}
              onChange={(e) => setFormDisplayName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên đăng nhập (Username) *</label>
            <input
              type="text"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {loading ? 'Đang lưu...' : 'Lưu cập nhật'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: ĐỔI MẬT KHẨU TÙY Ý */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Đổi / Đặt lại mật khẩu"
        subtitle={`Tài khoản: ${targetAccount?.displayName} (${targetAccount?.username})`}
        maxWidth="md"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nhập mật khẩu mới *</label>
            <input
              type="text"
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Nhập mật khẩu mới (vd: 123456)"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white font-mono text-sm"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] leading-relaxed">
            Mật khẩu mới sẽ có hiệu lực ngay lập tức trên hệ thống Cloud Firestore. Hãy cung cấp mật khẩu này cho người dùng.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {loading ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 6: LIÊN KẾT PHỤ HUYNH VỚI HỌC SINH */}
      <Modal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Liên kết phụ huynh với học sinh"
        subtitle={`Phụ huynh: ${targetAccount?.displayName}`}
        maxWidth="md"
      >
        <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Chọn học sinh trong lớp chủ nhiệm *</label>
            <select
              value={linkStudentId}
              onChange={(e) => setLinkStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setLinkModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {loading ? 'Đang liên kết...' : 'Xác nhận liên kết'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
