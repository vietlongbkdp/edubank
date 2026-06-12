// Dialog thêm / sửa câu hỏi: editor LaTeX preview live, upload nhiều ảnh, slider độ khó 1-10
import { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField,
  MenuItem, Slider, Stack, Typography, Box, IconButton, Switch, FormControlLabel, Chip
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faXmark, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import client, { apiMsg, uploadImage } from '../../api/client';
import { SUBJECTS, GRADES, TOPICS, QUESTION_TYPES, COGNITIVE_LEVELS, diffColor, diffLabel } from '../../utils/constants';
import Latex from '../../components/Latex';

const EMPTY = {
  subject: 'Toán', grade: '12', topic: '', subTopic: '', type: 'single_choice',
  content: '', images: [], options: [
    { label: 'A', text: '' }, { label: 'B', text: '' }, { label: 'C', text: '' }, { label: 'D', text: '' }
  ],
  correctAnswer: 'A', solution: '', solutionImages: [], difficulty: 5,
  cognitiveLevel: 'thong_hieu', tags: [], source: '', estimatedTime: 90, isPublic: true
};

export default function QuestionForm({ open, onClose, editing, onSaved }) {
  const { enqueueSnackbar } = useSnackbar();
  const [q, setQ] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef(); const solImgRef = useRef();

  useEffect(() => {
    if (open) setQ(editing ? { ...EMPTY, ...editing } : EMPTY);
  }, [open, editing]);

  const set = (k, v) => setQ(prev => ({ ...prev, [k]: v }));
  const setOption = (i, text) => {
    const options = [...q.options]; options[i] = { ...options[i], text };
    set('options', options);
  };

  const addImage = async (file, field) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      set(field, [...(q[field] || []), url]);
    } catch { enqueueSnackbar('Upload ảnh thất bại', { variant: 'error' }); }
    finally { setBusy(false); }
  };

  const save = async () => {
    if (!q.content.trim()) return enqueueSnackbar('Chưa nhập đề bài', { variant: 'warning' });
    setBusy(true);
    try {
      if (editing?._id) await client.put(`/questions?id=${editing._id}`, q);
      else await client.post('/questions', q);
      enqueueSnackbar(editing ? 'Đã cập nhật câu hỏi' : 'Đã thêm câu hỏi', { variant: 'success' });
      onSaved(); onClose();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
    finally { setBusy(false); }
  };

  const hasOptions = ['single_choice', 'multi_choice', 'true_false'].includes(q.type);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editing ? 'Sửa câu hỏi' : 'Thêm câu hỏi mới'}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <TextField select label="Môn học" fullWidth size="small" value={q.subject}
              onChange={e => setQ({ ...q, subject: e.target.value, topic: '' })}>
              {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField select label="Khối" fullWidth size="small" value={q.grade}
              onChange={e => set('grade', e.target.value)}>
              {GRADES.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={4}>
            <TextField select label="Chuyên đề" fullWidth size="small" value={q.topic}
              onChange={e => set('topic', e.target.value)}>
              {(TOPICS[q.subject] || []).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField select label="Loại câu hỏi" fullWidth size="small" value={q.type}
              onChange={e => set('type', e.target.value)}>
              {QUESTION_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Đề bài (hỗ trợ LaTeX: $x^2$, $$\\int_0^1 ...$$)" fullWidth multiline minRows={4}
              value={q.content} onChange={e => set('content', e.target.value)}
            />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Button size="small" startIcon={<FontAwesomeIcon icon={faImage} />}
                onClick={() => imgRef.current.click()} disabled={busy}>Thêm ảnh đề bài</Button>
              <input ref={imgRef} type="file" accept="image/*" hidden onChange={e => addImage(e.target.files[0], 'images')} />
              {q.images?.map((src, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <Box component="img" src={src} sx={{ height: 48, borderRadius: 1 }} />
                  <IconButton size="small" sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                    onClick={() => set('images', q.images.filter((_, j) => j !== i))}>
                    <FontAwesomeIcon icon={faXmark} size="xs" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">Xem trước:</Typography>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', minHeight: 100 }}>
              <Latex>{q.content || 'Nhập đề bài để xem trước công thức...'}</Latex>
            </Box>
          </Grid>

          {hasOptions && q.options.map((op, i) => (
            <Grid item xs={12} sm={6} key={op.label}>
              <TextField label={`Phương án ${op.label}`} fullWidth size="small"
                value={op.text} onChange={e => setOption(i, e.target.value)} />
            </Grid>
          ))}

          <Grid item xs={12} sm={4}>
            {q.type === 'multi_choice' ? (
              <TextField select SelectProps={{ multiple: true }} label="Đáp án đúng" fullWidth size="small"
                value={Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer].filter(Boolean)}
                onChange={e => set('correctAnswer', e.target.value)}>
                {q.options.map(o => <MenuItem key={o.label} value={o.label}>{o.label}</MenuItem>)}
              </TextField>
            ) : hasOptions ? (
              <TextField select label="Đáp án đúng" fullWidth size="small"
                value={q.correctAnswer || ''} onChange={e => set('correctAnswer', e.target.value)}>
                {q.options.map(o => <MenuItem key={o.label} value={o.label}>{o.label}</MenuItem>)}
              </TextField>
            ) : (
              <TextField label="Đáp án đúng" fullWidth size="small"
                value={q.correctAnswer || ''} onChange={e => set('correctAnswer', e.target.value)} />
            )}
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Mức nhận thức" fullWidth size="small" value={q.cognitiveLevel}
              onChange={e => set('cognitiveLevel', e.target.value)}>
              {COGNITIVE_LEVELS.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Nguồn (vd: THPT QG 2018 - Mã 101 - Câu 5)" fullWidth size="small"
              value={q.source} onChange={e => set('source', e.target.value)} />
          </Grid>

          <Grid item xs={12}>
            <Typography gutterBottom>
              Độ khó: <Chip size="small" label={`${q.difficulty} — ${diffLabel(q.difficulty)}`}
                sx={{ bgcolor: diffColor(q.difficulty), color: '#fff' }} />
            </Typography>
            <Slider min={1} max={10} step={1} marks value={q.difficulty}
              onChange={(_, v) => set('difficulty', v)}
              sx={{ color: diffColor(q.difficulty), maxWidth: 480 }} />
          </Grid>

          <Grid item xs={12}>
            <TextField label="Lời giải chi tiết (hỗ trợ LaTeX)" fullWidth multiline minRows={3}
              value={q.solution} onChange={e => set('solution', e.target.value)} />
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, flexWrap: 'wrap' }}>
              <Button size="small" startIcon={<FontAwesomeIcon icon={faPlus} />}
                onClick={() => solImgRef.current.click()} disabled={busy}>Ảnh lời giải</Button>
              <input ref={solImgRef} type="file" accept="image/*" hidden onChange={e => addImage(e.target.files[0], 'solutionImages')} />
              {q.solutionImages?.map((src, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <Box component="img" src={src} sx={{ height: 48, borderRadius: 1 }} />
                  <IconButton size="small" sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
                    onClick={() => set('solutionImages', q.solutionImages.filter((_, j) => j !== i))}>
                    <FontAwesomeIcon icon={faXmark} size="xs" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={<Switch checked={q.isPublic} onChange={e => set('isPublic', e.target.checked)} />}
              label="Chia sẻ vào kho chung (học sinh và giáo viên khác có thể dùng)"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={save} disabled={busy}>
          {busy ? 'Đang lưu...' : 'Lưu câu hỏi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
