// Admin: cấu hình hệ thống — ngưỡng số đề GV phải đóng phí + thông tin thanh toán SePay/VietQR
import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Stack, Alert, InputAdornment, Divider } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import client, { apiMsg } from '../../api/client';

export default function AdminSettings() {
  const { enqueueSnackbar } = useSnackbar();
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    client.get('/settings')
      .then(({ data }) => setS(data.data))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await client.put('/settings', s);
      enqueueSnackbar('Đã lưu cấu hình', { variant: 'success' });
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
    finally { setSaving(false); }
  };

  if (loading || !s) return <Typography sx={{ p: 2 }}>Đang tải...</Typography>;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Typography variant="h4" sx={{ mb: 2.5 }}>
        <FontAwesomeIcon icon={faGear} /> Cấu hình hệ thống
      </Typography>

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>Chính sách giáo viên</Typography>
          <TextField type="number" label="Số bộ đề tối đa miễn phí (n)" fullWidth
            value={s.teacherExamLimit} onChange={set('teacherExamLimit')}
            helperText="Khi giáo viên tạo đủ n bộ đề, tài khoản chuyển sang 'Tạm ngưng' và phải đóng phí. Đặt 0 để không giới hạn." />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: .5 }}>Thông tin thanh toán (VietQR / SePay)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Mã QR thanh toán được tạo tự động từ thông tin dưới đây. Cấu hình webhook SePay trỏ về <code>/api/payment</code> để hệ thống tự kích hoạt khi nhận được tiền.
          </Typography>
          <Stack spacing={2}>
            <TextField label="Số tiền phí" type="number" fullWidth value={s.payAmount} onChange={set('payAmount')}
              InputProps={{ endAdornment: <InputAdornment position="end">VND</InputAdornment> }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Mã ngân hàng" fullWidth value={s.bankName} onChange={set('bankName')}
                helperText="Vd: VPB, MB, VCB, TCB, ACB..." />
              <TextField label="Số tài khoản" fullWidth value={s.bankAccount} onChange={set('bankAccount')} />
            </Stack>
            <TextField label="Tên chủ tài khoản" fullWidth value={s.bankAccountName} onChange={set('bankAccountName')} />
            <TextField label="Tiền tố nội dung chuyển khoản" fullWidth value={s.payPrefix} onChange={set('payPrefix')}
              helperText="Nội dung CK của mỗi GV = tiền tố + 6 ký tự cuối mã tài khoản, giúp webhook tự khớp." />
          </Stack>
          <Alert severity="info" sx={{ mt: 2 }}>
            Webhook SePay cần header <code>Authorization: Apikey &lt;SEPAY_WEBHOOK_KEY&gt;</code> (đặt biến môi trường <code>SEPAY_WEBHOOK_KEY</code> trên Vercel).
          </Alert>
        </CardContent>
      </Card>

      <Button variant="contained" size="large" sx={{ mt: 2.5 }} disabled={saving}
        startIcon={<FontAwesomeIcon icon={faFloppyDisk} />} onClick={save}>
        {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
      </Button>
    </Box>
  );
}
