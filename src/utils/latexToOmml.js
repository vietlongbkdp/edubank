// Chuyển LaTeX ($...$) trong văn bản thành TextRun Unicode THUẦN cho Word.
// KHÔNG dùng OMML/Math object → file .docx LUÔN hợp lệ, mở được 100%.
import { TextRun } from 'docx';

const SUP = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
  '+':'⁺','-':'⁻','=':'⁼','(':'⁽',')':'⁾','a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','i':'ⁱ','j':'ʲ',
  'k':'ᵏ','m':'ᵐ','n':'ⁿ','p':'ᵖ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ' };
const SUB = { '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
  '+':'₊','-':'₋','=':'₌','(':'₍',')':'₎','a':'ₐ','e':'ₑ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ',
  'm':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','x':'ₓ' };

const allMappable = (s, M) => [...s].length > 0 && [...s].every(c => M[c]);
const supify = (s) => allMappable(s, SUP) ? [...s].map(c => SUP[c]).join('') : `^${s.length > 1 ? '(' + s + ')' : s}`;
const subify = (s) => allMappable(s, SUB) ? [...s].map(c => SUB[c]).join('') : `_${s.length > 1 ? '(' + s + ')' : s}`;

const SYM = {
  '\\pi':'π','\\alpha':'α','\\beta':'β','\\gamma':'γ','\\Gamma':'Γ','\\Delta':'Δ','\\delta':'δ',
  '\\omega':'ω','\\Omega':'Ω','\\varphi':'φ','\\phi':'φ','\\theta':'θ','\\lambda':'λ','\\mu':'μ',
  '\\sigma':'σ','\\Sigma':'Σ','\\tau':'τ','\\rho':'ρ','\\epsilon':'ε','\\varepsilon':'ε',
  '\\infty':'∞','\\leq':'≤','\\le':'≤','\\geq':'≥','\\ge':'≥','\\neq':'≠','\\ne':'≠','\\approx':'≈','\\equiv':'≡',
  '\\times':'×','\\cdot':'·','\\div':'÷','\\pm':'±','\\mp':'∓','\\ast':'*',
  '\\Leftrightarrow':'⇔','\\Rightarrow':'⇒','\\rightarrow':'→','\\to':'→','\\leftrightarrow':'↔','\\mapsto':'↦',
  '\\in':'∈','\\notin':'∉','\\ni':'∋','\\subset':'⊂','\\subseteq':'⊆','\\supset':'⊃',
  '\\cup':'∪','\\cap':'∩','\\emptyset':'∅','\\varnothing':'∅','\\forall':'∀','\\exists':'∃',
  '\\angle':'∠','\\perp':'⊥','\\parallel':'∥','\\triangle':'△','\\circ':'°','\\degree':'°','\\prime':'′',
  '\\mathbb{R}':'ℝ','\\mathbb{N}':'ℕ','\\mathbb{Z}':'ℤ','\\mathbb{Q}':'ℚ','\\mathbb{C}':'ℂ',
  '\\sum':'∑','\\prod':'∏','\\int':'∫','\\oint':'∮','\\partial':'∂','\\nabla':'∇',
  '\\ldots':'…','\\dots':'…','\\cdots':'⋯','\\quad':'  ','\\qquad':'    ',
  '\\sin':'sin','\\cos':'cos','\\tan':'tan','\\cot':'cot','\\sec':'sec','\\csc':'csc',
  '\\ln':'ln','\\log':'log','\\lim':'lim','\\exp':'exp','\\min':'min','\\max':'max',
  '\\,':' ','\\;':' ','\\:':' ','\\!':'','\\ ':' ','\\\\':'  ','\\left':'','\\right':''
};

// Đọc 1 nhóm bắt đầu tại vị trí '{' (s[i]==='{'); trả [nội dung, vị trí sau '}']
function readBrace(s, i) {
  let depth = 1, j = i + 1, out = '';
  while (j < s.length && depth > 0) {
    if (s[j] === '{') depth++;
    else if (s[j] === '}') { depth--; if (!depth) break; }
    out += s[j++];
  }
  return [out, j + 1];
}

function mathToUnicode(input) {
  let s = input;

  // 1. Phân số — tìm \frac/\dfrac/\tfrac rồi đọc đúng {tử}{mẫu}
  let guard = 0;
  while (guard++ < 40) {
    const fm = s.match(/\\[dt]?frac\s*/);
    if (!fm) break;
    const cmdEnd = fm.index + fm[0].length;
    if (s[cmdEnd] !== '{') { s = s.slice(0, fm.index) + s.slice(cmdEnd); continue; }
    const [num, p1] = readBrace(s, cmdEnd);
    let q = p1; while (q < s.length && /\s/.test(s[q])) q++;
    if (s[q] !== '{') { s = s.slice(0, fm.index) + mathToUnicode(num) + s.slice(p1); continue; }
    const [den, p2] = readBrace(s, q);
    const uNum = mathToUnicode(num), uDen = mathToUnicode(den);
    const wrapN = /[+\-=±×·/ ]/.test(uNum) ? `(${uNum})` : uNum;
    const wrapD = /[+\-=±×·/ ]/.test(uDen) ? `(${uDen})` : uDen;
    s = s.slice(0, fm.index) + `${wrapN}/${wrapD}` + s.slice(p2);
  }

  // 2. Căn
  s = s.replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, (_, n, x) => `${supify(n)}√(${mathToUnicode(x)})`);
  guard = 0;
  while (guard++ < 20) {
    const idx = s.search(/\\sqrt\s*\{/);
    if (idx < 0) break;
    const braceAt = s.indexOf('{', idx);
    const [inner, p] = readBrace(s, braceAt);
    s = s.slice(0, idx) + `√(${mathToUnicode(inner)})` + s.slice(p);
  }

  // 3. Vector / overline
  s = s.replace(/\\(vec|overrightarrow)\s*\{([^{}]*)\}/g, (_, __, x) => x + '\u20D7');
  s = s.replace(/\\overline\s*\{([^{}]*)\}/g, (_, x) => [...x].join('\u0305') + '\u0305');

  // 4. \text / \mathrm / \operatorname
  s = s.replace(/\\(text|mathrm|mathit|mathbf|operatorname)\s*\{([^{}]*)\}/g, (_, __, x) => x);

  // 5. Ký hiệu \sqrt còn lẻ (không kèm {}) → √
  s = s.replace(/\\sqrt/g, '√');

  // 6. Ký hiệu (dài trước ngắn sau)
  for (const k of Object.keys(SYM).sort((a, b) => b.length - a.length)) s = s.split(k).join(SYM[k]);

  // 7. Lũy thừa & chỉ số
  s = s.replace(/\^\{([^{}]*)\}/g, (_, x) => supify(x));
  s = s.replace(/\^([A-Za-z0-9+\-=])/g, (_, x) => supify(x));
  s = s.replace(/_\{([^{}]*)\}/g, (_, x) => subify(x));
  s = s.replace(/_([A-Za-z0-9+\-=])/g, (_, x) => subify(x));

  // 8. Dọn
  s = s.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '');
  return s.replace(/[ \t]+/g, ' ').trim();
}

export function latexToUnicode(text = '') {
  return String(text).replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g,
    (_, a, b) => mathToUnicode(a || b)).replace(/[ \t]+/g, ' ');
}

export function latexRuns(text, runOpts = {}) {
  return [new TextRun({ text: latexToUnicode(text), size: 26, font: 'Times New Roman', ...runOpts })];
}
