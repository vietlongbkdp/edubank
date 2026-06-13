// CRUD câu hỏi (giáo viên & admin)
// GET: ?scope=mine|public|all & subject & grade & topic & difficulty & type & search & page & limit & status
// POST: tạo mới | PUT ?id: sửa | DELETE ?id: xóa
import { connectDB } from './_lib/db.js';
import { Question } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

// Sinh mã câu hỏi: TOAN12-A1B2C3
const genCode = (subject, grade) => {
  const sub = (subject || 'CHUNG').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd').replace(/[^a-z]/gi, '').toUpperCase().slice(0, 4);
  return `${sub}${grade || ''}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};

export default async function handler(req, res) {
  const auth = requireAuth(req, res, ['teacher', 'admin']);
  if (!auth) return;
  await connectDB();

  try {
    if (req.method === 'GET') {
      const { scope = 'mine', subject, grade, topic, difficulty, type, search, status, page = 1, limit = 20 } = req.query;
      const q = {};
      if (scope === 'mine') q.createdBy = auth.id;
      else if (scope === 'public') q.isPublic = true;
      else if (scope === 'all' && auth.role === 'admin') { /* admin xem toàn bộ câu hỏi */ }
      else if (scope === 'all') q.$or = [{ createdBy: auth.id }, { isPublic: true }];
      if (subject) q.subject = subject;
      if (grade) q.grade = grade;
      if (topic) q.topic = topic;
      if (type) q.type = type;
      if (difficulty) q.difficulty = Number(difficulty);
      if (status) q.status = status; else if (auth.role !== 'admin') q.status = { $ne: 'reported' };
      if (search) q.$text = { $search: search };

      const skip = (Number(page) - 1) * Number(limit);
      const [items, total] = await Promise.all([
        Question.find(q).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        Question.countDocuments(q)
      ]);
      return ok(res, { items, total, page: Number(page), limit: Number(limit) });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.subject || !b.content) return err(res, 400, 'Thiếu môn học hoặc nội dung câu hỏi');
      const doc = await Question.create({
        ...b,
        code: genCode(b.subject, b.grade),
        createdBy: auth.id,
        // Theo yêu cầu: mặc định lưu cả vào kho chung, GV có thể tắt
        isPublic: b.isPublic !== false
      });
      return ok(res, doc, 'Đã thêm câu hỏi');
    }

    if (req.method === 'PUT') {
      const q = await Question.findById(req.query.id);
      if (!q) return err(res, 404, 'Không tìm thấy câu hỏi');
      // Báo cáo câu hỏi (mọi GV) hoặc admin duyệt lại
      if (req.body?.action === 'report') {
        q.status = 'reported'; q.reportReason = req.body.reason || '';
        await q.save(); return ok(res, q, 'Đã báo cáo câu hỏi');
      }
      if (req.body?.action === 'restore' && auth.role === 'admin') {
        q.status = 'active'; q.reportReason = '';
        await q.save(); return ok(res, q, 'Đã khôi phục câu hỏi');
      }
      if (String(q.createdBy) !== auth.id && auth.role !== 'admin')
        return err(res, 403, 'Bạn chỉ sửa được câu hỏi của mình');
      const { _id, code, createdBy, stats, ...rest } = req.body || {};
      Object.assign(q, rest);
      await q.save();
      return ok(res, q, 'Đã cập nhật câu hỏi');
    }

    if (req.method === 'DELETE') {
      // Xóa nhiều: body.ids (admin xóa bất kỳ; GV chỉ xóa câu của mình)
      const ids = req.body?.ids || (req.query.id ? [req.query.id] : []);
      if (!ids.length) return err(res, 400, 'Thiếu id');
      const filter = { _id: { $in: ids } };
      if (auth.role !== 'admin') filter.createdBy = auth.id;
      const r = await Question.deleteMany(filter);
      return ok(res, { deleted: r.deletedCount }, `Đã xóa ${r.deletedCount} câu hỏi`);
    }

    return err(res, 405, 'Method không hỗ trợ');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
