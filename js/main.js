/**
 * Cornel Media Productions – main.js
 * Site-wide interactive behaviours (no Firebase / content loading).
 * Pure vanilla JS – no external libraries.
 */

/* ─────────────────────────────────────────────────────────────
   1. SMART NAVBAR BEHAVIOUR
   ───────────────────────────────────────────────────────────── */
function initNavbar() {
  const pillNav   = document.querySelector('.pill-nav');
  const mobileNav = document.querySelector('.mobile-bottom-nav');

  if (!pillNav && !mobileNav) return;

  let lastScrollY = window.scrollY;
  let ticking     = false;

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(updateNavbar);
      ticking = true;
    }
  }

  function updateNavbar() {
    const currentY = window.scrollY;
    const delta    = currentY - lastScrollY;

    if (pillNav) {
      // Solid background after 80 px
      if (currentY > 80) {
        pillNav.classList.add('scrolled');
      } else {
        pillNav.classList.remove('scrolled');
        pillNav.classList.remove('nav-hidden');
      }

      // Hide on fast downward scroll (after 100 px), show on upward
      if (currentY > 100) {
        if (delta > 4) {
          pillNav.classList.add('nav-hidden');
        } else if (delta < -4) {
          pillNav.classList.remove('nav-hidden');
        }
      }
    }

    lastScrollY = currentY;
    ticking     = false;
  }

  // Show pill-nav when mouse is near top of viewport
  function onMouseMove(e) {
    if (!pillNav) return;
    if (e.clientY < 80) {
      pillNav.classList.remove('nav-hidden');
    }
  }

  window.addEventListener('scroll',    onScroll,    { passive: true });
  window.addEventListener('mousemove', onMouseMove, { passive: true });
}


/* ─────────────────────────────────────────────────────────────
   2. HERO VIDEO CONTROLS
   ───────────────────────────────────────────────────────────── */
function initHeroVideo() {
  const video   = document.getElementById('heroVideo');
  const muteBtn = document.getElementById('muteToggle');

  if (!video) return;

  // Detect slow / save-data connections
  const conn       = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isSaveData = conn && conn.saveData;
  const isSlowNet  = conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g');

  if (isSaveData || isSlowNet) {
    video.removeAttribute('autoplay');
    video.load();
    return;
  }

  // Attempt autoplay (muted required)
  video.muted = true;
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      video.load();
    });
  }

  // Mute toggle
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      updateMuteIcon(muteBtn, video.muted);
    });
  }
}

function updateMuteIcon(btn, muted) {
  const icon = btn.querySelector('i');
  if (icon) {
    if (muted) {
      icon.className = icon.className.replace(/fa-volume-\S+/, 'fa-volume-xmark');
    } else {
      icon.className = icon.className.replace(/fa-volume-\S+/, 'fa-volume-high');
    }
  } else {
    btn.textContent = muted ? '🔇' : '🔊';
  }
  btn.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
}


/* ─────────────────────────────────────────────────────────────
   3. EFFICIENT RAF-BASED CAROUSEL
   ───────────────────────────────────────────────────────────── */
function initCarousel(carouselEl, speedPx) {
  if (!carouselEl) return;
  speedPx = typeof speedPx === 'number' ? speedPx : 0.5;

  let paused    = false;
  let direction = 1;
  let rafId     = null;

  function step() {
    if (!paused && document.visibilityState === 'visible') {
      const maxScroll = carouselEl.scrollWidth - carouselEl.clientWidth;

      if (maxScroll > 0) {
        carouselEl.scrollLeft += speedPx * direction;

        if (carouselEl.scrollLeft >= maxScroll) {
          carouselEl.scrollLeft = maxScroll;
          direction = -1;
        } else if (carouselEl.scrollLeft <= 0) {
          carouselEl.scrollLeft = 0;
          direction = 1;
        }
      }
    }
    rafId = requestAnimationFrame(step);
  }

  carouselEl.addEventListener('mouseenter',  function() { paused = true;  }, { passive: true });
  carouselEl.addEventListener('mouseleave',  function() { paused = false; }, { passive: true });
  carouselEl.addEventListener('touchstart',  function() { paused = true;  }, { passive: true });
  carouselEl.addEventListener('touchend',    function() { paused = false; }, { passive: true });
  carouselEl.addEventListener('touchcancel', function() { paused = false; }, { passive: true });

  document.addEventListener('visibilitychange', function() {
    paused = document.visibilityState === 'hidden';
  });

  rafId = requestAnimationFrame(step);

  return function() { cancelAnimationFrame(rafId); };
}


