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

  var MASK_MS = 1000;
  var COPY_MS = 300;
  var COPY_LEAD_MS = 200;
  var EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

  var hero = document.querySelector('#home.hero--fold');
  var story = document.querySelector('#story');
  var overlay = document.getElementById('fold-wipe');
  var inner = story && story.querySelector('.story-fold-inner');
  if (!hero || !story || !overlay || !inner) return;

  var home = document.getElementById('home');
  var playing = false;
  var entered = false;
  var navLock = false;
  var navLockTimer = 0;
  var touchY = 0;
  var finishTimer = 0;
  var copyTimer = 0;
  var placeholder = null;
  var mobileMq = window.matchMedia('(max-width: 900px)');

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isMobileViewport() {
    return mobileMq.matches;
  }

  function skipWipe() {
    return prefersReducedMotion() || isMobileViewport();
  }

  function atHeroTop() {
    return (window.scrollY || document.documentElement.scrollTop) <= 4;
  }

  function lockScroll() {
    document.documentElement.classList.add('is-fold-wipe-lock');
  }

  function unlockScroll() {
    document.documentElement.classList.remove('is-fold-wipe-lock');
  }

  function revealStoryCopy() {
    story.querySelectorAll('.reveal-title').forEach(function (el) {
      el.classList.add('is-visible');
    });
    inner.classList.remove('is-wipe-enter');
    inner.classList.add('is-wipe-in');
  }

  function restoreStory() {
    if (placeholder && placeholder.parentNode) {
      placeholder.parentNode.insertBefore(story, placeholder);
      placeholder.parentNode.removeChild(placeholder);
    }
    placeholder = null;
    inner.classList.remove('is-wipe-enter', 'is-wipe-in');
  }

  function jumpToTarget(el) {
    if (!el) return;
    var html = document.documentElement;
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    var y = Math.round(el.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0));
    html.scrollTop = y;
    if (document.body) document.body.scrollTop = y;
    window.scrollTo(0, y);
    html.style.scrollBehavior = prev;
  }

  function jumpToStory() {
    jumpToTarget(placeholder || story);
  }

  function teardownOverlay() {
    overlay.classList.remove('is-opening', 'is-active');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.transition = 'none';
    overlay.style.clipPath = '';
    overlay.style.webkitClipPath = '';
    window.setTimeout(function () {
      overlay.style.transition = '';
    }, 40);
    hero.classList.remove('is-wipe-dim');
  }

  function abortWipe() {
    if (!playing) return;
    playing = false;
    window.clearTimeout(finishTimer);
    window.clearTimeout(copyTimer);
    unlockScroll();
    restoreStory();
    teardownOverlay();
  }

  function finish() {
    if (!playing) return;
    playing = false;
    entered = true;
    window.clearTimeout(finishTimer);
    window.clearTimeout(copyTimer);
    unlockScroll();
    jumpToStory();
    restoreStory();
    teardownOverlay();
  }

  function play() {
    if (playing || skipWipe()) return;
    if (!atHeroTop()) return;

    playing = true;
    entered = false;
    lockScroll();
    window.scrollTo(0, 0);

    placeholder = document.createElement('div');
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.height = story.offsetHeight + 'px';
    story.parentNode.insertBefore(placeholder, story);

    inner.classList.remove('is-wipe-in');
    inner.classList.add('is-wipe-enter');

    overlay.appendChild(story);
    overlay.setAttribute('aria-hidden', 'false');
    overlay.style.transition = 'none';
    overlay.style.clipPath = 'inset(100% 0 0 0)';
    overlay.style.webkitClipPath = 'inset(100% 0 0 0)';
    overlay.classList.add('is-active');
    overlay.classList.remove('is-opening');

    hero.classList.remove('is-wipe-dim');
    void overlay.offsetWidth;

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        overlay.style.transition =
          'clip-path ' + MASK_MS + 'ms ' + EASE + ', -webkit-clip-path ' + MASK_MS + 'ms ' + EASE;
        overlay.classList.add('is-opening');
        overlay.style.clipPath = 'inset(0% 0 0 0)';
        overlay.style.webkitClipPath = 'inset(0% 0 0 0)';
        hero.classList.add('is-wipe-dim');
      });
    });

    copyTimer = window.setTimeout(revealStoryCopy, Math.max(0, MASK_MS - COPY_LEAD_MS));
    finishTimer = window.setTimeout(finish, MASK_MS + 40);
  }

  function shouldCaptureDown() {
    if (isMobileViewport() && !playing) return false;
    if (playing) return true;
    if (entered) return false;
    if (skipWipe()) return false;
    return atHeroTop();
  }

  function onWheel(e) {
    if (!shouldCaptureDown()) return;
    if (e.deltaY <= 0) return;
    e.preventDefault();
    play();
  }

  function onTouchStart(e) {
    if (!e.touches || !e.touches.length) return;
    touchY = e.touches[0].clientY;
  }

  function onTouchMove(e) {
    if (!shouldCaptureDown()) return;
    if (!e.touches || !e.touches.length) return;
    var dy = touchY - e.touches[0].clientY;
    if (dy < 10) return;
    e.preventDefault();
    play();
  }

  function onKeyDown(e) {
    if (!shouldCaptureDown()) return;
    var keys = ['ArrowDown', 'PageDown', ' ', 'Spacebar'];
    if (keys.indexOf(e.key) === -1) return;
    e.preventDefault();
    play();
  }

  function onScroll() {
    if (navLock) return;
    if (isMobileViewport() && !playing) return;
    if (playing) {
      if ((window.scrollY || document.documentElement.scrollTop) > 0) {
        window.scrollTo(0, 0);
      }
      return;
    }
    var y = window.scrollY || document.documentElement.scrollTop;
    if (y <= 4) {
      entered = false;
      return;
    }
    if (skipWipe()) return;
    if (!entered && y > 4 && y < (home ? home.offsetHeight * 0.55 : 400)) {
      window.scrollTo(0, 0);
      play();
    }
  }

  function onViewportChange() {
    if (isMobileViewport() && playing) finish();
  }

  overlay.addEventListener('transitionend', function (e) {
    if (!playing) return;
    if (e.target !== overlay) return;
    if (e.propertyName && e.propertyName.indexOf('clip-path') === -1) return;
    finish();
  });

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('scroll', onScroll, { passive: true });
  if (mobileMq.addEventListener) {
    mobileMq.addEventListener('change', onViewportChange);
  } else if (mobileMq.addListener) {
    mobileMq.addListener(onViewportChange);
  }

  function allowNavPastHero() {
    entered = true;
    navLock = true;
    window.clearTimeout(navLockTimer);
    abortWipe();
    navLockTimer = window.setTimeout(function () {
      navLock = false;
    }, 1400);
  }

  function jumpToContact() {
    var target = document.getElementById('contact');
    if (!target) return;
    allowNavPastHero();
    var html = document.documentElement;
    var prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    var headerEl = document.querySelector('.site-header');
    var headerH = headerEl ? headerEl.getBoundingClientRect().height : 0;
    var y = Math.round(
      target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0) - headerH
    );
    if (y < 0) y = 0;
    html.scrollTop = y;
    if (document.body) document.body.scrollTop = y;
    window.scrollTo(0, y);
    html.style.scrollBehavior = prev;
    if (history.replaceState) {
      history.replaceState(null, '', '#contact');
    } else {
      location.hash = 'contact';
    }
  }

  document.querySelectorAll('a[href="#contact"]').forEach(function (link) {
    link.addEventListener(
      'click',
      function (e) {
        e.preventDefault();
        e.stopPropagation();
        jumpToContact();
      },
      true
    );
  });

  if (location.hash === '#contact') {
    jumpToContact();
  }
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

