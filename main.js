(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- детерминированный генератор для царапин ---------- */
  const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function scratches(svg, count, seed, w, h, mode = 0) {
    const r = rng(seed);
    let out = '';
    if (mode === 1) {
      // дуги от дворников и мелкие сколы на лобовом стекле
      for (let s = 0; s < 2; s++) {
        const cx = w * (0.28 + s * 0.44), cy = h * 1.18, R0 = h * 0.65;
        const a0 = -Math.PI / 2 - 0.65, a1 = -Math.PI / 2 + 0.45;
        for (let k = 0; k < 18; k++) {
          const R = R0 + (r() - 0.5) * 90, b0 = a0 + r() * 0.25, b1 = a1 - r() * 0.25;
          const x1 = cx + Math.cos(b0) * R, y1 = cy + Math.sin(b0) * R;
          const x2 = cx + Math.cos(b1) * R, y2 = cy + Math.sin(b1) * R;
          const op = (0.22 + r() * 0.48).toFixed(2), sw = (0.5 + r() * 0.9).toFixed(2);
          out += `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} A${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="rgba(255,255,255,${op})" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
        }
      }
      for (let i = 0; i < 24; i++) {
        const cx = r() * w, cy = r() * h, rad = (0.7 + r() * 1.8).toFixed(1);
        out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad}" fill="rgba(255,255,255,${(0.35 + r() * 0.45).toFixed(2)})"/>`;
      }
    } else if (mode === 2) {
      // вертикальные полосы от стеклоподъёмника и косые царапины на боковом стекле
      for (let i = 0; i < Math.round(count * 0.55); i++) {
        const x = w * (0.1 + r() * 0.8), y = r() * h * 0.45, y2 = y + 60 + r() * h * 0.45;
        const op = (0.22 + r() * 0.45).toFixed(2), sw = (0.5 + r() * 0.9).toFixed(2);
        out += `<path d="M${x.toFixed(1)} ${y.toFixed(1)} L${(x + (r() - 0.5) * 6).toFixed(1)} ${Math.min(h, y2).toFixed(1)}" stroke="rgba(255,255,255,${op})" stroke-width="${sw}" fill="none" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < Math.round(count * 0.45); i++) {
        const x = r() * w, y = r() * h, len = 30 + r() * w * 0.38, a = (r() - 0.5) * 0.8 + 0.35;
        const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, bend = (r() - 0.5) * 24;
        const col = r() > 0.35 ? '255,255,255' : '40,70,80';
        out += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}Q${((x + x2) / 2 + bend).toFixed(1)} ${((y + y2) / 2 - bend).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="rgba(${col},${(0.25 + r() * 0.55).toFixed(2)})" stroke-width="${(0.5 + r()).toFixed(2)}" fill="none" stroke-linecap="round"/>`;
      }
    } else {
      // диагональные следы пескоструя/абразива + пятна водного камня на стеклопакете
      for (let i = 0; i < count; i++) {
        const x = r() * w, y = r() * h;
        const len = 40 + r() * w * 0.55;
        const a = (r() - 0.5) * 1.1 + (r() > 0.6 ? 1.3 : 0.15);
        const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
        const bend = (r() - 0.5) * 40;
        const op = 0.25 + r() * 0.6;
        const sw = 0.5 + r() * 1.1;
        const col = r() > 0.35 ? '255,255,255' : '40,70,80';
        out += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}Q${((x + x2) / 2 + bend).toFixed(1)} ${((y + y2) / 2 - bend).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="rgba(${col},${op.toFixed(2)})" stroke-width="${sw.toFixed(2)}" fill="none" stroke-linecap="round"/>`;
      }
      for (let i = 0; i < 16; i++) {
        const cx = r() * w, cy = r() * h, rad = (3 + r() * 10).toFixed(1);
        out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rad}" fill="rgba(255,255,255,${(0.06 + r() * 0.08).toFixed(2)})" stroke="rgba(255,255,255,${(0.18 + r() * 0.22).toFixed(2)})" stroke-width="0.7"/>`;
      }
    }
    svg.innerHTML = out;
  }

  $$('.ba__scr').forEach((s, i) => scratches(s, 38 + i * 6, 777 + i * 91, 400, 260, i));

  /* ---------- появление при прокрутке ---------- */
  const revealEls = $$('[data-reveal]');
  // ступенчатая задержка у соседей в одном контейнере
  const seen = new Map();
  revealEls.forEach((el) => {
    const p = el.parentElement;
    const n = seen.get(p) || 0;
    seen.set(p, n + 1);
    el.style.setProperty('--d', Math.min(n, 5));
  });
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
    // запасной путь: если IntersectionObserver задержан (фоновая вкладка), проверяем вручную
    const sweep = () => {
      if (revealEls.every((el) => el.classList.contains('in'))) { removeEventListener('scroll', sweep); return; }
      const vh = innerHeight;
      revealEls.forEach((el) => {
        if (el.classList.contains('in')) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add('in');
      });
    };
    addEventListener('scroll', sweep, { passive: true });
    setTimeout(sweep, 300); setTimeout(sweep, 1200);
  }

  root.dataset.ready = '1';   // скрытый до появления текст уже под присмотром скрипта

  /* ---------- шапка, меню ---------- */
  const top = $('#top'), burger = $('#burger'), nav = $('#nav');
  const behindMenu = [$('main'), $('.foot'), $('.brand', top)];
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    behindMenu.forEach((el) => { el.inert = open; });
    // меню становится видимым со следующим кадром — до этого фокус не встанет
    if (open) setTimeout(() => { if (nav.classList.contains('open')) $('a', nav).focus({ preventScroll: true }); }, 60);
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); burger.focus(); }
  });
  addEventListener('resize', () => { if (!matchMedia('(max-width: 820.98px)').matches && nav.classList.contains('open')) setMenu(false); });

  /* ---------- щит: стекло и мрамор полируются при скролле ---------- */
  const pane = $('#pane');
  const heroArt = $('#heroArt');
  const heroBadge = $('#heroBadge');
  const paneBar = $('#paneBar');
  let scrollP = 0;
  let currentP = reduce ? 1 : 0;
  let hoverOffset = 0, hoverTarget = 0;
  let animatingP = false, following = false, lastPaneT = 0;

  const renderPane = () => {
    heroArt.classList.toggle('is-clean', currentP > 0.97);
    pane.style.setProperty('--p', currentP.toFixed(4));
    heroArt.style.setProperty('--p', currentP.toFixed(4));
    if (paneBar) paneBar.style.setProperty('--p', currentP.toFixed(4));
    const sx = -32 + 164 * currentP + hoverOffset;
    pane.style.setProperty('--sx', sx.toFixed(1) + '%');
    if (heroBadge) {
      heroBadge.textContent = currentP < 0.08
        ? 'До полировки'
        : currentP > 0.94
          ? 'Зеркальная гладь'
          : 'Полировка · ' + Math.round(currentP * 100) + '%';
    }
  };

  const stepPane = (t) => {
    const dt = lastPaneT ? Math.min(64, t - lastPaneT) : 16;
    lastPaneT = t;
    const targetP = reduce ? 1 : scrollP;
    const diff = targetP - currentP;
    if (Math.abs(diff) < 0.0008) {
      currentP = targetP;
      animatingP = false;
      lastPaneT = 0;
    } else {
      const step = diff * (1 - Math.exp(-dt / 480));
      const maxStep = (dt / 1000) * 0.45;
      currentP += Math.sign(step) * Math.min(Math.abs(step), maxStep);
      requestAnimationFrame(stepPane);
    }
    renderPane();
  };

  const applyPane = () => {
    if (reduce) {
      currentP = 1;
      renderPane();
      return;
    }
    if (!animatingP) {
      animatingP = true;
      requestAnimationFrame(stepPane);
    }
  };

  if (!reduce) {
    const follow = () => {
      hoverOffset += (hoverTarget - hoverOffset) * 0.08;
      following = Math.abs(hoverTarget - hoverOffset) > 0.05;
      if (!following) hoverOffset = hoverTarget;
      renderPane();
      if (following) requestAnimationFrame(follow);
    };
    heroArt.parentElement.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = pane.getBoundingClientRect();
      const nx = clamp((e.clientX - r.left) / r.width, 0, 1);
      const ny = clamp((e.clientY - r.top) / r.height, 0, 1);
      hoverTarget = (nx - 0.5) * 16;
      pane.style.setProperty('--rx', ((0.5 - ny) * 4.4).toFixed(2) + 'deg');
      pane.style.setProperty('--ry', ((nx - 0.5) * 4.4).toFixed(2) + 'deg');
      if (!following) { following = true; requestAnimationFrame(follow); }
    });
    heroArt.parentElement.addEventListener('pointerleave', () => {
      pane.style.setProperty('--rx', '0deg');
      pane.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- «Как работаем»: экран закреплён, прокрутка ведёт анимацию ---------- */
  const proc = $('#process');
  const bench = $('#bench');
  const stepEls = $$('#steps .step');
  const phaseEl = $('#benchPhase');
  const barEl = $('#benchBar');
  const pctEl = $('#benchPct');
  const grind = $('.tool--grind', bench);
  const polish = $('.tool--polish', bench);
  const phaseNames = ['I · Осмотр', 'II · Шлифовка', 'III · Полировка', 'IV · Контроль'];
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const tri = (x) => 1 - Math.abs(((x % 2) + 2) % 2 - 1);  // треугольная волна 0..1
  let curPhase = -1;

  if (proc) {
    stepEls.forEach((el, i) => {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      const go = () => {
        const r = proc.getBoundingClientRect();
        const span = r.height - innerHeight;
        if (span <= 0) return;
        const targetY = scrollY + r.top + ((i + 0.45) / 4) * span;
        scrollTo({ top: targetY, behavior: reduce ? 'auto' : 'smooth' });
      };
      el.addEventListener('click', go);
      el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  // траектории кругов (доли ширины/высоты стекла): змейка, проходящая всё стекло до самых углов
  const AR = 1.25; // высота/ширина стекла 4:5
  const polyline = (pts) => {
    const d = [0];
    for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], (pts[i][1] - pts[i - 1][1]) * AR));
    const L = d[d.length - 1];
    return (u) => {
      const s = clamp(u) * L; let i = 1;
      while (i < d.length - 1 && d[i] < s) i++;
      const t = (s - d[i - 1]) / ((d[i] - d[i - 1]) || 1), a = pts[i - 1], b = pts[i];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    };
  };
  const snake = (rows, x0, x1, y0, y1) => {
    const p = [];
    for (let k = 0; k < rows; k++) {
      const y = y0 + (y1 - y0) * k / (rows - 1);
      p.push(k % 2 ? [x1, y] : [x0, y], k % 2 ? [x0, y] : [x1, y]);
    }
    return p;
  };
  const grindAt = polyline(snake(6, 0.06, 0.94, 0.06, 0.94));
  // войлок: вертикальная змейка с круговыми движениями поверх
  const polishBase = polyline(snake(5, 0.94, 0.06, 0.06, 0.94).map(([x, y]) => [y, x]));
  const polishAt = (u) => {
    const [x, y] = polishBase(u), a = u * Math.PI * 2 * 22;
    return [clamp(x + 0.045 * Math.cos(a), 0.04, 0.96), clamp(y + 0.04 * Math.sin(a), 0.04, 0.96)];
  };

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const benchPane = proc ? $('.bench__pane', bench) : null;
  const benchImg = proc ? $('.bench__view', bench) : null;
  const cvMatte = $('#benchMatte'), cvScr = $('#benchScr'), cvFx = $('#benchFx');
  let W = 0, H = 0, S = 1, ready = false;
  let scrBase, frostBase, brush, maskC;
  const st = { P: -1, drawnP: -2, gn: 0, pn: 0, fade: -1, gOp: 0, pOp: 0, g: [0, 0], p: [0, 0] };

  // мягкая кисть — отпечаток круга
  function makeBrush(r) {
    const c = mk(r * 2, r * 2), x = c.getContext('2d');
    const g = x.createRadialGradient(r, r, 0, r, r, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.62, 'rgba(0,0,0,.95)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, r * 2, r * 2);
    return c;
  }

  // шумовая плитка для зерна
  function noiseTile(n, a) {
    const c = mk(n, n), x = c.getContext('2d'), d = x.createImageData(n, n);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = Math.random() * a;
    }
    x.putImageData(d, 0, 0); return c;
  }

  // кадрирование как object-fit: cover
  function drawCover(x, img, w, h) {
    const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
    x.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  /* дефекты: глубокие царапины с бликом и тенью, сколы-«чаттер», дуги от дворников, налёт «водный камень» */
  function buildScratches(cw = W, ch = H, seed = 4242) {
    const W = cw, H = ch;
    const c = mk(W, H), x = c.getContext('2d'), r = rng(seed), u = Math.min(W, H) / 400;
    for (let i = 0; i < 26; i++) {   // неравномерная серая плёнка
      const cx = r() * W, cy = r() * H, rad = (40 + r() * 140) * u;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, `rgba(225,222,212,${(0.05 + r() * 0.08).toFixed(3)})`); g.addColorStop(1, 'rgba(225,222,212,0)');
      x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 46; i++) {   // «водный камень»: мягкие минеральные пятна с плотной каймой
      const cx = r() * W, cy = H * 0.12 + r() * H * 0.88, rad = (4 + r() * r() * 22) * u, k = 0.5 + r() * 0.5;
      for (let j = 0; j < 3; j++) {
        const ox = cx + (r() - 0.5) * rad * 0.5, oy = cy + (r() - 0.5) * rad * 0.5, rr = rad * (0.7 + r() * 0.5);
        const g = x.createRadialGradient(ox, oy, 0, ox, oy, rr);
        g.addColorStop(0, `rgba(236,234,226,${(0.03 * k).toFixed(3)})`);
        g.addColorStop(0.72, `rgba(236,234,226,${(0.07 * k).toFixed(3)})`);
        g.addColorStop(0.9, `rgba(246,244,236,${(0.2 * k).toFixed(3)})`);
        g.addColorStop(1, 'rgba(246,244,236,0)');
        x.fillStyle = g; x.beginPath(); x.ellipse(ox, oy, rr, rr * (0.75 + r() * 0.3), r() * 3, 0, 7); x.fill();
      }
    }
    for (let s = 0; s < 3; s++) {    // дуги от дворников
      const cx = W * (0.2 + r() * 0.6), cy = H * (1.05 + r() * 0.3), R0 = H * (0.55 + r() * 0.35);
      const a0 = -Math.PI / 2 - 0.9 + r() * 0.4, a1 = a0 + 0.9 + r() * 0.8;
      for (let k = 0; k < 22; k++) {
        const R = R0 + (r() - 0.5) * 60 * u, b0 = a0 + r() * 0.5, b1 = a1 - r() * 0.5;
        x.beginPath(); x.arc(cx, cy, R, b0, b1);
        x.lineWidth = (0.3 + r() * 0.5) * u; x.strokeStyle = `rgba(255,255,255,${(0.06 + r() * 0.14).toFixed(3)})`; x.stroke();
      }
    }
    x.lineCap = 'round';
    const deep = (x0, y0, len, a, wmax) => {   // непрерывная борозда: сужение к концам, тень, светлая сердцевина, ореол, сколы
      const n = Math.max(12, Math.round(len / (4 * u)));
      const pts = []; let px = x0, py = y0, ang = a;
      for (let i = 0; i <= n; i++) {
        pts.push([px, py, wmax * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * i / n)), 0.6) * (0.75 + r() * 0.35)]);
        ang += (r() - 0.5) * 0.05; px += Math.cos(ang) * len / n; py += Math.sin(ang) * len / n;
      }
      const pass = (dx, dy, kw, col, blur) => {
        x.filter = blur ? `blur(${blur}px)` : 'none'; x.strokeStyle = col; x.lineCap = 'butt';
        for (let i = 0; i < n; i++) {
          x.beginPath(); x.moveTo(pts[i][0] + dx, pts[i][1] + dy); x.lineTo(pts[i + 1][0] + dx, pts[i + 1][1] + dy);
          x.lineWidth = Math.max(0.3 * u, (pts[i][2] + pts[i + 1][2]) / 2 * kw); x.stroke();
        }
      };
      pass(0, 0, 3.2, 'rgba(255,252,240,.07)', 2.5 * u);          // ореол рассеяния
      pass(0.8 * u, 1 * u, 1.25, 'rgba(18,22,24,.28)', 0);         // тень от кромки
      pass(0, 0, 1, 'rgba(236,236,230,.55)', 0);                   // тело борозды
      pass(-0.3 * u, -0.3 * u, 0.4, 'rgba(255,255,252,.95)', 0);   // блик на кромке
      x.filter = 'none';
      for (let i = 2; i < n - 2; i++) if (r() > 0.88) {           // сколы-раковины по краю
        const [cx, cy, w] = pts[i], s2 = (r() > 0.5 ? 1 : -1), aa = Math.atan2(pts[i + 1][1] - cy, pts[i + 1][0] - cx) + s2 * Math.PI / 2;
        const d = w * (0.6 + r()), L = (1 + r() * 2.2) * u;
        x.beginPath(); x.moveTo(cx, cy);
        x.lineTo(cx + Math.cos(aa) * (d + L) + Math.cos(aa + 1.3) * L, cy + Math.sin(aa) * (d + L) + Math.sin(aa + 1.3) * L);
        x.lineTo(cx + Math.cos(aa) * (d + L) - Math.cos(aa + 1.3) * L, cy + Math.sin(aa) * (d + L) - Math.sin(aa + 1.3) * L);
        x.closePath(); x.fillStyle = `rgba(255,255,250,${(0.3 + r() * 0.35).toFixed(2)})`; x.fill();
      }
    };
    for (let i = 0; i < 9; i++) deep(r() * W, r() * H, (90 + r() * 260) * u, (r() - 0.5) * 1.2 + (r() > 0.5 ? 0.6 : -2.4), (1.1 + r() * 1.6) * u);
    for (let i = 0; i < 3; i++) {    // «чаттер»: цепочка серповидных сколов
      let px = r() * W, py = r() * H; const a = r() * 6.28, n = 14 + r() * 18;
      for (let k = 0; k < n; k++) {
        px += Math.cos(a) * 4.2 * u; py += Math.sin(a) * 4.2 * u;
        x.beginPath(); x.arc(px, py, (1.6 + r()) * u, a + Math.PI / 2 - 1, a + Math.PI / 2 + 1);
        x.lineWidth = 0.7 * u; x.strokeStyle = 'rgba(255,255,248,.6)'; x.stroke();
      }
    }
    for (let i = 0; i < 260; i++) {  // волосяные
      const x0 = r() * W, y0 = r() * H, l = (6 + r() * 60) * u, a = r() * 6.28;
      x.beginPath(); x.moveTo(x0, y0);
      x.quadraticCurveTo(x0 + Math.cos(a) * l / 2 + (r() - 0.5) * 6 * u, y0 + Math.sin(a) * l / 2, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l);
      x.lineWidth = (0.25 + r() * 0.45) * u; x.strokeStyle = `rgba(255,255,255,${(0.1 + r() * 0.28).toFixed(2)})`; x.stroke();
    }
    return c;
  }

  /* первый экран: те же объёмные царапины на canvas вместо плоских линий */
  const heroScr = $('#scratches');
  if (heroScr) {
    const hc = document.createElement('canvas');
    hc.className = 'arch__scr'; hc.id = 'scratches'; hc.setAttribute('aria-hidden', 'true');
    hc.style.mixBlendMode = 'normal';
    heroScr.replaceWith(hc);
    const paint = () => {
      const k = Math.min(2, devicePixelRatio || 1), w = Math.round(hc.clientWidth * k), h = Math.round(hc.clientHeight * k);
      if (!w || !h || (w === hc.dataset.w * 1 && h === hc.dataset.h * 1)) return;
      hc.dataset.w = w; hc.dataset.h = h;
      hc.width = w; hc.height = h;
      hc.getContext('2d').drawImage(buildScratches(w, h, 12345), 0, 0);
    };
    paint();
    let hz; addEventListener('resize', () => { clearTimeout(hz); hz = setTimeout(paint, 250); });
  }

  /* матовое стекло после шлифовки: размытие, молочная плёнка, зерно, круговые риски */
  function buildFrost() {
    const c = mk(W, H), x = c.getContext('2d'), r = rng(99), u = Math.min(W, H) / 400;
    if (typeof x.filter === 'string') {
      x.filter = `blur(${Math.round(7 * u)}px) brightness(1.18) saturate(.5)`;
      drawCover(x, benchImg, W, H); x.filter = 'none';
    } else {
      // Safari до 18 не умеет filter на canvas: размываем ступенчатым уменьшением и обратным растяжением
      let small = mk(W, H);
      drawCover(small.getContext('2d'), benchImg, W, H);
      const down = [];
      while (small.width > W / Math.max(4, 14 * u) && small.width > 8 && small.height > 8) {
        const next = mk(Math.ceil(small.width / 2), Math.ceil(small.height / 2));
        next.getContext('2d').drawImage(small, 0, 0, next.width, next.height);
        down.push([small.width, small.height]); small = next;
      }
      while (down.length) {
        const next = mk(...down.pop());
        next.getContext('2d').drawImage(small, 0, 0, next.width, next.height);
        small = next;
      }
      x.drawImage(small, 0, 0);
      x.fillStyle = 'rgba(255,255,255,.15)'; x.fillRect(0, 0, W, H);
    }
    x.fillStyle = 'rgba(232,229,222,.52)'; x.fillRect(0, 0, W, H);
    x.fillStyle = x.createPattern(noiseTile(96, 70), 'repeat'); x.fillRect(0, 0, W, H);
    for (let i = 0; i < 520; i++) {
      const cx = r() * W, cy = r() * H, R = (18 + r() * 70) * u, a = r() * 6.28;
      x.beginPath(); x.arc(cx, cy, R, a, a + 0.4 + r() * 1.6);
      x.lineWidth = (0.3 + r() * 0.6) * u; x.strokeStyle = `rgba(255,255,255,${(0.07 + r() * 0.16).toFixed(2)})`; x.stroke();
    }
    return c;
  }

  /* фактуры инструментов: алмазная «черепашка» и войлочный круг с церием */
  function toolTex(kind) {
    const n = 360, c = mk(n, n), x = c.getContext('2d'), m = n / 2, r = rng(kind === 'g' ? 7 : 11);
    const disc = (rad, fill) => { x.beginPath(); x.arc(m, m, rad, 0, 7); x.fillStyle = fill; x.fill(); };
    let g = x.createRadialGradient(m - 30, m - 40, 10, m, m, m);   // резиновая опорная тарелка
    g.addColorStop(0, '#3b3835'); g.addColorStop(1, '#141312'); disc(m - 2, g);
    if (kind === 'g') {
      // стальная тарелка с концентрической проточкой
      g = x.createConicGradient ? x.createConicGradient(0.6, m, m) : x.createLinearGradient(0, 0, n, n);   // старый Safari
      [['#6d6b67', 0], ['#b9b6b0', 0.12], ['#5c5a56', 0.3], ['#a7a49e', 0.52], ['#4e4c49', 0.7], ['#b3b0aa', 0.86], ['#6d6b67', 1]].forEach(([c0, o]) => g.addColorStop(o, c0));
      disc(m - 10, g);
      x.save(); x.beginPath(); x.arc(m, m, m - 10, 0, 7); x.clip();
      for (let rr = 40; rr < m; rr += 1.6) { x.beginPath(); x.arc(m, m, rr, 0, 7); x.lineWidth = 0.6; x.strokeStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${(r() * 0.12).toFixed(2)})`; x.stroke(); }
      // алмазные сегменты на смоле: кольца шестиугольников, между ними каналы для воды
      const hex = (cx, cy, rr, rot) => { x.beginPath(); for (let i = 0; i < 6; i++) { const a = rot + i * Math.PI / 3; x[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); };
      [[m * 0.38, 9, 15], [m * 0.6, 14, 17], [m * 0.82, 19, 18]].forEach(([R, cnt, sz], ri) => {
        for (let i = 0; i < cnt; i++) {
          const a = i / cnt * Math.PI * 2 + ri * 0.17, cx = m + Math.cos(a) * R, cy = m + Math.sin(a) * R;
          x.save(); x.translate(3, 4); hex(cx, cy, sz, a); x.fillStyle = 'rgba(0,0,0,.45)'; x.fill(); x.restore();
          const hg = x.createLinearGradient(cx - sz, cy - sz, cx + sz, cy + sz);
          hg.addColorStop(0, '#4a4a48'); hg.addColorStop(1, '#1c1c1b');
          hex(cx, cy, sz, a); x.fillStyle = hg; x.fill();
          x.lineWidth = 1.2; x.strokeStyle = 'rgba(255,255,255,.18)'; x.stroke();
          for (let k = 0; k < 26; k++) {   // зерно алмаза
            const t = r() * 6.28, d = r() * sz * 0.8;
            x.fillStyle = `rgba(235,240,245,${(0.25 + r() * 0.6).toFixed(2)})`;
            x.fillRect(cx + Math.cos(t) * d, cy + Math.sin(t) * d, 1 + r(), 1 + r());
          }
        }
      });
      // мокрая плёнка и шлам
      g = x.createRadialGradient(m, m, m * 0.3, m, m, m);
      g.addColorStop(0, 'rgba(210,214,212,0)'); g.addColorStop(0.85, 'rgba(210,214,212,.12)'); g.addColorStop(1, 'rgba(225,228,226,.35)');
      x.fillStyle = g; x.fillRect(0, 0, n, n);
      g = x.createLinearGradient(0, 0, n, n); g.addColorStop(0.12, 'rgba(255,255,255,.35)'); g.addColorStop(0.32, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, n, n);
      x.restore();
    } else {
      g = x.createRadialGradient(m - 30, m - 40, 20, m, m, m - 8);
      g.addColorStop(0, '#f2ece0'); g.addColorStop(1, '#cfc4b0'); disc(m - 8, g);
      x.save(); x.beginPath(); x.arc(m, m, m - 8, 0, 7); x.clip();
      for (let i = 0; i < 3200; i++) {   // ворс
        const px = r() * n, py = r() * n, a = r() * 6.28, l = 3 + r() * 7;
        x.beginPath(); x.moveTo(px, py);
        x.quadraticCurveTo(px + Math.cos(a + 1) * l / 2, py + Math.sin(a + 1) * l / 2, px + Math.cos(a) * l, py + Math.sin(a) * l);
        x.lineWidth = 0.7; x.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(150,130,100,.25)'; x.stroke();
      }
      for (let i = 0; i < 14; i++) {     // пятна суспензии церия
        const px = m + (r() - 0.5) * n * 0.75, py = m + (r() - 0.5) * n * 0.75, rr = 12 + r() * 36;
        g = x.createRadialGradient(px, py, 0, px, py, rr);
        g.addColorStop(0, 'rgba(226,196,186,.55)'); g.addColorStop(1, 'rgba(226,196,186,0)');
        x.fillStyle = g; x.fillRect(px - rr, py - rr, rr * 2, rr * 2);
      }
      x.restore();
    }
    g = x.createLinearGradient(m - 30, m - 30, m + 30, m + 30);   // гайка
    g.addColorStop(0, '#d9d6d0'); g.addColorStop(0.5, '#7b7873'); g.addColorStop(1, '#3a3835');
    x.beginPath();
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; x[i ? 'lineTo' : 'moveTo'](m + Math.cos(a) * 30, m + Math.sin(a) * 30); }
    x.closePath(); x.fillStyle = g; x.fill(); disc(11, '#1a1918');
    return c.toDataURL('image/webp', 0.85);
  }

  function setupBench() {
    if (!benchPane.clientWidth || !benchImg.naturalWidth) return;
    const s = Math.min(2, devicePixelRatio || 1);
    const w = Math.round(benchPane.clientWidth * s), h = Math.round(benchPane.clientHeight * s);
    if (!h || (ready && w === W && h === H)) return;   // адресная строка телефона шлёт resize без смены размера стекла
    S = s; W = w; H = h;
    [cvMatte, cvScr, cvFx].forEach((c) => { c.width = W; c.height = H; });
    scrBase = buildScratches(); frostBase = buildFrost();
    brush = makeBrush(Math.round(W * 0.2)); maskC = mk(W, H);
    if (!ready) {
      $('i', grind).style.backgroundImage = `url(${toolTex('g')})`;
      $('i', polish).style.backgroundImage = `url(${toolTex('p')})`;
    }
    ready = true; st.drawnP = -2; st.gn = st.pn = -1; st.fade = -1; drawBench();
  }

  // отпечатки кисти вдоль траектории: только шаги from..to
  const STEPS = 480;
  const stamps = (u) => (u > 0 ? Math.floor(u * STEPS) + 1 : 0);
  function stampPath(x, at, from, to) {
    const b = brush.width / 2;
    for (let i = from; i < to; i++) {
      const [px, py] = at(i / STEPS);
      x.drawImage(brush, px * W - b, py * H - b);
    }
  }

  // вперёд дорисовываем новые отпечатки; назад — перерисовываем только изменившийся слой
  function drawBench() {
    if (!ready || st.P === st.drawnP) return;
    const P = st.P; st.drawnP = P;
    const gn = stamps(clamp(P - 1)), pn = stamps(clamp(P - 2)), fade = 1 - ss(2.75, 3.0, P);
    const xs = cvScr.getContext('2d'), xk = maskC.getContext('2d');
    const fresh = st.gn < 0;
    let g0 = st.gn, p0 = st.pn;
    if (fresh || gn < g0) {
      xs.globalCompositeOperation = 'source-over'; xs.clearRect(0, 0, W, H); xs.drawImage(scrBase, 0, 0);
      g0 = 0;
    }
    // царапины снимаются шлифовальным кругом
    xs.globalCompositeOperation = 'destination-out'; stampPath(xs, grindAt, g0, gn);
    // матовость остаётся следом шлифовки и уходит под войлоком
    let mg = g0;
    if (fresh || gn < st.gn || pn < p0) {
      xk.globalCompositeOperation = 'source-over'; xk.clearRect(0, 0, W, H);
      mg = p0 = 0;
    }
    xk.globalCompositeOperation = 'source-over'; stampPath(xk, grindAt, mg, gn);
    xk.globalCompositeOperation = 'destination-out'; stampPath(xk, polishAt, p0, pn);
    if (!fresh && gn === st.gn && pn === st.pn && fade === st.fade) return;
    st.gn = gn; st.pn = pn; st.fade = fade;
    const xm = cvMatte.getContext('2d');
    xm.globalCompositeOperation = 'source-over'; xm.globalAlpha = 1; xm.clearRect(0, 0, W, H);
    if (gn && fade > 0) {
      xm.drawImage(maskC, 0, 0);
      xm.globalCompositeOperation = 'source-in'; xm.globalAlpha = fade; xm.drawImage(frostBase, 0, 0);
      xm.globalAlpha = 1;
    }
  }

  // частицы: пыль с водой от шлифовки, капли церия от войлока; круги крутятся всё время
  const parts = [];
  const hotspots = [[0.34, 0.30], [0.60, 0.50], [0.44, 0.72]];
  let rotG = 0, rotP = 0, lastT = 0, inView = false, fxRun = false;
  const toolsShown = () => st.gOp > 0.01 || st.pOp > 0.01;
  const stage1Active = () => st.P >= 0 && st.P < 1.05;
  function startFx() {
    if (fxRun || !inView || !(toolsShown() || stage1Active())) return;
    fxRun = true; requestAnimationFrame(fxLoop);
  }
  function fxLoop(t) {
    if (!inView || !(toolsShown() || stage1Active() || parts.length)) { lastT = 0; fxRun = false; return; }
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016; lastT = t;
    rotG += dt * 1400; rotP += dt * 900;
    grind.style.setProperty('--rot', (rotG % 360).toFixed(0) + 'deg');
    polish.style.setProperty('--rot', (rotP % 360).toFixed(0) + 'deg');
    const jit = () => ((Math.random() - 0.5) * 0.8).toFixed(2) + 'px';
    grind.style.translate = st.gOp > 0.05 ? `${jit()} ${jit()}` : '';
    if (ready) {
      const x = cvFx.getContext('2d'), R = W * 0.17;
      const emit = (op, [cx, cy], kind) => {
        if (op < 0.3) return;
        for (let i = 0; i < (kind === 'g' ? 5 : 3); i++) {
          const a = Math.random() * 6.28, sp = ((kind === 'g' ? 120 : 60) + Math.random() * 160) * S;
          parts.push({ x: cx * W + Math.cos(a) * R, y: cy * H + Math.sin(a) * R, vx: -Math.sin(a) * sp, vy: Math.cos(a) * sp,
            life: 0, max: kind === 'g' ? 0.5 + Math.random() * 0.6 : 1.4 + Math.random(), k: kind,
            s: (kind === 'g' ? 0.6 + Math.random() * 1.6 : 1 + Math.random() * 2.2) * S });
        }
      };
      emit(st.gOp, st.g, 'g'); emit(st.pOp, st.p, 'p');
      x.clearRect(0, 0, W, H);
      // I. осмотр: при прохождении бокового луча подсвечиваем ключевые очаги дефектов
      if (stage1Active()) {
        const beamCenter = -0.4 + 1.5 * clamp(st.P / 0.9) + 0.17;
        const fadeOut = 1 - ss(0.88, 1.05, st.P);
        hotspots.forEach(([hx, hy], idx) => {
          const dist = Math.abs(hx - beamCenter);
          const vis = clamp(1 - dist / 0.32) * fadeOut;
          if (vis < 0.03) return;
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.005 + idx * 1.9);
          const rad = (14 + pulse * 8) * S;
          x.beginPath(); x.arc(hx * W, hy * H, rad, 0, 7);
          x.lineWidth = 1.4 * S;
          x.strokeStyle = `rgba(201, 164, 98, ${(vis * 0.72).toFixed(3)})`;
          x.stroke();
          x.beginPath(); x.arc(hx * W, hy * H, 2.5 * S, 0, 7);
          x.fillStyle = `rgba(255, 246, 220, ${(vis * 0.9).toFixed(3)})`;
          x.fill();
        });
      }
      // II–III. мягкий мокрый ореол контакта / суспензии церия под активным кругом
      const drawHalo = (op, [cx, cy], col) => {
        if (op < 0.15) return;
        const px = cx * W, py = cy * H, hr = R * 1.05;
        const g = x.createRadialGradient(px, py, R * 0.55, px, py, hr);
        g.addColorStop(0, `rgba(${col}, 0)`);
        g.addColorStop(0.65, `rgba(${col}, ${(0.22 * op).toFixed(3)})`);
        g.addColorStop(1, `rgba(${col}, 0)`);
        x.fillStyle = g;
        x.beginPath(); x.arc(px, py, hr, 0, 7); x.fill();
      };
      drawHalo(st.gOp, st.g, '226, 224, 216');
      drawHalo(st.pOp, st.p, '240, 212, 198');
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i]; q.life += dt;
        if (q.life > q.max) { parts.splice(i, 1); continue; }
        const k = Math.pow(q.k === 'g' ? 0.9 : 0.8, dt * 10); q.vx *= k; q.vy *= k;
        q.x += q.vx * dt; q.y += q.vy * dt;
        const f = 1 - q.life / q.max;
        x.beginPath(); x.arc(q.x, q.y, q.s, 0, 7);
        x.fillStyle = q.k === 'g' ? `rgba(236,234,226,${(0.55 * f).toFixed(3)})` : `rgba(240,214,204,${(0.7 * f).toFixed(3)})`;
        x.fill();
        if (q.k === 'p') {
          x.beginPath(); x.arc(q.x - q.s * 0.3, q.y - q.s * 0.3, q.s * 0.35, 0, 7);
          x.fillStyle = `rgba(255,255,255,${(0.8 * f).toFixed(3)})`; x.fill();
        }
      }
      if (parts.length > 600) parts.splice(0, parts.length - 600);
    }
    requestAnimationFrame(fxLoop);
  }

  if (proc && !reduce) {
    if (benchImg.complete && benchImg.naturalWidth) setupBench(); else benchImg.addEventListener('load', setupBench, { once: true });
    let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (ready) setupBench(); }, 250); });
    new IntersectionObserver((es) => {
      inView = es[es.length - 1].isIntersecting;
      startFx();
    }).observe(proc);
  }

  // прогресс не прыгает за колесом мыши, а плавно догоняет прокрутку
  let pTarget = 0, pCur = -1, pRun = false, pLast = 0;
  function benchFrame(vh) {
    const r = proc.getBoundingClientRect();
    const span = r.height - vh;
    if (span <= 0) return;
    pTarget = clamp(-r.top / span) * 4;          // 0..4: четыре этапа
    if (pCur < 0 || Math.abs(pTarget - pCur) > 1.5) { pCur = pTarget; benchRender(pCur); return; }
    if (!pRun) { pRun = true; pLast = performance.now(); requestAnimationFrame(benchEase); }
  }
  function benchEase(t) {
    const dt = Math.min(64, t - pLast); pLast = t;
    const d = pTarget - pCur;
    pCur += d * (1 - Math.exp(-dt / 190));       // ~0.19 с постоянная времени
    if (Math.abs(d) < 0.0008) pCur = pTarget;
    benchRender(pCur);
    if (pCur !== pTarget) requestAnimationFrame(benchEase); else pRun = false;
  }
  function benchRender(P) {
    const s = bench.style;
    // I. осмотр: боковой свет проходит по стеклу, дефекты вспыхивают в луче
    s.setProperty('--light', (-40 + 150 * clamp(P / 0.9)).toFixed(1) + '%');
    s.setProperty('--scr', ((0.45 + 0.55 * ss(0, 0.6, P)) * (1 - ss(1.85, 2.02, P))).toFixed(3));
    // II. шлифовка: круг идёт змейкой
    const u1 = clamp(P - 1);
    st.gOp = ss(0.88, 1.08, P) * (1 - ss(1.9, 2.05, P));
    st.g = grindAt(u1);
    grind.style.opacity = st.gOp.toFixed(3);
    grind.style.setProperty('--tx', (st.g[0] * 100).toFixed(2) + '%');
    grind.style.setProperty('--ty', (st.g[1] * 100).toFixed(2) + '%');
    // III. полировка: войлок ходит кругами
    const u2 = clamp(P - 2);
    st.pOp = ss(1.95, 2.12, P) * (1 - ss(2.9, 3.05, P));
    st.p = polishAt(u2);
    polish.style.opacity = st.pOp.toFixed(3);
    polish.style.setProperty('--tx', (st.p[0] * 100).toFixed(2) + '%');
    polish.style.setProperty('--ty', (st.p[1] * 100).toFixed(2) + '%');
    // IV. контроль: блик по чистому стеклу, цвет возвращается
    s.setProperty('--shine', (-60 + 200 * clamp((P - 3.02) / 0.6)).toFixed(1) + '%');
    s.setProperty('--ok', ss(3.45, 3.75, P).toFixed(3));
    s.setProperty('--clean', ss(2.9, 3.4, P).toFixed(3));
    barEl.style.setProperty('--bp', (P / 4).toFixed(4));
    if (pctEl) pctEl.textContent = Math.round(clamp(P / 4) * 100) + '%';
    st.P = Math.round(P * 400) / 400;
    drawBench();
    startFx();

    const ph = Math.min(3, Math.floor(P));
    stepEls.forEach((el, i) => {
      el.classList.toggle('is-on', i === ph);
      el.classList.toggle('is-done', i < ph);
      el.style.setProperty('--sp', clamp(P - i).toFixed(3));
    });
    if (ph !== curPhase) {
      curPhase = ph;
      phaseEl.textContent = phaseNames[ph];
    }
  }

  let ticking = false;
  const progressEl = $('.progress'), mythEl = $('.myth'), contactEl = $('.contact');
  const meanders = $$('.meander'), mirrorArch = $('#mirrorArch'), heroMirror = $('#heroMirror');

  function frame() {
    ticking = false;
    // сначала все замеры, потом запись стилей
    const y = window.scrollY;
    const vh = window.innerHeight;
    const docH = root.scrollHeight - vh;
    const mythY = reduce ? 0 : mythEl.getBoundingClientRect().top;
    const contactY = reduce ? 0 : contactEl.getBoundingClientRect().top;
    if (proc && !reduce) benchFrame(vh);

    top.classList.toggle('is-stuck', y > 20);
    progressEl.style.setProperty('--prog', docH > 0 ? (y / docH).toFixed(4) : 0);

    if (!reduce) {
      // мрамор плывёт медленнее контента
      mythEl.style.setProperty('--bgy2', (-mythY * 0.05).toFixed(1) + 'px');
      contactEl.style.setProperty('--bgy4', (-contactY * 0.08).toFixed(1) + 'px');
      meanders.forEach((m, i) => m.style.setProperty('--mx', ((i % 2 ? -1 : 1) * y * 0.15).toFixed(1) + 'px'));
      if (mirrorArch) mirrorArch.style.setProperty('--sx', (-30 + 150 * clamp(y / (vh * 0.55))).toFixed(1) + '%');
      if (heroMirror) {
        let mc = 0;
        if (window.innerWidth > 960) {
          mc = clamp((y - 10) / (vh * 0.36));
        } else {
          const hmr = heroMirror.getBoundingClientRect();
          mc = y <= 8 ? 0 : clamp((vh * 0.48 - hmr.top) / (vh * 0.36));
        }
        heroMirror.style.setProperty('--mc', mc.toFixed(3));
      }
    }

    // полировка мрамора в закреплённой секции «Мрамор и стекло» (#mif)
    const mr = mythEl.getBoundingClientRect();
    const mSpan = mr.height - vh;
    let rawP = 0;
    if (mSpan > 20) {
      rawP = clamp((-mr.top - mSpan * 0.1) / (mSpan * 0.76));
    } else {
      const pr = pane.getBoundingClientRect();
      rawP = y <= 8 ? 0 : clamp((vh * 0.64 - pr.top) / (vh * 0.50));
    }
    scrollP = rawP * rawP * (3 - 2 * rawP);
    applyPane();
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  /* ---------- ползунок «до / после» ---------- */
  $$('[data-ba]').forEach((fig) => {
    const stage = $('.ba__stage', fig);
    const range = $('.ba__range', fig);
    const set = (v) => stage.style.setProperty('--pos', v + '%');
    let touched = false;   // человек взялся за ползунок — подсказка больше не вмешивается
    range.addEventListener('pointerdown', () => { touched = true; });
    range.addEventListener('input', () => { touched = true; set(range.value); });
    set(range.value);
    if (reduce || !('IntersectionObserver' in window)) return;
    // один раз показываем, что ползунок двигается
    const hint = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return;
      hint.disconnect();
      const t0 = performance.now();
      const run = (t) => {
        const k = clamp((t - t0) / 1800);
        const v = 50 + Math.sin(k * Math.PI * 2) * 28 * (1 - k * 0.2);
        if (touched || document.activeElement === range) return;
        set(v.toFixed(1)); range.value = v;
        if (k < 1) requestAnimationFrame(run); else { set(50); range.value = 50; }
      };
      setTimeout(() => requestAnimationFrame(run), 500);
    }, { threshold: 0.6 });
    hint.observe(fig);
  });

})();
