import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/common/Navbar';
import { TeacherSidebar, TeacherTab } from '../../components/common/TeacherSidebar';
import { Modal } from '../../components/common/Modal';
import { Edit2, School, GraduationCap, CheckCircle2 } from 'lucide-react';
import {
  HomeroomClass,
  Student,
  AttendanceRecord,
  Score,
  CompetitionRule,
  CompetitionEntry,
  DailyReport,
  Announcement,
} from '../../types';
import {
  getClasses,
  getStudentsByClass,
  getAttendanceHistory,
  getScoresByClass,
  getCompetitionRules,
  getCompetitionsByClass,
  getDailyReports,
  getAnnouncements,
  seedDemoClassData,
  updateClassAndSchoolProfile,
} from '../../services/firestoreService';

// Tabs
import { OverviewTab } from './tabs/OverviewTab';
import { AccountManagementTab } from './tabs/AccountManagementTab';
import { ClassesTab } from './tabs/ClassesTab';
import { StudentsTab } from './tabs/StudentsTab';
import { ParentsTab } from './tabs/ParentsTab';
import { AttendanceTab } from './tabs/AttendanceTab';
import { ScoresTab } from './tabs/ScoresTab';
import { CompetitionTab } from './tabs/CompetitionTab';
import { DailyReportsTab } from './tabs/DailyReportsTab';
import { AnnouncementsTab } from './tabs/AnnouncementsTab';
import { MessagesTab } from './tabs/MessagesTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { AiAssistantTab } from './tabs/AiAssistantTab';
import { SettingsTab } from './tabs/SettingsTab';

