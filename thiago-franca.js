(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  if (!header) return;

  var threshold = 40;

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('is-scrolled', y > threshold);
  }

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

(function () {
  'use strict';

  var hero = document.querySelector('#home.hero--fold');
  var shatter = hero && hero.querySelector('.hero-shatter');
  var pin = shatter && shatter.querySelector('.hero-shatter-pin');
  var stage = shatter && shatter.querySelector('.hero-shatter-stage');
  var live = shatter && shatter.querySelector('.hero-shatter-live');
  var blinds = shatter && shatter.querySelector('.hero-blinds');
  if (!hero || !shatter || !pin || !stage || !live || !blinds) return;

  var STRIPS = 4;
  var EXTRA_VH = 1.05;
  /* Resto da página entra quando a animação chega a ~20% */
  var REVEAL_AT = 0.2;
  var desktopMq = window.matchMedia('(min-width: 901px)');
  var stripEls = [];
  var ticking = false;
  var active = false;
  var lastSnap = 0;
  var fullRun = 0;
  var stickyRun = 0;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isDesktop() {
    return desktopMq.matches;
  }

  function clamp(n, a, b) {
    return Math.min(b, Math.max(a, n));
  }

  function easeInOut(t) {
    return t * t * (3 - 2 * t);
  }

  function clearShatter() {
    shatter.style.height = '';
    pin.style.height = '';
    stage.style.height = '';
    blinds.style.gap = '';
    live.classList.remove('is-under');
    blinds.classList.remove('is-active');
    active = false;
    stripEls.forEach(function (item) {
      item.blind.style.transform = '';
    });
  }

  function measureAndSize() {
    if (!isDesktop() || prefersReducedMotion()) {
      clearShatter();
      return;
    }

    var wasActive = active;
    if (wasActive) {
      live.classList.remove('is-under');
      blinds.classList.remove('is-active');
    }

    var liveH = Math.max(1, live.offsetHeight);
    fullRun = Math.round(window.innerHeight * EXTRA_VH);
    stickyRun = Math.round(fullRun * REVEAL_AT);
    /* Sticky só até 20% da corrida → a 2ª dobra já aparece nesse ponto */
    shatter.style.height = liveH + stickyRun + 'px';
    pin.style.height = liveH + 'px';
    stage.style.height = liveH + 'px';

    stripEls.forEach(function (item, i) {
      item.inner.style.height = liveH + 'px';
      item.inner.style.top = -(i * (liveH / STRIPS)) + 'px';
    });

    if (wasActive) {
      live.classList.add('is-under');
      blinds.classList.add('is-active');
    }
  }

  function buildStrips() {
    blinds.innerHTML = '';
    stripEls = [];

    for (var i = 0; i < STRIPS; i += 1) {
      var blind = document.createElement('div');
      blind.className = 'hero-blind';
      blind.style.setProperty('--blind-i', String(i));

      var inner = document.createElement('div');
      inner.className = 'hero-blind-inner';

      blind.appendChild(inner);
      blinds.appendChild(blind);
      stripEls.push({ blind: blind, inner: inner, index: i });
    }
  }

  function snapshotToStrips() {
    var liveH = Math.max(1, live.offsetHeight);
    stripEls.forEach(function (item, i) {
      while (item.inner.firstChild) item.inner.removeChild(item.inner.firstChild);
      var clone = live.cloneNode(true);
      clone.classList.remove('is-under');
      item.inner.style.height = liveH + 'px';
      item.inner.style.top = -(i * (liveH / STRIPS)) + 'px';
      item.inner.appendChild(clone);
    });
    lastSnap = Date.now();
  }

  function setStripProgress(p) {
    /* frestas verticais leves entre os blocos → preto do stage */
    blinds.style.gap = (p * 10).toFixed(2) + 'px';

    stripEls.forEach(function (item, i) {
      var start = i * 0.08;
      var local = clamp((p - start) / 0.7, 0, 1);
      local = easeInOut(local);
      var dir = i % 2 === 0 ? -1 : 1;
      var x = dir * local * 110;
      item.blind.style.transform = 'translate3d(' + x.toFixed(2) + '%,0,0)';
    });
  }

  function progress() {
    if (fullRun <= 1) return 0;
    var scrolled = -shatter.getBoundingClientRect().top;

    /* Durante o sticky: 0 → 20% da animação */
    if (scrolled <= stickyRun) {
      return clamp(scrolled / fullRun, 0, REVEAL_AT);
    }

    /* Depois: 2ª dobra já entra; completa os 80% restantes ao sair o hero */
    var leave = clamp(
      -pin.getBoundingClientRect().top / Math.max(pin.offsetHeight * 0.4, 1),
      0,
      1
    );
    return clamp(REVEAL_AT + leave * (1 - REVEAL_AT), 0, 1);
  }

  function update() {
    ticking = false;
    if (!isDesktop() || prefersReducedMotion()) {
      clearShatter();
      return;
    }

    var p = progress();

    if (p > 0.012) {
      if (!active) {
        snapshotToStrips();
        live.classList.add('is-under');
        blinds.classList.add('is-active');
        active = true;
      }
      setStripProgress(p);
    } else if (active) {
      setStripProgress(0);
      live.classList.remove('is-under');
      blinds.classList.remove('is-active');
      active = false;
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  buildStrips();
  measureAndSize();
  setStripProgress(0);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () {
    measureAndSize();
    if (isDesktop() && active) {
      snapshotToStrips();
      setStripProgress(progress());
    }
  });

  function onBreakpointChange() {
    measureAndSize();
    update();
  }

  if (desktopMq.addEventListener) {
    desktopMq.addEventListener('change', onBreakpointChange);
  } else if (desktopMq.addListener) {
    desktopMq.addListener(onBreakpointChange);
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      measureAndSize();
      update();
    });
  }

  update();
})();

