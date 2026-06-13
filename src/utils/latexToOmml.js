// Chuyển văn bản trộn LaTeX ($...$) thành mảng đoạn docx có công thức OMML thật
// (hiển thị chuẩn như MathType trong MS Word, không phải ký tự Unicode chắp vá)
import katex from 'katex';
import { mml2omml } from 'mathml2omml';
import { TextRun, ImportedXmlComponent } from 'docx';

// LaTeX → OMML XML. Trả về null nếu lỗi để fallback về text
function texToOmml(tex, display = false) {
  try {
    // Bọc cụm chữ tiếng Việt có dấu thành \text{...} để KaTeX render đúng trong công thức
    const safe = tex.replace(/([A-Za-zÀ-ỹ]*[À-ỹ][A-Za-zÀ-ỹ]*)/g, (m) => /[À-ỹ]/.test(m) ? `\\text{${m}}` : m);
    let mathml = katex.renderToString(safe, { output: 'mathml', throwOnError: false, displayMode: display });
    const m = mathml.match(/<math[\s\S]*?<\/math>/);
    if (!m) return null;
    // Bỏ thẻ <annotation>...</annotation> (mathml2omml không hỗ trợ, gây cảnh báo)
    let clean = m[0].replace(/<annotation[\s\S]*?<\/annotation>/g, '').replace(/<semantics>|<\/semantics>/g, '');
    const omml = mml2omml(clean);
    return omml || null;
  } catch { return null; }
}

// Tách text + công thức → mảng "phần"
function splitLatex(text = '') {
  const parts = [];
  let rest = String(text);
  const regex = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/;
  while (rest.length) {
    const mt = rest.match(regex);
    if (!mt) { parts.push({ type: 'text', value: rest }); break; }
    if (mt.index > 0) parts.push({ type: 'text', value: rest.slice(0, mt.index) });
    if (mt[1] !== undefined) parts.push({ type: 'math', value: mt[1], display: true });
    else parts.push({ type: 'math', value: mt[2], display: false });
    rest = rest.slice(mt.index + mt[0].length);
  }
  return parts;
}

// Trả về mảng children (TextRun + ImportedXmlComponent OMML) để nhét vào Paragraph
export function latexRuns(text, runOpts = {}) {
  const children = [];
  for (const p of splitLatex(text)) {
    if (p.type === 'text') {
      if (p.value) children.push(new TextRun({ text: p.value, size: 26, font: 'Times New Roman', ...runOpts }));
    } else {
      const omml = texToOmml(p.value, p.display);
      if (omml) {
        try {
          children.push(ImportedXmlComponent.fromXmlString(omml));
          continue;
        } catch { /* fallback dưới */ }
      }
      // Nếu convert lỗi → giữ nguyên LaTeX dạng text để không mất nội dung
      children.push(new TextRun({ text: p.value, size: 26, font: 'Times New Roman', italics: true, ...runOpts }));
    }
  }
  return children;
}
