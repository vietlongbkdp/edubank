// POST /api/auth  body: { action: 'register'|'login', ... }
import bcrypt from 'bcryptjs';
import { connectDB } from './_lib/db.js';
import { User } from './_lib/models.js';
import { signToken } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

const publicUser = (u) => ({
  _id: u._id, fullName: u.fullName, email: u.email, role: u.role,
  avatarUrl: u.avatarUrl, school: u.school, subjectsTaught: u.subjectsTaught,
  grade: u.grade, bio: u.bio, teacherCode: u.teacherCode,
  status: u.status, mustChangePassword: u.mustChangePassword
});

// Sinh mã giáo viên duy nhất dạng GV-XXXXXX
export const genTeacherCode = () => 'GV-' + Math.random().toString(36).slice(2, 8).toUpperCase();

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
      const isTeacher = role === 'teacher';
      const user = await User.create({
        fullName, email,
        passwordHash: await bcrypt.hash(password, 10),
        role: isTeacher ? 'teacher' : 'student', // admin chỉ tạo thủ công trong DB
        teacherCode: isTeacher ? genTeacherCode() : undefined,
        status: 'active' // cả GV lẫn HS mặc định active khi tạo
      });
      return ok(res, { token: signToken(user), user: publicUser(user) }, 'Đăng ký thành công');
    }

    if (action === 'login') {
      const { email, password } = req.body;
      const user = await User.findOne({ email: (email || '').toLowerCase() });
      if (!user || !(await bcrypt.compare(password || '', user.passwordHash)))
        return err(res, 400, 'Email hoặc mật khẩu không đúng');
      if (user.status === 'blocked' || user.isLocked)
        return err(res, 403, 'Tài khoản đã bị khóa, vui lòng liên hệ quản trị viên');
      // deactive (GV cần đóng phí) vẫn cho đăng nhập; frontend sẽ chuyển hướng tới trang thanh toán
      return ok(res, { token: signToken(user), user: publicUser(user) }, 'Đăng nhập thành công');
    }

    if (action === 'google') {
      // Xác thực Google ID token qua tokeninfo endpoint của Google
      const { credential, role } = req.body;
      if (!credential) return err(res, 400, 'Thiếu Google credential');
      const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + credential);
      const g = await r.json();
      // Kiểm tra token hợp lệ và đúng client của ứng dụng
      if (!g.email || (process.env.GOOGLE_CLIENT_ID && g.aud !== process.env.GOOGLE_CLIENT_ID))
        return err(res, 400, 'Google token không hợp lệ');

      let user = await User.findOne({ email: g.email.toLowerCase() });
      if (!user) {
        // Lần đầu đăng nhập Google → tạo tài khoản mới theo vai trò đã chọn
        const isTeacher = role === 'teacher';
        user = await User.create({
          fullName: g.name || g.email.split('@')[0],
          email: g.email,
          passwordHash: await bcrypt.hash(Math.random().toString(36) + Date.now(), 10), // mật khẩu ngẫu nhiên (đăng nhập qua Google)
          role: isTeacher ? 'teacher' : 'student',
          teacherCode: isTeacher ? genTeacherCode() : undefined,
          avatarUrl: g.picture,
          status: 'active'
        });
      } else {
        if (user.status === 'blocked' || user.isLocked) return err(res, 403, 'Tài khoản đã bị khóa, liên hệ quản trị viên');
        // Cập nhật avatar Google nếu chưa có
        if (!user.avatarUrl && g.picture) { user.avatarUrl = g.picture; await user.save(); }
      }
      return ok(res, { token: signToken(user), user: publicUser(user) }, 'Đăng nhập Google thành công');
    }

    return err(res, 400, 'Action không hợp lệ');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
