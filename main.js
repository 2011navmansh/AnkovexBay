/* ============================================================
   ANKOVEX BAY — Global Scripts
   Navbar, mobile menu, universal search, counters, reveal,
   marquee, back-to-top, filters.
   ============================================================ */

/* ============================================================
   LENIS SMOOTH SCROLL — strong glide (mibproduction-style)
   Local lenis.min.js dynamically inject hota hai — har page par
   alag se script tag lagane ki zaroorat nahi. Agar file load na
   ho (offline/blocked), to native smooth scroll waisa hi chalta
   rahega — site kabhi break nahi hoti.
   ============================================================ */
window.AB_LENIS = null;
(function () {
  'use strict';
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    /* Mobile/touch devices already have native momentum scrolling —
       Lenis only adds overhead there. Keep it for mouse/trackpad. */
    if (window.matchMedia && !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    var conn = navigator.connection;
    if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return;
    var s = document.createElement('script');
    s.src = 'lenis.min.js?v=1.1.19';
    s.async = true;
    s.onload = function () {
      try {
        if (typeof Lenis === 'undefined') return;
        /* Refsite (mibproduction) = lerp 0.1 + duration 1.2 + expo easing.
           Yahan duration 1.8 — matlab usse bhi lambi, badi glide. */
        window.AB_LENIS = new Lenis({
          autoRaf: true,
          lerp: 0.1,
          duration: 1.8,
          wheelMultiplier: 1,
          easing: function (x) { return Math.min(1, 1.001 - Math.pow(2, -10 * x)); }
        });
        /* Load ke turant baad koi overlay (menu/search/popup) open ho
           chuka ho to scroll wahi ruk jaaye */
        var menuOpen = document.body.classList.contains('menu-open');
        var sm = document.getElementById('searchModal');
        var dp = document.getElementById('donPop');
        if (menuOpen || (sm && sm.classList.contains('open')) || (dp && dp.classList.contains('open'))) {
          window.AB_LENIS.stop();
        }
      } catch (e) {}
    };
    document.head.appendChild(s);
  } catch (e) {}
})();

