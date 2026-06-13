// API người dùng
// - GET: hồ sơ của mình | GET ?all=1: (admin) danh sách user
// - PUT: cập nhật hồ sơ / đổi mật khẩu của mình
// - PUT ?id=...: (admin) sửa thông tin / đổi status / reset mật khẩu cho user bất kỳ
// - DELETE: (admin) xóa user (1 hoặc nhiều qua body.ids)
import bcrypt from 'bcryptjs';
import { connectDB } from './_lib/db.js';
import { User, Exam } from './_lib/models.js';
import { requireAuth, genPassword } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  await connectDB();

  try {
    if (req.method === 'GET') {
      // Admin: danh sách toàn bộ user (kèm số bộ đề của mỗi GV)
      if (req.query.all === '1') {
        if (auth.role !== 'admin') return err(res, 403, 'Chỉ admin');
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
        const counts = await Exam.aggregate([{ $group: { _id: '$createdBy', n: { $sum: 1 } } }]);
        const map = Object.fromEntries(counts.map(c => [String(c._id), c.n]));
        users.forEach(u => { u.examCount = map[String(u._id)] || 0; });
        return ok(res, users);
      }
      const me = await User.findById(auth.id).select('-passwordHash');
      if (me && me.role === 'teacher' && !me.teacherCode) {
        me.teacherCode = 'GV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        await me.save();
      }
      return ok(res, me);
    }

    if (req.method === 'PUT') {
      // ===== Thao tác của ADMIN trên một user bất kỳ =====
      if (req.query.id) {
        if (auth.role !== 'admin') return err(res, 403, 'Chỉ admin');
        const target = await User.findById(req.query.id);
        if (!target) return err(res, 404, 'Không tìm thấy người dùng');

        // Reset mật khẩu: sinh chuỗi 8 ký tự, buộc user đổi khi đăng nhập lại
        if (req.query.resetPassword === '1') {
          const newPass = genPassword(8);
          target.passwordHash = await bcrypt.hash(newPass, 10);
          target.mustChangePassword = true;
          await target.save();
          return ok(res, { newPassword: newPass, email: target.email }, 'Đã reset mật khẩu');
        }

        const { fullName, email, school, subjectsTaught, grade, bio, role, status } = req.body || {};
        if (status && !['active', 'deactive', 'blocked'].includes(status))
          return err(res, 400, 'Trạng thái không hợp lệ');
        // Không cho admin tự khóa/tạm ngưng chính mình (tránh tự đăng xuất khỏi hệ thống)
        if (String(target._id) === String(auth.id) && status && status !== 'active')
          return err(res, 400, 'Không thể tự thay đổi trạng thái của chính mình');
        if (role && !['teacher', 'student', 'admin'].includes(role))
          return err(res, 400, 'Vai trò không hợp lệ');

        Object.assign(target, {
          ...(fullName !== undefined && { fullName }),
          ...(email !== undefined && { email: String(email).toLowerCase() }),
          ...(school !== undefined && { school }),
          ...(subjectsTaught !== undefined && { subjectsTaught }),
          ...(grade !== undefined && { grade }),
          ...(bio !== undefined && { bio }),
          ...(role !== undefined && { role }),
          ...(status !== undefined && { status, isLocked: status === 'blocked' })
        });
        if (role === 'teacher' && !target.teacherCode)
          target.teacherCode = 'GV-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        await target.save();
        const out = target.toObject(); delete out.passwordHash;
        return ok(res, out, 'Đã cập nhật người dùng');
      }

      // ===== Cập nhật hồ sơ / đổi mật khẩu CỦA CHÍNH MÌNH =====
      const { fullName, school, subjectsTaught, grade, bio, avatarUrl, currentPassword, newPassword } = req.body || {};
      const me = await User.findById(auth.id);
      if (!me) return err(res, 404, 'Không tìm thấy người dùng');
      if (newPassword) {
        if (newPassword.length < 6) return err(res, 400, 'Mật khẩu mới tối thiểu 6 ký tự');
        if (!(await bcrypt.compare(currentPassword || '', me.passwordHash)))
          return err(res, 400, 'Mật khẩu hiện tại không đúng');
        me.passwordHash = await bcrypt.hash(newPassword, 10);
        me.mustChangePassword = false;
      }
      Object.assign(me, {
        ...(fullName !== undefined && { fullName }),
        ...(school !== undefined && { school }),
        ...(subjectsTaught !== undefined && { subjectsTaught }),
        ...(grade !== undefined && { grade }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl })
      });
      await me.save();
      const out = me.toObject(); delete out.passwordHash;
      return ok(res, out, newPassword ? 'Đã đổi mật khẩu' : 'Đã cập nhật hồ sơ');
    }

    if (req.method === 'DELETE') {
      if (auth.role !== 'admin') return err(res, 403, 'Chỉ admin');
      const ids = req.body?.ids || (req.query.id ? [req.query.id] : []);
      if (!ids.length) return err(res, 400, 'Thiếu id');
      const safe = ids.filter(id => String(id) !== String(auth.id));
      const r = await User.deleteMany({ _id: { $in: safe } });
      return ok(res, { deleted: r.deletedCount }, `Đã xóa ${r.deletedCount} người dùng`);
    }

    return err(res, 405, 'Method không hỗ trợ');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
