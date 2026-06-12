// Bộ hình minh họa SVG tự vẽ theo bảng màu EduBank — không phụ thuộc ảnh ngoài, load tức thì
import { Box } from '@mui/material';

// Hero: tờ đề thi + bút chì + huy hiệu điểm + các ký hiệu toán trôi nổi
export function HeroIllustration() {
  return (
    <Box sx={{
      position: 'relative', width: '100%', maxWidth: { xs: 320, sm: 400, md: 440 }, mx: 'auto',
      '@keyframes float': {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-12px)' }
      },
      '@keyframes floatSlow': {
        '0%, 100%': { transform: 'translateY(0) rotate(-6deg)' },
        '50%': { transform: 'translateY(-8px) rotate(-2deg)' }
      },
      '& .float': { animation: 'float 4s ease-in-out infinite' },
      '& .float-slow': { animation: 'floatSlow 5.5s ease-in-out infinite' },
      '@media (prefers-reduced-motion: reduce)': { '& .float, & .float-slow': { animation: 'none' } }
    }}>
      <svg viewBox="0 0 440 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Vòng tròn nền */}
        <circle cx="220" cy="200" r="170" fill="#ffffff" opacity=".12" />
        <circle cx="220" cy="200" r="130" fill="#ffffff" opacity=".10" />

        {/* Tờ đề thi */}
        <g className="float">
          <rect x="120" y="60" width="200" height="270" rx="16" fill="#ffffff" />
          <rect x="120" y="60" width="200" height="270" rx="16" fill="url(#paperShade)" />
          <rect x="145" y="88" width="110" height="12" rx="6" fill="#4F46E5" />
          <rect x="145" y="110" width="150" height="8" rx="4" fill="#E0E7FF" />

          {/* Câu hỏi 1: đáp án B đúng */}
          <rect x="145" y="138" width="125" height="8" rx="4" fill="#CBD5E1" />
          <circle cx="153" cy="166" r="7" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
          <rect x="168" y="162" width="70" height="8" rx="4" fill="#E2E8F0" />
          <circle cx="153" cy="190" r="7" fill="#10B981" />
          <path d="M149.5 190l2.5 2.5 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="168" y="186" width="90" height="8" rx="4" fill="#A7F3D0" />

          {/* Câu hỏi 2: đáp án D đúng */}
          <rect x="145" y="220" width="140" height="8" rx="4" fill="#CBD5E1" />
          <circle cx="153" cy="248" r="7" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="2" />
          <rect x="168" y="244" width="80" height="8" rx="4" fill="#E2E8F0" />
          <circle cx="153" cy="272" r="7" fill="#10B981" />
          <path d="M149.5 272l2.5 2.5 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="168" y="268" width="60" height="8" rx="4" fill="#A7F3D0" />

          {/* Thanh tiến độ dưới cùng */}
          <rect x="145" y="300" width="150" height="10" rx="5" fill="#EEF2FF" />
          <rect x="145" y="300" width="105" height="10" rx="5" fill="#7C3AED" />
        </g>

        {/* Huy hiệu điểm */}
        <g className="float-slow">
          <circle cx="330" cy="110" r="44" fill="#FBBF24" />
          <circle cx="330" cy="110" r="44" stroke="#ffffff" strokeWidth="5" />
          <text x="330" y="105" textAnchor="middle" fill="#7C2D12" fontSize="24" fontWeight="800" fontFamily="Be Vietnam Pro, sans-serif">9.5</text>
          <text x="330" y="126" textAnchor="middle" fill="#92400E" fontSize="12" fontWeight="700" fontFamily="Be Vietnam Pro, sans-serif">ĐIỂM</text>
        </g>

        {/* Bút chì */}
        <g className="float" style={{ animationDelay: '1s' }}>
          <g transform="rotate(35 95 270)">
            <rect x="80" y="200" width="26" height="120" rx="4" fill="#F59E0B" />
            <rect x="80" y="200" width="26" height="18" rx="4" fill="#FB7185" />
            <path d="M80 320 L93 350 L106 320 Z" fill="#FDE68A" />
            <path d="M88 336 L93 350 L98 336 Z" fill="#374151" />
          </g>
        </g>

        {/* Ký hiệu toán trôi nổi */}
        <g className="float-slow" style={{ animationDelay: '.5s' }}>
          <rect x="48" y="80" width="52" height="52" rx="14" fill="#ffffff" opacity=".95" />
          <text x="74" y="115" textAnchor="middle" fill="#7C3AED" fontSize="26" fontWeight="800" fontFamily="serif">π</text>
        </g>
        <g className="float" style={{ animationDelay: '1.6s' }}>
          <rect x="350" y="210" width="56" height="56" rx="14" fill="#ffffff" opacity=".95" />
          <text x="378" y="248" textAnchor="middle" fill="#4F46E5" fontSize="24" fontWeight="800" fontFamily="serif">x²</text>
        </g>
        <g className="float-slow" style={{ animationDelay: '2.2s' }}>
          <rect x="40" y="280" width="50" height="50" rx="14" fill="#ffffff" opacity=".95" />
          <text x="65" y="314" textAnchor="middle" fill="#A855F7" fontSize="26" fontWeight="800" fontFamily="serif">∑</text>
        </g>
        <g className="float" style={{ animationDelay: '.8s' }}>
          <rect x="330" y="300" width="50" height="50" rx="14" fill="#ffffff" opacity=".95" />
          <text x="355" y="334" textAnchor="middle" fill="#7C3AED" fontSize="24" fontWeight="800" fontFamily="serif">√x</text>
        </g>

        <defs>
          <linearGradient id="paperShade" x1="120" y1="60" x2="320" y2="330" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#EEF2FF" />
          </linearGradient>
        </defs>
      </svg>
    </Box>
  );
}

