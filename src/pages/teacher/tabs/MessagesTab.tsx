import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  User,
  UserCheck,
  CheckCircle2,
  Clock,
  Phone,
} from 'lucide-react';
import { HomeroomClass, Student, Conversation, Message } from '../../../types';
import {
  getConversations,
  getOrCreateConversation,
  subscribeToMessages,
  sendMessage,
} from '../../../services/firestoreService';

interface MessagesTabProps {
  currentClass: HomeroomClass;
  students: Student[];
  teacherId: string;
  teacherName: string;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  currentClass,
  students,
  teacherId,
  teacherName,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student>(students[0] || null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    async function loadConv() {
      if (!currentClass?.id) return;
      try {
        const list = await getConversations(currentClass.id);
        setConversations(list || []);
      } catch (err) {
        console.error('Error loading conversations:', err);
      }
    }
    loadConv();
  }, [currentClass?.id]);

  // When selected student changes, get or create conversation
  useEffect(() => {
    if (!selectedStudent || !currentClass?.id) return;
    async function initConv() {
      setLoading(true);
      try {
        const conv = await getOrCreateConversation(
          currentClass.id,
          teacherId,
          teacherName,
          selectedStudent.id,
          selectedStudent.fullName,
          selectedStudent.fatherName ? `Bác ${selectedStudent.fatherName}` : `Phụ huynh em ${selectedStudent.fullName}`
        );
        setActiveConversation(conv);
      } catch (err) {
        console.error('Error init conv:', err);
      } finally {
        setLoading(false);
      }
    }
    initConv();
  }, [selectedStudent, currentClass?.id, teacherId, teacherName]);

  // Subscribe to messages in active conversation
  useEffect(() => {
    if (!activeConversation?.id) return;
    const unsubscribe = subscribeToMessages(activeConversation.id, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [activeConversation?.id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || !selectedStudent) return;
    try {
      await sendMessage(
        activeConversation.id,
        currentClass.id,
        teacherId,
        teacherName,
        'teacher',
        selectedStudent.id,
        inputText.trim()
      );
      setInputText('');
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
    (s.parentPhone && s.parentPhone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900">Tin Nhắn Riêng Tư Với Phụ Huynh Lớp {currentClass.name}</h2>
        <p className="text-xs text-slate-500">
          Trao đổi 1-1 bảo mật giữa Giáo viên chủ nhiệm và phụ huynh từng học sinh, đồng bộ thời gian thực qua Cloud Firestore.
        </p>
      </div>

      {/* Chat Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden h-[650px]">
        {/* Left Col: Students / Parents List */}
        <div className="border-r border-slate-100 flex flex-col h-full bg-slate-50/50">
          <div className="p-3.5 border-b border-slate-100">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm học sinh / phụ huynh..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60">
            {filteredStudents.map((s) => {
              const isSelected = selectedStudent?.id === s.id;
              const conv = conversations.find(c => c.studentId === s.id);
              const parentName = s.fatherName ? `Bác ${s.fatherName}` : s.motherName ? `Cô ${s.motherName}` : 'Phụ huynh';

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className={`p-3.5 transition cursor-pointer flex items-center justify-between ${
                    isSelected ? 'bg-indigo-50/80 border-r-2 border-indigo-600' : 'hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {s.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs leading-tight">{s.fullName}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{parentName} • {s.parentPhone}</p>
                      {conv?.lastMessage && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5">
                          {conv.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Active Conversation Thread */}
        <div className="lg:col-span-2 flex flex-col h-full bg-white">
          {selectedStudent ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {selectedStudent.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{selectedStudent.fullName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span>Phụ huynh: <strong>{selectedStudent.fatherName || selectedStudent.motherName || 'Gia đình'}</strong></span>
                      <span>• SĐT: <strong className="font-mono">{selectedStudent.parentPhone}</strong></span>
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${selectedStudent.parentPhone}`}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Gọi điện</span>
                </a>
              </div>

              {/* Messages Flow */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-slate-50/30">
                {messages.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    Chưa có tin nhắn nào trong cuộc trò chuyện này. Hãy gửi tin nhắn đầu tiên cho phụ huynh!
                  </div>
                ) : (
                  messages.map((m) => {
                    const isTeacher = m.senderRole === 'teacher';
                    return (
                      <div key={m.id} className={`flex ${isTeacher ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                          isTeacher
                            ? 'bg-indigo-600 text-white rounded-tr-xs'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                        }`}>
                          <span className={`text-[10px] font-bold block mb-0.5 ${isTeacher ? 'text-indigo-200' : 'text-amber-700'}`}>
                            {m.senderName}
                          </span>
                          <p className="font-medium leading-relaxed">{m.content}</p>
                          <span className={`text-[9px] block mt-1 text-right ${isTeacher ? 'text-indigo-200' : 'text-slate-400'}`}>
                            {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Nhắn tin riêng cho phụ huynh em ${selectedStudent.fullName}...`}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Chọn một học sinh từ danh sách bên trái để bắt đầu cuộc trò chuyện.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
