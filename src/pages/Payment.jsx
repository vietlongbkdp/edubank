import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Alert, Stack, CircularProgress, Divider, Chip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode, faCopy, faRotate, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useSnackbar } from 'notistack';
import { useAuth } from '../context/AuthContext';
import client, { apiMsg } from '../api/client';
import { GRADIENT } from '../theme';

const vnd = (n) => (n || 0).toLocaleString('vi-VN') + ' đ';

// Trang đóng phí cho GV (status = deactive). Hiển thị VietQR; SePay webhook sẽ tự kích hoạt lại.
export default function Payment() {
  const { user, refreshUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    client.get('/payment', { params: { info: 1 } })
      .then(({ data }) => setInfo(data.data))
      .catch(e => setError(apiMsg(e, 'Không tải được thông tin thanh toán')))
      .finally(() => setLoading(false));
    // Tự động kiểm tra trạng thái mỗi 8 giây (phòng khi webhook đã kích hoạt)
    pollRef.current = setInterval(async () => {
      const fresh = await refreshUser();
      if (fresh.status === 'active') {
        clearInterval(pollRef.current);
        enqueueSnackbar('Thanh toán thành công, tài khoản đã được kích hoạt!', { variant: 'success' });
        navigate('/gv');
      }
    }, 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  const checkNow = async () => {
    setChecking(true);
    const fresh = await refreshUser();
    setChecking(false);
    if (fresh.status === 'active') {
      enqueueSnackbar('Tài khoản đã được kích hoạt!', { variant: 'success' });
      navigate('/gv');
    } else {
      enqueueSnackbar('Chưa ghi nhận thanh toán. Vui lòng đợi sau khi chuyển khoản.', { variant: 'info' });
    }
  };

  const copy = (text) => { navigator.clipboard?.writeText(text); enqueueSnackbar('Đã sao chép', { variant: 'success' }); };

  if (user?.status === 'active') {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <FontAwesomeIcon icon={faCircleCheck} size="2x" color="#16a34a" />
        <Typography variant="h6" sx={{ mt: 1 }}>Tài khoản của bạn đang hoạt động</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/gv')}>Về trang giáo viên</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" fontWeight={800} sx={{ mb: .5 }}>Đóng phí kích hoạt tài khoản</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tài khoản giáo viên cần đóng phí để tiếp tục tạo và chia sẻ đề. Sau khi chuyển khoản, hệ thống sẽ tự động kích hoạt lại (thường trong 1-2 phút).
      </Typography>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !info?.qrUrl ? (
        <Alert severity="warning">
          Quản trị viên chưa cấu hình tài khoản nhận thanh toán. Vui lòng liên hệ quản trị viên để được kích hoạt.
        </Alert>
      ) : (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ textAlign: 'center' }}>
              <Chip icon={<FontAwesomeIcon icon={faQrcode} />} label="Quét mã VietQR để chuyển khoản" color="primary" variant="outlined" sx={{ mb: 2 }} />
              <Box component="img" src={info.qrUrl} alt="VietQR"
                sx={{ width: 260, maxWidth: '100%', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} />
            </Box>
            <Divider sx={{ my: 2 }}>hoặc chuyển khoản thủ công</Divider>
            <Stack spacing={1.2}>
              <Row label="Ngân hàng" value={info.bankName} onCopy={copy} />
              <Row label="Số tài khoản" value={info.bankAccount} onCopy={copy} />
              <Row label="Chủ tài khoản" value={info.bankAccountName} onCopy={copy} />
              <Row label="Số tiền" value={vnd(info.amount)} onCopy={() => copy(String(info.amount))} highlight />
              <Row label="Nội dung CK" value={info.content} onCopy={copy} highlight />
            </Stack>
            <Alert severity="info" sx={{ mt: 2 }}>
              <b>Quan trọng:</b> nhập đúng nội dung chuyển khoản <b>{info.content}</b> để hệ thống tự nhận diện và kích hoạt tài khoản của bạn.
            </Alert>
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button fullWidth variant="contained" startIcon={<FontAwesomeIcon icon={faRotate} spin={checking} />}
                onClick={checkNow} disabled={checking}>
                {checking ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
              Trang sẽ tự động cập nhật khi nhận được thanh toán.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function Row({ label, value, onCopy, highlight }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
      p: 1, borderRadius: 1.5, bgcolor: highlight ? 'action.hover' : 'transparent' }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" fontWeight={highlight ? 800 : 600}>{value || '—'}</Typography>
        {value && <Button size="small" sx={{ minWidth: 0, p: .5 }} onClick={() => onCopy(value)}>
          <FontAwesomeIcon icon={faCopy} />
        </Button>}
      </Box>
    </Box>
  );
}
