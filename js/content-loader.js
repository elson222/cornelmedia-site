/**
 * content-loader.js
 * Cornel Media Productions — Dynamic Content Loader
 *
 * Loads all public-facing content from Firebase Firestore.
 * Uses onSnapshot for real-time updates, skeleton loaders while fetching,
 * and graceful fallbacks when data is unavailable.
 *
 * ES Module — import from firebase-config.js
 */

import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
} from './firebase-config.js';

/* ============================================================
   UTILITIES
   ============================================================ */

/**
 * Safe element selector — returns null instead of throwing.
 * @param {string} id
 * @returns {HTMLElement|null}
 */
function el(id) {
  return document.getElementById(id);
}

/**
 * Set text content on an element if it exists and the value is non-empty.
 * @param {string} id
 * @param {string|number} value
 */
function setText(id, value) {
  const node = el(id);
  if (node && value !== undefined && value !== null && value !== '') {
    node.textContent = value;
  }
}

/**
 * Escape HTML to prevent XSS when inserting untrusted strings.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generate a deterministic hue (0-360) from a string (for avatar colours).
 * @param {string} str
 * @returns {number}
 */
function stringToHue(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/* ============================================================
   1. HERO CONTENT
   ============================================================ */

/**
 * Load hero section content from /config/hero.
 * Falls back to whatever is already in the HTML if data is missing.
 */
export function loadHeroContent() {
  const docRef = doc(db, 'config', 'hero');

  onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) return; // keep existing HTML

      const data = snap.data();

      setText('hero-headline', data.headline);
      setText('hero-subtitle', data.subtitle);
      setText('hero-description', data.description);

      // Primary CTA
      const ctaPrimary = el('hero-cta-primary');
      if (ctaPrimary && data.ctaPrimary) {
        if (data.ctaPrimary.text) ctaPrimary.textContent = data.ctaPrimary.text;
        if (data.ctaPrimary.url) ctaPrimary.href = data.ctaPrimary.url;
      }

      // Secondary CTA
      const ctaSecondary = el('hero-cta-secondary');
      if (ctaSecondary && data.ctaSecondary) {
        if (data.ctaSecondary.text) ctaSecondary.textContent = data.ctaSecondary.text;
        if (data.ctaSecondary.url) ctaSecondary.href = data.ctaSecondary.url;
      }
    },
    (err) => {
      console.warn('[content-loader] loadHeroContent error:', err.message);
    }
  );
}

/* ============================================================
   2. SERVICES SECTION
   ============================================================ */

/**
 * Build skeleton service cards while real data loads.
 * @param {HTMLElement} container
 * @param {number} [count=3]
 */
function showServiceSkeletons(container, count = 3) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'service-card skeleton-card';
    card.innerHTML = `
      <div class="skeleton skeleton-icon"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
    `;
    container.appendChild(card);
  }
}

/**
 * Load and render the services collection.
 * @param {string} containerId  ID of the container element
 */
export function loadServicesSection(containerId) {
  const container = el(containerId);
  if (!container) return;

  showServiceSkeletons(container);

  const q = query(collection(db, 'services'), orderBy('order'));

  onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        container.innerHTML = '<p class="no-content">Services coming soon.</p>';
        return;
      }

      container.innerHTML = '';

      snap.forEach((docSnap) => {
        const s = docSnap.data();
        const card = document.createElement('div');
        card.className = 'service-card';
        card.dataset.id = docSnap.id;

        // Features list
        let featuresHtml = '';
        if (Array.isArray(s.features) && s.features.length) {
          const items = s.features
            .map((f) => `<li><span class="feature-check" aria-hidden="true">&#10003;</span> ${escapeHtml(f)}</li>`)
            .join('');
          featuresHtml = `<ul class="service-features">${items}</ul>`;
        }

        card.innerHTML = `
          <div class="service-icon" aria-hidden="true">${escapeHtml(s.icon || '')}</div>
          <h3 class="service-title">${escapeHtml(s.title || 'Service')}</h3>
          <p class="service-description">${escapeHtml(s.description || '')}</p>
          ${featuresHtml}
        `;

        container.appendChild(card);
      });
    },
    (err) => {
      console.warn('[content-loader] loadServicesSection error:', err.message);
      container.innerHTML = '<p class="load-error">Unable to load services at this time.</p>';
    }
  );
}

