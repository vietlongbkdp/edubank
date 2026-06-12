// POST /api/auth  body: { action: 'register'|'login', ... }
import bcrypt from 'bcryptjs';
import { connectDB } from './_lib/db.js';
import { User } from './_lib/models.js';
import { signToken } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

const publicUser = (u) => ({
  _id: u._id, fullName: u.fullName, email: u.email, role: u.role,
  avatarUrl: u.avatarUrl, school: u.school, subjectsTaught: u.subjectsTaught,
  grade: u.grade, bio: u.bio
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return err(res, 405, 'Method không hỗ trợ');
  await connectDB();
  const { action } = req.body || {};

  try {
    if (action === 'register') {
      const { fullName, email, password, role } = req.body;
      if (!fullName || !email || !password) return err(res, 400, 'Thiếu thông tin đăng ký');
      if (password.length < 6) return err(res, 400, 'Mật khẩu tối thiểu 6 ký tự');
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return err(res, 400, 'Email đã được sử dụng');
      const user = await User.create({
        fullName, email,
        passwordHash: await bcrypt.hash(password, 10),
        role: role === 'teacher' ? 'teacher' : 'student' // admin chỉ tạo thủ công trong DB
      });
      return ok(res, { token: signToken(user), user: publicUser(user) }, 'Đăng ký thành công');
    }

    if (action === 'login') {
      const { email, password } = req.body;
      const user = await User.findOne({ email: (email || '').toLowerCase() });
      if (!user || !(await bcrypt.compare(password || '', user.passwordHash)))
        return err(res, 400, 'Email hoặc mật khẩu không đúng');
      if (user.isLocked) return err(res, 403, 'Tài khoản đã bị khóa, liên hệ quản trị viên');
      return ok(res, { token: signToken(user), user: publicUser(user) }, 'Đăng nhập thành công');
    }

    return err(res, 400, 'Action không hợp lệ');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
