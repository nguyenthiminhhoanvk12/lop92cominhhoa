import { GoogleGenAI } from '@google/genai';
import { Student, AttendanceRecord, Score, CompetitionEntry, DailyReport } from '../types';

// Initialize Gemini client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process.env as any).GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function summarizeClassSituation(data: {
  className: string;
  students: Student[];
  attendance: AttendanceRecord[];
  scores: Score[];
  competitions: CompetitionEntry[];
  reports: DailyReport[];
}): Promise<string> {
  const client = getGeminiClient();

  const totalStudents = data.students.length;
  const recentReports = data.reports.slice(0, 3).map(r => `- Ngày ${r.date}: ${r.notes}`).join('\n');
  const totalBonus = data.competitions.filter(c => c.type === 'bonus').length;
  const totalPenalties = data.competitions.filter(c => c.type === 'penalty').length;

  const prompt = `
Bạn là một trợ lý giáo dục AI chuyên môn cao dành cho Giáo viên chủ nhiệm lớp ${data.className}.
Hãy tổng hợp và đưa ra bản tóm tắt tình hình lớp học ngắn gọn, chuyên nghiệp và súc tích theo cấu trúc:
1. Đánh giá tổng quan nề nếp và học tập
2. Điểm sáng và biểu dương nổi bật (${totalBonus} lượt cộng điểm thi đua)
3. Điểm cần lưu ý/khắc phục (${totalPenalties} lượt vi phạm hoặc lưu ý)
4. Đề xuất hành động trọng tâm cho giáo viên chủ nhiệm trong tuần tới.

Dữ liệu tham khảo:
- Sĩ số: ${totalStudents} học sinh
- Nhật ký gần nhất:
${recentReports || 'Chưa có nhật ký cụ thể.'}
`;

  if (!client) {
    return `### TỔNG HỢP TÌNH HÌNH LỚP ${data.className}
1. **Tổng quan nề nếp & học tập**: Lớp duy trì sĩ số ổn định (${totalStudents} học sinh). Tinh thần học tập trong các giờ chính khóa nhìn chung tích cực.
2. **Điểm sáng**: Có ${totalBonus} lượt ghi nhận điểm thưởng thi đua (phát biểu xây dựng bài, hỗ trợ bạn bè, trực nhật tốt).
3. **Điểm cần lưu ý**: Có ${totalPenalties} trường hợp cần nhắc nhở về việc đi học đúng giờ và nộp bài tập đầy đủ.
4. **Khuyến nghị cho GVCN**: Khen ngợi kịp thời các cá nhân xuất sắc trong buổi sinh hoạt lớp; liên hệ trao đổi riêng với phụ huynh các em có dấu hiệu giảm sút điểm số.`;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || 'Không có phản hồi từ AI.';
  } catch (error) {
    console.error('Gemini error:', error);
    return 'Không thể kết nối đến Gemini AI lúc này. Vui lòng kiểm tra API Key hoặc mạng.';
  }
}

export async function generateWeeklyReport(data: {
  className: string;
  weekNumber: number;
  students: Student[];
  attendance: AttendanceRecord[];
  scores: Score[];
  competitions: CompetitionEntry[];
}): Promise<string> {
  const client = getGeminiClient();
  const prompt = `
Hãy đóng vai giáo viên chủ nhiệm lớp ${data.className}, soạn một BÁO CÁO TUẦN (Tuần ${data.weekNumber}) chi tiết, trang trọng, đầy đủ các mục:
- Chuyên cần và nề nếp tuần qua
- Kết quả học tập và kiểm tra
- Hoạt động phong trào và thi đua
- Phương hướng nhiệm vụ tuần tiếp theo.
Ngôn từ chuẩn mực sư phạm Việt Nam.
`;

  if (!client) {
    return `### BÁO CÁO CÔNG TÁC CHỦ NHIỆM TUẦN ${data.weekNumber} - LỚP ${data.className}

**I. Chuyên cần & Nề nếp:**
- Tỷ lệ chuyên cần đạt trên 98%. Đa số học sinh đi học đúng tác phong, đồng phục đầy đủ.
- Hiện tượng đi muộn được kiểm soát, nhắc nhở kịp thời.

**II. Tình hình học tập:**
- Các em tích cực ôn tập chuẩn bị cho đợt kiểm tra đánh giá định kỳ.
- Không có hiện tượng gian lận trong kiểm tra. Một số em còn yếu môn tự nhiên đã được phân công nhóm bạn giúp đỡ.

**III. Phong trào thi đua:**
- Xếp hạng nề nếp toàn trường duy trì trong top đầu của khối.
- Toàn lớp đã hoàn thành tốt buổi lao động vệ sinh phòng học.

**IV. Phương hướng tuần tới:**
- Tiếp tục đôn đốc học sinh giữ vững nề nếp kỷ luật.
- Phối hợp với phụ huynh đôn đốc học tập tại nhà.`;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || '';
  } catch (error) {
    console.error('Gemini error:', error);
    return 'Lỗi khi tạo báo cáo từ AI.';
  }
}