/* ============================================================
   3. PORTFOLIO
   ============================================================ */

/**
 * Show skeleton portfolio items.
 * @param {HTMLElement} container
 * @param {number} [count=6]
 */
function showPortfolioSkeletons(container, count = 6) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const item = document.createElement('div');
    item.className = 'portfolio-item skeleton-card';
    item.innerHTML = `<div class="skeleton skeleton-image"></div>`;
    container.appendChild(item);
  }
}

/**
 * Load and render portfolio items.
 * @param {string} containerId
 * @param {string} [filterCategory='all']
 * @returns {Promise<Array<{imageUrl:string, title:string, category:string}>>}
 *   Resolves with all portfolio items (used by initLightbox).
 */
export function loadPortfolio(containerId, filterCategory = 'all') {
  const container = el(containerId);
  if (!container) return Promise.resolve([]);

  showPortfolioSkeletons(container);

  return new Promise((resolve) => {
    const q = query(collection(db, 'portfolio'), orderBy('order'));

    onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          container.innerHTML = '<p class="no-content">Portfolio coming soon.</p>';
          resolve([]);
          return;
        }

        const allItems = [];
        container.innerHTML = '';

        snap.forEach((docSnap, index) => {
          const p = docSnap.data();
          allItems.push({
            imageUrl: p.imageUrl || '',
            title: p.title || '',
            category: p.category || 'general',
            index,
          });

          const item = document.createElement('div');
          item.className = 'portfolio-item';
          item.dataset.category = (p.category || 'general').toLowerCase();
          item.dataset.index = index;

          // Hide immediately if a filter is active and it doesn't match
          if (filterCategory !== 'all' && item.dataset.category !== filterCategory.toLowerCase()) {
            item.style.display = 'none';
          }

          const img = document.createElement('img');
          img.src = p.imageUrl || '';
          img.alt = escapeHtml(p.title || 'Portfolio image');
          img.loading = 'lazy';
          img.className = 'portfolio-img';

          // Fallback if image fails
          img.onerror = () => {
            img.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23111' width='400' height='300'/%3E%3Ctext fill='%23555' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif'%3ENo Image%3C/text%3E%3C/svg%3E";
          };

          const overlay = document.createElement('div');
          overlay.className = 'portfolio-overlay';
          overlay.innerHTML = `
            <span class="portfolio-title">${escapeHtml(p.title || '')}</span>
            ${p.category ? `<span class="portfolio-category">${escapeHtml(p.category)}</span>` : ''}
          `;

          item.appendChild(img);
          item.appendChild(overlay);
          item.setAttribute('role', 'button');
          item.setAttribute('tabindex', '0');
          item.setAttribute('aria-label', `View ${escapeHtml(p.title || 'portfolio item')}`);

          container.appendChild(item);
        });

        resolve(allItems);
      },
      (err) => {
        console.warn('[content-loader] loadPortfolio error:', err.message);
        container.innerHTML = '<p class="load-error">Unable to load portfolio at this time.</p>';
        resolve([]);
      }
    );
  });
}

/* ============================================================
   4. PORTFOLIO FILTERS
   ============================================================ */

/**
 * Initialise portfolio filter buttons based on categories found in Firestore.
 * @param {string} filtersId   ID of the element that will hold filter buttons
 * @param {string} gridId      ID of the portfolio grid container
 */
