// 마음서랍 성과 화면용 작은 차트들 (외부 라이브러리 없이 SVG/HTML)
// - 선은 2px, 표식은 8px, 축·격자는 흐리게, 값 글자는 항상 잉크색(시리즈 색 X)
// - 모든 차트는 마우스를 올리거나 탭하면 툴팁으로 정확한 값을 보여줌

const INK = '#3b2c22', INK_2 = '#6a5646', INK_3 = '#9a8571', GRID = 'rgba(90, 55, 30, .12)';

let tipEl = null;
function tip() {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'mc-tip';
    tipEl.setAttribute('role', 'status');
    Object.assign(tipEl.style, {
      position: 'fixed', zIndex: 200, pointerEvents: 'none', opacity: 0, transition: 'opacity 120ms',
      background: INK, color: '#fff', padding: '8px 11px', borderRadius: '10px', font: '500 12.5px/1.5 "Noto Sans KR", sans-serif',
      boxShadow: '0 4px 14px rgba(0,0,0,.18)', whiteSpace: 'nowrap'
    });
    document.body.appendChild(tipEl);
  }
  return tipEl;
}
export function showTip(html, x, y) {
  const t = tip();
  t.innerHTML = html;
  t.style.opacity = 1;
  const w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = Math.min(window.innerWidth - w - 8, Math.max(8, x - w / 2)) + 'px';
  t.style.top = Math.max(8, y - h - 12) + 'px';
}
export function hideTip() { if (tipEl) tipEl.style.opacity = 0; }

const svgEl = (tag, attrs, parent) => {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 꺾은선 + (선택) 목표선. points: [{ label, value, sub }], value는 0~yMax
export function lineChart(el, { points, yMax, target, targetLabel, color = '#2f7d66', fmt = v => v, height = 220, yTicks = 4, highlightLast = true, ariaLabel = '' }) {
  el.textContent = '';
  // 실제 표시 폭으로 그려야 폰에서도 글자가 작아지지 않음 (숨겨진 탭 안이면 폭이 0이라 폰 폭으로 가정)
  const W = Math.max(280, Math.round(el.clientWidth || 320)), H = height, L = 40, R = 14, T = 18, B = 34;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': ariaLabel, style: 'display:block;overflow:visible' }, el);
  const x = i => L + (points.length === 1 ? (W - L - R) / 2 : i * (W - L - R) / (points.length - 1));
  const y = v => T + (1 - v / yMax) * (H - T - B);

  for (let k = 0; k <= yTicks; k++) {
    const v = (yMax / yTicks) * k;
    svgEl('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: GRID, 'stroke-width': 1 }, svg);
    const tx = svgEl('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end', fill: INK_3, 'font-size': 11 }, svg);
    tx.textContent = fmt(v);
  }
  points.forEach((p, i) => {
    const tx = svgEl('text', { x: x(i), y: H - 10, 'text-anchor': 'middle', fill: INK_2, 'font-size': 12 }, svg);
    tx.textContent = p.label;
  });
  if (target != null) {
    svgEl('line', { x1: L, x2: W - R, y1: y(target), y2: y(target), stroke: INK_2, 'stroke-width': 1.5, 'stroke-dasharray': '5 5' }, svg);
    const tl = svgEl('text', { x: W - R, y: y(target) - 7, 'text-anchor': 'end', fill: INK, 'font-size': 12, 'font-weight': 700 }, svg);
    tl.textContent = targetLabel || `목표 ${fmt(target)}`;
  }
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, svg);
  const dots = points.map((p, i) => svgEl('circle', { cx: x(i), cy: y(p.value), r: 4, fill: color, stroke: '#fffaf2', 'stroke-width': 2 }, svg));
  if (highlightLast && points.length) {
    const p = points[points.length - 1];
    const lab = svgEl('text', { x: x(points.length - 1), y: y(p.value) - 12, 'text-anchor': 'middle', fill: INK, 'font-size': 13, 'font-weight': 700 }, svg);
    lab.textContent = fmt(p.value);
  }
  // 넓은 투명 막대로 마우스/터치 영역을 크게
  const band = (W - L - R) / Math.max(1, points.length - 1);
  points.forEach((p, i) => {
    const hit = svgEl('rect', { x: x(i) - band / 2, y: T, width: band, height: H - T - B, fill: 'transparent', tabindex: 0, 'aria-label': `${p.label} ${fmt(p.value)}` }, svg);
    const on = e => {
      dots.forEach((c, j) => c.setAttribute('r', j === i ? 6 : 4));
      const r = (e.currentTarget || hit).getBoundingClientRect();
      showTip(`<b>${esc(p.label)}</b> · ${esc(fmt(p.value))}${p.sub ? `<br><span style="opacity:.8">${esc(p.sub)}</span>` : ''}`, r.left + r.width / 2, r.top + (y(p.value) - T) * (r.height / (H - T - B)));
    };
    const off = () => { dots.forEach(c => c.setAttribute('r', 4)); hideTip(); };
    hit.addEventListener('pointerenter', on);
    hit.addEventListener('pointerdown', on);
    hit.addEventListener('focus', on);
    hit.addEventListener('pointerleave', off);
    hit.addEventListener('blur', off);
  });
}

