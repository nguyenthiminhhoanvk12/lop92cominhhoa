import React from 'react';
import {
  GraduationCap,
  Bell,
  LogOut,
  UserCheck,
  School,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HomeroomClass, UserRole } from '../../types';

interface NavbarProps {
  currentClass: HomeroomClass | null;
  classes: HomeroomClass[];
  onSelectClass: (c: HomeroomClass) => void;
  unreadCount?: number;
  onOpenNotifications?: () => void;
  onOpenClassModal?: () => void;
  schoolYear: string;
  onSelectSchoolYear: (year: string) => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentClass,
  classes,
  onSelectClass,
  unreadCount = 0,
  onOpenNotifications,
  onOpenClassModal,
  schoolYear,
  onSelectSchoolYear,
  onToggleSidebar,
}) => {
  const { userProfile, role, switchRole, signOut, loginAsDemoUser } = useAuth();

  const roleLabels: Record<UserRole, { label: string; color: string }> = {
    teacher_admin: { label: 'Giáo viên Chủ nhiệm (Admin)', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    teacher: { label: 'Giáo viên Chủ nhiệm', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    student: { label: 'Học sinh', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    parent: { label: 'Phụ huynh', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-slate-900 text-base leading-tight tracking-tight">
                  QUẢN LÝ LỚP CHỦ NHIỆM
                </h1>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Đồng bộ Cloud Firestore
                </p>
              </div>
            </div>
          </div>

          {/* Center: Homeroom Class & School Information Badge */}
          <div className="hidden md:flex items-center gap-2">
            {(role === 'teacher' || role === 'teacher_admin') && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                  <School className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{currentClass?.schoolName || 'Trường THCS Sơn Phong'}</span>
                </div>
                <span className="text-indigo-300">•</span>
                <span className="font-extrabold text-indigo-800 bg-white px-2 py-0.5 rounded-md shadow-2xs border border-indigo-100">
                  Lớp {currentClass?.name || '8A1'} ({currentClass?.grade ? `Khối ${currentClass.grade}` : 'Khối 8'})
                </span>
                <span className="text-indigo-300">•</span>
                <span className="text-slate-600 font-semibold">
                  NH {currentClass?.schoolYear || '2026 - 2027'}
                </span>
              </div>
            )}
          </div>

          {/* Right: Role Switcher Demo, Notifications, User info */}
          <div className="flex items-center gap-3">
            {/* Quick Role Tester (allows checking all 3 roles instantly) */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <span className="px-2 text-slate-500 text-[11px] font-medium">Xem dạng:</span>
              <button
                onClick={() => loginAsDemoUser('teacher')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  role === 'teacher' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Giáo viên
              </button>
              <button
                onClick={() => loginAsDemoUser('student')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  role === 'student' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Học sinh
              </button>
              <button
                onClick={() => loginAsDemoUser('parent')}
                className={`px-2.5 py-1 rounded-md font-medium transition ${
                  role === 'parent' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Phụ huynh
              </button>
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
              title="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown / Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs ring-2 ring-indigo-500/20">
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-none truncate max-w-[130px]">
                  {userProfile?.displayName || 'Người dùng'}
                </p>
                <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${roleLabels[role].color}`}>
                  {roleLabels[role].label}
                </span>
              </div>

              <button
                onClick={signOut}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