(function () {
  'use strict';

  /* ---------- Smooth scroll helpers ----------
     Lenis active ho to scroll usi se (badi glide), warna native.
     Lenis scroll-padding-top respect nahi karta, isliye offset -90
     manually diya gaya hai (= style.css scroll-padding-top:90px). */
  function abScrollTo(target, offset) {
    var L = window.AB_LENIS;
    if (L) {
      try {
        L.scrollTo(target, { offset: (typeof offset === 'number' ? offset : -90) });
        return;
      } catch (e) {}
    }
    if (typeof target === 'number') {
      try { window.scrollTo({ top: target, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, target); }
    } else if (target && target.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
  function abScrollLock(on) {
    var L = window.AB_LENIS;
    if (!L) return;
    try { if (on) L.stop(); else L.start(); } catch (e) {}
  }

  /* ---------- Sticky navbar ---------- */
  var navbar = document.querySelector('.navbar');
  var topLink = document.getElementById('top');
  var scrollFrame = 0;
  function applyScrollState() {
    scrollFrame = 0;
    /* scrollY ko ek hi baar padho - doosra read class toggle ke baad
       forced layout trigger karta tha. */
    var y = window.scrollY || window.pageYOffset || 0;
    if (navbar) navbar.classList.toggle('scrolled', y > 24);
    if (topLink) topLink.classList.toggle('show', y > 500);
  }
  function onScroll() {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(applyScrollState);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  applyScrollState();

  /* ---------- Back to top ---------- */
  var topBtn = document.getElementById('top');
  if (topBtn) {
    topBtn.addEventListener('click', function () { abScrollTo(0); });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.mobile-menu-btn');
  var menu = document.querySelector('.mobile-menu');
  var backdrop = document.getElementById('mobileMenuBackdrop');
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    if (burger) { burger.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    document.body.classList.remove('menu-open');
    abScrollLock(false);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      if (backdrop) backdrop.classList.toggle('open', open);
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.classList.toggle('menu-open', open);
      abScrollLock(open);
    });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeSearch(); } });
  }

  /* ---------- Desktop dropdowns (touch support) ---------- */
  /* Long menus (All Pages) need their own wheel scroll. Lenis listens on
     window and would otherwise scroll the page instead, so mark every
     dropdown as a native scroll area. */
  document.querySelectorAll('.nav-dropdown-menu').forEach(function (m) {
    m.setAttribute('data-lenis-prevent', '');
  });
  document.querySelectorAll('.nav-dropdown > .nav-tab').forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      if (window.matchMedia('(hover: none)').matches) {
        e.preventDefault();
        var dd = tab.parentElement;
        document.querySelectorAll('.nav-dropdown.open').forEach(function (o) { if (o !== dd) o.classList.remove('open'); });
        dd.classList.toggle('open');
      }
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown.open').forEach(function (o) { o.classList.remove('open'); });
    }
  });

  /* ---------- Universal search ---------- */
  var INDEX = window.AB_SEARCH_INDEX || [
    { t: 'Homepage', m: 'Ankovex Bay — free gaming & train sim hub', ty: 'Page', u: 'index.html' },
    { t: 'Genre Index', m: 'Every page, collection and resource in one index', ty: 'Page', u: 'genre.html' },
    { t: 'MSTS Addons Hub', m: 'Every Microsoft Train Simulator Indian addon in one hub', ty: 'MSTS', u: 'msts-addons.html' },
    { t: 'MSTS Folder Backup / Preinstalled', m: 'Complete preinstalled MSTS folder backup — 6 split 7z parts, free download', ty: 'MSTS', u: 'msts-folder-backup.html' },
    { t: 'MSTS Routes', m: 'Indian railway routes & scenarios', ty: 'MSTS', u: 'msts-routes.html' },
    { t: 'THE VAISHNAVI ROUTE', m: 'Northern Railway route — Delhi NCR, Ghaziabad, Rewari & Delhi–Kalka mainline — 12-part RAR · ~23.4 GB', ty: 'MSTS', u: 'the-vaishnavi-route.html' },
    { t: 'TSCR-V2-KZJ Update', m: 'TSCR route V2 update — Kazipet Junction (KZJ), South Central Railway — 6-part RAR · ~9.6 GB', ty: 'MSTS', u: 'tscr-v2-kzj-update.html' },
    { t: 'Western_railways_v12_route', m: 'Western Railways V12 route — Kota–Mathura trunk section, Delhi–Mumbai corridor — 4-part ZIP · ~6.3 GB', ty: 'MSTS', u: 'western-railways-v12-route.html' },
    { t: 'MIR Surat Update', m: 'Mega Indian Railways Surat section for MSTS & Open Rails — free download', ty: 'MSTS', u: 'mir-surat-update.html' },
    { t: 'SER & ER Siuri Malda Update', m: 'Siuri–Malda corridor across Birbhum & Malda, West Bengal — 6-part RAR · ~10.4 GB — free download', ty: 'MSTS', u: 'msts-route-ser-er-siuri-malda-update.html' },
    { t: 'MSTS Locomotives', m: 'WDM, WAG, WAP & WP series packs', ty: 'MSTS', u: 'msts-locomotives.html' },
    { t: 'GD Production Addons', m: 'GD Goods Set, freight wagons & rail maintenance packs', ty: 'MSTS', u: 'gd-production.html' },
    { t: 'GD Production Pack', m: 'Complete GD Production bundle — free download', ty: 'MSTS', u: 'gd-production-pack.html' },
    { t: 'KRG Production Addons', m: 'BRC WAP-5 locomotive packs — 30044 · 30054 · 30058 · 30068 · 30073', ty: 'MSTS', u: 'krg-production.html' },
    { t: 'KRG WAP5 Pack', m: 'BRC shed WAP-5 loco pack with HR textures — free download', ty: 'MSTS', u: 'krg-wap5-pack.html' },
    { t: 'KRG WAG7 Pack', m: 'WAG-7 freight locos BZA 28508 · EDDX 28695 · GTL 28389 with HR textures — free download', ty: 'MSTS', u: 'krg-wag7-pack.html' },
    { t: 'KRG Wag 7 flat', m: 'Flatface HR 27129-27583 — high-resolution flat-face WAG-7 — free download', ty: 'MSTS', u: 'krg-wag7-flat.html' },
    { t: 'KRG WAP4 Pack', m: 'WAP-4 passenger locomotive pack — split archive 2 parts — free download', ty: 'MSTS', u: 'krg-wap4-pack.html' },
    { t: 'MSTS Sounds', m: 'Realistic horn, engine & brake sounds', ty: 'MSTS', u: 'msts-sounds.html' },
    { t: 'AJ.EOG.V3.SOUND', m: 'Realistic V3 sound pack for MSTS & Open Rails — engine, horn and traction audio — free 7z download', ty: 'MSTS', u: 'aj-eog-v3-sound.html' },
    { t: 'ARS.EMD.V1', m: 'EMD sound pack for MSTS & Open Rails — single free 7z download', ty: 'MSTS', u: 'ars-emd-v1.html' },
    { t: 'MGW Sounds', m: '19 hand-tuned Indian loco sound & horn packs — free downloads', ty: 'MSTS', u: 'sounds-by-mgw.html' },
    { t: 'MSTS Environment Sounds', m: 'Two region-based environment ambience sets for MSTS & Open Rails — hill & non-hill regions — free downloads', ty: 'MSTS', u: 'msts-environment-sounds.html' },
    { t: 'Realistic Coaches', m: 'LHB & ICF coaches, wagons & liveries', ty: 'MSTS', u: 'realistic-coaches.html' },
    { t: 'ICF.BG PRO', m: 'Classic Indian Railways ICF coach pack for MSTS & Open Rails — 7z · ~827 MB — free download', ty: 'MSTS', u: 'icf-bg-pro.html' },
    { t: 'BGPro Coaches', m: 'All BG Pro Production ICF coach packs — ICF.BG PRO, ICF Raj & ICF GR — direct downloads', ty: 'MSTS', u: 'bgpro-coaches.html' },
    { t: 'BGPro_ICF_Raj', m: 'BG Pro Production ICF Rajdhani coach pack for MSTS & Open Rails — RAR · ~346 MB — free download', ty: 'MSTS', u: 'bgpro-icf-raj.html' },
    { t: 'BGPro_ICF_GR', m: 'BG Pro Production ICF GR coach pack for MSTS & Open Rails — 7z · ~814 MB — free download', ty: 'MSTS', u: 'bgpro-icf-gr.html' },
    { t: 'MIB Double Decker', m: 'Indian Railways Double Decker coach pack — seven liveries, night textures & full sound set — free download', ty: 'MSTS', u: 'mib-double-decker.html' },
    { t: 'MSTS Reshades', m: 'ReShade presets & graphics packs', ty: 'MSTS', u: 'msts-reshades.html' },
    { t: 'Activities', m: 'MSTS activities & scenarios', ty: 'MSTS', u: 'activity.html' },
    { t: 'Softwares', m: 'Tools, utilities and patches', ty: 'Downloads', u: 'softwares.html' },
    { t: 'Windows', m: 'Official Windows ISOs & downloads', ty: 'Downloads', u: 'windows.html' },
    { t: 'Windows 10 Official ISO', m: 'Windows 10 x64 official ISO — 4-part 7z split · ~6.7 GB — free download', ty: 'Downloads', u: 'windows-10-official-iso.html' },
    { t: 'Windows 11 Official ISO', m: 'Windows 11 x64 official ISO — 5-part 7z split · ~8.4 GB — free download', ty: 'Downloads', u: 'windows-11-official-iso.html' },
    { t: 'Utility', m: 'Handy utilities & control apps — tweakers and laptop tools', ty: 'Downloads', u: 'utility.html' },
    { t: 'Predator Sense — PH315-51 Only', m: 'Acer Predator Sense control utility for Helios 300 PH315-51 — free download', ty: 'Downloads', u: 'predator-sense-ph315-51.html' },
    { t: 'AE/PR Plugins & Extensions', m: 'After Effects plugins, Premiere Pro extensions & presets', ty: 'Downloads', u: 'ae-pr-plugins.html' },
    { t: 'Adobe Premiere Pro 2026', m: 'Pre-installed video editing suite for Windows 10/11 64-bit — 3-part 7z · ~5.06 GB — free download', ty: 'Downloads', u: 'adobe-premiere-pro-2026.html' },
    { t: 'Tips and PDFs', m: 'PDF downloads, handy tips & free guides', ty: 'Guides', u: 'tips.html' },
    { t: 'Topaz Video AI — Best Settings for 4K Edits', m: 'Proteus 2160×2160 (2x) upscale settings — enhancement, manual parameters & export — free guide', ty: 'Guides', u: 'topaz-video-ai-best-4k-settings.html' },
    { t: 'Why Ankovex Bay', m: 'What makes the bay different', ty: 'Info', u: 'why-ankovex-bay.html' },
    { t: 'About Us', m: 'Know more about Ankovex Bay', ty: 'Info', u: 'about-us.html' },
    { t: 'MSTS Donation', m: 'Support the MSTS community & creators', ty: 'Support', u: 'msts-donation.html' },
    { t: 'DMCA', m: 'Copyright policy & takedown requests', ty: 'Legal', u: 'dmca.html' },
    { t: 'Privacy Policy', m: 'How Ankovex Bay handles data', ty: 'Legal', u: 'privacy-policy.html' },
    { t: 'BGPRO_LHB_DEFAULT.SOUND', m: 'Default LHB coach sound set for MSTS & Open Rails — free zip download', ty: 'MSTS', u: 'bgpro-lhb-default-sound-download.html' },
    { t: 'COMMON.SOUND.JJJ', m: 'Shared JJJ sound base for the JJJPro packs — install first — free 7z download', ty: 'MSTS', u: 'common-sound-jjj-download.html' },
    { t: 'LHB.SOUND.TVP', m: 'Complete realistic LHB coach sound set by TVP — free rar download', ty: 'MSTS', u: 'lhb-sound-tvp-download.html' },
    { t: 'LHB_HS_Track_Sounds_V1_Updated', m: 'Updated high-speed LHB track sounds — free zip download', ty: 'MSTS', u: 'lhb-hs-track-sounds-download.html' },
    { t: 'MGW.LHB.V9.COMBO', m: 'Full MGW LHB V9 sound combo — coach, bogie and brake audio — free rar download', ty: 'MSTS', u: 'mgw-lhb-v9-combo-download.html' },
    { t: 'NS_WAP7_HORN_V1', m: 'Raw WAP-7 horn WAV sample for sound editors — free wav download', ty: 'MSTS', u: 'ns-wap7-horn-v1-download.html' },
    { t: 'PA.V12.SOUND.FULL.PACK', m: 'Complete V12 station announcement pack — free 7z download', ty: 'MSTS', u: 'pa-v12-sound-download.html' },
    { t: 'RC.Realistic.ICF.Sounds.V1', m: 'Realistic ICF coach sounds V1 — free 7z download', ty: 'MSTS', u: 'rc-icf-sounds-v1-download.html' },
    { t: 'RC_LHB_V2.SOUND', m: 'LHB coach sound pack V2 — free 7z download', ty: 'MSTS', u: 'rc-lhb-v2-sound-download.html' },
    { t: 'SD_LHB_V1', m: 'LHB sound pack V1 — free rar download', ty: 'MSTS', u: 'sd-lhb-v1-download.html' },
    { t: 'SD_LHB_V2', m: 'LHB sound pack V2 — free rar download', ty: 'MSTS', u: 'sd-lhb-v2-download.html' },
    { t: 'Sounds.BGPRO.EDITED', m: 'Edited BGPRO sound set — free rar download', ty: 'MSTS', u: 'sounds-bgpro-edited-download.html' },
    { t: 'TSRC.WAP7.V2', m: 'WAP-7 sound pack V2 — free rar download', ty: 'MSTS', u: 'tsrc-wap7-v2-download.html' },
    { t: 'TVP.ICF.COACH.BRAKE.SOUNDS', m: 'ICF coach brake sounds — free 7z download', ty: 'MSTS', u: 'tvp-icf-brake-download.html' },
    { t: 'UEI.ICF.v1', m: 'ICF sound pack V1 — free rar download', ty: 'MSTS', u: 'uei-icf-v1-download.html' },
    { t: 'UZAIR_LHB_V1', m: 'LHB sound pack V1 — free rar download', ty: 'MSTS', u: 'uzair-lhb-v1-download.html' },
    { t: 'UZAIR_MEMU', m: 'MEMU sound pack — free rar download', ty: 'MSTS', u: 'uzair-memu-download.html' },
    { t: 'JJJ Pro EMU', m: 'Every JJJ Pro electric multiple unit pack in one place', ty: 'MSTS', u: 'jjjpro-emu.html' },
    { t: 'BRW_MEMU', m: 'MEMU multiple unit pack — free rar download', ty: 'MSTS', u: 'brw-memu-download.html' },
    { t: 'JJJPro_EF12K', m: 'JJJ Pro EF12K pack — free rar download', ty: 'MSTS', u: 'jjjpro-ef12k-download.html' },
    { t: 'RTW.3PH.EMU', m: '3-phase EMU pack — free zip download', ty: 'MSTS', u: 'rtw-3ph-emu-download.html' },
    { t: 'RTW_3PH_MEMU_V2', m: '3-phase MEMU pack V2 — free 7z download', ty: 'MSTS', u: 'rtw-3ph-memu-v2-download.html' },
    { t: 'RTW_3PH_US_MEMU_V1', m: '3-phase US-side MEMU pack V1 — free 7z download', ty: 'MSTS', u: 'rtw-3ph-us-memu-v1-download.html' },
    { t: 'RTW_AC.EMU', m: 'AC traction EMU pack — free 7z download', ty: 'MSTS', u: 'rtw-ac-emu-download.html' },
    { t: 'RTW_DEMU_V1', m: 'Diesel EMU pack V1 — free 7z download', ty: 'MSTS', u: 'rtw-demu-v1-download.html' },
    { t: 'RTW_FLATFACE_EMU_PACKS', m: 'Flatface EMU pack bundle — free rar download', ty: 'MSTS', u: 'rtw-flatface-emu-packs-download.html' },
    { t: 'RTW_OLD_EMU_PACKS', m: 'Classic EMU pack bundle — free 7z download', ty: 'MSTS', u: 'rtw-old-emu-packs-download.html' },
    { t: 'RTW_OLD_MEMU_V2', m: 'Classic MEMU pack V2 — free 7z download', ty: 'MSTS', u: 'rtw-old-memu-v2-download.html' },
    { t: 'RTW_SIEMENS_EMU', m: 'Siemens EMU pack — free 7z download', ty: 'MSTS', u: 'rtw-siemens-emu-download.html' },
    { t: 'JJJ Pro Locomotives', m: 'All JJJ Pro locomotive packs in one place — WDS6 and more', ty: 'MSTS', u: 'jjjpro-locomotives.html' },
    { t: 'JJJPro_ALCO_WDS6_ET_36044', m: 'ALCO WDS6 shunter ET 36044 — free zip download', ty: 'MSTS', u: 'jjjpro-wds6-et-36044-download.html' },
    { t: 'JJJPro_ALCO_WDS6_HWH_36215', m: 'ALCO WDS6 shunter HWH 36215 — free zip download', ty: 'MSTS', u: 'jjjpro-wds6-hwh-36215-download.html' },
    { t: 'MIB Production', m: 'Every MIB production pack in one place — WAG-9 and WAP-7 builds', ty: 'MSTS', u: 'mib-production.html' },
    { t: 'MIB.WAG9.AJJ.31370.75th.INDEPENDENCE', m: 'WAG-9 Arakkonam 31370 with 75th Independence livery — free rar download', ty: 'MSTS', u: 'mib-wag9-ajj-31370-download.html' },
    { t: 'Mib.Wap7.3edition.new', m: 'WAP-7 third edition pack — free rar download', ty: 'MSTS', u: 'mib-wap7-third-edition-download.html' },
    { t: 'MIB.Wap7', m: 'MIB WAP-7 production pack — free 7z download', ty: 'MSTS', u: 'mib-wap7-pack-download.html' },
    { t: 'SG Production Locomotives', m: 'SG production locomotive collection — WAG-5 and more', ty: 'MSTS', u: 'sg-production-locomotives.html' },
    { t: 'SG.WAG5', m: 'SG WAG-5 production pack — free 7z download', ty: 'MSTS', u: 'sg-wag5-download.html' },
    { t: 'SVRP Production', m: 'SVRP production collection — WAG-12B and more', ty: 'MSTS', u: 'svrp-production.html' },
    { t: 'SVRP_WAG12B_V2', m: 'WAG-12B V2 twin-section electric — free 7z download', ty: 'MSTS', u: 'svrp-wag12b-v2-download.html' },
    { t: 'TVP Production', m: 'TVP production collection — WCAM-1 rainbow, freight packs and more', ty: 'MSTS', u: 'tvp-production.html' },
    { t: 'TVP_WCAM1RAINBOW', m: 'WCAM-1 rainbow livery locomotive pack — free rar download', ty: 'MSTS', u: 'tvp-wcam1-rainbow-download.html' },
    { t: 'TVP_FREIGHT_PACK', m: 'TVP freight pack for MSTS & Open Rails — free 7z download', ty: 'MSTS', u: 'tvp-freight-download.html' },
    { t: 'SG Production Coaches', m: 'SG production coach collection — Tejas and more', ty: 'MSTS', u: 'sg-production-coaches.html' },
    { t: 'SG.TEJAS', m: 'Tejas express coach set — free 7z download', ty: 'MSTS', u: 'sg-tejas-download.html' },
    { t: 'JJJ Pro Coaches', m: 'All JJJ Pro coach packs in one place — Vistadome and more', ty: 'MSTS', u: 'jjjpro-coaches.html' },
    { t: 'JJJPro_Vistadome', m: 'Vistadome coach pack — free zip download', ty: 'MSTS', u: 'jjjpro-vistadome-download.html' },
    { t: 'JJJPro_Accident_Relief', m: 'Accident relief vehicle pack — free zip download', ty: 'MSTS', u: 'jjjpro-accident-relief-download.html' },
    { t: 'Special Rolling Stocks', m: 'Accident relief, military escorts and more special rakes in one collection', ty: 'MSTS', u: 'special-rolling-stock.html' },
    { t: 'Military Express Coaches', m: 'Military escort express coach set — free 7z download', ty: 'MSTS', u: 'tvp-military-express-download.html' },
    { t: 'TVP_OKHA_RMM_Coaches', m: 'Okha to Rameswaram express coach set — free 7z download', ty: 'MSTS', u: 'tvp-okha-rmm-download.html' },
    { t: 'Vande Bharat', m: 'Vande Bharat trainset packs for MSTS & Open Rails', ty: 'MSTS', u: 'vande-bharat.html' },
    { t: 'RTW Vande Bharat', m: 'RTW Vande Bharat trainset collection', ty: 'MSTS', u: 'rtw-vande-bharat.html' },
    { t: 'RTW Vande Bharat Saffron', m: 'RTW Vande Bharat Saffron edition pack — free 7z download', ty: 'MSTS', u: 'rtw-vb-saffron-download.html' },
    { t: 'White Edition V2 Vande Bharat', m: 'RTW Vande Bharat White Edition V2 pack — free 7z download', ty: 'MSTS', u: 'rtw-vb-white-v2-download.html' },
    { t: 'Krg.Wap7.GMO-39112-30781', m: 'KRG WAP-7 GMO shed 39112 and 30781 pack — free rar download', ty: 'MSTS', u: 'krg-wap7-gmo-download.html' },
    { t: 'KRG WAG7 Flatface 27129-27583', m: 'Flatface HR 27129-27583 WAG-7 pack — free rar download', ty: 'MSTS', u: 'krg-wag7-flatface-download.html' },
    { t: 'MSTS Freight Wagons', m: 'BRW, BSAM and TVP freight wagon families in one hub', ty: 'MSTS', u: 'msts-freight-wagons.html' },
    { t: 'BRW Wagons', m: 'BRW freight wagon collection', ty: 'MSTS', u: 'brw-wagons.html' },
    { t: 'BRW.-.BTPN', m: 'BTPN pneumatic wagon set — free zip download', ty: 'MSTS', u: 'brw-btpn-download.html' },
    { t: 'BSAM Production', m: 'BSAM freight wagon pack collection', ty: 'MSTS', u: 'bsam-production.html' },
    { t: 'BSAM.CABOOSE', m: 'Guard caboose van pack — free zip download', ty: 'MSTS', u: 'bsam-caboose-download.html' },
    { t: 'BSAM.CONCOR', m: 'CONCOR container wagon set — free zip download', ty: 'MSTS', u: 'bsam-concor-download.html' },
    { t: 'BSAM_NALCO', m: 'NALCO freight wagon set — free zip download', ty: 'MSTS', u: 'bsam-nalco-download.html' },
    { t: 'VPM.CABOOSE', m: 'Caboose guard van pack — free rar download', ty: 'MSTS', u: 'vpm-caboose-download.html' },
    { t: 'ArtCraft', m: 'Vibe-coded alternative to the Adobe creative apps — free exe installer', ty: 'Downloads', u: 'artcraft-download.html' },
    { t: 'DDS Viewer', m: 'Free DDS texture viewer for Windows — free exe installer', ty: 'Downloads', u: 'ddsviewer-download.html' },
    { t: 'DesignCraft', m: 'Vibe-coded design tool for Windows — free msi installer', ty: 'Downloads', u: 'designcraft-download.html' },
    { t: 'EffectCraft', m: 'Vibe-coded alternative to Adobe After Effects — free msi installer', ty: 'Downloads', u: 'effectcraft-download.html' },
    { t: 'FilmCraft', m: 'Vibe-coded alternative to Adobe Premiere Pro — free msi installer', ty: 'Downloads', u: 'filmcraft-download.html' },
    { t: 'LightCraft', m: 'Vibe-coded alternative to Adobe Lightroom — free msi installer', ty: 'Downloads', u: 'lightcraft-download.html' },
    { t: 'PDFCraft', m: 'Adobe Acrobat vibe-coded alternative — free msi installer', ty: 'Downloads', u: 'pdfcraft-download.html' },
    { t: 'PhotoCraft', m: 'Vibe-coded Photoshop alternative made by ArtCraft — free msi installer', ty: 'Downloads', u: 'photocraft-download.html' },
    { t: 'VectorCraft', m: 'Vibe-coded alternative to Adobe Illustrator — free msi installer', ty: 'Downloads', u: 'vectorcraft-download.html' },
    { t: 'Ace-It Utilities', m: 'Ace-It texture tool collection for MSTS', ty: 'Downloads', u: 'aceit-utilities.html' },
    { t: 'utilities_aceit', m: 'ACE to BMP/DDS converter toolkit — free rar download', ty: 'Downloads', u: 'utilities-aceit-download.html' },
    { t: 'TSRE Consist & Route Editor', m: 'TSRE-TS — edit consists and routes for MSTS & Open Rails — free 7z download', ty: 'Downloads', u: 'tsre-ts-download.html' },
    { t: 'MSTS Toolkit', m: 'Ultimate v2.6.2 latest update plus v2.5.2 builds — free rar downloads', ty: 'MSTS', u: 'msts-toolkit-download.html' },
    { t: 'Royal.rajsthan.route', m: 'Freeware Royal Rajasthan route — 920.5 MB zip — free download', ty: 'MSTS', u: 'msts-route-royal-rajasthan.html' },
    { t: 'Open Rails New Year (Reshade Compatible)', m: 'Preinstalled Open Rails New Year pack, reshade-compatible — free rar download', ty: 'MSTS', u: 'or-new-year-download.html' },
    { t: 'MSTS Folder Backup — Blank (Route + Trains)', m: 'Blank MSTS folder backup with fresh ROUTES and TRAINS folders — free rar download', ty: 'MSTS', u: 'msts-blank-folder-download.html' },
    { t: 'SG WAP-4', m: 'SG Production WAP-4 electric loco packs, 10 shed builds ldh tkd bza ed ajj vta bsl src bl hwh, free 7z downloads', ty: 'MSTS', u: 'sg-wap4-download.html' },
    { t: 'SG Production WAM4', m: 'SG Production WAM4 electric loco packs, 4 shed builds brc 20585 ajj 21225 tata 21293 et 21373, free 7z downloads', ty: 'MSTS', u: 'sg-wam4-download.html' },
    { t: 'KRG WAG7 Tiger Face', m: 'KRG WAG7 Tiger Face flat face pack, tigerface 2-in-1 standard plus HR rar variants, free rar downloads', ty: 'MSTS', u: 'krg-wag7-tigerface-download.html' },
    { t: 'AE GPT 1.2', m: 'GPT-powered AI assistant plugin for After Effects — free rar download', ty: 'Downloads', u: 'ae-gpt-download.html' },
    { t: 'GEOlayers 3', m: 'Map the real world inside After Effects with live satellite imagery — free rar download', ty: 'Downloads', u: 'geolayers-3-download.html' },
    { t: 'AfterCodecs 1.12', m: 'Fast H.264 / HEVC / HAP export codec for AE and Premiere Pro — free rar download', ty: 'Downloads', u: 'aftercodecs-download.html' },
    { t: 'Claude Scripter 1.3', m: 'AI-powered effect scripting inside After Effects — free rar download', ty: 'Downloads', u: 'claude-scripter-download.html' },
    { t: 'CRT Emulator 8.2', m: 'Retro CRT scanline and curvature FX for After Effects — free rar download', ty: 'Downloads', u: 'crt-emulator-download.html' },
    { t: 'Deep Glow 1.6', m: 'The classic physically-based glow plugin for After Effects — free rar download', ty: 'Downloads', u: 'deep-glow-download.html' },
    { t: 'Dehancer Pro 7.4', m: 'Film emulation and grain for Premiere Pro and After Effects — free rar download', ty: 'Downloads', u: 'dehancer-pro-download.html' },
    { t: 'Flow 1.5', m: 'Frame blending and motion tool for After Effects — free rar download', ty: 'Downloads', u: 'flow-plugin-download.html' },
    { t: 'FX Console 1.0', m: 'Instant effect search and control panel for After Effects — free zip installer', ty: 'Downloads', u: 'fxconsole-download.html' },
    { t: 'Hyper.speed 2.1', m: 'Speed-ramp transition suite for After Effects — free rar download', ty: 'Downloads', u: 'hyperspeed-download.html' },
    { t: 'Influx 1.5', m: 'Native mkv / flac / mov codec plugin for AE and Premiere Pro — free rar download', ty: 'Downloads', u: 'influx-download.html' },
    { t: 'Magic Bullet Suite 2025', m: 'Looks, Colorista, Denoiser colour grading bundle — free rar download', ty: 'Downloads', u: 'magic-bullet-suite-download.html' },
    { t: 'Mocha Pro 2026', m: 'Planar tracking and object removal power — free rar download', ty: 'Downloads', u: 'mocha-pro-download.html' },
    { t: 'Optical Flares 1.3', m: 'The legendary lens flare plugin for After Effects — free rar download', ty: 'Downloads', u: 'optical-flares-download.html' },
    { t: 'Pro Shaders 1', m: 'The original shader preset pack for Element 3D — free rar download', ty: 'Downloads', u: 'pro-shaders-download.html' },
    { t: 'Twixtor Pro 8.1', m: 'Industry-standard frame interpolation plugin — free rar download', ty: 'Downloads', u: 'twixtor-pro-8-download.html' },
    { t: 'RSMB Pro 6.4', m: 'Automatic motion blur by ReelSmart — free rar download', ty: 'Downloads', u: 'rsmb-pro-download.html' },
    { t: 'Saber 1.0.4 (Lofix)', m: 'The legendary energy-beam glow plugin — free rar download', ty: 'Downloads', u: 'saber-lofix-download.html' },
    { t: 'Sapphire 2026', m: 'Industry-standard VFX suite with 340+ effects — free rar download', ty: 'Downloads', u: 'sapphire-2026-download.html' },
    { t: 'Shooter Suite 13', m: 'Ingest, deliver and offload tools by REVisionFX — free rar download', ty: 'Downloads', u: 'shooter-suite-download.html' },
    { t: 'Signal 1.2', m: 'Data-text and glitch transition tool for After Effects — free rar download', ty: 'Downloads', u: 'signal-download.html' },
    { t: 'Tracery 1.1', m: 'Procedural pattern and texture generator — free rar download', ty: 'Downloads', u: 'tracery-download.html' },
    { t: 'Trapcode Suite 2025', m: 'Particular, Form, Mir and the full particle suite — free rar download', ty: 'Downloads', u: 'trapcode-suite-2025-download.html' },
    { t: 'Twitch 1.1', m: 'The classic glitch, blur and sync plugin — free rar download', ty: 'Downloads', u: 'twitch-download.html' },
    { t: 'Universe 2026', m: '90+ GPU transitions and effects for AE and PR — free rar download', ty: 'Downloads', u: 'universe-2026-download.html' },
    { t: 'VFX Suite 2025', m: 'Supercomp, King Pin Tracker compositing suite — free rar download', ty: 'Downloads', u: 'vfx-suite-2025-download.html' },
    { t: 'Element 3D 2.2', m: 'Real 3D lights and particle objects inside After Effects — free rar download', ty: 'Downloads', u: 'element-3d-download.html' },
    { t: 'Deep Glow 2', m: 'Next-gen physically-based glow plugin, Aescripts + Lofix builds — free rar downloads', ty: 'Downloads', u: 'deep-glow-2-download.html' },
    { t: 'Pro Shaders 2', m: '900+ OpenGL shader presets for Element 3D, 2 parts — free rar downloads', ty: 'Downloads', u: 'pro-shaders-2-download.html' },
  ];

  function norm(s) { return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
  function matches(text, q) {
    var nq = norm(q); if (!nq) return true;
    var nh = norm(text);
    var cq = nq.replace(/ /g, ''), ch = nh.replace(/ /g, '');
    if (nh.indexOf(nq) !== -1 || ch.indexOf(cq) !== -1) return true;
    return nq.split(' ').every(function (t) { return nh.indexOf(t) !== -1 || ch.indexOf(t) !== -1; });
  }

  var modal = document.getElementById('searchModal');
  var input = document.getElementById('modalSearchInput');
  var results = document.getElementById('searchResults');

  window.openSearchModal = function () {
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    abScrollLock(true);
    setTimeout(function () { if (input) input.focus(); }, 60);
  };
  function closeSearch() {
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    abScrollLock(false);
  }
  window.closeSearchModal = closeSearch;

  if (modal) {
    modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('.search-close')) closeSearch(); });
  }
  if (input && results) {
    input.addEventListener('input', function () {
      var q = input.value.trim();
      if (!norm(q)) { results.classList.remove('open'); results.innerHTML = ''; return; }
      var hits = INDEX.filter(function (it) { return matches(it.t + ' ' + it.m + ' ' + it.ty, q); });
      if (hits.length) {
        results.innerHTML = hits.slice(0, 9).map(function (it) {
          return '<a href="' + it.u + '"><span><span class="sr-t">' + it.t + '</span><br><span class="sr-m">' + it.m +
            '</span></span><span class="sr-b">' + it.ty + '</span></a>';
        }).join('');
      } else {
        results.innerHTML = '<div class="search-empty">No results for "<b>' + q.replace(/</g, '&lt;') +
          '"</b> — try routes, locomotives, sounds, plugins…</div>';
      }
      results.classList.add('open');
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = results.querySelector('a');
        if (first) { e.preventDefault(); location.href = first.getAttribute('href'); }
      }
    });
  }
  document.querySelectorAll('[data-open-search]').forEach(function (btn) {
    btn.addEventListener('click', function (e) { e.preventDefault(); openSearchModal(); });
  });

  /* ---------- Animated counters ----------
     .reveal is CSS-only now (no entrance animation is used), so no
     scroll observer is needed for it. Fewer observers = less work. */
  var co = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1);
        el.textContent = Math.floor(end * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat-num[data-count]').forEach(function (c) { co.observe(c); });

  /* ---------- Marquee duplication (seamless loop) ----------
     The endless animation is paused whenever the strip is offscreen or
     the tab is hidden, so it doesn't keep the GPU busy while scrolling. */
  document.querySelectorAll('.marquee-track').forEach(function (track) {
    track.innerHTML += track.innerHTML;
    if (!('IntersectionObserver' in window)) return;
    var visible = false;
    function apply() {
      track.style.animationPlayState = (visible && !document.hidden) ? 'running' : 'paused';
    }
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      apply();
    }, { rootMargin: '80px' }).observe(track);
    document.addEventListener('visibilitychange', apply);
  });

  /* ---------- Card cursor glow (mouse only, one paint per frame) ---------- */
  if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.category-card, .product-card').forEach(function (card) {
      var frame = 0;
      card.addEventListener('pointermove', function (e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = 0;
          var r = card.getBoundingClientRect();
          if (!r.width || !r.height) return;
          card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
          card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        });
      }, { passive: true });
    });
  }

  /* ---------- Poora card clickable — kahin bhi click = product page ----------
     Sirf card ke andar kisi anchor/button par click karne par wo apne
     hisaab se chalta hai; baaki jagah (image, title, price, padding)
     View button jaisa hi redirect karta hai. Placeholder cards (href="#")
     skip ho jaate hain. */
  document.querySelectorAll('.product-card').forEach(function (card) {
    var link = card.querySelector('.pc-actions a') || card.querySelector('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#') return; /* "coming soon" cards skip */
    card.style.cursor = 'pointer';
    card.addEventListener('click', function (e) {
      if (e.target.closest('a, button')) return; /* andar ke buttons/links ko touch mat karo */
      link.click(); /* jaise View daba diya — same tab / new tab waisa hi */
    });
  });

  /* ---------- Pagination (data-paginate="8") + Filter chips ---------- */
  var paginators = [];
  document.querySelectorAll('[data-paginate]').forEach(function (grid) {
    var cfg = {
      grid: grid,
      per: parseInt(grid.getAttribute('data-paginate'), 10) || 8,
      page: 0,
      filter: 'all',
      pager: grid.parentElement.querySelector('[data-pager]'),
      cards: Array.prototype.filter.call(grid.children, function (el) { return el.hasAttribute('data-cat'); })
    };
    grid.__pag = cfg;
    paginators.push(cfg);
  });

  function applyPag(cfg, resetPage) {
    if (resetPage) cfg.page = 0;
    var match = cfg.cards.filter(function (c) { return cfg.filter === 'all' || c.dataset.cat === cfg.filter; });
    var pages = Math.max(1, Math.ceil(match.length / cfg.per));
    if (cfg.page > pages - 1) cfg.page = pages - 1;
    if (cfg.page < 0) cfg.page = 0;
    var start = cfg.page * cfg.per;
    cfg.cards.forEach(function (c) { c.style.display = 'none'; });
    match.slice(start, start + cfg.per).forEach(function (c) { c.style.display = ''; });
    if (!cfg.pager) return;
    if (pages < 2) { cfg.pager.innerHTML = ''; cfg.pager.classList.remove('on'); return; }
    var h = '<button class="pg-btn pg-arrow" type="button" data-pg="prev" aria-label="Previous page"' +
      (cfg.page === 0 ? ' disabled' : '') + '><span class="material-symbols-outlined">chevron_left</span></button>';
    for (var i = 0; i < pages; i++) {
      h += '<button class="pg-btn' + (i === cfg.page ? ' active' : '') + '" type="button" data-pg="' + i +
        '" aria-label="Page ' + (i + 1) + '"' + (i === cfg.page ? ' aria-current="page"' : '') + '>' + (i + 1) + '</button>';
    }
    h += '<button class="pg-btn pg-arrow" type="button" data-pg="next" aria-label="Next page"' +
      (cfg.page === pages - 1 ? ' disabled' : '') + '><span class="material-symbols-outlined">chevron_right</span></button>';
    cfg.pager.innerHTML = h;
    cfg.pager.classList.add('on');
  }
  paginators.forEach(function (cfg) { applyPag(cfg); });

  document.querySelectorAll('[data-pager]').forEach(function (pager) {
    var grid = pager.parentElement.querySelector('[data-paginate]');
    if (!grid || !grid.__pag) return;
    var cfg = grid.__pag;
    pager.addEventListener('click', function (e) {
      var b = e.target.closest('.pg-btn');
      if (!b || b.disabled) return;
      var v = b.getAttribute('data-pg');
      if (v === 'prev') cfg.page--;
      else if (v === 'next') cfg.page++;
      else cfg.page = parseInt(v, 10) || 0;
      applyPag(cfg);
      abScrollTo(grid);
    });
  });

  /* ---------- Filter chips ---------- */
  document.querySelectorAll('.filter-chips').forEach(function (group) {
    group.querySelectorAll('.chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        group.querySelectorAll('.chip').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.dataset.filter;
        var scope = group.dataset.scope ? document.querySelector(group.dataset.scope) : document;
        scope.querySelectorAll('[data-cat]').forEach(function (card) {
          card.style.display = (f === 'all' || card.dataset.cat === f) ? '' : 'none';
        });
        /* Pagination wale grids: filter ke saath dobara paginate (page 1 par reset) */
        paginators.forEach(function (cfg) {
          if (scope.contains(cfg.grid)) { cfg.filter = f; applyPag(cfg, true); }
        });
      });
    });
  });

  /* ---------- Product tabs (SimAdda-style) ---------- */
  document.querySelectorAll('.ptabs').forEach(function (bar) {
    var tabs = bar.querySelectorAll('.ptab');
    var scope = bar.parentElement;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var id = tab.dataset.tab;
        scope.querySelectorAll('.ptab-panel').forEach(function (p) {
          p.classList.toggle('active', p.id === id);
        });
        /* Support hash deep-links like #tab-installation */
      });
    });
    /* Open tab from URL hash (#tab-installation etc.) */
    function openFromHash() {
      if (!location.hash) return;
      var target = scope.querySelector('.ptab[data-tab="' + location.hash.slice(1) + '"]');
      if (target) target.click();
    }
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  });

  /* ---------- Donation popup — download se PEHLE, 8s lock, MSTS + RailWorks ---------- */
  (function () {
    /* Popup markup JS se inject hota hai — 53 pages me alag se add karne ki zaroorat nahi */
    var pop = document.createElement('div');
    pop.id = 'donPop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-modal', 'true');
    pop.setAttribute('aria-hidden', 'true');
    pop.innerHTML =
      '<div class="don-back"></div>' +
      '<div class="don-card">' +
        '<button class="don-close" type="button" aria-label="Close donation popup" data-don-close>&#10005;</button>' +
        '<div class="don-badge">MSTS &amp; RailWorks Community</div>' +
        '<h3 id="donTitle">Enjoying <span>Ankovex Bay</span>?</h3>' +
        '<p class="don-txt">Loving the Indian routes, locomotives and sounds? Support the MSTS &amp; RailWorks addon creators and keep every download 100% free for everyone.</p>' +
        '<div class="don-btns">' +
          '<a href="msts-donation.html" class="don-btn">Donate MSTS Addons Now</a>' +
          '<a href="msts-donation.html" class="don-btn don-btn-2">Donate RailWorks Addons Now</a>' +
          '<a href="share-addons.html" class="don-btn don-btn-3">I Have Addons To Share</a>' +
        '</div>' +
        '<p class="don-note">Every donation keeps the bay alive and growing.</p>' +
      '</div>';
    document.body.appendChild(pop);

    var KEY = 'ankovexDonState';
    var COOLDOWN = 120000; /* close ke baad 2 min cooldown + har page par session me sirf 1 baar */
    function readSt() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
    function writeSt(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }

    var lockIv = null, lockLeft = 8, lockBtns = [], pendingUrl = null;

    function stopLock() { if (lockIv) { clearInterval(lockIv); lockIv = null; } }
    function runLock() {
      stopLock();
      lockIv = setInterval(function () {
        lockLeft--;
        if (lockLeft > 0) { lockBtns.forEach(function (b) { b.textContent = lockLeft; }); return; }
        stopLock();
        lockBtns.forEach(function (b) { b.classList.remove('counting'); b.disabled = false; b.textContent = '\u2715'; });
      }, 1000);
    }
    /* Countdown tab visible hone par chalta hai (chahe user kisi aur app me ho) */
    function syncLock() {
      if (!pop.classList.contains('open') || lockLeft <= 0) return;
      if (document.hidden) stopLock(); else runLock();
    }
    document.addEventListener('visibilitychange', syncLock);
    window.addEventListener('focus', syncLock);
    window.addEventListener('blur', syncLock);

    function startLock() {
      lockBtns = pop.querySelectorAll('[data-don-close]');
      lockLeft = 8;
      stopLock();
      lockBtns.forEach(function (b) { b.classList.add('counting'); b.disabled = true; b.textContent = lockLeft; });
      if (!document.hidden) runLock();
    }
    var PAGE_KEY = 'ankovexDonPages'; /* sessionStorage — kaunsi pages par popup ho chuka */
    function pageShown() {
      try { return (JSON.parse(sessionStorage.getItem(PAGE_KEY) || '[]')).indexOf(location.pathname) !== -1; }
      catch (e) { return false; }
    }
    function markPage() {
      try {
        var p = JSON.parse(sessionStorage.getItem(PAGE_KEY) || '[]');
        if (p.indexOf(location.pathname) === -1) { p.push(location.pathname); sessionStorage.setItem(PAGE_KEY, JSON.stringify(p)); }
      } catch (e) {}
    }
    function openPop(url, flash) {
      pendingUrl = url || null;
      markPage(); /* is page par ab aur nahi — agla popup dusre page par */
      pop.classList.add('open');
      pop.setAttribute('aria-hidden', 'false');
      abScrollLock(true); /* popup khula ho to peeche page scroll na ho */
      if (flash) { pop.classList.remove('flash'); void pop.offsetWidth; pop.classList.add('flash'); }
      startLock();
    }
    function closePop() {
      var cb = pop.querySelector('[data-don-close]');
      if (cb && cb.disabled) return; /* lock chal raha hai — band nahi hoga */
      stopLock();
      pop.classList.remove('open', 'flash');
      pop.setAttribute('aria-hidden', 'true');
      abScrollLock(false);
      var st = readSt(); st.nextShowAt = Date.now() + COOLDOWN; writeSt(st);
      /* Lock khatam → close dabate hi asli download link naye tab me khul jaaye */
      if (pendingUrl) { var u = pendingUrl; pendingUrl = null; window.open(u, '_blank', 'noopener'); }
    }
    pop.querySelectorAll('[data-don-close]').forEach(function (el) { el.addEventListener('click', closePop); });
    /* NOTE: backdrop (.don-back) par click se band NAHI hota — sirf 8s lock
       khatam hone ke baad X button se band hoga */
    /* Donate buttons daba diye → seedha donation page, pending download drop */
    pop.querySelectorAll('.don-btn').forEach(function (a) {
      a.addEventListener('click', function () {
        pendingUrl = null;
        stopLock();
        var st = readSt(); st.nextShowAt = Date.now() + COOLDOWN; writeSt(st);
        pop.classList.remove('open', 'flash');
        pop.setAttribute('aria-hidden', 'true');
        abScrollLock(false);
      });
    });

    /* Download link detect — EXTERNAL link jo download jaisa ho:
       (a) purane download classes/selectors, (b) download table ke andar,
       (c) target="_blank" (nav/footer chhod kar) */
    var DL_SEL = 'a.btn-dl, .btn-dl, [data-dl], [data-download], a[download], .dl-btn, .btn-download, .download-btn, ' +
      '#downloads a, .table-wrap a, .pc-actions a.icon-btn.gold, ' +
      'a[href*="mediafire.com"], a[href*="releases/download"], a[href*="opencloud"], a[href*="drive.google.com"], ' +
      'a[href*="drive.user.google.com"], a[href*="mega.nz"], a[href*="dropbox.com"], a[href*="github.com"], ' +
      'a[href*="spacebyte.in"]';
    function isDlLink(el) {
      if (el.hasAttribute('data-no-don')) return false; /* submission form jaise important links popup me nahi atke */
      if (el.matches(DL_SEL)) return true;
      if (el.closest('table, .table-wrap')) return true;
      if (el.target === '_blank' && !el.closest('nav, footer')) return true;
      return false;
    }
    /* Asli download URL ko data-href me shift karo — href par sirf "#".
       Fayda: (1) hover par status bar me download link nahi dikhti,
       (2) Ctrl/Shift+Click ya middle-click ke paas koi link hi nahi bachta,
       isliye popup bypass ho kar seedha open nahi ho sakta. */
    function goNow(el, url, ev) {
      var newTab = el.target === '_blank' || (ev && (ev.ctrlKey || ev.metaKey || ev.shiftKey));
      if (newTab) window.open(url, '_blank', 'noopener'); else location.href = url;
    }
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0) return;
      var isExternal = /^https?:\/\//i.test(href) && href.indexOf(location.host) === -1;
      if (!isExternal && !a.hasAttribute('download')) return;
      if (!isDlLink(a)) return;
      a.setAttribute('data-href', href.replace(/&amp;/g, '&'));
      a.setAttribute('href', '#');
    });
    document.addEventListener('click', function (ev) {
      if (!ev.target || !ev.target.closest) return;
      if (pop.contains(ev.target)) return;
      if (pop.classList.contains('open')) return;
      var el = ev.target.closest('a[data-href], a[href]');
      if (!el) return;
      var href = el.getAttribute('data-href') || '';
      if (!href) {
        href = el.getAttribute('href') || '';
        if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0) return;
        var isExternal = /^https?:\/\//i.test(href) && href.indexOf(location.host) === -1;
        if (!isExternal && !el.hasAttribute('download')) return;
        if (!isDlLink(el)) return;
      }
      var cd = readSt();
      if (cd.nextShowAt && cd.nextShowAt > Date.now()) { goNow(el, href, ev); return; } /* 2 min cooldown — seedha link */
      if (pageShown()) { goNow(el, href, ev); return; } /* is page par session me already ho chuka */
      ev.preventDefault(); /* ruko — pehle popup; Ctrl/Shift se bhi bypass nahi */
      openPop(href, true);
    }, true);
    /* Middle-click (auxclick) — stripped download link naye tab me nahi khulega */
    document.addEventListener('auxclick', function (ev) {
      if (!ev.target || !ev.target.closest) return;
      if (pop.contains(ev.target)) return;
      var el = ev.target.closest('a[data-href]');
      if (!el) return;
      ev.preventDefault();
    }, true);
  })();

  /* ---------- Smooth in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (!href || href === '#') { e.preventDefault(); return; }
      var t = null;
      try { t = document.querySelector(href); } catch (err) { t = null; }
      if (!t) return;
      e.preventDefault();
      abScrollTo(t);
      closeMenu();
    });
  });

  /* ---------- Hash scroll on load ---------- */
  function scrollToHash(delay) {
    if (!location.hash) return;
    var t = null;
    try { t = document.querySelector(location.hash); } catch (e) { t = null; }
    if (t) setTimeout(function () { abScrollTo(t); }, delay);
  }
  window.addEventListener('load', function () { scrollToHash(150); });
})();

