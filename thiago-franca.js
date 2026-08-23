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

  var section = document.querySelector('#home.hero--fold');
  if (!section) return;

  var live = section.querySelector('.hero-shatter-live') || section;
  var targets = Array.prototype.slice.call(live.querySelectorAll('.hero-type[data-type-text]'));
  var cursorEl = live.querySelector('.hero-type-cursor');
  if (!targets.length) return;

  var runId = 0;
  var timers = [];

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function clearTimers() {
    timers.forEach(function (id) {
      window.clearTimeout(id);
    });
    timers = [];
  }

  function later(fn, ms) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function delayForIndex(i, len) {
    if (len <= 1) return 90;
    var t = i / (len - 1);
    return 52 + 48 * Math.sin(Math.PI * t);
  }

  function resetAll() {
    clearTimers();
    targets.forEach(function (el) {
      el.textContent = '';
    });
    if (cursorEl) {
      cursorEl.classList.remove('is-done');
    }
  }

  function typeOne(el, text, onDone, activeRun) {
    var i = 0;
    var len = text.length;

    function tick() {
      if (activeRun !== runId) return;
      if (i >= len) {
        onDone();
        return;
      }
      el.textContent += text.charAt(i);
      i += 1;
      if (i < len) {
        later(tick, delayForIndex(i, len));
      } else {
        onDone();
      }
    }

    tick();
  }

  function runSequence() {
    runId += 1;
    var activeRun = runId;
    resetAll();

    if (prefersReducedMotion()) {
      targets.forEach(function (el) {
        el.textContent = el.getAttribute('data-type-text') || '';
      });
      if (cursorEl) cursorEl.classList.add('is-done');
      return;
    }

    if (cursorEl) cursorEl.classList.remove('is-done');

    var pending = targets.length;

    function finishAll() {
      later(function () {
        if (activeRun !== runId) return;
        if (cursorEl) cursorEl.classList.add('is-done');
      }, 700);
    }

    later(function () {
      if (activeRun !== runId) return;
      targets.forEach(function (el) {
        var text = el.getAttribute('data-type-text') || '';
        typeOne(el, text, function () {
          pending -= 1;
          if (pending <= 0) finishAll();
        }, activeRun);
      });
    }, 420);
  }

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runSequence();
        } else {
          runId += 1;
          resetAll();
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -4% 0px' }
  );

  io.observe(section);
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

  var section = document.querySelector('#story');
  var title = section && section.querySelector('.story-fold-title');
  if (!section || !title) return;

  var animRoot = title.querySelector('.story-fold-title-anim') || title;
  var accent = animRoot.querySelector('.story-fold-accent');
  var underline = animRoot.querySelector('.story-fold-underline');
  var sub = section.querySelector('.story-fold-sub');
  var cta = section.querySelector('.story-fold-cta');
  var mobileMq = window.matchMedia('(max-width: 900px)');
  var ticking = false;
  var chars = [];
  var subChars = [];
  var marcaChars = [];
  var historiaChars = [];
  /* Atraso leve do subtítulo em relação ao título (progresso 0–1) */
  var SUB_DELAY = 0.09;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function wrapTextNodes(root) {
    var index = 0;
    var list = [];

    function walk(node) {
      if (!node) return;

      if (node.nodeType === 3) {
        var parent = node.parentNode;
        if (!parent) return;

        /* Colapsa indentação/HTML whitespace — sem alterar o layout tipográfico */
        var raw = (node.textContent || '').replace(/\s+/g, ' ');

        /* Espaço só entre as linhas do título: remove */
        if (raw === ' ' && parent === root) {
          parent.removeChild(node);
          return;
        }

        if (!node.previousSibling) raw = raw.replace(/^\s+/, '');
        if (
          !node.nextSibling ||
          (node.nextSibling.nodeType === 1 && node.nextSibling.tagName === 'SVG')
        ) {
          raw = raw.replace(/\s+$/, '');
        }

        /* Mantém o espaço entre "TODA " e MARCA / "UMA " e HISTÓRIA */
        if (
          node.nextSibling &&
          node.nextSibling.nodeType === 1 &&
          (node.nextSibling.classList.contains('story-fold-accent') ||
            node.nextSibling.classList.contains('story-fold-historia'))
        ) {
          if (raw.length && raw.charAt(raw.length - 1) !== ' ') raw += ' ';
        }

        if (!raw.length) {
          parent.removeChild(node);
          return;
        }

        var frag = document.createDocumentFragment();
        for (var i = 0; i < raw.length; i += 1) {
          var ch = raw.charAt(i);
          var span = document.createElement('span');
          span.className = 'story-char';
          span.setAttribute('data-i', String(index));
          span.textContent = ch;
          frag.appendChild(span);
          list.push(span);
          index += 1;
        }
        parent.replaceChild(frag, node);
        return;
      }

      if (node.nodeType !== 1) return;
      if (node.tagName === 'SVG' || node.classList.contains('story-fold-underline')) return;

      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(walk);
    }

    walk(root);
    return list;
  }

  function revealAmount(progress) {
    /* 0→1 ao entrar; permanece completo enquanto a seção estiver na tela */
    var enterEnd = 0.32;
    if (progress <= 0) return 0;
    if (progress < enterEnd) return progress / enterEnd;
    return 1;
  }

  function isSectionOnScreen() {
    var rect = section.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    return rect.bottom > 0 && rect.top < vh;
  }

  function sectionProgress() {
    var rect = section.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    /*
      Desktop: meio termo (~metade da viewport).
      Mobile: um pouco antes, para textos e botão entrarem mais cedo.
    */
    var startAt = mobileMq.matches ? vh * 0.68 : vh * 0.52;
    var endAt = -rect.height + (mobileMq.matches ? vh * 0.18 : vh * 0.15);
    var range = startAt - endAt;
    if (range <= 0) return rect.top <= startAt ? 1 : 0;
    return Math.min(1, Math.max(0, (startAt - rect.top) / range));
  }

  function applyRevealTo(list, amount) {
    var total = list.length;
    var count = prefersReducedMotion()
      ? total
      : Math.round(amount * total);

    list.forEach(function (el, i) {
      if (i < count) el.classList.add('is-on');
      else el.classList.remove('is-on');
    });
  }

  var holdComplete = false;

  function applyReveal(amount, subAmount) {
    applyRevealTo(chars, amount);
    applyRevealTo(subChars, subAmount);

    if (underline && historiaChars.length) {
      var histOn = 0;
      historiaChars.forEach(function (el) {
        if (el.classList.contains('is-on')) histOn += 1;
      });
      var u = histOn / historiaChars.length;
      underline.style.setProperty('--underline-opacity', String(u));
    }

    /* Mobile: botão no meio da animação do título */
    if (cta) {
      if (!mobileMq.matches) {
        cta.classList.remove('is-revealed');
      } else {
        var showCta = prefersReducedMotion() ? amount > 0 : amount >= 0.5;
        cta.classList.toggle('is-revealed', showCta);
      }
    }
  }

  function update() {
    ticking = false;

    /* Fora da tela: desfaz; na tela: mantém o texto depois de completo */
    if (!isSectionOnScreen()) {
      holdComplete = false;
      applyReveal(0, 0);
      return;
    }

    if (holdComplete) {
      applyReveal(1, 1);
      return;
    }

    var progress = sectionProgress();
    var amount = revealAmount(progress);
    var subAmount = revealAmount(Math.max(0, progress - SUB_DELAY));
    if (amount >= 1 && subAmount >= 1) holdComplete = true;
    applyReveal(amount, subAmount);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  chars = wrapTextNodes(animRoot);
  if (sub) subChars = wrapTextNodes(sub);
  if (accent) {
    marcaChars = Array.prototype.slice.call(accent.querySelectorAll('.story-char'));
  }
  var historia = animRoot.querySelector('.story-fold-historia');
  if (historia) {
    historiaChars = Array.prototype.slice.call(historia.querySelectorAll('.story-char'));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
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
