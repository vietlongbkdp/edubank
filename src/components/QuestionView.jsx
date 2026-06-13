// Hiển thị 1 câu hỏi đầy đủ: đề bài, ảnh, phương án — dùng ở xem trước đề, làm bài, xem lại
import { Box, Stack, Typography, Radio, Checkbox, TextField, Paper } from '@mui/material';
import Latex from './Latex';
import DiffChip from './DiffChip';

export default function QuestionView({
  q, index, selected, onSelect, showAnswer = false, showDiff = false, readOnly = false
}) {
  const isMulti = q.type === 'multi_choice';
  const selArr = Array.isArray(selected) ? selected : selected ? [selected] : [];
  const correctArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : q.correctAnswer ? [q.correctAnswer] : [];

  const toggle = (label) => {
    if (readOnly || !onSelect) return;
    if (isMulti) {
      onSelect(selArr.includes(label) ? selArr.filter(l => l !== label) : [...selArr, label]);
    } else onSelect(label);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1 }}>
        <Typography fontWeight={800} color="primary">Câu {index + 1}.</Typography>
        <Box sx={{ flex: 1 }}>
          <Typography component="div"><Latex>{q.content}</Latex></Typography>
        </Box>
        {showDiff && <DiffChip value={q.difficulty} />}
      </Stack>

      {q.images?.map((src, i) => (
        <Box key={i} component="img" src={src} alt="" sx={{ maxWidth: '100%', maxHeight: 280, borderRadius: 2, my: 1, display: 'block' }} />
      ))}

      {['single_choice', 'multi_choice', 'true_false'].includes(q.type) && (
        <Stack spacing={.5} sx={{ mt: 1 }}>
          {q.options?.map(op => {
            const isSel = selArr.includes(op.label);
            const isCor = correctArr.includes(op.label);
            return (
              <Paper
                key={op.label} variant="outlined" onClick={() => toggle(op.label)}
                sx={{
                  p: 1, px: 1.5, display: 'flex', alignItems: 'center', gap: 1,
                  cursor: readOnly ? 'default' : 'pointer', borderRadius: 1.5,
                  borderColor: showAnswer ? (isCor ? 'success.main' : isSel ? 'error.main' : 'divider')
                    : isSel ? 'primary.main' : 'divider',
                  bgcolor: showAnswer && isCor ? 'success.main' + '14'
                    : showAnswer && isSel && !isCor ? 'error.main' + '14'
                    : isSel ? 'primary.main' + '0D' : 'transparent'
                }}
              >
                {isMulti
                  ? <Checkbox size="small" checked={isSel} sx={{ p: 0 }} disabled={readOnly} />
                  : <Radio size="small" checked={isSel} sx={{ p: 0 }} disabled={readOnly} />}
                <Typography fontWeight={700} sx={{ minWidth: 22 }}>{op.label}.</Typography>
                <Typography component="div" sx={{ flex: 1 }}><Latex>{op.text}</Latex></Typography>
                {op.image && <Box component="img" src={op.image} sx={{ maxHeight: 60, borderRadius: 1 }} />}
              </Paper>
            );
          })}
        </Stack>
      )}

      {q.type === 'short_answer' && (
        <TextField
          size="small" placeholder="Nhập đáp án..." sx={{ mt: 1, maxWidth: 320 }}
          value={selArr[0] || ''} disabled={readOnly}
          onChange={(e) => onSelect && onSelect(e.target.value)}
        />
      )}

      {showAnswer && (
        <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1.5, bgcolor: 'success.main' + '0D', border: 1, borderColor: 'success.main' + '40' }}>
          <Typography variant="body2" fontWeight={700} color="success.main">
            Đáp án đúng: {correctArr.join(', ') || q.correctAnswer}
          </Typography>
          {q.solution && (
            <Typography component="div" variant="body2" sx={{ mt: .5 }}>
              <b>Lời giải:</b> <Latex>{q.solution}</Latex>
            </Typography>
          )}
          {q.solutionImages?.map((src, i) => (
            <Box key={i} component="img" src={src} sx={{ maxWidth: '100%', maxHeight: 240, borderRadius: 2, mt: 1, display: 'block' }} />
          ))}
        </Box>
      )}
    </Box>
  );
}
