(function(){
  // Insert neon prev/next buttons around H1 titles when a model-viewer is present
  function createBtn(side){
    var btn = document.createElement('button');
    btn.className = 'model-nav__btn ' + (side === 'prev' ? 'prev' : 'next');
    btn.setAttribute('aria-label', side === 'prev' ? 'Previous model' : 'Next model');
    btn.innerHTML = side === 'prev' ? '&#x276E;' : '&#x276F;'; // chevrons
    // keyboard support
    btn.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });
    return btn;
  }

  function wireButton(btn, side){
    btn.addEventListener('click', function(e){
      // Try to trigger existing gallery lightbox buttons if present
      var fallbackPrev = document.getElementById('lightboxPrev');
      var fallbackNext = document.getElementById('lightboxNext');
      if (side === 'prev'){
        if (fallbackPrev){ fallbackPrev.click(); return; }
        // dispatch event for site-specific handlers
        window.dispatchEvent(new CustomEvent('model-nav', {detail:{direction:'prev'}}));
      } else {
        if (fallbackNext){ fallbackNext.click(); return; }
        window.dispatchEvent(new CustomEvent('model-nav', {detail:{direction:'next'}}));
      }
    });
  }

  function init(){
    var titles = Array.from(document.querySelectorAll('h1'));
    titles.forEach(function(h1){
      // decide whether this H1 is a model title: check if there's a nearby model-viewer
      // search up to 6 DOM siblings/parents
      var hasModel = false;
      var el = h1;
      for (var i=0;i<6 && el;i++){
        if (el.querySelector && el.querySelector('model-viewer')) { hasModel = true; break; }
        el = el.nextElementSibling || el.parentElement;
      }
      if (!hasModel){
        // also check previous siblings
        el = h1.previousElementSibling;
        for (var j=0;j<6 && el;j++){
          if (el.querySelector && el.querySelector('model-viewer')) { hasModel = true; break; }
          el = el.previousElementSibling || el.parentElement;
        }
      }
      if (!hasModel) return;

      // Already wrapped?
      if (h1.parentElement && h1.parentElement.classList && h1.parentElement.classList.contains('model-title-wrap')) return;

      var wrap = document.createElement('div');
      wrap.className = 'model-title-wrap';

      var prev = createBtn('prev');
      var next = createBtn('next');
      prev.classList.add('pulse'); // subtle pulse to attract attention
      next.classList.add('pulse');

      wireButton(prev, 'prev');
      wireButton(next, 'next');

      // replace h1 with wrapper
      h1.parentNode.insertBefore(wrap, h1);
      wrap.appendChild(prev);
      wrap.appendChild(h1);
      wrap.appendChild(next);
    });

    // keyboard shortcuts when focus is inside the page
    document.addEventListener('keydown', function(e){
      if (e.key === 'ArrowLeft'){
        window.dispatchEvent(new CustomEvent('model-nav', {detail:{direction:'prev-key'}}));
      } else if (e.key === 'ArrowRight'){
        window.dispatchEvent(new CustomEvent('model-nav', {detail:{direction:'next-key'}}));
      }
    });

  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
