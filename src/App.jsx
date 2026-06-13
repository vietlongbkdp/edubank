import { useMemo, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { buildTheme } from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ForcePasswordChange from './pages/ForcePasswordChange';
import Payment from './pages/Payment';

import TeacherDashboard from './pages/teacher/TeacherDashboard';
import QuestionBank from './pages/teacher/QuestionBank';
import ExamGenerator from './pages/teacher/ExamGenerator';
import ExamList from './pages/teacher/ExamList';

import StudentDashboard from './pages/student/StudentDashboard';
import MockExamCreate from './pages/student/MockExamCreate';
import TakeExam from './pages/student/TakeExam';
import ExamResult from './pages/student/ExamResult';
import Progress from './pages/student/Progress';
import AttemptHistory from './pages/student/AttemptHistory';
import TeacherExams from './pages/student/TeacherExams';

import AdminUsers from './pages/admin/AdminUsers';
import AdminQuestions from './pages/admin/AdminQuestions';
import AdminExams from './pages/admin/AdminExams';
import AdminSettings from './pages/admin/AdminSettings';
import AdminReported from './pages/admin/AdminReported';

// Bảo vệ route theo vai trò
function Guard({ roles, children, ignoreGates }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/dang-nhap" replace />;
  // Buộc đổi mật khẩu mặc định trước khi dùng bất cứ trang nào
  if (user.mustChangePassword && !ignoreGates) return <Navigate to="/doi-mat-khau" replace />;
  // GV bị tạm ngưng (đủ n đề, chưa đóng phí) → chuyển tới trang thanh toán
  if (user.role === 'teacher' && user.status === 'deactive' && !ignoreGates)
    return <Navigate to="/thanh-toan" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Landing />;
  return <Navigate to={user.role === 'teacher' ? '/gv' : user.role === 'admin' ? '/admin' : '/hs'} replace />;
}

function Shell() {
  const [mode, setMode] = useState(localStorage.getItem('edubank_mode') || 'light');
  const theme = useMemo(() => buildTheme(mode), [mode]);
  const toggleMode = () => {
    const m = mode === 'light' ? 'dark' : 'light';
    setMode(m); localStorage.setItem('edubank_mode', m);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider maxSnack={3} autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/dang-nhap" element={<Login />} />
          <Route path="/dang-ky" element={<Register />} />

          {/* Đổi mật khẩu bắt buộc: toàn màn hình, ngoài layout, bỏ qua các cổng chặn */}
          <Route path="/doi-mat-khau" element={<Guard ignoreGates><ForcePasswordChange /></Guard>} />

          {/* Làm bài thi: toàn màn hình, không sidebar */}
          <Route path="/hs/lam-bai/:attemptId" element={<Guard roles={['student']}><TakeExam /></Guard>} />

          <Route element={<AppLayout mode={mode} toggleMode={toggleMode} />}>
            <Route path="/ho-so" element={<Guard><Profile /></Guard>} />
            {/* Trang thanh toán: GV deactive truy cập được (ignoreGates để không bị vòng lặp chuyển hướng) */}
            <Route path="/thanh-toan" element={<Guard roles={['teacher', 'admin']} ignoreGates><Payment /></Guard>} />

            <Route path="/gv" element={<Guard roles={['teacher', 'admin']}><TeacherDashboard /></Guard>} />
            <Route path="/gv/kho-cau-hoi" element={<Guard roles={['teacher', 'admin']}><QuestionBank /></Guard>} />
            <Route path="/gv/tao-de" element={<Guard roles={['teacher', 'admin']}><ExamGenerator /></Guard>} />
            <Route path="/gv/de-thi" element={<Guard roles={['teacher', 'admin']}><ExamList /></Guard>} />

            <Route path="/hs" element={<Guard roles={['student']}><StudentDashboard /></Guard>} />
            <Route path="/hs/thi-thu" element={<Guard roles={['student']}><MockExamCreate /></Guard>} />
            <Route path="/hs/luyen-de" element={<Guard roles={['student']}><TeacherExams /></Guard>} />
            <Route path="/hs/ket-qua/:attemptId" element={<Guard roles={['student']}><ExamResult /></Guard>} />
            <Route path="/hs/lich-su" element={<Guard roles={['student']}><AttemptHistory /></Guard>} />
            <Route path="/hs/tien-bo" element={<Guard roles={['student']}><Progress /></Guard>} />

            <Route path="/admin" element={<Guard roles={['admin']}><AdminUsers /></Guard>} />
            <Route path="/admin/cau-hoi" element={<Guard roles={['admin']}><AdminQuestions /></Guard>} />
            <Route path="/admin/bo-de" element={<Guard roles={['admin']}><AdminExams /></Guard>} />
            <Route path="/admin/cau-hinh" element={<Guard roles={['admin']}><AdminSettings /></Guard>} />
            <Route path="/admin/bao-cao" element={<Guard roles={['admin']}><AdminReported /></Guard>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
