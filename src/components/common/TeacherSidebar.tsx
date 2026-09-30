import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Users,
  UserCheck,
  CalendarCheck,
  Award,
  Medal,
  FileText,
  Bell,
  MessageSquare,
  BarChart3,
  Bot,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export type TeacherTab =
  | 'dashboard'
  | 'accounts'
  | 'classes'
  | 'students'
  | 'parents'
  | 'attendance'
  | 'scores'
  | 'competition'
  | 'daily-reports'
  | 'announcements'
  | 'messages'
  | 'statistics'
  | 'ai-assistant'
  | 'settings';

interface TeacherSidebarProps {
  currentTab: TeacherTab;
  onSelectTab: (tab: TeacherTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  unreadCount?: number;
  unreadMessages?: number;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  unreadCount = 0,
  unreadMessages = 0,
}) => {
  const menuItems: Array<{ id: TeacherTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'dashboard', label: '1. Dashboard Tổng quan', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'accounts', label: '2. Quản lý tài khoản (Admin)', icon: <ShieldCheck className="w-4 h-4 text-amber-500" /> },
    { id: 'classes', label: '3. Hồ sơ Lớp & Trường', icon: <Layers className="w-4 h-4" /> },
    { id: 'students', label: '4. Danh sách học sinh', icon: <Users className="w-4 h-4" /> },
    { id: 'parents', label: '5. Phụ huynh & Liên kết', icon: <UserCheck className="w-4 h-4" /> },
    { id: 'attendance', label: '6. Điểm danh chuyên cần', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'scores', label: '7. Hệ thống điểm số', icon: <Award className="w-4 h-4" /> },
    { id: 'competition', label: '8. Thi đua & Xếp hạng', icon: <Medal className="w-4 h-4" /> },
    { id: 'daily-reports', label: '9. Báo cáo hàng ngày', icon: <FileText className="w-4 h-4" /> },
    { id: 'announcements', label: '10. Bảng tin thông báo', icon: <Bell className="w-4 h-4" />, badge: unreadCount },
    { id: 'messages', label: '11. Tin nhắn phụ huynh', icon: <MessageSquare className="w-4 h-4" />, badge: unreadMessages },
    { id: 'statistics', label: '12. Thống kê & Biểu đồ', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'ai-assistant', label: '13. Trợ lý Gemini AI', icon: <Bot className="w-4 h-4 text-violet-500" /> },
    { id: 'settings', label: '14. Cài đặt & Sao lưu', icon: <Settings className="w-4 h-4" /> },
  ];

  const handleSelect = (tab: TeacherTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-40 overflow-y-auto transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Giáo Viên Chủ Nhiệm
          </div>

          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={active ? 'text-white' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          active
                            ? 'bg-white text-indigo-700'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {active && <ChevronRight className="w-3.5 h-3.5 text-white/80" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Cloud Sync Status Indicator */}
        <div className="p-4 mx-3 mb-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-semibold text-slate-700">Cloud Firestore</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Dữ liệu tự động lưu và đồng bộ đa thiết bị tức thì.
          </p>
        </div>
      </aside>
    </>
  );
};
