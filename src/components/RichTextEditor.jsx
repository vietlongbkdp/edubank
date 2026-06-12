// Ô soạn thảo văn bản nhỏ gọn cho đầu đề thi: in đậm/nghiêng/gạch chân, căn lề, cỡ chữ
import { useRef, useEffect } from 'react';
import { Box, Stack, IconButton, Tooltip, Divider, Select, MenuItem, Typography } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold, faItalic, faUnderline, faAlignLeft, faAlignCenter, faAlignRight, faEraser
} from '@fortawesome/free-solid-svg-icons';

const TOOLS = [
  { cmd: 'bold', icon: faBold, tip: 'In đậm' },
  { cmd: 'italic', icon: faItalic, tip: 'In nghiêng' },
  { cmd: 'underline', icon: faUnderline, tip: 'Gạch chân' },
  null, // divider
  { cmd: 'justifyLeft', icon: faAlignLeft, tip: 'Căn trái' },
  { cmd: 'justifyCenter', icon: faAlignCenter, tip: 'Căn giữa' },
  { cmd: 'justifyRight', icon: faAlignRight, tip: 'Căn phải' }
];

export default function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }) {
  const ref = useRef(null);

  // Chỉ đổ value vào lần đầu (uncontrolled) để con trỏ không bị nhảy khi gõ
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value || '')) {
      ref.current.innerHTML = value || '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd, arg = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current.innerHTML);
  };

  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
      <Stack direction="row" spacing={.3} alignItems="center"
        sx={{ px: 1, py: .5, bgcolor: 'action.hover', flexWrap: 'wrap' }}>
        {TOOLS.map((t, i) => t === null
          ? <Divider key={i} orientation="vertical" flexItem sx={{ mx: .5 }} />
          : (
            <Tooltip key={t.cmd} title={t.tip}>
              <IconButton size="small" onMouseDown={e => e.preventDefault()} onClick={() => exec(t.cmd)}>
                <FontAwesomeIcon icon={t.icon} fontSize={14} />
              </IconButton>
            </Tooltip>
          ))}
        <Divider orientation="vertical" flexItem sx={{ mx: .5 }} />
        <Select size="small" defaultValue={3} variant="standard" disableUnderline
          sx={{ fontSize: 13, '& .MuiSelect-select': { py: .3 } }}
          onChange={e => exec('fontSize', e.target.value)}>
          <MenuItem value={2}>Chữ nhỏ</MenuItem>
          <MenuItem value={3}>Chữ thường</MenuItem>
          <MenuItem value={4}>Chữ lớn</MenuItem>
          <MenuItem value={5}>Tiêu đề</MenuItem>
        </Select>
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Xóa toàn bộ">
          <IconButton size="small" onClick={() => { ref.current.innerHTML = ''; onChange(''); }}>
            <FontAwesomeIcon icon={faEraser} fontSize={14} />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={e => onChange(e.currentTarget.innerHTML)}
        sx={{
          minHeight, p: 1.5, outline: 'none', fontSize: 14.5,
          '&:empty:before': { content: `"${placeholder || ''}"`, color: 'text.disabled' }
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, pb: .8, display: 'block' }}>
        Nội dung này sẽ in ở đầu trang của file đề và file đáp án (Word/PDF)
      </Typography>
    </Box>
  );
}
