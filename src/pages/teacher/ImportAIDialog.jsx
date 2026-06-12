// Dialog nhập đề từ PDF/ảnh bằng AI: upload → AI trích xuất → xem trước/chọn → lưu vào kho
import { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Stack, Typography,
  Alert, Checkbox, MenuItem, TextField, Chip, LinearProgress, Grid
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faImage, faRobot, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import client, { apiMsg } from '../../api/client';
import { SUBJECTS, GRADES, diffColor } from '../../utils/constants';
import Latex from '../../components/Latex';

const MAX_MB = 3; // Vercel giới hạn body ~4.5MB, base64 phình ~33%

export default function ImportAIDialog({ open, onClose, onSaved }) {
  const { enqueueSnackbar } = useSnackbar();
  const fileRef = useRef();
  const [meta, setMeta] = useState({ subject: 'Toán', grade: '12' });
  const [phase, setPhase] = useState('pick');       // pick | parsing | review | saving
  const [questions, setQuestions] = useState([]);
  const [checked, setChecked] = useState({});
  const [fileName, setFileName] = useState('');

  const reset = () => { setPhase('pick'); setQuestions([]); setChecked({}); setFileName(''); };

  const pickFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024)
      return enqueueSnackbar(`File tối đa ${MAX_MB}MB — với PDF dài, hãy tách nhỏ (vd mỗi lần 2-3 trang) rồi nhập nhiều lần`, { variant: 'warning' });

    setFileName(file.name);
    setPhase('parsing');
    try {
      const fileBase64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const { data } = await client.post('/import-ai', {
        fileBase64, mediaType: file.type, ...meta
      }, { timeout: 120000 });
      const qs = data.data.questions;
      setQuestions(qs);
      setChecked(Object.fromEntries(qs.map((_, i) => [i, true])));
      setPhase('review');
      enqueueSnackbar(data.message, { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(apiMsg(e, 'Xử lý file thất bại'), { variant: 'error' });
      setPhase('pick');
    }
  };

  const save = async () => {
    const selected = questions.filter((_, i) => checked[i]);
    if (!selected.length) return enqueueSnackbar('Chưa chọn câu nào', { variant: 'warning' });
    setPhase('saving');
    try {
      const { data } = await client.post('/questions-import', {
        // Câu chưa rõ đáp án đúng → lưu dạng nháp để GV bổ sung sau
        questions: selected.map(({ hasImage, ...q }) => ({
          ...q,
          status: q.correctAnswer ? 'active' : 'draft'
        }))
      });
      enqueueSnackbar(data.message, { variant: 'success' });
      onSaved(); reset(); onClose();
    } catch (e) {
      enqueueSnackbar(apiMsg(e), { variant: 'error' });
      setPhase('review');
    }
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const missingAnswer = questions.filter((q, i) => checked[i] && !q.correctAnswer).length;

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} maxWidth="md" fullWidth>
      <DialogTitle>
        <FontAwesomeIcon icon={faRobot} /> Nhập đề từ PDF / Ảnh bằng AI
      </DialogTitle>
      <DialogContent dividers>
        {phase === 'pick' && (
          <Stack spacing={2.5}>
            <Alert severity="info">
              Upload file PDF hoặc ảnh chụp đề thi — AI sẽ tự đọc, chuyển công thức toán sang LaTeX
              và tách thành từng câu hỏi để bạn xem trước. File Word hãy lưu thành PDF trước (File → Save As → PDF).
            </Alert>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField select label="Môn học" fullWidth size="small" value={meta.subject}
                  onChange={e => setMeta({ ...meta, subject: e.target.value })}>
                  {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select label="Khối" fullWidth size="small" value={meta.grade}
                  onChange={e => setMeta({ ...meta, grade: e.target.value })}>
                  {GRADES.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <Box
              onClick={() => fileRef.current.click()}
              sx={{
                border: '2px dashed', borderColor: 'primary.main', borderRadius: 4,
                p: 5, textAlign: 'center', cursor: 'pointer',
                '&:hover': { bgcolor: 'primary.main', color: '#fff' }, transition: 'all .2s'
              }}>
              <Stack spacing={1} alignItems="center">
                <Stack direction="row" spacing={2} sx={{ fontSize: 36 }}>
                  <FontAwesomeIcon icon={faFilePdf} />
                  <FontAwesomeIcon icon={faImage} />
                </Stack>
                <Typography fontWeight={700}>Bấm để chọn file PDF hoặc ảnh (PNG/JPG)</Typography>
                <Typography variant="caption">Tối đa {MAX_MB}MB — PDF dài nên tách 2–3 trang mỗi lần</Typography>
              </Stack>
            </Box>
            <input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg" hidden
              onChange={e => pickFile(e.target.files[0])} />
          </Stack>
        )}

        {phase === 'parsing' && (
          <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
            <FontAwesomeIcon icon={faRobot} size="3x" color="#7C3AED" />
            <Typography fontWeight={700}>AI đang đọc "{fileName}"...</Typography>
            <Typography variant="body2" color="text.secondary">
              Chuyển công thức sang LaTeX và tách câu hỏi — thường mất 15–45 giây
            </Typography>
            <Box sx={{ width: '60%' }}><LinearProgress /></Box>
          </Stack>
        )}

        {(phase === 'review' || phase === 'saving') && (
          <Stack spacing={2}>
            <Alert severity={missingAnswer ? 'warning' : 'success'}>
              AI trích xuất được <b>{questions.length}</b> câu, đang chọn <b>{checkedCount}</b> câu.
              {missingAnswer > 0 && ` ${missingAnswer} câu chưa xác định được đáp án đúng — sẽ lưu dạng NHÁP, bạn vào sửa và bổ sung đáp án sau.`}
            </Alert>
            {questions.map((q, i) => (
              <Box key={i} sx={{
                p: 2, borderRadius: 3, border: 1,
                borderColor: checked[i] ? 'primary.main' : 'divider',
                opacity: checked[i] ? 1 : .55
              }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <Checkbox size="small" checked={!!checked[i]} sx={{ mt: -.5 }}
                    onChange={e => setChecked({ ...checked, [i]: e.target.checked })} />
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: .5, flexWrap: 'wrap' }}>
                      <Chip size="small" label={`Câu ${i + 1}`} />
                      {q.topic && <Chip size="small" variant="outlined" label={q.topic} />}
                      <Chip size="small" label={`Mức ${q.difficulty}`} sx={{ bgcolor: diffColor(q.difficulty), color: '#fff' }} />
                      {!q.correctAnswer && <Chip size="small" color="warning" icon={<FontAwesomeIcon icon={faTriangleExclamation} />} label="Thiếu đáp án" />}
                      {q.hasImage && <Chip size="small" color="info" label="Cần bổ sung hình vẽ" />}
                      {q.correctAnswer && <Chip size="small" color="success" label={`Đáp án: ${q.correctAnswer}`} />}
                    </Stack>
                    <Typography component="div" variant="body2"><Latex>{q.content}</Latex></Typography>
                    <Grid container spacing={.5} sx={{ mt: .5 }}>
                      {q.options?.map(op => (
                        <Grid item xs={12} sm={6} key={op.label}>
                          <Typography component="div" variant="body2" color="text.secondary">
                            <b>{op.label}.</b> <Latex>{op.text}</Latex>
                          </Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {phase === 'review' || phase === 'saving' ? (
          <>
            <Button onClick={reset}>← Chọn file khác</Button>
            <Box sx={{ flex: 1 }} />
            <Button onClick={() => { reset(); onClose(); }}>Hủy</Button>
            <Button variant="contained" onClick={save} disabled={phase === 'saving' || !checkedCount}>
              {phase === 'saving' ? 'Đang lưu...' : `Lưu ${checkedCount} câu vào kho`}
            </Button>
          </>
        ) : (
          <Button onClick={() => { reset(); onClose(); }}>Đóng</Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