export function initPortfolioFilters(filtersId, gridId) {
  const filtersEl = el(filtersId);
  const gridEl = el(gridId);
  if (!filtersEl || !gridEl) return;

  const q = query(collection(db, 'portfolio'), orderBy('order'));

  onSnapshot(
    q,
    (snap) => {
      const categories = new Set();
      snap.forEach((d) => {
        const cat = (d.data().category || 'general').toLowerCase();
        categories.add(cat);
      });

      // Build filter buttons
      filtersEl.innerHTML = '';

      const allBtn = document.createElement('button');
      allBtn.className = 'filter-btn active';
      allBtn.dataset.filter = 'all';
      allBtn.textContent = 'All';
      filtersEl.appendChild(allBtn);

      categories.forEach((cat) => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = cat;
        btn.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
        filtersEl.appendChild(btn);
      });

      // Delegate filter click
      filtersEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;

        // Update active state
        filtersEl.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;

        // Show/hide portfolio items
        gridEl.querySelectorAll('.portfolio-item').forEach((item) => {
          if (filter === 'all' || item.dataset.category === filter) {
            item.style.display = '';
            item.classList.remove('filtered-out');
          } else {
            item.style.display = 'none';
            item.classList.add('filtered-out');
          }
        });
      });
    },
    (err) => {
      console.warn('[content-loader] initPortfolioFilters error:', err.message);
    }
  );
}

/* ============================================================
   5. VIDEOS SECTION
   ============================================================ */

/**
 * Show skeleton video placeholder cards.
 * @param {HTMLElement} container
 * @param {number} [count=3]
 */
function showVideoSkeletons(container, count = 3) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'video-card skeleton-card';
    card.innerHTML = `
      <div class="skeleton skeleton-video"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
    `;
    container.appendChild(card);
  }
}

/**
 * Load and render the videos collection with embedded YouTube iframes.
 * @param {string} containerId
 */
export function loadVideosSection(containerId) {
  const container = el(containerId);
  if (!container) return;

  showVideoSkeletons(container);

  const q = query(collection(db, 'videos'), orderBy('order'));

  onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        container.innerHTML = '<p class="no-content">Videos coming soon.</p>';
        return;
      }

      container.innerHTML = '';

      snap.forEach((docSnap) => {
        const v = docSnap.data();
        if (!v.youtubeId) return;

        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.id = docSnap.id;

        card.innerHTML = `
          <div class="video-embed">
            <iframe
              src="https://www.youtube.com/embed/${escapeHtml(v.youtubeId)}"
              title="${escapeHtml(v.title || 'Video')}"
              allow="autoplay; encrypted-media"
              allowfullscreen
              loading="lazy"
            ></iframe>
          </div>
          <div class="video-info">
            <h3 class="video-title">${escapeHtml(v.title || '')}</h3>
            ${v.description ? `<p class="video-desc">${escapeHtml(v.description)}</p>` : ''}
          </div>
        `;

        container.appendChild(card);
      });
    },
    (err) => {
      console.warn('[content-loader] loadVideosSection error:', err.message);
      container.innerHTML = '<p class="load-error">Unable to load videos at this time.</p>';
    }
  );
}

/* ============================================================
   6. CREW SECTION
   ============================================================ */

/**
 * Show skeleton crew cards.
 * @param {HTMLElement} container
 * @param {number} [count=4]
 */
function showCrewSkeletons(container, count = 4) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'crew-card skeleton-card';
    card.innerHTML = `
      <div class="skeleton skeleton-avatar"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-text"></div>
    `;
    container.appendChild(card);
  }
}

/**
 * Load and render the crew collection.
 * Shows initials avatar if no photoUrl is set.
 * @param {string} containerId
 */
export function loadCrewSection(containerId) {
  const container = el(containerId);
  if (!container) return;

  showCrewSkeletons(container);

  const q = query(collection(db, 'crew'), orderBy('order'));

  onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        container.innerHTML = '<p class="no-content">Crew information coming soon.</p>';
        return;
      }

      container.innerHTML = '';

      snap.forEach((docSnap) => {
        const c = docSnap.data();
        const name = c.name || 'Crew Member';
        const initials = name
          .split(' ')
          .map((w) => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        const hue = stringToHue(name);

        let avatarHtml;
        if (c.photoUrl) {
          avatarHtml = `
            <div class="crew-photo-wrap">
              <img
                class="crew-photo"
                src="${escapeHtml(c.photoUrl)}"
                alt="${escapeHtml(name)}"
                loading="lazy"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
              />
              <div class="crew-avatar initials-avatar" style="background:hsl(${hue},55%,35%);display:none" aria-hidden="true">
                ${escapeHtml(initials)}
              </div>
            </div>
          `;
        } else {
          avatarHtml = `
            <div class="crew-photo-wrap">
              <div class="crew-avatar initials-avatar" style="background:hsl(${hue},55%,35%)" aria-hidden="true">
                ${escapeHtml(initials)}
              </div>
            </div>
          `;
        }

        const card = document.createElement('div');
        card.className = 'crew-card';
        card.dataset.id = docSnap.id;
        card.innerHTML = `
          ${avatarHtml}
          <h3 class="crew-name">${escapeHtml(name)}</h3>
          ${c.role ? `<p class="crew-role">${escapeHtml(c.role)}</p>` : ''}
          ${c.bio ? `<p class="crew-bio">${escapeHtml(c.bio)}</p>` : ''}
        `;

        container.appendChild(card);
      });
    },
    (err) => {
      console.warn('[content-loader] loadCrewSection error:', err.message);
      container.innerHTML = '<p class="load-error">Unable to load crew at this time.</p>';
    }
  );
}

