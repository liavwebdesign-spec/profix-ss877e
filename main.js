/* PROFIX home sketch: engine behaviours + 8 scroll moves (see GSAP layer)
*/
(function () {
  'use strict';
  var html = document.documentElement;
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  /* ---------- header ---------- */
  var header = document.querySelector('.header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mega menu (click + hover intent) */
  var megaLi = document.querySelector('.nav .has-mega');
  if (megaLi) {
    var megaBtn = megaLi.querySelector('button');
    var closeTimer;
    function openMega() { clearTimeout(closeTimer); megaLi.classList.add('is-open'); megaBtn.setAttribute('aria-expanded', 'true'); }
    function closeMega() { megaLi.classList.remove('is-open'); megaBtn.setAttribute('aria-expanded', 'false'); }
    megaBtn.addEventListener('click', function () { megaLi.classList.contains('is-open') ? closeMega() : openMega(); });
    megaLi.addEventListener('mouseenter', openMega);
    megaLi.addEventListener('mouseleave', function () { closeTimer = setTimeout(closeMega, 160); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMega(); });
    document.addEventListener('click', function (e) { if (!megaLi.contains(e.target)) closeMega(); });
  }

  /* mobile menu */
  var burger = document.querySelector('.burger');
  var mobileMenu = document.getElementById('mobile-menu');
  function openMenu() { mobileMenu.hidden = false; requestAnimationFrame(function () { mobileMenu.classList.add('is-open'); }); burger.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { mobileMenu.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; setTimeout(function () { mobileMenu.hidden = true; }, 320); }
  if (burger && mobileMenu) {
    burger.addEventListener('click', openMenu);
    mobileMenu.querySelectorAll('[data-close-menu], a').forEach(function (el) { el.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mobileMenu.hidden) closeMenu(); });
  }

  /* ---------- reveal (engine) ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (!rm && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- sticky mobile bar: only when no primary CTA is on screen ---------- */
  var bar = document.getElementById('sticky-bar');
  if (bar && 'IntersectionObserver' in window) {
    var visible = new Set();
    var ctaIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
      bar.classList.toggle('is-shown', visible.size === 0);
    }, { rootMargin: '-72px 0px -72px 0px' });
    document.querySelectorAll('main .btn-primary, .hero').forEach(function (el) { ctaIo.observe(el); });
  }

  /* ---------- logo band: repeat the marks until the track covers the screen plus the scroll travel ---------- */
  var track = document.getElementById('marquee-track');
  if (track) {
    var originals = Array.prototype.slice.call(track.children);
    var guard = 0;
    while (track.scrollWidth < window.innerWidth * 1.9 && guard++ < 16) {
      originals.forEach(function (el) { var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    }
  }

  /* ---------- lead form (sketch: no backend yet) ---------- */
  var form = document.getElementById('lead-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('.field').forEach(function (f) {
        var input = f.querySelector('input, textarea');
        if (!input || !input.required) return;
        var bad = !input.value.trim() || (input.type === 'tel' && !/^[0-9+\-\s()]{8,}$/.test(input.value)) || (input.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value));
        f.classList.toggle('is-invalid', bad); if (bad) ok = false;
      });
      var consent = form.querySelector('input[name=consent]');
      if (!consent.checked) { ok = false; consent.focus(); }
      if (!ok) return;
      var btn = form.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = 'שולחים...';
      setTimeout(function () { form.closest('.form-card').classList.add('is-sent'); }, 600);
    });
  }

  /* ---------- accessibility widget ---------- */
  var a11yBtn = document.querySelector('.a11y-btn');
  var a11yPanel = document.getElementById('a11y-panel');
  if (a11yBtn && a11yPanel) {
    a11yBtn.addEventListener('click', function () { var open = a11yPanel.classList.toggle('is-open'); a11yBtn.setAttribute('aria-expanded', String(open)); });
    a11yPanel.querySelectorAll('[data-a11y]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.dataset.a11y;
        if (k === 'reset') { ['a11y-big', 'a11y-contrast', 'a11y-links', 'a11y-still'].forEach(function (c) { html.classList.remove(c); }); return; }
        html.classList.toggle('a11y-' + k);
        if (k === 'still' && hasGsap) { html.classList.contains('a11y-still') ? gsap.globalTimeline.pause() : gsap.globalTimeline.play(); }
      });
    });
  }

  /* ---------- word split helper (Hebrew: words only, never chars) ---------- */
  function splitWords(el) {
    if (el.querySelector('.split-word')) return Array.prototype.slice.call(el.querySelectorAll('.split-word'));
    var out = [];
    function walk(node) {
      if (node.nodeType === 3) {
        var parts = node.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var s = document.createElement('span'); s.className = 'split-word'; s.textContent = p; frag.appendChild(s); out.push(s);
        });
        node.parentNode.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        Array.prototype.slice.call(node.childNodes).forEach(walk);
      }
    }
    Array.prototype.slice.call(el.childNodes).forEach(walk);
    return out;
  }

  /* ---------- GSAP layer ----------
     Built in DOM order (engine QA 13d): every trigger below a pin is created after it.
     S1 hero: signature P assembled by scroll, short pin (G18-based)
     S2 h2 word fade (G4 level b)
     S3 logo conveyor driven by scroll (G123)
     S4 services: sticky stage swaps per row (G05)
     S5 why: hub wires drawn by scroll, nodes light up (G22-based, no pin)
     S6 process: pinned, line fills and stations light (G20 station logic) / mobile vertical rail (B35)
     S7 projects: scattered tiles converge (G54)
     S8 about: statement coloured word by word (G48)
     S9 testimonials: sideways band in a sticky stage, centre card grows (G65) */
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual';
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  var headerH = function () { return header.offsetHeight; };
  var sig = document.getElementById('p-sig');
  var pieces = sig ? gsap.utils.toArray(sig.querySelectorAll('.piece')) : [];
  var labels = sig ? gsap.utils.toArray(sig.querySelectorAll('.lbl')) : [];
  var hl = document.querySelector('.hero .hl');
  var svcRows = gsap.utils.toArray('.svc-row');
  var svcArts = gsap.utils.toArray('.svc-art');
  var capNum = document.querySelector('.svc-cap-num');
  var capTitle = document.querySelector('.svc-cap-title');
  var capGroup = document.querySelector('.svc-cap-group');
  var steps = gsap.utils.toArray('.step');
  var fill = document.getElementById('process-fill');
  var vtFill = document.getElementById('vt-fill');
  var tiles = gsap.utils.toArray('.tile');
  var statement = document.getElementById('about-statement');
  var mq = document.querySelector('.marquee');

  /* S4 state change (not motion): which service the stage shows. Runs in every motion mode. */
  function showService(i) {
    svcRows.forEach(function (r, k) { r.classList.toggle('is-active', k === i); });
    svcArts.forEach(function (a, k) { a.classList.toggle('is-on', k === i); });
    var a = svcArts[i];
    if (a && capTitle) { capNum.textContent = String(i + 1).padStart(2, '0'); capTitle.textContent = a.dataset.title; capGroup.textContent = a.dataset.group; }
  }
  function buildServiceSync() {
    return svcRows.map(function (row, i) {
      return ScrollTrigger.create({
        trigger: row, start: 'top 58%', end: 'bottom 58%',
        onToggle: function (self) { if (self.isActive) showService(i); }
      });
    });
  }

  /* split a paragraph into word spans; keywords get a marker behind them (G48) */
  function splitStatement(p, marks) {
    if (p.querySelector('.w')) return { words: gsap.utils.toArray(p.querySelectorAll('.w')), marks: gsap.utils.toArray(p.querySelectorAll('.mk')) };
    var bare = function (w) { return w.replace(/[.,:;!?"'׳״]/g, ''); };
    var words = p.textContent.trim().split(/\s+/);
    p.textContent = '';
    var spans = [], mks = [];
    words.forEach(function (w, i) {
      var s = document.createElement('span'); s.className = 'w';
      var core = bare(w);
      if (marks.indexOf(core) > -1) {
        var mk = document.createElement('span'); mk.className = 'mk'; mk.textContent = core;
        s.appendChild(mk); s.appendChild(document.createTextNode(w.slice(core.length))); mks.push(mk);
      } else s.textContent = w;
      p.appendChild(s); if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
      spans.push(s);
    });
    return { words: spans, marks: mks };
  }

  var mm = gsap.matchMedia();
  mm.add({
    desk: '(min-width: 1024px)',
    mob: '(max-width: 1023px)',
    move: '(prefers-reduced-motion: no-preference)'
  }, function (ctx) {
    var c = ctx.conditions;
    var cleanups = [];

    if (!c.move) {
      /* S4 runs on desktop in both motion modes (it is a content swap, not an animation); no pins here, so order is free */
      if (c.desk) cleanups = cleanups.concat(buildServiceSync());
      gsap.set(labels, { opacity: 0 });
      steps.forEach(function (s) { s.classList.add('is-lit'); });
      if (fill) gsap.set(fill, { scaleX: 1 });
      if (vtFill) gsap.set(vtFill, { height: '100%' });
      return function () { cleanups.forEach(function (t) { t.kill(); }); };
    }
    html.classList.add('gsap-live');

    /* S1 hero signature: exploded systems assemble into one P as you scroll */
    if (sig) {
      pieces.forEach(function (p) { gsap.set(p, { x: +p.dataset.dx, y: +p.dataset.dy, rotation: +p.dataset.rot, transformOrigin: '50% 50%' }); });
      gsap.set(labels, { opacity: 1 });
      gsap.set(hl, { color: '#F4F2EE' });
      var htl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: c.desk
          ? { trigger: '.hero', start: function () { return 'top ' + headerH(); }, end: '+=70%', pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true }
          : { trigger: '.hero-visual', start: 'top 85%', end: 'center 40%', scrub: 0.6 }
      });
      htl.to(labels, { opacity: 0, duration: 0.3, stagger: 0.05 }, 0)
        .to(pieces, { x: 0, y: 0, rotation: 0, duration: 1, stagger: 0.12, ease: 'power2.inOut' }, 0.05)
        .to(hl, { color: '#F27A2B', duration: 0.35 }, '-=0.3');
      var h1 = document.querySelector('.hero h1[data-split]');
      if (h1) { var hw = splitWords(h1); gsap.set(hw, { opacity: 1 }); gsap.from(hw, { opacity: 0, y: 14, duration: 0.6, stagger: 0.05, ease: 'power2.out', delay: 0.15 }); }
    }

    /* S2 word fade on the doors heading (first h2 in the page, the rest are created in place below) */
    function fadeHeading(h) {
      gsap.fromTo(splitWords(h), { opacity: 0.22 }, { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: h, start: 'top 85%', end: 'top 45%', scrub: 0.8 } });
    }
    var h2s = gsap.utils.toArray('h2[data-split]');
    if (h2s[0]) fadeHeading(h2s[0]);

    /* S3 logo conveyor: position is a function of the band's progress through the viewport */
    if (mq) {
      var D = function () { return innerWidth * (c.mob ? 0.4 : 0.3); };
      gsap.fromTo('#marquee-track', { x: function () { return -D(); } }, { x: function () { return D(); }, ease: 'none',
        scrollTrigger: { trigger: '.logos', start: 'top bottom', end: 'bottom top', scrub: 0.4, invalidateOnRefresh: true } });
    }

    /* S4 services sync, created after the hero pin so its positions include the pin spacing */
    if (c.desk) cleanups = cleanups.concat(buildServiceSync());

    /* S5 why: hub first, then wires draw outward one by one, each node lights when its wire lands */
    if (h2s[1]) fadeHeading(h2s[1]);
    var wires = gsap.utils.toArray('.why-diagram .wire-hot');
    var nodes = gsap.utils.toArray('.why-diagram .hub-node');
    if (wires.length) {
      gsap.set(wires, { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(nodes, { opacity: 0.28 });
      gsap.set('.why-diagram .hub-core', { scale: 0.82, transformOrigin: '50% 50%' });
      var wtl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '.why-diagram', start: 'top 80%', end: 'bottom 45%', scrub: 0.6 } });
      wtl.to('.why-diagram .hub-core', { scale: 1, duration: 0.4, ease: 'power2.out' }, 0);
      wires.forEach(function (w, i) {
        var at = 0.3 + i * 0.45;
        wtl.to(w, { strokeDashoffset: 0, duration: 0.45 }, at)
           .to(nodes[i], { opacity: 1, duration: 0.15, onStart: function () { nodes[i].classList.add('is-lit'); }, onReverseComplete: function () { nodes[i].classList.remove('is-lit'); } }, at + 0.35);
      });
    }

    /* S6 process */
    if (h2s[2]) fadeHeading(h2s[2]);
    if (steps.length) {
      var dim = function (s) { return [s.querySelector('h3'), s.querySelector('p')]; };
      if (c.desk && fill) {
        gsap.set(fill, { scaleX: 0 });
        steps.forEach(function (s, i) { if (i) gsap.set(dim(s), { opacity: 0.22, y: 12 }); });
        steps[0].classList.add('is-lit');
        var ptl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
          trigger: '#process', start: function () { var hh = headerH(); return 'center ' + Math.round(hh + (innerHeight - hh) / 2); }, end: '+=120%', pin: true, scrub: 0.5, anticipatePin: 1, invalidateOnRefresh: true } });
        ptl.to(fill, { scaleX: 1, duration: 1 }, 0);
        steps.forEach(function (s, i) {
          if (!i) return;
          var at = i / steps.length;
          ptl.to(dim(s), { opacity: 1, y: 0, duration: 0.12, onStart: function () { s.classList.add('is-lit'); }, onReverseComplete: function () { s.classList.remove('is-lit'); } }, at);
        });
      } else if (vtFill) {
        gsap.to(vtFill, { height: '100%', ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 62%', end: 'bottom 72%', scrub: 0.6 } });
        steps.forEach(function (s) {
          ScrollTrigger.create({ trigger: s, start: 'top 66%', onEnter: function () { s.classList.add('is-lit'); }, onLeaveBack: function () { s.classList.remove('is-lit'); } });
        });
      }
    }

    /* S7 projects: each tile arrives from the side of the grid it belongs to */
    if (tiles.length) {
      var grid = document.querySelector('.projects-grid');
      var g = grid.getBoundingClientRect();
      var cx = g.left + g.width / 2, cy = g.top + g.height / 2;
      var ttl = gsap.timeline({ scrollTrigger: { trigger: grid, start: 'top 92%', end: 'top 30%', scrub: 0.8 } });
      tiles.forEach(function (el) {
        var r = el.getBoundingClientRect();
        var dx = (r.left + r.width / 2 - cx) / g.width, dy = (r.top + r.height / 2 - cy) / g.height;
        ttl.fromTo(el, { xPercent: dx * 120, yPercent: dy * 110, scale: 0.6, rotate: dx * 14, rotateY: dx * -20, opacity: 0 },
          { xPercent: 0, yPercent: 0, scale: 1, rotate: 0, rotateY: 0, opacity: 1, duration: 1, ease: 'power2.out' }, 0);
      });
    }

    /* S8 about statement: coloured word by word, the key phrase gets the orange marker */
    if (statement) {
      var sp = splitStatement(statement, ['מעטפת', 'שירותים', 'מלאה']);
      gsap.set(sp.words, { color: '#B4B7BD' });
      gsap.set(sp.marks, { '--fill': 0 });
      var stl = gsap.timeline({ scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 55%', scrub: 0.4 } });
      stl.to(sp.words, { color: '#111214', duration: 0.4, stagger: 0.35, ease: 'none' }, 0);
      sp.marks.forEach(function (mk) {
        var i = sp.words.indexOf(mk.parentNode);
        stl.to(mk, { '--fill': 1, duration: 0.4, ease: 'power2.out' }, i * 0.35);
      });
    }

    /* S9 testimonials: the band moves sideways inside a sticky stage; the card nearest the centre grows (G65).
       No blur: blurred text cannot be read and the filter is expensive while scrolling. */
    var ctr = document.querySelector('.ctr');
    if (ctr) {
      var ctrTrack = ctr.querySelector('.ctr-track'), ctrView = ctr.querySelector('.ctr-view');
      var cards = gsap.utils.toArray('.ctr .quote');
      html.style.setProperty('--header-h', headerH() + 'px');
      var dist = function () { return Math.max(0, ctrTrack.scrollWidth - ctrView.clientWidth); };
      var fitHeight = function () { ctr.style.height = (innerHeight - headerH() + dist() * 1.1) + 'px'; };
      fitHeight();
      ScrollTrigger.addEventListener('refreshInit', fitHeight);
      gsap.fromTo(ctrTrack, { x: function () { return -dist(); } }, { x: 0, ease: 'none',
        scrollTrigger: { trigger: ctr, start: function () { return 'top ' + headerH(); }, end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true } });
      var paint = function () {
        var mid = innerWidth / 2;
        var unit = cards.length > 1 ? Math.abs(cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left) : 400;
        cards.forEach(function (el) {
          var r = el.getBoundingClientRect();
          var d = Math.min(1, Math.abs(r.left + r.width / 2 - mid) / (unit * 1.6));
          var f = 1 - d * d;
          gsap.set(el, { scale: 0.86 + f * 0.14, opacity: 0.42 + f * 0.58, zIndex: Math.round(f * 10) });
          el.classList.toggle('is-center', f > 0.85);
        });
      };
      var running = false;
      var startLoop = function () { if (!running) { running = true; gsap.ticker.add(paint); } };
      var stopLoop = function () { if (running) { running = false; gsap.ticker.remove(paint); } };
      cleanups.push(ScrollTrigger.create({ trigger: ctr, start: 'top bottom', end: 'bottom top', onToggle: function (self) { self.isActive ? startLoop() : stopLoop(); } }));
      cleanups.push({ kill: function () { stopLoop(); ScrollTrigger.removeEventListener('refreshInit', fitHeight); ctr.style.height = ''; gsap.set(cards, { clearProps: 'all' }); cards.forEach(function (el) { el.classList.remove('is-center'); }); } });
      paint();
    }

    return function () {
      html.classList.remove('gsap-live');
      cleanups.forEach(function (t) { t.kill(); });
    };
  });
})();
