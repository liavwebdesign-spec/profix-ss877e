/* PROFIX home sketch: engine behaviours + 4 approved moves
   M1 signature: the P assembles from four exploded system blocks (hero)
   M2 word fade (G4 level b) on three key headings
   M3 batch reveal (G13) on the service rows
   M4 process line drawn by scroll, steps light up
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

  /* ---------- logo marquee: fill any screen width, then duplicate once for a seamless -50% loop ---------- */
  var track = document.getElementById('marquee-track');
  if (track) {
    var originals = Array.prototype.slice.call(track.children);
    var guard = 0;
    while (track.scrollWidth < window.innerWidth * 1.1 && guard++ < 12) {
      originals.forEach(function (el) { var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
    }
    Array.prototype.slice.call(track.children).forEach(function (el) { var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  }

  /* ---------- quotes carousel ---------- */
  var quotes = document.getElementById('quotes');
  document.querySelectorAll('[data-quotes]').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = quotes.querySelector('.quote');
      var step = card.getBoundingClientRect().width + 24;
      var dir = b.dataset.quotes === 'next' ? -1 : 1; /* RTL: next moves left */
      quotes.scrollBy({ left: dir * step, behavior: rm ? 'auto' : 'smooth' });
    });
  });

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

  /* ---------- GSAP layer ---------- */
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual';
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  var sig = document.getElementById('p-sig');
  var pieces = sig ? Array.prototype.slice.call(sig.querySelectorAll('.piece')) : [];
  var labels = sig ? Array.prototype.slice.call(sig.querySelectorAll('.lbl-group')) : [];

  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {
    html.classList.add('gsap-live');

    /* M1: signature */
    if (sig) {
      pieces.forEach(function (p) {
        gsap.set(p, { x: +p.dataset.dx, y: +p.dataset.dy, rotation: +p.dataset.rot, transformOrigin: '50% 50%' });
      });
      gsap.set(labels, { opacity: 1 });
      var hl = document.querySelector('.hero .hl');
      /* the scroll drift is created only after the assembly, otherwise its recorded start values are the exploded ones */
      function armDrift() {
        pieces.forEach(function (p) {
          gsap.fromTo(p, { x: 0, y: 0, rotation: 0 }, {
            x: +p.dataset.dx * 0.35, y: +p.dataset.dy * 0.35, rotation: +p.dataset.rot * 0.4, ease: 'none', immediateRender: false,
            scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 }
          });
        });
      }
      var tl = gsap.timeline({ delay: 0.5, defaults: { ease: 'power3.inOut' }, onComplete: armDrift });
      tl.to(labels, { opacity: 0, duration: 0.5, stagger: 0.06 }, 0)
        .to(pieces, { x: 0, y: 0, rotation: 0, duration: 1.2, stagger: 0.12 }, 0.2)
        .from(hl, { color: '#F4F2EE', duration: 0.6, ease: 'power2.out' }, '-=0.35');
    }

    /* M2: word fade on three key headings (G4 level b), hero H1 excluded: it enters with the signature */
    document.querySelectorAll('h2[data-split]').forEach(function (h) {
      var words = splitWords(h);
      gsap.fromTo(words, { opacity: 0.22 }, {
        opacity: 1, stagger: 0.08, ease: 'none',
        scrollTrigger: { trigger: h, start: 'top 85%', end: 'top 45%', scrub: 0.8 }
      });
    });
    var h1 = document.querySelector('.hero h1[data-split]');
    if (h1) {
      var w = splitWords(h1);
      gsap.set(w, { opacity: 1 });
      gsap.from(w, { opacity: 0, y: 14, duration: 0.6, stagger: 0.05, ease: 'power2.out', delay: 0.15 });
    }

    /* M3: batch reveal for the service rows (G13) */
    var cards = document.querySelectorAll('.batch-card');
    if (cards.length) {
      gsap.set(cards, { y: 24, opacity: 0 });
      ScrollTrigger.batch(cards, {
        start: 'top 88%', once: true,
        onEnter: function (batch) { gsap.to(batch, { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: 'power2.out' }); }
      });
    }

    /* M4: process line drawn by scroll + steps light up */
    var fill = document.getElementById('process-fill');
    var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
    if (fill && steps.length) {
      gsap.to(fill, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.process-track', start: 'top 75%', end: 'bottom 55%', scrub: 0.6,
        onUpdate: function (st) { var n = Math.min(steps.length, Math.floor(st.progress * steps.length + 0.15) + (st.progress > 0.02 ? 1 : 0)); steps.forEach(function (s, i) { s.classList.toggle('is-lit', i < n); }); } } });
    }

    return function () { html.classList.remove('gsap-live'); };
  });

  /* reduced motion: static end states */
  if (rm) {
    gsap.set(labels, { opacity: 0 });
    document.querySelectorAll('.step').forEach(function (s) { s.classList.add('is-lit'); });
    var f = document.getElementById('process-fill'); if (f) f.style.transform = 'scaleX(1)';
  }
})();