/* ============================================================
   7. TESTIMONIALS
   ============================================================ */

/**
 * Load and render testimonials.
 * @param {string} containerId
 */
export function loadTestimonials(containerId) {
  const container = el(containerId);
  if (!container) return;

  // Show skeletons
  container.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const card = document.createElement('div');
    card.className = 'testimonial-card skeleton-card';
    card.innerHTML = `
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
    `;
    container.appendChild(card);
  }

  const q = query(collection(db, 'testimonials'), orderBy('order'));

  onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        container.innerHTML = '';
        return;
      }

      container.innerHTML = '';

      snap.forEach((docSnap) => {
        const t = docSnap.data();

        let photoHtml = '';
        if (t.clientPhoto) {
          photoHtml = `<img class="testimonial-photo" src="${escapeHtml(t.clientPhoto)}" alt="${escapeHtml(t.clientName || '')}" loading="lazy" />`;
        }

        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.dataset.id = docSnap.id;
        card.innerHTML = `
          <blockquote class="testimonial-quote">
            <p>${escapeHtml(t.quote || '')}</p>
          </blockquote>
          <div class="testimonial-author">
            ${photoHtml}
            <div class="testimonial-meta">
              <span class="testimonial-name">${escapeHtml(t.clientName || '')}</span>
              ${t.clientCompany ? `<span class="testimonial-company">${escapeHtml(t.clientCompany)}</span>` : ''}
            </div>
          </div>
        `;

        container.appendChild(card);
      });
    },
    (err) => {
      console.warn('[content-loader] loadTestimonials error:', err.message);
      container.innerHTML = '';
    }
  );
}

/* ============================================================
   8. CLIENTS (MARQUEE)
   ============================================================ */

/**
 * Load and render clients as a CSS marquee.
 * Duplicates items to create a seamless infinite loop.
 * Falls back to text name if logoUrl fails.
 * @param {string} containerId  Expected to be a .clients-marquee wrapper
 */
export function loadClients(containerId) {
  const container = el(containerId);
  if (!container) return;

  const q = query(collection(db, 'clients'), orderBy('order'));

  onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        container.innerHTML = '';
        return;
      }

      /**
       * Build one client logo card element.
       * @param {Object} c     Firestore document data
       * @param {string} docId Unique key for the element
       * @returns {HTMLElement}
       */
      const makeItem = (c, docId) => {
        const item = document.createElement('div');
        item.className = 'client-logo-card';
        item.dataset.id = docId;

        if (c.logoUrl) {
          const img = document.createElement('img');
          img.src = c.logoUrl;
          img.alt = escapeHtml(c.name || 'Client');
          img.loading = 'lazy';
          img.className = 'client-logo-img';

          // Fallback to text name if image fails
          img.onerror = () => {
            img.style.display = 'none';
            const nameSpan = document.createElement('span');
            nameSpan.className = 'client-name-fallback';
            nameSpan.textContent = c.name || 'Client';
            item.appendChild(nameSpan);
          };
          item.appendChild(img);
        } else {
          const nameSpan = document.createElement('span');
          nameSpan.className = 'client-name-fallback';
          nameSpan.textContent = c.name || 'Client';
          item.appendChild(nameSpan);
        }

        return item;
      };

      container.innerHTML = '';

      // First track (visible, announced to screen readers)
      const track1 = document.createElement('div');
      track1.className = 'marquee-track';
      track1.setAttribute('aria-hidden', 'false');

      // Second track (duplicate for seamless CSS animation loop, hidden from SR)
      const track2 = document.createElement('div');
      track2.className = 'marquee-track';
      track2.setAttribute('aria-hidden', 'true');

      snap.forEach((docSnap) => {
        const c = docSnap.data();
        track1.appendChild(makeItem(c, docSnap.id));
        track2.appendChild(makeItem(c, docSnap.id + '-dup'));
      });

      container.appendChild(track1);
      container.appendChild(track2);
    },
    (err) => {
      console.warn('[content-loader] loadClients error:', err.message);
    }
  );
}

