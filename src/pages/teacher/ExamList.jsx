// Danh sách đề thi đã lưu của giáo viên: xem chi tiết, xuất file, xóa
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Stack, Button, IconButton, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem, TextField,
  FormControlLabel, Switch
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileWord, faFilePdf, faTrash, faEye, faClock, faListOl, faLock, faShareNodes, faSquareCheck } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import client, { apiMsg } from '../../api/client';
import QuestionView from '../../components/QuestionView';
import { makeVariants, exportWord, exportPdfExam, exportPdfAnswers } from '../../utils/exportExam';

export default function ExamList() {
  const { enqueueSnackbar } = useSnackbar();
  const [exams, setExams] = useState([]);
  const [detail, setDetail] = useState(null);
  const [shareEdit, setShareEdit] = useState(null); // { exam, shared, password }
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

  const saveShare = async () => {
    try {
      await client.put(`/exams?id=${shareEdit.exam._id}`, {
        visibility: shareEdit.shared ? 'public' : 'private',
        accessPassword: shareEdit.shared ? shareEdit.password.trim() : ''
      });
      enqueueSnackbar('Đã cập nhật chia sẻ đề', { variant: 'success' });
      setShareEdit(null); load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const doExport = async (exam, kind) => {
    // PDF: mở cửa sổ NGAY khi bấm (trước await) để không bị Safari/iOS chặn popup
    const win = kind.startsWith('pdf') ? window.open('', '_blank') : null;
    try {
      const { data } = await client.get('/exams', { params: { id: exam._id, full: 1 } });
      const full = data.data;
      const variants = makeVariants(full.questionIds, Number(variantCount) || 1,
        { shuffleQuestions: variantCount > 1, shuffleOptions: variantCount > 1 });
      if (kind === 'word') await exportWord(full, variants);          // tải 2 file: đề + đáp án
      else if (kind === 'pdf-exam') exportPdfExam(full, variants, win);
      else exportPdfAnswers(full, variants, win);
    } catch (e) {
      if (win && !win.closed) win.close();
      enqueueSnackbar(e.message === 'POPUP_BLOCKED'
        ? 'Trình duyệt chặn cửa sổ mới — hãy cho phép popup cho trang này rồi thử lại'
        : apiMsg(e, 'Xuất file thất bại'), { variant: 'error' });
    }
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
                    <Stack direction="row" spacing={.5} flexWrap="wrap" useFlexGap>
                      <Chip size="small" color="primary" label={exam.code} />
                      {exam.visibility === 'public' && (
                        <Chip size="small" color="success" variant="outlined"
                          icon={<FontAwesomeIcon icon={exam.accessPassword ? faLock : faShareNodes} />}
                          label={exam.accessPassword ? 'Có khóa' : 'Đề mở'} />
                      )}
                    </Stack>
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
                    <Tooltip title="Tải Word (2 file: Đề + Đáp án)"><IconButton onClick={() => doExport(exam, 'word')}><FontAwesomeIcon icon={faFileWord} /></IconButton></Tooltip>
                    <Tooltip title="Xem PDF Đề bài"><IconButton onClick={() => doExport(exam, 'pdf-exam')}><FontAwesomeIcon icon={faFilePdf} /></IconButton></Tooltip>
                    <Tooltip title="Xem PDF Đáp án & lời giải"><IconButton color="success" onClick={() => doExport(exam, 'pdf-answers')}><FontAwesomeIcon icon={faSquareCheck} /></IconButton></Tooltip>
                    <Tooltip title="Chia sẻ & khóa đề">
                      <IconButton color={exam.visibility === 'public' ? 'success' : 'default'}
                        onClick={() => setShareEdit({ exam, shared: exam.visibility === 'public', password: exam.accessPassword || '' })}>
                        <FontAwesomeIcon icon={faShareNodes} />
                      </IconButton>
                    </Tooltip>
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

      {/* Chỉnh chia sẻ + mã khóa đề */}
      <Dialog open={!!shareEdit} onClose={() => setShareEdit(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Chia sẻ đề cho học sinh</DialogTitle>
        <DialogContent dividers>
          {shareEdit && (
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={shareEdit.shared}
                  onChange={e => setShareEdit({ ...shareEdit, shared: e.target.checked })} />}
                label="Hiện đề này khi học sinh nhập mã GV của tôi" />
              {shareEdit.shared && (
                <TextField label="Mã khóa đề" size="small" fullWidth
                  value={shareEdit.password}
                  onChange={e => setShareEdit({ ...shareEdit, password: e.target.value })}
                  helperText="Để trống = đề mở, học sinh nào cũng làm được. Có mã = chỉ học sinh được bạn cung cấp mã mới làm được." />
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShareEdit(null)}>Hủy</Button>
          <Button variant="contained" onClick={saveShare}>Lưu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
