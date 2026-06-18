/**
 * Cornel Media Productions — Admin Dashboard JavaScript
 * Firebase-powered CMS with full CRUD for all sections.
 */

import {
  db, auth,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
  signOut, onAuthStateChanged
} from '../js/firebase-config.js';

// ══ Cloudinary Config (image uploads — free, no card needed) ══
const CLOUDINARY_CLOUD_NAME = 'davbbwdbm';
const CLOUDINARY_UPLOAD_PRESET = 'cornelmedia_uploads';

// ══ Global State ══════════════════════════════════════════
let currentSection = 'overview';
let currentEditId = null;
let deleteCallback = null;
let portfolioItems = [];
let portfolioFilter = 'all';
let unsubscribers = {};  // Firestore listeners to clean up

// ══ AUTH GUARD ════════════════════════════════════════════
onAuthStateChanged(auth, (user) => {
  const gate = document.getElementById('authGate');
  const shell = document.getElementById('adminShell');
  if (!user) {
    window.location.href = 'index.html';
    return;
  }
  if (gate) gate.style.display = 'none';
  if (shell) shell.style.display = 'grid';
  const emailEl = document.getElementById('userEmail');
  if (emailEl) emailEl.textContent = user.email;
  initDashboard();
});

// ══ INIT ══════════════════════════════════════════════════
function initDashboard() {
  setupSidebarNav();
  setupMobileMenu();
  setupLogout();
  initToastContainer();
  loadOverviewStats();
  switchSection('overview');
}

// ══ NAVIGATION ════════════════════════════════════════════
function setupSidebarNav() {
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });
}

window.switchSection = function(sectionId) {
  currentSection = sectionId;
  // Update sidebar active state
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
  if (activeLink) activeLink.classList.add('active');
  // Update section visibility
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  const section = document.getElementById(`sec-${sectionId}`);
  if (section) section.classList.add('active');
  // Update topbar title
  const titles = {
    overview: 'Dashboard', hero: 'Hero Section', about: 'About & Story',
    crew: 'Our Crew', portfolio: 'Portfolio', videos: 'YouTube Videos',
    services: 'Services', pricing: 'Pricing Plans', testimonials: 'Testimonials',
    clients: 'Clients & Logos', stats: 'Site Stats', siteinfo: 'Site Settings'
  };
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = titles[sectionId] || sectionId;
  // Close mobile sidebar
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.remove('open');
  // Load section
  loadSection(sectionId);
};

function loadSection(id) {
  // Unsubscribe previous listener for this section to avoid duplicates
  if (unsubscribers[id]) { unsubscribers[id](); delete unsubscribers[id]; }
  switch (id) {
    case 'overview':    loadOverviewStats(); break;
    case 'hero':        loadHero(); break;
    case 'about':       loadAbout(); break;
    case 'crew':        loadCrew(); break;
    case 'portfolio':   loadPortfolio(); break;
    case 'videos':      loadVideos(); break;
    case 'services':    loadServices(); break;
    case 'pricing':     loadPricing(); break;
    case 'testimonials': loadTestimonials(); break;
    case 'clients':     loadClients(); break;
    case 'stats':       loadStats(); break;
    case 'siteinfo':    loadSiteInfo(); break;
  }
}

// ══ MOBILE MENU ═══════════════════════════════════════════
function setupMobileMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const sidebar = document.getElementById('sidebar');
  const closeBtn = document.getElementById('sidebarClose');
  if (menuBtn) menuBtn.addEventListener('click', () => sidebar?.classList.toggle('open'));
  if (closeBtn) closeBtn.addEventListener('click', () => sidebar?.classList.remove('open'));
  // Overlay tap to close
  document.addEventListener('click', (e) => {
    if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuBtn) {
      sidebar.classList.remove('open');
    }
  });
}

// ══ LOGOUT ════════════════════════════════════════════════
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try { await signOut(auth); } catch (e) {}
      window.location.href = 'index.html';
    });
  }
}

// ══ TOAST ═════════════════════════════════════════════════
function initToastContainer() {
  if (!document.getElementById('toastContainer')) {
    const el = document.createElement('div');
    el.id = 'toastContainer';
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
}

window.showToast = function(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: 'fas fa-check-circle', error: 'fas fa-times-circle', info: 'fas fa-info-circle' };
  toast.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${msg}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 350);
  }, duration);
};

// ══ CONFIRM DELETE MODAL ══════════════════════════════════
window.showDeleteConfirm = function(message, onConfirm) {
  deleteCallback = onConfirm;
  const modal = document.getElementById('deleteModal');
  const msg = document.getElementById('deleteModalMsg') || document.getElementById('deleteModalText');
  if (msg) msg.textContent = message;
  if (modal) modal.style.display = 'flex';
};

window.closeDeleteModal = function() {
  const modal = document.getElementById('deleteModal');
  if (modal) modal.style.display = 'none';
  deleteCallback = null;
};

window.confirmDelete = function() {
  if (typeof deleteCallback === 'function') deleteCallback();
  closeDeleteModal();
};

