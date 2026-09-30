import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, testConnection } from '../firebase/config';
import { getUserProfile, saveUserProfile, authenticateWithAccount } from '../services/firestoreService';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginWithAccount: (identifier: string, pass: string) => Promise<void>;
  loginAsDemoUser: (role: UserRole, studentId?: string, studentName?: string) => Promise<void>;
  switchRole: (newRole: UserRole) => Promise<void>;
  updateCurrentProfile: (data: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Default fallback role is teacher for initial management
  const role: UserRole = userProfile?.role || 'teacher';

  useEffect(() => {
    testConnection();

    // Check localStorage for simulated profile if non-auth session
    const storedDemoProfile = localStorage.getItem('demo_user_profile');

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
          } else {
            // Create initial profile for newly logged in user
            const isOwner = user.email === 'nguyenthiminhhoanvk12@gmail.com';
            const newProfile: UserProfile = {
              id: user.uid,
              username: user.email?.split('@')[0] || 'gvcn',
              displayName: user.displayName || 'Giáo viên Chủ nhiệm',
              email: user.email || '',
              role: isOwner ? 'teacher' : 'teacher',
              status: 'active',
              isAdmin: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await saveUserProfile(newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else if (storedDemoProfile) {
        try {
          const parsed = JSON.parse(storedDemoProfile);
          setUserProfile(parsed);
        } catch {
          setUserProfile(null);
        }
        setCurrentUser(null);
      } else {
        // Automatically provide demo teacher profile if not logged in so initial state is immediately accessible
        const defaultTeacherProfile: UserProfile = {
          id: 'demo-teacher-01',
          username: 'admin.minhhoa',
          displayName: 'Nguyễn Thị Minh Hòa',
          email: 'nguyenthiminhhoanvk12@gmail.com',
          role: 'teacher_admin',
          status: 'active',
          isAdmin: true,
          phone: '0912345678',
          classId: 'class-8a1',
          className: '8A1',
          grade: '8',
          schoolId: 'school-thcs-son-phong',
          schoolName: 'Trường THCS Sơn Phong',
          schoolAddress: 'Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam',
          schoolWard: 'Phường Sơn Phong',
          schoolCity: 'TP. Hội An',
          schoolYearId: 'year-2026-2027',
          schoolYear: '2026 - 2027',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUserProfile(defaultTeacherProfile);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (result.user) {
        localStorage.removeItem('demo_user_profile');
        const profile = await getUserProfile(result.user.uid);
        if (profile) {
          setUserProfile(profile);
        } else {
          const newProfile: UserProfile = {
            id: result.user.uid,
            username: result.user.email?.split('@')[0] || 'gvcn',
            displayName: result.user.displayName || 'Nguyễn Thị Minh Hòa',
            email: result.user.email || '',
            role: 'teacher_admin',
            status: 'active',
            isAdmin: true,
            className: '8A1',
            grade: '8',
            schoolName: 'Trường THCS Sơn Phong',
            schoolYear: '2026 - 2027',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await saveUserProfile(newProfile);
          setUserProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithAccount = async (identifier: string, pass: string) => {
    setLoading(true);
    try {
      const profile = await authenticateWithAccount(identifier, pass);
      localStorage.setItem('demo_user_profile', JSON.stringify(profile));
      setUserProfile(profile);
      setCurrentUser(null);
    } catch (error) {
      console.error('Account authentication error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoUser = async (roleType: UserRole, studentId?: string, studentName?: string) => {
    setLoading(true);
    let profile: UserProfile;

    if (roleType === 'teacher' || roleType === 'teacher_admin') {
      profile = {
        id: 'demo-teacher-01',
        username: 'admin.minhhoa',
        displayName: 'Nguyễn Thị Minh Hòa',
        email: 'nguyenthiminhhoanvk12@gmail.com',
        role: 'teacher_admin',
        status: 'active',
        isAdmin: true,
        phone: '0912345678',
        className: '8A1',
        grade: '8',
        schoolName: 'Trường THCS Sơn Phong',
        schoolYear: '2026 - 2027',
      };
    } else if (roleType === 'student') {
      profile = {
        id: studentId || 'student-demo-01',
        username: 'hs8a101',
        displayName: studentName || 'Nguyễn Văn An',
        role: 'student',
        status: 'active',
        studentId: studentId || 'student-demo-01',
        phone: '0912345601',
        className: '8A1',
        grade: '8',
        schoolName: 'Trường THCS Sơn Phong',
        schoolYear: '2026 - 2027',
      };
    } else {
      profile = {
        id: `parent-${studentId || 'demo-01'}`,
        username: '0987654301',
        displayName: `Bác Nguyễn Văn Hùng (PH ${studentName || 'Nguyễn Văn An'})`,
        role: 'parent',
        status: 'active',
        studentId: studentId || 'student-demo-01',
        linkedStudentIds: [studentId || 'student-demo-01'],
        phone: '0987654301',
        className: '8A1',
        grade: '8',
        schoolName: 'Trường THCS Sơn Phong',
        schoolYear: '2026 - 2027',
      };
    }

    localStorage.setItem('demo_user_profile', JSON.stringify(profile));
    setUserProfile(profile);
    setLoading(false);
  };

  const switchRole = async (newRole: UserRole) => {
    if (userProfile) {
      const updated: UserProfile = {
        ...userProfile,
        role: newRole,
      };
      if (currentUser) {
        await saveUserProfile(updated);
      } else {
        localStorage.setItem('demo_user_profile', JSON.stringify(updated));
      }
      setUserProfile(updated);
    }
  };

  const updateCurrentProfile = async (data: Partial<UserProfile>) => {
    if (userProfile) {
      const updated: UserProfile = {
        ...userProfile,
        ...data,
      };
      if (currentUser || userProfile.id) {
        try {
          await saveUserProfile(updated);
        } catch (e) {
          console.warn('Sync profile to Firestore error:', e);
        }
      }
      localStorage.setItem('demo_user_profile', JSON.stringify(updated));
      setUserProfile(updated);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (currentUser) {
        await firebaseSignOut(auth);
      }
      localStorage.removeItem('demo_user_profile');
      // Set to guest state
      setUserProfile(null);
      setCurrentUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        loading,
        signInWithGoogle,
        loginWithAccount,
        loginAsDemoUser,
        switchRole,
        updateCurrentProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
