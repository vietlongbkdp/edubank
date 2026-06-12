// Tổng quan giáo viên: số liệu kho, phân bố độ khó, câu hỏi lệch độ khó thực tế
import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Stack, Chip, Alert } from '@mui/material';
import { faDatabase, faFileLines, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSnackbar } from 'notistack';
import client, { apiMsg } from '../../api/client';
import StatCard from '../../components/StatCard';
import { diffColor } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    client.get('/analytics', { params: { scope: 'teacher' } })
      .then(({ data }) => setStats(data.data))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }));
  }, []);

  const chartData = [...Array(10)].map((_, i) => ({
    name: `M${i + 1}`, difficulty: i + 1,
    count: stats?.byDifficulty?.find(b => b._id === i + 1)?.count || 0
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Xin chào, {user?.fullName} 👋</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Đây là bức tranh tổng quan về kho câu hỏi và đề thi của bạn.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={faDatabase} label="Câu hỏi trong kho" value={stats?.totalQuestions ?? '—'} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={faFileLines} label="Đề thi đã tạo" value={stats?.totalExams ?? '—'} color="#7C3AED" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={faTriangleExclamation} label="Câu cần xem lại độ khó" value={stats?.mismatched?.length ?? '—'} color="#F59E0B" />
        </Grid>

        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Phân bố câu hỏi theo độ khó</Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <ReTooltip formatter={(v) => [`${v} câu`, 'Số lượng']} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {chartData.map(d => <Cell key={d.name} fill={diffColor(d.difficulty)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Gợi ý điều chỉnh độ khó</Typography>
              {!stats?.mismatched?.length ? (
                <Alert severity="success">Chưa phát hiện câu hỏi nào có độ khó gán lệch nhiều so với kết quả làm bài thực tế.</Alert>
              ) : (
                <Stack spacing={1.5}>
                  {stats.mismatched.map(q => (
                    <Box key={q._id} sx={{ p: 1.5, borderRadius: 3, bgcolor: 'action.hover' }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip size="small" label={q.code} />
                        <Chip size="small" label={`Gán mức ${q.difficulty}`} sx={{ bgcolor: diffColor(q.difficulty), color: '#fff' }} />
                        <Typography variant="caption">
                          tỉ lệ đúng thực tế {Math.round(q.actualRate * 100)}%
                        </Typography>
                      </Stack>
                      <Typography variant="body2" noWrap sx={{ mt: .5 }}>{q.content}</Typography>
                    </Box>
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
