/* ==========================================================================
   Tinta: el mouse escribe sobre el plano.
   - El trazo queda pegado a la página (se mueve con el scroll).
   - Se borra desde donde empezó, después de INK.life milisegundos.
   - Más lento = más grueso. Color según la sección que está debajo.
   ========================================================================== */
(function () {
  'use strict';

  var INK = {
    width: 2.6,     // grosor base en px
    life: 6000,     // cuánto dura cada punto del trazo (ms)
    fade: 0.45,     // fracción final de la vida en la que se desvanece
    colors: { light: '#a30d2d', red: '#1a0509', dark: '#d2405c' }
  };

  var cv = document.getElementById('ink');
  if (!cv) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce || !finePointer) return;

  var ctx = cv.getContext('2d');
  var pts = [];
  var blots = [];
  var dpr = 1, vw = 0, vh = 0, clean = true;

  function fit() {
    vw = window.innerWidth; vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    clean = false;
  }
  fit();
  window.addEventListener('resize', fit);

  window.addEventListener('pointermove', function (ev) {
    if (ev.pointerType === 'touch' || window.innerWidth <= 820) return;
    if (document.documentElement.classList.contains('is-overlay')) return;
    var x = ev.clientX + window.scrollX;
    var y = ev.clientY + window.scrollY;
    var t = performance.now();
    var last = pts[pts.length - 1];
    var dist = last ? Math.hypot(x - last.x, y - last.y) : 0;
    if (last && dist < 2) return;
    var brk = !last || t - last.t > 160 || dist > 180;
    var v = last ? dist / Math.max(t - last.t, 1) : 0;
    var target = INK.width * Math.max(0.4, Math.min(1.5, 1.5 - v * 0.45));
    var w = brk ? INK.width : last.w * 0.7 + target * 0.3;
    var under = document.elementFromPoint(ev.clientX, ev.clientY);
    var zone = under && under.closest ? under.closest('[data-tone]') : null;
    pts.push({ x: x, y: y, t: t, w: w, brk: brk, c: INK.colors[zone ? zone.dataset.tone : 'dark'] });
    if (pts.length > 5000) pts.shift();
  }, { passive: true });

  // Clic: una mancha con salpicaduras
  window.addEventListener('pointerdown', function (ev) {
    if (ev.pointerType === 'touch' || window.innerWidth <= 820) return;
    if (document.documentElement.classList.contains('is-overlay')) return;
    var under = document.elementFromPoint(ev.clientX, ev.clientY);
    var zone = under && under.closest ? under.closest('[data-tone]') : null;
    var drops = [];
    for (var i = 0; i < 7; i++) {
      var a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 52;
      drops.push({ dx: Math.cos(a) * d, dy: Math.sin(a) * d, r: 1.5 + Math.random() * 5 });
    }
    blots.push({ x: ev.clientX + window.scrollX, y: ev.clientY + window.scrollY, t: performance.now(), r: 11 + Math.random() * 9, drops: drops, c: INK.colors[zone ? zone.dataset.tone : 'dark'] });
    if (blots.length > 40) blots.shift();
  }, { passive: true });

  function draw() {
    requestAnimationFrame(draw);
    var now = performance.now();
    while (pts.length && now - pts[0].t > INK.life) pts.shift();
    if (pts.length) pts[0].brk = true;
    while (blots.length && now - blots[0].t > INK.life) blots.shift();
    if (!pts.length && !blots.length && clean) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    if (!pts.length && !blots.length) { clean = true; return; }
    clean = false;

    var sx = window.scrollX, sy = window.scrollY;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Pasada 0: el “corrido” de la tinta. Pasada 1: la línea de pluma.
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 1; i < pts.length; i++) {
        var p = pts[i], q = pts[i - 1];
        if (p.brk) continue;
        var y1 = q.y - sy, y2 = p.y - sy;
        if ((y1 < -40 && y2 < -40) || (y1 > vh + 40 && y2 > vh + 40)) continue;
        var k = Math.max(0, Math.min(1, (INK.life - (now - q.t)) / (INK.life * INK.fade)));
        if (k <= 0) continue;
        ctx.strokeStyle = p.c;
        ctx.globalAlpha = pass === 0 ? k * 0.09 : k * 0.88;
        ctx.lineWidth = pass === 0 ? p.w * 3.6 : p.w;
        ctx.beginPath();
        ctx.moveTo(q.x - sx, y1);
        ctx.lineTo(p.x - sx, y2);
        ctx.stroke();
      }
    }
    for (var b = 0; b < blots.length; b++) {
      var bl = blots[b], age = now - bl.t, by = bl.y - sy, bx = bl.x - sx;
      if (by < -120 || by > vh + 120) continue;
      var kb = Math.max(0, Math.min(1, (INK.life - age) / (INK.life * INK.fade)));
      var g = 1 - Math.exp(-age / 110);
      ctx.fillStyle = bl.c;
      ctx.globalAlpha = kb * 0.12;
      ctx.beginPath(); ctx.arc(bx, by, bl.r * 2.3 * g, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = kb * 0.85;
      ctx.beginPath(); ctx.arc(bx, by, bl.r * g, 0, 6.2832); ctx.fill();
      for (var d2 = 0; d2 < bl.drops.length; d2++) {
        var dr = bl.drops[d2];
        ctx.beginPath(); ctx.arc(bx + dr.dx * g, by + dr.dy * g, dr.r * g, 0, 6.2832); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(draw);
})();
