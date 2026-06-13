// Admin: quản lý người dùng — sửa thông tin, đổi trạng thái, reset mật khẩu, xóa (đơn/nhiều)
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Stack, Alert, IconButton, Tooltip, Select
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faKey, faTrash, faCopy } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import client, { apiMsg } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const STATUS = {
  active: { label: 'Hoạt động', color: 'success' },
  deactive: { label: 'Tạm ngưng', color: 'warning' },
  blocked: { label: 'Đã khóa', color: 'error' }
};
const ROLE = { teacher: 'Giáo viên', student: 'Học sinh', admin: 'Admin' };

export default function AdminUsers() {
  const { enqueueSnackbar } = useSnackbar();
  const { user: me } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [edit, setEdit] = useState(null);          // user đang sửa
  const [resetResult, setResetResult] = useState(null); // {email, newPassword}

  const load = useCallback(() => {
    setLoading(true);
    client.get('/users', { params: { all: 1 } })
      .then(({ data }) => setRows(data.data.map(u => ({ ...u, id: u._id, status: u.status || (u.isLocked ? 'blocked' : 'active') }))))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  // Đổi nhanh trạng thái (active / deactive / blocked) cho bất kỳ user nào
  const changeStatus = async (u, status) => {
    if (status === u.status) return;
    try {
      await client.put(`/users?id=${u._id}`, { status });
      enqueueSnackbar(`Đã chuyển ${u.fullName} sang "${STATUS[status].label}"`, { variant: 'success' });
      load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const saveEdit = async () => {
    try {
      await client.put(`/users?id=${edit._id}`, {
        fullName: edit.fullName, email: edit.email, school: edit.school,
        grade: edit.grade, role: edit.role, status: edit.status
      });
      enqueueSnackbar('Đã cập nhật người dùng', { variant: 'success' });
      setEdit(null); load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const resetPassword = async (u) => {
    if (!confirm(`Reset mật khẩu cho ${u.email}? Hệ thống sẽ tạo mật khẩu mới 8 ký tự.`)) return;
    try {
      const { data } = await client.put(`/users?id=${u._id}&resetPassword=1`);
      setResetResult(data.data); // {email, newPassword}
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const delMany = async (ids) => {
    if (!ids.length) return;
    if (!confirm(`Xóa ${ids.length} người dùng đã chọn? Hành động không thể hoàn tác.`)) return;
    try {
      const { data } = await client.delete('/users', { data: { ids } });
      enqueueSnackbar(data.message, { variant: 'success' });
      setSelected([]); load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  const columns = [
    { field: 'fullName', headerName: 'Họ tên', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 190 },
    {
      field: 'role', headerName: 'Vai trò', width: 100,
      renderCell: p => <Chip size="small" label={ROLE[p.value] || p.value}
        color={p.value === 'teacher' ? 'primary' : p.value === 'admin' ? 'secondary' : 'default'} />
    },
    {
      field: 'examCount', headerName: 'Số đề', width: 80, align: 'center', headerAlign: 'center',
      renderCell: p => p.row.role === 'teacher' ? (p.value || 0) : '—'
    },
    {
      field: 'status', headerName: 'Trạng thái', width: 150,
      renderCell: p => {
        const isSelf = String(p.row._id) === String(me?._id);
        if (isSelf) { const s = STATUS[p.value] || STATUS.active; return <Chip size="small" color={s.color} label={s.label} />; }
        return (
          <Select size="small" variant="standard" disableUnderline value={p.value || 'active'}
            onChange={(e) => changeStatus(p.row, e.target.value)}
            renderValue={(v) => { const s = STATUS[v] || STATUS.active; return <Chip size="small" color={s.color} label={s.label} />; }}
            sx={{ '& .MuiSelect-select': { py: 0, display: 'flex', alignItems: 'center' } }}>
            {Object.entries(STATUS).map(([v, s]) => <MenuItem key={v} value={v}>{s.label}</MenuItem>)}
          </Select>
        );
      }
    },
    { field: 'createdAt', headerName: 'Ngày tạo', width: 110, valueFormatter: p => dayjs(p.value).format('DD/MM/YY') },
    {
      field: 'actions', headerName: 'Thao tác', width: 130, sortable: false, filterable: false,
      renderCell: p => (
        <Stack direction="row" spacing={.5}>
          <Tooltip title="Sửa thông tin"><IconButton size="small" onClick={() => setEdit({ ...p.row })}><FontAwesomeIcon icon={faPenToSquare} /></IconButton></Tooltip>
          <Tooltip title="Reset mật khẩu"><IconButton size="small" color="warning" onClick={() => resetPassword(p.row)}><FontAwesomeIcon icon={faKey} /></IconButton></Tooltip>
          {p.row.role !== 'admin' &&
            <Tooltip title="Xóa"><IconButton size="small" color="error" onClick={() => delMany([p.row._id])}><FontAwesomeIcon icon={faTrash} /></IconButton></Tooltip>}
        </Stack>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h4">Quản lý người dùng</Typography>
        {selected.length > 0 &&
          <Button variant="contained" color="error" startIcon={<FontAwesomeIcon icon={faTrash} />} onClick={() => delMany(selected)}>
            Xóa {selected.length} đã chọn
          </Button>}
      </Box>
      <Card>
        <DataGrid autoHeight rows={rows} columns={columns} loading={loading}
          checkboxSelection disableRowSelectionOnClick
          isRowSelectable={(p) => p.row.role !== 'admin'}
          onRowSelectionModelChange={setSelected} rowSelectionModel={selected}
          pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 25 } } }} />
      </Card>

      {/* Dialog sửa thông tin */}
      <Dialog open={!!edit} onClose={() => setEdit(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Sửa thông tin người dùng</DialogTitle>
        <DialogContent>
          {edit && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Họ tên" fullWidth value={edit.fullName || ''} onChange={e => setEdit({ ...edit, fullName: e.target.value })} />
              <TextField label="Email" fullWidth value={edit.email || ''} onChange={e => setEdit({ ...edit, email: e.target.value })} />
              <TextField label="Trường" fullWidth value={edit.school || ''} onChange={e => setEdit({ ...edit, school: e.target.value })} />
              <Stack direction="row" spacing={2}>
                <TextField select label="Vai trò" fullWidth value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })}>
                  {Object.entries(ROLE).map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                </TextField>
                <TextField select label="Trạng thái" fullWidth value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}>
                  {Object.entries(STATUS).map(([v, s]) => <MenuItem key={v} value={v}>{s.label}</MenuItem>)}
                </TextField>
              </Stack>
              {edit.teacherCode && <Typography variant="caption" color="text.secondary">Mã GV: {edit.teacherCode}</Typography>}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEdit(null)}>Hủy</Button>
          <Button variant="contained" onClick={saveEdit}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog hiện mật khẩu mới sau reset */}
      <Dialog open={!!resetResult} onClose={() => setResetResult(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Mật khẩu mới đã được tạo</DialogTitle>
        <DialogContent>
          {resetResult && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">Tài khoản: <b>{resetResult.email}</b></Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: 1.5, bgcolor: 'action.hover' }}>
                <Typography variant="h6" sx={{ fontFamily: 'monospace', letterSpacing: 1, flex: 1 }}>{resetResult.newPassword}</Typography>
                <IconButton onClick={() => { navigator.clipboard?.writeText(resetResult.newPassword); enqueueSnackbar('Đã sao chép', { variant: 'success' }); }}>
                  <FontAwesomeIcon icon={faCopy} />
                </IconButton>
              </Box>
              <Alert severity="info">
                Hãy cung cấp mật khẩu này cho người dùng. Khi đăng nhập lại, họ <b>bắt buộc phải đổi sang mật khẩu mới</b> trước khi sử dụng hệ thống.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setResetResult(null)}>Đã hiểu</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
