// Tạo đề tự động theo ma trận độ khó 1-10
import { useState } from 'react';
import {
  Box, Button, Card, CardContent, Grid, MenuItem, TextField, Typography, Stack,
  Alert, Chip, Divider, IconButton, Tooltip, FormControlLabel, Checkbox
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles, faFloppyDisk, faFileWord, faFilePdf, faRotate } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import client, { apiMsg } from '../../api/client';
import { SUBJECTS, GRADES, TOPICS, diffColor, diffLabel } from '../../utils/constants';
import QuestionView from '../../components/QuestionView';
import { makeVariants, exportWordExam, exportWordAnswers, exportPdfExam, exportPdfAnswers } from '../../utils/exportExam';
import RichTextEditor from '../../components/RichTextEditor';
import { GRADIENT } from '../../theme';

export default function ExamGenerator() {
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState({ subject: 'Toán', grade: '12', topics: [] });
  const [source, setSource] = useState('both');
  const [matrix, setMatrix] = useState(Object.fromEntries([...Array(10)].map((_, i) => [i + 1, 0])));
  const DEFAULT_HEADER = '<div style="text-align:center"><b>SỞ GIÁO DỤC VÀ ĐÀO TẠO ..........</b></div><div style="text-align:center"><b>TRƯỜNG THPT ..........</b></div><div style="text-align:center"><br></div>';
  const [meta, setMeta] = useState({ title: '', duration: 90, variantCount: 1, shared: true, accessPassword: '', header: DEFAULT_HEADER });
  const [fillNearby, setFillNearby] = useState(true);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const totalCount = Object.values(matrix).reduce((s, x) => s + Number(x || 0), 0);

  const generate = async () => {
    const m = Object.entries(matrix).filter(([, c]) => Number(c) > 0)
      .map(([difficulty, count]) => ({ difficulty: Number(difficulty), count: Number(count) }));
    if (!m.length) return enqueueSnackbar('Hãy nhập số câu cho ít nhất một mốc độ khó', { variant: 'warning' });
    setBusy(true);
    try {
      const { data } = await client.post('/exams-generate', { matrix: m, filters, source, fillNearby, save: false });
      setResult({ ...data.data, saved: null });
      if (data.data.shortages?.length) {
        enqueueSnackbar('Một số mốc độ khó không đủ câu hỏi trong kho', { variant: 'warning' });
      } else {
        enqueueSnackbar(`Đã sinh đề với ${data.data.questions.length} câu`, { variant: 'success' });
      }
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
    finally { setBusy(false); }
  };

  // Đổi 1 câu sang câu khác cùng độ khó
  const swapQuestion = async (index) => {
    const q = result.questions[index];
    try {
      const { data } = await client.post('/exams-generate', {
        matrix: [{ difficulty: q.difficulty, count: 1 }],
        filters, source, save: false
      });
      const candidates = data.data.questions.filter(c => !result.questions.some(x => x._id === c._id));
      if (!candidates.length) return enqueueSnackbar('Không còn câu khác cùng độ khó trong kho', { variant: 'info' });
      const next = [...result.questions]; next[index] = candidates[0];
      setResult({ ...result, questions: next, saved: null });
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const saveExam = async () => {
    setBusy(true);
    try {
      const { data } = await client.post('/exams', {
        title: meta.title || `Đề ${filters.subject} khối ${filters.grade} — ${new Date().toLocaleDateString('vi-VN')}`,
        subject: filters.subject, grade: filters.grade, duration: Number(meta.duration),
        questionIds: result.questions.map(q => q._id),
        matrix: Object.entries(matrix).filter(([, c]) => c > 0).map(([d, c]) => ({ difficulty: +d, count: +c })),
        // Chia sẻ qua mã GV + mã khóa đề (rỗng = đề mở)
        visibility: meta.shared ? 'public' : 'private',
        accessPassword: meta.shared ? meta.accessPassword.trim() : '',
        header: meta.header
      });
      setResult({ ...result, saved: data.data });
      enqueueSnackbar('Đã lưu đề vào "Đề thi của tôi"', { variant: 'success' });
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
    finally { setBusy(false); }
  };

  const examMeta = {
    title: meta.title || `Đề ${filters.subject} khối ${filters.grade}`,
    duration: Number(meta.duration),
    header: meta.header
  };
  const getVariants = () => makeVariants(result.questions, Number(meta.variantCount) || 1,
    { shuffleQuestions: meta.variantCount > 1, shuffleOptions: meta.variantCount > 1 });

  const doExport = (kind) => {
    try {
      const variants = getVariants();
      // Word: tải file .docx về máy
      if (kind === 'word-exam') return exportWordExam(examMeta, variants);
      if (kind === 'word-answers') return exportWordAnswers(examMeta, variants);
      // PDF: mở trang xem trước (tab mới nếu được, không thì cùng tab)
      if (kind === 'pdf-exam') exportPdfExam(examMeta, variants);
      else exportPdfAnswers(examMeta, variants);
    } catch (e) {
      console.error(e);
      enqueueSnackbar('Xuất file thất bại', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2.5 }}>Tạo đề tự động</Typography>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>1. Phạm vi đề</Typography>
              <Stack spacing={2}>
                <TextField select label="Môn học" size="small" value={filters.subject}
                  onChange={e => setFilters({ ...filters, subject: e.target.value, topics: [] })}>
                  {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField select label="Khối" size="small" value={filters.grade}
                  onChange={e => setFilters({ ...filters, grade: e.target.value })}>
                  {GRADES.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
                <TextField select SelectProps={{ multiple: true }} label="Giới hạn chuyên đề (tùy chọn)" size="small"
                  value={filters.topics} onChange={e => setFilters({ ...filters, topics: e.target.value })}>
                  {(TOPICS[filters.subject] || []).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField select label="Nguồn câu hỏi" size="small" value={source}
                  onChange={e => setSource(e.target.value)}>
                  <MenuItem value="mine">Chỉ kho của tôi</MenuItem>
                  <MenuItem value="public">Kho chung</MenuItem>
                  <MenuItem value="both">Cả hai</MenuItem>
                </TextField>
              </Stack>

              <Divider sx={{ my: 2.5 }} />
              <Typography variant="h6" gutterBottom>2. Ma trận độ khó</Typography>
              <Stack spacing={1}>
                {[...Array(10)].map((_, i) => {
                  const d = i + 1;
                  return (
                    <Stack key={d} direction="row" spacing={1.5} alignItems="center">
                      <Chip size="small" label={`Mức ${d}`} sx={{ bgcolor: diffColor(d), color: '#fff', width: 72 }} />
                      <Typography variant="caption" sx={{ width: 76 }} color="text.secondary">{diffLabel(d)}</Typography>
                      <TextField type="number" size="small" sx={{ width: 90 }}
                        inputProps={{ min: 0, max: 50 }}
                        value={matrix[d]} onChange={e => setMatrix({ ...matrix, [d]: e.target.value })} />
                      <Typography variant="caption" color="text.secondary">câu</Typography>
                    </Stack>
                  );
                })}
              </Stack>
              <FormControlLabel sx={{ mt: 1 }}
                control={<Checkbox checked={fillNearby} onChange={e => setFillNearby(e.target.checked)} />}
                label={<Typography variant="body2">Nếu thiếu, lấy bù từ mốc lân cận (±1)</Typography>} />

              <Divider sx={{ my: 2.5 }} />
              <Typography variant="h6" gutterBottom>3. Thông tin đề</Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" fontWeight={700} gutterBottom>Đầu đề bài (Sở GD, Trường, Môn, Năm học, Mã đề...)</Typography>
                  <RichTextEditor
                    value={meta.header}
                    onChange={(html) => setMeta(m => ({ ...m, header: html }))}
                    placeholder="Soạn phần đầu trang của đề thi tại đây..."
                    minHeight={90}
                  />
                </Box>
                <TextField label="Tiêu đề đề thi" size="small" value={meta.title}
                  placeholder={`Đề ${filters.subject} khối ${filters.grade}`}
                  onChange={e => setMeta({ ...meta, title: e.target.value })} />
                <TextField label="Thời gian (phút)" size="small" type="number" value={meta.duration}
                  onChange={e => setMeta({ ...meta, duration: e.target.value })} />
                <TextField select label="Số mã đề khi xuất file" size="small" value={meta.variantCount}
                  onChange={e => setMeta({ ...meta, variantCount: e.target.value })}>
                  {[1, 2, 3, 4].map(n => <MenuItem key={n} value={n}>{n} mã đề {n > 1 ? `(101–${100 + n})` : '(101)'}</MenuItem>)}
                </TextField>
                <FormControlLabel
                  control={<Checkbox checked={meta.shared} onChange={e => setMeta({ ...meta, shared: e.target.checked })} />}
                  label={<Typography variant="body2">Cho học sinh luyện tập (hiện trong mã GV của tôi)</Typography>} />
                {meta.shared && (
                  <TextField label="Mã khóa đề (để trống = đề mở, ai cũng làm được)" size="small"
                    value={meta.accessPassword}
                    onChange={e => setMeta({ ...meta, accessPassword: e.target.value })}
                    helperText="Chỉ học sinh có mã này mới làm được bài" />
                )}
              </Stack>

              <Button fullWidth variant="contained" size="large" sx={{ mt: 2.5, background: GRADIENT }}
                disabled={busy || !totalCount}
                startIcon={<FontAwesomeIcon icon={faWandMagicSparkles} />}
                onClick={generate}>
                {busy ? 'Đang sinh đề...' : `Tạo đề (${totalCount} câu)`}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {!result ? (
            <Card sx={{ height: '100%', display: 'grid', placeItems: 'center', minHeight: 360 }}>
              <Stack alignItems="center" spacing={1} sx={{ p: 4, textAlign: 'center' }}>
                <FontAwesomeIcon icon={faWandMagicSparkles} size="3x" color="#A5B4FC" />
                <Typography color="text.secondary">
                  Nhập ma trận độ khó bên trái và bấm "Tạo đề" — đề sẽ hiện ở đây để xem trước.
                </Typography>
              </Stack>
            </Card>
          ) : (
            <Box>
              {result.shortages?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Thiếu câu hỏi: {result.shortages.map(s => `mức ${s.difficulty} thiếu ${s.missing} câu`).join(', ')}.
                  Hãy thêm câu hỏi vào kho hoặc giảm số lượng yêu cầu.
                </Alert>
              )}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                    <Typography variant="h6">Xem trước đề — {result.questions.length} câu</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" startIcon={<FontAwesomeIcon icon={faFloppyDisk} />}
                        onClick={saveExam} disabled={busy || !!result.saved}>
                        {result.saved ? 'Đã lưu' : 'Lưu đề'}
                      </Button>
                      <Tooltip title="Tải file Word đề bài">
                        <Button variant="outlined" startIcon={<FontAwesomeIcon icon={faFileWord} />} onClick={() => doExport('word-exam')}>
                          Word đề
                        </Button>
                      </Tooltip>
                      <Tooltip title="Tải file Word đáp án & lời giải">
                        <Button variant="outlined" color="success" startIcon={<FontAwesomeIcon icon={faFileWord} />} onClick={() => doExport('word-answers')}>
                          Word đáp án
                        </Button>
                      </Tooltip>
                      <Tooltip title="Xem trước & in PDF đề bài">
                        <Button variant="outlined" startIcon={<FontAwesomeIcon icon={faFilePdf} />} onClick={() => doExport('pdf-exam')}>
                          PDF đề
                        </Button>
                      </Tooltip>
                      <Tooltip title="Xem trước & in PDF đáp án & lời giải">
                        <Button variant="outlined" color="success" startIcon={<FontAwesomeIcon icon={faFilePdf} />} onClick={() => doExport('pdf-answers')}>
                          PDF đáp án
                        </Button>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
              <Stack spacing={2}>
                {result.questions.map((q, i) => (
                  <Card key={q._id}>
                    <CardContent>
                      <Stack direction="row" justifyContent="flex-end" sx={{ float: 'right' }}>
                        <Tooltip title="Đổi câu khác cùng độ khó">
                          <IconButton size="small" onClick={() => swapQuestion(i)}>
                            <FontAwesomeIcon icon={faRotate} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                      <QuestionView q={q} index={i} readOnly showDiff showAnswer />
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
