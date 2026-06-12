// Xuất đề thi: Word (.docx font Times New Roman, công thức chuyển sang ký hiệu Unicode)
// và PDF (cửa sổ in, công thức KaTeX đẹp). Tách riêng FILE ĐỀ và FILE ĐÁP ÁN + LỜI GIẢI.
import {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle, TableLayoutType
} from 'docx';
import { saveAs } from 'file-saver';
import { latexToHtml } from '../components/Latex';

/* ============ Trộn mã đề ============ */
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function shuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function makeVariants(questions, count = 1, { shuffleQuestions = true, shuffleOptions = true, startCode = 101 } = {}) {
  return [...Array(count)].map((_, vi) => {
    const rnd = seededRandom(1000 + vi * 7919);
    let qs = shuffleQuestions && count > 1 ? shuffle(questions, rnd) : [...questions];
    qs = qs.map(q => {
      if (!shuffleOptions || !q.options?.length || count === 1) return { ...q };
      const labels = q.options.map(o => o.label);
      const shuffled = shuffle(q.options, rnd);
      const map = {};
      shuffled.forEach((op, i) => { map[op.label] = labels[i]; });
      const newOptions = shuffled.map((op, i) => ({ ...op, label: labels[i] }));
      const remap = (ans) => Array.isArray(ans) ? ans.map(a => map[a] || a) : (map[ans] || ans);
      return { ...q, options: newOptions, correctAnswer: remap(q.correctAnswer) };
    });
    return { code: String(startCode + vi), questions: qs };
  });
}

/* ============ LaTeX → văn bản Unicode cho Word ============
   $C_{34}^2$ → C₃₄² ; $\dfrac{5}{2}$ → 5/2 ; $\sqrt{x+9}$ → √(x+9) ; $\int_0^1$ → ∫₀¹ ... */
const SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','(':'⁽',')':'⁾','n':'ⁿ','x':'ˣ' };
const SUB = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋' };
const mapChars = (s, M) => [...s].every(c => M[c]) ? [...s].map(c => M[c]).join('') : null;
const supify = (s) => mapChars(s, SUP) ?? `^(${s})`;
const subify = (s) => mapChars(s, SUB) ?? `_(${s})`;

const SYMBOLS = {
  '\\pi':'π','\\alpha':'α','\\beta':'β','\\gamma':'γ','\\Delta':'Δ','\\delta':'δ','\\omega':'ω','\\varphi':'φ','\\phi':'φ','\\theta':'θ','\\lambda':'λ','\\mu':'μ',
  '\\infty':'∞','\\leq':'≤','\\le':'≤','\\geq':'≥','\\ge':'≥','\\neq':'≠','\\ne':'≠','\\approx':'≈','\\sim':'∼',
  '\\times':'×','\\cdot':'·','\\div':'÷','\\pm':'±','\\mp':'∓',
  '\\Leftrightarrow':'⇔','\\Rightarrow':'⇒','\\leftrightarrow':'↔','\\rightarrow':'→','\\to':'→',
  '\\in':'∈','\\notin':'∉','\\subset':'⊂','\\cup':'∪','\\cap':'∩','\\emptyset':'∅','\\varnothing':'∅',
  '\\int':'∫','\\sum':'∑','\\prod':'∏','\\lim':'lim','\\ln':'ln','\\log':'log','\\sin':'sin','\\cos':'cos','\\tan':'tan','\\cot':'cot',
  '\\angle':'∠','\\perp':'⊥','\\parallel':'∥','\\triangle':'△','\\degree':'°','^\\circ':'°','\\circ':'°',
  '\\mathbb{R}':'ℝ','\\mathbb{N}':'ℕ','\\mathbb{Z}':'ℤ','\\mathbb{Q}':'ℚ','\\mathbb{C}':'ℂ',
  '\\%':'%','\\,':' ','\\;':' ','\\:':' ','\\!':'','\\ ':' ','\\quad':'  ','\\qquad':'    '
};