/* ============================================================
   MEDIA SLIDESHOWS — lazy, visibility-aware
   Images are loaded only when their card is near the viewport.
   Offscreen slideshows pause, so the page stays smooth.
   ============================================================ */
(function () {
  'use strict';

  var mqMobile = window.matchMedia ? window.matchMedia('(max-width: 900px), (hover: none)') : null;
  function isMobile() { return !!(mqMobile && mqMobile.matches); }

  /* Smaller CDN renders on phones. Same image, roughly half the bytes and
     decode work of the 1600px desktop file. Desktop URLs stay untouched. */
  function imageUrl(u) {
    if (!u || !isMobile()) return u;
    if (/wsrv\.nl|images\.weserv\.nl|i0\.wp\.com/i.test(u)) {
      return u.replace(/([?&])w=\d+/, '$1w=1200');
    }
    return u;
  }

  /* Load a deferred image (data-src -> src) exactly once. */
  function loadImg(img) {
    if (!img || !img.dataset.src) return false;
    img.removeAttribute('loading');
    img.decoding = 'async';
    img.src = imageUrl(img.dataset.src);
    delete img.dataset.src;
    return true;
  }

  /* Wait until the decoded bitmap is ready, not just downloaded. This keeps
     image decode off the frame where the fade starts (big mobile win). */
  function decodeThen(img, cb) {
    var p = null;
    try { p = img && img.decode && img.decode(); } catch (e) { p = null; }
    if (p && p.then) p.then(cb, cb); else cb();
  }

  /* Run a callback when an image has loaded and decoded (or errored). */
  function afterLoad(img, cb) {
    if (!img || !img.getAttribute('src')) { cb(); return; }
    if (img.complete) { decodeThen(img, cb); return; }
    var done = false;
    function finish() {
      if (done) return;
      done = true;
      img.removeEventListener('load', finish);
      img.removeEventListener('error', finish);
      decodeThen(img, cb);
    }
    img.addEventListener('load', finish);
    img.addEventListener('error', finish);
  }

  /* ---------- One scheduler for every slideshow ----------
     50+ independent setInterval timers used to wake the main thread all
     over the page. Now a single 1s tick drives them, and nothing changes
     while the user is actively scrolling. */
  var tickers = [];
  var tickTimer = null;
  var scrolling = false;
  var scrollEnd = 0;

  function scrollStop() {
    scrolling = false;
    var now = Date.now();
    tickers.forEach(function (t) {
      if (t.next <= now) t.next = now + 500 + Math.random() * 1500;
    });
  }
  window.addEventListener('scroll', function () {
    scrolling = true;
    clearTimeout(scrollEnd);
    scrollEnd = setTimeout(scrollStop, 220);
  }, { passive: true });

  function runTickers() {
    if (document.hidden || scrolling) return;
    var now = Date.now();
    for (var i = 0; i < tickers.length; i++) {
      var t = tickers[i];
      if (now < t.next) continue;
      t.next = now + t.interval;
      try { t.fn(); } catch (e) {}
    }
  }
  function every(interval, fn) {
    tickers.push({ interval: interval, fn: fn, next: Date.now() + interval });
    if (!tickTimer) tickTimer = setInterval(runTickers, 1000);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    var now = Date.now();
    tickers.forEach(function (t) { t.next = now + t.interval; });
  });

  /* Track visibility; the callback fires the first time it enters. */
  function watch(el, margin, onEnter) {
    var state = { visible: false, ever: false };
    if (!el) return state;
    if (!('IntersectionObserver' in window)) {
      state.visible = state.ever = true;
      if (onEnter) onEnter();
      return state;
    }
    var io = new IntersectionObserver(function (entries) {
      var en = entries[0];
      if (!en) return;
      state.visible = en.isIntersecting;
      if (en.isIntersecting && !state.ever) {
        state.ever = true;
        if (onEnter) onEnter();
      }
    }, { rootMargin: margin || '250px' });
    io.observe(el);
    return state;
  }

  /* Generic fade slideshow: loads the current + next image only. */
  function slideshow(media, selector, opt) {
    if (!media) return;
    var slides = media.querySelectorAll(selector);
    var len = slides.length;
    if (!len) return;
    opt = opt || {};

    /* Single-image media still needs its deferred src loaded on approach. */
    if (len === 1) {
      watch(media, opt.margin, function () { loadImg(slides[0]); });
      return;
    }

    var idx = typeof opt.start === 'function' ? opt.start(len) : 0;
    if (!(idx >= 0 && idx < len)) idx = 0;

    function activate(n) {
      for (var i = 0; i < len; i++) slides[i].classList.toggle('is-active', i === n);
    }
    activate(idx);

    var vis = watch(media, opt.margin, function () {
      loadImg(slides[idx]);
      /* Preload the next slide only when the browser is idle, so it never
         competes with the first paint / hero image. */
      function preloadNext() {
        for (var i = 1; i <= (opt.preload || 1); i++) loadImg(slides[(idx + i) % len]);
      }
      if (window.requestIdleCallback) window.requestIdleCallback(preloadNext, { timeout: 3000 });
      else setTimeout(preloadNext, 1200);
    });

    var busy = false;
    var interval = opt.interval || 4000;
    if (isMobile()) interval = Math.round(interval * 1.4);
    every(interval, function () {
      if (!vis.visible || busy) return;
      var next = opt.next ? opt.next(idx, len) : (idx + 1) % len;
      if (next === idx) return;

      busy = true;
      loadImg(slides[next]);
      var fired = false;
      function advance() {
        if (fired) return;
        fired = true;
        clearTimeout(fallback);
        busy = false;
        idx = next;
        activate(idx);
        if (vis.visible) loadImg(slides[(idx + 1) % len]);
      }
      var fallback = setTimeout(advance, 1800);
      afterLoad(slides[next], advance);
    });
  }

  /* Hero — first slide is already in HTML; load one ahead on demand. */
  slideshow(document.querySelector('.hero-slides'), '.hero-slide', {
    interval: 5000,
    margin: '0px'
  });

  /* Category cards — single images load on approach, slides run only nearby. */
  document.querySelectorAll('.cat-media').forEach(function (media) {
    if (media.querySelectorAll('.cat-slide').length > 1) {
      slideshow(media, '.cat-slide', {
        interval: parseInt(media.dataset.int, 10) || 5000,
        margin: '300px'
      });
      return;
    }
    var single = media.querySelector('img[data-src]');
    if (single) watch(media, '300px', function () { loadImg(single); });
  });

  /* Featured product media — random first slide, paused offscreen. */
  slideshow(document.querySelector('.featured-media'), '.fs-slide', {
    interval: 4000,
    margin: '200px',
    start: function (len) { return Math.floor(Math.random() * len); }
  });

  /* Product cards — unique random start, pause when offscreen. */
  var pcMedias = document.querySelectorAll('.pc-slideshow');
  if (pcMedias.length) {
    var pools = {};
    function randomStart(len) {
      var pool = pools[len];
      if (!pool) {
        var order = [];
        for (var i = 0; i < len; i++) order.push(i);
        for (var j = order.length - 1; j > 0; j--) {
          var r = Math.floor(Math.random() * (j + 1));
          var t = order[j]; order[j] = order[r]; order[r] = t;
        }
        pool = pools[len] = { order: order, at: 0 };
      }
      var n = pool.order[pool.at % pool.order.length];
      pool.at++;
      return n;
    }
    pcMedias.forEach(function (media) {
      var len = media.querySelectorAll('.pc-slide').length;
      if (!len) return;
      slideshow(media, '.pc-slide', {
        interval: parseInt(media.dataset.int, 10) || 4000,
        margin: '300px',
        start: randomStart,
        next: function (idx, total) {
          var next;
          do { next = Math.floor(Math.random() * total); } while (next === idx);
          return next;
        }
      });
    });
  }

  /* ============================================================
     PRODUCT MEDIA VIEWER — .pg-viewer
     Pehla slide VIDEO, phir images. User arrows/dots se change
     karta hai. Video sirf active slide par mount hota hai.
     ============================================================ */
  document.querySelectorAll('.pg-viewer').forEach(function (box) {
    var track = box.querySelector('.pgv-track');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.querySelectorAll('.pgv-slide'));
    if (slides.length < 2) return;

    var dotsWrap = box.querySelector('.pgv-dots');
    var countEl = box.querySelector('.pgv-count b');
    var typeEl = box.querySelector('.pgv-type');
    var prevBtn = box.querySelector('.pgv-prev');
    var nextBtn = box.querySelector('.pgv-next');
    var idx = 0;
    var started = false;
    var interacted = false;

    /* Aagli image pehle se load — user ko wait na karna pade */
    function preload(i) {
      var s = slides[(i + slides.length) % slides.length];
      var img = s && s.querySelector('img[data-src]');
      if (img) loadImg(img);
    }

    /* Video (Storj mp4) sirf active slide pe mount hota hai —
       slide change ho to audio/vo band ho jaye. */
    function mountVideo(slide) {
      var fr = slide.querySelector('iframe');
      if (fr) {
        if (!fr.getAttribute('src')) fr.setAttribute('src', fr.dataset.src);
        return;
      }
      var vd = slide.querySelector('video[data-src]');
      if (vd && !vd.getAttribute('src')) {
        watchFallback(vd);
        vd.setAttribute('src', vd.dataset.src);
      }
    }
    function unmountVideo(slide) {
      var fr = slide.querySelector('iframe[src]');
      if (fr) { fr.dataset.src = fr.getAttribute('src'); fr.removeAttribute('src'); }
      var vd = slide.querySelector('video[src]');
      if (vd) {
        vd.dataset.src = vd.getAttribute('src');
        vd.removeAttribute('src');
        try { vd.load(); } catch (e) {}
      }
    }

    /* Storj presigned link sirf 15 min valid hota hai (X-Amz-Expires=900).
       Link expire hone pe (403/error) apne aap AnonMP4 embed lag jaye. */
    function watchFallback(vd) {
      if (vd.dataset.fallbackWatched) return;
      vd.dataset.fallbackWatched = '1';
      vd.addEventListener('error', function () {
        if (!vd.getAttribute('src')) return; /* unmount ke time ka load() yahan trigger hota hai */
        var slide = vd.closest('.pgv-slide');
        if (!slide || slide.querySelector('iframe')) return;
        var fbUrl = vd.dataset.fallback || '';
        if (!fbUrl) return;
        var fb = document.createElement('iframe');
        fb.setAttribute('data-src', fbUrl);
        fb.width = 640;
        fb.height = 360;
        fb.setAttribute('frameborder', '0');
        fb.setAttribute('allowfullscreen', '');
        fb.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
        fb.title = 'Dakshina Madhya Railway — Video';
        slide.appendChild(fb);
        vd.style.display = 'none';
        if (slide.classList.contains('is-active')) mountVideo(slide);
      });
    }

    function show(i) {
      idx = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var on = n === idx;
        s.classList.toggle('is-active', on);
        if (on) mountVideo(s); else unmountVideo(s);
      });
      preload(idx + 1);
      preload(idx + 2);
      if (dotsWrap) {
        dotsWrap.querySelectorAll('.pgv-dot').forEach(function (d, n) {
          d.classList.toggle('on', n === idx);
        });
      }
      if (countEl) countEl.textContent = idx + 1;
      if (typeEl) typeEl.textContent = slides[idx].dataset.type === 'video' ? 'Video' : 'Photo';
    }

    function userShow(i) {
      interacted = true;
      show(i);
    }

    /* Dots banao (ek har slide ke liye) */
    if (dotsWrap) {
      slides.forEach(function (_, n) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'pgv-dot' + (n === 0 ? ' on' : '');
        d.setAttribute('aria-label', 'Go to media ' + (n + 1));
        d.addEventListener('click', function () { userShow(n); });
        dotsWrap.appendChild(d);
      });
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { userShow(idx - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { userShow(idx + 1); });

    /* Keyboard arrows — sirf tab jab user gallery ke paas ho */
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); userShow(idx - 1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); userShow(idx + 1); }
    });
    box.tabIndex = 0;

    /* Touch swipe */
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) userShow(dx < 0 ? idx + 1 : idx - 1);
      x0 = null;
    }, { passive: true });

    /* Mount the video / first image only when the gallery is near. */
    watch(box, '200px', function () {
      if (started) return;
      started = true;
      if (!interacted) show(0);
      else {
        mountVideo(slides[idx]);
        preload(idx + 1);
        preload(idx + 2);
      }
    });
  });
})();

