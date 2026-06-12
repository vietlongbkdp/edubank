// Học sinh tự tạo đề thi thử từ kho chung: chọn nhanh mức độ hoặc tự nhập ma trận
import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography, Stack,
  ToggleButtonGroup, ToggleButton, Chip, Alert
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faScaleBalanced, faFire, faSliders } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import client, { apiMsg } from '../../api/client';
import { SUBJECTS, GRADES, TOPICS, diffColor } from '../../utils/constants';
import { GRADIENT } from '../../theme';

// Chia tổng số câu thành ma trận theo 3 chế độ nhanh
function buildMatrix(mode, total) {
  const dist = {
    easy:   { 2: .25, 3: .30, 4: .25, 5: .15, 6: .05 },
    even:   { 2: .12, 3: .16, 4: .18, 5: .18, 6: .14, 7: .12, 8: .10 },
    hard:   { 4: .10, 5: .15, 6: .20, 7: .25, 8: .15, 9: .10, 10: .05 }
  }[mode];
  const matrix = Object.entries(dist).map(([d, r]) => ({ difficulty: +d, count: Math.round(total * r) }));
  // Bù sai số làm tròn vào mốc giữa
  const diff = total - matrix.reduce((s, m) => s + m.count, 0);
  if (diff) matrix[Math.floor(matrix.length / 2)].count += diff;
  return matrix.filter(m => m.count > 0);
}

export default function MockExamCreate() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState({ subject: 'Toán', grade: '12', topics: [], total: 25, duration: 45, mode: 'even' });
  const [custom, setCustom] = useState(Object.fromEntries([...Array(10)].map((_, i) => [i + 1, 0])));
  const [busy, setBusy] = useState(false);

  const start = async () => {
    const matrix = form.mode === 'custom'
      ? Object.entries(custom).filter(([, c]) => +c > 0).map(([d, c]) => ({ difficulty: +d, count: +c }))
      : buildMatrix(form.mode, Number(form.total));
    if (!matrix.length) return enqueueSnackbar('Hãy nhập số câu', { variant: 'warning' });

    setBusy(true);
    try {
      // 1. Sinh đề và lưu lại
      const { data } = await client.post('/exams-generate', {
        matrix,
        filters: { subject: form.subject, grade: form.grade, topics: form.topics },
        source: 'public', fillNearby: true, save: true,
        title: `Thi thử ${form.subject} — ${new Date().toLocaleDateString('vi-VN')}`,
        duration: Number(form.duration)
      });
      if (!data.data.exam) {
        return enqueueSnackbar('Kho chung chưa đủ câu hỏi phù hợp, hãy thử giảm số câu hoặc bỏ giới hạn chuyên đề', { variant: 'warning' });
      }
      // 2. Bắt đầu lượt làm bài
      const att = await client.post('/attempts', { examId: data.data.exam._id });
      navigate(`/hs/lam-bai/${att.data.data.attemptId}`, { state: att.data.data });
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
    finally { setBusy(false); }
  };

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Tạo đề thi thử</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Chọn môn, số câu và mức độ — hệ thống sẽ sinh đề từ kho câu hỏi chung và bắt đầu tính giờ ngay.
      </Typography>

      <Card>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField select label="Môn học" fullWidth value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value, topics: [] })}>
                {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Khối" fullWidth value={form.grade}
                onChange={e => setForm({ ...form, grade: e.target.value })}>
                {GRADES.map(g => <MenuItem key={g} value={g}>Lớp {g}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField select SelectProps={{ multiple: true }} label="Giới hạn chuyên đề (bỏ trống = tất cả)" fullWidth
                value={form.topics} onChange={e => setForm({ ...form, topics: e.target.value })}>
                {(TOPICS[form.subject] || []).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Tổng số câu" type="number" fullWidth inputProps={{ min: 5, max: 50 }}
                value={form.total} onChange={e => setForm({ ...form, total: e.target.value })}
                disabled={form.mode === 'custom'} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Thời gian (phút)" type="number" fullWidth inputProps={{ min: 10, max: 180 }}
                value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={700} gutterBottom>Mức độ đề</Typography>
              <ToggleButtonGroup exclusive fullWidth value={form.mode}
                onChange={(_, v) => v && setForm({ ...form, mode: v })}>
                <ToggleButton value="easy" sx={{ gap: 1 }}><FontAwesomeIcon icon={faBolt} /> Dễ</ToggleButton>
                <ToggleButton value="even" sx={{ gap: 1 }}><FontAwesomeIcon icon={faScaleBalanced} /> Cân bằng</ToggleButton>
                <ToggleButton value="hard" sx={{ gap: 1 }}><FontAwesomeIcon icon={faFire} /> Khó</ToggleButton>
                <ToggleButton value="custom" sx={{ gap: 1 }}><FontAwesomeIcon icon={faSliders} /> Tự chọn</ToggleButton>
              </ToggleButtonGroup>
            </Grid>

            {form.mode === 'custom' && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 1.5 }}>Nhập số câu cho từng mốc độ khó 1–10:</Alert>
                <Grid container spacing={1}>
                  {[...Array(10)].map((_, i) => {
                    const d = i + 1;
                    return (
                      <Grid item xs={6} sm={2.4} key={d}>
                        <Stack alignItems="center" spacing={.5}>
                          <Chip size="small" label={`Mức ${d}`} sx={{ bgcolor: diffColor(d), color: '#fff' }} />
                          <TextField type="number" size="small" inputProps={{ min: 0, max: 30, style: { textAlign: 'center' } }}
                            value={custom[d]} onChange={e => setCustom({ ...custom, [d]: e.target.value })} />
                        </Stack>
                      </Grid>
                    );
                  })}
                </Grid>
              </Grid>
            )}
          </Grid>

          <Button fullWidth size="large" variant="contained" sx={{ mt: 3, background: GRADIENT, py: 1.4 }}
            disabled={busy} onClick={start}>
            {busy ? 'Đang chuẩn bị đề...' : 'Bắt đầu làm bài →'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
