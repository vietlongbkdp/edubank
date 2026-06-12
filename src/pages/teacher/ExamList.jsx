// Danh sách đề thi đã lưu của giáo viên: xem chi tiết, xuất file, xóa
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Button, IconButton, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, TextField
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWord, faFilePdf, faTrash, faEye, faClock, faListOl } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import client, { apiMsg } from '../../api/client';
import QuestionView from '../../components/QuestionView';
import { makeVariants, exportWord, exportPdf } from '../../utils/exportExam';

export default function ExamList() {
  const { enqueueSnackbar } = useSnackbar();
  const [exams, setExams] = useState([]);
  const [detail, setDetail] = useState(null);
  const [variantCount, setVariantCount] = useState(1);

  const load = useCallback(async () => {
    try {
      const { data } = await client.get('/exams');
      setExams(data.data);
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    try {
      const { data } = await client.get('/exams', { params: { id, full: 1 } });
      setDetail(data.data);
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const remove = async (id) => {
    if (!confirm('Xóa đề thi này?')) return;
    try {
      await client.delete(`/exams?id=${id}`);
      enqueueSnackbar('Đã xóa đề', { variant: 'success' });
      load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const doExport = async (exam, kind) => {
    try {
      const { data } = await client.get('/exams', { params: { id: exam._id, full: 1 } });
      const full = data.data;
      const variants = makeVariants(full.questionIds, Number(variantCount) || 1,
        { shuffleQuestions: variantCount > 1, shuffleOptions: variantCount > 1 });
      kind === 'word' ? exportWord(full, variants) : exportPdf(full, variants);
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2.5 }}>
        <Typography variant="h4">Đề thi của tôi</Typography>
        <TextField select size="small" label="Số mã đề khi xuất" sx={{ width: 200 }}
          value={variantCount} onChange={e => setVariantCount(e.target.value)}>
          {[1, 2, 3, 4].map(n => <MenuItem key={n} value={n}>{n} mã đề</MenuItem>)}
        </TextField>
      </Stack>

      {!exams.length ? (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Chưa có đề thi nào. Vào "Tạo đề tự động" để sinh đề đầu tiên của bạn.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {exams.map(exam => (
            <Grid item xs={12} sm={6} lg={4} key={exam._id}>
              <Card sx={{ height: '100%', '&:hover': { transform: 'translateY(-3px)' } }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Chip size="small" color="primary" label={exam.code} />
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(exam.createdAt).format('DD/MM/YYYY')}
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ mt: 1, minHeight: 56 }}>{exam.title}</Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: .5, color: 'text.secondary' }}>
                    <Typography variant="body2"><FontAwesomeIcon icon={faListOl} /> {exam.questionIds?.length} câu</Typography>
                    <Typography variant="body2"><FontAwesomeIcon icon={faClock} /> {exam.duration} phút</Typography>
                  </Stack>
                  <Stack direction="row" spacing={.5} sx={{ mt: 2 }}>
                    <Tooltip title="Xem đề"><IconButton onClick={() => openDetail(exam._id)}><FontAwesomeIcon icon={faEye} /></IconButton></Tooltip>
                    <Tooltip title="Tải Word"><IconButton onClick={() => doExport(exam, 'word')}><FontAwesomeIcon icon={faFileWord} /></IconButton></Tooltip>
                    <Tooltip title="Tải PDF"><IconButton onClick={() => doExport(exam, 'pdf')}><FontAwesomeIcon icon={faFilePdf} /></IconButton></Tooltip>
                    <Box sx={{ flex: 1 }} />
                    <Tooltip title="Xóa"><IconButton color="error" onClick={() => remove(exam._id)}><FontAwesomeIcon icon={faTrash} /></IconButton></Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle>{detail?.title} — {detail?.questionIds?.length} câu / {detail?.duration} phút</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {detail?.questionIds?.map((q, i) => (
              <QuestionView key={q._id} q={q} index={i} readOnly showAnswer showDiff />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>Đóng</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
