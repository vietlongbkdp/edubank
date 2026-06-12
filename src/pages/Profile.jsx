import { useState, useRef } from 'react';
import {
  Box, Card, CardContent, Grid, TextField, Button, Typography, Stack, Avatar,
  MenuItem, Divider
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import client, { apiMsg, uploadImage } from '../api/client';
import { SUBJECTS, GRADES } from '../utils/constants';
import { GRADIENT } from '../theme';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const fileRef = useRef();
  const [form, setForm] = useState({
    fullName: user?.fullName || '', school: user?.school || '',
    grade: user?.grade || '', bio: user?.bio || '',
    subjectsTaught: user?.subjectsTaught || []
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const save = async (extra = {}) => {
    setBusy(true);
    try {
      const { data } = await client.put('/users', { ...form, ...extra });
      updateUser({ ...user, ...data.data });
      enqueueSnackbar('Đã cập nhật hồ sơ', { variant: 'success' });
      setPw({ currentPassword: '', newPassword: '' });
    } catch (e) {
      enqueueSnackbar(apiMsg(e), { variant: 'error' });
    } finally { setBusy(false); }
  };

  const changeAvatar = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadImage(file);
      await save({ avatarUrl: url });
    } catch (e) {
      enqueueSnackbar('Upload ảnh thất bại', { variant: 'error' });
      setBusy(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>Hồ sơ cá nhân</Typography>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2.5} alignItems="center" sx={{ mb: 3 }}>
            <Avatar src={user?.avatarUrl} sx={{ width: 84, height: 84, background: GRADIENT, fontSize: 32 }}>
              {user?.fullName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{user?.fullName}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email} · {user?.role === 'teacher' ? 'Giáo viên' : user?.role === 'admin' ? 'Quản trị' : 'Học sinh'}</Typography>
              <Button size="small" sx={{ mt: .5 }} onClick={() => fileRef.current.click()}>Đổi ảnh đại diện</Button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => changeAvatar(e.target.files[0])} />
            </Box>
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Họ và tên" fullWidth value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label={user?.role === 'teacher' ? 'Trường công tác' : 'Trường đang học'} fullWidth
                value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} />
            </Grid>
            {user?.role === 'teacher' ? (
              <Grid item xs={12} sm={6}>
                <TextField select SelectProps={{ multiple: true }} label="Môn giảng dạy" fullWidth
                  value={form.subjectsTaught}
                  onChange={e => setForm({ ...form, subjectsTaught: e.target.value })}>
                  {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            ) : (
              <Grid item xs={12} sm={6}>
                <TextField select label="Khối lớp" fullWidth value={form.grade}
                  onChange={e => setForm({ ...form, grade: e.target.value })}>
                  {GRADES.map(g => <MenuItem key={g} value={g}>Lớp {g}</MenuItem>)}
                </TextField>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField label="Giới thiệu bản thân" fullWidth multiline minRows={2}
                value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </Grid>
          </Grid>
          <Button variant="contained" sx={{ mt: 2.5, background: GRADIENT }} disabled={busy} onClick={() => save()}>
            Lưu thay đổi
          </Button>

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Đổi mật khẩu</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Mật khẩu hiện tại" type="password" fullWidth
                value={pw.currentPassword} onChange={e => setPw({ ...pw, currentPassword: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Mật khẩu mới" type="password" fullWidth
                value={pw.newPassword} onChange={e => setPw({ ...pw, newPassword: e.target.value })} />
            </Grid>
          </Grid>
          <Button variant="outlined" sx={{ mt: 2 }} disabled={busy || !pw.newPassword}
            onClick={() => save(pw)}>
            Đổi mật khẩu
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
