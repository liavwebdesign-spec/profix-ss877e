/* Profix, version C (the systems map). One file for the three pages; each block checks that its element exists. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var html = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = function () { return !!(window.gsap && window.ScrollTrigger); };
  if (hasGsap()) gsap.registerPlugin(ScrollTrigger);
  html.classList.add("rv-live");

  var refreshSoon = function () { if (!window.ScrollTrigger) return; clearTimeout(refreshSoon.t); refreshSoon.t = setTimeout(function () { ScrollTrigger.refresh(); }, 140); };
  var visible = function (el, margin) { var r = el.getBoundingClientRect(); margin = margin || 0; return r.bottom > margin && r.top < innerHeight - margin && r.width > 0; };
  // a direct check on scroll and resize: an IntersectionObserver alone was throttled in some tabs and entrances never fired
  function inView(el, fn, at) {
    at = at || 0.9;
    function chk() { var r = el.getBoundingClientRect(); if (r.top < innerHeight * at && r.bottom > 0) { off(); fn(); } }
    function off() { removeEventListener("scroll", chk); removeEventListener("resize", chk); }
    addEventListener("scroll", chk, { passive: true }); addEventListener("resize", chk); requestAnimationFrame(chk); setTimeout(chk, 300);
  }

  $$("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
  // WhatsApp opens with a first line, so the first message is not a bare "hi"
  $$("[data-wa]").forEach(function (a) { a.href = "https://wa.me/972546393242?text=" + encodeURIComponent("היי, הגעתי מהאתר של פרופיקס ואשמח לשמוע פרטים"); });

  /* ---------- the page opening: the header, then the hero cells (motion.md 2); reveal for everything else ---------- */
  $$(".hero .rv").forEach(function (el, i) { el.style.setProperty("--i", i); el.classList.add("is-in"); });
  var rvs = $$(".reveal");
  if (reduced || !("IntersectionObserver" in window)) rvs.forEach(function (el) { el.classList.add("is-in"); });
  else {
    var rio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); rio.unobserve(en.target); } }); }, { threshold: 0.12 });
    rvs.forEach(function (el) { rio.observe(el); });
  }

  /* ---------- smooth anchors in JS (never scroll-behavior on html with ScrollTrigger, QA 0ג) ---------- */
  var goTo = function (el, extra) {
    if (!el) return;
    var y = el.getBoundingClientRect().top + scrollY - (extra || 24);
    scrollTo({ top: Math.max(0, y), behavior: reduced ? "auto" : "smooth" });
  };

  /* ---------- header: MV:hd8. Headroom, and the capsule opens into a map ---------- */
  var hd = $("#hd"), tgl = hd && $(".hd-toggle", hd), label = tgl && $(".hd-tl", tgl), panel = $("#hd-panel");
  var setMenu = function () {};
  if (hd && tgl && panel) {
    var last = scrollY, raf = 0;
    var upd = function () {
      raf = 0; var y = scrollY, d = y - last, top = hd.offsetHeight + 24;
      var hold = hd.classList.contains("menu-open") || !!hd.querySelector(":focus-visible");
      if (y <= top || hold) { hd.classList.remove("is-hidden"); last = y; return; }
      if (Math.abs(d) < 6) return;
      hd.classList.toggle("is-hidden", d > 0); last = y;
    };
    addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(upd); }, { passive: true });
    hd.addEventListener("focusin", upd); upd();
    var links = $$("a", panel);
    setMenu = function (open, kb) {
      hd.classList.toggle("menu-open", open); tgl.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "סגירה" : "תפריט"; panel.inert = !open;
      // on a phone the open map is taller than the screen: the page under it stays still (scroll lock on html, headers.md)
      html.classList.toggle("lock", open && innerWidth < 768);
      if (open && kb) setTimeout(function () { links[0].focus({ preventScroll: true }); }, 140);
    };
    setMenu(false);
    tgl.addEventListener("click", function (e) { setMenu(!hd.classList.contains("menu-open"), e.detail === 0); });
    document.addEventListener("click", function (e) { if (hd.classList.contains("menu-open") && !hd.contains(e.target)) setMenu(false); });
    hd.addEventListener("keydown", function (e) { if (e.key === "Escape" && hd.classList.contains("menu-open")) { setMenu(false); tgl.focus(); } });
    var tabbing = false;
    hd.addEventListener("keydown", function (e) { if (e.key === "Tab") { tabbing = true; setTimeout(function () { tabbing = false; }, 0); } });
    hd.addEventListener("focusout", function (e) { if (!hd.classList.contains("menu-open")) return; var to = e.relatedTarget; if (to ? !hd.contains(to) : tabbing) setMenu(false); });
    links.forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
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
    var onScreen = function () { if (visible(vid)) play(); else vid.pause(); };
    addEventListener("scroll", onScreen, { passive: true }); play();
  }

  /* ---------- services: the board (MV:c05), the filter and a tile that opens in place (MV:g23) ---------- */
  var board = $(".svc-board"), svc = null;
  if (board) {
    var tiles = $$(".tile:not(.t-cta)", board), cta = $(".t-cta", board), segBtns = $$(".seg-f button"), count = $("[data-count]");
    var all = tiles.concat(cta ? [cta] : []);
    var canFlip = function () { return !!window.Flip && !reduced; };
    if (window.Flip) gsap.registerPlugin(Flip);
    // the board always closes: the CTA tile takes whatever the last row has left (bento-frame.md 1)
    var closeBoard = function () {
      if (!cta) return;
      var c = innerWidth < 1024 ? 2 : 4, units = 0;
      tiles.forEach(function (t) {
        if (t.classList.contains("is-out")) return;
        if (t.classList.contains("is-open")) units += c === 4 ? 8 : 2;
        else if (t.classList.contains("t-hero")) units += c === 4 ? 4 : 2;
        else units += 1;
      });
      var left = (c - units % c) % c;
      cta.style.gridColumn = "span " + (left || c);
    };
    var busy = false;
    var flipped = function (change, done) {
      done = done || function () {};
      if (!canFlip()) { change(); closeBoard(); refreshSoon(); done(); return; }
      busy = true;
      var state = Flip.getState(all), h0 = board.offsetHeight;
      change(); closeBoard();
      var h1 = board.offsetHeight;
      gsap.fromTo(board, { height: h0 }, { height: h1, duration: 0.55, ease: "power2.inOut", onComplete: function () { gsap.set(board, { clearProps: "height" }); busy = false; refreshSoon(); done(); } });
      Flip.from(state, { duration: 0.55, ease: "power2.inOut", absolute: true,
        onEnter: function (els) { return gsap.fromTo(els, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }); } });
    };
    // closing a tile that is above the screen shrinks the page under the reader: keep what is on screen where it was
    var keepPlace = function (change) {
      var ref = document.elementFromPoint(innerWidth / 2, innerHeight * 0.4), before = ref ? ref.getBoundingClientRect().top : 0;
      change();
      if (ref) { var d = ref.getBoundingClientRect().top - before; if (Math.abs(d) > 1) scrollBy({ top: d, behavior: "instant" }); }
    };
    var setTile = function (t, open) {
      var btn = $(".tile-btn", t), more = $(".tile-more", t), media = $(".more-media", t);
      t.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", String(open)); if (open) t._openedAt = Date.now(); more.hidden = !open; if (media) media.hidden = !open;
    };
    var openOnly = function (t) { tiles.forEach(function (x) { if (x !== t && x.classList.contains("is-open")) setTile(x, false); }); };
    var setShow = function (v, animate) {
      var go = function () {
        board.setAttribute("data-show", v);
        segBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-show") === v)); });
        var n = 0;
        tiles.forEach(function (t) {
          var out = v === "home" && t.getAttribute("data-for") === "biz";
          if (out && t.classList.contains("is-open")) setTile(t, false);
          t.classList.toggle("is-out", out); if (!out) n++;
        });
        if (count) count.textContent = v === "home" ? "מוצגים " + n + " שירותים לבית" : v === "biz" ? "מוצגים " + n + " שירותים לעסק" : "מוצגים כל " + n + " השירותים";
        var r = $('.lead-form input[name="kind"][value="' + (v === "home" ? "home" : "business") + '"]'); if (r && v !== "all") r.checked = true;
      };
      if (animate) flipped(go); else { go(); closeBoard(); }
    };
    segBtns.forEach(function (b) { b.addEventListener("click", function () { setShow(b.getAttribute("data-show"), true); }); });
    tiles.forEach(function (t) {
      $(".tile-btn", t).addEventListener("click", function () {
        var open = !t.classList.contains("is-open");
        // a tile from the top row opens below the large one: when it lands off screen, the page follows it
        flipped(function () { openOnly(t); setTile(t, open); }, function () {
          if (!open) return; var r = t.getBoundingClientRect();
          if (r.top < 64 || r.top > innerHeight * 0.55) goTo(t, 96);
        });
      });
    });
    if ("IntersectionObserver" in window) {
      // it closes only once it has really left: not while the board moves under it, not in the second after it opened,
      // and not when it is merely a few pixels past the edge (an observer fired mid-Flip closed every tile it opened)
      var tio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var t = e.target;
          if (e.isIntersecting || !t.classList.contains("is-open") || busy || Date.now() - (t._openedAt || 0) < 1500) return;
          requestAnimationFrame(function () {
            var r = t.getBoundingClientRect();
            if (!t.classList.contains("is-open") || (r.bottom > -40 && r.top < innerHeight + 40)) return;
            keepPlace(function () { setTile(t, false); closeBoard(); }); refreshSoon();
          });
        });
      }, { rootMargin: "40px 0px" });
      tiles.forEach(function (t) { tio.observe(t); });
    }
    svc = {
      show: setShow,
      open: function (id) {
        var t = $("#svc-" + id); if (!t) return;
        if (t.classList.contains("is-out")) setShow("all", false);
        openOnly(t); setTile(t, true); closeBoard();
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        goTo(t, 96);
      }
    };
    closeBoard(); addEventListener("resize", closeBoard);

    /* the line icons draw themselves as their tile arrives (MV:g86). Uicons are filled shapes: the outline is drawn, then filled */
    if (window.gsap && window.DrawSVGPlugin && !reduced && "IntersectionObserver" in window) {
      gsap.registerPlugin(DrawSVGPlugin);
      var draws = $$(".tile-ic .draw", board);
      draws.forEach(function (svg) { gsap.set($$("path", svg), { drawSVG: "0%", fillOpacity: 0, stroke: "currentColor", strokeWidth: 0.5 }); });
      var dio = new IntersectionObserver(function (es) {
        es.filter(function (e) { return e.isIntersecting; }).forEach(function (e, k) {
          dio.unobserve(e.target); var p = $$("path", e.target);
          gsap.timeline({ delay: 0.25 + k * 0.15 }).to(p, { drawSVG: "100%", duration: 0.9, ease: "power2.inOut", stagger: 0.12 })
            .to(p, { fillOpacity: 1, strokeWidth: 0, duration: 0.4, ease: "power2.out" }, "-=0.2");
        });
      }, { threshold: 0.5 });
      draws.forEach(function (svg) { dio.observe(svg); });
    }
  }

  /* ---------- routing: the hero doors, the menu and the footer arrange the board, then go there ---------- */
  $$("[data-route]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (!board) return; // on an inner page the link goes to index.html#... and the start-up below handles it
      e.preventDefault();
      var v = a.getAttribute("data-route"), id = a.getAttribute("data-open");
      setMenu(false);
      if (id) { svc.open(id); return; }
      svc.show(v, false);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      goTo($("#services"), 24);
    });
  });
  $$('a[href^="#"]:not([data-route])').forEach(function (a) {
    a.addEventListener("click", function (e) { var t = $(a.getAttribute("href")); if (!t || a.classList.contains("skip")) return; e.preventDefault(); goTo(t, 24); if (history.replaceState) history.replaceState(null, "", a.getAttribute("href")); });
  });
  if (board) {
    var q = new URLSearchParams(location.search).get("for");
    if (q === "biz" || q === "home") setShow(q, false);
    var h = location.hash.match(/^#svc-([\w-]+)$/);
    if (h) addEventListener("load", function () { svc.open(h[1]); });
  }

  /* ---------- clients: two rows in opposite directions (MV:c10, QA 13ב). Filled only after the logos have a width ---------- */
  var marqs = $$(".marq");
  if (marqs.length) {
    var t1 = $(".marq-track", marqs[0]), t2 = marqs[1] && $(".marq-track", marqs[1]);
    var originals = $$(".mark", t1);
    var copyOf = function (el) { var c = el.cloneNode(true); c.setAttribute("aria-hidden", "true"); var im = $("img", c); if (im) im.alt = ""; return c; };
    if (t2) originals.slice().reverse().forEach(function (el) { t2.appendChild(copyOf(el)); });
    var loaded = function (im) { return im.complete ? Promise.resolve() : new Promise(function (ok) { im.addEventListener("load", ok, { once: true }); im.addEventListener("error", ok, { once: true }); }); };
    var run = function () {
      if (reduced || !window.gsap) return;
      [[t1, 1], [t2, -1]].forEach(function (p) {
        var tr = p[0]; if (!tr) return;
        var set = $$(".mark", tr), setW = tr.scrollWidth, guard = 0;
        if (setW < 50) return;
        while (tr.scrollWidth < innerWidth * 2 + setW && guard++ < 20) set.forEach(function (el) { tr.appendChild(copyOf(el)); });
        var dur = setW / 90; // 90px a second at least (QA 13ב)
        var tw = p[1] > 0 ? gsap.fromTo(tr, { x: -setW }, { x: 0, duration: dur, ease: "none", repeat: -1 }) : gsap.fromTo(tr, { x: 0 }, { x: -setW, duration: dur, ease: "none", repeat: -1 });
        var host = tr.parentElement, over = false, focus = false;
        var sync = function () { if (over || focus || !visible(host) || html.classList.contains("a11y-still")) tw.pause(); else tw.play(); };
        if (matchMedia("(hover: hover) and (pointer: fine)").matches) { host.addEventListener("pointerenter", function () { over = true; sync(); }); host.addEventListener("pointerleave", function () { over = false; sync(); }); }
        host.addEventListener("focusin", function () { focus = true; sync(); }); host.addEventListener("focusout", function () { focus = false; sync(); });
        addEventListener("scroll", sync, { passive: true }); document.addEventListener("a11y:still", sync); sync();
      });
    };
    Promise.race([Promise.all($$("img", t1).map(loaded)), new Promise(function (ok) { setTimeout(ok, 4000); })]).then(run);
  }

  /* ---------- the signature (MV:g97): the P diagram is a dashed skeleton, and a scan line lights it, no pin ---------- */
  function signature() {
    var scan = $(".scan"); if (!scan || !hasGsap() || reduced) return;
    var frame = $(".scan-frame", scan), color = $(".sc-color", scan), wire = $(".sc-wire", scan), line = $(".sc-line", scan);
    scan.classList.add("is-live");
    gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: frame, start: "top 82%", end: "bottom 38%", scrub: 0.5, invalidateOnRefresh: true } })
      .fromTo(color, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1 }, 0)
      // the skeleton is erased exactly where the colour arrives, so the finished diagram carries no dashes
      .fromTo(wire, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(100% 0% 0% 0%)", duration: 1 }, 0)
      .fromTo(line, { y: 0, opacity: 1 }, { y: function () { return frame.clientHeight; }, duration: 1 }, 0)
      .to(line, { opacity: 0, duration: 0.05 }, 0.95);
  }
  if (document.readyState === "complete") signature(); else addEventListener("load", signature);

  /* ---------- testimonials: the arrows move one card; at the ends they rest ---------- */
  var cor = $(".corridor");
  if (cor) {
    var prev = $('.arr[data-dir="prev"]'), next = $('.arr[data-dir="next"]');
    var step = function () { var c = $(".quote", cor); return c ? c.offsetWidth + parseFloat(getComputedStyle(cor).columnGap || 16) : 320; };
    // RTL: scrollLeft runs from 0 to negative, "next" moves toward the end (left)
    var ends = function () { var x = cor.scrollLeft, max = cor.scrollWidth - cor.clientWidth; if (prev) prev.disabled = x > -2; if (next) next.disabled = Math.abs(x) >= max - 2; };
    if (prev) prev.addEventListener("click", function () { cor.scrollBy({ left: step(), behavior: reduced ? "auto" : "smooth" }); });
    if (next) next.addEventListener("click", function () { cor.scrollBy({ left: -step(), behavior: reduced ? "auto" : "smooth" }); });
    cor.addEventListener("scroll", function () { requestAnimationFrame(ends); }, { passive: true }); addEventListener("resize", ends); ends();
  }

  /* ---------- phone action bar (MV:cv1): after the hero's own button; never over the form, the footer, the keyboard,
     or a button for the same action (conversion.md 1, project-check bar-over-cta) ---------- */
  var bar = $("[data-mbar]");
  if (bar) {
    var origin = $("[data-cta-origin]"), end = $("[data-cta-end]"), foot = $(".ft"), talk = $(".mb-talk", bar), sheet = $("#mb-sheet"), typing = false;
    var same = $$("a[data-quote]").filter(function (a) { return !bar.contains(a) && !(hd && hd.contains(a)); });
    var setSheet = function (o) { bar.classList.toggle("sheet-open", o); talk.setAttribute("aria-expanded", String(o)); sheet.inert = !o; };
    var place = function () {
      var focused = document.activeElement && document.activeElement.matches && document.activeElement.matches("input, textarea, select");
      var o = origin && origin.getBoundingClientRect(), e = end && end.getBoundingClientRect(), f = foot && foot.getBoundingClientRect();
      var on = innerWidth < 768 && (!o || o.bottom < 8) && !(e && e.top < innerHeight * 0.85 && e.bottom > 0) && !(f && f.top < innerHeight) && !typing && !focused
        && !same.some(function (a) { return visible(a, 0); });
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

  /* ---------- the form: validation at the right moment (MV:cv9) and a send that never loses the lead (MV:cv8) ---------- */
  var form = $(".lead-form");
  if (form) {
    var sum = $("[data-summary]", form), sug = $("[data-suggest]", form), fp = $("[data-panel]", form), btn = $(".send", form), lab = $("[data-lab]", btn);
    var box = form.closest(".form-card"), touched = {}, KEY = "pfx3-draft", tries = 0, timer = 0, busy = false, waiting = false, NL = String.fromCharCode(10);
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

  // the fonts change the height of every tile and heading: measure the triggers again once they are in
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshSoon);
  addEventListener("load", refreshSoon);
})();
