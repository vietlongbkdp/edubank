// Cấu hình hệ thống (singleton). GET: ai đăng nhập cũng đọc được phần công khai.
// PUT: chỉ admin sửa (ngưỡng số đề n, thông tin thanh toán SePay/VietQR).
import { connectDB } from './_lib/db.js';
import { Setting } from './_lib/models.js';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

const KEY = 'global';

async function getOrCreate() {
  let s = await Setting.findOne({ key: KEY });
  if (!s) s = await Setting.create({ key: KEY });
  return s;
}

export default async function handler(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return;
  await connectDB();
  try {
    const s = await getOrCreate();

    if (req.method === 'GET') {
      return ok(res, {
        teacherExamLimit: s.teacherExamLimit,
        payAmount: s.payAmount,
        bankAccount: s.bankAccount,
        bankName: s.bankName,
        bankAccountName: s.bankAccountName,
        payPrefix: s.payPrefix
      });
    }

    if (req.method === 'PUT') {
      if (auth.role !== 'admin') return err(res, 403, 'Chỉ admin');
      const { teacherExamLimit, payAmount, bankAccount, bankName, bankAccountName, payPrefix } = req.body || {};
      Object.assign(s, {
        ...(teacherExamLimit !== undefined && { teacherExamLimit: Math.max(0, Number(teacherExamLimit) || 0) }),
        ...(payAmount !== undefined && { payAmount: Math.max(0, Number(payAmount) || 0) }),
        ...(bankAccount !== undefined && { bankAccount }),
        ...(bankName !== undefined && { bankName }),
        ...(bankAccountName !== undefined && { bankAccountName }),
        ...(payPrefix !== undefined && { payPrefix })
      });
      await s.save();
      return ok(res, s, 'Đã lưu cấu hình');
    }

    return err(res, 405, 'Method không hỗ trợ');
  } catch (e) {
    console.error(e);
    return err(res, 500, 'Lỗi máy chủ');
  }
}