/* ─────────────────────────────────────────────────────────────
   4. TOUCH SWIPE SUPPORT FOR HORIZONTAL CAROUSELS
   ───────────────────────────────────────────────────────────── */
function initTouchSwipe(el) {
  if (!el) return;

  var startX      = 0;
  var startScroll = 0;
  var isDragging  = false;

  el.addEventListener('touchstart', function(e) {
    startX      = e.touches[0].clientX;
    startScroll = el.scrollLeft;
    isDragging  = true;
  }, { passive: true });

  el.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    var deltaX    = startX - e.touches[0].clientX;
    el.scrollLeft = startScroll + deltaX;
  }, { passive: true });

  el.addEventListener('touchend', function(e) {
    if (!isDragging) return;
    isDragging = false;
    var endX      = e.changedTouches[0].clientX;
    var swipeDist = startX - endX;
    if (Math.abs(swipeDist) > 50) {
      el.scrollBy({ left: swipeDist * 2.5, behavior: 'smooth' });
    }
  }, { passive: true });
}


/* ─────────────────────────────────────────────────────────────
   5. INTERSECTION OBSERVER – SCROLL REVEAL
   ───────────────────────────────────────────────────────────── */
function initScrollReveal() {
  var revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(function(el) { observer.observe(el); });
}


/* ─────────────────────────────────────────────────────────────
   6. INTERSECTION OBSERVER – STAT COUNTERS
   ───────────────────────────────────────────────────────────── */
function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

function animateCounter(el) {
  var raw       = el.dataset.target || '0';
  var hasSuffix = raw.charAt(raw.length - 1) === '+';
  var target    = parseInt(raw.replace(/\D/g, ''), 10);
  var suffix    = hasSuffix ? '+' : '';
  var duration  = 2000;
  var startTime = null;

  function tick(timestamp) {
    if (!startTime) startTime = timestamp;
    var elapsed  = timestamp - startTime;
    var progress = Math.min(elapsed / duration, 1);
    var eased    = easeOutQuart(progress);
    var current  = Math.round(eased * target);

    el.textContent = current.toLocaleString() + suffix;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target.toLocaleString() + suffix;
    }
  }

  requestAnimationFrame(tick);
}

function initStatCounters() {
  var statEls = document.querySelectorAll('.stat-number[data-target]');
  if (!statEls.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  statEls.forEach(function(el) { observer.observe(el); });
}


/* ─────────────────────────────────────────────────────────────
   7. PORTFOLIO FILTER BUTTONS
   ───────────────────────────────────────────────────────────── */
function initPortfolioFilters() {
  var filterContainer = document.querySelector('.portfolio-filters');
  var portfolioItems  = document.querySelectorAll('.portfolio-item');

  if (!filterContainer || !portfolioItems.length) return;

  filterContainer.addEventListener('click', function(e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;

    filterContainer.querySelectorAll('.filter-btn').forEach(function(b) {
      b.classList.remove('active');
    });
    btn.classList.add('active');

    var category = btn.dataset.category || 'all';

    portfolioItems.forEach(function(item) {
      var itemCategory = item.dataset.category || '';
      var show         = category === 'all' || itemCategory === category;
      if (show) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
  });
}


/* ─────────────────────────────────────────────────────────────
   8. VIDEO LAZY LOADING (iframes)
   ───────────────────────────────────────────────────────────── */
function initVideoLazyLoad() {
  var videoEmbeds = document.querySelectorAll('.video-embed[data-src]');
  if (!videoEmbeds.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var iframe = entry.target.querySelector('iframe') || entry.target;
      if (entry.isIntersecting) {
        var src = entry.target.dataset.src;
        if (src && iframe.src !== src) {
          iframe.src = src;
        }
      }
    });
  }, {
    rootMargin: '200px 0px',
    threshold: 0
  });

  videoEmbeds.forEach(function(el) { observer.observe(el); });
}