/* ============================================================
   9. PRICING
   ============================================================ */

/**
 * Show skeleton pricing cards.
 * @param {HTMLElement} container
 * @param {number} [count=3]
 */
function showPricingSkeletons(container, count = 3) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'pricing-card skeleton-card';
    card.innerHTML = `
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-price"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-text short"></div>
      <div class="skeleton skeleton-btn"></div>
    `;
    container.appendChild(card);
  }
}

/**
 * Load and render pricing plans.
 * @param {string} containerId
 */
export function loadPricing(containerId) {
  const container = el(containerId);
  if (!container) return;

  showPricingSkeletons(container);

  const q = query(collection(db, 'pricing'), orderBy('order'));

  onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        container.innerHTML = '<p class="no-content">Pricing information coming soon.</p>';
        return;
      }

      container.innerHTML = '';

      snap.forEach((docSnap) => {
        const p = docSnap.data();
        const isFeatured = p.featured === true;

        let featuresHtml = '';
        if (Array.isArray(p.features) && p.features.length) {
          const items = p.features
            .map((f) => `<li><span class="feature-check" aria-hidden="true">&#10003;</span> ${escapeHtml(f)}</li>`)
            .join('');
          featuresHtml = `<ul class="pricing-features">${items}</ul>`;
        }

        const card = document.createElement('div');
        card.className = `pricing-card${isFeatured ? ' featured' : ''}`;
        card.dataset.id = docSnap.id;

        card.innerHTML = `
          ${isFeatured ? '<div class="pricing-badge">Most Popular</div>' : ''}
          <h3 class="pricing-name">${escapeHtml(p.name || 'Plan')}</h3>
          <div class="pricing-price">${escapeHtml(p.price || '')}</div>
          ${p.description ? `<p class="pricing-description">${escapeHtml(p.description)}</p>` : ''}
          ${featuresHtml}
          <a href="#contact" class="pricing-cta btn ${isFeatured ? 'btn-primary' : 'btn-outline'}">
            ${escapeHtml(p.ctaText || 'Get Started')}
          </a>
        `;

        container.appendChild(card);
      });
    },
    (err) => {
      console.warn('[content-loader] loadPricing error:', err.message);
      container.innerHTML = '<p class="load-error">Unable to load pricing at this time.</p>';
    }
  );
}

/* ============================================================
   10. ABOUT CONTENT
   ============================================================ */

/**
 * Load about page content from /config/about.
 * Updates specific elements by ID.
 */
export function loadAboutContent() {
  const docRef = doc(db, 'config', 'about');

  onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      setText('founder-name', data.founderName);
      setText('founder-title', data.founderTitle);
      setText('founder-bio', data.founderBio);
      setText('about-story', data.storyText);
      setText('about-mission', data.missionStatement);

      // Founder photo
      if (data.founderPhoto) {
        const photoEl = el('founder-photo');
        if (photoEl && photoEl.tagName === 'IMG') {
          photoEl.src = data.founderPhoto;
          photoEl.alt = data.founderName || 'Founder';
        }
      }
    },
    (err) => {
      console.warn('[content-loader] loadAboutContent error:', err.message);
    }
  );
}

/* ============================================================
   11. STATS WITH ANIMATED COUNTER
   ============================================================ */

