import { Link } from 'react-router-dom';
import { Box, Button, Container, Grid, Stack, Typography, Card, CardContent } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap, faDatabase, faWandMagicSparkles, faChartLine,
  faFileWord, faStopwatch, faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import { GRADIENT } from '../theme';
import { HeroIllustration, StepIllustration } from '../components/Illustrations';

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
            <Stack direction="row" spacing={{ xs: .5, sm: 1.5 }}>
              <Button component={Link} to="/dang-nhap" size="small"
                sx={{ color: '#fff', fontSize: { xs: 13, sm: 14 } }}>
                Đăng nhập
              </Button>
              <Button component={Link} to="/dang-ky" variant="contained" size="small"
                sx={{ bgcolor: '#fff', color: 'primary.main', fontSize: { xs: 13, sm: 14 }, px: { xs: 1.5, sm: 2.5 }, '&:hover': { bgcolor: '#EEF2FF' } }}>
                Đăng ký
              </Button>
            </Stack>
          </Stack>

          <Grid container spacing={{ xs: 3, sm: 4, md: 5 }} alignItems="center" sx={{ pt: { xs: 3, sm: 5, md: 8 } }}>
            <Grid item xs={12} md={7}>
              <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1.2, fontSize: { xs: 28, sm: 38, md: 46 } }}>
                Ngân hàng câu hỏi &<br />Thi thử trực tuyến
              </Typography>
              <Typography sx={{ mt: 2.5, opacity: .92, fontSize: { xs: 15.5, sm: 17, md: 18 }, maxWidth: 540 }}>
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
              {/* Hình minh họa hero: tờ đề thi + huy hiệu điểm + bút chì + ký hiệu toán trôi nổi */}
              <HeroIllustration />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Cách hoạt động — 3 bước có hình minh họa */}
      <Box sx={{ bgcolor: 'background.paper' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          <Typography variant="h4" textAlign="center" gutterBottom sx={{ fontSize: { xs: 26, md: 34 } }}>
            Tạo đề thi chỉ trong 3 bước
          </Typography>
          <Grid container spacing={{ xs: 3, md: 4 }} sx={{ mt: 1 }}>
            {[
              { step: 1, title: 'Chọn ma trận độ khó', desc: 'Nhập số câu cho từng mốc độ khó 1–10, giới hạn chuyên đề nếu muốn.' },
              { step: 2, title: 'Hệ thống sinh đề', desc: 'Câu hỏi được chọn ngẫu nhiên từ kho, xếp từ dễ đến khó như đề thật.' },
              { step: 3, title: 'Tải về & sử dụng', desc: 'Xuất Word/PDF với 1–4 mã đề trộn sẵn, kèm trang đáp án.' }
            ].map(s => (
              <Grid item xs={12} sm={4} key={s.step}>
                <Card sx={{ height: '100%', textAlign: 'center', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ maxWidth: 180, mx: 'auto', mb: 1.5 }}>
                      <StepIllustration step={s.step} />
                    </Box>
                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 1 }}>
                      <Box sx={{ width: 28, height: 28, borderRadius: '50%', background: GRADIENT, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14 }}>
                        {s.step}
                      </Box>
                      <Typography variant="h6">{s.title}</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{s.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
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
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, background: GRADIENT, color: '#fff', display: 'grid', placeItems: 'center', mb: 2 }}>
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
