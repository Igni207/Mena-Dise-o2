/* ==========================================================================
   Casa Carmín — construcción de la página y escenas con scroll.
   Requiere: gsap, ScrollTrigger y Lenis (carpeta vendor/).
   Sin ellos, o con “reducir movimiento”, la página se muestra completa y quieta.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var one = function (s, el) { return (el || document).querySelector(s); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var motion = !!(gsap && ST) && !reduce;
  var sections = $('section[data-num]');
  var total = String(sections.length - 1).padStart(2, '0');

  window.CC = { lenis: null, scrollTo: scrollTo };

  /* ------------------------------------------------------------------------
     1. Dibujos de plano (decorativos): ejes, burbujas, rótulo y trazos.
     ------------------------------------------------------------------------ */
  sections.forEach(function (sec) {
    if (!sec.id) sec.id = 'lamina-' + sec.dataset.num;
    var type = sec.dataset.plano;
    if (!type) return;
    var h = '<span class="ax-v l"></span><span class="ax-v m"></span><span class="ax-v r"></span><span class="ax-h t"></span><span class="ax-h b"></span>';
    h += '<span class="scan"></span>';
    if (type === 'full') h += '<span class="bignum">' + sec.dataset.num + '</span>';
    if (type === 'full') h += '<span class="bub l">A</span><span class="bub m">B</span><span class="bub r">C</span>';
    if (sec.dataset.lamina) h += '<span class="rotulo">Lámina ' + sec.dataset.num + ' / ' + total + ' · ' + sec.dataset.lamina + '</span>';
    var pl = document.createElement('div');
    pl.className = 'plano';
    pl.setAttribute('aria-hidden', 'true');
    pl.innerHTML = h;
    sec.insertBefore(pl, sec.firstChild);
  });

  $('.obra').forEach(function (o) {
    o.classList.add('cota');
    o.insertAdjacentHTML('beforeend', '<svg class="trazo" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><rect x="0" y="0" width="100" height="100"/><line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/></svg>');
  });

  // Cotas: el ancho real de cada pieza en la página
  function measure() {
    $('.cota').forEach(function (el) { el.dataset.cota = String(Math.round(el.getBoundingClientRect().width)); });
  }

  // Memoria: cada palabra en su propio span para encenderlas de a una
  $('.words').forEach(function (p) {
    Array.prototype.slice.call(p.childNodes).forEach(function (node) {
      if (node.nodeType === 3) {
        var frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
        });
        p.replaceChild(frag, node);
      } else if (node.nodeType === 1) {
        node.classList.add('w');
      }
    });
  });

  /* ------------------------------------------------------------------------
     2. Navegación: menú de láminas, volver, índice lateral y progreso.
     ------------------------------------------------------------------------ */
  var current = 0;
  var idxNum = one('[data-index-num]'), idxName = one('[data-index-name]');
  function setIndex(i) {
    var changed = !idxNum || idxNum.textContent !== sections[i].dataset.num;
    current = i;
    if (idxNum) idxNum.textContent = sections[i].dataset.num;
    if (idxName) idxName.textContent = sections[i].dataset.name;
    if (motion && changed && idxNum) gsap.fromTo([idxNum, idxName], { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out', stagger: 0.06, overwrite: true });
  }

  function scrollTo(target) {
    var lenis = window.CC.lenis;
    // Si la sección queda fija con el scroll, ir al comienzo de ese tramo
    if (target !== 0 && ST && ST.getAll) {
      var pinned = ST.getAll().filter(function (s) { return s.pin === target; })[0];
      if (pinned) target = pinned.start;
    }
    if (lenis) { lenis.scrollTo(target, { duration: 1.4 }); return; }
    if (typeof target === 'number') { window.scrollTo({ top: target, behavior: reduce ? 'auto' : 'smooth' }); return; }
    if (target === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  var menu = one('#menu'), menuBtn = one('[data-action="menu"]');
  var list = one('.menu__list');
  sections.forEach(function (sec) {
    var li = document.createElement('li');
    var label = (sec.dataset.name.charAt(0) + sec.dataset.name.slice(1).toLowerCase()).replace(/3d$/, '3D');
    li.innerHTML = '<a href="#' + sec.id + '"><span>' + sec.dataset.num + '</span>' + label + '</a>';
    list.appendChild(li);
  });
  function openMenu() {
    menu.hidden = false;
    menuBtn.setAttribute('aria-expanded', 'true');
    doc.classList.add('is-overlay');
    if (window.CC.lenis) window.CC.lenis.stop();
    if (motion) {
      gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.inOut' });
      gsap.fromTo($('.menu__list li', menu), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.04, delay: 0.3 });
    }
    one('.menu__close').focus();
  }
  function closeMenu(then) {
    var done = function () {
      menu.hidden = true;
      menuBtn.setAttribute('aria-expanded', 'false');
      doc.classList.remove('is-overlay');
      if (window.CC.lenis) window.CC.lenis.start();
      if (then) then(); else menuBtn.focus();
    };
    if (motion) gsap.to(menu, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.6, ease: 'expo.inOut', onComplete: done });
    else done();
  }
  menu.addEventListener('click', function (ev) {
    var a = ev.target.closest('a');
    if (a) {
      ev.preventDefault();
      var target = one(a.getAttribute('href'));
      closeMenu(function () { scrollTo(target); });
    }
  });
  menu.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeMenu(); });

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-action]');
    if (!b) return;
    var a = b.dataset.action;
    if (a === 'menu') openMenu();
    if (a === 'menu-close') closeMenu();
    if (a === 'top') scrollTo(0);
    if (a === 'prev') scrollTo(current > 0 ? sections[current - 1] : 0);
  });

  /* ------------------------------------------------------------------------
     3. Sin animaciones: todo visible, índice y progreso simples.
     ------------------------------------------------------------------------ */
  if (!motion) {
    doc.classList.add('no-motion');
    doc.classList.remove('is-loading');
    measure();
    var bar = one('.progress');
    window.addEventListener('scroll', function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
    }, { passive: true });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setIndex(sections.indexOf(e.target)); });
      }, { threshold: 0.5 });
      sections.forEach(function (s) { io.observe(s); });
    }
    return;
  }

  /* ------------------------------------------------------------------------
     4. Con animaciones.
     ------------------------------------------------------------------------ */
  gsap.registerPlugin(ST);

  // Scroll suave
  if (window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, anchors: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.CC.lenis = lenis;
  }

  // Títulos letra por letra
  function splitChars(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split('').forEach(function (c) {
        if (/\s/.test(c)) { frag.appendChild(document.createTextNode(' ')); return; }
        var s = document.createElement('span'); s.className = 'ch'; s.textContent = c; frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  $('.h2').forEach(function (h) {
    h.setAttribute('aria-label', $('.ln', h).map(function (l) { return l.textContent.trim(); }).join(' '));
    $('.ln', h).forEach(function (l) { l.setAttribute('aria-hidden', 'true'); });
    $('.ln > span', h).forEach(splitChars);
  });
  $('.hero__word').forEach(splitChars);

  measure();

  // Entrada: contador, ejes y telón que sube
  function intro(done) {
    var loader = one('.loader');
    if (!loader) { doc.classList.remove('is-loading'); done(); return; }
    doc.classList.add('is-intro');
    doc.classList.remove('is-loading');
    if (window.CC.lenis) window.CC.lenis.stop();
    var count = one('.loader__count', loader), n = { v: 0 };
    gsap.timeline({ onComplete: function () { doc.classList.remove('is-intro'); if (window.CC.lenis) window.CC.lenis.start(); } })
      .fromTo($('.loader__ax', loader), { scaleX: 0 }, { scaleX: 1, duration: 1, ease: 'power2.inOut', stagger: 0.12 }, 0)
      .to(n, { v: 100, duration: 1.3, ease: 'power2.inOut', onUpdate: function () { count.textContent = String(Math.round(n.v)).padStart(3, '0'); } }, 0)
      .fromTo(one('.loader__bar', loader), { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'power2.inOut' }, 0)
      .to($('.loader__in > *', loader), { yPercent: -60, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.05 }, 1.35)
      .fromTo(loader, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut' }, 1.55)
      .add(done, 1.9);
  }

  /* 4.1 Cada pieza: se dibuja en su lugar y aparece de golpe ------------- */
  function piece(tl, el, at) {
    if (el.classList.contains('obra')) {
      var fill = one('.fill', el), tr = one('.trazo', el), media = one('.media', el);
      var lbls = $(':scope > .lbl', el);
      gsap.set(fill, { clipPath: 'inset(50% 50% 50% 50%)' });
      gsap.set(tr, { opacity: 1, clipPath: 'inset(0% 100% 100% 0%)' });
      gsap.set(el, { '--co': 0 });
      if (lbls.length) gsap.set(lbls, { opacity: 0 });
      tl.to(tr, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'power2.inOut' }, at)
        .to(el, { '--co': 1, duration: 0.2 }, at + 0.15)
        .to(fill, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4, ease: 'expo.out' }, at + 0.45)
        .to(tr, { opacity: 0, duration: 0.4 }, at + 0.75)
        .to(el, { '--co': 0, duration: 0.4 }, at + 0.9);
      if (media) tl.fromTo(media, { scale: 1.3 }, { scale: 1, duration: 1.2, ease: 'expo.out' }, at + 0.45);
      if (lbls.length) tl.to(lbls, { opacity: 1, duration: 0.3, stagger: 0.06 }, at + 0.7);
      return 0.24;
    }
    var lines = $('.ch', el), inner = one('.pz-in', el);
    gsap.set(el, { '--d': 0, '--bpo': 1, '--co': 0 });
    if (lines.length) gsap.set(lines, { yPercent: 125, rotate: 7 });
    else if (inner) gsap.set(inner, { opacity: 0, scale: 1.04, filter: 'blur(8px)' });
    tl.to(el, { '--d': 4, duration: 0.4, ease: 'power1.inOut' }, at)
      .to(el, { '--co': 1, duration: 0.2 }, at + 0.1);
    if (lines.length) tl.to(lines, { yPercent: 0, rotate: 0, duration: 0.7, ease: 'expo.out', stagger: { amount: 0.3 } }, at + 0.38);
    else if (inner) tl.to(inner, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.3, ease: 'expo.out' }, at + 0.38);
    tl.to(el, { '--bpo': 0, '--co': 0, duration: 0.5 }, at + 0.75);
    return 0.15;
  }

  /* 4.2 Cada sección es una lámina que se construye al entrar ------------ */
  sections.forEach(function (sec, i) {
    var tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
    var pl = one('.plano', sec);
    if (pl) {
      tl.fromTo($('.ax-v', pl), { scaleY: 0 }, { scaleY: 1, duration: 1.1, ease: 'power2.inOut', stagger: 0.12 }, 0)
        .fromTo($('.ax-h', pl), { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power2.inOut', stagger: 0.12 }, 0.1)
        .fromTo(pl, { '--grid': 0 }, { '--grid': 0.05, duration: 1.2 }, 0.2);
      var bubs = $('.bub', pl), rot = $('.rotulo', pl);
      if (bubs.length) tl.fromTo(bubs, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.2)', stagger: 0.08 }, 0.45);
      if (rot.length) tl.fromTo(rot, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.5 }, 0.8);
      // Línea que barre la lámina y número gigante de fondo
      var scan = one('.scan', pl), big = one('.bignum', pl);
      if (scan) tl.fromTo(scan, { top: '0%', opacity: 1 }, { top: '100%', opacity: 0, duration: 1.7, ease: 'power2.inOut' }, 0);
      if (big) {
        tl.fromTo(big, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.4);
        gsap.fromTo(big, { yPercent: 30 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    }
    var parts = $('.pz, .obra', sec);
    if (i === 0) {
      var at = 0.3;
      parts.forEach(function (el) { at += piece(tl, el, at); });
    } else {
      parts.forEach(function (el) {
        var ptl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
        piece(ptl, el, 0);
        el._build = ptl;
      });
      // Las piezas que entran juntas se arman casi a la vez, con un pequeño escalonado.
      // Si una ya quedó atrás (scroll rápido o salto del menú), se arma de inmediato.
      ST.batch(parts, {
        start: 'top 92%', once: true,
        onEnter: function (batch) {
          batch.forEach(function (el, k) {
            var r = el.getBoundingClientRect();
            if (r.bottom < window.innerHeight * 0.4) { el._build.progress(1); return; }
            gsap.delayedCall(k * 0.08, function () { el._build.play(); });
          });
        }
      });
    }

    if (i === 0) {
      tl.fromTo($('.hero__word .ch', sec), { yPercent: 60, opacity: 0, rotate: 6 }, { yPercent: 0, opacity: 1, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06 }, 0.1);
      intro(function () { tl.play(); });
    } else {
      ST.create({ trigger: sec, start: 'top 75%', once: true, onEnter: function () { tl.play(); } });
    }
    ST.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: function (s) { if (s.isActive) setIndex(i); } });
  });

  /* 4.3 Escenas con scroll ----------------------------------------------- */

  // Portada fija: CASA y CARMÍN se separan, la casa avanza
  var hero = one('.hero');
  gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=90%', pin: true, scrub: 1 } })
    .to(one('.hero__word--1'), { xPercent: -14, ease: 'none' }, 0)
    .to(one('.hero__word--2'), { xPercent: 10, ease: 'none' }, 0)
    .to(one('.hero__house-wrap'), { scale: 1.14, xPercent: 6, yPercent: -10, transformOrigin: '0% 100%', ease: 'none' }, 0)
    .to(one('.hero__foot'), { y: -90, opacity: 0, ease: 'none' }, 0);

  // Memoria: las palabras se encienden
  var words = one('.words');
  if (words) gsap.fromTo($('.w', words), { opacity: 0.12 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: words, start: 'top 80%', end: 'bottom 40%', scrub: true } });

  // Profundidad en todas las imágenes
  // Filtrar: la foto de abajo se mueve más lento que los recortes de arriba
  $('.obra--capas .media').forEach(function (m) {
    gsap.fromTo(m, { yPercent: -10 }, { yPercent: 10, ease: 'none', scrollTrigger: { trigger: m.closest('.obra'), start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  $('.obra:not(.obra--still):not(.obra--capas) .media').forEach(function (m) {
    gsap.fromTo(m, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: m.closest('.obra'), start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Implantación: llega inclinada y se nivela
  $('.obra--tilt').forEach(function (o) {
    gsap.fromTo(o, { rotate: -6, transformOrigin: '0% 100%' }, { rotate: 0, ease: 'none', scrollTrigger: { trigger: o, start: 'top 100%', end: 'center 68%', scrub: 0.4 } });
  });

  // Volumetría: las barras se cruzan en X
  $('.xbars').forEach(function (x) {
    var bars = [one('.xbars__a', x), one('.xbars__b', x)];
    gsap.timeline({ scrollTrigger: { trigger: x, start: 'top 100%', end: 'center 65%', scrub: 0.4 } })
      .fromTo(bars[0], { rotate: 0, scaleX: 0.12 }, { rotate: 30, scaleX: 1, ease: 'none', duration: 0.6 }, 0)
      .fromTo(bars[1], { rotate: 0, scaleX: 0.12 }, { rotate: -30, scaleX: 1, ease: 'none', duration: 0.6 }, 0)
      .to(bars, { scaleY: 0.05, opacity: 0.8, ease: 'power2.in', duration: 0.4 }, 0.6);
  });

  // Celosías: las lamas se abren desde el centro
  $('.slats').forEach(function (s) {
    gsap.fromTo($('span', s), { scaleX: 1 }, { scaleX: 0, ease: 'none', stagger: { each: 0.04, from: 'center' }, scrollTrigger: { trigger: s, start: 'top 100%', end: 'center 65%', scrub: 0.4 } });
  });

  // Balcón: la foto se abre hacia el paisaje y la segunda línea del título se proyecta
  var dbl = one('.obra--balcon');
  if (dbl) gsap.fromTo(one('.media', dbl), { clipPath: 'inset(0% 38% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: dbl, start: 'top 100%', end: 'center 65%', scrub: 0.4 } });
  var dh = $('.interior__title .ln');
  if (dh.length === 2) gsap.fromTo(dh[1], { x: 0 }, { x: function () { return window.innerWidth > 820 ? 40 : 16; }, ease: 'none', scrollTrigger: { trigger: dh[0], start: 'top 80%', end: 'top 15%', scrub: true } });

  // Tubo: se fija y la boca se abre hasta liberar la vista
  var tubo = one('.tubo');
  if (tubo) {
    gsap.timeline({ scrollTrigger: { trigger: tubo, start: 'top top', end: '+=140%', pin: true, scrub: 1 } })
      .fromTo(one('.tubo__media', tubo), { clipPath: 'inset(36% 40% 36% 40%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.in' }, 0)
      .fromTo(one('.tubo__frame', tubo), { top: '36%', bottom: '36%', left: '40%', right: '40%' }, { top: '-4%', bottom: '-4%', left: '-4%', right: '-4%', ease: 'power2.in' }, 0)
      .to(one('.tubo__text .h2', tubo), { scale: 1.3, opacity: 0, transformOrigin: '0% 50%', ease: 'power1.in' }, 0.15)
      .fromTo(one('.tubo__end', tubo), { opacity: 0, y: 50 }, { opacity: 1, y: 0, ease: 'power2.out' }, 0.7);
  }

  // Modelo: los volúmenes del esquema se ensamblan
  var vw = one('.viewer');
  if (vw) {
    gsap.timeline({ scrollTrigger: { trigger: vw, start: 'top 85%', end: 'center 45%', scrub: 1 } })
      .fromTo(one('.vg', vw), { opacity: 0 }, { opacity: 1, ease: 'none' }, 0)
      .fromTo(one('.va', vw), { y: 160, opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0)
      .fromTo(one('.vb', vw), { y: -240, opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.25)
      .fromTo(one('.vt', vw), { x: -170, y: -80, opacity: 0 }, { x: 0, y: 0, opacity: 1, ease: 'none' }, 0.5);
  }

  // Recorrido: el video se ensancha
  var video = one('.video');
  if (video) gsap.fromTo(video, { width: '62%' }, { width: '100%', ease: 'none', scrollTrigger: { trigger: video, start: 'top 100%', end: 'center 65%', scrub: 0.4 } });

  // Epílogo: el título se cierra
  var epi = one('.epilogo__title');
  if (epi) gsap.fromTo(epi, { letterSpacing: '-0.04em' }, { letterSpacing: '-0.075em', ease: 'none', scrollTrigger: { trigger: epi, start: 'top 95%', end: 'top 40%', scrub: true } });

  // Galería: se fija y corre en horizontal (solo pantallas anchas)
  var mm = gsap.matchMedia();
  mm.add('(min-width: 821px)', function () {
    var gs = one('.gallery'), track = one('.gallery__track'), win = one('.gallery__window');
    var dist = function () { return Math.max(0, track.scrollWidth - win.clientWidth); };
    gsap.to(track, { x: function () { return -dist(); }, ease: 'none', scrollTrigger: { trigger: gs, start: 'top top', end: function () { return '+=' + dist() * 0.75; }, pin: true, scrub: 1, invalidateOnRefresh: true } });
  });

  // Cintas: corren solas y se aceleran con la velocidad del scroll
  var tracks = $('.marquee__track').map(function (t) {
    var rev = t.parentElement.hasAttribute('data-reverse');
    var tw = rev
      ? gsap.fromTo(t, { xPercent: -50 }, { xPercent: 0, duration: 30, ease: 'none', repeat: -1 })
      : gsap.to(t, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
    tw.totalTime(30 * 40);
    return tw;
  });
  var boost = 0, dir = 1;
  var bar = gsap.quickSetter(one('.progress'), 'scaleX');
  var gtrack = one('.gallery__track');
  var skew = gsap.quickTo(gtrack, 'skewX', { duration: 0.5, ease: 'power3' });
  ST.create({
    start: 0, end: 'max',
    onUpdate: function (s) {
      var v = s.getVelocity();
      dir = s.direction;
      boost = Math.min(Math.abs(v) / 180, 12);
      bar(s.progress);
      if (window.innerWidth > 820) skew(gsap.utils.clamp(-7, 7, v / -320));
    }
  });
  gsap.ticker.add(function () {
    boost *= 0.93;
    tracks.forEach(function (m) { m.timeScale(dir * (1 + boost)); });
  });

  /* 4.4 Más movimiento ---------------------------------------------------- */

  // Las líneas de cada título se deslizan en sentidos opuestos
  $('.h2').forEach(function (h) {
    if (h.closest('.gallery, .tubo, .hero')) return;
    $('.ln', h).forEach(function (ln, i) {
      var d = i % 2 ? -1 : 1;
      gsap.fromTo(ln, { xPercent: 4 * d }, { xPercent: -4 * d, ease: 'none', scrollTrigger: { trigger: h, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  // Epílogo: la línea del horizonte se traza
  var horizon = one('.epilogo__horizon');
  if (horizon) gsap.fromTo(horizon, { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: horizon, start: 'top 95%', end: 'top 45%', scrub: true } });

  // Sello giratorio de la portada: gira solo y se acelera con el scroll
  var badge = one('.hero__badge');
  if (badge) {
    var bt = gsap.to(badge, { rotation: 360, duration: 16, ease: 'none', repeat: -1, transformOrigin: '50% 50%' });
    bt.totalTime(16 * 40);
    tracks.push(bt);
  }

  // Las cintas se inclinan con la velocidad
  var mskew = $('.marquee__track').map(function (t) { return gsap.quickTo(t, 'skewX', { duration: 0.4, ease: 'power3' }); });
  ST.create({ start: 0, end: 'max', onUpdate: function (s) { var k = gsap.utils.clamp(-14, 14, s.getVelocity() / -220); mskew.forEach(function (f) { f(k); }); } });

  // Solo con mouse: cursor de plano, botones magnéticos, portada y galería que reaccionan
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var cur = document.createElement('div');
    cur.className = 'cursor';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="cursor__ring"></span><span class="cursor__h"></span><span class="cursor__v"></span><span class="cursor__label"></span>';
    document.body.appendChild(cur);
    var cx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3' });
    var cy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3' });
    var clabel = one('.cursor__label', cur), shown = false;
    var pad4 = function (v) { return String(Math.round(v)).padStart(4, '0'); };
    window.addEventListener('pointermove', function (ev) {
      if (ev.pointerType === 'touch') return;
      if (!shown) { shown = true; gsap.set(cur, { x: ev.clientX, y: ev.clientY }); cur.classList.add('is-on'); }
      cx(ev.clientX); cy(ev.clientY);
      var t = ev.target && ev.target.closest ? ev.target.closest('a, button, .viewer__canvas') : null;
      cur.classList.toggle('is-hover', !!t);
      var txt = !t ? 'X ' + pad4(ev.clientX) + ' · Y ' + pad4(ev.clientY + window.scrollY)
        : t.classList.contains('gallery__item') ? 'Ampliar'
        : t.classList.contains('video__play') ? 'Reproducir'
        : t.classList.contains('viewer__canvas') ? 'Girar' : '';
      if (clabel.textContent !== txt) clabel.textContent = txt;
    }, { passive: true });

    $('.chip, .nav__btn, .video__play, .hero__down').forEach(function (el) {
      var mx = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
      var my = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
      el.addEventListener('pointermove', function (ev) {
        var r = el.getBoundingClientRect();
        mx((ev.clientX - (r.left + r.width / 2)) * 0.35);
        my((ev.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener('pointerleave', function () { mx(0); my(0); });
    });

    var houseIn = one('.hero__house-in'), heroWords = one('.hero__words');
    var hx = gsap.quickTo(houseIn, 'x', { duration: 0.9, ease: 'power3' }), hy = gsap.quickTo(houseIn, 'y', { duration: 0.9, ease: 'power3' });
    var wx = gsap.quickTo(heroWords, 'x', { duration: 1.2, ease: 'power3' }), wy = gsap.quickTo(heroWords, 'y', { duration: 1.2, ease: 'power3' });
    hero.addEventListener('pointermove', function (ev) {
      var nx = ev.clientX / window.innerWidth - 0.5, ny = ev.clientY / window.innerHeight - 0.5;
      hx(nx * -40); hy(ny * -24); wx(nx * 24); wy(ny * 14);
    });

    $('.gallery__item').forEach(function (it) {
      gsap.set(it, { transformPerspective: 900 });
      var rx = gsap.quickTo(it, 'rotationX', { duration: 0.5, ease: 'power3' });
      var ry = gsap.quickTo(it, 'rotationY', { duration: 0.5, ease: 'power3' });
      it.addEventListener('pointermove', function (ev) {
        var r = it.getBoundingClientRect();
        ry(((ev.clientX - r.left) / r.width - 0.5) * 12);
        rx(((ev.clientY - r.top) / r.height - 0.5) * -12);
      });
      it.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  /* Precarga: al terminar de cargar la página, las fotos se descargan de fondo
     para estar listas antes de llegar a su sección. */
  window.addEventListener('load', function () {
    setTimeout(function () {
      $('img[loading="lazy"]').forEach(function (img) { img.loading = 'eager'; img.decoding = 'async'; });
    }, 600);
  });

  /* 4.5 Recalcular cuando cargan fuentes e imágenes ----------------------- */
  // Ordena los disparadores según su posición en la página (las secciones fijas empujan a las siguientes)
  ST.sort();
  ST.refresh();
  ST.addEventListener('refreshInit', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  window.addEventListener('load', function () { ST.refresh(); });
})();
