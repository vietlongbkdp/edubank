// Thanh toán phí GV qua VietQR + SePay
// GET ?info=1  : trả thông tin QR/chuyển khoản cho GV đang đăng nhập
// POST (webhook): SePay gọi khi có giao dịch tới → khớp nội dung CK với user → kích hoạt lại
import { connectDB } from './_lib/db.js';
import { User, Setting } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

const KEY = 'global';
// Nội dung chuyển khoản: <prefix><6 ký tự cuối của userId> để webhook khớp được
const payContent = (prefix, userId) => `${prefix}${String(userId).slice(-6).toUpperCase()}`;

export default async function handler(req, res) {
  await connectDB();
  try {
    // ===== GV lấy thông tin thanh toán =====
    if (req.method === 'GET' && req.query.info === '1') {
      const auth = requireAuth(req, res);
      if (!auth) return;
      const s = (await Setting.findOne({ key: KEY })) || {};
      const content = payContent(s.payPrefix || 'EDUBANK', auth.id);
      const amount = s.payAmount || 0;
      // Tạo link ảnh VietQR (img.vietqr.io) nếu admin đã cấu hình ngân hàng
      let qrUrl = '';
      if (s.bankName && s.bankAccount) {
        qrUrl = `https://img.vietqr.io/image/${s.bankName}-${s.bankAccount}-compact2.png`
          + `?amount=${amount}&addInfo=${encodeURIComponent(content)}`
          + (s.bankAccountName ? `&accountName=${encodeURIComponent(s.bankAccountName)}` : '');
      }
      return ok(res, {
        amount, content, qrUrl,
        bankAccount: s.bankAccount || '', bankName: s.bankName || '',
        bankAccountName: s.bankAccountName || ''
      });
    }

    // ===== Webhook SePay =====
    if (req.method === 'POST') {
      // Bảo vệ webhook bằng API key (đặt SEPAY_WEBHOOK_KEY trong env, cấu hình ở SePay header Authorization: Apikey <key>)
      const key = process.env.SEPAY_WEBHOOK_KEY;
      if (key) {
        const h = req.headers.authorization || '';
        if (h !== `Apikey ${key}`) return err(res, 401, 'Sai API key');
      }
      const body = req.body || {};
      // SePay gửi nội dung chuyển khoản ở 'content'/'description', số tiền 'transferAmount'
      const text = `${body.content || ''} ${body.description || ''}`.toUpperCase();
      const s = (await Setting.findOne({ key: KEY })) || {};
      const prefix = (s.payPrefix || 'EDUBANK').toUpperCase();

      // Tìm GV có nội dung CK khớp
      const teachers = await User.find({ role: 'teacher' }).select('_id status').lean();
      const matched = teachers.find(u => text.includes(payContent(prefix, u._id)));
      if (!matched) return ok(res, { matched: false }, 'Không khớp người dùng nào');

      const until = new Date(); until.setFullYear(until.getFullYear() + 1); // gia hạn 1 năm
      await User.findByIdAndUpdate(matched._id, { status: 'active', isLocked: false, paidUntil: until });
      return ok(res, { matched: true, userId: matched._id }, 'Đã kích hoạt tài khoản');
    }

    return err(res, 405, 'Method không hỗ trợ');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
