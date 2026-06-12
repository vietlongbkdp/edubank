// POST: trả chữ ký để FE upload ảnh trực tiếp lên Cloudinary (signed upload)
import { v2 as cloudinary } from 'cloudinary';
import { requireAuth } from './_lib/auth.js';
import { ok, err } from './_lib/respond.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return err(res, 405, 'Method không hỗ trợ');
  const auth = requireAuth(req, res);
  if (!auth) return;

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `edubank/${auth.role}`;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );
  return ok(res, {
    timestamp, folder, signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME
  });
}