// Minh họa 3 bước: chọn ma trận → sinh đề → tải về
export function StepIllustration({ step }) {
  const common = { width: '100%', height: 'auto', display: 'block' };
  if (step === 1) return (
    <svg viewBox="0 0 200 140" style={common} xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="15" width="140" height="110" rx="14" fill="#EEF2FF" />
      {[['#22c55e', 95], ['#facc15', 70], ['#fb923c', 50], ['#ef4444', 30]].map(([c, w], i) => (
        <g key={i}>
          <rect x="45" y={32 + i * 22} width="22" height="13" rx="6" fill={c} />
          <rect x="74" y={34 + i * 22} width="82" height="9" rx="4.5" fill="#fff" />
          <rect x="74" y={34 + i * 22} width={w} height="9" rx="4.5" fill={c} opacity=".8" />
        </g>
      ))}
    </svg>
  );
  if (step === 2) return (
    <svg viewBox="0 0 200 140" style={common} xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="70" r="52" fill="#EEF2FF" />
      <path d="M100 30 l8 22 23 2 -17 15 5 23 -19 -12 -19 12 5 -23 -17 -15 23 -2 z" fill="#7C3AED" />
      <circle cx="148" cy="36" r="9" fill="#FBBF24" />
      <circle cx="52" cy="104" r="7" fill="#A855F7" />
      <circle cx="56" cy="36" r="5" fill="#4F46E5" />
    </svg>
  );
  return (
    <svg viewBox="0 0 200 140" style={common} xmlns="http://www.w3.org/2000/svg">
      <rect x="55" y="15" width="90" height="100" rx="12" fill="#EEF2FF" />
      <rect x="70" y="30" width="60" height="8" rx="4" fill="#C7D2FE" />
      <rect x="70" y="46" width="45" height="8" rx="4" fill="#C7D2FE" />
      <path d="M100 62 v30 m0 0 l-13 -13 m13 13 l13 -13" stroke="#4F46E5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="70" y="100" width="60" height="9" rx="4.5" fill="#10B981" />
    </svg>
  );
}