(function () {
  'use strict';

  var STORY_ROTATOR_WORDS = [
    'UMA HISTÓRIA.',
    'UM SONHO.',
    'UM PROPÓSITO.',
    'UMA JORNADA.',
    'UMA ESSÊNCIA.',
    'UMA EXPERIÊNCIA.',
    'UMA CONQUISTA.',
    'UMA IDENTIDADE.'
  ];

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function splitCharsManual(el) {
    var text = el.textContent || '';
    el.textContent = '';
    var chars = [];

    Array.prototype.forEach.call(text, function (ch) {
      var span = document.createElement('span');
      span.className = 'char';
      if (ch === ' ' || ch === '\u00A0') {
        span.className += ' letter-split-space';
        span.textContent = '\u00A0';
      } else {
        span.textContent = ch;
      }
      el.appendChild(span);
      chars.push(span);
    });

    return chars;
  }

  function splitChars(el) {
    return splitCharsManual(el);
  }

  function measureLongestWidth(el, words) {
    var probe = el.cloneNode(false);
    probe.style.cssText =
      'position:absolute;left:-9999px;top:0;visibility:hidden;display:inline-block;white-space:nowrap;width:auto;min-width:0;';
    (el.parentNode || document.body).appendChild(probe);
    var max = 0;
    words.forEach(function (word) {
      probe.textContent = word;
      max = Math.max(max, probe.offsetWidth);
    });
    probe.parentNode.removeChild(probe);
    return Math.ceil(max);
  }

  function lockRotatorSize(el, words) {
    var width = measureLongestWidth(el, words);
    if (width > 0) {
      el.style.minWidth = width + 'px';
    }
    el.style.minHeight = '1em';
  }

  function whenTitleRevealDone(el, callback) {
    var title = el.closest('.reveal-title');

    function finishWait() {
      if (!title) {
        callback();
        return;
      }

      var words = title.querySelectorAll('.reveal-title-word');
      var last = words.length ? words[words.length - 1] : null;
      var styles = getComputedStyle(title);
      var staggerMs = parseFloat(styles.getPropertyValue('--reveal-title-stagger')) || 100;
      var delayMs = parseFloat(styles.getPropertyValue('--reveal-title-delay')) || 0;
      var durMs = 900;
      var lastIndex = words.length ? words.length - 1 : 0;

      if (last) {
        var rawIndex = last.style.getPropertyValue('--word-i');
        if (!rawIndex) {
          rawIndex = getComputedStyle(last).getPropertyValue('--word-i');
        }
        var parsedIndex = parseInt(rawIndex, 10);
        if (!isNaN(parsedIndex)) lastIndex = parsedIndex;

        var durStr = getComputedStyle(last).transitionDuration || '';
        var durVal = parseFloat(durStr);
        if (!isNaN(durVal) && durVal > 0) {
          durMs = durStr.indexOf('ms') > -1 ? durVal : durVal * 1000;
        }
      }

      window.setTimeout(callback, delayMs + lastIndex * staggerMs + durMs + 80);
    }

    if (!title || prefersReducedMotion()) {
      callback();
      return;
    }

    if (title.classList.contains('is-visible')) {
      var revealed = title.querySelectorAll('.reveal-title-word');
      var lastWord = revealed.length ? revealed[revealed.length - 1] : null;
      if (lastWord && getComputedStyle(lastWord).opacity === '1') {
        callback();
        return;
      }
      finishWait();
      return;
    }

    var mo = new MutationObserver(function () {
      if (title.classList.contains('is-visible')) {
        mo.disconnect();
        finishWait();
      }
    });
    mo.observe(title, { attributes: true, attributeFilter: ['class'] });
  }

  function initRotatingTextEffect(selector, wordsArray, intervalMs) {
    if (!selector) return;

    var words = (wordsArray && wordsArray.length ? wordsArray : STORY_ROTATOR_WORDS).slice();
    var holdMs = intervalMs == null ? 2000 : intervalMs;
    var nodes = document.querySelectorAll(selector);
    if (!nodes.length) return;

    if (prefersReducedMotion() || typeof gsap === 'undefined') {
      return;
    }

    Array.prototype.forEach.call(nodes, function (el) {
      if (el.dataset.rotatorReady === '1') return;
      el.dataset.rotatorReady = '1';

      var index = 0;
      var currentChars = [];
      var holdTimer = 0;
      var swapTimer = 0;
      var animTween = null;
      var rotating = false;

      function killHold() {
        if (holdTimer) {
          window.clearTimeout(holdTimer);
          holdTimer = 0;
        }
      }

      function killSwap() {
        if (swapTimer) {
          window.clearTimeout(swapTimer);
          swapTimer = 0;
        }
      }

      function setPhraseChars(text, visible) {
        el.textContent = text;
        currentChars = splitChars(el);
        currentChars.forEach(function (char) {
          var isSpace = char.classList.contains('letter-split-space');
          gsap.set(char, {
            opacity: visible ? 1 : 0,
            x: 0,
            y: visible ? 0 : 18,
            rotation: visible || isSpace ? 0 : gsap.utils.random(-12, 12),
            display: 'inline-block'
          });
        });
        return currentChars;
      }

      function playChars(chars, vars, staggerEach) {
        var tl = gsap.timeline();
        chars.forEach(function (char, i) {
          var isSpace = char.classList.contains('letter-split-space');
          tl.to(
            char,
            {
              opacity: vars.opacity,
              y: vars.y,
              rotation: isSpace ? 0 : vars.rotateTo == null ? gsap.utils.random(-12, 12) : vars.rotateTo,
              duration: vars.duration,
              ease: vars.ease,
              force3D: true
            },
            i * staggerEach
          );
        });
        return tl;
      }

      function scheduleNext() {
        killHold();
        if (document.hidden || rotating) return;
        holdTimer = window.setTimeout(rotateToNext, holdMs);
      }

      function rotateToNext() {
        if (document.hidden || rotating) return;
        rotating = true;
        var nextIndex = (index + 1) % words.length;

        if (!currentChars.length) {
          setPhraseChars(words[index], true);
        }

        if (animTween) animTween.kill();
        killSwap();

        var outTime = (0.45 + Math.max(0, currentChars.length - 1) * 0.022 + 0.05) * 1000;
        var swapped = false;

        function swapIn() {
          if (swapped) return;
          swapped = true;
          index = nextIndex;
          try {
            setPhraseChars(words[index], false);
            animTween = playChars(
              currentChars,
              { opacity: 1, y: 0, rotateTo: 0, duration: 0.7, ease: 'expo.out' },
              0.03
            );
          } catch (err) {
            el.textContent = words[index];
          }
          var inTime = (0.7 + Math.max(0, currentChars.length - 1) * 0.03 + 0.05) * 1000;
          window.setTimeout(function () {
            rotating = false;
            animTween = null;
            scheduleNext();
          }, inTime);
        }

        swapTimer = window.setTimeout(swapIn, outTime);
        try {
          animTween = playChars(
            currentChars,
            { opacity: 0, y: -16, duration: 0.45, ease: 'power3.in' },
            0.022
          );
        } catch (err) {
          swapIn();
        }
      }

      function onVisibility() {
        if (document.hidden) {
          killHold();
          return;
        }
        if (!rotating) scheduleNext();
      }

      function startRotator() {
        lockRotatorSize(el, words);
        document.addEventListener('visibilitychange', onVisibility);
        scheduleNext();
      }

      function prepare() {
        lockRotatorSize(el, words);
        whenTitleRevealDone(el, startRotator);
      }

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(prepare).catch(prepare);
      } else {
        prepare();
      }

      window.addEventListener(
        'resize',
        function () {
          lockRotatorSize(el, words);
        },
        { passive: true }
      );
    });
  }

  window.initRotatingTextEffect = initRotatingTextEffect;

  function bootRotatingText() {
    initRotatingTextEffect('.story-fold-historia', STORY_ROTATOR_WORDS, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootRotatingText);
  } else {
    bootRotatingText();
  }
})();