// ══ OVERVIEW ══════════════════════════════════════════════
async function loadOverviewStats() {
  const counts = { crew: 0, portfolio: 0, videos: 0, services: 0 };
  try {
    const colls = ['crew', 'portfolio', 'videos', 'services'];
    await Promise.all(colls.map(async (c) => {
      const snap = await getDocs(collection(db, c));
      counts[c] = snap.size;
    }));
  } catch (e) { /* offline or not configured */ }
  const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  el('ov-crew', counts.crew);
  el('ov-portfolio', counts.portfolio);
  el('ov-videos', counts.videos);
  el('ov-services', counts.services);
}

// ══ HERO ══════════════════════════════════════════════════
async function loadHero() {
  try {
    const docSnap = await getDoc(doc(db, 'config', 'hero'));
    if (docSnap.exists()) {
      const d = docSnap.data();
      const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = val || ''; };
      set('heroHeadline', d.headline);
      set('heroSubtitle', d.subtitle);
      set('heroDescription', d.description);
      set('heroCtaPrimaryText', d.ctaPrimaryText);
      set('heroCtaPrimaryHref', d.ctaPrimaryHref);
      set('heroCtaSecondaryText', d.ctaSecondaryText);
      set('heroCtaSecondaryHref', d.ctaSecondaryHref);
    }
  } catch (e) { showToast('Could not load hero data', 'error'); }
}

window.saveHero = async function() {
  const btn = document.getElementById('saveHeroBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  try {
    await setDoc(doc(db, 'config', 'hero'), {
      headline: get('heroHeadline'),
      subtitle: get('heroSubtitle'),
      description: get('heroDescription'),
      ctaPrimaryText: get('heroCtaPrimaryText'),
      ctaPrimaryHref: get('heroCtaPrimaryHref'),
      ctaSecondaryText: get('heroCtaSecondaryText'),
      ctaSecondaryHref: get('heroCtaSecondaryHref'),
      updatedAt: serverTimestamp()
    });
    showToast('Hero saved!', 'success');
  } catch (e) { showToast('Error saving hero: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Changes'; }
};

// ══ ABOUT ═════════════════════════════════════════════════
async function loadAbout() {
  try {
    const docSnap = await getDoc(doc(db, 'config', 'about'));
    if (docSnap.exists()) {
      const d = docSnap.data();
      const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = val || ''; };
      set('founderName', d.founderName);
      set('founderTitle', d.founderTitle);
      set('founderBio', d.founderBio);
      set('aboutStory', d.story);
      set('aboutMission', d.mission);
      if (d.founderPhoto) {
        const preview = document.getElementById('founderPhotoPreview');
        if (preview) { preview.src = d.founderPhoto; preview.style.display = 'block'; }
      }
    }
  } catch (e) { showToast('Could not load About data', 'error'); }
}