/* ============================================================
   DOWNLOAD MODAL — shows the file link inside a pop-up
   ============================================================ */
(function () {
  'use strict';

  var modal = document.getElementById('downloadModal');
  if (!modal) return;

  var titleEl = document.getElementById('dlModalTitle');
  var metaEl = document.getElementById('dlModalMeta');
  var linkEl = document.getElementById('dlModalLink');
  var lastFocus = null;

  function openModal(trigger) {
    lastFocus = trigger;
    if (titleEl) titleEl.textContent = trigger.getAttribute('data-dl-title') || 'Download';
    if (metaEl) metaEl.textContent = trigger.getAttribute('data-dl-meta') || '';
    if (linkEl) linkEl.setAttribute('href', trigger.getAttribute('data-dl-url') || '#');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    if (linkEl) linkEl.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest ? e.target.closest('[data-dl-open]') : null;
    if (trigger) {
      e.preventDefault();
      openModal(trigger);
      return;
    }
    if ((e.target.closest && e.target.closest('[data-dl-close]')) || e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });
})();

/* ============================================================
   SITE PROTECTION — right-click + Developer Tools shortcuts
   (Ye code har page pe main.js ke through lagta hai)
   ============================================================ */
(function () {
  'use strict';

  /* Right-click (context menu) block — mouse aur touch dono */
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    return false;
  });

  /* DevTools aur source-view shortcuts block */
  document.addEventListener('keydown', function (e) {
    var k = e.key || '';
    var ctrl = e.ctrlKey || e.metaKey;
    var shift = e.shiftKey;

    /* F12 */
    if (k === 'F12') { e.preventDefault(); return false; }

    /* Ctrl+Shift+I / J / C / K — DevTools */
    if (ctrl && shift && ['i', 'j', 'c', 'k'].indexOf(k.toLowerCase()) > -1) {
      e.preventDefault(); return false;
    }

    /* Ctrl+U — view source, Ctrl+S — page save */
    if (ctrl && !shift && ['u', 's'].indexOf(k.toLowerCase()) > -1) {
      e.preventDefault(); return false;
    }

    /* Alt+Ctrl+I / J (kuch browsers me DevTools) */
    if (e.altKey && ctrl && ['i', 'j'].indexOf(k.toLowerCase()) > -1) {
      e.preventDefault(); return false;
    }
  });
})();
