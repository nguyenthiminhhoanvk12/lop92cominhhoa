import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ParentDashboard } from './pages/parent/ParentDashboard';

function MainRouter() {
  const { userProfile, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold tracking-tight">QUẢN LÝ LỚP CHỦ NHIỆM</h2>
        <p className="text-xs text-slate-400 mt-1">Đang khởi tạo kết nối Cloud Firestore...</p>
      </div>
    );
  }

  // If no user profile is active, show the Login Page
  if (!userProfile) {
    return <LoginPage />;
  }

  // Route to the appropriate role dashboard
  if (role === 'student') {
    return <StudentDashboard />;
  }

  if (role === 'parent') {
    return <ParentDashboard />;
  }

  // Default is teacher
  return <TeacherDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
