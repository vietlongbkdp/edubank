// Lịch sử tất cả bài thi của học sinh
import { useState, useEffect } from 'react';
import { Box, Card, Typography, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';
import client, { apiMsg } from '../../api/client';

export default function AttemptHistory() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/attempts')
      .then(({ data }) => setRows(data.data.map(a => ({ ...a, id: a._id }))))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    {
      field: 'submittedAt', headerName: 'Ngày thi', width: 150,
      valueFormatter: (p) => dayjs(p.value).format('HH:mm DD/MM/YYYY')
    },
    { field: 'examId', headerName: 'Đề thi', flex: 1, minWidth: 220, valueGetter: p => p.value?.title },
    { field: 'subject', headerName: 'Môn', width: 100, valueGetter: p => p.row.examId?.subject },
    {
      field: 'score', headerName: 'Điểm', width: 110,
      renderCell: (p) => (
        <Chip size="small" label={p.value}
          sx={{ fontWeight: 800, bgcolor: p.value >= 8 ? '#10B981' : p.value >= 5 ? '#F59E0B' : '#EF4444', color: '#fff' }} />
      )
    },
    {
      field: 'correctCount', headerName: 'Số câu đúng', width: 120,
      valueGetter: p => `${p.value}/${p.row.totalQuestions}`
    }
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2.5 }}>Lịch sử bài thi</Typography>
      <Card>
        <DataGrid
          autoHeight rows={rows} columns={columns} loading={loading}
          pageSizeOptions={[10, 25]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          onRowClick={(p) => navigate(`/hs/ket-qua/${p.id}`)}
          sx={{ cursor: 'pointer' }}
          localeText={{ noRowsLabel: 'Bạn chưa làm bài thi nào — hãy tạo đề thi thử đầu tiên!' }}
        />
      </Card>
    </Box>
  );
}
