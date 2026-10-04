/* Profix, version D (dark cinema). One file for the three pages; each block checks that its element exists. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var html = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = function () { return !!(window.gsap && window.ScrollTrigger); };
  if (hasGsap()) gsap.registerPlugin(ScrollTrigger);
  var desk = function () { return innerWidth >= 1024; };
  var refreshSoon = function () { if (!window.ScrollTrigger) return; clearTimeout(refreshSoon.t); refreshSoon.t = setTimeout(function () { ScrollTrigger.refresh(); }, 140); };
  // a direct check on scroll and resize: an IntersectionObserver alone was throttled in some tabs and entrances never fired
  function inView(el, fn, at) {
    at = at || 0.9;
    function chk() { var r = el.getBoundingClientRect(); if (r.top < innerHeight * at && r.bottom > 0) { off(); fn(); } }
    function off() { removeEventListener("scroll", chk); removeEventListener("resize", chk); }
    addEventListener("scroll", chk, { passive: true }); addEventListener("resize", chk); requestAnimationFrame(chk); setTimeout(chk, 300);
  }
  var visible = function (el, margin) { var r = el.getBoundingClientRect(); margin = margin || 0; return r.bottom > margin && r.top < innerHeight - margin && r.width > 0; };

  $$("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
  // WhatsApp opens with a first line, so the first message is not a bare "hi"
  $$("[data-wa]").forEach(function (a) { a.href = "https://wa.me/972546393242?text=" + encodeURIComponent("היי, הגעתי מהאתר של פרופיקס ואשמח לשמוע פרטים"); });

  /* ---------- the opening: h1 lines rise out of their cut, then the rest; reveal for everything else ---------- */
  $$(".hero .ln > span").forEach(function (el, i) { el.style.setProperty("--i", i); });
  // once an entrance has played it lets go, or its fill would override the opacity the signature writes on scroll
  $$(".hero .rv").forEach(function (el, i) { el.style.setProperty("--i", i); el.addEventListener("animationend", function () { el.style.animation = "none"; }, { once: true }); });
  var rvs = $$(".reveal");
  if (reduced || !("IntersectionObserver" in window)) rvs.forEach(function (el) { el.classList.add("is-in"); });
  else {
    var rio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); rio.unobserve(en.target); } }); }, { threshold: 0.12 });
    rvs.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- smooth anchors in JS (never scroll-behavior on html with ScrollTrigger, QA 0ג) ---------- */
  var goTo = function (el, extra) {
    if (!el) return;
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    var y = el.getBoundingClientRect().top + scrollY - (extra == null ? 24 : extra);
    scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });
  };

  /* ---------- header (MV:hd4): headroom, and the menu opens as a circle from its button ---------- */
  var hd = $("#hd"), mbtn = hd && $(".hd-menu", hd), fs = $("#fs"), setMenu = function () {};
  if (hd) {
    var last = scrollY, raf = 0;
    var upd = function () {
      raf = 0; var y = scrollY, d = y - last, top = hd.offsetHeight + 24;
      var hold = !!hd.querySelector(":focus-visible") || (fs && fs.classList.contains("open"));
      if (y <= top || hold) { hd.classList.remove("is-hidden"); last = y; return; }
      if (Math.abs(d) < 6) return;
      hd.classList.toggle("is-hidden", d > 0); last = y;
    };
    addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    hd.addEventListener("focusin", upd); upd();
  }
  if (mbtn && fs) {
    var fsClose = $(".fs-close", fs), fsLinks = $$(".fs-links a", fs);
    fsLinks.forEach(function (a, i) { a.style.setProperty("--i", i); });
    setMenu = function (open, kb) {
      if (open === fs.classList.contains("open")) return;
      var r = mbtn.getBoundingClientRect();
      fs.style.setProperty("--cx", (r.left + r.width / 2) + "px"); fs.style.setProperty("--cy", (r.top + r.height / 2) + "px");
      // closed, the menu is out of the layout (display none): its icons were measured off the pixel grid while hidden
      clearTimeout(setMenu.t);
      if (open) { fs.classList.add("is-shown"); void fs.offsetWidth; fs.classList.add("open"); }
      else { fs.classList.remove("open"); setMenu.t = setTimeout(function () { fs.classList.remove("is-shown"); }, reduced ? 0 : 720); }
      fs.inert = !open;
      mbtn.setAttribute("aria-expanded", String(open));
      html.classList.toggle("lock", open);
      if (open) setTimeout(function () { (kb ? fsLinks[0] : fsClose).focus({ preventScroll: true }); }, kb ? 320 : 60);
      else mbtn.focus({ preventScroll: true });
    };
    mbtn.addEventListener("click", function (e) { setMenu(true, e.detail === 0); });
    fsClose.addEventListener("click", function () { setMenu(false); });
    $$("a", fs).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    addEventListener("keydown", function (e) {
      if (!fs.classList.contains("open")) return;
      if (e.key === "Escape") { setMenu(false); return; }
      if (e.key !== "Tab") return;
      var f = $$("a, button", fs), i = f.indexOf(document.activeElement);
      var n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
      e.preventDefault(); f[n].focus();
    });
  }

  /* ---------- hero video: plays for everyone, with a pause button; the toolbar's "stop animations" pauses it too ---------- */
  var vid = $(".hero-video"), vt = $(".video-toggle");
  if (vid) {
    var userPaused = false;
    vid.src = innerWidth < 768 ? vid.getAttribute("data-src-mob") : vid.getAttribute("data-src-desk");
    var play = function () { if (userPaused || html.classList.contains("a11y-still")) return; var p = vid.play(); if (p && p.catch) p.catch(function () {}); };
    var setPaused = function (p) { userPaused = p; if (vt) { vt.setAttribute("aria-pressed", String(p)); vt.setAttribute("aria-label", p ? "הפעלת הסרטון" : "עצירת הסרטון"); } if (p) vid.pause(); else play(); };
    if (vt) vt.addEventListener("click", function () { setPaused(!userPaused); });
    document.addEventListener("a11y:still", function (e) { if (e.detail) vid.pause(); else play(); });
    var onScreen = function () { var v = visible(vid.parentElement); if (v && vid.paused) play(); else if (!v && !vid.paused) vid.pause(); };
    addEventListener("scroll", onScreen, { passive: true }); play();
  }

  /* ---------- the signature (MV:g03, the circle replaced by the P of the logo) ----------
     The window is a clip-path written as a path: the four shapes of the P, scaled around a point inside its tail.
     Scaling around the tail (not the centre) is what lets the window open to the whole screen: the tail is solid,
     so once it covers the screen the video does too, and the P's counter never passes over the middle as a dark blob. */
  var hero = $(".hero"), win = hero && $(".hero-win", hero), slot = hero && $(".hero-slot", hero);
  if (hero && win && slot) {
    var P = [
      ["M", 0, 0, "C", 0, 17.54, 8.26, 26.31, 24.78, 26.31, "L", 94.95, 26.31, "L", 125.52, 26.31, "C", 125.52, 4.46, 104.74, 0, 94.95, 0, "Z"],
      ["M", 99.21, 26.31, "L", 99.21, 75.92, "C", 122.16, 75.92, 125.52, 55.13, 125.52, 45.34, "L", 125.52, 26.31, "Z"],
      ["M", 30.58, 49.6, "C", 11.52, 49.6, 0, 57.94, 0, 75.92, "L", 99.21, 75.92, "L", 99.21, 49.6, "Z"],
      ["M", 0, 108.09, "L", 26.21, 108.09, "L", 26.21, 75.92, "L", 0, 75.92, "Z"]
    ];
    var FX = 13.1, FY = 92, copy = $(".hero-copy", hero), route = $(".hero-route", hero), geo = null;
    var pathAt = function (fx, fy, s) {
      var out = "";
      P.forEach(function (seg) {
        var i = 0, even = true;
        seg.forEach(function (t) {
          if (typeof t === "string") { out += t; even = true; return; }
          var v = even ? fx + (t - geo.fx) * s : fy + (t - geo.fy) * s;
          out += (Math.round(v * 10) / 10) + " "; even = !even; i++;
        });
      });
      return "path('" + out.trim() + "')";
    };
    var measure = function () {
      var h = hero.getBoundingClientRect(), r = slot.getBoundingClientRect();
      var s0 = r.width / 125.52;
      var W = h.width, H = Math.min(h.height, innerHeight);
      geo = { fx: FX, fy: FY, s0: s0, f0x: r.left - h.left + FX * s0, f0y: r.top - h.top + FY * s0, cx: W / 2, cy: H / 2,
        s1: 1.1 * Math.max(W / 26.2, H / 32.2) };
    };
    var smooth = function (x) { return x * x * (3 - 2 * x); };
    var render = function (p) {
      if (!geo) measure();
      // without the pin (phone, tablet) the hero is leaving the screen while it grows: the window opens in the first 70%
      if (!desk()) p = Math.min(1, p / 0.7);
      var g = geo, e = smooth(p);
      var s = g.s0 * Math.pow(g.s1 / g.s0, p);
      win.style.clipPath = pathAt(g.f0x + (g.cx - g.f0x) * e, g.f0y + (g.cy - g.f0y) * e, s);
      hero.style.setProperty("--fo", Math.max(0, (p - 0.55) / 0.45).toFixed(3));
      if (!reduced) {
        var t = Math.min(1, p / (desk() ? 0.32 : 0.28));
        if (copy) { copy.style.opacity = String(1 - t); copy.style.transform = "translateY(" + (-60 * t) + "px)"; }
        if (route) route.style.opacity = String(1 - Math.min(1, p / 0.2));
        if (vt) vt.style.opacity = String(1 - Math.min(1, p / 0.2));
      }
    };
    var state = { p: 0 };
    var resetCopy = function () { [copy, route, vt].forEach(function (el) { if (el) { el.style.opacity = ""; el.style.transform = ""; } }); };
    measure(); render(0); hero.classList.add("p-live");
    if (hasGsap() && !reduced) {
      gsap.matchMedia().add({ d: "(min-width: 1024px)", m: "(max-width: 1023px)" }, function (ctx) {
        state.p = 0;
        // desktop: a short pin, one screen (the "no scene stops the scroll for more than a screen and a half" rule)
        // phone and tablet: no pin, the window grows while the hero scrolls away
        var st = ctx.conditions.d
          ? { trigger: hero, start: "top top", end: "+=100%", pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, onRefresh: function () { measure(); render(state.p); } }
          : { trigger: hero, start: "top top", end: "bottom top", scrub: 0.4, invalidateOnRefresh: true, onRefresh: function () { measure(); render(state.p); } };
        gsap.to(state, { p: 1, ease: "none", scrollTrigger: st, onUpdate: function () { render(state.p); } });
        return function () { resetCopy(); };
      });
    } else {
      addEventListener("resize", function () { measure(); render(0); });
    }
  }

  /* ---------- clients: two rows in opposite directions (MV:c10, QA 13ב). Filled only after the logos have a width ---------- */
  var marqs = $$(".marq");
  if (marqs.length) {
    var t1 = $(".marq-track", marqs[0]), t2 = marqs[1] && $(".marq-track", marqs[1]);
    var originals = $$(".mark", t1);
    var copyOf = function (el) { var c = el.cloneNode(true); c.setAttribute("aria-hidden", "true"); var im = $("img", c); if (im) im.alt = ""; return c; };
    if (t2) originals.slice().reverse().forEach(function (el) { t2.appendChild(copyOf(el)); });
    var loaded = function (im) { return im.complete ? Promise.resolve() : new Promise(function (ok) { im.addEventListener("load", ok, { once: true }); im.addEventListener("error", ok, { once: true }); }); };
    // a CSS animation on the compositor: GSAP wrote the track's transform into the page sixty times a second, forever,
    // and every extension watching the page woke up for it (Liav 4.10: "the scroll is broken" in his Chrome only)
    var run = function () {
      if (reduced) return;
      [[t1, 1], [t2, -1]].forEach(function (p) {
        var tr = p[0]; if (!tr) return;
        var set = $$(".mark", tr), setW = tr.scrollWidth, guard = 0;
        if (setW < 50) return;
        while (tr.scrollWidth < innerWidth * 2 + setW && guard++ < 20) set.forEach(function (el) { tr.appendChild(copyOf(el)); });
        tr.style.setProperty("--w", setW + "px"); tr.style.setProperty("--dur", (setW / 90).toFixed(1) + "s"); // 90px a second at least (QA 13ב)
        tr.classList.add("run"); if (p[1] < 0) tr.classList.add("rev");
      });
    };
    Promise.race([Promise.all($$("img", t1).map(loaded)), new Promise(function (ok) { setTimeout(ok, 4000); })]).then(run);
  }

  /* ---------- services (MV:g150 as an accordion, Liav 4.10): a row opens in place on a click, one at a time.
     Nothing opens by itself while scrolling (the sticky panel that did was turned down) ---------- */
  var split = $(".svc-split"), svc = null;
  if (split) {
    var rows = $$(".svc-row", split), groups = $$(".svc-group", split), seg = $$(".seg button"), count = $("[data-count]");
    var openRow = function (row, open) {
      var q = $(".svc-q", row), more = $(".svc-more", row);
      clearTimeout(row._t);
      q.setAttribute("aria-expanded", String(open));
      if (open) {
        more.hidden = false; void more.offsetHeight; row.classList.add("is-open");
        var im = $("img", more); if (im && im.loading === "lazy") im.loading = "eager";
      } else {
        row.classList.remove("is-open");
        row._t = setTimeout(function () { if (!row.classList.contains("is-open")) more.hidden = true; }, reduced ? 0 : 520);
      }
    };
    var toggle = function (r, open, scroll) {
      rows.forEach(function (o) { if (o !== r && o.classList.contains("is-open")) openRow(o, false); });
      openRow(r, open);
      // the rows above may have closed: once the motion settles, the opened row is brought into view when it is off it
      if (open && scroll) setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); var b = r.getBoundingClientRect(); if (b.top < 80 || b.top > innerHeight * 0.55) goTo(r, 96); }, reduced ? 0 : 540);
      else setTimeout(refreshSoon, 560);
    };
    rows.forEach(function (r) { $(".svc-q", r).addEventListener("click", function () { toggle(r, !r.classList.contains("is-open"), true); }); });
    var setShow = function (v, now) {
      split.setAttribute("data-show", v);
      seg.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-show") === v)); });
      groups.forEach(function (g) { g.hidden = !$$(".svc-row", g).some(function (r) { var f = r.getAttribute("data-for"); return v === "all" || f === "both" || f === v; }); });
      var n = rows.filter(function (r) { return r.offsetParent !== null; }).length;
      if (count) count.textContent = "מוצגים " + n + " שירותים";
      // now: the caller scrolls next, so the triggers are measured at once (a refresh in the middle of a smooth scroll stops it)
      if (now && window.ScrollTrigger) ScrollTrigger.refresh(); else refreshSoon();
    };
    seg.forEach(function (b) { b.addEventListener("click", function () { setShow(b.getAttribute("data-show")); }); });
    svc = {
      show: setShow,
      open: function (id) {
        var r = $("#svc-" + id); if (!r) return;
        if (r.offsetParent === null) setShow("all", true);
        rows.forEach(function (o) { if (o !== r) { o.classList.remove("is-open"); $(".svc-more", o).hidden = true; $(".svc-q", o).setAttribute("aria-expanded", "false"); } });
        openRow(r, true);
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        goTo(r, 96);
      }
    };
  }

  /* ---------- routing: the hero line, the menu and the footer arrange the services, then go there ---------- */
  $$("[data-route]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!svc) return; // on an inner page the link goes to index.html#... and the start-up below handles it
      e.preventDefault();
      var v = a.getAttribute("data-route"), id = a.getAttribute("data-open");
      setMenu(false);
      if (id) { svc.open(id); return; }
      svc.show(v, true);
      goTo($("#services"), 24);
    });
  });
  $$('a[href^="#"]:not([data-route])').forEach(function (a) {
    a.addEventListener("click", function (e) { var t = $(a.getAttribute("href")); if (!t || a.classList.contains("skip")) return; e.preventDefault(); goTo(t, 24); if (history.replaceState) history.replaceState(null, "", a.getAttribute("href")); });
  });
  if (svc) {
    var q = new URLSearchParams(location.search).get("for");
    if (q === "biz" || q === "home") svc.show(q, true);
    var hsh = location.hash.match(/^#svc-([\w-]+)$/);
    if (hsh) addEventListener("load", function () { svc.open(hsh[1]); });
  }

  /* ---------- phone action bar (MV:cv1): after the hero's own button; never over the footer, the keyboard,
     or a button for the same action (conversion.md 1) ---------- */
  var bar = $("[data-mbar]");
  if (bar) {
    var origin = $("[data-cta-origin]"), end = $("[data-cta-end]"), foot = $(".ft"), talk = $(".mb-talk", bar), sheet = $("#mb-sheet"), typing = false;
    var same = $$("a[data-quote]").filter(function (a) { return !bar.contains(a) && !(hd && hd.contains(a)) && !(fs && fs.contains(a)); });
    var setSheet = function (o) { bar.classList.toggle("sheet-open", o); talk.setAttribute("aria-expanded", String(o)); sheet.inert = !o; };
    var place = function () {
      var focused = document.activeElement && document.activeElement.matches && document.activeElement.matches("input, textarea, select");
      var o = origin && origin.getBoundingClientRect(), e = end && end.getBoundingClientRect(), f = foot && foot.getBoundingClientRect();
      var on = innerWidth < 768 && (!o || o.bottom < 8) && !(e && e.top < innerHeight * 0.85 && e.bottom > 0) && !(f && f.top < innerHeight) && !typing && !focused
        && !same.some(function (a) { return visible(a, 0); }) && !(fs && fs.classList.contains("open"));
      if (bar.classList.contains("sheet-open")) on = true;
      if (on !== bar.classList.contains("is-on")) {
        bar.classList.toggle("is-on", on); html.classList.toggle("bar-on", on);
        if (on) bar.removeAttribute("inert"); else { bar.setAttribute("inert", ""); setSheet(false); }
      }
    };
    setSheet(false);
    talk.addEventListener("click", function () { setSheet(!bar.classList.contains("sheet-open")); });
    $$("a", sheet).forEach(function (a) { a.addEventListener("click", function () { setSheet(false); }); });
    document.addEventListener("click", function (ev) { if (bar.classList.contains("sheet-open") && !bar.contains(ev.target)) { setSheet(false); place(); } });
    bar.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && bar.classList.contains("sheet-open")) { setSheet(false); talk.focus(); } });
    document.addEventListener("focusin", function (ev) { if (ev.target.matches("input, textarea, select")) { typing = true; place(); } });
    document.addEventListener("focusout", function (ev) { if (ev.target.matches("input, textarea, select")) { typing = false; setTimeout(place, 160); } });
    addEventListener("scroll", function () { requestAnimationFrame(place); }, { passive: true }); addEventListener("resize", place);
    place(); setTimeout(place, 300);
  }

  /* ---------- process (MV:g22): the ring fills with the scroll through a sticky stage; no GSAP needed, the scroll is
     read directly. Reduced motion and no JS: the ring is full and every step is listed (CSS) ---------- */
  var proc = $(".process");
  if (proc && !reduced) {
    var pSteps = $$(".pc-step", proc), dots = $$(".pc-dot", proc), nows = $$(".pc-now", proc), pcLine = $(".pc-line", proc), pcRing = $(".pc-ring", proc);
    // names of their own: the form below declares "ring" and "line" in the same scope (var), and took this ring over
    var N = pSteps.length, cur = -1;
    proc.classList.add("is-live");
    var paint = function () {
      var r = proc.getBoundingClientRect(), run = proc.offsetHeight - innerHeight;
      if (r.bottom < -50 || r.top > innerHeight + 50) return;
      var p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 1;
      // the ring closes a little before the end of the runway, so the last step is read whole
      var f = Math.min(1, p / 0.88);
      var pv = f.toFixed(3); if (pcRing._p !== pv) { pcRing._p = pv; pcRing.style.setProperty("--p", pv); }
      dots.forEach(function (d, i) { var on = f >= i / N - 0.001; if (d.classList.contains("lit") !== on) d.classList.toggle("lit", on); });
      var k = Math.min(N - 1, Math.floor(f * N + 0.0001));
      if (k !== cur) {
        cur = k;
        pSteps.forEach(function (s, i) { s.classList.toggle("on", i === k); });
        nows.forEach(function (s, i) { s.classList.toggle("on", i === k); });
        if (pcLine) pcLine.textContent = $("p", pSteps[k]).textContent;
      }
    };
    var praf2 = 0;
    addEventListener("scroll", function () { if (!praf2) praf2 = requestAnimationFrame(function () { praf2 = 0; paint(); }); }, { passive: true });
    addEventListener("resize", paint); paint();
  }

  /* ---------- why (MV:lm4): a card dims while the next one slides over it ---------- */
  var scards = $$(".scard");
  if (scards.length > 1) {
    var cover = function () {
      var rs = scards.map(function (c) { return c.getBoundingClientRect(); });
      scards.forEach(function (c, i) {
        if (!rs[i + 1]) return;
        var a = rs[i], b = rs[i + 1];
        var f = Math.max(0, Math.min(1, (a.bottom - b.top) / Math.max(1, a.height - (b.top - a.top < 40 ? b.top - a.top : 40))));
        var v = (Math.round(f * 50) / 50).toFixed(2);
        if (c._cv !== v) { c._cv = v; c.style.setProperty("--cover", v); }
      });
    };
    var craf = 0;
    addEventListener("scroll", function () { if (!craf) craf = requestAnimationFrame(function () { craf = 0; cover(); }); }, { passive: true });
    addEventListener("resize", cover); cover();
  }

  /* ---------- testimonials (MV:c12): the arrows move one card; at the ends they rest ---------- */
  var cor = $(".corridor");
  if (cor) {
    var arrs = $$(".q-arr"), cards = $$(".quote", cor);
    var step = function () { return cards.length > 1 ? Math.abs(cards[1].getBoundingClientRect().left - cards[0].getBoundingClientRect().left) : cor.clientWidth; };
    // in RTL the corridor scrolls to negative x: "next" goes further left
    var ends = function () {
      var max = cor.scrollWidth - cor.clientWidth, x = Math.abs(cor.scrollLeft);
      arrs.forEach(function (b) { var d = b.getAttribute("data-dir"); b.disabled = d === "prev" ? x < 4 : x > max - 4; });
    };
    arrs.forEach(function (b) { b.addEventListener("click", function () { cor.scrollBy({ left: (b.getAttribute("data-dir") === "next" ? -1 : 1) * step(), behavior: reduced ? "auto" : "smooth" }); }); });
    cor.addEventListener("scroll", function () { requestAnimationFrame(ends); }, { passive: true }); addEventListener("resize", ends); ends();
  }

  /* ---------- the form: validation at the right moment (MV:cv9) and a send that never loses the lead (MV:cv8) ---------- */
  var form = $(".lead-form");
  if (form) {
    var sum = $("[data-summary]", form), sug = $("[data-suggest]", form), fp = $("[data-panel]", form), btn = $(".send", form), lab = $("[data-lab]", btn);
    var box = form.closest(".form-card"), touched = {}, KEY = "pfx4-draft", tries = 0, timer = 0, busy = false, waiting = false, NL = String.fromCharCode(10);
    var ENDPOINT = form.getAttribute("data-endpoint") || "";
    var DOMAINS = ["gmail.com", "walla.co.il", "walla.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com", "012.net.il", "bezeqint.net", "netvision.net.il"];
    var lev = function (a, b) { var m = a.length, n = b.length, d = [], i, j; for (i = 0; i <= m; i++) d[i] = [i]; for (j = 0; j <= n; j++) d[0][j] = j; for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; };
    var digits = function (v) { return v.replace(/[^0-9]/g, ""); };
    var norm = function (v) { var d = digits(v); if (d.indexOf("972") === 0) d = "0" + d.slice(3); return d; };
    var fmt = function (d) { if (/^0[57][0-9]{8}$/.test(d)) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6); if (/^0[2-489][0-9]{7}$/.test(d)) return d.slice(0, 2) + "-" + d.slice(2, 5) + "-" + d.slice(5); return null; };
    var RULES = {
      name: function (v) { v = v.trim(); if (!v) return "איך לפנות אליכם? חסר שם"; if (v.length < 2) return "שם של אות אחת? כתבו לפחות שתיים"; return ""; },
      phone: function (v) { var d = norm(v), miss; if (!d) return "חסר מספר טלפון";
        if (/^0[57]/.test(d)) { if (d.length < 10) { miss = 10 - d.length; return (miss === 1 ? "חסרה ספרה אחת" : "חסרות " + miss + " ספרות") + ": מספר נייד הוא 10 ספרות"; }
          if (d.length > 10) return "יש ספרות מיותרות: מספר נייד הוא 10 ספרות"; }
        return fmt(d) ? "" : "המספר לא נראה כמו טלפון ישראלי"; },
      // the mail is optional (Oz, 28.9): checked only when something was typed
      email: function (v) { v = v.trim(); if (!v) return ""; if (v.indexOf("@") < 0) return "בכתובת חסר @"; if (!/^[^@ ]+@[^@ ]+[.][^@ ]{2,}$/.test(v)) return "הכתובת לא שלמה, למשל name@gmail.com"; return ""; },
      consent: function (v, el) { return el.checked ? "" : "צריך לאשר את מדיניות הפרטיות כדי שנוכל לחזור אליכם"; }
    };
    var inputs = $$("[data-v]", form);
    var fields = [].slice.call(form.elements).filter(function (f) { return f.name && f.type !== "checkbox" && f.type !== "radio"; });
    try { var dr = JSON.parse(localStorage.getItem(KEY) || "{}"); fields.forEach(function (f) { if (dr[f.name]) f.value = dr[f.name]; }); } catch (e) {}
    var st = 0; form.addEventListener("input", function () { clearTimeout(st); st = setTimeout(function () { var o = {}; fields.forEach(function (f) { o[f.name] = f.value; }); try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }, 300); });
    var errOf = function (inp) { return inp.type === "checkbox" ? $(".consent-err", form) : inp.closest(".f"); };
    var check = function (inp, show) {
      var k = inp.getAttribute("data-v"), m = RULES[k](inp.value, inp), w = errOf(inp);
      if (show || touched[k]) {
        if (inp.type === "checkbox") { w.classList.toggle("is-on", !!m); $("p", w).textContent = m; }
        else { w.classList.toggle("is-bad", !!m); w.classList.toggle("is-ok", !m && inp.value.trim() !== ""); if (m) $(".f-err p", w).textContent = m; }
        inp.setAttribute("aria-invalid", m ? "true" : "false");
      }
      return m;
    };
    var suggest = function (inp) {
      var v = inp.value.trim(), at = v.lastIndexOf("@"); if (at < 1) { sug.classList.remove("is-open"); return; }
      var dom = v.slice(at + 1).toLowerCase(), best = null, bd = 9; if (DOMAINS.indexOf(dom) > -1) { sug.classList.remove("is-open"); return; }
      DOMAINS.forEach(function (d) { var x = lev(dom, d); if (x < bd) { bd = x; best = d; } });
      if (best && bd <= 2) { sug.fixed = v.slice(0, at + 1) + best; $("[data-fixed]", sug).textContent = sug.fixed; sug.classList.add("is-open"); inp.closest(".f").classList.remove("is-ok"); } else sug.classList.remove("is-open");
    };
    $("button", sug).addEventListener("click", function () { var inp = $("[data-v=email]", form); inp.value = sug.fixed; sug.classList.remove("is-open"); check(inp, true); inp.focus(); });
    var summary = function (focus) {
      if (!sum.classList.contains("is-open") && !focus) return 0;
      var bad = inputs.filter(function (inp) { return RULES[inp.getAttribute("data-v")](inp.value, inp); }), ul = $("ul", sum); ul.textContent = "";
      bad.forEach(function (inp) {
        var li = document.createElement("li"), a = document.createElement("a"); a.href = "#" + inp.id;
        var nm = inp.type === "checkbox" ? "אישור הפרטיות" : inp.closest(".f").querySelector("label").textContent.replace(/[(].*[)]/, "").trim();
        a.textContent = nm + ": " + RULES[inp.getAttribute("data-v")](inp.value, inp);
        a.addEventListener("click", function (ev) { ev.preventDefault(); inp.focus(); }); li.appendChild(a); ul.appendChild(li);
      });
      $("[data-sum-count]", sum).textContent = bad.length === 1 ? "שדה אחד צריך תיקון" : bad.length + " שדות צריכים תיקון";
      sum.classList.toggle("is-open", bad.length > 0);
      if (focus && bad.length) { sum.focus({ preventScroll: true }); sum.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" }); }
      return bad.length;
    };
    inputs.forEach(function (inp) {
      var k = inp.getAttribute("data-v");
      if (inp.type === "checkbox") { inp.addEventListener("change", function () { touched[k] = true; check(inp, true); summary(false); }); return; }
      inp.addEventListener("blur", function () {
        if (inp.value.trim() === "" && !touched[k]) return;
        if (k === "phone") { var f = fmt(norm(inp.value)); if (f) inp.value = f; }
        touched[k] = true; check(inp, true); if (k === "email") suggest(inp);
      });
      inp.addEventListener("input", function () { if (touched[k]) check(inp, true); if (k === "email") sug.classList.remove("is-open"); });
    });
    form.addEventListener("input", function () { summary(false); });
    var state = function (s) { box.setAttribute("data-state", s); };
    var setLab = function (t) { lab.classList.remove("in"); void lab.offsetWidth; lab.textContent = t; lab.classList.add("in"); };
    var msg = $("[data-msg]", fp), sub = $("[data-sub]", fp), ring = $(".ring", fp), wa = $("[data-wa-fallback]", fp);
    var show = function (kind, m, s) { fp.setAttribute("data-kind", kind); msg.textContent = m; sub.textContent = s || ""; fp.classList.add("is-open"); };
    var data = function () { var o = {}; fields.forEach(function (f) { o[f.name] = f.value.trim(); }); var k = $('input[name="kind"]:checked', form); o.kind = k ? k.value : ""; return o; };
    var send = function (o) {
      if (!ENDPOINT) return new Promise(function (res) { setTimeout(res, 800); }); // the sketch has no server yet: the flow is real, the request is not
      return fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(o) }).then(function (r) { if (!r.ok) throw new Error(r.status); });
    };
    var countdown = function (sec) {
      clearInterval(timer); var left = sec; ring.style.setProperty("--t", sec + "s"); ring.classList.remove("run"); void ring.getBoundingClientRect(); ring.classList.add("run");
      sub.textContent = "ננסה שוב לבד בעוד " + left + " שניות";
      timer = setInterval(function () { left--; if (left <= 0) { clearInterval(timer); submit(); } else sub.textContent = "ננסה שוב לבד בעוד " + left + " שניות"; }, 1000);
    };
    var submit = function () {
      if (busy) return; busy = true; clearInterval(timer); btn.style.minWidth = btn.offsetWidth + "px";
      var o = data();
      wa.href = "https://wa.me/972546393242?text=" + encodeURIComponent("היי, ניסיתי לשלוח פנייה באתר ולא עבר." + NL + "שם: " + o.name + NL + "טלפון: " + o.phone + (o.message ? NL + o.message : ""));
      if (navigator.onLine === false) { busy = false; waiting = true; state("offline"); setLab("ממתין לחיבור"); show("offline", "אין חיבור לאינטרנט. הפרטים שמורים.", "הטופס יישלח לבד ברגע שהחיבור יחזור."); return; }
      state("sending"); setLab("שולחים"); fp.classList.remove("is-open"); btn.setAttribute("aria-busy", "true");
      send(o).then(function () {
        try { localStorage.removeItem(KEY); sessionStorage.setItem("lead-name", o.name.split(" ")[0]); } catch (e) {}
        location.href = "thanks.html?name=" + encodeURIComponent(o.name.split(" ")[0]) + (o.kind ? "&for=" + o.kind : "");
      }, function () {
        busy = false; tries++; btn.removeAttribute("aria-busy"); state("error"); setLab("לשלוח עכשיו");
        if (tries < 3) { fp.classList.remove("is-final"); show("error", "לא הצלחנו לשלוח. הפרטים שמורים אצלכם.", ""); countdown(tries === 1 ? 5 : 10); }
        else { fp.classList.add("is-final"); show("error", "השרת לא עונה כרגע. הפרטים שמורים.", "הכי מהיר עכשיו: וואטסאפ, או טלפון 054-6393242."); }
      });
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      inputs.forEach(function (inp) { var k = inp.getAttribute("data-v"); touched[k] = true; if (k === "phone") { var f = fmt(norm(inp.value)); if (f) inp.value = f; } check(inp, true); });
      suggest($("[data-v=email]", form));
      if (summary(true)) return;
      tries = 0; submit();
    });
    addEventListener("online", function () { if (waiting) { waiting = false; submit(); } });
  }

  /* ---------- thank-you page (MV:cv3): the name, the time padded to two digits, the track, one conversion per session ---------- */
  var ty = $("[data-thanks]");
  if (ty) {
    var qs = new URLSearchParams(location.search), nm = "";
    try { nm = qs.get("name") || sessionStorage.getItem("lead-name") || ""; } catch (e) {}
    nm = nm.trim().split(" ")[0];
    if (nm) $("[data-name]", ty).textContent = nm; else $("[data-name-wrap]", ty).remove();
    var d = new Date(), p2 = function (n) { return (n < 10 ? "0" : "") + n; };
    $("[data-now]", ty).textContent = p2(d.getHours()) + ":" + p2(d.getMinutes());
    var ol = $(".ty-steps", ty), nowDot = $(".is-now > i", ol), firstDot = $("li > i", ol);
    var fill = function () { ol.style.setProperty("--fill", (nowDot.getBoundingClientRect().top - firstDot.getBoundingClientRect().top) + "px"); };
    fill(); addEventListener("resize", fill);
    inView(ty, function () {
      ty.classList.add("is-in");
      try { if (sessionStorage.getItem("lead-fired")) return; sessionStorage.setItem("lead-fired", "1"); } catch (e) {}
      (window.dataLayer = window.dataLayer || []).push({ event: "generate_lead" });
      if (typeof window.fbq === "function") window.fbq("track", "Lead");
    });
  }

  /* ---------- 404 (MV:cv6): guess the page from the broken address, and search the site ---------- */
  var nf = $("[data-404]");
  if (nf) {
    var PAGES = [
      { t: "עמוד הבית", u: "index.html", k: "בית ראשי home" },
      { t: "פתרונות ושירותים", u: "index.html#services", k: "services שירותים פתרונות" },
      { t: "תמיכת IT שוטפת", u: "index.html#svc-it", k: "it support תמיכה מחשבים" },
      { t: "ענן, Microsoft 365 ו-Google Workspace", u: "index.html#svc-cloud", k: "cloud ענן 365 google" },
      { t: "אבטחת מידע, גיבוי ושחזור", u: "index.html#svc-security", k: "security backup גיבוי אבטחה" },
      { t: "מעבדה לתיקון מחשבים", u: "index.html#svc-lab", k: "lab מעבדה תיקון" },
      { t: "נקודות רשת", u: "index.html#svc-network", k: "network רשת נקודות" },
      { t: "פריסת Wi-Fi", u: "index.html#svc-wifi", k: "wifi אינטרנט" },
      { t: "מצלמות אבטחה ומערכות אזעקה", u: "index.html#svc-cameras", k: "cameras מצלמות אבטחה אזעקה" },
      { t: "אינטרקום ובקרת כניסה", u: "index.html#svc-intercom", k: "intercom אינטרקום" },
      { t: "בית חכם", u: "index.html#svc-smart", k: "smart home בית חכם" },
      { t: "סאונד ומולטימדיה", u: "index.html#svc-sound", k: "sound סאונד מוזיקה רמקולים" },
      { t: "ארונות תקשורת", u: "index.html#svc-cabinets", k: "cabinet ארון תקשורת" },
      { t: "פרויקטים", u: "index.html#projects", k: "projects עבודות" },
      { t: "אודות", u: "../about.html", k: "about אודות" },
      { t: "לקבלת הצעת מחיר", u: "../quote.html", k: "quote הצעה מחיר שאלון" },
      { t: "צור קשר", u: "index.html#contact", k: "contact קשר טלפון" },
      { t: "מאמרים וטיפים", u: "../articles.html", k: "articles מאמרים טיפים" },
      { t: "הצהרת נגישות", u: "../accessibility.html", k: "accessibility נגישות" },
      { t: "מדיניות פרטיות", u: "../privacy.html", k: "privacy פרטיות" }];
    var SLUG = { "services": "index.html#services", "projects": "index.html#projects", "about": "../about.html", "contact": "index.html#contact", "quote": "../quote.html", "articles": "../articles.html", "smart-home": "index.html#svc-smart", "cameras": "index.html#svc-cameras", "wifi": "index.html#svc-wifi", "network": "index.html#svc-network", "sound": "index.html#svc-sound", "it-support": "index.html#svc-it", "cloud": "index.html#svc-cloud" };
    var path = decodeURIComponent(location.pathname).split("/").filter(Boolean).pop() || "";
    path = path.replace(/[.]html$/, "").toLowerCase();
    $("[data-shown]", nf).textContent = "/" + path;
    var levd = function (a, b) { var m = a.length, n = b.length, dd = [], i, j; for (i = 0; i <= m; i++) dd[i] = [i]; for (j = 0; j <= n; j++) dd[0][j] = j; for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) dd[i][j] = Math.min(dd[i - 1][j] + 1, dd[i][j - 1] + 1, dd[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return dd; };
    var best = null, bs = 1;
    Object.keys(SLUG).forEach(function (s) { if (!path) return; var dd = levd(path, s), r = dd[path.length][s.length] / Math.max(path.length, s.length); if (r < bs) { bs = r; best = s; } });
    var guess = $("[data-guess]", nf);
    if (best && bs <= 0.45 && path !== "404") {
      guess.hidden = false; guess.href = SLUG[best];
      var hit = PAGES.find(function (p) { return p.u === SLUG[best]; }) || { t: best };
      $("[data-gt]", nf).textContent = hit.t;
      var gu = $("[data-gu]", nf), dd = levd(path, best), i = path.length, j = best.length, out = [];
      while (j > 0) { if (i > 0 && path[i - 1] === best[j - 1] && dd[i][j] === dd[i - 1][j - 1]) { out.unshift([best[j - 1], 0]); i--; j--; } else if (i > 0 && dd[i][j] === dd[i - 1][j - 1] + 1) { out.unshift([best[j - 1], 1]); i--; j--; } else if (dd[i][j] === dd[i][j - 1] + 1) { out.unshift([best[j - 1], 1]); j--; } else i--; }
      gu.textContent = "/"; out.forEach(function (c) { if (c[1]) { var mk = document.createElement("mark"); mk.textContent = c[0]; gu.appendChild(mk); } else gu.appendChild(document.createTextNode(c[0])); });
      $("[data-h]", nf).textContent = "הכתובת הזו לא קיימת, אבל נראה שחיפשתם משהו קרוב";
    }
    var qi = $("[data-q]", nf), list = $("[data-list]", nf), empty = $("[data-empty]", nf);
    var filter = function () {
      var v = qi.value.trim().toLowerCase(), n = 0; list.textContent = "";
      PAGES.forEach(function (p) {
        var hay = (p.t + " " + p.k).toLowerCase(); if (v && hay.indexOf(v) < 0) return; if (!v && n >= 6) return; n++;
        var li = document.createElement("li"), a = document.createElement("a"), s = document.createElement("span"), at = p.t.toLowerCase().indexOf(v);
        a.href = p.u;
        if (v && at > -1) { s.appendChild(document.createTextNode(p.t.slice(0, at))); var m = document.createElement("mark"); m.textContent = p.t.slice(at, at + v.length); s.appendChild(m); s.appendChild(document.createTextNode(p.t.slice(at + v.length))); }
        else s.textContent = p.t;
        a.appendChild(s); li.appendChild(a); list.appendChild(li);
      });
      empty.hidden = n > 0;
    };
    qi.addEventListener("input", filter);
    qi.addEventListener("keydown", function (e) { if (e.key === "ArrowDown") { var a = $("a", list); if (a) { e.preventDefault(); a.focus(); } } });
    list.addEventListener("keydown", function (e) { var all = $$("a", list), k = all.indexOf(document.activeElement); if (e.key === "ArrowDown" && k < all.length - 1) { e.preventDefault(); all[k + 1].focus(); } else if (e.key === "ArrowUp") { e.preventDefault(); (k > 0 ? all[k - 1] : qi).focus(); } else if (e.key === "Escape") qi.focus(); });
    filter();
  }

  /* ---------- icons on whole pixels: an icon placed at x.33 is drawn blurred (grid-check). Fluid type puts buttons and
     lines at fractional offsets, so each visible icon is nudged by the fraction, once the layout has settled ---------- */
  var snapIcons = function () {
    var dpr = devicePixelRatio || 1;
    var todo = [];
    $$("svg.icon").forEach(function (e) {
      var r = e.getBoundingClientRect(); if (!r.width) return;
      var cur = e._snap || [0, 0];
      // a fixed control is drawn in screen coordinates; everything else on the page grid
      var fixed = e.closest(".fab-a11y, .fab-wa, .mbar, .hd, .fs, .a11y-panel");
      var x = r.left + (fixed ? 0 : scrollX), y = r.top + (fixed ? 0 : scrollY);
      // the box already carries cur: the unnudged position is x - cur, and the new nudge rounds that
      var bx = x - cur[0], by = y - cur[1];
      var dx = Math.round(bx * dpr) / dpr - bx, dy = Math.round(by * dpr) / dpr - by;
      if (Math.abs(dx - cur[0]) > 0.01 || Math.abs(dy - cur[1]) > 0.01) todo.push([e, dx, dy]);
    });
    // all reads first, then the writes: one layout, not one per icon
    todo.forEach(function (t) { t[0]._snap = [t[1], t[2]]; t[0].style.translate = (Math.abs(t[1]) < .005 && Math.abs(t[2]) < .005) ? "" : t[1].toFixed(3) + "px " + t[2].toFixed(3) + "px"; });
  };
  window.__snapIcons = snapIcons;
  // an entrance that ends moves the icons in it: they go back on the grid once it has
  document.addEventListener("transitionend", function (e) { if (e.target.classList && e.target.classList.contains("reveal")) { clearTimeout(snapIcons.r); snapIcons.r = setTimeout(snapIcons, 120); } });
  var snapSoon = function () { clearTimeout(snapSoon.t); snapSoon.t = setTimeout(snapIcons, 200); };
  addEventListener("load", snapSoon); addEventListener("resize", snapSoon);
  addEventListener("scroll", function () { clearTimeout(snapSoon.s); snapSoon.s = setTimeout(snapIcons, 1000); }, { passive: true }); setTimeout(snapIcons, 2200); // after the opening entrances
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(snapSoon);
  document.addEventListener("click", function () { setTimeout(snapIcons, 800); });

  addEventListener("load", refreshSoon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshSoon);
})();
