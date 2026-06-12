import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

// Tự gắn token vào mọi request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('edubank_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Token hết hạn → tự đăng xuất
client.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && localStorage.getItem('edubank_token')) {
      localStorage.removeItem('edubank_token');
      localStorage.removeItem('edubank_user');
      window.location.href = '/dang-nhap';
    }
    return Promise.reject(e);
  }
);

export const apiMsg = (e, fallback = 'Có lỗi xảy ra') => e?.response?.data?.message || fallback;

// Upload ảnh lên Cloudinary qua signed upload
export async function uploadImage(file) {
  const { data } = await client.post('/upload');
  const { timestamp, folder, signature, apiKey, cloudName } = data.data;
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey);
  form.append('timestamp', timestamp);
  form.append('folder', folder);
  form.append('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
  const json = await res.json();
  if (!json.secure_url) throw new Error('Upload ảnh thất bại');
  return json.secure_url;
}

export default client;
