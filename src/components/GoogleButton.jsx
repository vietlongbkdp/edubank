// Nút "Đăng nhập với Google" dùng Google Identity Services (GIS)
import { useEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Divider } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleButton({ onCredential, label = 'Đăng nhập với Google' }) {
  const divRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return; // chưa cấu hình → ẩn nút
    // Nạp script GIS một lần
    const init = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => onCredential(resp.credential)
      });
      if (divRef.current) {
        window.google.accounts.id.renderButton(divRef.current, {
          theme: 'outline', size: 'large', width: 320, text: 'continue_with', locale: 'vi'
        });
      }
      setReady(true);
    };
    if (window.google?.accounts?.id) { init(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = init;
    document.body.appendChild(s);
  }, []);

  if (!CLIENT_ID) return null; // chưa bật Google → không hiện gì

  return (
    <Box>
      <Divider sx={{ my: 2 }}><Typography variant="caption" color="text.secondary">hoặc</Typography></Divider>
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        {/* GIS sẽ render nút Google chính thức vào đây */}
        <Box ref={divRef} />
        {!ready && (
          <Button fullWidth variant="outlined" startIcon={<FontAwesomeIcon icon={faGoogle} />} disabled>
            {label}
          </Button>
        )}
      </Box>
    </Box>
  );
}
