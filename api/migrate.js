// POST (chỉ admin): di trú dữ liệu cũ sang cấu trúc mới
// - Cấp teacherCode cho mọi giáo viên chưa có
// - Bổ sung visibility/accessPassword mặc định cho đề thi cũ thiếu trường
import { connectDB } from './_lib/db.js';
import { User, Exam } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return err(res, 405, 'Method không hỗ trợ');
  const auth = requireAuth(req, res, ['admin']);
  if (!auth) return;
  await connectDB();

  try {
    // 1. Cấp mã GV cho giáo viên cũ
    const teachers = await User.find({ role: 'teacher', $or: [{ teacherCode: null }, { teacherCode: { $exists: false } }, { teacherCode: '' }] });
    for (const t of teachers) {
      t.teacherCode = 'GV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      await t.save();
    }
    // 2. Đề thi cũ thiếu trường mới → đặt mặc định
    const r1 = await Exam.updateMany({ visibility: { $exists: false } }, { $set: { visibility: 'private' } });
    const r2 = await Exam.updateMany({ accessPassword: { $exists: false } }, { $set: { accessPassword: '' } });

    return ok(res, {
      teacherCodesCreated: teachers.length,
      examsVisibilityFixed: r1.modifiedCount,
      examsPasswordFixed: r2.modifiedCount
    }, 'Di trú dữ liệu hoàn tất');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ khi di trú dữ liệu');
  }
}
