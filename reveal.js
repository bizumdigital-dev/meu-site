(function () {
  'use strict';

  function collectRevealTargets(section) {
    var id = section.id;
    var list = [];

    if (id === 'home') {
      /* Typewriter da nova dobra cuida da animação — sem reveal em cascata */
      return list;
    }

    if (id === 'works') {
      section.querySelectorAll('.works-head-titles > *').forEach(function (el) {
        if (el.classList.contains('reveal-title')) return;
        list.push(el);
      });
      var seeAll = section.querySelector('.works-see-all');
      if (seeAll) list.push(seeAll);
      var lede = section.querySelector('.works-lede');
      if (lede) list.push(lede);
      section.querySelectorAll('.works-card').forEach(function (el) {
        list.push(el);
      });
      return list;
    }

    if (id === 'call-me') {
      /* Mesmo cascade dos textos de apoio de #contact (js-reveal + stagger) */
      section.querySelectorAll('.call-me-item').forEach(function (el) {
        list.push(el);
      });
      return list;
    }

    if (id === 'contact') {
      var photo = section.querySelector('.contact-photo');
      if (photo) list.push(photo);
      section.querySelectorAll('.contact-col--bio > *').forEach(function (el) {
        list.push(el);
      });
      return list;
    }

    if (id === 'produto') {
      var copy = section.querySelector('.hero-copy');
      if (copy) {
        Array.prototype.forEach.call(copy.children, function (ch) {
          if (ch.matches && ch.matches('ul.hero-metrics')) {
            ch.querySelectorAll('li').forEach(function (li) {
              list.push(li);
            });
          } else {
            list.push(ch);
          }
        });
      }
      var visual = section.querySelector('.hero-visual');
      if (visual) list.push(visual);
      return list;
    }

    if (id === 'impacto') {
      section.querySelectorAll('.fold-2-head > *').forEach(function (el) {
        list.push(el);
      });
      section.querySelectorAll('.fold-2-split > *').forEach(function (el) {
        list.push(el);
      });
      section.querySelectorAll('.fold-2-metrics > *').forEach(function (el) {
        list.push(el);
      });
      var brands = section.querySelector('.fold-2-brands');
      if (brands) list.push(brands);
      return list;
    }

    if (id === 'recursos') {
      section.querySelectorAll('.section-head > *').forEach(function (el) {
        list.push(el);
      });
      section.querySelectorAll('.bento-card').forEach(function (el) {
        list.push(el);
      });
      return list;
    }

    if (id === 'planos') {
      section.querySelectorAll('.section-head > *').forEach(function (el) {
        list.push(el);
      });
      section.querySelectorAll('.price-card').forEach(function (el) {
        list.push(el);
      });
      return list;
    }

    if (id === 'cta') {
      section.querySelectorAll('.cta-inner > *').forEach(function (el) {
        list.push(el);
      });
      return list;
    }

    /* TechFlow — index.html */
    if (id === 'inicio') {
      section.querySelectorAll('.hero-content > *').forEach(function (el) {
        list.push(el);
      });
      var heroVis = section.querySelector('.hero-visual');
      if (heroVis) list.push(heroVis);
      return list;
    }

    if (id === 'servicos') {
      var h2s = section.querySelector('h2');
      if (h2s) list.push(h2s);
      var sd = section.querySelector('.section-desc');
      if (sd) list.push(sd);
      section.querySelectorAll('.cards .card').forEach(function (el) {
        list.push(el);
      });
      return list;
    }

    if (id === 'sobre') {
      section.querySelectorAll('.sobre-content > *').forEach(function (el) {
        list.push(el);
      });
      var foto = section.querySelector('.sobre-foto');
      if (foto) list.push(foto);
      return list;
    }

    if (id === 'contato') {
      var ch2 = section.querySelector('h2');
      if (ch2) list.push(ch2);
      var csd = section.querySelector('.section-desc');
      if (csd) list.push(csd);
      var form = section.querySelector('.form-contato');
      if (form) {
        form.querySelectorAll('.form-group').forEach(function (el) {
          list.push(el);
        });
        var btn = form.querySelector('button[type="submit"]');
        if (btn) list.push(btn);
      }
      var fb = section.querySelector('#formFeedback');
      if (fb) list.push(fb);
      return list;
    }

    /* Case studies — título/textos + cada imagem da galeria (como thumbs em Works) */
    if (section.classList.contains('case-reveal-section')) {
      section.querySelectorAll('.case-reveal-item').forEach(function (el) {
        if (el.classList.contains('reveal-title')) return;
        if (el.classList.contains('agape-num-gallery')) {
          Array.prototype.forEach.call(el.children, function (child) {
            if (child.tagName === 'FIGURE') {
              list.push(child);
              return;
            }
            if (
              child.classList.contains('agape-num-gallery__pair') ||
              child.classList.contains('agape-num-gallery__trio') ||
              child.classList.contains('agape-num-gallery__quartet')
            ) {
              child.querySelectorAll(':scope > figure').forEach(function (fig) {
                list.push(fig);
              });
              return;
            }
            if (child.classList.contains('sbpt-top-grid')) {
              child.querySelectorAll('figure').forEach(function (fig) {
                list.push(fig);
              });
              return;
            }
            if (child.classList.contains('case-section-divider')) {
              list.push(child);
            }
          });
          return;
        }
        /* Divisores já tratados ao expandir a galeria */
        if (el.closest('.agape-num-gallery')) return;
        list.push(el);
      });
      return list;
    }

    return list;
  }

  function init() {
    var main = document.querySelector('main');
    if (!main) return;

    var sections = main.querySelectorAll('section[id]');
    if (!sections.length) return;

    var staggerMs = 70;

    Array.prototype.forEach.call(sections, function (section) {
      var targets = collectRevealTargets(section);
      if (!targets.length) return;

      var individual =
        section.id === 'works' || section.classList.contains('case-reveal-section');

      if (individual) {
        targets.forEach(function (el) {
          el.classList.add('js-reveal', 'js-reveal-individual');
          el.style.setProperty('--reveal-delay', '0ms');
        });
      } else {
        targets.forEach(function (el, i) {
          el.classList.add('js-reveal');
          el.style.setProperty('--reveal-delay', i * staggerMs + 'ms');
        });
      }
    });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      main.querySelectorAll('.js-reveal').forEach(function (el) {
        el.classList.add('is-revealed');
      });
      return;
    }

    var sectionIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var sec = entry.target;
          var on = entry.isIntersecting;
          sec.querySelectorAll('.js-reveal').forEach(function (el) {
            if (on) el.classList.add('is-revealed');
            else el.classList.remove('is-revealed');
          });
        });
      },
      { threshold: 0.28, rootMargin: '0px 0px -24% 0px' }
    );

    var elementIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) entry.target.classList.add('is-revealed');
          else entry.target.classList.remove('is-revealed');
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    /* Cases com galeria alta: qualquer pixel visível revela e permanece (evita sumir) */
    var caseElementIo = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          caseElementIo.unobserve(entry.target);
        });
      },
      { threshold: 0, rootMargin: '0px 0px -4% 0px' }
    );

    main.querySelectorAll('.js-reveal-individual').forEach(function (el) {
      if (el.closest('.case-reveal-section')) caseElementIo.observe(el);
      else elementIo.observe(el);
    });

    Array.prototype.forEach.call(sections, function (section) {
      if (section.id === 'works') return;
      if (section.classList.contains('case-reveal-section')) return;
      if (section.querySelector('.js-reveal')) sectionIo.observe(section);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* Títulos de seção — utilitário reutilizável (.reveal-title → .is-visible) */
(function () {
  'use strict';

  var WORD_STAGGER_MS = 100;
  var EN_DELAY_MS = 180;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function wrapWords(el) {
    if (el.dataset.revealPrepared === '1') return;
    if (el.classList.contains('reveal-title--block')) {
      el.dataset.revealPrepared = '1';
      return;
    }

    var wordIndex = 0;

    function walk(node) {
      if (!node) return;

      if (node.nodeType === 3) {
        var parts = (node.textContent || '').split(/(\s+)/);
        var frag = document.createDocumentFragment();
        var hasWord = false;

        parts.forEach(function (part) {
          if (!part.length) return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(part));
            return;
          }
          hasWord = true;
          var span = document.createElement('span');
          span.className = 'reveal-title-word';
          span.style.setProperty('--word-i', String(wordIndex));
          span.textContent = part;
          frag.appendChild(span);
          wordIndex += 1;
        });

        if (hasWord && node.parentNode) {
          node.parentNode.replaceChild(frag, node);
        }
        return;
      }

      if (node.nodeType !== 1) return;
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(walk);
    }

    walk(el);
    el.dataset.revealPrepared = '1';
  }

  function initRevealTitles() {
    var titles = document.querySelectorAll('.reveal-title');
    if (!titles.length) return;

    titles.forEach(function (el) {
      wrapWords(el);
      if (el.classList.contains('reveal-title--en')) {
        el.style.setProperty('--reveal-title-delay', EN_DELAY_MS + 'ms');
      }
      el.style.setProperty('--reveal-title-stagger', WORD_STAGGER_MS + 'ms');
    });

    if (prefersReducedMotion()) {
      titles.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -5% 0px' }
    );

    titles.forEach(function (el) {
      io.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRevealTitles);
  } else {
    initRevealTitles();
  }
})();