window.saveAbout = async function() {
  const btn = document.getElementById('saveAboutBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  try {
    const data = {
      founderName: get('founderName'),
      founderTitle: get('founderTitle'),
      founderBio: get('founderBio'),
      story: get('aboutStory'),
      mission: get('aboutMission'),
      updatedAt: serverTimestamp()
    };
    // Upload founder photo if selected
    const fileInput = document.getElementById('founderPhotoInput');
    if (fileInput?.files[0]) {
      const url = await uploadFile(fileInput.files[0], 'about/founder');
      data.founderPhoto = url;
    }
    await setDoc(doc(db, 'config', 'about'), data, { merge: true });
    showToast('About saved!', 'success');
  } catch (e) { showToast('Error saving about: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Changes'; }
};

// ══ CREW ══════════════════════════════════════════════════
async function loadCrew() {
  const container = document.getElementById('crewList');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:80px;border-radius:10px"></div>'.repeat(3);
  try {
    const q = query(collection(db, 'crew'), orderBy('order'));
    const snap = await getDocs(q);
    renderCrewList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>No crew members yet. Add one below.</p></div>`; }
}

function renderCrewList(members) {
  const container = document.getElementById('crewList');
  if (!container) return;
  if (!members.length) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>No crew members yet.</p></div>`;
    return;
  }
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'items-grid';
  members.forEach(m => {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-card-img">${m.photoUrl ? `<img src="${m.photoUrl}" alt="${m.name}" style="width:100%;height:100%;object-fit:cover">` : `<div style="width:80px;height:80px;border-radius:50%;background:rgba(232,160,48,0.15);display:flex;align-items:center;justify-content:center;font-size:2rem;color:#E8A030">${(m.name||'?')[0]}</div>`}</div>
      <div class="item-card-body">
        <div class="item-card-name">${m.name||'—'}</div>
        <div class="item-card-meta">${m.role||''}</div>
        <div class="item-card-bio">${m.bio||''}</div>
      </div>
      <div class="item-card-actions">
        <button class="btn-icon btn-icon-edit" onclick="editCrew('${m.id}')" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn-icon btn-icon-delete" onclick="deleteCrew('${m.id}', '${(m.name||'').replace(/'/g,"\\'")}', '${m.photoUrl||''}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>`;
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

window.editCrew = async function(id) {
  currentEditId = id;
  try {
    const snap = await getDoc(doc(db, 'crew', id));
    if (!snap.exists()) return;
    const d = snap.data();
    const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val || ''; };
    set('crewName', d.name); set('crewRole', d.role); set('crewBio', d.bio); set('crewOrder', d.order ?? 0);
    const preview = document.getElementById('crewPhotoPreview');
    if (preview) { if (d.photoUrl) { preview.src = d.photoUrl; preview.style.display = 'block'; } else { preview.style.display = 'none'; } }
    document.getElementById('crewFormTitle').textContent = 'Edit Crew Member';
    document.getElementById('crewFormSection').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast('Could not load crew member', 'error'); }
};

window.cancelCrewEdit = function() {
  currentEditId = null;
  ['crewName','crewRole','crewBio'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  const order = document.getElementById('crewOrder'); if (order) order.value = '0';
  const preview = document.getElementById('crewPhotoPreview'); if (preview) preview.style.display = 'none';
  document.getElementById('crewFormTitle').textContent = 'Add Crew Member';
};

window.saveCrew = async function() {
  const btn = document.getElementById('saveCrewBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  try {
    const data = {
      name: get('crewName'),
      role: get('crewRole'),
      bio: get('crewBio'),
      order: parseInt(get('crewOrder')) || 0,
      updatedAt: serverTimestamp()
    };
    if (!data.name) throw new Error('Name is required');
    const fileInput = document.getElementById('crewPhotoInput');
    if (fileInput?.files[0]) {
      data.photoUrl = await uploadFile(fileInput.files[0], `crew/${Date.now()}`);
    } else if (currentEditId) {
      // Keep existing photo
      const snap = await getDoc(doc(db, 'crew', currentEditId));
      if (snap.exists() && snap.data().photoUrl) data.photoUrl = snap.data().photoUrl;
    }
    if (currentEditId) {
      await updateDoc(doc(db, 'crew', currentEditId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'crew'), data);
    }
    showToast(currentEditId ? 'Crew member updated!' : 'Crew member added!', 'success');
    cancelCrewEdit();
    loadCrew();
  } catch (e) { showToast('Error saving: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Member'; }
};

window.deleteCrew = function(id, name, photoUrl) {
  showDeleteConfirm(`Delete "${name}" from the crew? This cannot be undone.`, async () => {
    try {
      await deleteDoc(doc(db, 'crew', id));
      if (photoUrl) { try { await deleteObject(ref(storage, photoUrl)); } catch(_) {} }
      showToast('Crew member deleted', 'info');
      loadCrew();
    } catch (e) { showToast('Error deleting: ' + e.message, 'error'); }
  });
};

// ══ PORTFOLIO ═════════════════════════════════════════════
async function loadPortfolio() {
  const container = document.getElementById('portfolioAdminGrid');
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="aspect-ratio:2/3;border-radius:10px"></div>'.repeat(6);
  try {
    const q = query(collection(db, 'portfolio'), orderBy('order'));
    const snap = await getDocs(q);
    portfolioItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPortfolioGrid(portfolioItems);
    // Build category filter
    const cats = [...new Set(portfolioItems.map(i => i.category).filter(Boolean))];
    const filterContainer = document.getElementById('portfolioFilterTabs');
    if (filterContainer) {
      filterContainer.innerHTML = `<button class="filter-tab active" onclick="filterPortfolioAdmin('all')">All (${portfolioItems.length})</button>` +
        cats.map(c => `<button class="filter-tab" onclick="filterPortfolioAdmin('${c}')">${c}</button>`).join('');
    }
  } catch (e) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-images"></i><p>No portfolio items. Upload some below.</p></div>`;
  }
}

function renderPortfolioGrid(items) {
  const container = document.getElementById('portfolioAdminGrid');
  if (!container) return;
  const filtered = portfolioFilter === 'all' ? items : items.filter(i => i.category === portfolioFilter);
  if (!filtered.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-images"></i><p>No items in this category.</p></div>`;
    return;
  }
  container.innerHTML = '';
  filtered.forEach(item => {
    const el = document.createElement('div');
    el.className = 'portfolio-admin-item';
    el.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.title||''}" loading="lazy">
      ${item.category ? `<div class="portfolio-admin-badge">${item.category}</div>` : ''}
      <div class="portfolio-admin-overlay">
        <button class="btn-icon btn-icon-edit" onclick="editPortfolioItem('${item.id}')" title="Edit"><i class="fas fa-edit"></i></button>
        <button class="btn-icon btn-icon-delete" onclick="deletePortfolioItem('${item.id}', '${(item.title||'').replace(/'/g,"\\'")}', '${item.imageUrl||''}')" title="Delete"><i class="fas fa-trash"></i></button>
      </div>`;
    container.appendChild(el);
  });
}

window.filterPortfolioAdmin = function(category) {
  portfolioFilter = category;
  document.querySelectorAll('#portfolioFilterTabs .filter-tab').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  renderPortfolioGrid(portfolioItems);
};

window.editPortfolioItem = async function(id) {
  currentEditId = id;
  try {
    const snap = await getDoc(doc(db, 'portfolio', id));
    if (!snap.exists()) return;
    const d = snap.data();
    const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val || ''; };
    set('portfolioTitle', d.title); set('portfolioCategory', d.category); set('portfolioOrder', d.order ?? 0);
    document.getElementById('portfolioFormTitle').textContent = 'Edit Portfolio Item';
    document.getElementById('portfolioFormSection').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast('Could not load item', 'error'); }
};

window.cancelPortfolioEdit = function() {
  currentEditId = null;
  ['portfolioTitle','portfolioCategory'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  const order = document.getElementById('portfolioOrder'); if (order) order.value = '0';
  document.getElementById('portfolioFormTitle').textContent = 'Add Portfolio Item';
};

window.savePortfolioItem = async function() {
  const btn = document.getElementById('savePortfolioBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  const fileInput = document.getElementById('portfolioImageInput');
  try {
    let imageUrl = '';
    if (currentEditId) {
      const snap = await getDoc(doc(db, 'portfolio', currentEditId));
      if (snap.exists()) imageUrl = snap.data().imageUrl || '';
    }
    if (fileInput?.files[0]) {
      imageUrl = await uploadFile(fileInput.files[0], `portfolio/${Date.now()}`);
    }
    if (!imageUrl) throw new Error('Please select an image');
    const data = {
      title: get('portfolioTitle'),
      category: get('portfolioCategory'),
      order: parseInt(get('portfolioOrder')) || 0,
      imageUrl,
      updatedAt: serverTimestamp()
    };
    if (currentEditId) {
      await updateDoc(doc(db, 'portfolio', currentEditId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'portfolio'), data);
    }
    showToast(currentEditId ? 'Portfolio item updated!' : 'Portfolio item added!', 'success');
    cancelPortfolioEdit();
    loadPortfolio();
  } catch (e) { showToast('Error saving: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Item'; }
};

// Batch upload for portfolio
window.handlePortfolioBatchUpload = async function(input) {
  if (!input.files.length) return;
  const files = Array.from(input.files);
  const category = document.getElementById('batchCategory')?.value || '';
  const queue = document.getElementById('batchQueue');
  if (queue) queue.innerHTML = '';
  let order = portfolioItems.length;

  for (const file of files) {
    const itemEl = document.createElement('div');
    itemEl.className = 'upload-queue-item';
    const thumbUrl = URL.createObjectURL(file);
    itemEl.innerHTML = `
      <img class="upload-queue-thumb" src="${thumbUrl}" alt="${file.name}">
      <div class="upload-queue-info">
        <div class="upload-queue-name">${file.name}</div>
        <div class="upload-queue-progress-bar"><div class="upload-queue-progress-fill" style="width:0%"></div></div>
        <div class="upload-queue-status">Uploading...</div>
      </div>`;
    if (queue) queue.appendChild(itemEl);
    const fill = itemEl.querySelector('.upload-queue-progress-fill');
    const status = itemEl.querySelector('.upload-queue-status');
    try {
      if (fill) fill.style.width = '30%';
      const url = await uploadFile(file, 'portfolio');
      if (fill) fill.style.width = '80%';
      await addDoc(collection(db, 'portfolio'), { imageUrl: url, title: file.name.replace(/\.\w+$/, ''), category, order: order++, createdAt: serverTimestamp() });
      if (fill) fill.style.width = '100%';
      if (status) { status.textContent = '\u2713 Done'; status.style.color = '#22c55e'; }
    } catch (e) {
      if (status) { status.textContent = '✗ Error: ' + e.message; status.style.color = '#ef4444'; }
    }
  }
  showToast(`${files.length} item(s) uploaded!`, 'success');
  loadPortfolio();
};

window.deletePortfolioItem = function(id, title, imageUrl) {
  showDeleteConfirm(`Delete "${title}" from portfolio?`, async () => {
    try {
      await deleteDoc(doc(db, 'portfolio', id));
      // Note: Cloudinary files can be managed directly in your Cloudinary dashboard
      showToast('Portfolio item deleted', 'info');
      loadPortfolio();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
  });
};

// ══ VIDEOS ════════════════════════════════════════════════
async function loadVideos() {
  const container = document.getElementById('videosList');
  if (!container) return;
  container.innerHTML = '';
  try {
    const q = query(collection(db, 'videos'), orderBy('order'));
    const snap = await getDocs(q);
    const videos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!videos.length) {
      container.innerHTML = `<div class="empty-state"><i class="fab fa-youtube"></i><p>No videos yet. Add a YouTube video ID below.</p></div>`;
      return;
    }
    container.className = 'items-list';
    videos.forEach(v => {
      const el = document.createElement('div');
      el.className = 'list-item';
      el.innerHTML = `
        <div class="list-item-icon"><i class="fab fa-youtube" style="color:#ff0000"></i></div>
        <div class="list-item-info">
          <div class="list-item-title">${v.title||'Untitled'}</div>
          <div class="list-item-meta">ID: ${v.youtubeId||'—'} &nbsp;·&nbsp; Order: ${v.order ?? 0}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-icon btn-icon-edit" onclick="editVideo('${v.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-icon-delete" onclick="deleteVideo('${v.id}', '${(v.title||'').replace(/'/g,"\\'")}' )" title="Delete"><i class="fas fa-trash"></i></button>
        </div>`;
      container.appendChild(el);
    });
  } catch (e) { container.innerHTML = `<div class="empty-state"><i class="fab fa-youtube"></i><p>Could not load videos.</p></div>`; }
}

window.editVideo = async function(id) {
  currentEditId = id;
  try {
    const snap = await getDoc(doc(db, 'videos', id));
    if (!snap.exists()) return;
    const d = snap.data();
    const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val || ''; };
    set('videoTitle', d.title); set('videoYoutubeId', d.youtubeId); set('videoDescription', d.description); set('videoOrder', d.order ?? 0);
    // Update preview
    if (d.youtubeId) updateYouTubePreview(d.youtubeId);
    document.getElementById('videoFormTitle').textContent = 'Edit Video';
    document.getElementById('videoFormSection').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast('Could not load video', 'error'); }
};

window.updateYouTubePreview = function(idOrUrl) {
  const preview = document.getElementById('ytPreview');
  if (!preview) return;
  let ytId = idOrUrl;
  // Extract ID from URL
  const match = idOrUrl.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  if (match) ytId = match[1];
  if (ytId.length === 11) {
    preview.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  }
};

window.cancelVideoEdit = function() {
  currentEditId = null;
  ['videoTitle','videoYoutubeId','videoDescription'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  const order = document.getElementById('videoOrder'); if (order) order.value = '0';
  const preview = document.getElementById('ytPreview'); if (preview) preview.innerHTML = '';
  document.getElementById('videoFormTitle').textContent = 'Add Video';
};

window.saveVideo = async function() {
  const btn = document.getElementById('saveVideoBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  try {
    let ytId = get('videoYoutubeId');
    const match = ytId.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
    if (match) ytId = match[1];
    if (!ytId) throw new Error('YouTube ID is required');
    const data = { title: get('videoTitle'), youtubeId: ytId, description: get('videoDescription'), order: parseInt(get('videoOrder')) || 0, updatedAt: serverTimestamp() };
    if (currentEditId) {
      await updateDoc(doc(db, 'videos', currentEditId), data);
    } else {
      data.createdAt = serverTimestamp();
      await addDoc(collection(db, 'videos'), data);
    }
    showToast(currentEditId ? 'Video updated!' : 'Video added!', 'success');
    cancelVideoEdit();
    loadVideos();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Video'; }
};

window.deleteVideo = function(id, title) {
  showDeleteConfirm(`Delete video "${title}"?`, async () => {
    try { await deleteDoc(doc(db, 'videos', id)); showToast('Video deleted', 'info'); loadVideos(); }
    catch (e) { showToast('Error: ' + e.message, 'error'); }
  });
};

// ══ SERVICES ══════════════════════════════════════════════
async function loadServices() {
  const container = document.getElementById('servicesList');
  if (!container) return;
  container.innerHTML = '';
  try {
    const q = query(collection(db, 'services'), orderBy('order'));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!items.length) { container.innerHTML = `<div class="empty-state"><i class="fas fa-concierge-bell"></i><p>No services yet.</p></div>`; return; }
    container.className = 'items-list';
    items.forEach(s => {
      const el = document.createElement('div');
      el.className = 'list-item';
      el.innerHTML = `
        <div class="list-item-icon"><i class="${s.icon||'fas fa-star'}"></i></div>
        <div class="list-item-info">
          <div class="list-item-title">${s.title||'—'}</div>
          <div class="list-item-meta">${(s.description||'').slice(0,70)}${s.description?.length > 70 ? '…' : ''}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-icon btn-icon-edit" onclick="editService('${s.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-icon-delete" onclick="deleteService('${s.id}', '${(s.title||'').replace(/'/g,"\\'")}' )" title="Delete"><i class="fas fa-trash"></i></button>
        </div>`;
      container.appendChild(el);
    });
  } catch (e) { container.innerHTML = `<div class="empty-state"><i class="fas fa-concierge-bell"></i><p>Could not load services.</p></div>`; }
}

window.editService = async function(id) {
  currentEditId = id;
  try {
    const snap = await getDoc(doc(db, 'services', id));
    if (!snap.exists()) return;
    const d = snap.data();
    const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val || ''; };
    set('serviceTitle', d.title); set('serviceIcon', d.icon); set('serviceDescription', d.description);
    set('serviceFeatures', (d.features||[]).join('\n')); set('serviceOrder', d.order ?? 0);
    document.getElementById('serviceFormTitle').textContent = 'Edit Service';
    document.getElementById('serviceFormSection').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast('Could not load service', 'error'); }
};

window.cancelServiceEdit = function() {
  currentEditId = null;
  ['serviceTitle','serviceIcon','serviceDescription','serviceFeatures'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  const order = document.getElementById('serviceOrder'); if (order) order.value = '0';
  document.getElementById('serviceFormTitle').textContent = 'Add Service';
};

window.saveService = async function() {
  const btn = document.getElementById('saveServiceBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  try {
    const featuresRaw = get('serviceFeatures');
    const features = featuresRaw ? featuresRaw.split('\n').map(f => f.trim()).filter(Boolean) : [];
    const data = { title: get('serviceTitle'), icon: get('serviceIcon') || 'fas fa-star', description: get('serviceDescription'), features, order: parseInt(get('serviceOrder')) || 0, updatedAt: serverTimestamp() };
    if (!data.title) throw new Error('Title is required');
    if (currentEditId) { await updateDoc(doc(db, 'services', currentEditId), data); }
    else { data.createdAt = serverTimestamp(); await addDoc(collection(db, 'services'), data); }
    showToast(currentEditId ? 'Service updated!' : 'Service added!', 'success');
    cancelServiceEdit(); loadServices();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Service'; }
};

window.deleteService = function(id, title) {
  showDeleteConfirm(`Delete service "${title}"?`, async () => {
    try { await deleteDoc(doc(db, 'services', id)); showToast('Service deleted', 'info'); loadServices(); }
    catch (e) { showToast('Error: ' + e.message, 'error'); }
  });
};

// ══ PRICING ═══════════════════════════════════════════════
async function loadPricing() {
  const container = document.getElementById('pricingList');
  if (!container) return;
  container.innerHTML = '';
  try {
    const q = query(collection(db, 'pricing'), orderBy('order'));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!items.length) { container.innerHTML = `<div class="empty-state"><i class="fas fa-tag"></i><p>No pricing plans yet.</p></div>`; return; }
    container.className = 'items-list';
    items.forEach(p => {
      const el = document.createElement('div');
      el.className = 'list-item';
      el.innerHTML = `
        <div class="list-item-icon"><i class="fas fa-tag" style="color:${p.featured?'#E8A030':'inherit'}"></i></div>
        <div class="list-item-info">
          <div class="list-item-title">${p.name||'—'} ${p.featured ? '<span style="color:#E8A030;font-size:0.75rem;font-weight:700"> ★ Featured</span>' : ''}</div>
          <div class="list-item-meta">GH₵${p.price||'—'} ${p.period||''}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-icon btn-icon-edit" onclick="editPricing('${p.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-icon-delete" onclick="deletePricing('${p.id}', '${(p.name||'').replace(/'/g,"\\'")}' )" title="Delete"><i class="fas fa-trash"></i></button>
        </div>`;
      container.appendChild(el);
    });
  } catch (e) { container.innerHTML = `<div class="empty-state"><i class="fas fa-tag"></i><p>Could not load pricing.</p></div>`; }
}

window.editPricing = async function(id) {
  currentEditId = id;
  try {
    const snap = await getDoc(doc(db, 'pricing', id));
    if (!snap.exists()) return;
    const d = snap.data();
    const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val ?? ''; };
    set('pricingName', d.name); set('pricingPrice', d.price); set('pricingPeriod', d.period);
    set('pricingDesc', d.description); set('pricingFeatures', (d.features||[]).join('\n')); set('pricingOrder', d.order ?? 0);
    const featuredCheck = document.getElementById('pricingFeatured');
    if (featuredCheck) featuredCheck.checked = !!d.featured;
    const ctaBtn = document.getElementById('pricingCtaText');
    if (ctaBtn) ctaBtn.value = d.ctaText || 'Get Started';
    document.getElementById('pricingFormTitle').textContent = 'Edit Pricing Plan';
    document.getElementById('pricingFormSection').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast('Could not load plan', 'error'); }
};

window.cancelPricingEdit = function() {
  currentEditId = null;
  ['pricingName','pricingPrice','pricingPeriod','pricingDesc','pricingFeatures'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  const order = document.getElementById('pricingOrder'); if (order) order.value = '0';
  const featured = document.getElementById('pricingFeatured'); if (featured) featured.checked = false;
  document.getElementById('pricingFormTitle').textContent = 'Add Pricing Plan';
};

window.savePricing = async function() {
  const btn = document.getElementById('savePricingBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  try {
    const featuresRaw = get('pricingFeatures');
    const features = featuresRaw ? featuresRaw.split('\n').map(f => f.trim()).filter(Boolean) : [];
    const data = {
      name: get('pricingName'), price: get('pricingPrice'), period: get('pricingPeriod'),
      description: get('pricingDesc'), features,
      featured: !!document.getElementById('pricingFeatured')?.checked,
      ctaText: get('pricingCtaText') || 'Get Started',
      order: parseInt(get('pricingOrder')) || 0,
      updatedAt: serverTimestamp()
    };
    if (!data.name) throw new Error('Plan name is required');
    if (currentEditId) { await updateDoc(doc(db, 'pricing', currentEditId), data); }
    else { data.createdAt = serverTimestamp(); await addDoc(collection(db, 'pricing'), data); }
    showToast(currentEditId ? 'Plan updated!' : 'Plan added!', 'success');
    cancelPricingEdit(); loadPricing();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Plan'; }
};

window.deletePricing = function(id, name) {
  showDeleteConfirm(`Delete plan "${name}"?`, async () => {
    try { await deleteDoc(doc(db, 'pricing', id)); showToast('Plan deleted', 'info'); loadPricing(); }
    catch (e) { showToast('Error: ' + e.message, 'error'); }
  });
};

// ══ TESTIMONIALS ══════════════════════════════════════════
async function loadTestimonials() {
  const container = document.getElementById('testimonialsList');
  if (!container) return;
  container.innerHTML = '';
  try {
    const q = query(collection(db, 'testimonials'), orderBy('order'));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!items.length) { container.innerHTML = `<div class="empty-state"><i class="fas fa-quote-left"></i><p>No testimonials yet.</p></div>`; return; }
    container.className = 'items-list';
    items.forEach(t => {
      const el = document.createElement('div');
      el.className = 'list-item';
      el.innerHTML = `
        <div class="list-item-icon"><i class="fas fa-quote-left"></i></div>
        <div class="list-item-info">
          <div class="list-item-title">${t.authorName||'—'} <span style="font-weight:400;color:var(--admin-text-muted)">${t.company||''}</span></div>
          <div class="list-item-meta">${(t.quote||'').slice(0,70)}${(t.quote||'').length>70?'…':''}</div>
        </div>
        <div class="list-item-actions">
          <button class="btn-icon btn-icon-edit" onclick="editTestimonial('${t.id}')" title="Edit"><i class="fas fa-edit"></i></button>
          <button class="btn-icon btn-icon-delete" onclick="deleteTestimonial('${t.id}', '${(t.authorName||'').replace(/'/g,"\\'")}' )" title="Delete"><i class="fas fa-trash"></i></button>
        </div>`;
      container.appendChild(el);
    });
  } catch (e) { container.innerHTML = `<div class="empty-state"><i class="fas fa-quote-left"></i><p>Could not load testimonials.</p></div>`; }
}

window.editTestimonial = async function(id) {
  currentEditId = id;
  try {
    const snap = await getDoc(doc(db, 'testimonials', id));
    if (!snap.exists()) return;
    const d = snap.data();
    const set = (elId, val) => { const e = document.getElementById(elId); if (e) e.value = val || ''; };
    set('testimonialAuthor', d.authorName); set('testimonialCompany', d.company); set('testimonialQuote', d.quote); set('testimonialOrder', d.order ?? 0);
    document.getElementById('testimonialFormTitle').textContent = 'Edit Testimonial';
    document.getElementById('testimonialFormSection').scrollIntoView({ behavior: 'smooth' });
  } catch (e) { showToast('Could not load testimonial', 'error'); }
};

window.cancelTestimonialEdit = function() {
  currentEditId = null;
  ['testimonialAuthor','testimonialCompany','testimonialQuote'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  const order = document.getElementById('testimonialOrder'); if (order) order.value = '0';
  document.getElementById('testimonialFormTitle').textContent = 'Add Testimonial';
};

window.saveTestimonial = async function() {
  const btn = document.getElementById('saveTestimonialBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  try {
    const data = { authorName: get('testimonialAuthor'), company: get('testimonialCompany'), quote: get('testimonialQuote'), order: parseInt(get('testimonialOrder')) || 0, updatedAt: serverTimestamp() };
    if (!data.quote) throw new Error('Quote is required');
    // Upload photo if selected
    const fileInput = document.getElementById('testimonialPhotoInput');
    if (fileInput?.files[0]) data.photoUrl = await uploadFile(fileInput.files[0], `testimonials/${Date.now()}`);
    if (currentEditId) { await updateDoc(doc(db, 'testimonials', currentEditId), data); }
    else { data.createdAt = serverTimestamp(); await addDoc(collection(db, 'testimonials'), data); }
    showToast(currentEditId ? 'Testimonial updated!' : 'Testimonial added!', 'success');
    cancelTestimonialEdit(); loadTestimonials();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Testimonial'; }
};

window.deleteTestimonial = function(id, name) {
  showDeleteConfirm(`Delete testimonial from "${name}"?`, async () => {
    try { await deleteDoc(doc(db, 'testimonials', id)); showToast('Testimonial deleted', 'info'); loadTestimonials(); }
    catch (e) { showToast('Error: ' + e.message, 'error'); }
  });
};

// ══ CLIENTS ═══════════════════════════════════════════════
async function loadClients() {
  const container = document.getElementById('clientsList');
  if (!container) return;
  container.innerHTML = '';
  try {
    const q = query(collection(db, 'clients'), orderBy('order'));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!items.length) { container.innerHTML = `<div class="empty-state"><i class="fas fa-building"></i><p>No clients yet.</p></div>`; return; }
    const grid = document.createElement('div');
    grid.className = 'clients-admin-grid';
    items.forEach(c => {
      const card = document.createElement('div');
      card.className = 'client-admin-card';
      card.innerHTML = `
        ${c.logoUrl ? `<img src="${c.logoUrl}" alt="${c.name||''}" loading="lazy">` : `<div style="font-size:1.25rem;font-weight:800;color:#333">${(c.name||'?')[0]}</div>`}
        <div class="client-admin-name">${c.name||'—'}</div>
        <div class="client-admin-actions">
          <button class="btn-icon btn-icon-delete" onclick="deleteClient('${c.id}', '${(c.name||'').replace(/'/g,"\\'")}', '${c.logoUrl||''}')" title="Delete" style="background:rgba(239,68,68,0.1);color:#ef4444"><i class="fas fa-trash"></i></button>
        </div>`;
      grid.appendChild(card);
    });
    container.appendChild(grid);
  } catch (e) { container.innerHTML = `<div class="empty-state"><i class="fas fa-building"></i><p>Could not load clients.</p></div>`; }
}

window.saveClient = async function() {
  const btn = document.getElementById('saveClientBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  try {
    const data = { name: get('clientName'), order: parseInt(get('clientOrder')) || 0, updatedAt: serverTimestamp() };
    if (!data.name) throw new Error('Client name is required');
    const fileInput = document.getElementById('clientLogoInput');
    if (fileInput?.files[0]) data.logoUrl = await uploadFile(fileInput.files[0], `clients/${Date.now()}`);
    data.createdAt = serverTimestamp();
    await addDoc(collection(db, 'clients'), data);
    showToast('Client added!', 'success');
    document.getElementById('clientName').value = ''; document.getElementById('clientOrder').value = '0';
    if (fileInput) fileInput.value = '';
    loadClients();
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Add Client'; }
};

window.deleteClient = function(id, name, logoUrl) {
  showDeleteConfirm(`Remove client "${name}"?`, async () => {
    try {
      await deleteDoc(doc(db, 'clients', id));
      if (logoUrl) { try { await deleteObject(ref(storage, logoUrl)); } catch(_) {} }
      showToast('Client removed', 'info'); loadClients();
    } catch (e) { showToast('Error: ' + e.message, 'error'); }
  });
};

// ══ STATS ═════════════════════════════════════════════════
async function loadStats() {
  try {
    const snap = await getDoc(doc(db, 'config', 'stats'));
    if (snap.exists()) {
      const d = snap.data();
      const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = val ?? ''; };
      set('statClients', d.clients); set('statProjects', d.projects); set('statYears', d.years); set('statAwards', d.awards);
    }
  } catch (e) { showToast('Could not load stats', 'error'); }
}

window.saveStats = async function() {
  const btn = document.getElementById('saveStatsBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => parseInt(document.getElementById(id)?.value) || 0;
  try {
    await setDoc(doc(db, 'config', 'stats'), {
      clients: get('statClients'), projects: get('statProjects'),
      years: get('statYears'), awards: get('statAwards'),
      updatedAt: serverTimestamp()
    });
    showToast('Stats saved!', 'success');
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Stats'; }
};

// ══ SITE INFO ═════════════════════════════════════════════
async function loadSiteInfo() {
  try {
    const snap = await getDoc(doc(db, 'config', 'siteInfo'));
    if (snap.exists()) {
      const d = snap.data();
      const set = (id, val) => { const e = document.getElementById(id); if (e) e.value = val || ''; };
      set('sitePhone', d.phone); set('siteEmail', d.email); set('siteLocation', d.location);
      set('siteWhatsapp', d.whatsapp); set('siteInstagram', d.instagram); set('siteYoutube', d.youtube);
      set('siteTiktok', d.tiktok); set('siteTwitter', d.twitter); set('siteLinkedin', d.linkedin);
    }
  } catch (e) { showToast('Could not load site info', 'error'); }
}

window.saveSiteInfo = async function() {
  const btn = document.getElementById('saveSiteInfoBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'; }
  const get = (id) => document.getElementById(id)?.value?.trim() || '';
  try {
    await setDoc(doc(db, 'config', 'siteInfo'), {
      phone: get('sitePhone'), email: get('siteEmail'), location: get('siteLocation'),
      whatsapp: get('siteWhatsapp'), instagram: get('siteInstagram'),
      youtube: get('siteYoutube'), tiktok: get('siteTiktok'),
      twitter: get('siteTwitter'), linkedin: get('siteLinkedin'),
      updatedAt: serverTimestamp()
    });
    showToast('Site info saved!', 'success');
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Save Info'; }
};

// ══ FILE UPLOAD HELPER ════════════════════════════════════
async function uploadFile(file, folder = 'cornelmedia') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  if (!res.ok) throw new Error('Image upload failed. Check your Cloudinary upload preset is set to Unsigned.');
  const data = await res.json();
  return data.secure_url;
}

// ══ IMAGE PREVIEW HELPER ══════════════════════════════════
window.previewImage = function(inputEl, previewId) {
  const preview = document.getElementById(previewId);
  if (!preview || !inputEl.files[0]) return;
  const reader = new FileReader();
  reader.onload = (e) => { preview.src = e.target.result; preview.style.display = 'block'; };
  reader.readAsDataURL(inputEl.files[0]);
};

// ══ DRAG & DROP for upload zones ══════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.upload-zone').forEach(zone => {
    const input = zone.querySelector('.upload-input');
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragging'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.classList.remove('dragging');
      if (input && e.dataTransfer.files.length) {
        const dt = new DataTransfer();
        Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
        input.files = dt.files;
        input.dispatchEvent(new Event('change'));
      }
    });
  });
});
