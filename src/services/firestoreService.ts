import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  UserProfile,
  HomeroomClass,
  Student,
  Parent,
  AttendanceRecord,
  StudentAttendanceItem,
  Score,
  ScoreConfig,
  CompetitionRule,
  CompetitionEntry,
  DailyReport,
  Announcement,
  Conversation,
  Message,
} from '../types';

/* =========================================================================
   1. USER PROFILES & ACCOUNT MANAGEMENT (ADMIN - GIÁO VIÊN)
   ========================================================================= */

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = `users/${profile.id}`;
  try {
    const now = new Date().toISOString();
    await setDoc(doc(db, 'users', profile.id), {
      ...profile,
      updatedAt: now,
      createdAt: profile.createdAt || now,
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getAllAccounts(): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getAccountsByRole(role: string): Promise<UserProfile[]> {
  const path = 'users';
  try {
    const q = query(collection(db, 'users'), where('role', '==', role));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createAccount(data: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
  const path = 'users';
  try {
    const ref = data.id ? doc(db, 'users', data.id) : doc(collection(db, 'users'));
    const now = new Date().toISOString();
    const newAccount: UserProfile = {
      ...data,
      id: ref.id,
      status: data.status || 'active',
      password: data.password || '123456',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, newAccount);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAccount(userId: string, data: Partial<UserProfile>): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function changeAccountPassword(userId: string, newPassword: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      password: newPassword,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function setAccountStatus(userId: string, status: 'active' | 'locked' | 'disabled'): Promise<void> {
  const path = `users/${userId}`;
  try {
    await updateDoc(doc(db, 'users', userId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function linkParentToStudent(parentId: string, studentId: string, studentName: string): Promise<void> {
  const path = `users/${parentId}`;
  try {
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (parentDoc.exists()) {
      const data = parentDoc.data() as UserProfile;
      const currentList: string[] = data.linkedStudentIds || [];
      if (!currentList.includes(studentId)) {
        await updateDoc(doc(db, 'users', parentId), {
          linkedStudentIds: [...currentList, studentId],
          studentId: studentId,
          linkedStudentName: studentName,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function unlinkParentFromStudent(parentId: string, studentId: string): Promise<void> {
  const path = `users/${parentId}`;
  try {
    const parentDoc = await getDoc(doc(db, 'users', parentId));
    if (parentDoc.exists()) {
      const data = parentDoc.data() as UserProfile;
      const currentList: string[] = (data.linkedStudentIds || []).filter(id => id !== studentId);
      await updateDoc(doc(db, 'users', parentId), {
        linkedStudentIds: currentList,
        studentId: currentList[0] || '',
        linkedStudentName: currentList.length === 0 ? '' : data.linkedStudentName,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function authenticateWithAccount(identifier: string, pass: string): Promise<UserProfile> {
  const path = 'users';
  try {
    const normalized = identifier.trim().toLowerCase();
    let snap = await getDocs(collection(db, 'users'));

    // If Firestore is empty, auto-seed the demo class and default accounts
    if (snap.empty) {
      await seedDemoClassData('demo-teacher-01', 'Nguyễn Thị Minh Hòa');
      snap = await getDocs(collection(db, 'users'));
    }

    const matched = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)).find(u =>
      (u.username && u.username.toLowerCase() === normalized) ||
      (u.email && u.email.toLowerCase() === normalized) ||
      (u.phone && u.phone === identifier.trim()) ||
      (u.studentId && u.studentId.toLowerCase() === normalized)
    );

    if (!matched) {
      throw new Error('Tài khoản hoặc tên đăng nhập không tồn tại trong hệ thống.');
    }

    if (matched.status === 'locked') {
      throw new Error('Tài khoản này đã bị Giáo viên chủ nhiệm TẠM KHÓA. Vui lòng liên hệ GVCN để mở khóa.');
    }

    if (matched.status === 'disabled') {
      throw new Error('Tài khoản này đã bị VÔ HIỆU HÓA. Vui lòng liên hệ Giáo viên quản trị.');
    }

    // Default password check (default is 123456 if none set)
    const expectedPass = matched.password || '123456';
    if (pass !== expectedPass) {
      throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại hoặc yêu cầu giáo viên đặt lại mật khẩu.');
    }

    // Record last login time
    const now = new Date().toISOString();
    try {
      await updateDoc(doc(db, 'users', matched.id), {
        lastLoginAt: now,
        updatedAt: now,
      });
    } catch {
      // Non-blocking if offline
    }

    return {
      ...matched,
      lastLoginAt: now,
    };
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Tài khoản') || error.message.includes('Mật khẩu'))) {
      throw error;
    }
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/* =========================================================================
   2. HOMEROOM CLASSES
   ========================================================================= */

export async function getClasses(teacherId?: string): Promise<HomeroomClass[]> {
  const path = 'classes';
  try {
    const q = teacherId
      ? query(collection(db, 'classes'), where('teacherId', '==', teacherId))
      : collection(db, 'classes');
    let snap = await getDocs(q);
    if (snap.empty && !teacherId) {
      await seedDemoClassData('demo-teacher-01', 'Nguyễn Thị Minh Hòa');
      snap = await getDocs(collection(db, 'classes'));
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as HomeroomClass));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getClassById(classId: string): Promise<HomeroomClass | null> {
  const path = `classes/${classId}`;
  try {
    const snap = await getDoc(doc(db, 'classes', classId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as HomeroomClass;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function createClass(data: Omit<HomeroomClass, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = 'classes';
  try {
    const classRef = doc(collection(db, 'classes'));
    const now = new Date().toISOString();
    const newClass: HomeroomClass = {
      id: classRef.id,
      ...data,
      studentCount: data.studentCount || 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(classRef, newClass);
    return classRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateClass(classId: string, data: Partial<HomeroomClass>): Promise<void> {
  const path = `classes/${classId}`;
  try {
    await updateDoc(doc(db, 'classes', classId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteClass(classId: string): Promise<void> {
  const path = `classes/${classId}`;
  try {
    await deleteDoc(doc(db, 'classes', classId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   3. STUDENTS
   ========================================================================= */

export async function getStudentsByClass(classId: string): Promise<Student[]> {
  const path = 'students';
  try {
    const q = query(collection(db, 'students'), where('classId', '==', classId));
    const snap = await getDocs(q);
    const students = snap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
    // Sort alphabetically by last name (Vietnamese style)
    return students.sort((a, b) => {
      const nameA = a.fullName.split(' ').slice(-1)[0] || a.fullName;
      const nameB = b.fullName.split(' ').slice(-1)[0] || b.fullName;
      return nameA.localeCompare(nameB, 'vi');
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = 'students';
  try {
    const studentRef = doc(collection(db, 'students'));
    const now = new Date().toISOString();
    const newStudent: Student = {
      id: studentRef.id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(studentRef, newStudent);

    // Update class student count
    const classDoc = await getDoc(doc(db, 'classes', data.classId));
    if (classDoc.exists()) {
      const currentCount = classDoc.data()?.studentCount || 0;
      await updateDoc(doc(db, 'classes', data.classId), { studentCount: currentCount + 1 });
    }

    return studentRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateStudent(studentId: string, data: Partial<Student>): Promise<void> {
  const path = `students/${studentId}`;
  try {
    await updateDoc(doc(db, 'students', studentId), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteStudent(studentId: string, classId: string): Promise<void> {
  const path = `students/${studentId}`;
  try {
    await deleteDoc(doc(db, 'students', studentId));
    // Decrement class student count
    const classDoc = await getDoc(doc(db, 'classes', classId));
    if (classDoc.exists()) {
      const currentCount = Math.max(0, (classDoc.data()?.studentCount || 1) - 1);
      await updateDoc(doc(db, 'classes', classId), { studentCount: currentCount });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function batchImportStudents(
  classId: string,
  schoolYear: string,
  studentsList: Array<{
    fullName: string;
    studentCode: string;
    dob?: string;
    gender?: 'Nam' | 'Nữ' | 'Khác';
    address?: string;
    phone?: string;
    parentPhone?: string;
    fatherName?: string;
    motherName?: string;
  }>
): Promise<number> {
  const path = 'students';
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    let count = 0;

    for (const item of studentsList) {
      if (!item.fullName || !item.studentCode) continue;
      const ref = doc(collection(db, 'students'));
      const student: Student = {
        id: ref.id,
        classId,
        schoolYear,
        fullName: item.fullName.trim(),
        studentCode: item.studentCode.trim(),
        dob: item.dob || '2009-01-01',
        gender: item.gender || 'Nam',
        address: item.address || 'Hà Nội',
        phone: item.phone || '',
        fatherName: item.fatherName || '',
        motherName: item.motherName || '',
        parentPhone: item.parentPhone || '',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      batch.set(ref, student);
      count++;
    }

    if (count > 0) {
      await batch.commit();
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (classDoc.exists()) {
        const currentCount = classDoc.data()?.studentCount || 0;
        await updateDoc(doc(db, 'classes', classId), { studentCount: currentCount + count });
      }
    }
    return count;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* =========================================================================
   4. PARENTS
   ========================================================================= */

export async function createStudentWithAccount(data: {
  fullName: string;
  studentCode?: string;
  dob: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  phone?: string;
  address?: string;
  fatherName?: string;
  motherName?: string;
  parentPhone?: string;
  parentEmail?: string;
  username: string;
  password?: string;
  classId: string;
  className: string;
  teacherId: string;
  schoolId: string;
  schoolYearId: string;
  schoolYear: string;
  createParentAccount?: boolean;
  parentRelationship?: 'Cha' | 'Mẹ' | 'Người giám hộ' | 'Bố';
  parentPassword?: string;
}): Promise<{ student: Student; user: UserProfile; parentUser?: UserProfile }> {
  const path = 'students';
  try {
    const studentRef = doc(collection(db, 'students'));
    const now = new Date().toISOString();
    const stId = studentRef.id;
    const finalCode = data.studentCode?.trim() || `HS${data.className}${Date.now().toString().slice(-3)}`;

    const newStudent: Student = {
      id: stId,
      studentId: stId,
      classId: data.classId,
      teacherId: data.teacherId,
      schoolId: data.schoolId,
      schoolYearId: data.schoolYearId,
      schoolYear: data.schoolYear,
      fullName: data.fullName.trim(),
      studentCode: finalCode,
      dob: data.dob,
      gender: data.gender,
      address: data.address?.trim() || 'Sơn Phong, Hội An',
      phone: data.phone?.trim() || '',
      fatherName: data.fatherName?.trim() || '',
      motherName: data.motherName?.trim() || '',
      parentPhone: data.parentPhone?.trim() || data.phone?.trim() || '0987654321',
      parentEmail: data.parentEmail?.trim() || '',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(studentRef, newStudent);

    // Create User Authentication Profile for student
    const userRef = doc(db, 'users', `user-${stId}`);
    const newUser: UserProfile = {
      id: `user-${stId}`,
      username: data.username.trim().toLowerCase(),
      password: data.password || '123456',
      displayName: data.fullName.trim(),
      role: 'student',
      status: 'active',
      phone: data.phone?.trim(),
      studentId: stId,
      classId: data.classId,
      className: data.className,
      teacherId: data.teacherId,
      schoolId: data.schoolId,
      schoolYearId: data.schoolYearId,
      schoolYear: data.schoolYear,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userRef, newUser);

    // If requested, also create Parent account and link to student
    let parentUserResult: UserProfile | undefined;
    if (data.createParentAccount && (data.parentPhone || data.phone)) {
      const pPhone = (data.parentPhone || data.phone || '').trim();
      const parentName = data.fatherName || data.motherName || `Phụ huynh em ${data.fullName.trim()}`;
      const parentRef = doc(collection(db, 'parents'));
      const pId = parentRef.id;

      const newParent: Parent = {
        id: pId,
        parentId: pId,
        studentId: stId,
        studentName: data.fullName.trim(),
        classId: data.classId,
        teacherId: data.teacherId,
        schoolId: data.schoolId,
        schoolYearId: data.schoolYearId,
        fullName: parentName,
        relationship: data.parentRelationship || 'Cha',
        phone: pPhone,
        email: data.parentEmail?.trim() || '',
        userId: `user-parent-${stId}`,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(parentRef, newParent);

      const parentUserRef = doc(db, 'users', `user-parent-${stId}`);
      parentUserResult = {
        id: `user-parent-${stId}`,
        username: pPhone,
        password: data.parentPassword || '123456',
        displayName: `${parentName} (${data.parentRelationship || 'PH'} em ${data.fullName.trim()})`,
        role: 'parent',
        status: 'active',
        phone: pPhone,
        email: data.parentEmail?.trim() || '',
        studentId: stId,
        linkedStudentIds: [stId],
        linkedStudentName: data.fullName.trim(),
        classId: data.classId,
        className: data.className,
        teacherId: data.teacherId,
        schoolId: data.schoolId,
        schoolYearId: data.schoolYearId,
        schoolYear: data.schoolYear,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(parentUserRef, parentUserResult);
    }

    // Update class student count
    const classDoc = await getDoc(doc(db, 'classes', data.classId));
    if (classDoc.exists()) {
      const currentCount = classDoc.data()?.studentCount || 0;
      await updateDoc(doc(db, 'classes', data.classId), { studentCount: currentCount + 1 });
    }

    return { student: newStudent, user: newUser, parentUser: parentUserResult };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createTeacherWithClass(data: {
  displayName: string;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  className: string;
  grade: string;
  schoolYear: string;
  schoolName: string;
  schoolAddress?: string;
  schoolWard?: string;
  schoolCity?: string;
  room?: string;
}): Promise<{ teacher: UserProfile; homeroomClass: HomeroomClass }> {
  const path = 'users';
  try {
    const now = new Date().toISOString();
    const teacherId = `teacher-${Date.now().toString().slice(-6)}`;
    const classRef = doc(collection(db, 'classes'));
    const classId = classRef.id;
    const schoolId = `school-${data.schoolName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const schoolYearId = `year-${data.schoolYear.replace(/\s+/g, '')}`;

    const newClass: HomeroomClass = {
      id: classId,
      name: data.className.trim(),
      grade: data.grade.trim(),
      schoolYear: data.schoolYear.trim(),
      schoolYearId,
      schoolId,
      schoolName: data.schoolName.trim(),
      schoolAddress: data.schoolAddress?.trim() || '',
      schoolWard: data.schoolWard?.trim() || '',
      schoolCity: data.schoolCity?.trim() || '',
      teacherId,
      teacherName: data.displayName.trim(),
      room: data.room?.trim() || 'Phòng 204',
      studentCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(classRef, newClass);

    const teacherProfile: UserProfile = {
      id: teacherId,
      username: data.username.trim().toLowerCase(),
      password: data.password || '123456',
      displayName: data.displayName.trim(),
      role: 'teacher_admin',
      status: 'active',
      isAdmin: true,
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      classId,
      className: data.className.trim(),
      grade: data.grade.trim(),
      schoolId,
      schoolName: data.schoolName.trim(),
      schoolAddress: data.schoolAddress?.trim() || '',
      schoolWard: data.schoolWard?.trim() || '',
      schoolCity: data.schoolCity?.trim() || '',
      schoolYearId,
      schoolYear: data.schoolYear.trim(),
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'users', teacherId), teacherProfile);

    return { teacher: teacherProfile, homeroomClass: newClass };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateClassAndSchoolProfile(
  classId: string,
  teacherId: string,
  data: {
    name: string;
    grade: string;
    schoolYear: string;
    room?: string;
    schoolName: string;
    schoolAddress?: string;
    schoolWard?: string;
    schoolCity?: string;
    teacherName?: string;
    teacherPhone?: string;
    teacherEmail?: string;
  }
): Promise<void> {
  const path = `classes/${classId}`;
  try {
    const now = new Date().toISOString();
    await updateDoc(doc(db, 'classes', classId), {
      name: data.name.trim(),
      grade: data.grade.trim(),
      schoolYear: data.schoolYear.trim(),
      room: data.room?.trim() || '',
      schoolName: data.schoolName.trim(),
      schoolAddress: data.schoolAddress?.trim() || '',
      schoolWard: data.schoolWard?.trim() || '',
      schoolCity: data.schoolCity?.trim() || '',
      teacherName: data.teacherName?.trim() || '',
      updatedAt: now,
    });

    if (teacherId) {
      await setDoc(
        doc(db, 'users', teacherId),
        {
          className: data.name.trim(),
          grade: data.grade.trim(),
          schoolYear: data.schoolYear.trim(),
          schoolName: data.schoolName.trim(),
          schoolAddress: data.schoolAddress?.trim() || '',
          schoolWard: data.schoolWard?.trim() || '',
          schoolCity: data.schoolCity?.trim() || '',
          displayName: data.teacherName?.trim() || '',
          phone: data.teacherPhone?.trim() || '',
          email: data.teacherEmail?.trim() || '',
          updatedAt: now,
        },
        { merge: true }
      );
    }

    // Sync class users (students & parents) in users collection
    try {
      const usersQuery = query(collection(db, 'users'), where('classId', '==', classId));
      const usersSnap = await getDocs(usersQuery);
      for (const uDoc of usersSnap.docs) {
        if (uDoc.id !== teacherId) {
          await updateDoc(doc(db, 'users', uDoc.id), {
            className: data.name.trim(),
            grade: data.grade.trim(),
            schoolYear: data.schoolYear.trim(),
            schoolName: data.schoolName.trim(),
            updatedAt: now,
          });
        }
      }
    } catch (e) {
      console.warn('Sync class info to class users warning:', e);
    }

    // Sync students collection records in this class
    try {
      const studentsQuery = query(collection(db, 'students'), where('classId', '==', classId));
      const studentsSnap = await getDocs(studentsQuery);
      for (const stDoc of studentsSnap.docs) {
        await updateDoc(doc(db, 'students', stDoc.id), {
          schoolYear: data.schoolYear.trim(),
          updatedAt: now,
        });
      }
    } catch (e) {
      console.warn('Sync students schoolYear warning:', e);
    }

    // Update localStorage demo profile if matching teacher
    try {
      const stored = localStorage.getItem('demo_user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.role === 'teacher' || parsed.role === 'teacher_admin' || parsed.id === teacherId) {
          parsed.displayName = data.teacherName?.trim() || parsed.displayName;
          parsed.className = data.name.trim();
          parsed.grade = data.grade.trim();
          parsed.schoolYear = data.schoolYear.trim();
          parsed.schoolName = data.schoolName.trim();
          parsed.schoolAddress = data.schoolAddress?.trim() || parsed.schoolAddress;
          parsed.schoolWard = data.schoolWard?.trim() || parsed.schoolWard;
          parsed.schoolCity = data.schoolCity?.trim() || parsed.schoolCity;
          if (data.teacherPhone) parsed.phone = data.teacherPhone.trim();
          if (data.teacherEmail) parsed.email = data.teacherEmail.trim();
          localStorage.setItem('demo_user_profile', JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.warn('Sync localStorage warning:', e);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function createParentWithAccount(data: {
  fullName: string;
  relationship: 'Cha' | 'Mẹ' | 'Người giám hộ' | 'Bố';
  phone: string;
  email?: string;
  username: string;
  password: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  teacherId: string;
  schoolId: string;
  schoolYearId: string;
  schoolYear: string;
}): Promise<{ parent: Parent; user: UserProfile }> {
  const path = 'parents';
  try {
    const parentRef = doc(collection(db, 'parents'));
    const now = new Date().toISOString();
    const pId = parentRef.id;

    const newParent: Parent = {
      id: pId,
      parentId: pId,
      studentId: data.studentId,
      studentName: data.studentName,
      classId: data.classId,
      teacherId: data.teacherId,
      schoolId: data.schoolId,
      schoolYearId: data.schoolYearId,
      fullName: data.fullName.trim(),
      relationship: data.relationship,
      phone: data.phone.trim(),
      email: data.email?.trim(),
      userId: `user-${pId}`,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(parentRef, newParent);

    // Create User Authentication Profile for parent
    const userRef = doc(db, 'users', `user-${pId}`);
    const newUser: UserProfile = {
      id: `user-${pId}`,
      username: data.username.trim().toLowerCase(),
      password: data.password || '123456',
      displayName: `${data.fullName.trim()} (${data.relationship} em ${data.studentName})`,
      role: 'parent',
      status: 'active',
      phone: data.phone.trim(),
      email: data.email?.trim(),
      studentId: data.studentId,
      linkedStudentIds: [data.studentId],
      linkedStudentName: data.studentName,
      classId: data.classId,
      className: data.className,
      teacherId: data.teacherId,
      schoolId: data.schoolId,
      schoolYearId: data.schoolYearId,
      schoolYear: data.schoolYear,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userRef, newUser);

    return { parent: newParent, user: newUser };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveParent(parent: Omit<Parent, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
  const path = 'parents';
  try {
    const ref = parent.id ? doc(db, 'parents', parent.id) : doc(collection(db, 'parents'));
    const now = new Date().toISOString();
    await setDoc(ref, {
      ...parent,
      id: ref.id,
      updatedAt: now,
      createdAt: now,
    }, { merge: true });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* =========================================================================
   5. ATTENDANCE
   ========================================================================= */

export async function getAttendanceByDate(classId: string, date: string): Promise<AttendanceRecord | null> {
  const path = 'attendance';
  try {
    const q = query(
      collection(db, 'attendance'),
      where('classId', '==', classId),
      where('date', '==', date)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const first = snap.docs[0];
      return { id: first.id, ...first.data() } as AttendanceRecord;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function getAttendanceHistory(classId: string): Promise<AttendanceRecord[]> {
  const path = 'attendance';
  try {
    const q = query(
      collection(db, 'attendance'),
      where('classId', '==', classId),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveAttendance(
  classId: string,
  date: string,
  records: StudentAttendanceItem[],
  recordedBy: string
): Promise<void> {
  const path = 'attendance';
  try {
    const existing = await getAttendanceByDate(classId, date);
    const now = new Date().toISOString();
    if (existing) {
      await updateDoc(doc(db, 'attendance', existing.id), {
        records,
        recordedBy,
        updatedAt: now,
      });
    } else {
      const ref = doc(collection(db, 'attendance'));
      await setDoc(ref, {
        id: ref.id,
        classId,
        date,
        recordedBy,
        records,
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* =========================================================================
   6. SCORES
   ========================================================================= */

export async function getScoresByClass(classId: string): Promise<Score[]> {
  const path = 'scores';
  try {
    const q = query(collection(db, 'scores'), where('classId', '==', classId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Score));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function getScoresByStudent(studentId: string): Promise<Score[]> {
  const path = 'scores';
  try {
    const q = query(collection(db, 'scores'), where('studentId', '==', studentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Score));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveScore(score: Omit<Score, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
  const path = 'scores';
  try {
    const ref = score.id ? doc(db, 'scores', score.id) : doc(collection(db, 'scores'));
    const now = new Date().toISOString();
    await setDoc(ref, {
      ...score,
      id: ref.id,
      updatedAt: now,
      createdAt: now,
    }, { merge: true });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteScore(scoreId: string): Promise<void> {
  const path = `scores/${scoreId}`;
  try {
    await deleteDoc(doc(db, 'scores', scoreId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   7. COMPETITION (THI ĐUA)
   ========================================================================= */

export const DEFAULT_COMPETITION_RULES: CompetitionRule[] = [
  { id: 'rule-bonus-1', title: 'Phát biểu tốt trong giờ học', points: 1, type: 'bonus', category: 'Học tập' },
  { id: 'rule-bonus-2', title: 'Đạt điểm 9, 10 bài kiểm tra', points: 2, type: 'bonus', category: 'Học tập' },
  { id: 'rule-bonus-3', title: 'Giúp đỡ bạn bè tiến bộ', points: 2, type: 'bonus', category: 'Nề nếp' },
  { id: 'rule-bonus-4', title: 'Hoàn thành tốt nhiệm vụ lớp giao', points: 1, type: 'bonus', category: 'Nề nếp' },
  { id: 'rule-bonus-5', title: 'Tham gia tích cực phong trào/văn nghệ/thể thao', points: 3, type: 'bonus', category: 'Phong trào' },
  { id: 'rule-penalty-1', title: 'Không làm bài tập về nhà', points: -2, type: 'penalty', category: 'Học tập' },
  { id: 'rule-penalty-2', title: 'Đi học muộn', points: -1, type: 'penalty', category: 'Chuyên cần' },
  { id: 'rule-penalty-3', title: 'Mất trật tự / Sử dụng điện thoại trong giờ', points: -2, type: 'penalty', category: 'Nề nếp' },
  { id: 'rule-penalty-4', title: 'Vi phạm nội quy trường lớp', points: -3, type: 'penalty', category: 'Nề nếp' },
  { id: 'rule-penalty-5', title: 'Quên đồ dùng học tập / đồng phục', points: -1, type: 'penalty', category: 'Nề nếp' },
];

export async function getCompetitionRules(classId?: string): Promise<CompetitionRule[]> {
  const path = 'competitionRules';
  try {
    const snap = await getDocs(collection(db, 'competitionRules'));
    if (snap.empty) {
      return DEFAULT_COMPETITION_RULES;
    }
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as CompetitionRule));
    return list.length ? list : DEFAULT_COMPETITION_RULES;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCompetitionRule(rule: Omit<CompetitionRule, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
  const path = 'competitionRules';
  try {
    const ref = rule.id ? doc(db, 'competitionRules', rule.id) : doc(collection(db, 'competitionRules'));
    await setDoc(ref, {
      ...rule,
      id: ref.id,
      createdAt: new Date().toISOString(),
    }, { merge: true });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCompetitionRule(ruleId: string): Promise<void> {
  const path = `competitionRules/${ruleId}`;
  try {
    await deleteDoc(doc(db, 'competitionRules', ruleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function getCompetitionsByClass(classId: string): Promise<CompetitionEntry[]> {
  const path = 'competitions';
  try {
    const q = query(collection(db, 'competitions'), where('classId', '==', classId), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CompetitionEntry));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function addCompetitionEntry(entry: Omit<CompetitionEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = 'competitions';
  try {
    const ref = doc(collection(db, 'competitions'));
    const now = new Date().toISOString();
    await setDoc(ref, {
      id: ref.id,
      ...entry,
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCompetitionEntry(entryId: string): Promise<void> {
  const path = `competitions/${entryId}`;
  try {
    await deleteDoc(doc(db, 'competitions', entryId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   8. DAILY REPORTS (BÁO CÁO HÀNG NGÀY)
   ========================================================================= */

export async function getDailyReports(classId: string): Promise<DailyReport[]> {
  const path = 'dailyReports';
  try {
    const q = query(collection(db, 'dailyReports'), where('classId', '==', classId), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyReport));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveDailyReport(report: Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
  const path = 'dailyReports';
  try {
    const ref = report.id ? doc(db, 'dailyReports', report.id) : doc(collection(db, 'dailyReports'));
    const now = new Date().toISOString();
    await setDoc(ref, {
      ...report,
      id: ref.id,
      updatedAt: now,
      createdAt: now,
    }, { merge: true });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDailyReport(reportId: string): Promise<void> {
  const path = `dailyReports/${reportId}`;
  try {
    await deleteDoc(doc(db, 'dailyReports', reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   9. ANNOUNCEMENTS (BẢNG TIN THÔNG BÁO)
   ========================================================================= */

export async function getAnnouncements(classId: string): Promise<Announcement[]> {
  const path = 'announcements';
  try {
    const q = query(collection(db, 'announcements'), where('classId', '==', classId), orderBy('date', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt' | 'readBy'>): Promise<string> {
  const path = 'announcements';
  try {
    const ref = doc(collection(db, 'announcements'));
    const now = new Date().toISOString();
    await setDoc(ref, {
      id: ref.id,
      ...announcement,
      readBy: [],
      createdAt: now,
      updatedAt: now,
    });
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markAnnouncementAsRead(announcementId: string, readerId: string): Promise<void> {
  const path = `announcements/${announcementId}`;
  try {
    const snap = await getDoc(doc(db, 'announcements', announcementId));
    if (snap.exists()) {
      const currentReadBy: string[] = snap.data()?.readBy || [];
      if (!currentReadBy.includes(readerId)) {
        await updateDoc(doc(db, 'announcements', announcementId), {
          readBy: [...currentReadBy, readerId],
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAnnouncement(announcementId: string): Promise<void> {
  const path = `announcements/${announcementId}`;
  try {
    await deleteDoc(doc(db, 'announcements', announcementId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/* =========================================================================
   10. CONVERSATIONS & MESSAGES
   ========================================================================= */

export async function getConversations(classId: string, studentId?: string): Promise<Conversation[]> {
  const path = 'conversations';
  try {
    let q;
    if (studentId) {
      q = query(
        collection(db, 'conversations'),
        where('classId', '==', classId),
        where('studentId', '==', studentId)
      );
    } else {
      q = query(
        collection(db, 'conversations'),
        where('classId', '==', classId),
        orderBy('lastMessageAt', 'desc')
      );
    }
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void) {
  const path = 'messages';
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
    callback(msgs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
}

export async function sendMessage(
  conversationId: string,
  classId: string,
  senderId: string,
  senderName: string,
  senderRole: 'teacher' | 'parent' | 'student',
  recipientId: string,
  content: string
): Promise<string> {
  const path = 'messages';
  try {
    const ref = doc(collection(db, 'messages'));
    const now = new Date().toISOString();
    await setDoc(ref, {
      id: ref.id,
      conversationId,
      classId,
      senderId,
      senderName,
      senderRole,
      recipientId,
      content,
      createdAt: now,
    });

    // Update conversation snippet
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      lastMessage: content,
      lastMessageAt: now,
      updatedAt: now,
    });

    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getOrCreateConversation(
  classId: string,
  teacherId: string,
  teacherName: string,
  studentId: string,
  studentName: string,
  parentName?: string
): Promise<Conversation> {
  const path = 'conversations';
  try {
    const q = query(
      collection(db, 'conversations'),
      where('classId', '==', classId),
      where('studentId', '==', studentId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as Conversation;
    }

    const ref = doc(collection(db, 'conversations'));
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id: ref.id,
      classId,
      teacherId,
      teacherName,
      studentId,
      studentName,
      parentName: parentName || `Phụ huynh em ${studentName}`,
      lastMessage: 'Cuộc trò chuyện đã được tạo.',
      lastMessageAt: now,
      unreadTeacher: 0,
      unreadParent: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(ref, newConv);
    return newConv;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/* =========================================================================
   11. SEED INITIAL REALISTIC DATA (FOR DEMO & FIRST TIME STARTUP)
   ========================================================================= */

export async function seedDemoClassData(teacherId: string, teacherName: string): Promise<string> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  // 1. Create Demo Class: 8A1
  const classRef = doc(collection(db, 'classes'));
  const classId = classRef.id;
  const schoolId = 'school-thcs-son-phong';
  const schoolYearId = 'year-2026-2027';
  const schoolName = 'Trường THCS Sơn Phong';
  const schoolAddress = 'Phường Sơn Phong, TP. Hội An, Tỉnh Quảng Nam';
  const currentSchoolYear = '2026 - 2027';

  const demoClass: HomeroomClass = {
    id: classId,
    name: '8A1',
    grade: '8',
    schoolYear: currentSchoolYear,
    schoolYearId,
    schoolId,
    schoolName,
    schoolAddress,
    schoolWard: 'Phường Sơn Phong',
    schoolCity: 'TP. Hội An',
    teacherId,
    teacherName: teacherName || 'Nguyễn Thị Minh Hòa',
    room: 'Phòng 204 - Dãy B',
    studentCount: 12,
    createdAt: now,
    updatedAt: now,
  };
  batch.set(classRef, demoClass);

  // 2. Demo Students List (Realistic Vietnamese 8th grade students)
  const demoStudentsData = [
    { fullName: 'Nguyễn Văn An', code: 'HS8A101', gender: 'Nam' as const, dob: '2012-03-15', father: 'Nguyễn Văn Hùng', mother: 'Trần Thị Mai', phone: '0912345601', parentPhone: '0987654301' },
    { fullName: 'Trần Thị Bình', code: 'HS8A102', gender: 'Nữ' as const, dob: '2012-07-22', father: 'Trần Văn Cường', mother: 'Lê Thị Hoa', phone: '0912345602', parentPhone: '0987654302' },
    { fullName: 'Lê Hoàng Cường', code: 'HS8A103', gender: 'Nam' as const, dob: '2012-01-10', father: 'Lê Văn Tuấn', mother: 'Phạm Thị Thảo', phone: '0912345603', parentPhone: '0987654303' },
    { fullName: 'Phạm Minh Dũng', code: 'HS8A104', gender: 'Nam' as const, dob: '2012-11-05', father: 'Phạm Văn Nam', mother: 'Nguyễn Thị Dung', phone: '0912345604', parentPhone: '0987654304' },
    { fullName: 'Hoàng Thu Giang', code: 'HS8A105', gender: 'Nữ' as const, dob: '2012-05-18', father: 'Hoàng Văn Hải', mother: 'Vũ Thị Hằng', phone: '0912345605', parentPhone: '0987654305' },
    { fullName: 'Vũ Quốc Huy', code: 'HS8A106', gender: 'Nam' as const, dob: '2012-09-29', father: 'Vũ Văn Bình', mother: 'Bùi Thị Nga', phone: '0912345606', parentPhone: '0987654306' },
    { fullName: 'Đặng Mai Linh', code: 'HS8A107', gender: 'Nữ' as const, dob: '2012-02-14', father: 'Đặng Văn Đức', mother: 'Nguyễn Thị Hiền', phone: '0912345607', parentPhone: '0987654307' },
    { fullName: 'Bùi Đức Nam', code: 'HS8A108', gender: 'Nam' as const, dob: '2012-08-30', father: 'Bùi Văn Dũng', mother: 'Trịnh Thị Liên', phone: '0912345608', parentPhone: '0987654308' },
    { fullName: 'Ngô Bảo Ngọc', code: 'HS8A109', gender: 'Nữ' as const, dob: '2012-12-12', father: 'Ngô Văn Tùng', mother: 'Đỗ Thị Quyên', phone: '0912345609', parentPhone: '0987654309' },
    { fullName: 'Đỗ Tiến Phát', code: 'HS8A110', gender: 'Nam' as const, dob: '2012-04-25', father: 'Đỗ Văn Thành', mother: 'Phan Thị Yến', phone: '0912345610', parentPhone: '0987654310' },
    { fullName: 'Dương Thị Phương', code: 'HS8A111', gender: 'Nữ' as const, dob: '2012-06-08', father: 'Dương Văn Long', mother: 'Ngô Thị Cúc', phone: '0912345611', parentPhone: '0987654311' },
    { fullName: 'Lý Trọng Quân', code: 'HS8A112', gender: 'Nam' as const, dob: '2012-10-19', father: 'Lý Văn Quang', mother: 'Lê Thị Thu', phone: '0912345612', parentPhone: '0987654312' },
  ];

  const studentIds: string[] = [];
  demoStudentsData.forEach((s) => {
    const sRef = doc(collection(db, 'students'));
    studentIds.push(sRef.id);
    const student: Student = {
      id: sRef.id,
      studentId: sRef.id,
      classId,
      teacherId,
      schoolId,
      schoolYearId,
      schoolYear: currentSchoolYear,
      fullName: s.fullName,
      studentCode: s.code,
      dob: s.dob,
      gender: s.gender,
      address: 'Phường Sơn Phong, TP. Hội An',
      phone: s.phone,
      fatherName: s.father,
      motherName: s.mother,
      parentPhone: s.parentPhone,
      parentEmail: `phuhuynh.${s.code.toLowerCase()}@sonphong.edu.vn`,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    batch.set(sRef, student);

    // Create linked Student User Account
    const studentUserRef = doc(db, 'users', `user-${s.code.toLowerCase()}`);
    batch.set(studentUserRef, {
      id: `user-${s.code.toLowerCase()}`,
      username: s.code.toLowerCase(),
      password: '123456',
      displayName: s.fullName,
      role: 'student',
      status: 'active',
      phone: s.phone,
      studentId: sRef.id,
      classId,
      className: '8A1',
      teacherId,
      schoolId,
      schoolYearId,
      schoolYear: currentSchoolYear,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });

    // Create linked Parent User Account
    const parentUserRef = doc(db, 'users', `user-parent-${s.code.toLowerCase()}`);
    batch.set(parentUserRef, {
      id: `user-parent-${s.code.toLowerCase()}`,
      username: s.parentPhone,
      password: '123456',
      displayName: s.father ? `Bác ${s.father} (PH ${s.fullName})` : `Phụ huynh em ${s.fullName}`,
      role: 'parent',
      status: 'active',
      phone: s.parentPhone,
      email: `phuhuynh.${s.code.toLowerCase()}@sonphong.edu.vn`,
      studentId: sRef.id,
      linkedStudentIds: [sRef.id],
      linkedStudentName: s.fullName,
      classId,
      className: '8A1',
      teacherId,
      schoolId,
      schoolYearId,
      schoolYear: currentSchoolYear,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    });
  });

  // Create Primary Teacher Admin Account (Giáo viên chủ nhiệm = ADMIN của lớp)
  const teacherUserRef = doc(db, 'users', teacherId);
  batch.set(teacherUserRef, {
    id: teacherId,
    username: 'admin.minhhoa',
    password: '123456',
    email: 'nguyenthiminhhoanvk12@gmail.com',
    displayName: teacherName || 'Nguyễn Thị Minh Hòa',
    role: 'teacher_admin',
    status: 'active',
    isAdmin: true,
    phone: '0912345678',
    classId,
    className: '8A1',
    grade: '8',
    schoolId,
    schoolName,
    schoolAddress,
    schoolWard: 'Phường Sơn Phong',
    schoolCity: 'TP. Hội An',
    schoolYearId,
    schoolYear: currentSchoolYear,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // 3. Default Competition Rules
  DEFAULT_COMPETITION_RULES.forEach((rule) => {
    const rRef = doc(db, 'competitionRules', rule.id);
    batch.set(rRef, { ...rule, classId, createdAt: now });
  });

  // 4. Today Attendance
  const attRef = doc(collection(db, 'attendance'));
  const attRecords: StudentAttendanceItem[] = demoStudentsData.map((s, idx) => ({
    studentId: studentIds[idx],
    studentName: s.fullName,
    status: idx === 3 ? 'excused' : idx === 9 ? 'late' : 'present',
    note: idx === 3 ? 'Có giấy xin phép gia đình' : idx === 9 ? 'Hỏng xe đi muộn 10p' : '',
  }));
  batch.set(attRef, {
    id: attRef.id,
    classId,
    date: today,
    recordedBy: teacherName,
    records: attRecords,
    createdAt: now,
    updatedAt: now,
  });

  // 5. Sample Academic Scores
  const subjects = ['Toán', 'Ngữ Văn', 'Tiếng Anh', 'Vật Lý', 'Hóa Học'];
  demoStudentsData.forEach((s, idx) => {
    const mathScoreRef = doc(collection(db, 'scores'));
    const baseScore = 7.5 + (idx % 3) * 0.8;
    const finalScore = Math.min(10, Math.round(baseScore * 10) / 10);
    batch.set(mathScoreRef, {
      id: mathScoreRef.id,
      classId,
      schoolYear: '2026-2027',
      studentId: studentIds[idx],
      studentName: s.fullName,
      subject: 'Toán',
      scoreType: 'Điểm giữa kỳ',
      scoreValue: finalScore,
      maxScore: 10,
      note: 'Làm bài cẩn thận, trình bày rõ ràng',
      date: today,
      createdAt: now,
      updatedAt: now,
    });

    const litScoreRef = doc(collection(db, 'scores'));
    const litScore = Math.min(10, Math.round((7.0 + ((idx + 1) % 4) * 0.7) * 10) / 10);
    batch.set(litScoreRef, {
      id: litScoreRef.id,
      classId,
      schoolYear: '2026-2027',
      studentId: studentIds[idx],
      studentName: s.fullName,
      subject: 'Ngữ Văn',
      scoreType: 'Điểm thường xuyên',
      scoreValue: litScore,
      maxScore: 10,
      note: 'Cảm thụ tác phẩm tốt',
      date: today,
      createdAt: now,
      updatedAt: now,
    });
  });

  // 6. Sample Competition Entries
  const compRef1 = doc(collection(db, 'competitions'));
  batch.set(compRef1, {
    id: compRef1.id,
    classId,
    studentId: studentIds[0],
    studentName: 'Nguyễn Văn An',
    ruleId: 'rule-bonus-1',
    ruleTitle: 'Phát biểu tốt trong giờ học',
    points: 1,
    type: 'bonus',
    note: 'Xung phong chữa bài tập khó',
    date: today,
    recordedBy: teacherName,
    createdAt: now,
    updatedAt: now,
  });

  const compRef2 = doc(collection(db, 'competitions'));
  batch.set(compRef2, {
    id: compRef2.id,
    classId,
    studentId: studentIds[1],
    studentName: 'Trần Thị Bình',
    ruleId: 'rule-bonus-3',
    ruleTitle: 'Giúp đỡ bạn bè tiến bộ',
    points: 2,
    type: 'bonus',
    note: 'Hướng dẫn nhóm ôn tập Toán',
    date: today,
    recordedBy: teacherName,
    createdAt: now,
    updatedAt: now,
  });

  // 7. Sample Announcements
  const annRef1 = doc(collection(db, 'announcements'));
  batch.set(annRef1, {
    id: annRef1.id,
    classId,
    title: 'Kế hoạch học tập và chuẩn bị kiểm tra giữa kỳ I',
    content: 'Kính gửi quý phụ huynh và các em học sinh 10A1: Tuần tới nhà trường sẽ tổ chức đợt kiểm tra đánh giá giữa học kỳ I. Đề nghị các em chủ động ôn tập theo đề cương các thầy cô bộ môn đã phát, giữ gìn sức khỏe và đi học đúng giờ.',
    targetAudience: 'all',
    authorName: teacherName,
    authorId: teacherId,
    priority: 'high',
    date: today,
    readBy: [studentIds[0], studentIds[1]],
    createdAt: now,
    updatedAt: now,
  });

  const annRef2 = doc(collection(db, 'announcements'));
  batch.set(annRef2, {
    id: annRef2.id,
    classId,
    title: 'Lịch họp Ban đại diện cha mẹ học sinh đầu năm',
    content: 'Trân trọng kính mời quý phụ huynh đại diện các tổ họp vào lúc 08h30 sáng Thứ Bảy tuần này tại phòng Hội đồng trường để thảo luận về kế hoạch hoạt động năm học 2026-2027.',
    targetAudience: 'parents',
    authorName: teacherName,
    authorId: teacherId,
    priority: 'normal',
    date: today,
    readBy: [],
    createdAt: now,
    updatedAt: now,
  });

  // 8. Sample Daily Report
  const reportRef = doc(collection(db, 'dailyReports'));
  batch.set(reportRef, {
    id: reportRef.id,
    classId,
    date: today,
    type: 'class',
    academicStatus: 'Lớp học nghiêm túc, sôi nổi trong giờ Toán và Tiếng Anh.',
    disciplineStatus: 'Nề nếp tốt, 1 học sinh đi muộn do xe hỏng đã bổ sung giấy phép.',
    hygieneStatus: 'Vệ sinh phòng học sạch sẽ, bàn ghế kê ngay ngắn.',
    attendanceSummary: 'Sĩ số 12/12. Có mặt: 11, Nghỉ có phép: 1 (Phạm Minh Dũng), Đi muộn: 1 (Đỗ Tiến Phát).',
    notes: 'Nhắc nhở lớp tiếp tục ôn tập kỹ môn Hóa học cho tiết kiểm tra ngày mai.',
    highlights: 'Biểu dương tổ 1 trực nhật xuất sắc, em Trần Thị Bình hỗ trợ bạn học tập.',
    createdBy: teacherName,
    createdAt: now,
    updatedAt: now,
  });

  // 9. Sample Conversation & Message
  const convRef = doc(collection(db, 'conversations'));
  batch.set(convRef, {
    id: convRef.id,
    classId,
    teacherId,
    teacherName,
    studentId: studentIds[0],
    studentName: 'Nguyễn Văn An',
    parentName: 'Bác Nguyễn Văn Hùng (Bố)',
    lastMessage: 'Chào thầy ạ, gia đình đã nhận được lịch kiểm tra giữa kỳ của cháu.',
    lastMessageAt: now,
    unreadTeacher: 1,
    unreadParent: 0,
    createdAt: now,
    updatedAt: now,
  });

  const msgRef1 = doc(collection(db, 'messages'));
  batch.set(msgRef1, {
    id: msgRef1.id,
    conversationId: convRef.id,
    classId,
    senderId: studentIds[0],
    senderName: 'Nguyễn Văn Hùng (Phụ huynh)',
    senderRole: 'parent',
    recipientId: teacherId,
    content: 'Kính gửi thầy chủ nhiệm, gia đình đã nhắc cháu tập trung ôn luyện. Nhờ thầy sát sao thêm giúp môn Vật Lý của cháu ạ.',
    createdAt: now,
  });

  await batch.commit();
  return classId;
}