/* ─────────────────────────────────────────────────────────────
   9. COOKIE / CONSENT BANNER
   ───────────────────────────────────────────────────────────── */
function initCookieBanner() {
  var STORAGE_KEY = 'cmp_cookie_consented';
  var banner      = document.getElementById('cookieBanner');

  if (!banner) return;
  if (localStorage.getItem(STORAGE_KEY)) return;

  setTimeout(function() {
    banner.classList.add('visible');
    banner.setAttribute('aria-hidden', 'false');
  }, 2000);
}

window.acceptCookies = function() {
  var STORAGE_KEY = 'cmp_cookie_consented';
  localStorage.setItem(STORAGE_KEY, '1');

  var banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.classList.remove('visible');
    banner.setAttribute('aria-hidden', 'true');
    banner.addEventListener('transitionend', function() { banner.remove(); }, { once: true });
  }
};

window.declineCookies = function() {
  var banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.classList.remove('visible');
    banner.setAttribute('aria-hidden', 'true');
    banner.addEventListener('transitionend', function() { banner.remove(); }, { once: true });
  }
};


/* ─────────────────────────────────────────────────────────────
   10. SMOOTH SCROLL FOR ANCHOR LINKS
   ───────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  document.addEventListener('click', function(e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    var targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;

    var targetEl = document.querySelector(targetId);
    if (!targetEl) return;

    e.preventDefault();
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}


/* ─────────────────────────────────────────────────────────────
   11. ACTIVE PAGE DETECTION FOR NAV
   ───────────────────────────────────────────────────────────── */
