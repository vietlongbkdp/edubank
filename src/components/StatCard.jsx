import { Card, CardContent, Stack, Typography, Box } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function StatCard({ icon, label, value, color = '#4F46E5', sub }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{
            width: 52, height: 52, borderRadius: 3, display: 'grid', placeItems: 'center',
            bgcolor: `${color}1A`, color, fontSize: 22
          }}>
            <FontAwesomeIcon icon={icon} />
          </Box>
          <Box>
            <Typography variant="h5">{value}</Typography>
            <Typography variant="body2" color="text.secondary">{label}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
