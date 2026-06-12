import { Link } from 'react-router-dom';
import { Box, Button, Container, Grid, Stack, Typography, Card, CardContent } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap, faDatabase, faWandMagicSparkles, faChartLine,
  faFileWord, faStopwatch, faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import { GRADIENT } from '../theme';
import { diffColor } from '../utils/constants';

const FEATURES = [
  { icon: faDatabase, title: 'Ngân hàng câu hỏi', desc: 'Quản lý kho câu hỏi cá nhân, phân loại theo môn, chuyên đề, độ khó 1–10, hỗ trợ công thức Toán LaTeX và hình ảnh.' },
  { icon: faWandMagicSparkles, title: 'Tạo đề tự động', desc: 'Nhập ma trận số câu theo từng mốc độ khó, hệ thống chọn ngẫu nhiên từ kho và sinh đề hoàn chỉnh trong vài giây.' },
  { icon: faFileWord, title: 'Xuất Word & PDF', desc: 'Tải đề về đúng chuẩn đề thi Việt Nam, trộn nhiều mã đề 101–104, kèm trang đáp án.' },
  { icon: faStopwatch, title: 'Thi thử online', desc: 'Học sinh tự tạo đề, làm bài có đếm giờ, tự lưu tiến trình, nộp bài chấm điểm tức thì.' },
  { icon: faChartLine, title: 'Theo dõi tiến bộ', desc: 'Biểu đồ điểm số theo thời gian, phân tích chuyên đề mạnh – yếu, gợi ý ôn tập đúng trọng tâm.' },
  { icon: faLayerGroup, title: 'Kho đề chung', desc: 'Giáo viên đóng góp câu hỏi vào kho chung, cộng đồng cùng xây dựng nguồn đề phong phú.' }
];

export default function Landing() {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{ background: GRADIENT, color: '#fff', pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2.5 }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <FontAwesomeIcon icon={faGraduationCap} size="lg" />
              <Typography variant="h6" fontWeight={800}>EduBank</Typography>
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <Button component={Link} to="/dang-nhap" sx={{ color: '#fff' }}>Đăng nhập</Button>
              <Button component={Link} to="/dang-ky" variant="contained" sx={{ bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#EEF2FF' } }}>
                Đăng ký miễn phí
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={5} alignItems="center" sx={{ pt: { xs: 4, md: 8 } }}>
            <Grid item xs={12} md={7}>
              <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: { xs: 34, md: 46 } }}>
                Ngân hàng câu hỏi &<br />Thi thử trực tuyến
              </Typography>
              <Typography sx={{ mt: 2.5, opacity: .92, fontSize: 18, maxWidth: 540 }}>
                Giáo viên tạo đề theo ma trận độ khó chỉ với vài cú nhấp.
                Học sinh thi thử, được chấm điểm tức thì và biết chính xác mình cần ôn phần nào.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                <Button component={Link} to="/dang-ky?role=teacher" size="large" variant="contained"
                  sx={{ bgcolor: '#fff', color: 'primary.main', px: 4, '&:hover': { bgcolor: '#EEF2FF' } }}>
                  Tôi là Giáo viên
                </Button>
                <Button component={Link} to="/dang-ky?role=student" size="large" variant="outlined"
                  sx={{ borderColor: '#ffffff88', color: '#fff', px: 4, '&:hover': { borderColor: '#fff' } }}>
                  Tôi là Học sinh
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5}>
              {/* Thang độ khó 1-10 — chữ ký thị giác */}
              <Card sx={{ borderRadius: 5 }}>
                <CardContent>
                  <Typography fontWeight={700} color="text.primary" gutterBottom>Ma trận đề theo độ khó</Typography>
                  <Stack spacing={1}>
                    {[2, 4, 5, 7, 9].map(d => (
                      <Stack key={d} direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 56, height: 26, borderRadius: 2, bgcolor: diffColor(d), color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>
                          Mức {d}
                        </Box>
                        <Box sx={{ flex: 1, height: 10, borderRadius: 5, bgcolor: '#EEF2FF', overflow: 'hidden' }}>
                          <Box sx={{ width: `${100 - d * 8}%`, height: '100%', bgcolor: diffColor(d), opacity: .85 }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ width: 48 }}>
                          {12 - d} câu
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" textAlign="center" gutterBottom>Mọi thứ bạn cần cho việc ra đề & luyện thi</Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {FEATURES.map(f => (
            <Grid item xs={12} sm={6} md={4} key={f.title}>
              <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardContent>
                  <Box sx={{ width: 48, height: 48, borderRadius: 3, background: GRADIENT, color: '#fff', display: 'grid', placeItems: 'center', mb: 2 }}>
                    <FontAwesomeIcon icon={f.icon} />
                  </Box>
                  <Typography variant="h6" gutterBottom>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box sx={{ py: 3, textAlign: 'center', borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">© {new Date().getFullYear()} EduBank — Nền tảng ngân hàng đề thi Việt Nam</Typography>
      </Box>
    </Box>
  );
}