(function () {
  'use strict';

  /**
   * Reveal por máscara (Webflow-style) — reutilizável.
   * @param {Object} [options]
   * @param {ParentNode} [options.root]
   * @param {string} [options.textSelector]
   * @param {string} [options.afterSelector]
   * @param {number} [options.delay] delay inicial em segundos
   * @param {number} [options.duration]
   * @param {number} [options.stagger]
   * @param {number} [options.afterDelay] atraso após o texto principal
   */
  function animateHeroReveal(options) {
    var opts = options || {};
    var root = opts.root || document;
    var textSelector = opts.textSelector || '[data-hero-reveal]';
    var afterSelector = opts.afterSelector || '[data-hero-reveal-after]';
    var delay = opts.delay != null ? opts.delay : 0.28;
    var duration = opts.duration != null ? opts.duration : 1.05;
    var stagger = opts.stagger != null ? opts.stagger : 0.04;
    var afterDelay = opts.afterDelay != null ? opts.afterDelay : 0.2;
    var ease = opts.ease || 'expo.out';

    var textEls = Array.prototype.slice.call(root.querySelectorAll(textSelector));
    var afterEls = Array.prototype.slice.call(root.querySelectorAll(afterSelector));

    if (!textEls.length && !afterEls.length) return null;

    function showAll() {
      textEls.forEach(function (el) {
        el.classList.add('is-hero-ready');
        el.style.transform = '';
      });
      afterEls.forEach(function (el) {
        el.classList.add('is-hero-ready');
        el.style.opacity = '';
        el.style.transform = '';
      });
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showAll();
      return null;
    }

    if (typeof gsap === 'undefined') {
      showAll();
      return null;
    }

    var tl = gsap.timeline({ defaults: { ease: ease } });

    /* Elementos do hero (foto, grade, laterais, marquee) — juntos, só opacity
       (evita quebrar translateX das rails / scale da foto no mobile) */
    if (afterEls.length) {
      afterEls.forEach(function (el) {
        el.classList.add('is-hero-ready');
      });
      gsap.set(afterEls, { opacity: 0 });
      tl.to(
        afterEls,
        {
          opacity: 1,
          duration: 0.9,
          stagger: 0.04
        },
        delay
      );
    }

    /* THIAGO em seguida (desktop e mobile) */
    var textStart = delay + 0.5;

    textEls.forEach(function (el) {
      var targets = [el];

      if (typeof SplitType !== 'undefined') {
        var split = new SplitType(el, { types: 'chars', tagName: 'span' });
        if (split.chars && split.chars.length) {
          targets = split.chars;
        }
      }

      gsap.set(targets, { yPercent: 110, scale: 1.05, force3D: true });
      el.classList.add('is-hero-ready');

      tl.to(
        targets,
        {
          yPercent: 0,
          scale: 1,
          duration: duration,
          stagger: stagger,
          force3D: true
        },
        textStart
      );
    });

    return tl;
  }

  window.animateHeroReveal = animateHeroReveal;

  function bootHeroReveal() {
    var home = document.querySelector('#home.hero--fold');
    if (!home) return;

    var live = home.querySelector('.hero-shatter-live') || home;

    function run() {
      animateHeroReveal({ root: live });
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run).catch(run);
    } else {
      window.addEventListener('load', run);
      run();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootHeroReveal);
  } else {
    bootHeroReveal();
  }
})();