function mathToText(m) {
  let s = m;
  // Phân số (lặp để xử lý lồng nhau đơn giản)
  for (let i = 0; i < 5; i++) {
    s = s.replace(/\\[dt]?frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, a, b) => {
      const wrap = (x) => /^[\w.,π]+$/.test(x) ? x : `(${x})`;
      return `${wrap(a)}/${wrap(b)}`;
    });
  }
  s = s.replace(/\\sqrt\[(\d+)\]\{([^{}]*)\}/g, (_, n, x) => `${supify(n)}√(${x})`);
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, '√($1)');
  s = s.replace(/\\(vec|overrightarrow)\{([^{}]*)\}/g, '$2\u20D7');
  s = s.replace(/\\overline\{([^{}]*)\}/g, '$1\u0305');
  s = s.replace(/\\(left|right)/g, '');
  s = s.replace(/\\(mathrm|mathit|text|operatorname)\{([^{}]*)\}/g, '$2');
  for (const k of Object.keys(SYMBOLS).sort((a, b) => b.length - a.length)) s = s.split(k).join(SYMBOLS[k]);
  // Lũy thừa / chỉ số dưới
  s = s.replace(/\^\{([^{}]*)\}/g, (_, x) => supify(x));
  s = s.replace(/\^(.)/g, (_, x) => supify(x));
  s = s.replace(/_\{([^{}]*)\}/g, (_, x) => subify(x));
  s = s.replace(/_(.)/g, (_, x) => subify(x));
  s = s.replace(/\\[a-zA-Z]+/g, '');   // lệnh còn sót
  s = s.replace(/[{}]/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

export function latexToWordText(src = '') {
  return String(src).replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_, a, b) => ' ' + mathToText(a || b) + ' ')
    .replace(/\s+/g, ' ').trim();
}

/* ============ HTML đầu đề → đoạn văn docx ============ */
function headerToDocx(html) {
  if (!html?.trim()) return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const paras = [];
  const align = (el) => {
    const a = (el.style?.textAlign || el.getAttribute?.('align') || '').toLowerCase();
    return a === 'center' ? AlignmentType.CENTER : a === 'right' ? AlignmentType.RIGHT : AlignmentType.LEFT;
  };
  // Duyệt từng node con, thu các run kèm định dạng đậm/nghiêng/gạch chân
  const collectRuns = (node, fmt = {}) => {
    let runs = [];
    node.childNodes.forEach(child => {
      if (child.nodeType === 3) {
        const text = child.textContent;
        if (text) runs.push(new TextRun({ text, bold: !!fmt.b, italics: !!fmt.i, underline: fmt.u ? {} : undefined, size: fmt.size || 26 }));
      } else if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase();
        const next = { ...fmt };
        if (tag === 'b' || tag === 'strong') next.b = true;
        if (tag === 'i' || tag === 'em') next.i = true;
        if (tag === 'u') next.u = true;
        if (tag === 'font') {
          const fs = Number(child.getAttribute('size'));
          if (fs) next.size = [0, 18, 22, 26, 30, 36][fs] || 26; // map execCommand fontSize 1-5 → half-points
        }
        if (tag === 'br') runs.push(new TextRun({ break: 1 }));
        else runs = runs.concat(collectRuns(child, next));
      }
    });
    return runs;
  };
  const blocks = [...doc.body.children];
  if (!blocks.length && doc.body.textContent.trim()) {
    // HTML chỉ là text thuần
    doc.body.textContent.split('\n').forEach(line =>
      paras.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: line, size: 26 })] })));
    return paras;
  }
  blocks.forEach(el => {
    const runs = collectRuns(el);
    if (runs.length) paras.push(new Paragraph({ alignment: align(el), children: runs }));
  });
  return paras;
}

const noBorder = { top: { style: BorderStyle.NONE, size: 0 }, bottom: { style: BorderStyle.NONE, size: 0 }, left: { style: BorderStyle.NONE, size: 0 }, right: { style: BorderStyle.NONE, size: 0 } };
const T = (text, opts = {}) => new TextRun({ text, size: 26, ...opts });   // 13pt mặc định

