import React, { useState, useRef } from 'react';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { HomeroomClass, Student } from '../../../types';
import { createStudent, updateStudent, deleteStudent, batchImportStudents } from '../../../services/firestoreService';
import { exportStudentsToExcel, parseStudentsFromExcel } from '../../../utils/excelUtils';
import { Modal } from '../../../components/common/Modal';

interface StudentsTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  onRefresh: () => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  currentClass,
  students,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [filterGender, setFilterGender] = useState<'all' | 'Nam' | 'Nữ'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [dob, setDob] = useState('2010-01-01');
  const [gender, setGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [address, setAddress] = useState('Hà Nội');
  const [phone, setPhone] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [status, setStatus] = useState<'active' | 'transferred' | 'suspended'>('active');

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFullName('');
    setStudentCode(`HS${currentClass.name}${String(students.length + 1).padStart(2, '0')}`);
    setDob('2010-01-01');
    setGender('Nam');
    setAddress('Quận Cầu Giấy, TP. Hà Nội');
    setPhone('');
    setFatherName('');
    setMotherName('');
    setParentPhone('');
    setParentEmail('');
    setStatus('active');
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFullName(s.fullName);
    setStudentCode(s.studentCode);
    setDob(s.dob);
    setGender(s.gender);
    setAddress(s.address);
    setPhone(s.phone || '');
    setFatherName(s.fatherName || '');
    setMotherName(s.motherName || '');
    setParentPhone(s.parentPhone);
    setParentEmail(s.parentEmail || '');
    setStatus(s.status);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !studentCode.trim()) return;

    setLoading(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, {
          fullName: fullName.trim(),
          studentCode: studentCode.trim(),
          dob,
          gender,
          address: address.trim(),
          phone: phone.trim(),
          fatherName: fatherName.trim(),
          motherName: motherName.trim(),
          parentPhone: parentPhone.trim(),
          parentEmail: parentEmail.trim(),
          status,
        });
      } else {
        await createStudent({
          classId: currentClass.id,
          schoolYear: currentClass.schoolYear,
          fullName: fullName.trim(),
          studentCode: studentCode.trim(),
          dob,
          gender,
          address: address.trim(),
          phone: phone.trim(),
          fatherName: fatherName.trim(),
          motherName: motherName.trim(),
          parentPhone: parentPhone.trim() || '0987654321',
          parentEmail: parentEmail.trim(),
          status,
        });
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error('Save student error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (s: Student) => {
    if (confirm(`Bạn có chắc chắn muốn xóa học sinh "${s.fullName}" (Mã: ${s.studentCode}) khỏi lớp?`)) {
      try {
        await deleteStudent(s.id, currentClass.id);
        onRefresh();
      } catch (err) {
        console.error('Delete student error:', err);
      }
    }
  };

  const handleExport = () => {
    exportStudentsToExcel(students, currentClass.name);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImportStatus('Đang đọc tệp Excel/CSV...');
    try {
      const parsed = await parseStudentsFromExcel(file);
      if (parsed.length === 0) {
        alert('Không tìm thấy dòng học sinh hợp lệ trong tệp.');
        return;
      }
      const count = await batchImportStudents(currentClass.id, currentClass.schoolYear, parsed);
      setImportStatus(`Nhập thành công ${count} học sinh vào lớp!`);
      setTimeout(() => setImportStatus(null), 3000);
      onRefresh();
    } catch (err) {
      console.error('Import error:', err);
      alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra lại cấu trúc các cột.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filtered students
  const filtered = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      (s.parentPhone && s.parentPhone.includes(search));
    const matchGender = filterGender === 'all' || s.gender === filterGender;
    return matchSearch && matchGender;
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Danh Sách Học Sinh Lớp {currentClass.name}</h2>
          <p className="text-xs text-slate-500">
            Tổng cộng: <strong className="text-slate-800">{students.length}</strong> học sinh ({students.filter(s => s.gender === 'Nam').length} Nam, {students.filter(s => s.gender === 'Nữ').length} Nữ)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden file input for Excel import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Nhập từ Excel/CSV"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            title="Xuất danh sách ra file Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm học sinh</span>
          </button>
        </div>
      </div>

      {importStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, mã HS, SĐT phụ huynh..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs">
          <span className="text-slate-500 font-medium">Giới tính:</span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {(['all', 'Nam', 'Nữ'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFilterGender(g)}
                className={`px-3 py-1 rounded-md font-semibold text-xs transition cursor-pointer ${
                  filterGender === g ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g === 'all' ? 'Tất cả' : g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/80 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">STT</th>
                <th className="py-3 px-4">Mã HS</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Giới tính</th>
                <th className="py-3 px-4">Ngày sinh</th>
                <th className="py-3 px-4">Phụ huynh</th>
                <th className="py-3 px-4">SĐT Liên hệ</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Không tìm thấy học sinh nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-indigo-50/30 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{s.studentCode}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                          {s.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="leading-tight">{s.fullName}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{s.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.gender === 'Nữ' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {s.gender}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.dob}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {s.fatherName ? s.fatherName : s.motherName ? s.motherName : 'Chưa nhập'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {s.parentPhone || s.phone || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {s.status === 'active' ? 'Đang học' : s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa học sinh"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStudent ? `Chỉnh sửa học sinh ${editingStudent.fullName}` : 'Thêm học sinh mới vào lớp'}
        subtitle={`Lớp ${currentClass.name} • Năm học ${currentClass.schoolYear}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn An"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã học sinh *</label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="Ví dụ: HS10A101"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white uppercase font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Địa chỉ thường trú</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Số nhà, đường, phường/xã, quận/huyện..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 font-bold text-slate-800 text-[11px] uppercase tracking-wider">
            Thông tin cha mẹ & Liên hệ phụ huynh
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ tên Cha</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Hùng"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Họ tên Mẹ</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Ví dụ: Trần Thị Mai"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SĐT Phụ huynh (Nhận tin nhắn & Đăng nhập)</label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                placeholder="0987654321"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Phụ huynh</label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                placeholder="phuhuynh@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : editingStudent ? 'Lưu cập nhật' : 'Thêm học sinh'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
