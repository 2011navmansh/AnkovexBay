/* ============================================================
   ANKOVEX BAY — PREMIUM LAYER SCRIPT
   Small, progressive enhancements:
   scroll progress, card spotlight, hero panel tilt, "/" search.
   Safe to fail: the site works without this file.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- Reading progress bar ---------- */
  try {
    var bar = document.createElement('div');
    bar.className = 'ab-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var ticking = false;
    function updateBar() {
      ticking = false;
      var doc = document.documentElement;
      var max = (doc.scrollHeight || 0) - window.innerHeight;
      var y = window.scrollY || window.pageYOffset || 0;
      var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    function queueBar() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateBar);
    }
    window.addEventListener('scroll', queueBar, { passive: true });
    window.addEventListener('resize', queueBar, { passive: true });
    updateBar();
  } catch (e) {}

  /* ---------- Cursor spotlight on cards ---------- */
  try {
    if (finePointer && !reduceMotion && document.addEventListener) {
      var SELECTOR = '.product-card,.feat,.step';
      var activeEl = null;
      var mx = 0;
      var my = 0;
      var paintQueued = false;

      function paintSpotlight() {
        paintQueued = false;
        if (!activeEl) return;
        activeEl.style.setProperty('--mx', mx + 'px');
        activeEl.style.setProperty('--my', my + 'px');
      }

      function clearSpotlight(el) {
        if (!el) return;
        el.style.removeProperty('--mx');
        el.style.removeProperty('--my');
      }

      document.addEventListener('pointermove', function (e) {
        var el = e.target && e.target.closest ? e.target.closest(SELECTOR) : null;
        if (el !== activeEl) {
          clearSpotlight(activeEl);
          activeEl = el;
        }
        if (!el) return;
        var r = el.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
        if (!paintQueued) {
          paintQueued = true;
          window.requestAnimationFrame(paintSpotlight);
        }
      }, { passive: true });

      document.addEventListener('pointerleave', function () {
        clearSpotlight(activeEl);
        activeEl = null;
      }, { passive: true });
    }
  } catch (e) {}

  /* ---------- Hero feature panel: gentle pointer tilt ---------- */
  try {
    var aside = document.querySelector('.hero-aside');
    var hero = aside ? aside.closest('.hero-home') : null;
    if (aside && hero && finePointer && !reduceMotion) {
      var tiltQueued = false;
      var tx = 0;
      var ty = 0;

      function applyTilt() {
        tiltQueued = false;
        aside.style.setProperty('--ry', tx.toFixed(2) + 'deg');
        aside.style.setProperty('--rx', ty.toFixed(2) + 'deg');
      }

      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        if (!r.width || !r.height) return;
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tx = Math.max(-4, Math.min(4, px * 7));
        ty = Math.max(-4, Math.min(4, -py * 6));
        if (!tiltQueued) {
          tiltQueued = true;
          window.requestAnimationFrame(applyTilt);
        }
      }, { passive: true });

      hero.addEventListener('pointerleave', function () {
        tx = 0;
        ty = 0;
        aside.style.setProperty('--ry', '0deg');
        aside.style.setProperty('--rx', '0deg');
      }, { passive: true });
    }
  } catch (e) {}

  /* ---------- "/" opens universal search ---------- */
  try {
    document.addEventListener('keydown', function (e) {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (typeof window.openSearchModal === 'function') {
        e.preventDefault();
        window.openSearchModal();
      }
    });

    var field = document.querySelector('.search-field');
    if (field && !field.querySelector('.ab-kbd')) {
      var kbd = document.createElement('kbd');
      kbd.className = 'ab-kbd';
      kbd.setAttribute('aria-hidden', 'true');
      kbd.textContent = '/';
      field.appendChild(kbd);
    }
  } catch (e) {}
})();
