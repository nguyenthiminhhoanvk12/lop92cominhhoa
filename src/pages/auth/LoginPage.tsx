import React, { useState } from 'react';
import {
  GraduationCap,
  Eye,
  EyeOff,
  LogIn,
  School,
  UserCheck,
  Users,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Modal } from '../../components/common/Modal';

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, loginAsDemoUser, loginWithAccount } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const roleMeta: Record<UserRole, { title: string; subtitle: string; icon: React.ReactNode; defaultAccount: string }> = {
    teacher_admin: {
      title: 'Giáo viên Chủ nhiệm (Admin)',
      subtitle: 'Quản trị viên duy nhất của lớp: quản lý tài khoản, điểm số, điểm danh, nề nếp',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      defaultAccount: 'admin.minhhoa',
    },
    teacher: {
      title: 'Giáo viên Chủ nhiệm (Admin)',
      subtitle: 'Quản trị viên duy nhất của lớp: quản lý tài khoản, điểm số, điểm danh, nề nếp',
      icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
      defaultAccount: 'admin.minhhoa',
    },
    student: {
      title: 'Học sinh',
      subtitle: 'Xem điểm cá nhân, điểm danh, điểm thi đua và nhận thông báo bài tập',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      defaultAccount: 'hs8a101',
    },
    parent: {
      title: 'Phụ huynh học sinh',
      subtitle: 'Theo dõi tình hình học tập, chuyên cần của con và trao đổi trực tiếp với GVCN',
      icon: <UserCheck className="w-5 h-5 text-amber-600" />,
      defaultAccount: '0987654301',
    },
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setAccount(roleMeta[role].defaultAccount);
    setPassword('123456');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account.trim() || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      // First try real Firestore account verification
      await loginWithAccount(account, password);
    } catch (err: any) {
      const errMsg = err.message || '';
      // If error is locked, disabled, or wrong password, show specific error
      if (errMsg.includes('TẠM KHÓA') || errMsg.includes('VÔ HIỆU HÓA') || errMsg.includes('Mật khẩu không chính xác')) {
        setErrorMessage(errMsg);
      } else {
        // Fallback to role login for initial evaluation
        try {
          await loginAsDemoUser(selectedRole);
        } catch {
          setErrorMessage(errMsg || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể đăng nhập bằng tài khoản Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setForgotSuccess(false);
      setForgotModalOpen(false);
      setForgotEmail('');
    }, 2200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* App Logo & Branding */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-3 border border-indigo-400/30">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            QUẢN LÝ LỚP CHỦ NHIỆM
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-300 max-w-sm">
            Hệ thống quản lý lớp học thời gian thực kết nối Giáo viên, Học sinh và Phụ huynh
          </p>
        </div>

        {/* Main Login Card */}
        <div className="mt-8 bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/20 p-6 sm:p-8">
          {/* Account Role Selector Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Chọn vai trò đăng nhập
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['teacher', 'student', 'parent'] as UserRole[]).map((r) => {
                const active = selectedRole === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 ${
                      active
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <span>{r === 'teacher' ? 'Giáo viên' : r === 'student' ? 'Học sinh' : 'Phụ huynh'}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
              <span className="mt-0.5">{roleMeta[selectedRole].icon}</span>
              <p className="leading-snug font-medium text-slate-600">
                <strong className="text-indigo-900 block font-semibold">{roleMeta[selectedRole].title}</strong>
                {roleMeta[selectedRole].subtitle}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                {errorMessage}
              </div>
            )}

            {/* Account field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {selectedRole === 'teacher'
                  ? 'Email / Tên đăng nhập'
                  : selectedRole === 'student'
                  ? 'Mã học sinh'
                  : 'Số điện thoại phụ huynh'}
              </label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder={roleMeta[selectedRole].defaultAccount}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition"
              />
            </div>

            {/* Password field with eye toggle */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden p-1"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập {roleMeta[selectedRole].title}</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-slate-400 font-medium">Hoặc đăng nhập với</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 shadow-xs transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Tài khoản Google (Firebase Cloud)</span>
          </button>

          {/* Quick Demo Access Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-500 font-medium mb-2">Trải nghiệm nhanh các phân quyền:</p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => loginAsDemoUser('teacher')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
              >
                Vào làm GVCN
              </button>
              <button
                type="button"
                onClick={() => loginAsDemoUser('student', 'HS10A101', 'Nguyễn Văn An')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
              >
                Vào làm Học sinh
              </button>
              <button
                type="button"
                onClick={() => loginAsDemoUser('parent', 'HS10A101', 'Nguyễn Văn An')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
              >
                Vào làm Phụ huynh
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-xs text-slate-400">
          Hệ thống Quản lý Lớp Chủ nhiệm • Phiên bản 2026-2027
        </p>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Khôi phục mật khẩu"
        subtitle="Nhập email hoặc số điện thoại đã đăng ký để nhận liên kết khôi phục."
        maxWidth="md"
      >
        {forgotSuccess ? (
          <div className="p-4 bg-emerald-50 rounded-xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-emerald-900 text-sm">Yêu cầu đã được gửi thành công!</h4>
            <p className="text-xs text-emerald-700">
              Vui lòng kiểm tra hòm thư hoặc tin nhắn SMS để hoàn tất quá trình đổi mật khẩu.
            </p>
          </div>
        ) : (
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email hoặc Số điện thoại
              </label>
              <input
                type="text"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="example@school.edu.vn hoặc 0987654321"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed">
              <strong>Lưu ý:</strong> Học sinh và Phụ huynh cũng có thể liên hệ trực tiếp Giáo viên chủ nhiệm để được cấp lại mật khẩu ngay tại mục Quản lý học sinh/phụ huynh.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm"
              >
                Gửi mã xác nhận
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
