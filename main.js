(() => {
  'use strict';
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- детерминированный генератор для царапин ---------- */
  const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  function scratches(svg, count, seed, w, h) {
    const r = rng(seed);
    let out = '';
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
    svg.innerHTML = out;
  }

  const heroScr = $('#scratches');
  if (heroScr) scratches(heroScr, 46, 12345, 400, 520);
  const benchScr = $('#benchScr');
  if (benchScr) scratches(benchScr, 70, 4242, 400, 500);

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

  /* ---------- шапка, меню ---------- */
  const top = $('#top'), burger = $('#burger'), nav = $('#nav');
  const setMenu = (open) => {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- щит: стекло очищается ---------- */
  const pane = $('#pane');
  const heroArt = $('#heroArt');
  let autoP = reduce ? 0.55 : 0;           // проигрывается при загрузке
  let scrollP = 0;
  let sx = -60, sxTarget = -60;
  const applyPane = () => {
    const p = Math.max(autoP, scrollP);
    pane.style.setProperty('--p', p.toFixed(3));
  };
  if (!reduce) {
    const t0 = performance.now();
    const play = (t) => {
      const k = clamp((t - t0 - 500) / 2200);
      autoP = 0.5 * (1 - Math.pow(1 - k, 3));
      sx = -60 + 130 * k; pane.style.setProperty('--sx', sx + '%');
      applyPane();
      if (k < 1) requestAnimationFrame(play);
    };
    requestAnimationFrame(play);
    heroArt.parentElement.addEventListener('pointermove', (e) => {
      const r = pane.getBoundingClientRect();
      sxTarget = clamp((e.clientX - r.left) / r.width, -0.3, 1.3) * 80 - 20;
    });
    const follow = () => {
      sx += (sxTarget - sx) * 0.08;
      if (autoP >= 0.5) pane.style.setProperty('--sx', sx.toFixed(1) + '%');
      requestAnimationFrame(follow);
    };
    setTimeout(() => { sxTarget = 30; follow(); }, 3000);
  }

  /* ---------- scroll-линк: общая функция ---------- */
  /* ---------- «Как работаем»: экран закреплён, прокрутка ведёт анимацию ---------- */
  const proc = $('#process');
  const bench = $('#bench');
  const stepEls = $$('#steps .step');
  const phaseEl = $('#benchPhase');
  const barEl = $('#benchBar');
  const grind = $('.tool--grind', bench);
  const polish = $('.tool--polish', bench);
  const phaseNames = ['I · Осмотр', 'II · Шлифовка', 'III · Полировка', 'IV · Контроль'];
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const tri = (x) => 1 - Math.abs(((x % 2) + 2) % 2 - 1);  // треугольная волна 0..1
  let curPhase = -1;

  function benchFrame(vh) {
    const r = proc.getBoundingClientRect();
    const span = r.height - vh;
    if (span <= 0) return;
    const P = clamp(-r.top / span) * 4;          // 0..4: четыре этапа
    const s = bench.style;
    // I. осмотр: боковой свет проходит по стеклу, царапины проявляются
    s.setProperty('--light', (-40 + 150 * clamp(P / 0.9)).toFixed(1) + '%');
    s.setProperty('--scr', ((0.3 + 0.7 * ss(0, 0.6, P)) * (1 - ss(1.1, 1.9, P))).toFixed(3));
    // II. шлифовка: круг идёт змейкой, царапины уходят, стекло матовеет
    const u1 = clamp(P - 1);
    grind.style.opacity = (ss(0.88, 1.08, P) * (1 - ss(1.9, 2.05, P))).toFixed(3);
    grind.style.setProperty('--tx', (24 + 52 * tri(u1 * 5)).toFixed(1) + '%');
    grind.style.setProperty('--ty', (22 + 56 * u1).toFixed(1) + '%');
    grind.style.setProperty('--rot', (P * 1100).toFixed(0) + 'deg');
    // III. полировка: войлок ходит кругами, матовость уходит
    const u2 = clamp(P - 2);
    polish.style.opacity = (ss(1.95, 2.12, P) * (1 - ss(2.9, 3.05, P))).toFixed(3);
    polish.style.setProperty('--tx', (50 + 24 * Math.sin(u2 * Math.PI * 6)).toFixed(1) + '%');
    polish.style.setProperty('--ty', (26 + 48 * u2 + 9 * Math.cos(u2 * Math.PI * 6)).toFixed(1) + '%');
    polish.style.setProperty('--rot', (P * 700).toFixed(0) + 'deg');
    s.setProperty('--haze', (0.9 * ss(1.1, 1.85, P) * (1 - ss(2.08, 2.92, P))).toFixed(3));
    // IV. контроль: блик по чистому стеклу и отметка
    s.setProperty('--shine', (-60 + 200 * clamp((P - 3.02) / 0.6)).toFixed(1) + '%');
    s.setProperty('--ok', ss(3.45, 3.75, P).toFixed(3));
    barEl.style.setProperty('--bp', (P / 4).toFixed(4));

    const ph = Math.min(3, Math.floor(P));
    if (ph !== curPhase) {
      curPhase = ph;
      phaseEl.textContent = phaseNames[ph];
      stepEls.forEach((el, i) => el.classList.toggle('is-on', i === ph));
    }
  }

  let ticking = false;

  function frame() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const docH = document.documentElement.scrollHeight - vh;

    top.classList.toggle('is-stuck', y > 20);
    root.style.setProperty('--prog', docH > 0 ? (y / docH).toFixed(4) : 0);

    if (!reduce) {
      // мрамор плывёт медленнее контента
      root.style.setProperty('--bgy', (-y * 0.06).toFixed(1) + 'px');
      ['.myth', '.process', '.contact'].forEach((sel, i) => {
        const el = $(sel);
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty(['--bgy2', '--bgy3', '--bgy4'][i], (-r.top * 0.08).toFixed(1) + 'px');
      });
    }

    // очистка стекла в герое: за первые ~70% высоты экрана
    scrollP = clamp(y / (vh * 0.7));
    applyPane();

    if (proc && !reduce) benchFrame(vh);
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  /* ---------- метка «макет» ---------- */
  const tag = $('#mockTag');
  $('button', tag).addEventListener('click', () => { tag.hidden = true; });
})();