// 가로 막대 목록. rows: [{ label, value, color, valueText, note, highlight }]
export function barList(el, rows, { max, fmt = v => v, mark } = {}) {
  el.textContent = '';
  const m = max || Math.max(...rows.map(r => r.value), 1);
  rows.forEach(r => {
    const row = document.createElement('div');
    row.className = 'mc-bar-row' + (r.highlight ? ' is-me' : '');
    row.tabIndex = 0;
    const lab = document.createElement('div');
    lab.className = 'mc-bar-label';
    lab.textContent = r.label;
    const track = document.createElement('div');
    track.className = 'mc-bar-track';
    const fill = document.createElement('div');
    fill.className = 'mc-bar-fill';
    fill.style.width = Math.max(2, (r.value / m) * 100) + '%';
    fill.style.background = r.color || '#2f7d66';
    track.appendChild(fill);
    if (r.highlight && mark) {
      const pin = document.createElement('span');
      pin.className = 'mc-bar-pin';
      pin.textContent = mark;
      track.appendChild(pin);
    }
    const val = document.createElement('div');
    val.className = 'mc-bar-value';
    val.textContent = r.valueText != null ? r.valueText : fmt(r.value);
    row.append(lab, track, val);
    const on = () => { const b = fill.getBoundingClientRect(); showTip(`<b>${esc(r.label)}</b> · ${esc(val.textContent)}${r.note ? `<br><span style="opacity:.8">${esc(r.note)}</span>` : ''}`, b.right, b.top); };
    row.addEventListener('pointerenter', on);
    row.addEventListener('focus', on);
    row.addEventListener('pointerleave', hideTip);
    row.addEventListener('blur', hideTip);
    el.appendChild(row);
  });
}

// 100% 누적 가로 막대 한 줄. segments: [{ label, value, color }]
export function stackedBar(el, segments, { title } = {}) {
  el.textContent = '';
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const wrap = document.createElement('div');
  wrap.className = 'mc-stack';
  if (title) {
    const t = document.createElement('div');
    t.className = 'mc-stack-title';
    t.textContent = title;
    wrap.appendChild(t);
  }
  const bar = document.createElement('div');
  bar.className = 'mc-stack-bar';
  segments.forEach(s => {
    if (!s.value) return;
    const seg = document.createElement('div');
    seg.className = 'mc-stack-seg';
    seg.style.flex = String(s.value);
    seg.style.background = s.color;
    seg.tabIndex = 0;
    const pct = Math.round((s.value / total) * 100);
    if (pct >= 9) { const lab = document.createElement('span'); lab.textContent = pct + '%'; seg.appendChild(lab); }
    const on = () => { const b = seg.getBoundingClientRect(); showTip(`<b>${esc(s.label)}</b> · ${s.value}명 (${pct}%)`, b.left + b.width / 2, b.top); };
    seg.addEventListener('pointerenter', on);
    seg.addEventListener('focus', on);
    seg.addEventListener('pointerleave', hideTip);
    seg.addEventListener('blur', hideTip);
    bar.appendChild(seg);
  });
  wrap.appendChild(bar);
  el.appendChild(wrap);
}

// 표로 보기 (색을 못 구분해도 값을 읽을 수 있도록)
export function dataTable(el, headers, rows) {
  el.textContent = '';
  const t = document.createElement('table');
  t.className = 'mc-table';
  const tr = document.createElement('tr');
  headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; tr.appendChild(th); });
  const thead = document.createElement('thead'); thead.appendChild(tr);
  const tbody = document.createElement('tbody');
  rows.forEach(r => { const row = document.createElement('tr'); r.forEach(c => { const td = document.createElement('td'); td.textContent = c; row.appendChild(td); }); tbody.appendChild(row); });
  t.append(thead, tbody);
  el.appendChild(t);
}

export const MINI_CHART_CSS = `
.mc-bar-row { display: grid; grid-template-columns: minmax(84px, 30%) minmax(0, 1fr) 64px; align-items: center; gap: 10px; padding: 6px 4px; border-radius: 10px; outline: none; }
.mc-bar-row:focus-visible { box-shadow: 0 0 0 3px rgba(229,127,98,.45); }
.mc-bar-label { font-size: 13px; color: ${INK}; }
.mc-bar-track { position: relative; height: 16px; border-radius: 8px; background: rgba(90,55,30,.07); }
.mc-bar-fill { height: 100%; border-radius: 4px 8px 8px 4px; transform-origin: left; animation: mc-grow 700ms cubic-bezier(.22,1,.36,1); }
.mc-bar-value { font-size: 13px; font-weight: 700; color: ${INK}; text-align: right; font-variant-numeric: tabular-nums; }
.mc-bar-row.is-me .mc-bar-label { font-weight: 700; }
.mc-bar-pin { position: absolute; top: 50%; right: 6px; transform: translateY(-50%); padding: 2px 9px; border-radius: 10px; background: #fff; color: ${INK}; font-size: 11.5px; font-weight: 700; box-shadow: 0 1px 4px rgba(0,0,0,.15); }
@keyframes mc-grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.mc-stack { margin-bottom: 12px; }
.mc-stack-title { margin-bottom: 6px; font-size: 13px; font-weight: 700; color: ${INK_2}; }
.mc-stack-bar { display: flex; gap: 2px; height: 30px; border-radius: 8px; overflow: hidden; }
.mc-stack-seg { display: grid; place-items: center; min-width: 4px; color: #fff; font-size: 12px; font-weight: 700; outline: none; }
.mc-stack-seg:first-child span { color: ${INK}; }
.mc-stack-seg:focus-visible { box-shadow: inset 0 0 0 3px rgba(255,255,255,.8); }
.mc-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.mc-table th, .mc-table td { padding: 8px 10px; text-align: left; border-bottom: 1px solid rgba(90,55,30,.12); }
.mc-table th { color: ${INK_2}; font-weight: 700; }
@media (prefers-reduced-motion: reduce) { .mc-bar-fill { animation: none; } }
`;
