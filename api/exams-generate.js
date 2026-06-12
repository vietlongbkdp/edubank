// POST: Sinh đề thi tự động theo ma trận độ khó
// body: { matrix: [{difficulty, count}], filters: {subject, grade, topics?}, source: 'mine'|'public'|'both',
//         title, duration, save: true|false, fillNearby: true|false }
import { connectDB } from './_lib/db.js';
import { Question, Exam } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'POST') return err(res, 405, 'Method không hỗ trợ');
  const auth = requireAuth(req, res);
  if (!auth) return;
  await connectDB();

  try {
    const { matrix = [], filters = {}, source = 'both', title, duration = 90, save = false, fillNearby = false } = req.body || {};
    if (!matrix.length) return err(res, 400, 'Ma trận đề trống');

    // Học sinh chỉ được lấy từ kho chung
    const effSource = auth.role === 'student' ? 'public' : source;
    const base = { status: 'active', type: { $ne: 'essay' } };
    if (filters.subject) base.subject = filters.subject;
    if (filters.grade) base.grade = filters.grade;
    if (filters.topics?.length) base.topic = { $in: filters.topics };
    if (effSource === 'mine') base.createdBy = new mongoose.Types.ObjectId(auth.id);
    else if (effSource === 'public') base.isPublic = true;
    else base.$or = [{ createdBy: new mongoose.Types.ObjectId(auth.id) }, { isPublic: true }];

    const picked = [];
    const pickedIds = new Set();
    const shortages = [];

    // Bước 1: với mỗi mốc độ khó, $match + $sample
    for (const { difficulty, count } of matrix) {
      if (!count) continue;
      const docs = await Question.aggregate([
        { $match: { ...base, difficulty: Number(difficulty), _id: { $nin: [...pickedIds].map(id => new mongoose.Types.ObjectId(id)) } } },
        { $sample: { size: Number(count) } }
      ]);
      docs.forEach(d => { if (!pickedIds.has(String(d._id))) { pickedIds.add(String(d._id)); picked.push(d); } });
      if (docs.length < count) shortages.push({ difficulty, missing: count - docs.length });
    }

    // Bước 2: nếu thiếu và cho phép, lấy bù từ mốc lân cận ±1
    if (shortages.length && fillNearby) {
      for (const s of shortages) {
        let need = s.missing;
        for (const d of [s.difficulty - 1, s.difficulty + 1]) {
          if (need <= 0 || d < 1 || d > 10) continue;
          const extra = await Question.aggregate([
            { $match: { ...base, difficulty: d, _id: { $nin: [...pickedIds].map(id => new mongoose.Types.ObjectId(id)) } } },
            { $sample: { size: need } }
          ]);
          extra.forEach(e => { if (need > 0 && !pickedIds.has(String(e._id))) { pickedIds.add(String(e._id)); picked.push(e); need--; } });
        }
        s.missing = need;
      }
    }
    const remaining = shortages.filter(s => s.missing > 0);

    // Bước 3: sắp xếp dễ → khó như đề THPT QG
    picked.sort((a, b) => a.difficulty - b.difficulty);

    let exam = null;
    if (save && picked.length) {
      exam = await Exam.create({
        code: 'DE-' + Math.floor(100 + Math.random() * 900),
        title: title || `Đề ${filters.subject || ''} ${new Date().toLocaleDateString('vi-VN')}`,
        subject: filters.subject, grade: filters.grade,
        duration, matrix,
        questionIds: picked.map(p => p._id),
        createdBy: auth.id,
        visibility: 'private'
      });
      // Cập nhật thống kê sử dụng
      await Question.updateMany({ _id: { $in: picked.map(p => p._id) } }, { $inc: { 'stats.timesUsed': 1 } });
    }

    return ok(res, { questions: picked, shortages: remaining, exam },
      remaining.length ? 'Đề được tạo nhưng thiếu câu ở một số mốc độ khó' : 'Tạo đề thành công');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ khi sinh đề');
  }
}
