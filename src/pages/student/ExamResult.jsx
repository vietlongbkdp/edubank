// Kết quả bài thi: điểm số, biểu đồ phân tích, xem lại từng câu kèm lời giải
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Stack, Grid, Button, LinearProgress, Chip, Divider
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import client, { apiMsg } from '../../api/client';
import QuestionView from '../../components/QuestionView';
import { diffColor } from '../../utils/constants';
import { GRADIENT } from '../../theme';

export default function ExamResult() {
  const { attemptId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const [attempt, setAttempt] = useState(null);

  useEffect(() => {
    client.get('/attempts', { params: { id: attemptId } })
      .then(({ data }) => setAttempt(data.data))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }));
  }, [attemptId]);

  if (!attempt) return <LinearProgress />;

  const qs = attempt.examId?.questionIds || [];
  const ansMap = new Map(attempt.answers.map(a => [String(a.questionId), a]));
  const scoreColor = attempt.score >= 8 ? '#10B981' : attempt.score >= 5 ? '#F59E0B' : '#EF4444';
  const minutes = attempt.submittedAt
    ? Math.round((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 60000)
    : null;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Kết quả bài thi</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {attempt.examId?.title} — nộp lúc {dayjs(attempt.submittedAt).format('HH:mm DD/MM/YYYY')}
      </Typography>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', background: GRADIENT, color: '#fff' }}>
            <CardContent sx={{ py: 4 }}>
              <Typography sx={{ opacity: .85 }}>Điểm số của bạn</Typography>
              <Typography variant="h2" fontWeight={800}>{attempt.score}</Typography>
              <Typography sx={{ opacity: .85 }}>
                Đúng {attempt.correctCount}/{attempt.totalQuestions} câu
                {minutes != null && ` · ${minutes} phút`}
              </Typography>
            </CardContent>
          </Card>
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            <Button fullWidth variant="outlined" component={Link} to="/hs/thi-thu">Thi lại đề khác</Button>
            <Button fullWidth variant="outlined" component={Link} to="/hs/tien-bo">Xem tiến bộ</Button>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Theo độ khó</Typography>
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer>
                  <BarChart data={(attempt.breakdownDifficulty || []).map(b => ({
                    name: `M${b.difficulty}`, difficulty: b.difficulty,
                    rate: Math.round((b.correct / b.total) * 100)
                  }))}>
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <ReTooltip formatter={v => [`${v}%`, 'Tỉ lệ đúng']} />
                    <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                      {(attempt.breakdownDifficulty || []).map(b => (
                        <Cell key={b.difficulty} fill={diffColor(b.difficulty)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Theo chuyên đề</Typography>
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer>
                  <RadarChart data={(attempt.breakdownTopic || []).map(b => ({
                    topic: b.topic, rate: Math.round((b.correct / b.total) * 100)
                  }))}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="topic" tick={{ fontSize: 11 }} />
                    <Radar dataKey="rate" stroke="#4F46E5" fill="#4F46E5" fillOpacity={.45} />
                    <ReTooltip formatter={v => [`${v}%`, 'Tỉ lệ đúng']} />
                  </RadarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }}>
        <Chip label="Xem lại bài làm & lời giải chi tiết" />
      </Divider>

      <Stack spacing={2.5}>
        {qs.map((q, i) => {
          const a = ansMap.get(String(q._id));
          return (
            <Card key={q._id} sx={{ borderLeft: 5, borderColor: a?.isCorrect ? 'success.main' : 'error.main' }}>
              <CardContent>
                <Stack direction="row" justifyContent="flex-end" sx={{ float: 'right' }}>
                  <Chip size="small" color={a?.isCorrect ? 'success' : 'error'}
                    label={a?.isCorrect ? 'Đúng' : a?.selected ? 'Sai' : 'Bỏ trống'} />
                </Stack>
                <QuestionView q={q} index={i} selected={a?.selected} readOnly showAnswer showDiff />
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
}
