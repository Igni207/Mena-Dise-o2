/* ==========================================================================
   Modelo 3D de Casa Carmín (Three.js).
   - La animación del modelo (piezas que caen, despiece y armado) avanza con el scroll.
   - Se gira arrastrando (en celular, después de tocar "Girar").
   - Vistas: general, planta, tubo carmín y desde el valle.
   Mientras carga, o si el navegador no tiene WebGL, queda el esquema dibujado.
   ========================================================================== */
import * as THREE from '../vendor/three-casa.min.js?v=20261116b';

const viewer = document.querySelector('.viewer');
const section = viewer && viewer.closest('section');
const SRC = viewer && viewer.dataset.model;

const VIEWS = {
  general: { n: '01', label: 'Vista general', text: 'Casa Carmín sobre la pendiente: el volumen se apoya y se proyecta sobre el terreno.' },
  planta:  { n: '02', label: 'Planta', text: 'Desde arriba se lee el cruce: dos direcciones que se encuentran y articulan el recorrido.' },
  tubo:    { n: '03', label: 'Tubo carmín', text: 'El tubo carmín se proyecta en voladizo y dirige la mirada hacia el horizonte.' },
  valle:   { n: '04', label: 'Desde el valle', text: 'Desde abajo, la casa se lee escalonada, acompañando la pendiente.' }
};

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch (e) { return false; }
}

if (viewer && SRC && hasWebGL()) start();

