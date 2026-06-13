// Layout sau đăng nhập: sidebar trái + topbar (avatar, dark mode)
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, AppBar, Toolbar,
  IconButton, Avatar, Menu, MenuItem, Typography, useMediaQuery, Stack, Divider, Tooltip
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGraduationCap, faGaugeHigh, faDatabase, faWandMagicSparkles, faFileLines,
  faChartLine, faPenToSquare, faUsers, faFlag, faBars, faMoon, faSun,
  faRightFromBracket, faUser, faClockRotateLeft, faChalkboardUser, faGear
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { GRADIENT } from '../theme';

const W = 252;

const MENUS = {
  teacher: [
    { to: '/gv', icon: faGaugeHigh, label: 'Tổng quan', end: true },
    { to: '/gv/kho-cau-hoi', icon: faDatabase, label: 'Kho câu hỏi' },
    { to: '/gv/tao-de', icon: faWandMagicSparkles, label: 'Tạo đề tự động' },
    { to: '/gv/de-thi', icon: faFileLines, label: 'Đề thi của tôi' }
  ],
  student: [
    { to: '/hs', icon: faGaugeHigh, label: 'Tổng quan', end: true },
    { to: '/hs/thi-thu', icon: faPenToSquare, label: 'Tạo đề thi thử' },
    { to: '/hs/luyen-de', icon: faChalkboardUser, label: 'Luyện đề theo GV' },
    { to: '/hs/lich-su', icon: faClockRotateLeft, label: 'Lịch sử bài thi' },
    { to: '/hs/tien-bo', icon: faChartLine, label: 'Tiến bộ của tôi' }
  ],
  admin: [
    { to: '/admin', icon: faUsers, label: 'Người dùng', end: true },
    { to: '/admin/cau-hoi', icon: faDatabase, label: 'Quản lý câu hỏi' },
    { to: '/admin/bo-de', icon: faFileLines, label: 'Quản lý bộ đề' },
    { to: '/admin/bao-cao', icon: faFlag, label: 'Câu hỏi bị báo cáo' },
    { to: '/admin/cau-hinh', icon: faGear, label: 'Cấu hình hệ thống' }
  ]
};

export default function AppLayout({ mode, toggleMode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const menu = MENUS[user?.role] || [];

  const drawer = (
    <Box sx={{ width: W, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1.2} alignItems="center" sx={{ p: 2.5 }}>
        <Box sx={{ width: 38, height: 38, borderRadius: 2.5, background: GRADIENT, display: 'grid', placeItems: 'center', color: '#fff' }}>
          <FontAwesomeIcon icon={faGraduationCap} />
        </Box>
        <Typography variant="h6" sx={{ background: GRADIENT, WebkitBackgroundClip: 'text', color: 'transparent' }}>
          EduBank
        </Typography>
      </Stack>
      <Divider />
      <List sx={{ px: 1.2, flex: 1 }}>
        {menu.map(m => (
          <ListItemButton
            key={m.to} component={NavLink} to={m.to} end={m.end}
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: 1.5, mb: .5, transition: 'all .15s ease',
              '&:hover': { bgcolor: 'action.hover', transform: 'translateX(3px)' },
              '&.active': { background: GRADIENT, color: '#fff', boxShadow: '0 4px 12px rgba(79,70,229,.35)', '& .MuiListItemIcon-root': { color: '#fff' } }
            }}
          >
            <ListItemIcon sx={{ minWidth: 38 }}><FontAwesomeIcon icon={m.icon} /></ListItemIcon>
            <ListItemText primary={m.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 14.5 }} />
          </ListItemButton>
        ))}
      </List>
      <Typography variant="caption" color="text.secondary" sx={{ p: 2 }}>
        © {new Date().getFullYear()} EduBank
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{ width: W, '& .MuiDrawer-paper': { width: W, border: 0 } }}
      >
        {drawer}
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Toolbar sx={{ gap: 1 }}>
            {isMobile && (
              <IconButton onClick={() => setOpen(true)}><FontAwesomeIcon icon={faBars} /></IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <Tooltip title={mode === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}>
              <IconButton onClick={toggleMode}><FontAwesomeIcon icon={mode === 'light' ? faMoon : faSun} /></IconButton>
            </Tooltip>
            <IconButton onClick={(e) => setAnchor(e.currentTarget)}>
              <Avatar src={user?.avatarUrl} sx={{ width: 36, height: 36, background: GRADIENT }}>
                {user?.fullName?.[0]}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
              <MenuItem disabled>
                <Typography variant="body2" fontWeight={700}>{user?.fullName}</Typography>
              </MenuItem>
              <MenuItem onClick={() => { setAnchor(null); navigate('/ho-so'); }}>
                <ListItemIcon><FontAwesomeIcon icon={faUser} /></ListItemIcon> Hồ sơ cá nhân
              </MenuItem>
              <MenuItem onClick={() => { logout(); navigate('/'); }}>
                <ListItemIcon><FontAwesomeIcon icon={faRightFromBracket} /></ListItemIcon> Đăng xuất
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: { xs: 2, md: 3.5 }, flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