/**
 * Animate a numeric counter from 0 to a target value using requestAnimationFrame.
 * Uses cubic ease-out easing for a natural deceleration effect.
 * @param {HTMLElement} element
 * @param {number} target
 * @param {number} [duration=2000]  milliseconds
 */
function animateCounter(element, target, duration = 2000) {
  const start = performance.now();
  const isFloat = target % 1 !== 0;

  const tick = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic: decelerate towards end
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * target;

    element.textContent = isFloat ? current.toFixed(1) : Math.round(current);

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = target; // ensure exact final value
    }
  };

  requestAnimationFrame(tick);
}

/**
 * Load stats from /config/stats and animate counters when scrolled into view.
 * Watches: #stat-clients, #stat-projects, #stat-years, #stat-awards
 */
export function loadStats() {
  const docRef = doc(db, 'config', 'stats');

  onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      const statMap = {
        'stat-clients': Number(data.clients) || 0,
        'stat-projects': Number(data.projects) || 0,
        'stat-years': Number(data.years) || 0,
        'stat-awards': Number(data.awards) || 0,
      };

      // IntersectionObserver fires animation once element is 50% visible
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const statEl = entry.target;
            const target = statMap[statEl.id];
            if (target !== undefined) animateCounter(statEl, target);
            obs.unobserve(statEl); // animate only once
          });
        },
        { threshold: 0.5 }
      );

      Object.keys(statMap).forEach((id) => {
        const statEl = el(id);
        if (statEl) {
          statEl.textContent = '0'; // reset before animation
          observer.observe(statEl);
        }
      });
    },
    (err) => {
      console.warn('[content-loader] loadStats error:', err.message);
    }
  );
}

/* ============================================================
   12. LIGHTBOX
   ============================================================ */

// Module-level lightbox state
let _lightboxItems = [];
let _lightboxIndex = 0;
let _lightboxEl = null;
let _filtersListenerAttached = false;

/**
 * Create the lightbox DOM once and inject it into <body>.
 * Subsequent calls return the existing element.
 * @returns {HTMLElement}
 */
function createLightboxDOM() {
  if (_lightboxEl) return _lightboxEl;

  const lb = document.createElement('div');
  lb.id = 'portfolio-lightbox';
  lb.className = 'lightbox-overlay';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.setAttribute('tabindex', '-1');
  lb.setAttribute('hidden', '');

  lb.innerHTML = `
    <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
    <button class="lightbox-prev" aria-label="Previous image">&#8249;</button>
    <button class="lightbox-next" aria-label="Next image">&#8250;</button>
    <div class="lightbox-content">
      <img class="lightbox-img" src="" alt="" />
      <p class="lightbox-caption"></p>
    </div>
  `;

  document.body.appendChild(lb);
  _lightboxEl = lb;

  // Close button
  lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);

  // Previous / Next buttons
  lb.querySelector('.lightbox-prev').addEventListener('click', (e) => {
    e.stopPropagation();
    showLightboxItem(_lightboxIndex - 1);
  });
  lb.querySelector('.lightbox-next').addEventListener('click', (e) => {
    e.stopPropagation();
    showLightboxItem(_lightboxIndex + 1);
  });

  // Click the backdrop (not the content) to close
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox();
  });

  // Keyboard navigation (global — only active when lightbox is open)
  document.addEventListener('keydown', (e) => {
    if (lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showLightboxItem(_lightboxIndex - 1);
    if (e.key === 'ArrowRight') showLightboxItem(_lightboxIndex + 1);
  });

  // Touch swipe support
  let touchStartX = 0;
  lb.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      // Swipe left → next; swipe right → previous
      if (dx < 0) showLightboxItem(_lightboxIndex + 1);
      else showLightboxItem(_lightboxIndex - 1);
    }
  }, { passive: true });

  return lb;
}

/**
 * Display a specific item in the open lightbox.
 * Wraps around at both ends.
 * @param {number} index
 */
