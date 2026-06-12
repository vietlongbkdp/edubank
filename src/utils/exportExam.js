// Xuất đề thi ra Word (.docx) và PDF (qua cửa sổ in), hỗ trợ trộn nhiều mã đề
import {
  Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell,
  WidthType, BorderStyle
} from 'docx';
import { saveAs } from 'file-saver';
import { latexToHtml } from '../components/Latex';

// RNG có seed để các mã đề tái lập được
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

// Tạo N biến thể mã đề: trộn thứ tự câu + trộn phương án + remap đáp án đúng
export function makeVariants(questions, count = 1, { shuffleQuestions = true, shuffleOptions = true, startCode = 101 } = {}) {
  return [...Array(count)].map((_, vi) => {
    const rnd = seededRandom(1000 + vi * 7919);
    let qs = shuffleQuestions && count > 1 ? shuffle(questions, rnd) : [...questions];
    qs = qs.map(q => {
      if (!shuffleOptions || !q.options?.length) return { ...q };
      const labels = q.options.map(o => o.label);
      const shuffled = shuffle(q.options, rnd);
      // Map nhãn cũ → nhãn mới sau khi trộn
      const map = {};
      shuffled.forEach((op, i) => { map[op.label] = labels[i]; });
      const newOptions = shuffled.map((op, i) => ({ ...op, label: labels[i] }));
      const remap = (ans) => Array.isArray(ans) ? ans.map(a => map[a] || a) : (map[ans] || ans);
      return { ...q, options: newOptions, correctAnswer: remap(q.correctAnswer) };
    });
    return { code: String(startCode + vi), questions: qs };
  });
}

// LaTeX → văn bản thuần cho Word (giữ nguyên ký hiệu LaTeX để GV chỉnh trong Word/MathType)
const plain = (t = '') => String(t).replace(/\$\$?/g, ' ');

// ===== Xuất Word =====
export async function exportWord(exam, variants) {
  const sections = variants.map(v => ({
    properties: {},
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'BỘ ĐỀ ÔN LUYỆN — EDUBANK', bold: true, size: 24 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: exam.title?.toUpperCase() || 'ĐỀ THI', bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Thời gian làm bài: ${exam.duration} phút — Mã đề: ${v.code}`, italics: true, size: 22 })]
      }),
      new Paragraph({ text: '' }),
      ...v.questions.flatMap((q, i) => {
        const out = [
          new Paragraph({
            spacing: { before: 160 },
            children: [
              new TextRun({ text: `Câu ${i + 1}. `, bold: true, size: 22 }),
              new TextRun({ text: plain(q.content), size: 22 })
            ]
          })
        ];
        if (q.options?.length) {
          // 4 phương án dạng 2 cột bằng bảng không viền
          const cells = q.options.map(op =>
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
              children: [new Paragraph({
                children: [
                  new TextRun({ text: `${op.label}. `, bold: true, size: 22 }),
                  new TextRun({ text: plain(op.text), size: 22 })
                ]
              })]
            })
          );
          const rows = [];
          for (let r = 0; r < cells.length; r += 2) {
            rows.push(new TableRow({ children: cells.slice(r, r + 2).length === 2 ? cells.slice(r, r + 2) : [cells[r], new TableCell({ borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }, children: [new Paragraph('')] })] }));
          }
          out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
        }
        return out;
      }),
      new Paragraph({ text: '' }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: '---------- HẾT ----------', bold: true })]
      }),
      // Trang đáp án
      new Paragraph({ pageBreakBefore: true, alignment: AlignmentType.CENTER, children: [new TextRun({ text: `ĐÁP ÁN — MÃ ĐỀ ${v.code}`, bold: true, size: 26 })] }),
      ...v.questions.map((q, i) => new Paragraph({
        children: [new TextRun({
          text: `Câu ${i + 1}: ${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer || '—'}`, size: 22
        })]
      }))
    ]
  }));

  const doc = new Document({ sections });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${(exam.title || 'de-thi').replace(/[^\p{L}\p{N} ]/gu, '')}.docx`);
}

// ===== Xuất PDF qua cửa sổ in (giữ nguyên công thức KaTeX & ảnh) =====
export function exportPdf(exam, variants) {
  const katexCss = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.10/katex.min.css';
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>${exam.title || 'Đề thi'}</title>
<link rel="stylesheet" href="${katexCss}">
<style>
  body { font-family: "Times New Roman", serif; font-size: 13pt; margin: 2cm; color: #000; }
  .header { text-align: center; margin-bottom: 18px; }
  .q { margin: 12px 0; page-break-inside: avoid; }
  .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-top: 4px; }
  img { max-width: 320px; max-height: 200px; display: block; margin: 6px 0; }
  .answers { page-break-before: always; }
  .akey { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 12px; }
  @media print { .noprint { display: none; } }
</style></head><body>
<div class="noprint" style="text-align:center;padding:10px;background:#EEF2FF;border-radius:8px;margin-bottom:16px">
  Nhấn <b>Ctrl+P</b> (hoặc Cmd+P) và chọn "Lưu thành PDF" — <button onclick="window.print()">In ngay</button>
</div>
${variants.map(v => `
  <div class="header">
    <div><b>BỘ ĐỀ ÔN LUYỆN — EDUBANK</b></div>
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
  <div class="answers">
    <h3 style="text-align:center">ĐÁP ÁN — MÃ ĐỀ ${v.code}</h3>
    <div class="akey">${v.questions.map((q, i) =>
      `<div>Câu ${i + 1}: <b>${Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer || '—'}</b></div>`).join('')}</div>
  </div>
`).join('<div style="page-break-before:always"></div>')}
</body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}
