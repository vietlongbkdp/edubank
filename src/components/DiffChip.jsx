// Chip độ khó 1-10 với màu gradient xanh → đỏ (chữ ký thị giác của EduBank)
import { Chip, Tooltip } from '@mui/material';
import { diffColor, diffLabel } from '../utils/constants';

export default function DiffChip({ value, size = 'small' }) {
  return (
    <Tooltip title={diffLabel(value)}>
      <Chip
        size={size}
        label={`Mức ${value}`}
        sx={{ bgcolor: diffColor(value), color: '#fff', fontWeight: 700 }}
      />
    </Tooltip>
  );
}