(function () {
  'use strict';

  var desktopMq = window.matchMedia('(min-width: 901px)');
  var liveRoot = document.querySelector('#home .hero-shatter-live') || document;
  var tracks = Array.prototype.slice.call(liveRoot.querySelectorAll('.hero-fold-ticker-track'));
  if (!tracks.length) return;

  var SPEED = 48; /* px/s */
  var rafId = 0;
  var lastTs = 0;
  var states = [];

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getGap(group) {
    var styles = window.getComputedStyle(group);
    return parseFloat(styles.columnGap || styles.gap) || 12;
  }

  /* Duplica o ciclo até a faixa ficar cheia (sem buraco branco) */
  function fillTrack(track) {
    var viewport = track.parentElement;
    var groups = Array.prototype.slice.call(track.querySelectorAll('.hero-fold-ticker-group'));
    if (!groups.length || !viewport) return 0;

    var template = groups[0].cloneNode(true);
    template.removeAttribute('aria-hidden');

    while (track.firstChild) track.removeChild(track.firstChild);

    var seed = template.cloneNode(true);
    track.appendChild(seed);

    var gap = getGap(seed);
    seed.style.margin = '0';
    seed.style.marginRight = gap + 'px';
    seed.style.padding = '0';

    var cycle = Math.round(seed.getBoundingClientRect().width + gap);
    if (cycle <= 0) return 0;

    var need = viewport.clientWidth * 2 + cycle;
    while (track.scrollWidth < need) {
      var clone = template.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.style.margin = '0';
      clone.style.marginRight = gap + 'px';
      clone.style.padding = '0';
      track.appendChild(clone);
    }

    return cycle;
  }

  function setup() {
    states = tracks.map(function (track) {
      var shift = fillTrack(track);
      var reverse = track.classList.contains('hero-fold-ticker-track--rev');
      return {
        track: track,
        shift: shift,
        reverse: reverse,
        x: reverse && shift ? -shift : 0
      };
    });

    states.forEach(function (s) {
      s.track.style.transform = 'translate3d(' + s.x + 'px,0,0)';
    });
  }

  function tick(ts) {
    if (!desktopMq.matches || prefersReducedMotion()) {
      rafId = 0;
      return;
    }

    if (!lastTs) lastTs = ts;
    var dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    states.forEach(function (s) {
      if (!s.shift) return;
      if (s.reverse) {
        s.x += SPEED * dt;
        while (s.x >= 0) s.x -= s.shift;
      } else {
        s.x -= SPEED * dt;
        while (s.x <= -s.shift) s.x += s.shift;
      }
      s.track.style.transform = 'translate3d(' + s.x.toFixed(2) + 'px,0,0)';
    });

    rafId = window.requestAnimationFrame(tick);
  }

  function start() {
    if (!desktopMq.matches || prefersReducedMotion()) {
      tracks.forEach(function (track) {
        track.style.transform = 'translate3d(0,0,0)';
      });
      return;
    }
    setup();
    lastTs = 0;
    if (!rafId) rafId = window.requestAnimationFrame(tick);
  }

  function stop() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    lastTs = 0;
  }

  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      stop();
      start();
    }, 120);
  });

  if (desktopMq.addEventListener) {
    desktopMq.addEventListener('change', function () {
      stop();
      start();
    });
  } else if (desktopMq.addListener) {
    desktopMq.addListener(function () {
      stop();
      start();
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    window.addEventListener('load', start);
    start();
  }
})();

(function () {
  'use strict';

  var root = document.querySelector('#call-me');
  if (!root) return;

  var items = Array.prototype.slice.call(root.querySelectorAll('.call-me-item'));
  if (!items.length) return;

  function setOpen(item, open) {
    var trigger = item.querySelector('.call-me-trigger');
    var panel = item.querySelector('.call-me-panel');
    if (!trigger || !panel) return;

    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    item.classList.toggle('is-open', open);
    if (open) {
      panel.removeAttribute('hidden');
    } else {
      panel.setAttribute('hidden', '');
    }
  }

  items.forEach(function (item) {
    var trigger = item.querySelector('.call-me-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function () {
      var isOpen = trigger.getAttribute('aria-expanded') === 'true';
      items.forEach(function (other) {
        setOpen(other, false);
      });
      if (!isOpen) {
        setOpen(item, true);
      }
    });
  });
})();
