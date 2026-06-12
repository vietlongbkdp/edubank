// POST: Nhập đề từ file PDF / ảnh bằng AI qua OpenRouter
// body: { fileBase64, mediaType: 'application/pdf'|'image/png'|'image/jpeg', subject, grade }
// Env: OPENROUTER_API_KEY (bắt buộc), OPENROUTER_MODEL (tùy chọn, mặc định google/gemini-2.5-flash)
// Trả về mảng câu hỏi đã chuẩn hóa (LaTeX trong $...$) để GV xem trước rồi mới lưu
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

const PROMPT = (subject, grade) => `Bạn là công cụ trích xuất đề thi trắc nghiệm Việt Nam.
Hãy đọc tài liệu đính kèm và trích xuất TẤT CẢ câu hỏi tìm thấy thành JSON.

QUY TẮC BẮT BUỘC:
1. Trả về DUY NHẤT một mảng JSON hợp lệ, không có lời dẫn, không có markdown code fence.
2. Mọi công thức toán học phải viết bằng LaTeX đặt trong dấu $...$ (inline). Ví dụ: $C_{34}^2$, $\\dfrac{1}{2}$, $\\int_0^1 x\\,dx$, $\\sqrt{x+9}$, $2^{2x+1}=32$, $\\vec{n}=(3;2;1)$.
3. Mỗi câu hỏi là một object với các trường:
   - "content": đề bài (string, LaTeX trong $...$)
   - "options": mảng [{"label":"A","text":"..."},...] — text cũng dùng LaTeX khi cần
   - "correctAnswer": chữ cái đáp án đúng nếu xác định được từ tài liệu (đề có đánh dấu/bảng đáp án), nếu không thì null
   - "topic": chuyên đề ước lượng (vd "Hàm số", "Số phức", "Oxyz", "Tổ hợp - Xác suất", "Mũ - Logarit", "Nguyên hàm - Tích phân", "Khối đa diện", "Dãy số - Giới hạn")
   - "difficulty": số 1-10 ước lượng độ khó (câu nhận biết 1-2, thông hiểu 3-4, vận dụng 5-7, vận dụng cao 8-10)
   - "hasImage": true nếu câu hỏi có hình vẽ/đồ thị KHÔNG thể mô tả bằng LaTeX (GV sẽ tự bổ sung ảnh sau)
4. Nếu câu hỏi tham chiếu hình vẽ, vẫn trích xuất phần chữ và đặt hasImage: true.
5. subject="${subject}", grade="${grade}" (chỉ để tham khảo ngữ cảnh).`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return err(res, 405, 'Method không hỗ trợ');
  const auth = requireAuth(req, res, ['teacher', 'admin']);
  if (!auth) return;

  if (!process.env.OPENROUTER_API_KEY)
    return err(res, 500, 'Chưa cấu hình OPENROUTER_API_KEY trong Environment Variables của Vercel');

  try {
    const { fileBase64, mediaType, subject = 'Toán', grade = '12' } = req.body || {};
    if (!fileBase64 || !mediaType) return err(res, 400, 'Thiếu file');

    // OpenRouter dùng định dạng OpenAI-compatible:
    // - Ảnh: block image_url với data URL
    // - PDF: block file với file_data dạng data URL
    const fileBlock = mediaType === 'application/pdf'
      ? { type: 'file', file: { filename: 'de-thi.pdf', file_data: `data:application/pdf;base64,${fileBase64}` } }
      : { type: 'image_url', image_url: { url: `data:${mediaType};base64,${fileBase64}` } };

    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        // 2 header tùy chọn giúp thống kê trên dashboard OpenRouter
        'HTTP-Referer': 'https://edubank.vercel.app',
        'X-Title': 'EduBank'
      },
      body: JSON.stringify({
        model,
        max_tokens: 16000,
        messages: [{
          role: 'user',
          content: [{ type: 'text', text: PROMPT(subject, grade) }, fileBlock]
        }]
      })
    });
    const data = await resp.json();
    if (data.error)
      return err(res, 500, 'Lỗi AI: ' + (data.error.message || JSON.stringify(data.error)));

    const text = data.choices?.[0]?.message?.content || '';
    // Bóc JSON: bỏ code fence nếu có, tìm mảng [...]
    const clean = text.replace(/```json|```/g, '').trim();
    const start = clean.indexOf('['), end = clean.lastIndexOf(']');
    if (start === -1 || end === -1)
      return err(res, 500, 'AI không trả về JSON hợp lệ, hãy thử lại với file rõ nét hơn hoặc đổi model');
    const questions = JSON.parse(clean.slice(start, end + 1));

    return ok(res, {
      model,
      questions: questions.map(q => ({
        subject, grade,
        topic: q.topic || '',
        type: 'single_choice',
        content: q.content || '',
        options: q.options || [],
        correctAnswer: q.correctAnswer || null,
        difficulty: Math.min(10, Math.max(1, Number(q.difficulty) || 5)),
        hasImage: !!q.hasImage,
        source: 'Nhập từ file bằng AI'
      }))
    }, `AI đã trích xuất ${questions.length} câu hỏi`);
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi xử lý file: ' + e.message);
  }
}
