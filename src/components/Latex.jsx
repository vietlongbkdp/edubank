// Hiển thị văn bản trộn LaTeX: tách $...$ (inline) và $$...$$ (block) rồi render bằng KaTeX
import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function renderPart(part, i) {
  if (part.type === 'text') return <span key={i}>{part.value}</span>;
  try {
    const html = katex.renderToString(part.value, { throwOnError: false, displayMode: part.type === 'block' });
    return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span key={i}>{part.value}</span>;
  }
}

export function splitLatex(text = '') {
  const parts = [];
  let rest = String(text);
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/;
  while (rest.length) {
    const m = rest.match(regex);
    if (!m) { parts.push({ type: 'text', value: rest }); break; }
    if (m.index > 0) parts.push({ type: 'text', value: rest.slice(0, m.index) });
    if (m[1] !== undefined) parts.push({ type: 'block', value: m[1] });
    else parts.push({ type: 'inline', value: m[2] });
    rest = rest.slice(m.index + m[0].length);
  }
  return parts;
}

export default function Latex({ children, sx }) {
  const parts = useMemo(() => splitLatex(children), [children]);
  return <span style={{ whiteSpace: 'pre-wrap', ...sx }}>{parts.map(renderPart)}</span>;
}

// Render LaTeX ra HTML string (dùng cho xuất PDF/in)
export function latexToHtml(text = '') {
  return splitLatex(text).map(p => {
    if (p.type === 'text') return p.value.replace(/</g, '&lt;').replace(/\n/g, '<br/>');
    try { return katex.renderToString(p.value, { throwOnError: false, displayMode: p.type === 'block' }); }
    catch { return p.value; }
  }).join('');
}
