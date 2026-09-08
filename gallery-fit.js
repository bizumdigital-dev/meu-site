(function () {
  'use strict';

  var ROW_SEL =
    '.agape-num-gallery__pair, .agape-num-gallery__trio, .agape-num-gallery__quartet';

  function mediaEls(row) {
    return Array.prototype.slice.call(row.querySelectorAll('img, video'));
  }

  function ratioOf(el) {
    if (el.tagName === 'VIDEO') {
      if (el.videoWidth > 0 && el.videoHeight > 0) {
        return el.videoWidth / el.videoHeight;
      }
      return 0;
    }
    if (el.naturalWidth > 0 && el.naturalHeight > 0) {
      return el.naturalWidth / el.naturalHeight;
    }
    return 0;
  }

  function resetMedia(el) {
    el.style.removeProperty('height');
    el.style.removeProperty('width');
    el.style.removeProperty('max-width');
    var fig = el.closest('figure');
    if (!fig) return;
    fig.style.removeProperty('width');
    fig.style.removeProperty('max-width');
    fig.style.removeProperty('flex-grow');
    fig.style.removeProperty('flex-shrink');
    fig.style.removeProperty('flex-basis');
  }

  function fitRow(row) {
    var medias = mediaEls(row);
    if (medias.length < 2) return;

    if (row.closest('.criativos-yt-gallery')) {
      medias.forEach(resetMedia);
      return;
    }

    var isMobile = window.matchMedia('(max-width: 640px)').matches;
    if (isMobile && row.closest('.criativos-page')) {
      medias.forEach(resetMedia);
      return;
    }
    if (isMobile && row.closest('.sbpt-top-grid')) {
      medias.forEach(resetMedia);
      return;
    }

    var styles = window.getComputedStyle(row);
    if (styles.display === 'contents' || styles.display === 'none') {
      medias.forEach(resetMedia);
      return;
    }
    if ((styles.flexDirection || '').indexOf('column') === 0) {
      medias.forEach(resetMedia);
      return;
    }

    var ratios = [];
    var i;
    for (i = 0; i < medias.length; i++) {
      var r = ratioOf(medias[i]);
      if (!r) return;
      ratios.push(r);
    }

    for (i = 0; i < medias.length; i++) {
      var el = medias[i];
      var fig = el.closest('figure') || el.parentElement;
      fig.style.flexGrow = String(ratios[i]);
      fig.style.flexShrink = '1';
      fig.style.flexBasis = '0%';
      fig.style.width = 'auto';
      fig.style.maxWidth = 'none';
      el.style.width = '100%';
      el.style.height = 'auto';
      el.style.maxWidth = 'none';
    }
  }

  function fitAll() {
    document.querySelectorAll(ROW_SEL).forEach(fitRow);
  }

  var scheduled = false;
  function scheduleFit() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      fitAll();
    });
  }

  function boot() {
    fitAll();

    document.querySelectorAll(ROW_SEL + ' img').forEach(function (img) {
      img.addEventListener('load', scheduleFit);
      img.addEventListener('error', scheduleFit);
    });
    document.querySelectorAll(ROW_SEL + ' video').forEach(function (vid) {
      vid.addEventListener('loadedmetadata', scheduleFit);
    });

    window.addEventListener('resize', scheduleFit);

    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(scheduleFit);
      document.querySelectorAll(ROW_SEL).forEach(function (row) {
        ro.observe(row);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