function start() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const note = viewer.querySelector('[data-model-note]');
  const hint = viewer.querySelector('.lbl--tr');
  const card = {
    n: viewer.querySelector('[data-view-n]'),
    label: viewer.querySelector('[data-view-label]'),
    text: viewer.querySelector('[data-view-text]'),
    box: viewer.querySelector('.viewer__card')
  };

  /* ---- Escena ---- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.className = 'viewer__canvas';
  canvas.setAttribute('aria-label', 'Modelo 3D de Casa Carmín. Arrastrá para girarlo.');
  canvas.setAttribute('role', 'img');

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff6ee, 0x3a2a22, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(40, 70, 30);
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 2000);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false;          // la rueda sigue bajando la página
  controls.minPolarAngle = 0.05;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.rotateSpeed = 0.7;
  if (touch) controls.enabled = false;  // en celular se activa con el botón "Girar"

  let mixer = null, action = null, duration = 0, falls = 10, assembleStart = 13.2, assembleEnd = 15.72;
  let dirty = true, visible = false, fit = 100;
  const center = new THREE.Vector3(), red = new THREE.Vector3();
  const presets = {};

  /* ---- Tamaño ---- */
  function resize() {
    const w = viewer.clientWidth, h = viewer.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  new ResizeObserver(resize).observe(viewer);

  /* ---- Bucle: solo dibuja cuando el visor está en pantalla y algo cambió ---- */
  controls.addEventListener('change', () => { dirty = true; });
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; }).observe(viewer);
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    if (controls.update()) dirty = true;
    if (dirty) { renderer.render(scene, camera); dirty = false; }
  })();

  /* ---- Tiempo de la animación ---- */
  function setTime(t) {
    if (!action) return;
    action.time = Math.max(0, Math.min(duration, t));
    mixer.update(0);
    dirty = true;
  }
  // El scroll recorre: caída de piezas (55 %) y armado (45 %). Se salta la pausa intermedia.
  const FALL_SHARE = 0.55;
  function timeFromProgress(p) {
    if (p < FALL_SHARE) return (p / FALL_SHARE) * falls;
    return assembleStart + ((p - FALL_SHARE) / (1 - FALL_SHARE)) * (assembleEnd - assembleStart);
  }

  /* ---- Cámara ---- */
  function orbit(target, azDeg, polarDeg, dist) {
    const s = new THREE.Spherical(dist, THREE.MathUtils.degToRad(polarDeg), THREE.MathUtils.degToRad(azDeg));
    const pos = new THREE.Vector3().setFromSpherical(s).add(target);
    return { target: target.clone(), pos };
  }
  function goTo(id, instant) {
    const v = presets[id]; if (!v) return;
    const g = window.gsap;
    if (instant || !g || reduce) {
      controls.target.copy(v.target); camera.position.copy(v.pos); controls.update(); dirty = true; return;
    }
    const from = { tx: controls.target.x, ty: controls.target.y, tz: controls.target.z, px: camera.position.x, py: camera.position.y, pz: camera.position.z };
    g.to(from, {
      tx: v.target.x, ty: v.target.y, tz: v.target.z, px: v.pos.x, py: v.pos.y, pz: v.pos.z,
      duration: 1.4, ease: 'power3.inOut', overwrite: true,
      onUpdate: () => { controls.target.set(from.tx, from.ty, from.tz); camera.position.set(from.px, from.py, from.pz); dirty = true; }
    });
  }
  function showView(id) {
    const d = VIEWS[id]; if (!d) return;
    card.n.textContent = d.n; card.label.textContent = d.label; card.text.textContent = d.text;
    section.querySelectorAll('[data-view]').forEach((b) => {
      const on = b.dataset.view === id;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (window.gsap && card.box) window.gsap.fromTo(card.box, { y: 14, opacity: 0.4 }, { y: 0, opacity: 1, duration: 0.45, ease: 'expo.out' });
  }

  /* ---- Zoom: botones + / −, Ctrl + rueda (o pellizco en trackpad), pellizco en celular ---- */
  function zoom(factor, instant) {
    const off = camera.position.clone().sub(controls.target);
    const d = THREE.MathUtils.clamp(off.length() * factor, controls.minDistance, controls.maxDistance);
    const end = controls.target.clone().add(off.setLength(d));
    const g = window.gsap;
    if (instant || !g || reduce) { camera.position.copy(end); dirty = true; return; }
    const p = { x: camera.position.x, y: camera.position.y, z: camera.position.z };
    g.to(p, { x: end.x, y: end.y, z: end.z, duration: 0.6, ease: 'power3.out', overwrite: true,
      onUpdate: () => { camera.position.set(p.x, p.y, p.z); dirty = true; } });
  }
  canvas.addEventListener('wheel', (ev) => {
    if (!(ev.ctrlKey || ev.metaKey)) return;       // sin Ctrl, la rueda sigue bajando la página
    ev.preventDefault(); ev.stopPropagation();
    zoom(Math.exp(ev.deltaY * 0.0025), true);
  }, { passive: false });
  viewer.querySelectorAll('[data-zoom]').forEach((b) => {
    b.addEventListener('click', () => zoom(b.dataset.zoom === 'in' ? 0.7 : 1.4));
  });

  /* ---- Botones ---- */
  const explodeBtn = section.querySelector('[data-action="explode"]');
  const rotateBtn = viewer.querySelector('[data-action="rotate"]');
  let exploded = false;
  function setExplodeUI(on) {
    exploded = on;
    if (!explodeBtn) return;
    explodeBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    explodeBtn.textContent = on ? 'Armar la casa' : 'Ver despiece';
  }
  section.addEventListener('click', (ev) => {
    const v = ev.target.closest('[data-view]');
    if (v) { showView(v.dataset.view); goTo(v.dataset.view); return; }
    if (ev.target.closest('[data-action="explode"]') && action) {
      setExplodeUI(!exploded);
      const target = exploded ? 12.9 : assembleEnd;
      const g = window.gsap;
      if (!g || reduce) { setTime(target); return; }
      const o = { t: action.time };
      // Del armado al despiece se va "hacia atrás" en la animación, y viceversa.
      g.to(o, { t: target, duration: 1.6, ease: 'power2.inOut', overwrite: true, onUpdate: () => setTime(o.t) });
    }
  });
  if (rotateBtn) {
    rotateBtn.hidden = !touch;
    rotateBtn.addEventListener('click', () => {
      controls.enabled = !controls.enabled;
      controls.enableZoom = controls.enabled;   // pellizcar para acercar mientras se gira
      rotateBtn.setAttribute('aria-pressed', controls.enabled ? 'true' : 'false');
      rotateBtn.textContent = controls.enabled ? 'Listo' : 'Girar';
      canvas.style.touchAction = controls.enabled ? 'none' : 'pan-y';
    });
  }
  canvas.style.touchAction = touch ? 'pan-y' : 'none';
  if (hint) hint.textContent = touch ? 'Tocá «Girar» para mover y acercar' : 'Arrastrá para girar · Ctrl + rueda para acercar';

  /* ---- Carga ---- */
  const loader = new THREE.GLTFLoader();
  loader.setMeshoptDecoder(THREE.MeshoptDecoder);
  const load = () => loader.load(SRC, onLoad, (e) => {
    if (note && e.total) note.textContent = 'Cargando modelo 3D · ' + Math.round((e.loaded / e.total) * 100) + '%';
  }, () => { if (note) note.textContent = 'No se pudo cargar el modelo 3D'; });

  // Se descarga cuando el visor está por aparecer (o al terminar de cargar la página)
  let started = false;
  const kick = () => { if (started) return; started = true; if (note) note.textContent = 'Cargando modelo 3D…'; load(); };
  new IntersectionObserver((es, io) => { if (es[0].isIntersecting) { io.disconnect(); kick(); } }, { rootMargin: '1200px 0px' }).observe(viewer);
  window.addEventListener('load', () => setTimeout(kick, 1500));

  function onLoad(gltf) {
    const root = gltf.scene;
    // El modelo no trae normales: caras planas, nítidas, calculadas al dibujar.
    root.traverse((o) => {
      if (o.isMesh) { o.material.flatShading = true; o.material.needsUpdate = true; o.frustumCulled = false; }
      if (o.isLight) o.intensity *= 0.6;
    });
    scene.add(root);

    if (gltf.animations.length) {
      mixer = new THREE.AnimationMixer(root);
      action = mixer.clipAction(gltf.animations[0]);
      action.play(); action.paused = true;
      duration = gltf.animations[0].duration;
      // Fin de la caída (antes de la pausa) y tramo de armado, leídos de la propia animación.
      let lastFall = 0, firstAsm = Infinity, lastAsm = 0;
      gltf.animations[0].tracks.forEach((tr) => {
        if (!/position$/.test(tr.name)) return;
        const ts = tr.times;
        for (let i = 0; i < ts.length; i++) {
          if (ts[i] < 12.5) lastFall = Math.max(lastFall, ts[i]);
          else { firstAsm = Math.min(firstAsm, ts[i]); }
        }
        if (ts.length > 1) lastAsm = Math.max(lastAsm, ts[ts.length - 2]);
      });
      falls = lastFall || 10;
      if (isFinite(firstAsm)) assembleStart = firstAsm;
      assembleEnd = Math.min(duration, lastAsm || duration);
    }

    // Encuadre y vistas, calculados con la casa armada
    setTime(assembleEnd || duration);
    const box = new THREE.Box3().setFromObject(root);
    box.getCenter(center);
    const radius = box.getSize(new THREE.Vector3()).length() / 2;
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * Math.max(camera.aspect, 1));
    fit = (radius / Math.sin(Math.min(vfov, hfov) / 2)) * 0.68;

    const redBox = new THREE.Box3();
    root.traverse((o) => {
      let n = o, isRed = false;
      while (n) { if (n.userData && n.userData.rojo_carmin) { isRed = true; break; } n = n.parent; }
      if (o.isMesh && isRed) redBox.expandByObject(o);
    });
    if (!redBox.isEmpty()) redBox.getCenter(red); else red.copy(center);
    const out = red.clone().sub(center).setY(0);
    const az = out.lengthSq() > 1 ? THREE.MathUtils.radToDeg(Math.atan2(out.x, out.z)) : 35;

    presets.general = orbit(center, 35, 62, fit);
    presets.planta = orbit(center, 0, 4, fit * 1.05);
    presets.tubo = orbit(red, az + 20, 72, Math.max(24, fit * 0.32));
    presets.valle = orbit(center, -130, 80, fit * 0.78);
    controls.minDistance = fit * 0.12; controls.maxDistance = fit * 1.8;
    goTo('general', true);
    showView('general');

    viewer.appendChild(canvas);
    viewer.classList.add('has-model');
    if (note) note.textContent = 'Casa Carmín · modelo 3D';
    if (explodeBtn) explodeBtn.hidden = false;
    setExplodeUI(false);
    resize();

    // La construcción sigue al scroll (o queda armada si no hay animaciones)
    const g = window.gsap, ST = window.ScrollTrigger;
    if (g && ST && !reduce && action) {
      ST.create({
        trigger: viewer, start: 'top 95%', end: 'top 45%',
        onUpdate: (s) => { setExplodeUI(false); setTime(timeFromProgress(s.progress)); },
        onRefresh: (s) => setTime(timeFromProgress(s.progress))
      });
      ST.refresh();
    } else {
      setTime(assembleEnd || duration);
    }
    if (window.gsap) window.gsap.fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power2.out' });
    window.CC = window.CC || {};
    window.CC.model = { setTime, goTo, presets, get time() { return action ? action.time : 0; } };
  }
}
