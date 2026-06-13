import jwt from 'jsonwebtoken';

// Sinh mật khẩu ngẫu nhiên 8 ký tự (chữ hoa, thường, số) cho admin reset
export function genPassword(len = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, fullName: user.fullName },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Lấy user từ header Authorization: Bearer <token>. Trả về null nếu không hợp lệ
export function getAuth(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(h.slice(7), process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// Kiểm tra đăng nhập + (tùy chọn) vai trò. Trả về user hoặc gửi lỗi và trả null
export function requireAuth(req, res, roles) {
  const user = getAuth(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Bạn cần đăng nhập' });
    return null;
  }
  if (roles && !roles.includes(user.role)) {
    res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    return null;
  }
  return user;
}
