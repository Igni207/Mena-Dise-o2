/* ==========================================================================
   Galería ampliada (lightbox) y video del recorrido.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- Lightbox ---- */
  var box = document.getElementById('lightbox');
  var items = Array.prototype.slice.call(document.querySelectorAll('.gallery__item'));
  if (box && items.length) {
    var img = box.querySelector('.lightbox__img');
    var cap = box.querySelector('.lightbox__cap');
    var current = 0;
    var opener = null;

    function show(i) {
      current = (i + items.length) % items.length;
      var it = items[current];
      var pic = it.querySelector('.media img');
      var n = String(current + 1).padStart(2, '0');
      if (pic) {
        img.src = pic.currentSrc || pic.src;
        img.alt = pic.alt;
        img.hidden = false;
        cap.textContent = 'Galería / ' + n;
      } else {
        img.hidden = true;
        cap.textContent = 'Galería / ' + n + ' — imagen pendiente (media/g' + (current + 1) + '.jpg)';
      }
      if (window.gsap) window.gsap.fromTo(img, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' });
    }
    function open(i) {
      opener = document.activeElement;
      box.hidden = false;
      document.documentElement.classList.add('is-overlay');
      if (window.CC && window.CC.lenis) window.CC.lenis.stop();
      show(i);
      box.querySelector('.lightbox__close').focus();
    }
    function close() {
      box.hidden = true;
      document.documentElement.classList.remove('is-overlay');
      if (window.CC && window.CC.lenis) window.CC.lenis.start();
      if (opener) opener.focus();
    }

    items.forEach(function (it, i) { it.addEventListener('click', function () { open(i); }); });
    box.querySelector('.lightbox__close').addEventListener('click', close);
    box.querySelector('.lightbox__prev').addEventListener('click', function () { show(current - 1); });
    box.querySelector('.lightbox__next').addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (ev) { if (ev.target === box) close(); });
    box.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') close();
      if (ev.key === 'ArrowRight') show(current + 1);
      if (ev.key === 'ArrowLeft') show(current - 1);
      if (ev.key === 'Tab') {
        // Mantiene el foco dentro del lightbox
        var f = box.querySelectorAll('button');
        var first = f[0], last = f[f.length - 1];
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
        else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---- Video ---- */
  var video = document.querySelector('.video');
  if (video) {
    var btn = video.querySelector('.video__play');
    var el = video.querySelector('.video__el');
    var lbl = video.querySelector('.lbl');
    btn.addEventListener('click', function () {
      var embed = (video.dataset.embed || '').trim();
      if (embed) {
        var f = document.createElement('iframe');
        f.src = embed + (embed.indexOf('?') > -1 ? '&' : '?') + 'autoplay=1';
        f.title = 'Recorrido de Casa Carmín';
        f.allow = 'autoplay; fullscreen; picture-in-picture';
        f.allowFullscreen = true;
        el.replaceWith(f);
        video.classList.add('is-playing');
        return;
      }
      el.play().then(function () {
        video.classList.add('is-playing');
      }).catch(function () {
        if (lbl) lbl.textContent = 'Todavía no hay video: agregá media/recorrido.mp4 o un enlace en data-embed';
      });
    });
  }
})();
