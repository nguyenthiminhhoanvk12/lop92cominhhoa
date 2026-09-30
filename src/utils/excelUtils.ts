import * as XLSX from 'xlsx';
import { Student, Score, AttendanceRecord } from '../types';

export function exportStudentsToExcel(students: Student[], className: string) {
  const data = students.map((s, idx) => ({
    'STT': idx + 1,
    'Mã học sinh': s.studentCode,
    'Họ và tên': s.fullName,
    'Giới tính': s.gender,
    'Ngày sinh': s.dob,
    'Địa chỉ': s.address,
    'Số điện thoại': s.phone || '',
    'Họ tên bố': s.fatherName || '',
    'Họ tên mẹ': s.motherName || '',
    'SĐT phụ huynh': s.parentPhone,
    'Email phụ huynh': s.parentEmail || '',
    'Trạng thái': s.status === 'active' ? 'Đang học' : s.status === 'transferred' ? 'Chuyển trường' : 'Đình chỉ',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `HocSinh_${className}`);
  XLSX.writeFile(workbook, `Danh_Sach_Lop_${className}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportScoresToExcel(scores: Score[], students: Student[], className: string) {
  const data = students.map((st, idx) => {
    const studentScores = scores.filter(s => s.studentId === st.id);
    const row: Record<string, any> = {
      'STT': idx + 1,
      'Mã HS': st.studentCode,
      'Họ và tên': st.fullName,
    };
    studentScores.forEach(sc => {
      row[`${sc.subject} (${sc.scoreType})`] = sc.scoreValue;
    });
    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `DiemSo_${className}`);
  XLSX.writeFile(workbook, `Bang_Diem_${className}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export interface ParsedExcelStudent {
  fullName: string;
  studentCode: string;
  dob?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  address?: string;
  phone?: string;
  parentPhone?: string;
  fatherName?: string;
  motherName?: string;
}

export function parseStudentsFromExcel(file: File): Promise<ParsedExcelStudent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const parsedList: ParsedExcelStudent[] = json.map((row) => ({
          studentCode: String(row['Mã học sinh'] || row['Mã HS'] || row['MaHS'] || `HS${Date.now()}`),
          fullName: String(row['Họ và tên'] || row['Họ tên'] || row['HoTen'] || ''),
          gender: ((row['Giới tính'] === 'Nữ' || row['GioiTinh'] === 'Nữ') ? 'Nữ' : 'Nam') as 'Nam' | 'Nữ' | 'Khác',
          dob: String(row['Ngày sinh'] || row['NgaySinh'] || '2010-01-01'),
          address: String(row['Địa chỉ'] || row['DiaChi'] || 'Hà Nội'),
          phone: String(row['Số điện thoại'] || row['SĐT'] || row['SDT'] || ''),
          parentPhone: String(row['SĐT phụ huynh'] || row['SDT Phụ huynh'] || row['SDTPH'] || '0987654321'),
          fatherName: String(row['Họ tên bố'] || row['HoTenBo'] || ''),
          motherName: String(row['Họ tên mẹ'] || row['HoTenMe'] || ''),
        })).filter(s => s.fullName && s.fullName.trim() !== '');

        resolve(parsedList);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
