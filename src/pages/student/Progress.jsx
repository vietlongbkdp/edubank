// Theo dõi tiến bộ: biểu đồ điểm theo thời gian, chuyên đề mạnh/yếu, gợi ý ôn tập
import { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Stack, Chip, Alert, LinearProgress
} from '@mui/material';
import { faClipboardCheck, faStar, faArrowTrendUp } from '@fortawesome/free-solid-svg-icons';
import {
  LineChart, Line, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import client, { apiMsg } from '../../api/client';
import StatCard from '../../components/StatCard';

export default function Progress() {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState(null);

  useEffect(() => {
    client.get('/analytics', { params: { scope: 'student' } })
      .then(({ data }) => setData(data.data))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }));
  }, []);

  if (!data) return <LinearProgress />;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2.5 }}>Tiến bộ của tôi</Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <StatCard icon={faClipboardCheck} label="Bài thi đã làm" value={data.totalAttempts} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={faStar} label="Điểm trung bình" value={data.avgScore} color="#7C3AED"
            sub={`Cao nhất: ${data.bestScore}`} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard icon={faArrowTrendUp} label="Xu hướng 3 bài gần nhất"
            value={data.trend > 0 ? `+${data.trend}` : data.trend}
            color={data.trend >= 0 ? '#10B981' : '#EF4444'}
            sub={data.trend > 0 ? 'Đang tiến bộ 🎉' : data.trend < 0 ? 'Cần cố gắng hơn' : 'Ổn định'} />
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Điểm số theo thời gian</Typography>
              {data.timeline.length < 2 ? (
                <Alert severity="info">Làm thêm bài thi để xem biểu đồ tiến bộ của bạn.</Alert>
              ) : (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={data.timeline.map(t => ({
                      ...t, date: dayjs(t.date).format('DD/MM')
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" opacity={.3} />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <ReTooltip formatter={(v) => [`${v} điểm`]} labelFormatter={(l, p) => p?.[0]?.payload?.title || l} />
                      <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3}
                        dot={{ r: 5, fill: '#7C3AED' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Gợi ý ôn tập</Typography>
              {!data.weakest.length ? (
                <Alert severity="info">Chưa đủ dữ liệu để đánh giá. Hãy làm vài bài thi thử nhé!</Alert>
              ) : (
                <Stack spacing={1.5}>
                  {data.weakest.map(t => (
                    <Alert key={t.topic} severity={t.rate < 50 ? 'error' : 'warning'} icon={false}>
                      <b>{t.topic}</b>: tỉ lệ đúng {t.rate}% ({t.correct}/{t.total} câu).
                      {t.rate < 50 ? ' Đây là phần bạn nên ưu tiên ôn lại.' : ' Cần luyện thêm để vững hơn.'}
                    </Alert>
                  ))}
                  {data.strongest.filter(t => t.rate >= 70).slice(0, 1).map(t => (
                    <Alert key={t.topic} severity="success" icon={false}>
                      <b>{t.topic}</b> là thế mạnh của bạn ({t.rate}% đúng) — giữ vững phong độ!
                    </Alert>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Tỉ lệ đúng theo chuyên đề</Typography>
              <Stack spacing={1.5}>
                {data.topics.map(t => (
                  <Stack key={t.topic} direction="row" spacing={2} alignItems="center">
                    <Typography sx={{ width: { xs: 130, sm: 200 } }} variant="body2" noWrap>{t.topic}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress variant="determinate" value={t.rate}
                        sx={{
                          height: 10, borderRadius: 5,
                          '& .MuiLinearProgress-bar': {
                            bgcolor: t.rate >= 70 ? '#10B981' : t.rate >= 50 ? '#F59E0B' : '#EF4444',
                            borderRadius: 5
                          }
                        }} />
                    </Box>
                    <Chip size="small" label={`${t.rate}%`} sx={{ width: 60 }} />
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
