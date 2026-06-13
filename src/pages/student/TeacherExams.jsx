// Học sinh nhập mã giáo viên → xem danh sách đề (đề khóa hiện 🔒) → nhập pass nếu cần → làm bài
import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Button, TextField, Grid, Chip, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faLock, faLockOpen, faClock, faListOl, faChalkboardUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import client, { apiMsg } from '../../api/client';
import { GRADIENT } from '../../theme';

export default function TeacherExams() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [code, setCode] = useState('');
  const [data, setData] = useState(null);   // { teacher, exams }
  const [busy, setBusy] = useState(false);
  const [pwDialog, setPwDialog] = useState(null); // { exam, password }

  const search = async () => {
    if (!code.trim()) return;
    setBusy(true); setData(null);
    try {
      const { data: res } = await client.get('/exams', { params: { teacherCode: code.trim() } });
      setData(res.data);
      if (!res.data.exams.length) enqueueSnackbar('Giáo viên này chưa chia sẻ đề nào', { variant: 'info' });
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
    finally { setBusy(false); }
  };

  // Bắt đầu làm bài — đề khóa thì mở dialog nhập mã trước
  const startExam = async (exam, password = '') => {
    try {
      const att = await client.post('/attempts', { examId: exam._id, password });
      setPwDialog(null);
      navigate(`/hs/lam-bai/${att.data.data.attemptId}`, { state: att.data.data });
    } catch (e) {
      enqueueSnackbar(apiMsg(e), { variant: 'error' });
    }
  };

  const handleStart = (exam) => {
    if (exam.hasPassword) setPwDialog({ exam, password: '' });
    else startExam(exam);
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Luyện đề theo giáo viên</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Nhập mã giáo viên (do thầy/cô cung cấp, dạng <b>GV-XXXXXX</b>) để xem danh sách đề luyện tập.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth placeholder="Ví dụ: GV-A1B2C3" value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && search()}
              inputProps={{ style: { textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 } }}
            />
            <Button variant="contained" sx={{ background: GRADIENT, px: 4, whiteSpace: 'nowrap' }}
              disabled={busy} onClick={search}
              startIcon={<FontAwesomeIcon icon={faMagnifyingGlass} />}>
              {busy ? 'Đang tìm...' : 'Tìm đề'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {data && (
        <>
          <Card sx={{ mb: 2.5, background: GRADIENT, color: '#fff' }}>
            <CardContent sx={{ py: '16px !important' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={data.teacher.avatarUrl} sx={{ width: 48, height: 48, bgcolor: '#ffffff33' }}>
                  <FontAwesomeIcon icon={faChalkboardUser} />
                </Avatar>
                <Box>
                  <Typography fontWeight={800}>{data.teacher.fullName}</Typography>
                  <Typography variant="body2" sx={{ opacity: .85 }}>
                    {data.teacher.school || 'Giáo viên'} · {data.exams.length} đề đang chia sẻ
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {!data.exams.length ? (
            <Alert severity="info">Giáo viên này chưa chia sẻ đề nào. Hãy hỏi thầy/cô bật chia sẻ đề nhé!</Alert>
          ) : (
            <Grid container spacing={2}>
              {data.exams.map(exam => (
                <Grid item xs={12} sm={6} key={exam._id}>
                  <Card sx={{ height: '100%', borderLeft: 4,
                    borderLeftColor: exam.hasPassword ? 'warning.main' : 'success.main', transition: 'all .18s ease',
                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 10px 28px rgba(79,70,229,.18)' } }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Chip size="small"
                          color={exam.hasPassword ? 'warning' : 'success'}
                          icon={<FontAwesomeIcon icon={exam.hasPassword ? faLock : faLockOpen} />}
                          label={exam.hasPassword ? 'Cần mã khóa' : 'Đề mở'} />
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(exam.createdAt).format('DD/MM/YYYY')}
                        </Typography>
                      </Stack>
                      <Typography variant="h6" sx={{ mt: 1, minHeight: 56 }}>{exam.title}</Typography>
                      <Stack direction="row" spacing={2} sx={{ color: 'text.secondary', mb: 2 }}>
                        <Typography variant="body2">{exam.subject} {exam.grade && `· Lớp ${exam.grade}`}</Typography>
                        <Typography variant="body2"><FontAwesomeIcon icon={faListOl} /> {exam.questionCount} câu</Typography>
                        <Typography variant="body2"><FontAwesomeIcon icon={faClock} /> {exam.duration}'</Typography>
                      </Stack>
                      <Button fullWidth variant="contained" onClick={() => handleStart(exam)}>
                        {exam.hasPassword ? 'Nhập mã & làm bài' : 'Làm bài ngay'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* Dialog nhập mã khóa đề */}
      <Dialog open={!!pwDialog} onClose={() => setPwDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle><FontAwesomeIcon icon={faLock} /> Đề có khóa</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Đề "<b>{pwDialog?.exam.title}</b>" yêu cầu mã khóa. Hãy nhập mã do giáo viên cung cấp:
          </Typography>
          <TextField autoFocus fullWidth label="Mã khóa đề" value={pwDialog?.password || ''}
            onChange={e => setPwDialog({ ...pwDialog, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && startExam(pwDialog.exam, pwDialog.password)} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPwDialog(null)}>Hủy</Button>
          <Button variant="contained" disabled={!pwDialog?.password}
            onClick={() => startExam(pwDialog.exam, pwDialog.password)}>
            Vào làm bài
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
