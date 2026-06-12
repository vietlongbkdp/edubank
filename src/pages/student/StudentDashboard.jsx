// Tổng quan học sinh: lối tắt + tóm tắt nhanh
import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Stack, Button, Chip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faChartLine, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { GRADIENT } from '../../theme';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    client.get('/analytics', { params: { scope: 'student' } })
      .then(({ data }) => setStats(data.data)).catch(() => {});
  }, []);

  const recent = stats?.timeline?.slice(-3).reverse() || [];

  return (
    <Box>
      <Card sx={{ background: GRADIENT, color: '#fff', mb: 3 }}>
        <CardContent sx={{ py: 4 }}>
          <Typography variant="h4">Chào {user?.fullName}! 📚</Typography>
          <Typography sx={{ opacity: .9, mt: 1 }}>
            {stats?.totalAttempts
              ? `Bạn đã hoàn thành ${stats.totalAttempts} bài thi, điểm trung bình ${stats.avgScore}. ${stats.trend > 0 ? 'Đang tiến bộ rất tốt!' : 'Tiếp tục luyện tập nhé!'}`
              : 'Sẵn sàng cho bài thi thử đầu tiên chưa? Tạo đề chỉ mất 30 giây.'}
          </Typography>
          <Button component={Link} to="/hs/thi-thu" variant="contained" size="large"
            sx={{ mt: 2.5, bgcolor: '#fff', color: 'primary.main', '&:hover': { bgcolor: '#EEF2FF' } }}
            startIcon={<FontAwesomeIcon icon={faPenToSquare} />}>
            Tạo đề thi thử ngay
          </Button>
        </CardContent>
      </Card>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h6"><FontAwesomeIcon icon={faClockRotateLeft} /> Bài thi gần đây</Typography>
                <Button size="small" component={Link} to="/hs/lich-su">Xem tất cả</Button>
              </Stack>
              {!recent.length ? (
                <Typography color="text.secondary">Chưa có bài thi nào.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {recent.map(t => (
                    <Stack key={t.id} component={Link} to={`/hs/ket-qua/${t.id}`}
                      direction="row" justifyContent="space-between" alignItems="center"
                      sx={{ p: 1.5, borderRadius: 3, bgcolor: 'action.hover', textDecoration: 'none', color: 'inherit' }}>
                      <Box>
                        <Typography fontWeight={600} variant="body2">{t.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{dayjs(t.date).format('HH:mm DD/MM/YYYY')}</Typography>
                      </Box>
                      <Chip label={t.score} sx={{ fontWeight: 800, bgcolor: t.score >= 8 ? '#10B981' : t.score >= 5 ? '#F59E0B' : '#EF4444', color: '#fff' }} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom><FontAwesomeIcon icon={faChartLine} /> Cần ôn tập</Typography>
              {!stats?.weakest?.length ? (
                <Typography color="text.secondary">Làm bài thi để nhận gợi ý ôn tập cá nhân hóa.</Typography>
              ) : (
                <Stack spacing={1}>
                  {stats.weakest.map(t => (
                    <Stack key={t.topic} direction="row" justifyContent="space-between">
                      <Typography variant="body2">{t.topic}</Typography>
                      <Chip size="small" label={`${t.rate}%`} color={t.rate < 50 ? 'error' : 'warning'} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
