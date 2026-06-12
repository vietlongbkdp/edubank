// Giao diện làm bài thi: đếm ngược, bảng câu hỏi, đánh dấu xem lại, autosave, tự nộp khi hết giờ
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Stack, Button, Grid, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Chip
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlag, faChevronLeft, faChevronRight, faPaperPlane, faClock } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import client, { apiMsg } from '../../api/client';
import QuestionView from '../../components/QuestionView';
import { GRADIENT } from '../../theme';

export default function TakeExam() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const [session, setSession] = useState(location.state || null);
  const [answers, setAnswers] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`edubank_attempt_${attemptId}`)) || {}; } catch { return {}; }
  });
  const [marked, setMarked] = useState({});
  const [current, setCurrent] = useState(0);
  const [remaining, setRemaining] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  // Nếu F5 trang, tải lại phiên làm bài từ server
  useEffect(() => {
    if (session) return;
    client.get('/attempts', { params: { id: attemptId } })
      .then(({ data }) => {
        const a = data.data;
        if (a.status !== 'in_progress') return navigate(`/hs/ket-qua/${attemptId}`, { replace: true });
        setSession({
          attemptId: a._id, startedAt: a.startedAt, duration: a.examId.duration,
          examTitle: a.examId.title, questions: a.examId.questionIds
        });
      })
      .catch(e => { enqueueSnackbar(apiMsg(e), { variant: 'error' }); navigate('/hs'); });
  }, []);

  // Đồng hồ đếm ngược dựa trên startedAt từ server (không gian lận được bằng F5)
  useEffect(() => {
    if (!session) return;
    const end = new Date(session.startedAt).getTime() + session.duration * 60000;
    const tick = () => {
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !submittedRef.current) submit(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session]);

  // Autosave: localStorage tức thì + server mỗi 20 giây
  useEffect(() => {
    localStorage.setItem(`edubank_attempt_${attemptId}`, JSON.stringify(answers));
  }, [answers, attemptId]);

  const toPayload = useCallback(() => Object.entries(answers).map(([questionId, selected]) => ({ questionId, selected })), [answers]);

  useEffect(() => {
    const t = setInterval(() => {
      if (Object.keys(answers).length && !submittedRef.current) {
        client.put(`/attempts?id=${attemptId}`, { action: 'save', answers: toPayload() }).catch(() => {});
      }
    }, 20000);
    return () => clearInterval(t);
  }, [answers, attemptId, toPayload]);

  const submit = async (auto = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await client.put(`/attempts?id=${attemptId}`, { action: 'submit', answers: toPayload() });
      localStorage.removeItem(`edubank_attempt_${attemptId}`);
      if (auto) enqueueSnackbar('Hết giờ — bài đã được nộp tự động', { variant: 'info' });
      navigate(`/hs/ket-qua/${attemptId}`, { replace: true });
    } catch (e) {
      submittedRef.current = false;
      enqueueSnackbar(apiMsg(e), { variant: 'error' });
    } finally { setSubmitting(false); }
  };

  if (!session) return <LinearProgress />;

  const qs = session.questions;
  const q = qs[current];
  const answeredCount = Object.keys(answers).filter(k => answers[k] != null && answers[k] !== '' && !(Array.isArray(answers[k]) && !answers[k].length)).length;
  const mm = String(Math.floor((remaining ?? 0) / 60)).padStart(2, '0');
  const ss = String((remaining ?? 0) % 60).padStart(2, '0');
  const low = remaining != null && remaining < 300;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: { xs: 1.5, md: 3 } }}>
      {/* Thanh trên: tiêu đề + đồng hồ */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography fontWeight={700} noWrap>{session.examTitle}</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Đã làm {answeredCount}/{qs.length}
              </Typography>
              <Chip
                icon={<FontAwesomeIcon icon={faClock} />}
                label={`${mm}:${ss}`}
                sx={{ fontWeight: 800, fontSize: 16, px: .5, bgcolor: low ? 'error.main' : 'primary.main', color: '#fff' }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Câu hỏi hiện tại */}
        <Grid item xs={12} md={8.5}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="flex-end">
                <Tooltip title={marked[q._id] ? 'Bỏ đánh dấu' : 'Đánh dấu xem lại'}>
                  <IconButton color={marked[q._id] ? 'warning' : 'default'}
                    onClick={() => setMarked({ ...marked, [q._id]: !marked[q._id] })}>
                    <FontAwesomeIcon icon={faFlag} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <QuestionView
                q={q} index={current}
                selected={answers[q._id]}
                onSelect={(v) => setAnswers({ ...answers, [q._id]: v })}
              />
              <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
                <Button startIcon={<FontAwesomeIcon icon={faChevronLeft} />}
                  disabled={current === 0} onClick={() => setCurrent(current - 1)}>
                  Câu trước
                </Button>
                {current < qs.length - 1 ? (
                  <Button variant="contained" endIcon={<FontAwesomeIcon icon={faChevronRight} />}
                    onClick={() => setCurrent(current + 1)}>
                    Câu tiếp
                  </Button>
                ) : (
                  <Button variant="contained" color="success" endIcon={<FontAwesomeIcon icon={faPaperPlane} />}
                    onClick={() => setConfirmOpen(true)}>
                    Nộp bài
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Bảng số câu */}
        <Grid item xs={12} md={3.5}>
          <Card sx={{ position: { md: 'sticky' }, top: 16 }}>
            <CardContent>
              <Typography fontWeight={700} gutterBottom>Bảng câu hỏi</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: .8 }}>
                {qs.map((item, i) => {
                  const done = answers[item._id] != null && answers[item._id] !== '' && !(Array.isArray(answers[item._id]) && !answers[item._id].length);
                  return (
                    <Box key={item._id} onClick={() => setCurrent(i)}
                      sx={{
                        aspectRatio: '1', borderRadius: 2, display: 'grid', placeItems: 'center',
                        cursor: 'pointer', fontWeight: 700, fontSize: 13,
                        border: 2,
                        borderColor: i === current ? 'primary.main' : 'transparent',
                        bgcolor: marked[item._id] ? 'warning.main' : done ? 'success.main' : 'action.hover',
                        color: (marked[item._id] || done) ? '#fff' : 'text.primary',
                        transition: 'all .15s'
                      }}>
                      {i + 1}
                    </Box>
                  );
                })}
              </Box>
              <Stack spacing={.5} sx={{ mt: 2 }}>
                <Typography variant="caption"><Box component="span" sx={{ display: 'inline-block', width: 12, height: 12, bgcolor: 'success.main', borderRadius: .5, mr: 1 }} />Đã trả lời</Typography>
                <Typography variant="caption"><Box component="span" sx={{ display: 'inline-block', width: 12, height: 12, bgcolor: 'warning.main', borderRadius: .5, mr: 1 }} />Đánh dấu xem lại</Typography>
              </Stack>
              <Button fullWidth variant="contained" sx={{ mt: 2, background: GRADIENT }}
                onClick={() => setConfirmOpen(true)}>
                Nộp bài
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Nộp bài thi?</DialogTitle>
        <DialogContent>
          <Typography>
            Bạn đã trả lời <b>{answeredCount}/{qs.length}</b> câu.
            {answeredCount < qs.length && ' Các câu chưa trả lời sẽ được tính là sai.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)}>Làm tiếp</Button>
          <Button variant="contained" color="success" disabled={submitting} onClick={() => submit(false)}>
            {submitting ? 'Đang nộp...' : 'Xác nhận nộp'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