export const TeacherDashboard: React.FC = () => {
  const { userProfile, updateCurrentProfile } = useAuth();
  const [currentTab, setCurrentTab] = useState<TeacherTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [schoolYear, setSchoolYear] = useState('2026-2027');

  // Firestore loaded states
  const [classes, setClasses] = useState<HomeroomClass[]>([]);
  const [currentClass, setCurrentClass] = useState<HomeroomClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [competitionRules, setCompetitionRules] = useState<CompetitionRule[]>([]);
  const [competitions, setCompetitions] = useState<CompetitionEntry[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Teacher, Class, School Modal State
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editRoom, setEditRoom] = useState('');
  const [editSchoolYear, setEditSchoolYear] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editSchoolAddress, setEditSchoolAddress] = useState('');
  const [editSchoolWard, setEditSchoolWard] = useState('');
  const [editSchoolCity, setEditSchoolCity] = useState('');
  const [editTeacherPhone, setEditTeacherPhone] = useState('0912345678');
  const [editTeacherEmail, setEditTeacherEmail] = useState('nguyenthiminhhoanvk12@gmail.com');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState<string | null>(null);

  const teacherId = userProfile?.id || 'demo-teacher-01';
  const teacherName = userProfile?.displayName || 'Nguyễn Thị Minh Hòa';

  const handleOpenEditProfile = () => {
    if (currentClass) {
      setEditTeacherName(currentClass.teacherName || teacherName || 'Nguyễn Thị Minh Hòa');
      setEditClassName(currentClass.name || '8A1');
      setEditGrade(currentClass.grade || '8');
      setEditRoom(currentClass.room || 'Phòng 204 - Dãy B');
      setEditSchoolYear(currentClass.schoolYear || schoolYear || '2026 - 2027');
      setEditSchoolName(currentClass.schoolName || 'Trường THCS Sơn Phong');
      setEditSchoolAddress(currentClass.schoolAddress || 'Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam');
      setEditSchoolWard(currentClass.schoolWard || 'Phường Sơn Phong');
      setEditSchoolCity(currentClass.schoolCity || 'TP. Hội An');
      setEditTeacherPhone(userProfile?.phone || '0912345678');
      setEditTeacherEmail(userProfile?.email || 'nguyenthiminhhoanvk12@gmail.com');
    }
    setEditProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass || !editClassName.trim() || !editSchoolName.trim() || !editTeacherName.trim()) return;

    setSavingProfile(true);
    try {
      await updateClassAndSchoolProfile(currentClass.id, teacherId, {
        name: editClassName.trim(),
        grade: editGrade.trim(),
        schoolYear: editSchoolYear.trim(),
        room: editRoom.trim(),
        schoolName: editSchoolName.trim(),
        schoolAddress: editSchoolAddress.trim(),
        schoolWard: editSchoolWard.trim(),
        schoolCity: editSchoolCity.trim(),
        teacherName: editTeacherName.trim(),
        teacherPhone: editTeacherPhone.trim(),
        teacherEmail: editTeacherEmail.trim(),
      });

      await updateCurrentProfile({
        displayName: editTeacherName.trim(),
        className: editClassName.trim(),
        grade: editGrade.trim(),
        schoolYear: editSchoolYear.trim(),
        schoolName: editSchoolName.trim(),
        schoolAddress: editSchoolAddress.trim(),
        schoolWard: editSchoolWard.trim(),
        schoolCity: editSchoolCity.trim(),
        phone: editTeacherPhone.trim(),
        email: editTeacherEmail.trim(),
      });

      setCurrentClass((prev) =>
        prev
          ? {
              ...prev,
              name: editClassName.trim(),
              grade: editGrade.trim(),
              schoolYear: editSchoolYear.trim(),
              room: editRoom.trim(),
              schoolName: editSchoolName.trim(),
              schoolAddress: editSchoolAddress.trim(),
              schoolWard: editSchoolWard.trim(),
              schoolCity: editSchoolCity.trim(),
              teacherName: editTeacherName.trim(),
            }
          : null
      );

      setProfileSaveMsg('Đã cập nhật thành công tên Giáo viên, Lớp chủ nhiệm và Trường học!');
      setTimeout(() => setProfileSaveMsg(null), 4000);
      setEditProfileModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error('Save teacher profile error:', err);
    } finally {
      setSavingProfile(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'GV';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Initial Data Load
  const fetchAllData = async () => {
    setLoading(true);
    try {
      let classList = await getClasses();

      // If no classes exist yet, auto-seed the demo class so app has instant data
      if (!classList || classList.length === 0) {
        await seedDemoClassData(teacherId, teacherName);
        classList = await getClasses();
      }

      setClasses(classList || []);
      const activeCls = currentClass
        ? (classList.find(c => c.id === currentClass.id) || classList[0])
        : classList[0];
      setCurrentClass(activeCls || null);

      if (activeCls) {
        const [
          stList,
          attList,
          scList,
          rulesList,
          compList,
          repList,
          annList,
        ] = await Promise.all([
          getStudentsByClass(activeCls.id),
          getAttendanceHistory(activeCls.id),
          getScoresByClass(activeCls.id),
          getCompetitionRules(activeCls.id),
          getCompetitionsByClass(activeCls.id),
          getDailyReports(activeCls.id),
          getAnnouncements(activeCls.id),
        ]);

        setStudents(stList || []);
        setAttendance(attList || []);
        setScores(scList || []);
        setCompetitionRules(rulesList || []);
        setCompetitions(compList || []);
        setDailyReports(repList || []);
        setAnnouncements(annList || []);
      }
    } catch (err) {
      console.error('Fetch teacher dashboard data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [teacherId]);

  // When active class changes
  const handleSelectClass = async (cls: HomeroomClass) => {
    setCurrentClass(cls);
    setLoading(true);
    try {
      const [
        stList,
        attList,
        scList,
        rulesList,
        compList,
        repList,
        annList,
      ] = await Promise.all([
        getStudentsByClass(cls.id),
        getAttendanceHistory(cls.id),
        getScoresByClass(cls.id),
        getCompetitionRules(cls.id),
        getCompetitionsByClass(cls.id),
        getDailyReports(cls.id),
        getAnnouncements(cls.id),
      ]);

      setStudents(stList || []);
      setAttendance(attList || []);
      setScores(scList || []);
      setCompetitionRules(rulesList || []);
      setCompetitions(compList || []);
      setDailyReports(repList || []);
      setAnnouncements(annList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        currentClass={currentClass}
        classes={classes}
        onSelectClass={handleSelectClass}
        unreadCount={announcements.length}
        schoolYear={schoolYear}
        onSelectSchoolYear={setSchoolYear}
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Sidebar */}
        <TeacherSidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          unreadCount={announcements.length}
          unreadMessages={1}
        />

        {/* Main Content Pane */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0">
          {loading && !currentClass ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-semibold">Đang đồng bộ dữ liệu lớp từ Cloud Firestore...</p>
            </div>
          ) : currentClass ? (
            <>
              {/* Top Teacher & Homeroom Identification Card (Section III) */}
              <div className="mb-6 bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white text-xl font-black shadow-md shadow-indigo-200 shrink-0">
                    {getInitials(currentClass.teacherName || teacherName)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                        Giáo Viên Chủ Nhiệm (Admin Lớp)
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        1 GV = 1 Lớp Chủ Nhiệm
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
                      {currentClass.teacherName || 'Nguyễn Thị Minh Hòa'}
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-indigo-700">GVCN lớp {currentClass.name || '8A1'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-800">{currentClass.schoolName || 'Trường THCS Sơn Phong'}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-semibold">Năm học {currentClass.schoolYear || '2026 - 2027'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lớp / Phòng</p>
                    <p className="text-xs font-bold text-slate-800 font-mono">
                      Lớp {currentClass.name} • {currentClass.room || 'Phòng 204 - Dãy B'}
                    </p>
                  </div>
                  <div className="px-3.5 py-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-right">
                    <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Khối / Sĩ số</p>
                    <p className="text-xs font-bold text-indigo-900">
                      Khối {currentClass.grade} • {students.length} học sinh
                    </p>
                  </div>
                  <button
                    onClick={handleOpenEditProfile}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer shrink-0"
                    title="Giáo viên được quyền thay đổi tên, lớp chủ nhiệm, trường"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-indigo-100" />
                    <span>Đổi tên, lớp & trường</span>
                  </button>
                </div>
              </div>

              {profileSaveMsg && (
                <div className="mb-6 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{profileSaveMsg}</span>
                </div>
              )}

              {currentTab === 'dashboard' && (
                <OverviewTab
                  currentClass={currentClass}
                  students={students}
                  attendance={attendance}
                  scores={scores}
                  competitions={competitions}
                  dailyReports={dailyReports}
                  announcements={announcements}
                  onNavigateTab={setCurrentTab}
                  onQuickAttend={() => setCurrentTab('attendance')}
                  onQuickReport={() => setCurrentTab('daily-reports')}
                />
              )}

              {currentTab === 'accounts' && (
                <AccountManagementTab
                  currentClass={currentClass}
                  students={students}
                  onRefresh={fetchAllData}
                />
              )}

              {currentTab === 'classes' && (
                <ClassesTab
                  classes={classes}
                  currentClass={currentClass}
                  onSelectClass={handleSelectClass}
                  onRefresh={fetchAllData}
                  schoolYear={schoolYear}
                  onSelectSchoolYear={setSchoolYear}
                  teacherId={teacherId}
                  teacherName={teacherName}
                />
              )}

              {currentTab === 'students' && (
                <StudentsTab
                  currentClass={currentClass}
                  students={students}
                  onRefresh={fetchAllData}
                />
              )}

              {currentTab === 'parents' && (
                <ParentsTab
                  currentClass={currentClass}
                  students={students}
                  onRefresh={fetchAllData}
                />
              )}

              {currentTab === 'attendance' && (
                <AttendanceTab
                  currentClass={currentClass}
                  students={students}
                  attendanceHistory={attendance}
                  onRefresh={fetchAllData}
                  teacherName={teacherName}
                />
              )}

              {currentTab === 'scores' && (
                <ScoresTab
                  currentClass={currentClass}
                  students={students}
                  scores={scores}
                  onRefresh={fetchAllData}
                />
              )}

              {currentTab === 'competition' && (
                <CompetitionTab
                  currentClass={currentClass}
                  students={students}
                  rules={competitionRules}
                  competitions={competitions}
                  onRefresh={fetchAllData}
                  teacherName={teacherName}
                />
              )}

              {currentTab === 'daily-reports' && (
                <DailyReportsTab
                  currentClass={currentClass}
                  students={students}
                  reports={dailyReports}
                  onRefresh={fetchAllData}
                  teacherName={teacherName}
                />
              )}

              {currentTab === 'announcements' && (
                <AnnouncementsTab
                  currentClass={currentClass}
                  students={students}
                  announcements={announcements}
                  onRefresh={fetchAllData}
                  teacherName={teacherName}
                  teacherId={teacherId}
                />
              )}

              {currentTab === 'messages' && (
                <MessagesTab
                  currentClass={currentClass}
                  students={students}
                  teacherId={teacherId}
                  teacherName={teacherName}
                />
              )}

              {currentTab === 'statistics' && (
                <StatisticsTab
                  currentClass={currentClass}
                  students={students}
                  attendance={attendance}
                  scores={scores}
                  competitions={competitions}
                />
              )}

              {currentTab === 'ai-assistant' && (
                <AiAssistantTab
                  currentClass={currentClass}
                  students={students}
                  attendance={attendance}
                  scores={scores}
                  competitions={competitions}
                  dailyReports={dailyReports}
                  teacherName={teacherName}
                  teacherId={teacherId}
                  onRefresh={fetchAllData}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsTab
                  currentClass={currentClass}
                  students={students}
                  scores={scores}
                  attendance={attendance}
                  competitions={competitions}
                  schoolYear={schoolYear}
                  onSelectSchoolYear={setSchoolYear}
                  teacherId={teacherId}
                  teacherName={teacherName}
                  onRefresh={fetchAllData}
                />
              )}

              {/* Modal Thay Đổi Tên GVCN, Lớp Chủ Nhiệm & Trường Học */}
              <Modal
                isOpen={editProfileModalOpen}
                onClose={() => setEditProfileModalOpen(false)}
                title="Thay đổi Tên GVCN, Lớp chủ nhiệm & Trường học"
                subtitle="Giáo viên có toàn quyền cập nhật tên mình, lớp chủ nhiệm và trường học trên Cloud Firestore"
                maxWidth="lg"
              >
                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  {/* 1. Thông tin Giáo viên */}
                  <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-2 mb-2.5 text-indigo-950 font-bold">
                      <GraduationCap className="w-4 h-4 text-indigo-600" />
                      <span>1. Thông tin Giáo viên Chủ nhiệm (Admin Lớp)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block font-semibold text-slate-700 mb-1">
                          Họ và tên Giáo viên *
                        </label>
                        <input
                          type="text"
                          value={editTeacherName}
                          onChange={(e) => setEditTeacherName(e.target.value)}
                          placeholder="Nguyễn Thị Minh Hòa"
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Số điện thoại</label>
                        <input
                          type="text"
                          value={editTeacherPhone}
                          onChange={(e) => setEditTeacherPhone(e.target.value)}
                          placeholder="0912345678"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium font-mono focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editTeacherEmail}
                          onChange={(e) => setEditTeacherEmail(e.target.value)}
                          placeholder="nguyenthiminhhoanvk12@gmail.com"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Thông tin Lớp Chủ Nhiệm */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2.5 text-slate-900 font-bold">
                      <School className="w-4 h-4 text-indigo-600" />
                      <span>2. Thông tin Lớp Chủ Nhiệm</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Tên Lớp chủ nhiệm *</label>
                        <input
                          type="text"
                          value={editClassName}
                          onChange={(e) => setEditClassName(e.target.value)}
                          placeholder="8A1"
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-black text-indigo-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Khối *</label>
                        <input
                          type="text"
                          value={editGrade}
                          onChange={(e) => setEditGrade(e.target.value)}
                          placeholder="8"
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Năm học *</label>
                        <input
                          type="text"
                          value={editSchoolYear}
                          onChange={(e) => setEditSchoolYear(e.target.value)}
                          placeholder="2026 - 2027"
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Phòng học</label>
                        <input
                          type="text"
                          value={editRoom}
                          onChange={(e) => setEditRoom(e.target.value)}
                          placeholder="Phòng 204 - Dãy B"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Thông tin Trường Học */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-2 mb-2.5 text-slate-900 font-bold">
                      <School className="w-4 h-4 text-emerald-600" />
                      <span>3. Thông tin Trường Học</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block font-semibold text-slate-700 mb-1">Tên Trường Học *</label>
                        <input
                          type="text"
                          value={editSchoolName}
                          onChange={(e) => setEditSchoolName(e.target.value)}
                          placeholder="Trường THCS Sơn Phong"
                          required
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-black text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block font-semibold text-slate-700 mb-1">Địa chỉ trường</label>
                        <input
                          type="text"
                          value={editSchoolAddress}
                          onChange={(e) => setEditSchoolAddress(e.target.value)}
                          placeholder="Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Phường / Xã</label>
                        <input
                          type="text"
                          value={editSchoolWard}
                          onChange={(e) => setEditSchoolWard(e.target.value)}
                          placeholder="Phường Sơn Phong"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block font-semibold text-slate-700 mb-1">Tỉnh / Thành phố</label>
                        <input
                          type="text"
                          value={editSchoolCity}
                          onChange={(e) => setEditSchoolCity(e.target.value)}
                          placeholder="TP. Hội An"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditProfileModalOpen(false)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      {savingProfile ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Đang lưu lên Firestore...</span>
                        </>
                      ) : (
                        <span>Lưu thay đổi</span>
                      )}
                    </button>
                  </div>
                </form>
              </Modal>
            </>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs">
              Chưa có lớp học nào được chọn.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
