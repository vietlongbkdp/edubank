// Admin: duyệt câu hỏi bị báo cáo trong kho chung — khôi phục hoặc xóa
import { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Stack, Button, Alert, Chip } from '@mui/material';
import { useSnackbar } from 'notistack';
import client, { apiMsg } from '../../api/client';
import QuestionView from '../../components/QuestionView';

export default function AdminReported() {
  const { enqueueSnackbar } = useSnackbar();
  const [items, setItems] = useState([]);

  const load = useCallback(() => {
    client.get('/questions', { params: { scope: 'all', status: 'reported', limit: 50 } })
      .then(({ data }) => setItems(data.data.items))
      .catch(e => enqueueSnackbar(apiMsg(e), { variant: 'error' }));
  }, []);
  useEffect(() => { load(); }, [load]);

  const act = async (q, action) => {
    try {
      if (action === 'restore') await client.put(`/questions?id=${q._id}`, { action: 'restore' });
      else await client.delete(`/questions?id=${q._id}`);
      enqueueSnackbar(action === 'restore' ? 'Đã khôi phục câu hỏi' : 'Đã xóa câu hỏi', { variant: 'success' });
      load();
    } catch (e) { enqueueSnackbar(apiMsg(e), { variant: 'error' }); }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2.5 }}>Câu hỏi bị báo cáo</Typography>
      {!items.length ? (
        <Alert severity="success">Không có câu hỏi nào đang chờ duyệt. Kho đề chung đang sạch!</Alert>
      ) : (
        <Stack spacing={2.5}>
          {items.map(q => (
            <Card key={q._id}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <Chip size="small" label={q.code} />
                  {q.reportReason && <Chip size="small" color="error" label={`Lý do: ${q.reportReason}`} />}
                </Stack>
                <QuestionView q={q} index={0} readOnly showAnswer showDiff />
                <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                  <Button variant="contained" color="success" onClick={() => act(q, 'restore')}>Khôi phục</Button>
                  <Button variant="outlined" color="error" onClick={() => act(q, 'delete')}>Xóa vĩnh viễn</Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
