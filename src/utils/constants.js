// Danh mục dùng chung toàn hệ thống
export const SUBJECTS = ['Toán', 'Vật lý', 'Hóa học', 'Sinh học', 'Tiếng Anh', 'Ngữ văn', 'Lịch sử', 'Địa lý'];
export const GRADES = ['10', '11', '12'];

export const TOPICS = {
  'Toán': ['Hàm số', 'Mũ - Logarit', 'Nguyên hàm - Tích phân', 'Số phức', 'Khối đa diện', 'Mặt nón - trụ - cầu', 'Oxyz', 'Tổ hợp - Xác suất', 'Dãy số - Giới hạn', 'Lượng giác'],
  'Vật lý': ['Dao động cơ', 'Sóng cơ', 'Điện xoay chiều', 'Dao động điện từ', 'Sóng ánh sáng', 'Lượng tử ánh sáng', 'Hạt nhân'],
  'Hóa học': ['Este - Lipit', 'Cacbohiđrat', 'Amin - Amino axit', 'Polime', 'Đại cương kim loại', 'Kim loại kiềm - kiềm thổ - nhôm', 'Sắt - Crom', 'Hóa hữu cơ 11', 'Hóa vô cơ 11'],
  'Sinh học': ['Cơ chế di truyền', 'Quy luật di truyền', 'Di truyền quần thể', 'Tiến hóa', 'Sinh thái'],
  'Tiếng Anh': ['Ngữ pháp', 'Từ vựng', 'Đọc hiểu', 'Điền từ', 'Phát âm - Trọng âm', 'Giao tiếp'],
  'Ngữ văn': ['Đọc hiểu', 'Nghị luận xã hội', 'Nghị luận văn học'],
  'Lịch sử': ['VN 1919-1930', 'VN 1930-1945', 'VN 1945-1954', 'VN 1954-1975', 'Thế giới hiện đại'],
  'Địa lý': ['Tự nhiên VN', 'Dân cư', 'Các ngành kinh tế', 'Các vùng kinh tế', 'Kỹ năng Atlat - biểu đồ']
};

export const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Trắc nghiệm 1 đáp án' },
  { value: 'multi_choice', label: 'Trắc nghiệm nhiều đáp án' },
  { value: 'true_false', label: 'Đúng / Sai' },
  { value: 'short_answer', label: 'Trả lời ngắn' },
  { value: 'essay', label: 'Tự luận' }
];

export const COGNITIVE_LEVELS = [
  { value: 'nhan_biet', label: 'Nhận biết' },
  { value: 'thong_hieu', label: 'Thông hiểu' },
  { value: 'van_dung', label: 'Vận dụng' },
  { value: 'van_dung_cao', label: 'Vận dụng cao' }
];

// Thang độ khó 1-10: nhãn + màu (xanh lá → đỏ) — "chữ ký" thị giác của EduBank
export function diffLabel(d) {
  if (d <= 2) return 'Rất dễ';
  if (d <= 4) return 'Dễ';
  if (d <= 6) return 'Trung bình';
  if (d <= 8) return 'Khó';
  return 'Rất khó';
}
export function diffColor(d) {
  const colors = ['#22c55e', '#4ade80', '#a3e635', '#facc15', '#fbbf24', '#fb923c', '#f97316', '#ef4444', '#dc2626', '#b91c1c'];
  return colors[Math.min(Math.max(d, 1), 10) - 1];
}
