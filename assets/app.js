/* Crecer, medir y proyectar · Módulo 13 (AI1 y AI2)
   Material interactivo sin dependencias externas. */
(function () {
  'use strict';

  /* ===================== Utilidades ===================== */
  const $ = (id) => document.getElementById(id);
  const zero = (n) => (Math.abs(n) < 0.005 ? 0 : n);
  const group = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const money = (n) => { n = zero(n); return (n < 0 ? '−$' : '$') + group(String(Math.round(Math.abs(n)))); };
  const money2 = (n) => { n = zero(n); const t = Math.abs(n).toFixed(2).split('.'); return (n < 0 ? '−$' : '$') + group(t[0]) + '.' + t[1]; };
  const pct = (x) => String(Math.round(x * 100) / 100).replace(/\.0+$/, '') + ' %';
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const MESES_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const SVGNS = 'http://www.w3.org/2000/svg';
  function el(name, attrs, text) {
    const n = document.createElementNS(SVGNS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function setPressed(groupSel, btn) {
    document.querySelectorAll(groupSel + ' button').forEach((b) => {
      const on = b === btn; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    });
  }
  // Pago de una anualidad (mensualidad). P = monto, i = tasa por periodo, n = número de pagos.
  const pago = (P, i, n) => (i === 0 ? P / n : P * i / (1 - Math.pow(1 + i, -n)));

  /* ===================== Selector de actividades ===================== */
  const ACTS = { ai1: 'act1', ai2: 'act2' };
  function show(act) {
    Object.keys(ACTS).forEach((a) => {
      $(ACTS[a]).hidden = a !== act;
      if (a === act) $('sw-' + a).setAttribute('aria-current', 'page');
      else $('sw-' + a).removeAttribute('aria-current');
    });
  }
  function route() {
    let h = location.hash.slice(1);
    try { h = decodeURIComponent(h); } catch (e) { h = ''; }
    if (ACTS[h]) { show(h); window.scrollTo({ top: 0, behavior: 'instant' }); return; }
    const t = h ? document.getElementById(h) : null;
    const box = t && t.closest('.activity');
    show(box ? Object.keys(ACTS).find((a) => ACTS[a] === box.id) : 'ai1');
    if (t && box) t.scrollIntoView();
  }
  window.addEventListener('hashchange', route);
  route();

  /* ===================== Componentes compartidos ===================== */
  // Hoja de cálculo de muestra con fórmulas que se explican al hacer clic.
  function renderSheet(tableId, ftextId, fexpId, header, rows, FX) {
    const t = $(tableId);
    t.textContent = '';
    const hr = t.insertRow();
    header.forEach((h) => { const th = document.createElement('th'); th.textContent = h; hr.appendChild(th); });
    rows.forEach((r) => {
      const tr = t.insertRow();
      const rh = tr.insertCell(); rh.className = 'rh'; rh.textContent = r[0];
      r.slice(1).forEach((c) => {
        const cell = typeof c === 'object' && c !== null ? c : { t: c };
        const td = tr.insertCell();
        td.textContent = cell.t;
        if (cell.span) td.colSpan = cell.span;
        if (cell.cls) td.className = cell.cls;
        else if (/^=/.test(cell.t)) td.className = 'f';
        else if (/^dato/.test(cell.t)) td.className = 'inp';
        else if (cell.t === '…' || /^…/.test(cell.t)) { td.style.color = '#888'; td.style.fontFamily = "'Source Sans 3',sans-serif"; }
      });
    });
    t.querySelectorAll('td.f').forEach((td) => {
      td.tabIndex = 0;
      td.setAttribute('role', 'button');
      const showF = () => {
        t.querySelectorAll('td.sel').forEach((x) => x.classList.remove('sel'));
        td.classList.add('sel');
        const f = td.textContent.trim();
        $(ftextId).textContent = f;
        $(fexpId).textContent = FX[f] || '';
      };
      td.addEventListener('click', showF);
      td.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showF(); } });
    });
    $(ftextId).textContent = 'Selecciona una celda azul.';
    $(fexpId).textContent = 'Aquí aparecerá la explicación de la fórmula.';
  }

  function buildQuiz(containerId, Q) {
    const qz = $(containerId);
    Q.forEach((q, qi) => {
      const d = document.createElement('div'); d.className = 'q';
      const p = document.createElement('p'); p.textContent = `${qi + 1}. ${q.p}`; d.appendChild(p);
      const fb = document.createElement('div'); fb.className = 'fb'; fb.setAttribute('aria-live', 'polite');
      q.o.forEach((txt, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = txt;
        b.addEventListener('click', () => {
          d.querySelectorAll('button').forEach((x) => x.classList.remove('right', 'wrong'));
          b.classList.add(i === q.a ? 'right' : 'wrong');
          fb.textContent = (i === q.a ? '✅ ' : '↺ ') + q.f[i] + (i === q.a ? '' : ' Intenta otra opción.');
        });
        d.appendChild(b);
      });
      d.appendChild(fb); qz.appendChild(d);
    });
  }

  function buildChecklist(sectionId) {
    const sec = $(sectionId);
    const cbs = sec.querySelectorAll('.check input');
    const bar = sec.querySelector('.prog div'), wrap = sec.querySelector('.prog'), txt = sec.querySelector('.ptext');
    cbs.forEach((c) => c.addEventListener('change', () => {
      const n = [...cbs].filter((x) => x.checked).length;
      bar.style.width = (n / cbs.length * 100) + '%';
      wrap.setAttribute('aria-valuenow', n);
      txt.textContent = `${n} de ${cbs.length}` + (n === cbs.length ? ' · ¡Listo para entregar!' : '');
    }));
  }

  /* ===================== Gráficas reutilizables ===================== */
  function axes(svg, maxV, L, R, T, B, W, H, labels, fmtY) {
    const ys = (v) => H - B - v / maxV * (H - T - B);
    for (let k = 0; k <= 4; k++) {
      const v = maxV * k / 4, y = ys(v);
      svg.appendChild(el('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: '#eee' }));
      svg.appendChild(el('text', { x: L - 8, y: y + 4, 'font-size': 12, 'text-anchor': 'end', fill: '#5b6670' }, fmtY(v)));
    }
    const bw = (W - L - R) / labels.length;
    labels.forEach((lb, k) => svg.appendChild(el('text', { x: L + (k + 0.5) * bw, y: H - B + 18, 'font-size': 12, 'text-anchor': 'middle', fill: '#5b6670' }, lb)));
    return { ys, bw, xs: (k) => L + (k + 0.5) * bw };
  }
  function lineChart(svg, labels, series, opts = {}) {
    clear(svg);
    const W = 720, H = +svg.getAttribute('viewBox').split(' ')[3], L = 76, R = 16, T = 18, B = 32;
    const all = series.flatMap((s) => s.vals.filter((v) => v != null)).concat(opts.limit ? [opts.limit] : []);
    const maxV = (Math.max(...all, 1)) * 1.1;
    const { ys, xs } = axes(svg, maxV, L, R, T, B, W, H, labels, opts.fmtY || ((v) => group(String(Math.round(v)))));
    if (opts.limit) {
      const y = ys(opts.limit);
      svg.appendChild(el('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: '#c2492d', 'stroke-width': 2.5, 'stroke-dasharray': '7 5' }));
      svg.appendChild(el('text', { x: W - R, y: y - 6, 'font-size': 12.5, 'font-weight': 700, 'text-anchor': 'end', fill: '#c2492d' }, opts.limitLabel));
    }
    series.forEach((s) => {
      const pts = s.vals.map((v, k) => (v == null ? null : [xs(k), ys(v)])).filter(Boolean);
      if (s.bars) {
        const w = (W - L - R) / labels.length * 0.6;
        s.vals.forEach((v, k) => { if (v != null) svg.appendChild(el('rect', { x: xs(k) - w / 2, y: ys(v), width: w, height: H - B - ys(v), rx: 3, fill: s.colorAt ? s.colorAt(k) : s.color })); });
      } else {
        if (pts.length > 1) svg.appendChild(el('polyline', { fill: 'none', stroke: s.color, 'stroke-width': 3, points: pts.map((p) => p.join(',')).join(' ') }));
        pts.forEach((p) => svg.appendChild(el('circle', { cx: p[0], cy: p[1], r: 4.5, fill: '#fff', stroke: s.color, 'stroke-width': 2.5 })));
      }
    });
    return { ys, xs };
  }
  function groupedBars(svg, labels, series, fmtY) {
    clear(svg);
    const W = 720, H = 280, L = 76, R = 16, T = 18, B = 32;
    const maxV = Math.max(...series.flatMap((s) => s.vals)) * 1.15;
    const { ys, xs, bw } = axes(svg, maxV, L, R, T, B, W, H, labels, fmtY);
    const w = bw * 0.32;
    series.forEach((s, j) => s.vals.forEach((v, k) => {
      const x = xs(k) - w + j * w;
      svg.appendChild(el('rect', { x, y: ys(v), width: w - 2, height: H - B - ys(v), rx: 3, fill: s.color }));
      svg.appendChild(el('text', { x: x + (w - 2) / 2, y: ys(v) - 5, 'font-size': 11, 'text-anchor': 'middle', fill: s.color, 'font-weight': 700 }, v.toFixed(1)));
    }));
  }
  const pct2 = (x) => x.toFixed(2) + ' %';
  const n0 = (v) => group(String(Math.round(v)));

  /* ===================== AI1 · Lineal contra exponencial ===================== */
  (function idea() {
    const weeks = [0, 1, 2, 3, 4, 5, 6, 7];
    const lin = weeks.map((t) => 3 + 6 * t), exp = weeks.map((t) => 3 * Math.pow(3, t));
    const t = $('tIdea');
    const head = t.createTHead().insertRow();
    ['Semana', ...weeks].forEach((h) => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = h; head.appendChild(th); });
    const body = t.createTBody();
    [['Lineal: 3 + 6t', lin], ['Exponencial: 3 · 3^t', exp]].forEach(([lb, v]) => {
      const tr = body.insertRow();
      const c = tr.insertCell(); c.textContent = lb; c.style.fontFamily = "'Source Sans 3',sans-serif"; c.style.fontWeight = '600';
      v.forEach((x) => { tr.insertCell().textContent = n0(x); });
    });
    lineChart($('cIdea'), weeks.map(String), [{ vals: lin, color: '#5b6670' }, { vals: exp, color: '#1f8a5b' }]);
    $('cIdea').setAttribute('aria-label', `En la semana 7: lineal ${n0(lin[7])}, exponencial ${n0(exp[7])}.`);
  })();

  /* ===================== AI1 · Tabla y sustitución ===================== */
  const WEEKS = 8;
  let shownE = 0;
  const p0 = () => +$('p0').value, bf = () => +$('bf').value;
  const expRows = () => Array.from({ length: WEEKS }, (_, t) => ({ t, pw: Math.pow(bf(), t), P: p0() * Math.pow(bf(), t) }));

  function renderExp() {
    const P0 = p0(), b = bf(), rows = expRows();
    $('fModel').innerHTML = `<span class="nw">P = ${P0} · ${b}<sup>t</sup></span>`;
    const body = $('eBody');
    body.textContent = '';
    rows.slice(0, shownE).forEach((r, k) => {
      const tr = body.insertRow();
      if (k === shownE - 1) tr.className = 'hl';
      tr.insertCell().textContent = r.t;
      tr.insertCell().innerHTML = `${P0} · ${b}<sup>${r.t}</sup> = ${P0} · ${n0(r.pw)}`;
      tr.insertCell().textContent = n0(r.P);
    });
    $('eNext').disabled = shownE >= WEEKS;
    $('eAll').disabled = shownE >= WEEKS;
    const e = $('eExplain');
    if (!shownE) {
      e.textContent = 'Presiona “Calcular la siguiente semana”. Verás cómo se sustituye t en la fórmula.';
    } else {
      const r = rows[shownE - 1];
      const mult = r.t === 0 ? `${b}<sup>0</sup> = 1 (todo número elevado a 0 es 1)` : `${b}<sup>${r.t}</sup> = ${Array(r.t).fill(b).join(' × ')} = ${n0(r.pw)}`;
      e.innerHTML = `Semana ${r.t}: sustituye t = ${r.t}.<br>1. Primero la potencia: ${mult}<br>2. Después multiplica por la población inicial: ${P0} × ${n0(r.pw)} = <b>${n0(r.P)}</b>` +
        (r.t > 0 ? `<br><i>Comprueba: ${n0(rows[r.t - 1].P)} × ${b} = ${n0(r.P)}. Cada semana es la anterior multiplicada por ${b}.</i>` : '');
    }
    const vals = rows.map((r, k) => (k < shownE ? r.P : null));
    lineChart($('cExp'), rows.map((r) => String(r.t)), [{ vals, color: '#2b5d8a', bars: true }]);
    $('cExp').setAttribute('aria-label', shownE ? `Población por semana hasta la semana ${shownE - 1}.` : 'Gráfica vacía');
    renderLimit();
  }

  function renderLimit() {
    const lim = +$('lim').value, rows = expRows();
    const t = $('tLim');
    t.textContent = '';
    const head = t.createTHead().insertRow();
    ['Semana', 'Población', '¿Rebasa el límite?'].forEach((h) => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = h; head.appendChild(th); });
    const body = t.createTBody();
    const first = rows.find((r) => r.P > lim);
    rows.forEach((r) => {
      const tr = body.insertRow();
      if (first && r.t === first.t) tr.className = 'over';
      tr.insertCell().textContent = r.t;
      tr.insertCell().textContent = n0(r.P);
      tr.insertCell().textContent = r.P > lim ? (first.t === r.t ? 'Sí · primera vez' : 'Sí') : 'No';
    });
    $('limMsg').innerHTML = first
      ? `Con P = ${p0()} · ${bf()}<sup>t</sup> y un límite de ${n0(lim)}, la población se rebasa por primera vez en la <b>semana ${first.t}</b>. Exceso: ${n0(first.P)} − ${n0(lim)} = <b>${n0(first.P - lim)}</b> conejos.` +
        (first.t > 0 ? ` En la semana ${first.t - 1} había ${n0(rows[first.t - 1].P)}, todavía dentro del límite.` : '')
      : `Con estos datos la población no rebasa el límite de ${n0(lim)} en las semanas 0 a 7.`;
  }

  $('eNext').addEventListener('click', () => { shownE = Math.min(WEEKS, shownE + 1); renderExp(); });
  $('eAll').addEventListener('click', () => { shownE = WEEKS; renderExp(); });
  $('eReset').addEventListener('click', () => { shownE = 0; renderExp(); });
  ['p0', 'bf'].forEach((id) => $(id).addEventListener('change', () => { shownE = 0; renderExp(); }));
  $('lim').addEventListener('change', renderLimit);
  renderExp();

  renderSheet('sheet1', 'ftext1', 'fexp1', ['', 'A', 'B', 'C', 'D', 'E', 'F'], [
    ['1', { t: 'Semana', cls: 'lbl' }, { t: 'Sustitución en t', cls: 'lbl' }, { t: 'Resultado', cls: 'lbl' }, { t: '¿Rebasa?', cls: 'lbl' }, { t: 'Población inicial', cls: 'lbl' }, 'dato'],
    ['2', '0', '=$F$1&"·"&$F$2&"^"&A2', '=$F$1*$F$2^A2', '=SI(C2>$F$3,"Sí","No")', { t: 'Factor', cls: 'lbl' }, 'dato'],
    ['3', '=A2+1', '=$F$1&"·"&$F$2&"^"&A3', '=$F$1*$F$2^A3', '=SI(C3>$F$3,"Sí","No")', { t: 'Límite', cls: 'lbl' }, 'dato'],
    ['4', { t: '… copia la fila 3 hacia abajo hasta la semana 7 (fila 9) …', span: 4 }, '', ''],
    ['11', { t: 'Exceso', cls: 'lbl' }, '', '=C8-$F$3', '', '', '']
  ], {
    '=$F$1&"·"&$F$2&"^"&A2': 'Escribe la sustitución como texto (por ejemplo, 3·3^0) uniendo la población inicial, el factor y la semana con el símbolo &. Si prefieres, puedes escribir la sustitución a mano en cada fila.',
    '=$F$1&"·"&$F$2&"^"&A3': 'La misma sustitución para la siguiente semana. $F$1 y $F$2 quedan fijos al copiar; A3 cambia.',
    '=$F$1*$F$2^A2': 'Resultado: población inicial × factor elevado a la semana. La hoja calcula primero la potencia (^) y después multiplica.',
    '=$F$1*$F$2^A3': 'Resultado de la siguiente semana. Copia esta fila hacia abajo hasta la semana 7.',
    '=A2+1': 'Número de semana: aumenta de uno en uno al copiar.',
    '=SI(C2>$F$3,"Sí","No")': 'Compara la población con el límite y escribe Sí cuando lo rebasa. La primera fila con Sí es la semana que buscas.',
    '=SI(C3>$F$3,"Sí","No")': 'La misma comparación para la siguiente semana.',
    '=C8-$F$3': 'Exceso = población − límite. C8 es solo un ejemplo: usa la celda de la primera semana que dice Sí.'
  });

  buildQuiz('qz1', [
    {
      p: 'Una población de peces suma 20 cada mes. Otra se multiplica por 2 cada mes. ¿Cuál es exponencial?',
      o: ['La que suma 20 cada mes.', 'La que se multiplica por 2 cada mes.', 'Las dos, porque ambas crecen.'],
      a: 1,
      f: ['Sumar siempre la misma cantidad es crecimiento lineal.', 'Correcto. Multiplicar por el mismo factor en cada periodo es crecimiento exponencial.', 'Ambas crecen, pero de forma distinta: una suma y la otra multiplica.']
    },
    {
      p: 'En la fórmula P = 5 · 3^t, ¿cuánto vale P en la semana 2?',
      o: ['5 · 3 · 2 = 30', '5 · 3² = 5 · 9 = 45', '(5 · 3)² = 225'],
      a: 1,
      f: ['El 2 es un exponente, no un factor: 3² = 3 × 3.', 'Correcto. Primero la potencia (3² = 9) y luego se multiplica por 5.', 'No se multiplica primero: la potencia solo afecta al factor 3.']
    },
    {
      p: 'Un límite es de 200 animales. En la semana 4 hay 162 y en la semana 5 hay 486. ¿En qué semana se excede y por cuánto?',
      o: ['Semana 4, por 38.', 'Semana 5, por 286.', 'Semana 5, por 324.'],
      a: 1,
      f: ['En la semana 4 todavía no se rebasa: 162 es menor que 200.', 'Correcto. 486 − 200 = 286.', 'El exceso se calcula contra el límite: 486 − 200, no 486 − 162.']
    }
  ]);
  buildChecklist('lista1');

  /* ===================== AI2 · Datos ficticios ===================== */
  const YEARS = [2000, 2005, 2010, 2015, 2020];
  const MUN = [
    { n: 'Valle Verde', v: [48200, 53900, 58700, 66400, 73800], color: '#2b5d8a' },
    { n: 'Costa Azul', v: [31500, 36100, 41900, 46200, 52600], color: '#1f8a5b' }
  ];
  const PER = YEARS.slice(1).map((y, k) => `${YEARS[k]}–${y}`);
  const rate = (m, k) => (m.v[k + 1] - m.v[k]) / m.v[k];   // tasa del periodo k en decimal
  let ratesShown = false;

  // Paso 1: tasa paso a paso
  PER.forEach((p, k) => { const o = document.createElement('option'); o.value = k; o.textContent = p; $('tp').appendChild(o); });
  function renderTasa() {
    const k = +$('tp').value, m = MUN[0], vi = m.v[k], vf = m.v[k + 1], r = rate(m, k);
    $('tSteps').innerHTML =
      `Tasa = (${n0(vf)} − ${n0(vi)}) ÷ ${n0(vi)} × 100<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ${n0(vf - vi)} ÷ ${n0(vi)} × 100<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= ${r.toFixed(4)} × 100<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= <b>${pct2(r * 100)}</b><br>` +
      `<span style="font-family:'Source Sans 3',sans-serif">De ${YEARS[k]} a ${YEARS[k + 1]}, Valle Verde agregó ${n0(vf - vi)} viviendas: creció ${pct2(r * 100)}.</span>`;
  }
  $('tp').addEventListener('change', renderTasa);
  renderTasa();

  // Paso 2: tabla comparativa
  function renderData() {
    const t = $('tData');
    t.textContent = '';
    const h1 = t.createTHead().insertRow();
    ['Año', ...MUN.flatMap((m) => [`${m.n}: viviendas`, `${m.n}: tasa`])].forEach((h, i) => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = h; if (i) th.className = 'num'; h1.appendChild(th); });
    const body = t.createTBody();
    const minK = MUN.map((m) => PER.map((_, k) => rate(m, k)).reduce((a, r, k, arr) => (r < arr[a] ? k : a), 0));
    YEARS.forEach((y, i) => {
      const tr = body.insertRow();
      tr.insertCell().textContent = i === 0 ? y : `${y} (periodo ${PER[i - 1]})`;
      MUN.forEach((m, j) => {
        const c1 = tr.insertCell(); c1.className = 'num'; c1.textContent = n0(m.v[i]);
        const c2 = tr.insertCell(); c2.className = 'num';
        if (i === 0) c2.textContent = '';
        else if (!ratesShown) c2.textContent = '—';
        else { c2.textContent = pct2(rate(m, i - 1) * 100); if (minK[j] === i - 1) c2.classList.add('low'); }
      });
    });
    if (!ratesShown) { $('rMsg').textContent = 'Presiona “Calcular tasas” para ver la tasa de cada periodo.'; return; }
    const [a, b] = MUN;
    const k = 1;
    $('rMsg').innerHTML =
      `De ${PER[k]}: ${a.n} creció ${pct2(rate(a, k) * 100)} y ${b.n} ${pct2(rate(b, k) * 100)}; el de menor crecimiento fue <b>${rate(a, k) < rate(b, k) ? a.n : b.n}</b>.<br>` +
      `Periodo de menor crecimiento (en amarillo): ${a.n}, <b>${PER[minK[0]]}</b>; ${b.n}, <b>${PER[minK[1]]}</b>. No siempre coincide en los dos lugares, así que revisa cada uno y explica lo que observas.<br>` +
      `<i>Observa ${PER[3]}: ${a.n} agregó ${n0(a.v[4] - a.v[3])} viviendas y ${b.n} ${n0(b.v[4] - b.v[3])}, pero ${b.n} creció más en porcentaje (${pct2(rate(b, 3) * 100)} contra ${pct2(rate(a, 3) * 100)}).</i>`;
    renderGraph();
  }
  $('rCalc').addEventListener('click', () => { ratesShown = true; renderData(); });

  // Paso 3: gráficas
  let gKind = 'viv';
  function renderGraph() {
    if (gKind === 'viv') {
      lineChart($('cViv'), YEARS.map(String), MUN.map((m) => ({ vals: m.v, color: m.color })));
      $('cViv').setAttribute('aria-label', 'Viviendas por año en los dos municipios.');
      $('gMsg').innerHTML = 'Las dos líneas suben, pero no con la misma inclinación. Un tramo más <b>plano</b> indica menor crecimiento en ese periodo. Compara los tramos de 2005 a 2010.';
    } else {
      groupedBars($('cViv'), PER, MUN.map((m) => ({ vals: PER.map((_, k) => rate(m, k) * 100), color: m.color })), (v) => v.toFixed(0) + ' %');
      $('cViv').setAttribute('aria-label', 'Tasa de crecimiento por periodo en los dos municipios.');
      $('gMsg').innerHTML = 'Cada columna es la tasa de un periodo. La columna más baja de cada color es el periodo de menor crecimiento de ese municipio.';
    }
  }
  document.querySelectorAll('#gTabs button').forEach((b) => b.addEventListener('click', () => { setPressed('#gTabs', b); gKind = b.dataset.g; renderGraph(); }));
  renderData();
  renderGraph();

  // Paso 4: proyección
  PER.forEach((p, k) => { const o = document.createElement('option'); o.value = k; o.textContent = p; if (k === 3) o.selected = true; $('pt').appendChild(o); });
  const FUT = [2025, 2030, 2035, 2040, 2045, 2050];
  let shownP = 0;
  function renderProj() {
    const m = MUN[+$('pm').value], k = +$('pt').value, r = rate(m, k), V0 = m.v[4];
    const vals = FUT.map((_, j) => V0 * Math.pow(1 + r, j + 1));
    const body = $('pBody');
    body.textContent = '';
    const tr0 = body.insertRow();
    [2020, 'Año base (dato)', n0(V0)].forEach((v) => { tr0.insertCell().textContent = v; });
    vals.slice(0, shownP).forEach((v, j) => {
      const tr = body.insertRow();
      if (j === shownP - 1) tr.className = 'hl';
      tr.insertCell().textContent = FUT[j];
      tr.insertCell().textContent = `${n0(j ? vals[j - 1] : V0)} × (1 + ${r.toFixed(4)})`;
      tr.insertCell().textContent = n0(v);
    });
    $('pNext').disabled = shownP >= 6;
    $('pAll').disabled = shownP >= 6;
    $('pExplain').innerHTML = !shownP
      ? `Tasa de ${PER[k]} en ${m.n}: ${pct2(r * 100)} = ${r.toFixed(4)} en decimal. Presiona “Proyectar el siguiente periodo”.`
      : `Cada periodo de 5 años las viviendas se multiplican por (1 + ${r.toFixed(4)}) = ${(1 + r).toFixed(4)}.` +
        (shownP === 6 ? `<br>En una sola operación: ${n0(V0)} × ${(1 + r).toFixed(4)}<sup>6</sup> = <b>${n0(vals[5])}</b> viviendas en 2050. Da lo mismo que ir periodo por periodo.` : '');
    $('pWrong').innerHTML = `Multiplicar la tasa por 6 y aplicarla una sola vez: ${n0(V0)} × (1 + 6 × ${r.toFixed(4)}) = <b>${n0(V0 * (1 + 6 * r))}</b>. Así no se considera que cada periodo crece sobre lo que ya creció.`;
    $('pRight').innerHTML = `Aplicar la tasa en cada uno de los 6 periodos: ${n0(V0)} × ${(1 + r).toFixed(4)}<sup>6</sup> = <b>${n0(vals[5])}</b>. La diferencia es de ${n0(vals[5] - V0 * (1 + 6 * r))} viviendas.`;
  }
  $('pNext').addEventListener('click', () => { shownP = Math.min(6, shownP + 1); renderProj(); });
  $('pAll').addEventListener('click', () => { shownP = 6; renderProj(); });
  $('pReset').addEventListener('click', () => { shownP = 0; renderProj(); });
  ['pm', 'pt'].forEach((id) => $(id).addEventListener('change', () => { shownP = 0; renderProj(); }));
  renderProj();

  // Paso 6: modelo de documento y hoja
  (function docModel() {
    const m = MUN[1], k = 0, r = rate(m, k);
    const r3 = rate(m, 3), V0 = m.v[4];
    $('docModel').innerHTML = `<h4>Ejemplo: tasa de crecimiento de Costa Azul, ${PER[k]}</h4>
      <p><b>Fórmula:</b> Tasa = (Valor final − Valor inicial) ÷ Valor inicial × 100</p>
      <p><b>Sustitución:</b> Tasa = (${n0(m.v[1])} − ${n0(m.v[0])}) ÷ ${n0(m.v[0])} × 100 = ${n0(m.v[1] - m.v[0])} ÷ ${n0(m.v[0])} × 100</p>
      <p><b>Resultado:</b> ${pct2(r * 100)}</p>
      <p><b>Interpretación:</b> de 2000 a 2005 las viviendas de Costa Azul aumentaron ${pct2(r * 100)}.</p>
      <h4 style="margin-top:12px">Ejemplo: proyección de Costa Azul a 2050</h4>
      <p><b>Fórmula:</b> V<sub>2050</sub> = V<sub>2020</sub> × (1 + tasa)<sup>6</sup></p>
      <p><b>Sustitución:</b> V<sub>2050</sub> = ${n0(V0)} × (1 + ${r3.toFixed(4)})<sup>6</sup> = ${n0(V0)} × ${Math.pow(1 + r3, 6).toFixed(4)}</p>
      <p><b>Resultado:</b> ${n0(V0 * Math.pow(1 + r3, 6))} viviendas</p>`;
  })();
  renderSheet('sheet2', 'ftext2', 'fexp2', ['', 'A', 'B', 'C'], [
    ['1', { t: 'Año', cls: 'lbl' }, { t: 'Viviendas', cls: 'lbl' }, { t: 'Tasa del periodo', cls: 'lbl' }],
    ['2', '2000', 'dato', ''],
    ['3', '2005', 'dato', '=(B3-B2)/B2'],
    ['4', '2010', 'dato', '=(B4-B3)/B3'],
    ['5', '2015', 'dato', '=(B5-B4)/B4'],
    ['6', '2020', 'dato', '=(B6-B5)/B5'],
    ['8', { t: 'Viviendas en 2050', cls: 'lbl' }, '=B6*(1+C6)^6', ''],
    ['9', { t: '2025 (periodo por periodo)', cls: 'lbl' }, '=B6*(1+$C$6)', ''],
    ['10', { t: '2030', cls: 'lbl' }, '=B9*(1+$C$6)', ''],
    ['11', { t: '… copia hasta 2050 (fila 14) …', span: 3 }]
  ], {
    '=(B3-B2)/B2': 'Tasa de 2000 a 2005 = (valor final − valor inicial) ÷ valor inicial. Da el resultado en decimal: aplica formato de porcentaje a la columna C para verlo en %.',
    '=(B4-B3)/B3': 'Tasa de 2005 a 2010. Copia la fórmula hacia abajo para los demás periodos.',
    '=(B5-B4)/B4': 'Tasa de 2010 a 2015.',
    '=(B6-B5)/B5': 'Tasa de 2015 a 2020: la que se mantiene en la proyección.',
    '=B6*(1+C6)^6': 'Proyección a 2050 en una sola operación: viviendas de 2020 × (1 + tasa) elevado a 6 periodos de 5 años.',
    '=B6*(1+$C$6)': 'Proyección de 2025: viviendas de 2020 × (1 + tasa). $C$6 queda fijo al copiar.',
    '=B9*(1+$C$6)': 'Cada periodo parte del anterior. Al llegar a 2050 debe darte lo mismo que la celda B8.'
  });

  buildQuiz('qz2', [
    {
      p: 'Un municipio pasó de 20 000 a 23 000 viviendas. ¿Cuál es la tasa de crecimiento?',
      o: ['(23 000 − 20 000) ÷ 23 000 × 100 = 13.04 %', '(23 000 − 20 000) ÷ 20 000 × 100 = 15 %', '23 000 ÷ 20 000 = 1.15 %'],
      a: 1,
      f: ['Se divide entre el valor inicial, no el final.', 'Correcto. La diferencia se divide entre el valor inicial.', '1.15 es el factor de crecimiento; la tasa es 0.15, es decir, 15 %.']
    },
    {
      p: 'El lugar A agregó 8 000 viviendas (10 %) y el lugar B agregó 5 000 (14 %). ¿Cuál tuvo menor crecimiento?',
      o: ['El A, porque su tasa es menor.', 'El B, porque agregó menos viviendas.', 'Crecieron igual.'],
      a: 0,
      f: ['Correcto. La tasa compara el aumento con lo que había; A creció menos en proporción.', 'Agregar menos viviendas no significa crecer menos: hay que comparar las tasas.', 'Las tasas son distintas: 10 % y 14 %.']
    },
    {
      p: 'Si la tasa de un periodo de 5 años se mantiene, ¿cuántos periodos hay de 2020 a 2050?',
      o: ['30', '5', '6'],
      a: 2,
      f: ['30 son años; la tasa es de periodos de 5 años.', 'Cuenta: 2025, 2030, 2035, 2040, 2045 y 2050.', 'Correcto. 30 años ÷ 5 = 6 periodos.']
    }
  ]);
  buildChecklist('lista2');
})();
