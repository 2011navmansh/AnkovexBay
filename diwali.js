/* ============================================================
   ANKOVEX BAY — DEEPAVALI FESTIVE SCRIPT (2026, optimised)
   · decorates EVERY page: ribbon, toran, rangoli, hero greet,
     footer diya rows (idempotent — skips what already exists)
   · golden firework bursts + rising embers on a sky canvas,
     drawn with pre-rendered glow sprites (drawImage only —
     no per-particle arcs, no filters, no shadows)
   · adaptive quality: measures frame time and steps down
     automatically on slow devices, up to a full stop
   · pauses when the tab is hidden; honours reduced motion
   Safe to fail: the site works without this file.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia && window.matchMedia('(max-width:760px)').matches;

  /* ================= 1. AUTO-DRESS (all pages) ================= */
  var RIBBON_HTML =
    '<div class="diwali-ribbon" role="region" aria-label="Deepavali greeting">' +
      '<div class="diwali-ribbon-text">' +
        '<span class="dvl-diya" aria-hidden="true"></span>' +
        '<span class="dvl-script">Shubh Deepavali</span>' +
        '<span class="dvl-sep" aria-hidden="true"></span>' +
        '<span>Festival of Lights &middot; 8 Nov 2026</span>' +
        '<span class="dvl-spark material-symbols-outlined" aria-hidden="true">auto_awesome</span>' +
      '</div>' +
    '</div>';
  var TORAN_HTML = '<div class="diwali-toran" aria-hidden="true"></div>';
  var RANGOLI_HTML = '<div class="diwali-rangoli" aria-hidden="true"></div>';
  var HERO_GREET_HTML =
    '<div class="diwali-hero-greet" aria-hidden="true">' +
      '<span class="dvl-diya"></span>' +
      'Shubh Deepavali &middot; Festival of Lights 2026' +
      '<span class="dvl-diya"></span>' +
    '</div>';
  var FOOT_GREET_HTML =
    '<div class="diwali-foot-greet" aria-label="Deepavali greeting">' +
      '<div class="dvl-row" aria-hidden="true">' +
        '<span class="dvl-diya"></span><span class="dvl-diya"></span><span class="dvl-diya"></span>' +
      '</div>' +
      '<h3>May your year glow like a thousand diyas</h3>' +
      '<p>Shubh Deepavali <b>2026</b> — with love, from the Ankovex Bay family</p>' +
    '</div>';

  function dress() {
    try {
      if (!document.querySelector('.diwali-ribbon')) {
        document.body.insertAdjacentHTML('afterbegin', RIBBON_HTML);
      }
      var homeHero = document.querySelector('.hero-home');
      var hero = homeHero || document.querySelector('.page-hero');
      if (hero) {
        if (!hero.querySelector('.diwali-toran')) {
          hero.insertAdjacentHTML('afterbegin', TORAN_HTML);
        }
        if (!hero.querySelector('.diwali-rangoli')) {
          hero.insertAdjacentHTML('beforeend', RANGOLI_HTML);
        }
        /* small greeting chip on inner pages (home has its own line) */
        if (!homeHero) {
          var anchor = hero.querySelector('.breadcrumb') || hero.querySelector('h1');
          if (anchor && !hero.querySelector('.diwali-hero-greet')) {
            anchor.insertAdjacentHTML('beforebegin', HERO_GREET_HTML);
          }
        }
      }
      var footBottom = document.querySelector('footer .foot-bottom');
      if (footBottom && !document.querySelector('.diwali-foot-greet')) {
        footBottom.insertAdjacentHTML('beforebegin', FOOT_GREET_HTML);
      }
    } catch (e) {}
  }
  dress();

  /* ================= 2. SPRITE-BASED SKY ================= */
  var ctx = null;
  var canvas = null;
  var SPRITES = null;
  var HUES = [
    [255, 196, 79],   /* flame gold   */
    [255, 154, 61],   /* saffron      */
    [242, 113, 28],   /* marigold     */
    [255, 224, 138],  /* champagne    */
    [244, 82, 62],    /* rose embers  */
    [255, 240, 200]   /* white gold   */
  ];
  var SPRITE_SIZE = 64;

  function buildSprites() {
    SPRITES = [];
    for (var i = 0; i < HUES.length; i++) {
      var s = document.createElement('canvas');
      s.width = s.height = SPRITE_SIZE;
      var g = s.getContext('2d');
      var grad = g.createRadialGradient(SPRITE_SIZE / 2, SPRITE_SIZE / 2, 0, SPRITE_SIZE / 2, SPRITE_SIZE / 2, SPRITE_SIZE / 2);
      var h = HUES[i];
      grad.addColorStop(0, 'rgba(255,252,240,.95)');
      grad.addColorStop(0.25, 'rgba(' + h[0] + ',' + h[1] + ',' + h[2] + ',.9)');
      grad.addColorStop(0.6, 'rgba(' + h[0] + ',' + h[1] + ',' + h[2] + ',.35)');
      grad.addColorStop(1, 'rgba(' + h[0] + ',' + h[1] + ',' + h[2] + ',0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
      SPRITES.push(s);
    }
  }

  function makeSky() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'diwali-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    if (!ctx) return;
    buildSprites();
    resizeSky();
  }

  var DPR = 1, W = 0, H = 0;
  function resizeSky() {
    if (!ctx) return;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  /* ================= 3. PARTICLES ================= */
  var embers = [];
  var rockets = [];
  var sparks = [];
  var N_EMBER = mobile ? 7 : 14;
  var N_SPARK = mobile ? 24 : 38;
  var TRAIL = 8;

  function pickHue() { return (Math.random() * HUES.length) | 0; }

  function makeEmber(scatter) {
    return {
      x: Math.random() * W,
      y: scatter ? Math.random() * H : H + 10 + Math.random() * 40,
      r: 10 + Math.random() * 16,                /* sprite draw size */
      vy: 0.16 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.3,
      life: scatter ? Math.random() * 300 : 0,
      maxLife: 380 + Math.random() * 240,
      hue: pickHue(),
      tw: Math.random() * 6.283
    };
  }

  function spawnRocket() {
    if (mode === LITE) return;
    if (rockets.length >= 1) return;
    rockets.push({
      x: W * (0.16 + Math.random() * 0.68),
      y: H,
      ty: H * (0.10 + Math.random() * 0.30),
      vx: (Math.random() - 0.5) * 0.8,
      vy: -(7 + Math.random() * 3.2),
      trail: [],
      hue: pickHue()
    });
  }

  function explode(x, y, hue) {
    var ring = Math.random() < 0.35;
    var n = N_SPARK;
    for (var i = 0; i < n; i++) {
      var ang = (Math.PI * 2 * i) / n + Math.random() * 0.14;
      var speed = ring ? 2.3 + Math.random() * 0.5 : 1.3 + Math.random() * 3.1;
      sparks.push({
        x: x, y: y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        r: 12 + Math.random() * 10,               /* sprite size */
        life: 0,
        maxLife: 50 + Math.random() * 30,
        hue: ring ? hue : pickHue()
      });
    }
  }

  function resetAmbience() {
    embers.length = 0;
    for (var i = 0; i < N_EMBER; i++) embers.push(makeEmber(true));
  }

  /* ================= 4. LOOP (adaptive) ================= */
  var FRAME = 0;
  var nextBurst = 70;   /* ~1.2s after load */
  var BURST_MIN = 170;  /* ~2.8s */
  var BURST_RAND = 120;
  var NORMAL = 0, LITE = 1, FROZEN = 2;
  var mode = NORMAL;
  var running = true;
  var last = 0, ewma = 16.7, checked = 0;

  function drawSky() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    /* embers: one drawImage each */
    for (var i = 0; i < embers.length; i++) {
      var e = embers[i];
      e.life++;
      e.y -= e.vy;
      e.x += e.drift + Math.sin((FRAME + e.tw * 40) / 46) * 0.22;
      var p = e.life / e.maxLife;
      if (e.y < -16 || p >= 1) { embers[i] = makeEmber(false); continue; }
      var a = Math.min(1, (1 - p) * 2.2) * 0.62 * (0.7 + 0.3 * Math.sin(FRAME / 9 + e.tw));
      ctx.globalAlpha = a;
      var size = e.r * (0.85 + 0.15 * Math.sin(FRAME / 11 + e.tw));
      ctx.drawImage(SPRITES[e.hue], e.x - size / 2, e.y - size / 2, size, size);
    }

    /* rockets: sprite glow head + short trail */
    for (var ri = rockets.length - 1; ri >= 0; ri--) {
      var rk = rockets[ri];
      rk.vy += 0.055;
      rk.x += rk.vx;
      rk.y += rk.vy;
      rk.trail.push({ x: rk.x, y: rk.y });
      if (rk.trail.length > TRAIL) rk.trail.shift();
      for (var t = 0; t < rk.trail.length; t++) {
        ctx.globalAlpha = 0.06 + (t / rk.trail.length) * 0.4;
        ctx.drawImage(SPRITES[rk.hue], rk.trail[t].x - 5, rk.trail[t].y - 5, 10, 10);
      }
      if (rk.y <= rk.ty || rk.vy >= -0.5) {
        explode(rk.x, rk.y, rk.hue);
        rockets.splice(ri, 1);
      }
    }

    /* sparks: fast fade, one drawImage each */
    for (var si = sparks.length - 1; si >= 0; si--) {
      var s = sparks[si];
      s.life++;
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.02;
      s.vx *= 0.988;
      s.vy *= 0.988;
      if (s.life >= s.maxLife) { sparks.splice(si, 1); continue; }
      var q = 1 - s.life / s.maxLife;
      ctx.globalAlpha = q * q;
      var sz = s.r * (0.6 + q * 0.6);
      ctx.drawImage(SPRITES[s.hue], s.x - sz / 2, s.y - sz / 2, sz, sz);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function tick(now) {
    if (!running) return;
    if (mode === FROZEN) return;

    /* adaptive quality: EWMA of frame deltas */
    if (last) {
      ewma = ewma * 0.92 + Math.min(now - last, 250) * 0.08;
      if (++checked % 45 === 0) {
        if (ewma > 50) {
          mode = FROZEN;
          if (ctx) ctx.clearRect(0, 0, W, H);
          return;                     /* full stop — CSS beauty remains */
        }
        if (ewma > 34 && mode === NORMAL) {
          mode = LITE;                /* no rockets, thin embers */
          embers.length = Math.min(embers.length, 6);
          rockets.length = 0;
        }
      }
    }
    last = now;
    FRAME++;

    drawSky();

    if (FRAME >= nextBurst) {
      spawnRocket();
      nextBurst = FRAME + BURST_MIN + Math.random() * BURST_RAND;
    }
    requestAnimationFrame(tick);
  }

  /* ================= 5. WIRING ================= */
  if (!reduceMotion) {
    makeSky();
    resetAmbience();
    requestAnimationFrame(tick);

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false;
      } else if (!running) {
        running = true;
        last = 0;
        requestAnimationFrame(tick);
      }
    });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        resizeSky();
        resetAmbience();
      }, 200);
    }, { passive: true });
  }
})();