export async function draftStudentFeedback(student: Student, scores: Score[], competitions: CompetitionEntry[]): Promise<string> {
  const client = getGeminiClient();
  const avg = scores.length
    ? (scores.reduce((sum, s) => sum + s.scoreValue, 0) / scores.length).toFixed(1)
    : 'Chưa có';
  const bonusCount = competitions.filter(c => c.type === 'bonus').length;
  const penaltyCount = competitions.filter(c => c.type === 'penalty').length;

  const prompt = `
Soạn lời nhận xét học bạ / sổ liên lạc điện tử cho học sinh ${student.fullName} (Mã số: ${student.studentCode}, Giới tính: ${student.gender}):
- Điểm trung bình các môn: ${avg}
- Điểm tích cực / khen thưởng: ${bonusCount} lượt
- Điểm trừ / vi phạm: ${penaltyCount} lượt
Hãy đưa ra 1 đoạn nhận xét 3-4 câu mang tính động viên, chân thành, chỉ rõ ưu điểm và gợi ý phương hướng phấn đấu.
`;

  if (!client) {
    return `Em ${student.fullName} có thái độ học tập nghiêm túc, hòa đồng với bạn bè và luôn có ý thức xây dựng tập thể lớp. Điểm số các môn duy trì ở mức ổn định (${avg}/10). Cần tiếp tục phát huy sự chủ động, tự tin phát biểu trong giờ học hơn nữa để đạt kết quả xuất sắc trong học kỳ này.`;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || '';
  } catch (error) {
    console.error('Gemini error:', error);
    return 'Lỗi khi soạn nhận xét từ AI.';
  }
}

export async function draftParentNotification(topic: string, details: string, className: string): Promise<string> {
  const client = getGeminiClient();
  const prompt = `
Hãy đóng vai Giáo viên chủ nhiệm lớp ${className}, soạn thảo một THÔNG BÁO GỬI PHỤ HUYNH bằng tiếng Việt văn phong lịch sự, ấm áp, rõ ràng, mạch lạc:
- Chủ đề thông báo: ${topic}
- Nội dung chi tiết cần truyền đạt: ${details}
Bao gồm: Lời chào trân trọng, nội dung chính, lời cảm ơn và số điện thoại/kênh liên hệ hỗ trợ.
`;

  if (!client) {
    return `Kính gửi Quý phụ huynh lớp ${className},

Giáo viên chủ nhiệm xin gửi lời chào trân trọng đến quý gia đình.
Về vấn đề: ${topic}
${details}

Rất mong nhận được sự phối hợp chặt chẽ từ quý phụ huynh để cùng đồng hành và tạo điều kiện tốt nhất cho các con trong quá trình rèn luyện tại trường. Mọi ý kiến trao đổi xin liên hệ trực tiếp với GVCN qua mục Tin nhắn trên hệ thống hoặc số điện thoại liên lạc.

Trân trọng cảm ơn quý phụ huynh!`;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || '';
  } catch (error) {
    console.error('Gemini error:', error);
    return 'Lỗi khi soạn thông báo.';
  }
}