function showLightboxItem(index) {
  if (!_lightboxEl || !_lightboxItems.length) return;

  // Wrap-around navigation
  _lightboxIndex = (index + _lightboxItems.length) % _lightboxItems.length;

  const item = _lightboxItems[_lightboxIndex];
  const img = _lightboxEl.querySelector('.lightbox-img');
  const caption = _lightboxEl.querySelector('.lightbox-caption');

  img.src = item.imageUrl || '';
  img.alt = item.title || '';
  caption.textContent = item.title || '';

  // Hide nav arrows when there is only one item
  const showNav = _lightboxItems.length > 1;
  _lightboxEl.querySelector('.lightbox-prev').style.display = showNav ? '' : 'none';
  _lightboxEl.querySelector('.lightbox-next').style.display = showNav ? '' : 'none';
}

/**
 * Open the lightbox at the specified index.
 * @param {number} index
 */
function openLightbox(index) {
  const lb = createLightboxDOM();
  lb.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  showLightboxItem(index);
  lb.focus(); // move focus into dialog for keyboard users
}

/**
 * Close the lightbox and restore page scroll.
 */
function closeLightbox() {
  if (!_lightboxEl) return;
  _lightboxEl.setAttribute('hidden', '');
  document.body.style.overflow = '';
}

/**
 * Initialise the lightbox with an array of portfolio items.
 * Attaches delegated click + keyboard handlers to .portfolio-item elements.
 *
 * @param {Array<{imageUrl: string, title: string}>} items
 */
export function initLightbox(items) {
  _lightboxItems = Array.isArray(items) ? items : [];
  createLightboxDOM();

  if (_filtersListenerAttached) return; // prevent duplicate listeners
  _filtersListenerAttached = true;

  // Delegated click handler — works for dynamically rendered items
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.portfolio-item');
    if (!item) return;
    const index = parseInt(item.dataset.index, 10);
    if (!isNaN(index)) openLightbox(index);
  });

  // Keyboard activation (Enter / Space) for accessibility
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('.portfolio-item');
    if (!item) return;
    e.preventDefault();
    const index = parseInt(item.dataset.index, 10);
    if (!isNaN(index)) openLightbox(index);
  });
}

/* ============================================================
   13. AUTO-INIT (Default Export)
   ============================================================ */

/**
 * Auto-detect which page is loaded by checking for specific element IDs,
 * then call the appropriate content loaders.
 *
 * Usage in any page script:
 *   import initContentLoader from './js/content-loader.js';
 *   document.addEventListener('DOMContentLoaded', initContentLoader);
 *
 * Or for selective loading, import named exports directly:
 *   import { loadServicesSection } from './js/content-loader.js';
 */
function initContentLoader() {
  // ── Hero ────────────────────────────────────────────────────
  if (el('hero-headline') || el('hero-cta-primary')) {
    loadHeroContent();
  }

  // ── About ───────────────────────────────────────────────────
  if (el('founder-name') || el('about-story')) {
    loadAboutContent();
  }

  // ── Stats counters ──────────────────────────────────────────
  if (
    el('stat-clients') ||
    el('stat-projects') ||
    el('stat-years') ||
    el('stat-awards')
  ) {
    loadStats();
  }

  // ── Services ────────────────────────────────────────────────
  if (el('services-grid')) {
    loadServicesSection('services-grid');
  }

  // ── Portfolio + filters + lightbox ──────────────────────────
  if (el('portfolio-grid')) {
    loadPortfolio('portfolio-grid').then((items) => {
      if (items.length) initLightbox(items);
    });
    if (el('portfolio-filters')) {
      initPortfolioFilters('portfolio-filters', 'portfolio-grid');
    }
  }

  // ── Videos ──────────────────────────────────────────────────
  if (el('videos-grid')) {
    loadVideosSection('videos-grid');
  }

  // ── Crew ────────────────────────────────────────────────────
  if (el('crew-grid')) {
    loadCrewSection('crew-grid');
  }

  // ── Testimonials ─────────────────────────────────────────────
  if (el('testimonials-grid')) {
    loadTestimonials('testimonials-grid');
  }

  // ── Clients marquee ─────────────────────────────────────────
  if (el('clients-marquee')) {
    loadClients('clients-marquee');
  }

  // ── Pricing ──────────────────────────────────────────────────
  if (el('pricing-grid')) {
    loadPricing('pricing-grid');
  }
}

export default initContentLoader;
