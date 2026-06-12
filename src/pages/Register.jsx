import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Stack, Alert,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardUser, faUserGraduate } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { apiMsg } from '../api/client';
import { GRADIENT } from '../theme';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    role: params.get('role') === 'teacher' ? 'teacher' : 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'teacher' ? '/gv' : '/hs');
    } catch (err) {
      setError(apiMsg(err, 'Đăng ký thất bại'));
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: GRADIENT, p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 460, borderRadius: 5 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" textAlign="center" gutterBottom>Tạo tài khoản EduBank</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={submit}>
            <Stack spacing={2}>
              <ToggleButtonGroup
                exclusive fullWidth value={form.role}
                onChange={(_, v) => v && setForm({ ...form, role: v })}
              >
                <ToggleButton value="teacher" sx={{ gap: 1, borderRadius: 3 }}>
                  <FontAwesomeIcon icon={faChalkboardUser} /> Giáo viên
                </ToggleButton>
                <ToggleButton value="student" sx={{ gap: 1, borderRadius: 3 }}>
                  <FontAwesomeIcon icon={faUserGraduate} /> Học sinh
                </ToggleButton>
              </ToggleButtonGroup>
              <TextField label="Họ và tên" required fullWidth
                value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <TextField label="Email" type="email" required fullWidth
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <TextField label="Mật khẩu (tối thiểu 6 ký tự)" type="password" required fullWidth
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <Button type="submit" variant="contained" size="large" disabled={loading}
                sx={{ background: GRADIENT, py: 1.3 }}>
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              </Button>
            </Stack>
          </form>
          <Typography variant="body2" textAlign="center" sx={{ mt: 2.5 }}>
            Đã có tài khoản? <Link to="/dang-nhap" style={{ color: '#4F46E5', fontWeight: 600 }}>Đăng nhập</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
