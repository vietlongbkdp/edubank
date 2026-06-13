# EduBank — Ngân hàng Câu hỏi & Thi thử Trực tuyến

Nền tảng cho giáo viên quản lý ngân hàng câu hỏi, tạo đề thi tự động theo ma trận độ khó 1–10, xuất Word/PDF nhiều mã đề; học sinh thi thử online, chấm điểm tức thì và theo dõi tiến bộ.

## Công nghệ
- **Frontend**: Vite + ReactJS + MUI v5 + Font Awesome + KaTeX (công thức Toán) + Recharts
- **Backend**: Vercel Serverless Functions (`/api`, 9 functions — trong giới hạn free)
- **Database**: MongoDB Atlas (mongoose, cached connection)
- **Ảnh**: Cloudinary (signed upload)
- **Auth**: JWT + bcryptjs, phân quyền teacher / student / admin

## Triển khai (không cần Node.js local)

### 1. Chuẩn bị MongoDB Atlas
- Tạo cluster free, tạo Database User.
- **Network Access** → Add IP `0.0.0.0/0` (cho phép Vercel kết nối).
- Copy connection string, thêm tên DB: `...mongodb.net/edubank?retryWrites=true&w=majority`

### 2. Chuẩn bị Cloudinary
- Dashboard → copy `Cloud name`, `API Key`, `API Secret`.

### 3. Deploy lên Vercel
1. Push toàn bộ code này lên một repo GitHub mới.
2. Vercel → **Add New Project** → import repo. Framework: **Vite** (tự nhận diện).
3. **Settings → Environment Variables**, thêm:

| Tên | Giá trị |
|---|---|
| `MONGODB_URI` | connection string ở bước 1 |
| `JWT_SECRET` | chuỗi ngẫu nhiên dài (vd tạo tại passwordsgenerator.net) |
| `CLOUDINARY_CLOUD_NAME` | cloud name |
| `CLOUDINARY_API_KEY` | api key |
| `CLOUDINARY_API_SECRET` | api secret |
| `GOOGLE_CLIENT_ID` | (tùy chọn) OAuth Client ID để bật đăng nhập Google |
| `VITE_GOOGLE_CLIENT_ID` | (tùy chọn) đặt CÙNG giá trị `GOOGLE_CLIENT_ID` — biến này cho frontend |

4. Deploy. Xong!

### 4. Tạo tài khoản Admin (tùy chọn)
Đăng ký 1 tài khoản bình thường, sau đó vào MongoDB Atlas → Collections → `users` → sửa `role` thành `"admin"`.

## Cấu trúc thư mục
```
api/                  # Serverless functions
  _lib/               # db, models, auth, respond (không thành endpoint)
  auth.js             # đăng ký / đăng nhập
  users.js            # hồ sơ, admin khóa tài khoản
  questions.js        # CRUD câu hỏi + báo cáo/khôi phục
  questions-import.js # nhập hàng loạt
  exams-generate.js   # sinh đề theo ma trận ($match + $sample)
  exams.js            # CRUD đề thi
  attempts.js         # làm bài, autosave, nộp + chấm điểm server-side
  analytics.js        # thống kê GV / tiến bộ HS
  upload.js           # ký upload Cloudinary
src/
  pages/teacher/      # Dashboard, Kho câu hỏi, Tạo đề, Đề thi
  pages/student/      # Dashboard, Thi thử, Làm bài, Kết quả, Lịch sử, Tiến bộ
  pages/admin/        # Người dùng, Câu hỏi bị báo cáo
  components/         # Latex, QuestionView, AppLayout, DiffChip...
  utils/exportExam.js # xuất Word/PDF + trộn mã đề 101–104
```

## Bật đăng nhập Google (tùy chọn)
1. Vào https://console.cloud.google.com → tạo project → **APIs & Services → Credentials → Create OAuth client ID** → loại **Web application**.
2. Mục **Authorized JavaScript origins** thêm domain Vercel của bạn (vd `https://edubank-theta.vercel.app`) và `http://localhost:5173` nếu chạy local.
3. Copy **Client ID** dạng `xxxxx.apps.googleusercontent.com`, đặt vào CẢ HAI biến `GOOGLE_CLIENT_ID` và `VITE_GOOGLE_CLIENT_ID` trên Vercel rồi Redeploy.
4. Nếu không cấu hình, nút Google tự ẩn — các tính năng khác vẫn chạy bình thường.

## Tính năng nâng cao
- **Mã giáo viên**: mỗi GV có mã `GV-XXXXXX` (hiện trên Dashboard, có nút copy). Học sinh vào "Luyện đề theo GV", nhập mã để xem danh sách đề được chia sẻ.
- **Khóa đề**: khi tạo/sửa đề, GV có thể đặt mã khóa. Đề khóa hiện 🔒, học sinh phải nhập đúng mã mới làm được; để trống = đề mở.
- **Di trú dữ liệu cũ**: tài khoản GV cũ tự được cấp mã khi mở Dashboard. Hoặc admin gọi `POST /api/migrate` (đăng nhập admin, gửi kèm header Authorization) để cấp hàng loạt.

## Ghi chú quan trọng
- **LaTeX**: nhập công thức dạng `$x^2 + 1$` (inline) hoặc `$$\int_0^1 x\,dx$$` (block) trong đề bài / phương án / lời giải — web render bằng KaTeX. Khi **xuất Word**, công thức giữ nguyên dạng văn bản LaTeX để GV chỉnh bằng MathType/Equation; khi **xuất PDF** (qua hộp thoại in → "Lưu thành PDF") công thức hiển thị đẹp như trên web.
- **Chấm điểm** thực hiện hoàn toàn server-side; câu hỏi gửi cho học sinh đang làm bài đã bị **ẩn đáp án đúng & lời giải**.
- **Đồng hồ** tính theo `startedAt` lưu trên server — F5 không reset được thời gian.
- **Trộn mã đề**: chọn số mã đề (1–4) khi xuất; hệ thống trộn thứ tự câu + phương án và tự remap đáp án đúng cho từng mã, kèm trang đáp án riêng.

## Dev local (nếu sau này có Node.js)
```bash
npm install
npx vercel dev   # chạy cả frontend + API cùng lúc (cần file .env)
```
