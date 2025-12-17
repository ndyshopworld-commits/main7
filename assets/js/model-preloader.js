// Automatically inject a viewer-wrapper overlay for every <model-viewer>
(function(){
  function createOverlayNode(){
    const div = document.createElement('div');
    div.className = 'model-loading-overlay';
    div.setAttribute('aria-live','polite');
    div.setAttribute('aria-busy','true');
    div.innerHTML = `
      <div class="loader-card">
        <div class="loading-logo">
          <img src="/assets/images/albaspace-logo.png" alt="AlbaSpace Logo" />
          <span>ALBASPACE</span>
        </div>

        <div class="loader-orb"><div class="orb-ring"></div><div class="orb-core"></div></div>

        <p class="loading-text">Lütfen bekleyin, 3D model yükleniyor…</p>
        <p class="loading-subtext">Bu işlem internet hızınıza göre birkaç saniye sürebilir.</p>

        <div class="progress-shell">
          <div class="progress-bar"><div class="progress-fill"></div></div>
          <div class="progress-glow"></div>
        </div>

        <div class="overlay-hint">AR &amp; 3D deneyimi hazırlanıyor</div>
      </div>`;
    return div;
  }

  function attachToViewer(viewer){
    if (!viewer) return;
    if (viewer.closest('.viewer-wrapper')) return; // already wrapped

    const wrapper = document.createElement('div');
    wrapper.className = 'viewer-wrapper';

    // insert wrapper in place of viewer
    viewer.parentNode.insertBefore(wrapper, viewer);
    wrapper.appendChild(viewer);

    const overlay = createOverlayNode();
    wrapper.insertBefore(overlay, viewer);

    const progressFill = overlay.querySelector('.progress-fill');

    const hideOverlay = () => {
      if (!overlay || overlay.classList.contains('fade-out')) return;
      overlay.classList.add('fade-out');
      overlay.setAttribute('aria-busy', 'false');
      setTimeout(() => { overlay?.remove(); }, 550);
    };

    function updateProgress(e){
      const t = (e && e.detail && typeof e.detail.totalProgress === 'number') ? e.detail.totalProgress : null;
      if (t !== null && progressFill){
        const percent = Math.max(0, Math.min(100, Math.round(t*100)));
        progressFill.style.width = percent + '%';
        if (percent >= 100) setTimeout(hideOverlay, 200);
      }
    }

    viewer.addEventListener('progress', updateProgress);
    viewer.addEventListener('load', () => { if (progressFill) progressFill.style.width = '100%'; setTimeout(hideOverlay, 250); });
    viewer.addEventListener('poster-dismissed', () => { if (progressFill) progressFill.style.width = '100%'; setTimeout(hideOverlay, 250); });

    // Fallback: if model loading stalls
    const fallback = setTimeout(hideOverlay, 20000);

    // if viewer becomes removed, cleanup
    const obs = new MutationObserver(() => {
      if (!document.body.contains(viewer)){
        clearTimeout(fallback);
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // If the model-viewer is already complete, hide immediately
    if (viewer.hasAttribute('reveal') || viewer.getAttribute('src') === '') {
      // don't assume loaded; keep overlay until progress/load events
    }
  }

  function init(){
    const viewers = document.querySelectorAll('model-viewer');
    if (!viewers || viewers.length === 0) return;

    viewers.forEach(attachToViewer);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
