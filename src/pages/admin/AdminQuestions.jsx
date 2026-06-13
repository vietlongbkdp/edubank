// Admin: quản lý toàn bộ câu hỏi — xem, xóa đơn/nhiều (checkbox). Thêm/sửa dùng Kho câu hỏi.
import { useState, useEffect, useCallback } from 'react';
import { Box, Card, Typography, Chip, Button, IconButton, Tooltip, Stack } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import client, { apiMsg } from '../../api/client';
import { diffLabel, diffColor } from '../../utils/constants';

export default function AdminQuestions() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    client.get('/questions', { params: { scope: 'all', limit: 1000 } })
      .then(({ data }) => setRows((data.data.items || []).map(q => ({ ...q, id: q._id }))))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const delMany = async (ids) => {
    if (!ids.length) return;
    if (!confirm(`Xóa ${ids.length} câu hỏi đã chọn? Hành động không thể hoàn tác.`)) return;
    try {
      const { data } = await client.delete('/questions', { data: { ids } });
      enqueueSnackbar(data.message, { variant: 'success' });
      setSelected([]); load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const columns = [
    { field: 'content', headerName: 'Nội dung', flex: 1, minWidth: 240,
      renderCell: p => <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(p.value || '').replace(/\$/g, '')}</span> },
    { field: 'subject', headerName: 'Môn', width: 90 },
    { field: 'grade', headerName: 'Khối', width: 70 },
    { field: 'topic', headerName: 'Chuyên đề', width: 150 },
    { field: 'difficulty', headerName: 'Độ khó', width: 110,
      renderCell: p => <Chip size="small" label={diffLabel(p.value)} sx={{ bgcolor: diffColor(p.value), color: '#fff' }} /> },
    { field: 'status', headerName: 'TT', width: 90,
      renderCell: p => p.value === 'reported' ? <Chip size="small" color="error" label="Báo cáo" /> : <Chip size="small" color="success" label="OK" /> },
    { field: 'actions', headerName: '', width: 60, sortable: false, filterable: false,
      renderCell: p => <Tooltip title="Xóa"><IconButton size="small" color="error" onClick={() => delMany([p.row._id])}><FontAwesomeIcon icon={faTrash} /></IconButton></Tooltip> }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Quản lý câu hỏi</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<FontAwesomeIcon icon={faPlus} />} onClick={() => navigate('/gv/kho-cau-hoi')}>
            Thêm / sửa
          </Button>
          {selected.length > 0 &&
            <Button variant="contained" color="error" startIcon={<FontAwesomeIcon icon={faTrash} />} onClick={() => delMany(selected)}>
              Xóa {selected.length} đã chọn
            </Button>}
        </Stack>
      </Box>
      <Card>
        <DataGrid autoHeight rows={rows} columns={columns} loading={loading}
          checkboxSelection disableRowSelectionOnClick
          onRowSelectionModelChange={setSelected} rowSelectionModel={selected}
          pageSizeOptions={[10, 25, 50, 100]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />
      </Card>
    </Box>
  );
}
