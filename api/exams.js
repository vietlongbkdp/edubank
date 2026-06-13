// GET: danh sách đề của tôi | GET ?id&full=1: chi tiết kèm câu hỏi | POST: lưu đề | PUT ?id | DELETE ?id
import { connectDB } from './_lib/db.js';
import { Exam, User, Setting } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  await connectDB();

  try {
    if (req.method === 'GET') {
      // Học sinh tra cứu danh sách đề công khai theo mã giáo viên
      if (req.query.teacherCode) {
        const teacher = await User.findOne({ teacherCode: req.query.teacherCode.toUpperCase().trim(), role: 'teacher' })
          .select('fullName school avatarUrl').lean();
        if (!teacher) return err(res, 404, 'Không tìm thấy giáo viên với mã này');
        const exams = await Exam.find({ createdBy: teacher._id, visibility: 'public' })
          .select('code title subject grade duration questionIds accessPassword createdAt')
          .sort({ createdAt: -1 }).lean();
        return ok(res, {
          teacher,
          exams: exams.map(x => ({
            _id: x._id, code: x.code, title: x.title, subject: x.subject, grade: x.grade,
            duration: x.duration, questionCount: x.questionIds?.length || 0,
            hasPassword: !!x.accessPassword,   // chỉ báo có khóa hay không, KHÔNG lộ mật khẩu
            createdAt: x.createdAt
          }))
        });
      }
      if (req.query.id) {
        let query = Exam.findById(req.query.id);
        if (req.query.full === '1') query = query.populate('questionIds');
        const exam = await query.lean();
        if (!exam) return err(res, 404, 'Không tìm thấy đề');
        if (String(exam.createdBy) !== auth.id && exam.visibility !== 'public' && auth.role !== 'admin')
          return err(res, 403, 'Không có quyền xem đề này');
        return ok(res, exam);
      }
      // Admin xem toàn bộ đề (kèm tên người tạo); GV chỉ xem đề của mình
      if (req.query.scope === 'all' && auth.role === 'admin') {
        const exams = await Exam.find().populate('createdBy', 'fullName email').sort({ createdAt: -1 }).lean();
        return ok(res, exams);
      }
      const exams = await Exam.find({ createdBy: auth.id }).sort({ createdAt: -1 }).lean();
      return ok(res, exams);
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.title || !b.questionIds?.length) return err(res, 400, 'Đề cần tiêu đề và danh sách câu hỏi');
      const exam = await Exam.create({ ...b, code: b.code || 'DE-' + Math.floor(100 + Math.random() * 900), createdBy: auth.id });
      // GV: khi số bộ đề đạt ngưỡng n (admin cấu hình) thì chuyển deactive để yêu cầu đóng phí
      let requirePayment = false;
      if (auth.role === 'teacher') {
        const cfg = await Setting.findOne({ key: 'global' });
        const limit = cfg?.teacherExamLimit ?? 3;
        const count = await Exam.countDocuments({ createdBy: auth.id });
        const me = await User.findById(auth.id).select('status');
        if (limit > 0 && count >= limit && (!me?.status || me.status === 'active')) {
          await User.findByIdAndUpdate(auth.id, { status: 'deactive' });
          requirePayment = true;
        }
      }
      return ok(res, { exam, requirePayment }, 'Đã lưu đề');
    }

    if (req.method === 'PUT') {
      const exam = await Exam.findById(req.query.id);
      if (!exam) return err(res, 404, 'Không tìm thấy đề');
      if (String(exam.createdBy) !== auth.id && auth.role !== 'admin') return err(res, 403, 'Không có quyền');
      const { _id, createdBy, ...rest } = req.body || {};
      Object.assign(exam, rest);
      await exam.save();
      return ok(res, exam, 'Đã cập nhật đề');
    }

    if (req.method === 'DELETE') {
      // Xóa nhiều: body.ids (admin xóa bất kỳ; GV chỉ xóa đề của mình)
      const ids = req.body?.ids || (req.query.id ? [req.query.id] : []);
      if (!ids.length) return err(res, 400, 'Thiếu id');
      const filter = { _id: { $in: ids } };
      if (auth.role !== 'admin') filter.createdBy = auth.id;
      const r = await Exam.deleteMany(filter);
      return ok(res, { deleted: r.deletedCount }, `Đã xóa ${r.deletedCount} đề`);
    }

    return err(res, 405, 'Method không hỗ trợ');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
