/* ==========================================================================
   Modelo: esquema isométrico (mientras no haya .glb) o modelo 3D real.
   Si existe media/casa-carmin.glb, se carga <model-viewer> con giro, zoom y
   realidad aumentada; si no, queda el esquema dibujado en SVG.
   ========================================================================== */
(function () {
  'use strict';

  var viewer = document.querySelector('.viewer');
  if (!viewer) return;
  var section = viewer.closest('section');

  // Textos de cada vista y, para el modelo real, la posición de cámara.
  // camera: "ángulo horizontal, ángulo vertical, distancia" — ajustar al modelo.
  var VIEWS = {
    exterior: { n: '01', label: 'Exterior', text: 'La casa se posa y se proyecta sobre el terreno, construyendo nuevas relaciones con el paisaje.', at: [-150, 70, 60], explodeLift: false, camera: '-35deg 78deg 105%' },
    cruce:    { n: '02', label: 'Cruce en X', text: 'Dos direcciones se encuentran. La volumetría articula el movimiento y las vistas.', at: [0, 0, 230], explodeLift: true, camera: '0deg 15deg 110%' },
    tubo:     { n: '03', label: 'Tubo carmín', text: 'El tubo carmín dirige la mirada y convierte el horizonte en un acontecimiento.', at: [0, 340, 180], explodeLift: true, camera: '95deg 80deg 85%' },
    interior: { n: '04', label: 'Balcón', text: 'Después de la compresión, la amplitud: el primer respiro hacia el paisaje.', at: [260, 0, 60], explodeLift: false, camera: '200deg 85deg 70%' }
  };

  var state = { view: 'cruce', explode: false };
  var mv = null;

  /* ---- Esquema isométrico ---- */
  function iso(x, y, z) {
    var k = 0.85;
    return [600 + (x - y) * 0.866 * k, 430 + ((x + y) * 0.5 - z) * k];
  }
  function pts(list) { return list.map(function (p) { var s = iso(p[0], p[1], p[2]); return s[0].toFixed(1) + ',' + s[1].toFixed(1); }).join(' '); }
  function box(x0, x1, y0, y1, z0, z1) {
    return {
      top: pts([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]),
      fx: pts([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]),
      fy: pts([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]])
    };
  }
  function drawSchema() {
    var e = state.explode ? 90 : 0;
    var vols = {
      a: box(-260, 260, -70, 70, 0, 120),
      b: box(-80, 80, -240, 240, 120 + e, 230 + e),
      t: box(-40, 40, 240, 340, 150 + e, 210 + e)
    };
    viewer.querySelector('.vg').setAttribute('points', pts([[-420, -320, 0], [420, -320, 0], [420, 320, 0], [-420, 320, 0]]));
    ['a', 'b', 't'].forEach(function (v) {
      ['top', 'fx', 'fy'].forEach(function (f) {
        var el = viewer.querySelector('[data-face="' + v + '-' + f + '"]');
        if (el) el.setAttribute('points', vols[v][f]);
      });
    });
    viewer.querySelectorAll('.hot').forEach(function (b) {
      var d = VIEWS[b.dataset.view];
      var s = iso(d.at[0], d.at[1], d.at[2] + (d.explodeLift ? e : 0));
      b.style.left = (s[0] / 1200 * 100).toFixed(2) + '%';
      b.style.top = (s[1] / 640 * 100).toFixed(2) + '%';
    });
  }

  /* ---- Vistas ---- */
  function setView(id) {
    var d = VIEWS[id]; if (!d) return;
    state.view = id;
    viewer.querySelector('[data-view-n]').textContent = d.n;
    viewer.querySelector('[data-view-label]').textContent = d.label;
    viewer.querySelector('[data-view-text]').textContent = d.text;
    section.querySelectorAll('[data-view]').forEach(function (b) {
      var on = b.dataset.view === id;
      b.classList.toggle('is-active', on);
      if (b.classList.contains('chip')) b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (mv) mv.cameraOrbit = d.camera;
    var card = viewer.querySelector('.viewer__card');
    if (window.gsap && card) window.gsap.fromTo(card, { y: 14, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.45, ease: 'expo.out' });
  }

  section.addEventListener('click', function (ev) {
    var v = ev.target.closest('[data-view]');
    if (v) { setView(v.dataset.view); return; }
    var ex = ev.target.closest('[data-action="explode"]');
    if (ex) {
      state.explode = !state.explode;
      ex.setAttribute('aria-pressed', state.explode ? 'true' : 'false');
      ex.textContent = state.explode ? 'Unir niveles' : 'Separar niveles';
      drawSchema();
      return;
    }
    if (ev.target.closest('[data-action="ar"]') && mv && mv.canActivateAR) mv.activateAR();
  });

  drawSchema();
  setView(state.view);

  /* ---- Modelo real (si existe el .glb) ---- */
  var src = viewer.dataset.model;
  if (!src || location.protocol === 'file:') return;
  fetch(src, { method: 'HEAD' }).then(function (r) {
    if (!r.ok) return;
    var s = document.createElement('script');
    s.type = 'module';
    s.src = 'vendor/model-viewer.min.js';
    document.head.appendChild(s);

    mv = document.createElement('model-viewer');
    mv.setAttribute('src', src);
    mv.setAttribute('alt', 'Modelo 3D de Casa Carmín');
    mv.setAttribute('camera-controls', '');
    mv.setAttribute('touch-action', 'pan-y');
    mv.setAttribute('interaction-prompt', 'none');
    mv.setAttribute('shadow-intensity', '1');
    mv.setAttribute('exposure', '1');
    mv.setAttribute('environment-image', 'neutral');
    mv.setAttribute('interpolation-decay', '120');
    mv.setAttribute('ar', '');
    mv.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    mv.setAttribute('camera-orbit', VIEWS[state.view].camera);
    viewer.querySelector('.fill').after(mv);
    viewer.classList.add('has-model');

    var note = viewer.querySelector('[data-model-note]');
    if (note) note.textContent = 'Casa Carmín · modelo 3D';

    mv.addEventListener('load', function () {
      var ar = section.querySelector('[data-action="ar"]');
      if (ar && mv.canActivateAR) ar.hidden = false;
    });
  }).catch(function () { /* sin modelo: queda el esquema */ });
})();
