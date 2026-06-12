// Admin: danh sách người dùng, khóa / mở khóa tài khoản
import { useState, useEffect, useCallback } from 'react';
import { Box, Card, Typography, Chip, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import client, { apiMsg } from '../../api/client';

export default function AdminUsers() {
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    client.get('/users', { params: { all: 1 } })
      .then(({ data }) => setRows(data.data.map(u => ({ ...u, id: u._id }))))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggleLock = async (u) => {
    try {
      await client.put(`/users?id=${u._id}&lock=${u.isLocked ? 0 : 1}`);
      enqueueSnackbar(u.isLocked ? 'Đã mở khóa' : 'Đã khóa tài khoản', { variant: 'success' });
      load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const columns = [
    { field: 'fullName', headerName: 'Họ tên', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    {
      field: 'role', headerName: 'Vai trò', width: 110,
      renderCell: p => <Chip size="small" label={p.value === 'teacher' ? 'Giáo viên' : p.value === 'admin' ? 'Admin' : 'Học sinh'}
        color={p.value === 'teacher' ? 'primary' : p.value === 'admin' ? 'secondary' : 'default'} />
    },
    { field: 'createdAt', headerName: 'Ngày tạo', width: 120, valueFormatter: p => dayjs(p.value).format('DD/MM/YYYY') },
    {
      field: 'isLocked', headerName: 'Trạng thái', width: 110,
      renderCell: p => <Chip size="small" color={p.value ? 'error' : 'success'} label={p.value ? 'Đã khóa' : 'Hoạt động'} />
    },
    {
      field: 'actions', headerName: '', width: 120, sortable: false,
      renderCell: p => p.row.role !== 'admin' && (
        <Button size="small" color={p.row.isLocked ? 'success' : 'error'} onClick={() => toggleLock(p.row)}>
          {p.row.isLocked ? 'Mở khóa' : 'Khóa'}
        </Button>
      )
    }
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2.5 }}>Quản lý người dùng</Typography>
      <Card>
        <DataGrid autoHeight rows={rows} columns={columns} loading={loading}
          pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />
      </Card>
    </Box>
  );
}
