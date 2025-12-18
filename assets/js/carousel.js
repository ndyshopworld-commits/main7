// carousel.js — unified autoplay + pointer-drag scrolling for logo carousels
(function(){
  function initCarousel(carousel){
    if (!carousel) return;
    // make container scrollable and user-friendly
    carousel.style.overflowX = 'auto';
    carousel.style.overflowY = 'hidden';
    carousel.style.touchAction = 'pan-x';
    carousel.style.scrollBehavior = 'smooth';

    const track = carousel.querySelector('.carousel-track') || carousel.firstElementChild;
    // enable pointer drag
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    carousel.style.cursor = 'grab';

    carousel.addEventListener('pointerdown', (e) => {
      isDown = true;
      carousel.setPointerCapture?.(e.pointerId);
      startX = e.pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
      carousel.style.cursor = 'grabbing';
      pauseAutoplay();
    });

    const onMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - carousel.offsetLeft;
      const walk = x - startX;
      carousel.scrollLeft = scrollLeft - walk;
    };

    carousel.addEventListener('pointermove', onMove);

    ['pointerup','pointercancel','pointerleave'].forEach(ev => {
      carousel.addEventListener(ev, (e) => {
        isDown = false;
        try { carousel.releasePointerCapture?.(e.pointerId); } catch(e){}
        carousel.style.cursor = 'grab';
        resumeAutoplay();
      });
    });

    // wheel to scroll horizontally (desktop)
    carousel.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) > 0 || Math.abs(e.deltaX) > 0) {
        e.preventDefault();
        carousel.scrollLeft += e.deltaY || e.deltaX;
        pauseAutoplayTemporarily();
      }
    }, { passive: false });

    // Autoplay using requestAnimationFrame for smoothness and to allow interrupting
    let rafId = null;
    let lastTime = 0;
    let autoplay = true;
    let pausedUntil = 0;

    const speedPxPerSec = () => (window.innerWidth <= 900 ? 90 : 48); // px/sec (faster on mobile)

    function step(ts){
      if (!lastTime) lastTime = ts;
      const dt = ts - lastTime;
      lastTime = ts;

      if (autoplay && !isDown && Date.now() > pausedUntil) {
        const delta = (speedPxPerSec() * dt) / 1000;
        carousel.scrollLeft = carousel.scrollLeft + delta;
        // loop when at end
        if (carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 1) {
          carousel.scrollLeft = 0;
        }
      }
      rafId = requestAnimationFrame(step);
    }

    function startAutoplay(){ if (!rafId) { lastTime = 0; rafId = requestAnimationFrame(step); } }
    function stopAutoplay(){ if (rafId) { cancelAnimationFrame(rafId); rafId = null; lastTime = 0; } }
    function pauseAutoplay(){ autoplay = false; }
    function resumeAutoplay(){ autoplay = true; }
    function pauseAutoplayTemporarily(){ pausedUntil = Date.now() + 1200; }

    // init
    startAutoplay();

    // expose pause/resume for debugging
    carousel.__carousel = { pauseAutoplay, resumeAutoplay, stopAutoplay, startAutoplay };
  }

  function initAll(){
    const carousels = document.querySelectorAll('.logo-carousel');
    carousels.forEach(initCarousel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
