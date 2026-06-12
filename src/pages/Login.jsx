import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Stack, Alert } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { apiMsg } from '../api/client';
import { GRADIENT } from '../theme';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'teacher' ? '/gv' : user.role === 'admin' ? '/admin' : '/hs');
    } catch (err) {
      setError(apiMsg(err, 'Đăng nhập thất bại'));
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: GRADIENT, p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 5 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Box sx={{ width: 52, height: 52, borderRadius: 3, background: GRADIENT, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 24 }}>
              <FontAwesomeIcon icon={faGraduationCap} />
            </Box>
            <Typography variant="h5">Đăng nhập EduBank</Typography>
          </Stack>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={submit}>
            <Stack spacing={2}>
              <TextField label="Email" type="email" required fullWidth
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <TextField label="Mật khẩu" type="password" required fullWidth
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <Button type="submit" variant="contained" size="large" disabled={loading}
                sx={{ background: GRADIENT, py: 1.3 }}>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Stack>
          </form>
          <Typography variant="body2" textAlign="center" sx={{ mt: 2.5 }}>
            Chưa có tài khoản? <Link to="/dang-ky" style={{ color: '#4F46E5', fontWeight: 600 }}>Đăng ký ngay</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
