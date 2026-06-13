// Admin: quản lý toàn bộ bộ đề — xem, xóa đơn/nhiều (checkbox)
import { useState, useEffect, useCallback } from 'react';
import { Box, Card, Typography, Chip, Button, IconButton, Tooltip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import client, { apiMsg } from '../../api/client';

export default function AdminExams() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    client.get('/exams', { params: { scope: 'all' } })
      .then(({ data }) => setRows((data.data || []).map(x => ({
        ...x, id: x._id,
        author: x.createdBy?.fullName || '—',
        qcount: x.questionIds?.length || 0
      }))))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const delMany = async (ids) => {
    if (!ids.length) return;
    if (!confirm(`Xóa ${ids.length} bộ đề đã chọn? Hành động không thể hoàn tác.`)) return;
    try {
      const { data } = await client.delete('/exams', { data: { ids } });
      enqueueSnackbar(data.message, { variant: 'success' });
      setSelected([]); load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const columns = [
    { field: 'code', headerName: 'Mã', width: 90 },
    { field: 'title', headerName: 'Tiêu đề', flex: 1, minWidth: 200 },
    { field: 'subject', headerName: 'Môn', width: 90 },
    { field: 'grade', headerName: 'Khối', width: 70 },
    { field: 'qcount', headerName: 'Số câu', width: 80, align: 'center', headerAlign: 'center' },
    { field: 'author', headerName: 'Người tạo', width: 150 },
    { field: 'visibility', headerName: 'Chia sẻ', width: 100,
      renderCell: p => <Chip size="small" color={p.value === 'public' ? 'success' : 'default'} label={p.value === 'public' ? 'Công khai' : 'Riêng tư'} /> },
    { field: 'createdAt', headerName: 'Ngày tạo', width: 110, valueFormatter: p => dayjs(p.value).format('DD/MM/YY') },
    { field: 'actions', headerName: '', width: 60, sortable: false, filterable: false,
      renderCell: p => <Tooltip title="Xóa"><IconButton size="small" color="error" onClick={() => delMany([p.row._id])}><FontAwesomeIcon icon={faTrash} /></IconButton></Tooltip> }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Quản lý bộ đề</Typography>
        {selected.length > 0 &&
          <Button variant="contained" color="error" startIcon={<FontAwesomeIcon icon={faTrash} />} onClick={() => delMany(selected)}>
            Xóa {selected.length} đã chọn
          </Button>}
      </Box>
      <Card>
        <DataGrid autoHeight rows={rows} columns={columns} loading={loading}
          checkboxSelection disableRowSelectionOnClick
          onRowSelectionModelChange={setSelected} rowSelectionModel={selected}
          pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />
      </Card>
    </Box>
  );
}
