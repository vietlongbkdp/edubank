// POST: nhập hàng loạt câu hỏi từ mảng JSON (FE parse từ Excel/CSV/JSON)
import { connectDB } from './_lib/db.js';
import { Question } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return err(res, 405, 'Method không hỗ trợ');
  const auth = requireAuth(req, res, ['teacher', 'admin']);
  if (!auth) return;
  await connectDB();

  try {
    const { questions } = req.body || {};
    if (!Array.isArray(questions) || !questions.length) return err(res, 400, 'Danh sách câu hỏi trống');
    if (questions.length > 200) return err(res, 400, 'Tối đa 200 câu mỗi lần nhập');

    const docs = questions
      .filter(q => q.subject && q.content)
      .map(q => ({
        ...q,
        code: `${(q.subject || 'CHUNG').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').replace(/[^a-z]/gi, '').toUpperCase().slice(0, 4)}${q.grade || ''}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdBy: auth.id,
        isPublic: q.isPublic !== false
      }));
    const created = await Question.insertMany(docs, { ordered: false });
    return ok(res, { inserted: created.length, skipped: questions.length - created.length }, `Đã nhập ${created.length} câu hỏi`);
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ khi nhập câu hỏi');
  }
}
