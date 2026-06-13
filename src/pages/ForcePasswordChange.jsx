import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, Stack } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import client, { apiMsg } from '../api/client';
import { GRADIENT } from '../theme';

// Trang buộc người dùng đổi mật khẩu mặc định (do admin cấp) trước khi dùng hệ thống
export default function ForcePasswordChange() {
  const { user, refreshUser, logout } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (form.newPassword.length < 6) return setError('Mật khẩu mới tối thiểu 6 ký tự');
    if (form.newPassword !== form.confirm) return setError('Xác nhận mật khẩu không khớp');
    setLoading(true);
    try {
      await client.put('/users', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      const fresh = await refreshUser();
      enqueueSnackbar('Đổi mật khẩu thành công!', { variant: 'success' });
      navigate(fresh.role === 'teacher' ? '/gv' : fresh.role === 'admin' ? '/admin' : '/hs');
    } catch (e) {
      setError(apiMsg(e, 'Đổi mật khẩu thất bại'));
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: GRADIENT, p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 440, borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: 2, background: GRADIENT, display: 'inline-grid', placeItems: 'center', color: '#fff', mb: 1 }}>
              <FontAwesomeIcon icon={faKey} size="lg" />
            </Box>
            <Typography variant="h6" fontWeight={800}>Đổi mật khẩu bắt buộc</Typography>
            <Typography variant="body2" color="text.secondary">
              Mật khẩu của bạn vừa được quản trị viên đặt lại. Hãy đổi sang mật khẩu mới để tiếp tục sử dụng.
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2}>
            <TextField label="Mật khẩu hiện tại (mật khẩu admin cấp)" type="password" fullWidth
              value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} />
            <TextField label="Mật khẩu mới" type="password" fullWidth
              value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
            <TextField label="Xác nhận mật khẩu mới" type="password" fullWidth
              value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && submit()} />
            <Button variant="contained" size="large" disabled={loading} onClick={submit}>
              {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </Button>
            <Button color="inherit" size="small" onClick={() => { logout(); navigate('/dang-nhap'); }}>
              Đăng xuất
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