function initActiveNav() {
  var pathname = window.location.pathname;
  var currPath = pathname.replace(/\/$/, '');

  function isActiveLink(href) {
    if (!href) return false;
    var linkPath = href.replace(/\/$/, '');
    if (currPath === linkPath) return true;
    if ((href === 'index.html' || href === '/') && (currPath === '' || currPath === '/')) return true;
    if (linkPath !== '' && linkPath !== '/' && currPath.endsWith(linkPath)) return true;
    return false;
  }

  document.querySelectorAll('.pill-nav a[href]').forEach(function(link) {
    if (isActiveLink(link.getAttribute('href'))) {
      link.classList.add('nav-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  document.querySelectorAll('.mobile-bottom-nav a[href]').forEach(function(link) {
    if (isActiveLink(link.getAttribute('href'))) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}


/* ─────────────────────────────────────────────────────────────
   ENTRY POINT
   ───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {

  // 1 – Navbar
  initNavbar();

  // 2 – Hero video
  initHeroVideo();

  // 3 & 4 – Featured carousel + touch swipe
  var featuredCarousel = document.getElementById('featured-carousel');
  if (featuredCarousel) {
    initCarousel(featuredCarousel, 0.5);
    initTouchSwipe(featuredCarousel);
  }

  // Touch swipe on any other horizontal carousels
  document.querySelectorAll('.carousel-track, .clients-carousel').forEach(function(el) {
    if (el !== featuredCarousel) initTouchSwipe(el);
  });

  // 5 – Scroll reveal
  initScrollReveal();

  // 6 – Stat counters
  initStatCounters();

  // 7 – Portfolio filters
  initPortfolioFilters();

  // 8 – Video lazy loading
  initVideoLazyLoad();

  // 9 – Cookie banner
  initCookieBanner();

  // 10 – Smooth scroll
  initSmoothScroll();

  // 11 – Active nav
  initActiveNav();

});

 / *    % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %
       1 1 .   V I D E O   M O D A L   L O G I C 
        % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % % %  * / 
 w i n d o w . o p e n V i d e o M o d a l   =   f u n c t i o n ( y o u t u b e I d )   { 
     l e t   m o d a l   =   d o c u m e n t . g e t E l e m e n t B y I d ( " v i d e o - m o d a l - o v e r l a y " ) ; 
     i f   ( ! m o d a l )   { 
         m o d a l   =   d o c u m e n t . c r e a t e E l e m e n t ( " d i v " ) ; 
         m o d a l . i d   =   " v i d e o - m o d a l - o v e r l a y " ; 
         m o d a l . c l a s s N a m e   =   " v i d e o - m o d a l - o v e r l a y " ; 
         m o d a l . i n n e r H T M L   =   ` 
             < d i v   c l a s s = " v i d e o - m o d a l - c o n t e n t " > 
                 < b u t t o n   c l a s s = " v i d e o - m o d a l - c l o s e "   o n c l i c k = " c l o s e V i d e o M o d a l ( ) " > & t i m e s ; < / b u t t o n > 
                 < d i v   i d = " v i d e o - m o d a l - i f r a m e - c o n t a i n e r "   s t y l e = " w i d t h : 1 0 0 % ; h e i g h t : 1 0 0 % " > < / d i v > 
             < / d i v > 
         ` ; 
         d o c u m e n t . b o d y . a p p e n d C h i l d ( m o d a l ) ; 
         m o d a l . a d d E v e n t L i s t e n e r ( " c l i c k " ,   f u n c t i o n ( e )   { 
             i f   ( e . t a r g e t   = = =   m o d a l )   c l o s e V i d e o M o d a l ( ) ; 
         } ) ; 
     } 
     c o n s t   c o n t a i n e r   =   d o c u m e n t . g e t E l e m e n t B y I d ( " v i d e o - m o d a l - i f r a m e - c o n t a i n e r " ) ; 
     c o n t a i n e r . i n n e r H T M L   =   ` < i f r a m e   s r c = " h t t p s : / / w w w . y o u t u b e . c o m / e m b e d / $ { y o u t u b e I d } ? a u t o p l a y = 1 & r e l = 0 "   f r a m e b o r d e r = " 0 "   a l l o w = " a c c e l e r o m e t e r ;   a u t o p l a y ;   c l i p b o a r d - w r i t e ;   e n c r y p t e d - m e d i a ;   g y r o s c o p e ;   p i c t u r e - i n - p i c t u r e "   a l l o w f u l l s c r e e n > < / i f r a m e > ` ; 
     
     / /   f o r c e   r e f l o w 
     m o d a l . o f f s e t H e i g h t ; 
     m o d a l . c l a s s L i s t . a d d ( " a c t i v e " ) ; 
     d o c u m e n t . b o d y . s t y l e . o v e r f l o w   =   " h i d d e n " ; 
 } ; 
 
 w i n d o w . c l o s e V i d e o M o d a l   =   f u n c t i o n ( )   { 
     c o n s t   m o d a l   =   d o c u m e n t . g e t E l e m e n t B y I d ( " v i d e o - m o d a l - o v e r l a y " ) ; 
     i f   ( m o d a l )   { 
         m o d a l . c l a s s L i s t . r e m o v e ( " a c t i v e " ) ; 
         c o n s t   c o n t a i n e r   =   d o c u m e n t . g e t E l e m e n t B y I d ( " v i d e o - m o d a l - i f r a m e - c o n t a i n e r " ) ; 
         c o n t a i n e r . i n n e r H T M L   =   " " ;   / /   s t o p   v i d e o 
         d o c u m e n t . b o d y . s t y l e . o v e r f l o w   =   " " ; 
     } 
 } ; 
  
 