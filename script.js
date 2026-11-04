(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- nav ---------- */
  const nav = $('#nav'), burger = $('#burger'), menu = $('#menu');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
  }));

  /* active link */
  const links = $$('.menu a[href^="#"]:not(.btn)');
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => spy.observe(s));

  /* ---------- tube-style cables (jacket, body, shine, travelling light) ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const FC = { f1: '#2563eb', f2: '#f97316', f3: '#22c55e', f4: '#8b5cf6', f5: '#06b6d4', f6: '#ec4899', f7: '#facc15', f8: '#e2e8f0' };
  function tubes(svg, defW) {
    $$('path', svg).filter(p => !p.closest('.tube')).forEach((p, i) => {
      const cls = [...p.classList].find(c => FC[c]); if (!cls) return;
      const col = FC[cls], w = +p.dataset.w || defW, d = p.getAttribute('d');
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'tube');
      const mk = (c, sw, extra = {}) => {
        const e = document.createElementNS(NS, 'path');
        e.setAttribute('d', d); e.setAttribute('pathLength', '100'); e.setAttribute('class', c); e.setAttribute('stroke-width', sw);
        for (const k in extra) e.setAttribute(k, extra[k]);
        return e;
      };
      const lit = mk('t-lit', w * .55); lit.style.color = col; lit.style.animationDelay = (-(i * 1.7) % 6) + 's'; lit.style.animationDuration = (4.5 + (i % 4)) + 's';
      g.append(mk('t-jacket', w + 5), mk('t-body', w, { stroke: col }), mk('t-shine', Math.max(1.5, w * .22)), lit);
      p.replaceWith(g);
    });
  }

  /* patch panel: RJ45 ports, LEDs and coloured patch cords */
  const patch = $('#patch');
  if (patch) {
    let h = '<rect x="2" y="4" width="996" height="64" rx="8" fill="#0a1220" stroke="#38507a" stroke-width="1.5"/>';
    for (let i = 0; i < 16; i++) {
      const x = 28 + i * 60;
      h += `<rect x="${x}" y="22" width="36" height="30" rx="3" fill="#03060b" stroke="#4a6491"/><path d="M${x + 7} 46v-8m4 8v-8m4 8v-8m4 8v-8m4 8v-8m4 8v-8" stroke="#b08d2a" stroke-width="1.4"/>` +
           `<circle class="pl ${i % 3 ? 'g' : 'o'}" style="animation-delay:${(i * .37 % 2).toFixed(2)}s" cx="${x + 9}" cy="14" r="2.4"/><circle class="pl g" style="animation-delay:${(i * .53 % 2).toFixed(2)}s" cx="${x + 27}" cy="14" r="2.4"/>`;
    }
    const cords = [[0, 'f1', 30], [2, 'f2', -20], [3, 'f3', 40], [5, 'f5', -30], [7, 'f6', 25], [9, 'f4', -35], [10, 'f7', 30], [12, 'f1', -25], [14, 'f3', 20]];
    cords.forEach(([i, c, dx]) => {
      const x = 28 + i * 60 + 18;
      h += `<path class="${c}" data-w="7" d="M${x} 50 C ${x} 105, ${x + dx} 80, ${x + dx} 136"/>`;
    });
    patch.innerHTML = h; tubes(patch, 7);
  }
  $$('.fibers').forEach(svg => tubes(svg, 6));
  $$('.hero-cables').forEach(svg => tubes(svg, 11));

  /* ---------- reveal + counters ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in'); io.unobserve(e.target);
    if (e.target.classList.contains('stats')) counters();
    if (e.target.classList.contains('plug')) e.target.classList.add('in');
  }), { threshold: .15 });
  $$('.reveal').forEach(el => io.observe(el));

  function counters() {
    $$('[data-count]').forEach(el => {
      const end = +el.dataset.count, plain = 'plain' in el.dataset;
      if (reduce) { el.textContent = end; return; }
      const t0 = performance.now(), dur = 1400;
      const step = t => {
        const k = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - k, 3)));
        el.textContent = plain ? v : v;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ---------- terminal typing ---------- */
  const term = $('#term');
  const lines = JSON.parse(term.dataset.lines);
  const render = n => {
    term.innerHTML = lines.slice(0, n).map(l => `<span class="${l.startsWith('$') ? 'cmd' : 'out'}">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>`).join('\n') + '<span class="cur"></span>';
  };
  if (reduce) render(lines.length);
  else {
    new IntersectionObserver((es, ob) => {
      if (!es[0].isIntersecting) return; ob.disconnect();
      let i = 0, c = 0;
      (function tick() {
        if (i >= lines.length) return;
        const l = lines[i], isCmd = l.startsWith('$');
        if (isCmd && c <= l.length) {
          const done = lines.slice(0, i).map(x => `<span class="${x.startsWith('$') ? 'cmd' : 'out'}">${x.replace(/&/g, '&amp;')}</span>`).join('\n');
          term.innerHTML = done + (i ? '\n' : '') + `<span class="cmd">${l.slice(0, c).replace(/&/g, '&amp;')}</span><span class="cur"></span>`;
          c++; return setTimeout(tick, 55);
        }
        i++; c = 0; render(i); setTimeout(tick, isCmd ? 260 : 420);
      })();
    }, { threshold: .4 }).observe(term);
  }

  /* ---------- photo tilt + project spotlight ---------- */
  const tilt = $('.tilt');
  if (tilt && !reduce && matchMedia('(hover:hover)').matches) {
    const box = tilt.parentElement;
    box.addEventListener('pointermove', e => {
      const r = box.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.02)`;
    });
    box.addEventListener('pointerleave', () => tilt.style.transform = '');
  }
  $$('.spot').forEach(c => c.addEventListener('pointermove', e => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    c.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* patch panel port LEDs */
  $$('.ports').forEach(p => {
    for (let i = 0; i < 8; i++) { const port = document.createElement('i'); port.style.setProperty('--d', (Math.random() * 2).toFixed(2) + 's'); p.appendChild(port); }
  });

  /* hero cable parallax */
  const hc = $('.hero-cables');
  if (hc && !reduce && matchMedia('(hover:hover)').matches) addEventListener('pointermove', e => {
    hc.style.setProperty('--px', ((e.clientX / innerWidth - .5) * -26).toFixed(1) + 'px');
    hc.style.setProperty('--py', ((e.clientY / innerHeight - .5) * -18).toFixed(1) + 'px');
  }, { passive: true });

  /* ---------- tmux-style status bar ---------- */
  const sbSec = $('#sb-sec'), sbClock = $('#sb-clock'), sbUp = $('#sb-up'), t0 = Date.now();
  const sbSpy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) sbSec.textContent = e.target.id; }),
    { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => sbSpy.observe(s));
  const pad = n => String(n).padStart(2, '0');
  const tick = () => {
    const d = new Date(), up = Math.floor((Date.now() - t0) / 1000);
    sbClock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    sbUp.textContent = `up ${pad(Math.floor(up / 60))}:${pad(up % 60)}`;
  };
  tick(); setInterval(tick, 1000);
})();
