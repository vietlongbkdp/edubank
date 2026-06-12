// Kho câu hỏi: DataGrid + bộ lọc + thêm/sửa/xóa + nhập hàng loạt JSON
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Button, Card, Grid, MenuItem, TextField, Typography, Stack, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPenToSquare, faTrash, faFileImport, faEye, faRobot } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import client, { apiMsg } from '../../api/client';
import { SUBJECTS, GRADES, TOPICS, diffColor } from '../../utils/constants';
import QuestionForm from './QuestionForm';
import ImportAIDialog from './ImportAIDialog';
import QuestionView from '../../components/QuestionView';

export default function QuestionBank() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState({ page: 0, pageSize: 20 });
  const [filter, setFilter] = useState({ scope: 'mine', subject: '', grade: '', topic: '', difficulty: '', search: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filter, page: page.page + 1, limit: page.pageSize };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await client.get('/questions', { params });
      setRows(data.data.items.map(q => ({ ...q, id: q._id })));
      setTotal(data.data.total);
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
    finally { setLoading(false); }
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!confirm('Xóa câu hỏi này? Hành động không thể hoàn tác.')) return;
    try {
      await client.delete(`/questions?id=${id}`);
      enqueueSnackbar('Đã xóa câu hỏi', { variant: 'success' });
      load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const doImport = async () => {
    try {
      const questions = JSON.parse(importText);
      const { data } = await client.post('/questions-import', { questions });
      enqueueSnackbar(data.message, { variant: 'success' });
      setImportOpen(false); setImportText(''); load();
    } catch (e) {
      enqueueSnackbar(e instanceof SyntaxError ? 'JSON không hợp lệ' : apiMsg(e), { variant: 'error' });
    }
  };

  const columns = [
    { field: 'code', headerName: 'Mã', width: 130 },
    {
      field: 'content', headerName: 'Đề bài', flex: 1, minWidth: 220,
      renderCell: (p) => <Typography variant="body2" noWrap>{p.value}</Typography>
    },
    { field: 'subject', headerName: 'Môn', width: 90 },
    { field: 'topic', headerName: 'Chuyên đề', width: 150 },
    {
      field: 'difficulty', headerName: 'Độ khó', width: 95,
      renderCell: (p) => <Chip size="small" label={p.value} sx={{ bgcolor: diffColor(p.value), color: '#fff', fontWeight: 700 }} />
    },
    {
      field: 'stats', headerName: 'Tỉ lệ đúng', width: 100, sortable: false,
      renderCell: (p) => p.value?.timesAnswered
        ? `${Math.round((p.value.timesCorrect / p.value.timesAnswered) * 100)}%`
        : '—'
    },
    {
      field: 'isPublic', headerName: 'Kho chung', width: 100,
      renderCell: (p) => p.value ? <Chip size="small" color="success" label="Có" /> : <Chip size="small" label="Riêng" />
    },
    {
      field: 'actions', headerName: '', width: 130, sortable: false,
      renderCell: (p) => (
        <Stack direction="row">
          <Tooltip title="Xem"><IconButton size="small" onClick={() => setPreview(p.row)}><FontAwesomeIcon icon={faEye} /></IconButton></Tooltip>
          <Tooltip title="Sửa"><IconButton size="small" onClick={() => { setEditing(p.row); setFormOpen(true); }}><FontAwesomeIcon icon={faPenToSquare} /></IconButton></Tooltip>
          <Tooltip title="Xóa"><IconButton size="small" color="error" onClick={() => remove(p.row._id)}><FontAwesomeIcon icon={faTrash} /></IconButton></Tooltip>
        </Stack>
      )
    }
  ];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 2.5 }}>
        <Typography variant="h4">Kho câu hỏi</Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" color="secondary" startIcon={<FontAwesomeIcon icon={faRobot} />} onClick={() => setAiOpen(true)}>
            Nhập từ PDF/Ảnh (AI)
          </Button>
          <Button variant="outlined" startIcon={<FontAwesomeIcon icon={faFileImport} />} onClick={() => setImportOpen(true)}>
            Nhập JSON
          </Button>
          <Button variant="contained" startIcon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => { setEditing(null); setFormOpen(true); }}>
            Thêm câu hỏi
          </Button>
        </Stack>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={6} sm={2}>
            <TextField select label="Nguồn" fullWidth size="small" value={filter.scope}
              onChange={e => setFilter({ ...filter, scope: e.target.value })}>
              <MenuItem value="mine">Kho của tôi</MenuItem>
              <MenuItem value="public">Kho chung</MenuItem>
              <MenuItem value="all">Tất cả</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField select label="Môn" fullWidth size="small" value={filter.subject}
              onChange={e => setFilter({ ...filter, subject: e.target.value, topic: '' })}>
              <MenuItem value="">Tất cả</MenuItem>
              {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={1.5}>
            <TextField select label="Khối" fullWidth size="small" value={filter.grade}
              onChange={e => setFilter({ ...filter, grade: e.target.value })}>
              <MenuItem value="">Tất cả</MenuItem>
              {GRADES.map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField select label="Chuyên đề" fullWidth size="small" value={filter.topic}
              onChange={e => setFilter({ ...filter, topic: e.target.value })}>
              <MenuItem value="">Tất cả</MenuItem>
              {(TOPICS[filter.subject] || []).map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={1.5}>
            <TextField select label="Độ khó" fullWidth size="small" value={filter.difficulty}
              onChange={e => setFilter({ ...filter, difficulty: e.target.value })}>
              <MenuItem value="">Tất cả</MenuItem>
              {[...Array(10)].map((_, i) => <MenuItem key={i + 1} value={i + 1}>Mức {i + 1}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField label="Tìm kiếm nội dung..." fullWidth size="small" value={filter.search}
              onChange={e => setFilter({ ...filter, search: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && load()} />
          </Grid>
        </Grid>
      </Card>

      <Card>
        <DataGrid
          autoHeight rows={rows} columns={columns} loading={loading}
          rowCount={total} paginationMode="server"
          paginationModel={page} onPaginationModelChange={setPage}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          localeText={{ noRowsLabel: 'Chưa có câu hỏi nào — hãy thêm câu hỏi đầu tiên của bạn!' }}
        />
      </Card>

      <QuestionForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} onSaved={load} />
      <ImportAIDialog open={aiOpen} onClose={() => setAiOpen(false)} onSaved={load} />

      {/* Xem trước câu hỏi */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Xem câu hỏi {preview?.code}</DialogTitle>
        <DialogContent dividers>
          {preview && <QuestionView q={preview} index={0} readOnly showAnswer showDiff />}
        </DialogContent>
        <DialogActions><Button onClick={() => setPreview(null)}>Đóng</Button></DialogActions>
      </Dialog>

      {/* Nhập hàng loạt */}
      <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nhập hàng loạt câu hỏi (JSON)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Dán mảng JSON theo mẫu: {'[{"subject":"Toán","grade":"12","topic":"Hàm số","content":"...","options":[{"label":"A","text":"..."}],"correctAnswer":"A","difficulty":5}]'}
          </Typography>
          <TextField fullWidth multiline minRows={10} value={importText}
            onChange={e => setImportText(e.target.value)} placeholder="[ { ... }, { ... } ]" />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setImportOpen(false)}>Hủy</Button>
          <Button variant="contained" onClick={doImport} disabled={!importText.trim()}>Nhập</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
