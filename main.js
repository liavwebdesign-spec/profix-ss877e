/* PROFIX home sketch: engine behaviours + 8 scroll moves (see GSAP layer)
*/
(function () {
  'use strict';
  var html = document.documentElement;
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

  /* ---------- header ---------- */
  /* floating pill (MV:hd3) with headroom: leaves on scroll down, returns on the first scroll up, always visible
     at the top, while the mega menu or the drawer is open, and while keyboard focus is inside it */
  var header = document.querySelector('.header');
  var hdLast = window.scrollY, hdRaf = 0;
  function hdUpdate() {
    hdRaf = 0;
    var y = window.scrollY, d = y - hdLast;
    header.classList.toggle('is-scrolled', y > 8);
    var hold = !!header.querySelector('.is-open') || !!header.querySelector(':focus-visible') ||
      document.documentElement.classList.contains('menu-lock');
    if (y <= header.offsetHeight + 24 || hold) { header.classList.remove('is-hidden'); hdLast = y; return; }
    if (Math.abs(d) < 6) return;
    header.classList.toggle('is-hidden', d > 0);
    hdLast = y;
  }
  window.addEventListener('scroll', function () { if (!hdRaf) hdRaf = requestAnimationFrame(hdUpdate); }, { passive: true });
  header.addEventListener('focusin', hdUpdate);
  hdUpdate();

  /* a hash can do more than scroll: #for-biz / #for-home filter the services, #svc-* opens that service (menu, doors, other pages) */
  function routeHash(hash) {
    var m = /^#for-(biz|home)$/.exec(hash);
    if (m) { if (window.profixSvc) window.profixSvc.filter(m[1]); return document.getElementById('services'); }
    var el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el && el.classList.contains('svc-row') && window.profixSvc) window.profixSvc.open(el);
    return el;
  }
  window.addEventListener('load', function () {
    if (!/^#(for-|svc-)/.test(location.hash)) return;
    var el = routeHash(location.hash);
    if (el) setTimeout(function () { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - innerHeight * .2, behavior: 'instant' }); }, 60);
  });

  /* in-page anchors glide here and not through CSS scroll-behavior, which breaks every ScrollTrigger refresh made mid-page */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var u = new URL(a.href, location.href);
    var page = function (p) { return p.replace(/index\.html$/, ''); };
    if (page(u.pathname) !== page(location.pathname) || !u.hash || u.hash === '#') return;
    var go = routeHash(u.hash);
    if (!go) return;
    e.preventDefault();
    var t = go;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY, behavior: still ? 'auto' : 'smooth' });
    history.pushState(null, '', u.hash);
    if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
    t.focus({ preventScroll: true });
  });

  /* hero video: 720p on phones, 1080p elsewhere; the poster stands in for reduced motion; rests off screen.
     The pause button (WCAG 2.2.2) and the toolbar's "stop animations" both hold it, and scrolling back does not resume it. */
  var hv = document.querySelector('.hero-video'), vt = document.querySelector('.video-toggle');
  if (hv) {
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!still) {
      hv.src = window.matchMedia('(max-width: 767px)').matches ? hv.dataset.srcMob : hv.dataset.srcDesk;
      var userPaused = false, hvOn = true;
      var playHv = function () { if (userPaused || !hvOn || html.classList.contains('a11y-still')) return; var pr = hv.play(); if (pr && pr.catch) pr.catch(function () {}); };
      var setPaused = function (p) {
        userPaused = p;
        if (vt) { vt.setAttribute('aria-pressed', String(p)); vt.setAttribute('aria-label', p ? 'הפעלת הסרטון' : 'עצירת הסרטון'); }
        p ? hv.pause() : playHv();
      };
      if (vt) vt.addEventListener('click', function () { setPaused(!userPaused); });
      document.addEventListener('a11y:still', function (e) { e.detail ? hv.pause() : playHv(); });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { hvOn = e.isIntersecting; hvOn ? playHv() : hv.pause(); }); }).observe(hv);
      } else playHv();
    }
  }

  /* footer year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* mega menu (MV:b65): hover intent, click, ArrowDown opens and focuses, Escape returns focus, leaving focus closes */
  var megaLi = document.querySelector('.nav .has-mega');
  if (megaLi) {
    var megaBtn = megaLi.querySelector('button');
    var megaLinks = Array.prototype.slice.call(megaLi.querySelectorAll('.mega a'));
    megaLi.querySelectorAll('.mega-col a').forEach(function (a, i) { a.style.setProperty('--i', i); });
    var tOpen, tClose;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    function setMega(v, focusFirst) {
      clearTimeout(tOpen); clearTimeout(tClose);
      megaLi.classList.toggle('is-open', v); megaBtn.setAttribute('aria-expanded', String(v));
      megaLinks.forEach(function (a) { a.tabIndex = v ? 0 : -1; });
      if (v && focusFirst) setTimeout(function () { megaLinks[0].focus(); }, 60);
    }
    setMega(false);
    megaBtn.addEventListener('click', function () { setMega(!megaLi.classList.contains('is-open')); });
    if (fine) {
      megaLi.addEventListener('mouseenter', function () { clearTimeout(tClose); tOpen = setTimeout(function () { setMega(true); }, 70); });
      megaLi.addEventListener('mouseleave', function () { clearTimeout(tOpen); tClose = setTimeout(function () { setMega(false); }, 180); });
    }
    megaBtn.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown') { e.preventDefault(); setMega(true, true); } });
    megaLi.addEventListener('keydown', function (e) { if (e.key === 'Escape' && megaLi.classList.contains('is-open')) { setMega(false); megaBtn.focus(); } });
    megaLi.addEventListener('focusout', function (e) { if (!megaLi.contains(e.relatedTarget)) setMega(false); });
    document.addEventListener('click', function (e) { if (!megaLi.contains(e.target)) setMega(false); });
  }

  /* mobile drawer (MV:b66): animated enter and exit, staggered rows, accordion, focus trap, scroll lock without a jump */
  var burger = document.querySelector('.burger');
  var md = document.getElementById('mobile-menu');
  if (burger && md) {
    var mdPanel = md.querySelector('.md-panel'), mdClose = md.querySelector('.md-close'), mdLast = null;
    md.querySelectorAll('.md-item').forEach(function (el, i) { el.style.setProperty('--i', i); });
    md.querySelectorAll('.md-sub').forEach(function (sub) { sub.querySelectorAll('a').forEach(function (a, k) { a.style.setProperty('--j', k); }); });
    var toggleSub = function (btn, force) {
      var sub = btn.nextElementSibling, open = force !== undefined ? force : !sub.classList.contains('open');
      sub.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open));
      sub.querySelectorAll('a').forEach(function (a) { a.tabIndex = open ? 0 : -1; });
    };
    var setDrawer = function (open) {
      md.classList.toggle('open', open); mdPanel.inert = !open;
      burger.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('menu-lock', open);
      if (open) { mdLast = document.activeElement; setTimeout(function () { mdClose.focus(); }, 180); }
      else { md.querySelectorAll('.md-sub.open').forEach(function (sub) { toggleSub(sub.previousElementSibling, false); }); if (mdLast) mdLast.focus(); }
    };
    mdPanel.inert = true;
    md.querySelectorAll('.md-acc').forEach(function (b) { toggleSub(b, false); b.addEventListener('click', function () { toggleSub(b); }); });
    burger.addEventListener('click', function () { setDrawer(!md.classList.contains('open')); });
    mdClose.addEventListener('click', function () { setDrawer(false); });
    md.querySelector('.md-scrim').addEventListener('click', function () { setDrawer(false); });
    md.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setDrawer(false); }); });
    document.addEventListener('keydown', function (e) {
      if (!md.classList.contains('open')) return;
      if (e.key === 'Escape') { setDrawer(false); return; }
      if (e.key !== 'Tab') return;
      var f = Array.prototype.slice.call(mdPanel.querySelectorAll('a,button')).filter(function (x) { return x.tabIndex !== -1 && x.offsetParent !== null; });
      var i = f.indexOf(document.activeElement);
      var n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
      e.preventDefault(); f[n].focus();
    });
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

  /* ---------- the floating WhatsApp button steps aside over the footer, which has the same link, so it never covers the footer's last lines ---------- */
  var waFloat = document.querySelector('.wa-float'), footEl = document.querySelector('.footer');
  if (waFloat && footEl && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { waFloat.classList.toggle('is-away', es[0].isIntersecting); }, { rootMargin: '0px 0px -120px 0px' }).observe(footEl);
  }

  /* ---------- sticky mobile bar: only when no primary CTA is on screen ---------- */
  var bar = document.getElementById('sticky-bar');
  if (bar && 'IntersectionObserver' in window) {
    // the bar steps aside while anything that already does its job is on screen (a primary button, the form,
    // a WhatsApp or phone link, the footer), and while a field has focus, so it never sits over the keyboard
    var visible = new Set();
    var isField = function (el) { return el && el.matches && el.matches('input, textarea, select'); };
    var place = function () { bar.classList.toggle('is-shown', visible.size === 0 && !isField(document.activeElement)); };
    var ctaIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.isIntersecting ? visible.add(en.target) : visible.delete(en.target); });
      place();
    }, { rootMargin: '-72px 0px -72px 0px' });
    document.querySelectorAll('main .btn-primary, .hero, main form, .footer, main a[href*="wa.me"], main a[href^="tel:"]').forEach(function (el) { ctaIo.observe(el); });
    document.addEventListener('focusin', place);
    document.addEventListener('focusout', function () { setTimeout(place, 0); });
  }

  /* ---------- logo band: two rows (the second in reverse order), each repeated until it covers the screen plus the scroll travel ---------- */
  var track = document.getElementById('marquee-track'), track2 = document.getElementById('marquee-track-2');
  if (track) {
    var originals = Array.prototype.slice.call(track.children);
    var copyOf = function (el) { var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); var im = c.querySelector('img'); if (im) im.alt = ''; return c; };
    if (track2) originals.slice().reverse().forEach(function (el) { track2.appendChild(copyOf(el)); });
    var fillRow = function (tr, set) {
      var guard = 0;
      while (tr.scrollWidth < window.innerWidth * 1.9 && guard++ < 16) set.forEach(function (el) { tr.appendChild(copyOf(el)); });
    };
    var fillBand = function () {
      fillRow(track, originals);
      if (track2) fillRow(track2, Array.prototype.slice.call(track2.children));
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    };
    // measure only after the logos have a width: an image that has not loaded is 0px wide and would be cloned dozens of times
    var imgs = Array.prototype.slice.call(track.querySelectorAll('img'));
    // (load events, not decode(): decode() of an SVG can stay pending forever, and then the band never filled)
    var loaded = function (im) { return im.complete ? Promise.resolve() : new Promise(function (ok) { im.addEventListener('load', ok, { once: true }); im.addEventListener('error', ok, { once: true }); }); };
    var timeout = new Promise(function (ok) { setTimeout(ok, 4000); });
    Promise.race([Promise.all(imgs.map(loaded)), timeout]).then(fillBand);
  }

  /* ---------- services: each row opens in place, one at a time, and closes once it has scrolled out of view (Oz, 28.9) ---------- */
  var svcRowsAll = Array.prototype.slice.call(document.querySelectorAll('.svc-row'));
  if (svcRowsAll.length) {
    var refreshSoon = function () { if (window.ScrollTrigger) { clearTimeout(refreshSoon.t); refreshSoon.t = setTimeout(function () { ScrollTrigger.refresh(); }, 120); } };
    // closing a row that is above the screen shrinks the page under the reader: keep whatever is on screen where it was
    var keepPlace = function (change) {
      var ref = document.elementFromPoint(innerWidth / 2, innerHeight * .4);   // below the floating header, which never moves
      var before = ref ? ref.getBoundingClientRect().top : 0;
      change();
      if (ref) { var d = ref.getBoundingClientRect().top - before; if (Math.abs(d) > 1) window.scrollBy({ top: d, behavior: 'instant' }); }
    };
    var setRow = function (row, open) {
      var btn = row.querySelector('.svc-toggle'), more = row.querySelector('.svc-more');
      if (!btn || !more || row.classList.contains('is-open') === open) return;
      row.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); more.hidden = !open;
    };
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting && e.target.classList.contains('is-open')) { keepPlace(function () { setRow(e.target, false); }); refreshSoon(); } });
    }) : null;
    var svcList = document.querySelector('.svc-list');
    var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.svc-filter button'));
    var setFilter = function (v) {
      if (!svcList) return;
      svcList.dataset.show = v;
      filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.for === v)); });
      svcRowsAll.forEach(function (r) { if (v === 'home' && r.dataset.for === 'biz') setRow(r, false); });
      refreshSoon();
    };
    filterBtns.forEach(function (b) { b.addEventListener('click', function () { setFilter(b.dataset.for); }); });
    window.profixSvc = {
      filter: setFilter,
      open: function (row) { if (svcList && svcList.dataset.show === 'home' && row.dataset.for === 'biz') setFilter('all'); svcRowsAll.forEach(function (r) { setRow(r, r === row); }); refreshSoon(); }
    };
    svcRowsAll.forEach(function (row) {
      if (io) io.observe(row);
      row.addEventListener('click', function (e) {
        if (e.target.closest('.svc-more a')) return;
        var open = !row.classList.contains('is-open');
        keepPlace(function () { svcRowsAll.forEach(function (r) { if (r !== row) setRow(r, false); }); setRow(row, open); });
        refreshSoon();
      });
    });
  }

  /* ---------- quote questionnaire: area, then only its systems, then details (sketch: no backend, lands on thanks.html) ---------- */
  var qf = document.getElementById('quote-form');
  if (qf) {
    var qSteps = Array.prototype.slice.call(qf.querySelectorAll('.q-step'));
    var qNow = qf.querySelector('.q-now');
    var show = function (n) {
      qSteps.forEach(function (s) { s.hidden = +s.dataset.step !== n; });
      if (qNow) qNow.textContent = 'שלב ' + n;
      var legend = qSteps[n - 1].querySelector('legend'); if (legend) { legend.tabIndex = -1; legend.focus({ preventScroll: true }); }
      window.scrollTo({ top: qf.getBoundingClientRect().top + window.scrollY - 140, behavior: 'instant' });
    };
    var area = function () { var r = qf.querySelector('input[name="area"]:checked'); return r ? r.value : ''; };
    var fitSystems = function () {
      var a = area();
      qf.querySelectorAll('.q-step[data-step="2"] .q-opt').forEach(function (o) {
        var fits = (o.dataset.for || '').split(' ').indexOf(a) > -1;
        o.hidden = !fits; if (!fits) o.querySelector('input').checked = false;
      });
    };
    qf.addEventListener('click', function (e) {
      var step = e.target.closest('.q-step'); if (!step) return;
      var n = +step.dataset.step;
      if (e.target.closest('[data-back]')) { show(n - 1); return; }
      if (!e.target.closest('[data-next]')) return;
      if (n === 1) {
        var err = step.querySelector('.q-err');
        if (!area()) { err.hidden = false; return; }
        err.hidden = true; fitSystems();
      }
      show(n + 1);
    });
    qf.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      qf.querySelectorAll('.q-step[data-step="3"] .field').forEach(function (f) {
        var input = f.querySelector('input'); if (!input || !input.required) return;
        var bad = !input.value.trim() || (input.type === 'tel' && !/^[0-9+\-\s()]{8,}$/.test(input.value));
        f.classList.toggle('is-invalid', bad); if (bad) ok = false;
      });
      var consent = qf.querySelector('input[name="consent"]');
      if (consent && !consent.checked) { ok = false; consent.focus(); }
      if (ok) location.href = 'thanks.html';
    });
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
        if (k === 'reset') ['a11y-big', 'a11y-contrast', 'a11y-links', 'a11y-still'].forEach(function (c) { html.classList.remove(c); });
        else html.classList.toggle('a11y-' + k);
        if ((k === 'still' || k === 'reset') && hasGsap) { html.classList.contains('a11y-still') ? gsap.globalTimeline.pause() : gsap.globalTimeline.play(); }
        if (k === 'still' || k === 'reset') document.dispatchEvent(new CustomEvent('a11y:still', { detail: html.classList.contains('a11y-still') }));
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
     S1 hero: headline words over the brand video
     S2 h2 word fade (G4 level b)
     S3 logo conveyor driven by scroll (G123)
     S4 services: sticky stage swaps per row (G05)
     S5 why: hub wires drawn by scroll, nodes light up (G22-based, no pin)
     S6 process: pinned, line fills and stations light (G20 station logic) / mobile vertical rail (B35)
     S7 projects: scattered tiles converge (G54)
     S9 testimonials: sideways band in a sticky stage, centre card grows (G65) */
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  history.scrollRestoration = 'manual';
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });

  var headerH = function () { return 0; };   // the pill floats over the content and hides on scroll down
  var svcRows = gsap.utils.toArray('.svc-row');
  var svcArts = gsap.utils.toArray('.svc-art');
  var capNum = document.querySelector('.svc-cap-num');
  var capTitle = document.querySelector('.svc-cap-title');
  var capGroup = document.querySelector('.svc-cap-group');
  var steps = gsap.utils.toArray('.step');
  var fill = document.getElementById('process-fill');
  var vtFill = document.getElementById('vt-fill');
  var tiles = gsap.utils.toArray('.tile');
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
      steps.forEach(function (s) { s.classList.add('is-lit'); });
      if (fill) gsap.set(fill, { scaleX: 1 });
      if (vtFill) gsap.set(vtFill, { height: '100%' });
      return function () { cleanups.forEach(function (t) { t.kill(); }); };
    }
    html.classList.add('gsap-live');

    /* S1 hero: the headline arrives word by word over the brand video */
    var h1 = document.querySelector('.hero h1[data-split]');
    if (h1) { var hw = splitWords(h1); gsap.set(hw, { opacity: 1 }); gsap.from(hw, { opacity: 0, y: 14, duration: 0.6, stagger: 0.05, ease: 'power2.out', delay: 0.15 }); }

    /* S2 word fade on the doors heading (first h2 in the page, the rest are created in place below) */
    function fadeHeading(h) {
      gsap.fromTo(splitWords(h), { opacity: 0.4 }, { opacity: 1, stagger: 0.06, ease: 'none', scrollTrigger: { trigger: h, start: 'top 90%', end: 'top 65%', scrub: 0.6 } });
    }
    var h2s = gsap.utils.toArray('h2[data-split]');
    if (h2s[0]) fadeHeading(h2s[0]);

    /* S3 logo conveyor: position is a function of the band's progress through the viewport */
    if (mq) {
      var D = function () { return innerWidth * (c.mob ? 0.4 : 0.3); };
      gsap.fromTo('#marquee-track', { x: function () { return -D(); } }, { x: function () { return D(); }, ease: 'none',
        scrollTrigger: { trigger: '.logos', start: 'top bottom', end: 'bottom top', scrub: 0.4, invalidateOnRefresh: true } });
      if (document.getElementById('marquee-track-2'))
        gsap.fromTo('#marquee-track-2', { x: function () { return D(); } }, { x: function () { return -D(); }, ease: 'none',
          scrollTrigger: { trigger: '.logos', start: 'top bottom', end: 'bottom top', scrub: 0.4, invalidateOnRefresh: true } });
    }

    /* S4 services sync, created after the hero pin so its positions include the pin spacing */
    if (c.desk) cleanups = cleanups.concat(buildServiceSync());

    /* S5 why (28.9): the ring draws while the section passes (MV:g22 without the pin); each system lights as the ring
       reaches it and its spoke runs to the P; once all six are on, light keeps flowing along the spokes (CSS) */
    if (h2s[1]) fadeHeading(h2s[1]);
    var orbit = document.querySelector('.why-orbit');
    if (orbit) {
      var ring = orbit.querySelector('.orbit-draw');
      var spokes = gsap.utils.toArray(orbit.querySelectorAll('.orbit-spoke'));
      var stations = gsap.utils.toArray(orbit.querySelectorAll('.orbit-st'));
      spokes.forEach(function (s, i) { s.style.setProperty('--n', i); });
      gsap.set(ring, { strokeDashoffset: 1 });
      gsap.set(spokes, { strokeDashoffset: 1 });
      gsap.set(orbit.querySelectorAll('.orbit-p path'), { opacity: 0, scale: .6, transformOrigin: '50% 50%' });
      var otl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
        trigger: '.why-layout', start: 'top 75%', end: c.desk ? 'bottom 70%' : 'bottom 85%', scrub: 0.6,
        onUpdate: function (self) { orbit.classList.toggle('is-live', self.progress > .98); } } });
      otl.to(orbit.querySelectorAll('.orbit-p path'), { opacity: 1, scale: 1, duration: .5, stagger: .08, ease: 'power2.out' }, 0);
      stations.forEach(function (st, i) {
        var at = .4 + i;
        otl.to(ring, { strokeDashoffset: 1 - (i + 1) / 6, duration: 1 }, at)
           .to(spokes[i], { strokeDashoffset: 0, duration: .45 }, at + .1)
           .call(function () { st.classList.add('is-lit'); }, null, at + .5)
           .call(function () { st.classList.remove('is-lit'); }, null, at + .49);
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

    /* S9 testimonials: the band moves sideways inside a sticky stage; the card nearest the centre grows (G65).
       No blur: blurred text cannot be read and the filter is expensive while scrolling. */
    var ctr = document.querySelector('.ctr');
    if (ctr) {
      var ctrTrack = ctr.querySelector('.ctr-track'), ctrView = ctr.querySelector('.ctr-view');
      var cards = gsap.utils.toArray('.ctr .quote');
      html.style.setProperty('--header-h', headerH() + 'px');
      var dist = function () { return Math.max(0, ctrTrack.scrollWidth - ctrView.clientWidth); };
      var fitHeight = function () { ctr.style.height = (innerHeight - headerH() + dist() * 0.8) + 'px'; };
      fitHeight();
      ScrollTrigger.addEventListener('refreshInit', fitHeight);
      var ctrNow = ctr.querySelector('.ctr-now'), ctrBar = ctr.querySelector('.ctr-rail i'), lastIdx = -1;
      gsap.fromTo(ctrTrack, { x: function () { return -dist(); } }, { x: 0, ease: 'none',
        scrollTrigger: { trigger: ctr, start: function () { return 'top ' + headerH(); }, end: 'bottom bottom', scrub: 0.5, invalidateOnRefresh: true,
          onUpdate: function (self) { if (ctrBar) ctrBar.style.transform = 'scaleX(' + self.progress.toFixed(3) + ')'; } } });
      var paint = function () {
        var mid = innerWidth / 2;
        var unit = cards.length > 1 ? Math.abs(cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left) : 400;
        var best = -1, bestIdx = 0;
        cards.forEach(function (el, i) {
          var r = el.getBoundingClientRect();
          var d = Math.min(1, Math.abs(r.left + r.width / 2 - mid) / (unit * 1.6));
          var f = 1 - d * d;
          gsap.set(el, { scale: 0.86 + f * 0.14, opacity: 0.42 + f * 0.58, zIndex: Math.round(f * 10) });
          el.classList.toggle('is-center', f > 0.85);
          if (f > best) { best = f; bestIdx = i; }
        });
        if (ctrNow && bestIdx !== lastIdx) { lastIdx = bestIdx; ctrNow.textContent = String(bestIdx + 1).padStart(2, '0'); }
      };
      var running = false;
      var startLoop = function () { if (!running) { running = true; gsap.ticker.add(paint); } };
      var stopLoop = function () { if (running) { running = false; gsap.ticker.remove(paint); } };
      cleanups.push(ScrollTrigger.create({ trigger: ctr, start: 'top bottom', end: 'bottom top', onToggle: function (self) { self.isActive ? startLoop() : stopLoop(); } }));
      cleanups.push({ kill: function () { stopLoop(); ScrollTrigger.removeEventListener('refreshInit', fitHeight); ctr.style.height = ''; gsap.set(cards, { clearProps: 'all' }); cards.forEach(function (el) { el.classList.remove('is-center'); }); } });
      paint();
    }

    /* S10 heading marks: the four modules of the P assemble above each heading, the hero's move at small scale */
    var SCATTER = { a: [-30, -34, -12], b: [44, -18, 10], c: [38, 38, 8], d: [-40, 30, -9] };   // in the logo P's own units (125 x 108)
    gsap.utils.toArray('.p-echo').forEach(function (mark) {
      // a mark inside a pinned section is measured against that pin, or a refresh made past it adds the pin's travel
      var pinned = mark.closest('.pin-spacer > *');
      // plays once as it enters, early and whole: as a scrub it ran at the edge of the screen and nobody saw it (Oz, 28.9)
      var tl = gsap.timeline({ scrollTrigger: { trigger: mark, start: 'top 88%', toggleActions: 'play none none none', pinnedContainer: pinned || undefined } });
      mark.querySelectorAll('path').forEach(function (r) {
        var o = SCATTER[r.getAttribute('data-p')];
        tl.fromTo(r, { x: o[0], y: o[1], rotate: o[2], opacity: 0 }, { x: 0, y: 0, rotate: 0, opacity: 1, ease: 'power2.out', duration: 1 }, 0);
      });
    });

    return function () {
      html.classList.remove('gsap-live');
      cleanups.forEach(function (t) { t.kill(); });
    };
  });
})();