// Bảng 2 cột cố định cho 4 phương án (fix lỗi cột bị bóp)
function optionsTable(options) {
  const cell = (op) => new TableCell({
    borders: noBorder,
    width: { size: 4650, type: WidthType.DXA },
    children: [new Paragraph({ children: [T(`${op.label}. `, { bold: true }), T(latexToWordText(op.text || ''))] })]
  });
  const emptyCell = () => new TableCell({ borders: noBorder, width: { size: 4650, type: WidthType.DXA }, children: [new Paragraph('')] });
  const rows = [];
  for (let r = 0; r < options.length; r += 2) {
    rows.push(new TableRow({ children: [cell(options[r]), options[r + 1] ? cell(options[r + 1]) : emptyCell()] }));
  }
  return new Table({ layout: TableLayoutType.FIXED, columnWidths: [4650, 4650], width: { size: 9300, type: WidthType.DXA }, rows });
}

const docStyles = {
  default: { document: { run: { font: 'Times New Roman', size: 26 } } }   // toàn văn bản Times New Roman 13pt
};

const safeName = (s) => (s || 'de-thi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '').trim().replace(/ +/g, '-');

/* ============ WORD: file ĐỀ BÀI ============ */
export async function exportWordExam(exam, variants) {
  const sections = variants.map(v => ({
    properties: {},
    children: [
      ...headerToDocx(exam.header),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [T(exam.title?.toUpperCase() || 'ĐỀ THI', { bold: true, size: 30 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [T(`Thời gian làm bài: ${exam.duration} phút — Mã đề: ${v.code}`, { italics: true, size: 24 })] }),
      new Paragraph({ text: '' }),
      ...v.questions.flatMap((q, i) => {
        const out = [new Paragraph({
          spacing: { before: 180 },
          children: [T(`Câu ${i + 1}. `, { bold: true }), T(latexToWordText(q.content))]
        })];
        if (q.options?.length) out.push(optionsTable(q.options));
        return out;
      }),
      new Paragraph({ text: '' }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [T('---------- HẾT ----------', { bold: true })] })
    ]
  }));
  const blob = await Packer.toBlob(new Document({ styles: docStyles, sections }));
  saveAs(blob, `${safeName(exam.title)}-DE-BAI.docx`);
}

/* ============ WORD: file ĐÁP ÁN + LỜI GIẢI ============ */
export async function exportWordAnswers(exam, variants) {
  const sections = variants.map(v => {
    // Bảng đáp án nhanh: 5 câu mỗi dòng
    const keyLines = [];
    for (let r = 0; r < v.questions.length; r += 5) {
      keyLines.push(new Paragraph({
        children: v.questions.slice(r, r + 5).flatMap((q, j) => [
          T(`Câu ${r + j + 1}: `, { bold: true }),
          T(`${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(',') : q.correctAnswer || '—'}      `)
        ])
      }));
    }
    return {
      properties: {},
      children: [
        ...headerToDocx(exam.header),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [T(`ĐÁP ÁN VÀ LỜI GIẢI — MÃ ĐỀ ${v.code}`, { bold: true, size: 30 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [T(exam.title || '', { italics: true, size: 24 })] }),
        new Paragraph({ text: '' }),
        new Paragraph({ children: [T('I. BẢNG ĐÁP ÁN', { bold: true })] }),
        ...keyLines,
        new Paragraph({ text: '' }),
        new Paragraph({ children: [T('II. LỜI GIẢI CHI TIẾT', { bold: true })] }),
        ...v.questions.flatMap((q, i) => {
          const out = [new Paragraph({
            spacing: { before: 180 },
            children: [
              T(`Câu ${i + 1}. `, { bold: true }),
              T(latexToWordText(q.content))
            ]
          }),
          new Paragraph({
            children: [
              T('Đáp án: ', { bold: true }),
              T(`${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer || '—'}`, { bold: true })
            ]
          })];
          if (q.solution) out.push(new Paragraph({ children: [T('Lời giải: ', { italics: true }), T(latexToWordText(q.solution))] }));
          return out;
        })
      ]
    };
  });
  const blob = await Packer.toBlob(new Document({ styles: docStyles, sections }));
  saveAs(blob, `${safeName(exam.title)}-DAP-AN.docx`);
}

// Tải cả 2 file Word: đề + đáp án
export async function exportWord(exam, variants) {
  await exportWordExam(exam, variants);
  await exportWordAnswers(exam, variants);
}

/* ============ PDF qua cửa sổ in ============
   QUAN TRỌNG: cửa sổ phải được mở SYNCHRONOUS ngay khi người dùng bấm nút
   (truyền vào tham số win) — nếu mở sau await sẽ bị Safari/iOS chặn popup. */
const KATEX_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.10/katex.min.css';

function pdfShell(title, body) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="stylesheet" href="${KATEX_CSS}">
<style>
  body { font-family: "Times New Roman", serif; font-size: 13pt; margin: 1.6cm; color: #000; }
  .exam-header { margin-bottom: 14px; }
  .q { margin: 12px 0; page-break-inside: avoid; }
  .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-top: 4px; }
  .sol { margin: 4px 0 14px; padding-left: 12px; border-left: 3px solid #888; }
  img { max-width: 320px; max-height: 200px; display: block; margin: 6px 0; }
  .akey { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 10px 0 18px; }
  .pagebreak { page-break-before: always; }
  @media print { .noprint { display: none; } }
  @media (max-width: 640px) { body { margin: .8cm; } .opts { grid-template-columns: 1fr; } }
</style></head><body>
<div class="noprint" style="text-align:center;padding:10px;background:#EEF2FF;border-radius:8px;margin-bottom:16px">
  Nhấn <b>Ctrl+P / Cmd+P</b> rồi chọn "Lưu thành PDF" — <button onclick="window.print()" style="padding:4px 14px">In ngay</button>
</div>
${body}
</body></html>`;
}

function renderInto(win, html) {
  if (!win || win.closed) throw new Error('POPUP_BLOCKED');
  win.document.open();
  win.document.write(html);
  win.document.close();
}

export function exportPdfExam(exam, variants, win) {
  const body = variants.map(v => `
  <div class="exam-header">${exam.header || ''}</div>
  <div style="text-align:center">
    <h2 style="margin:6px 0">${exam.title || 'ĐỀ THI'}</h2>
    <i>Thời gian làm bài: ${exam.duration} phút — Mã đề: ${v.code}</i>
  </div>
  ${v.questions.map((q, i) => `
    <div class="q">
      <b>Câu ${i + 1}.</b> ${latexToHtml(q.content)}
      ${(q.images || []).map(s => `<img src="${s}">`).join('')}
      ${q.options?.length ? `<div class="opts">${q.options.map(op =>
        `<div><b>${op.label}.</b> ${latexToHtml(op.text || '')}</div>`).join('')}</div>` : ''}
    </div>`).join('')}
  <div style="text-align:center;margin-top:18px"><b>---------- HẾT ----------</b></div>
`).join('<div class="pagebreak"></div>');
  renderInto(win, pdfShell(`${exam.title || 'Đề thi'} — Đề bài`, body));
}

export function exportPdfAnswers(exam, variants, win) {
  const body = variants.map(v => `
  <div class="exam-header">${exam.header || ''}</div>
  <div style="text-align:center">
    <h2 style="margin:6px 0">ĐÁP ÁN VÀ LỜI GIẢI — MÃ ĐỀ ${v.code}</h2>
    <i>${exam.title || ''}</i>
  </div>
  <h3>I. Bảng đáp án</h3>
  <div class="akey">${v.questions.map((q, i) =>
    `<div>Câu ${i + 1}: <b>${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer || '—'}</b></div>`).join('')}</div>
  <h3>II. Lời giải chi tiết</h3>
  ${v.questions.map((q, i) => `
    <div class="q">
      <b>Câu ${i + 1}.</b> ${latexToHtml(q.content)}
      <div><b>Đáp án: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer || '—'}</b></div>
      ${q.solution ? `<div class="sol"><i>Lời giải:</i> ${latexToHtml(q.solution)}
        ${(q.solutionImages || []).map(s => `<img src="${s}">`).join('')}</div>` : ''}
    </div>`).join('')}
`).join('<div class="pagebreak"></div>');
  renderInto(win, pdfShell(`${exam.title || 'Đề thi'} — Đáp án`, body));
}
