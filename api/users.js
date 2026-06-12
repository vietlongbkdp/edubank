// GET: hồ sơ của mình | PUT: cập nhật hồ sơ / đổi mật khẩu
// Admin: GET ?all=1 danh sách user | PUT ?id=&lock=1/0 khóa-mở tài khoản
import bcrypt from 'bcryptjs';
import { connectDB } from './_lib/db.js';
import { User } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  await connectDB();

  try {
    if (req.method === 'GET') {
      if (req.query.all === '1') {
        if (auth.role !== 'admin') return err(res, 403, 'Chỉ admin');
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).lean();
        return ok(res, users);
      }
      const me = await User.findById(auth.id).select('-passwordHash').lean();
      return ok(res, me);
    }

    if (req.method === 'PUT') {
      // Admin khóa / mở tài khoản
      if (req.query.id && auth.role === 'admin') {
        const u = await User.findByIdAndUpdate(req.query.id, { isLocked: req.query.lock === '1' }, { new: true })
          .select('-passwordHash');
        return ok(res, u, req.query.lock === '1' ? 'Đã khóa tài khoản' : 'Đã mở khóa');
      }
      const { fullName, school, subjectsTaught, grade, bio, avatarUrl, currentPassword, newPassword } = req.body || {};
      const me = await User.findById(auth.id);
      if (!me) return err(res, 404, 'Không tìm thấy người dùng');
      if (newPassword) {
        if (!(await bcrypt.compare(currentPassword || '', me.passwordHash)))
          return err(res, 400, 'Mật khẩu hiện tại không đúng');
        me.passwordHash = await bcrypt.hash(newPassword, 10);
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
      return ok(res, out, 'Đã cập nhật hồ sơ');
    }

    return err(res, 405, 'Method không hỗ trợ');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
