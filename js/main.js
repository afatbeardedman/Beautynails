/* =============================================
   MAIN.JS — Landing page logic
   ============================================= */

let allSalons = [];
let activeCategory = null;
let deferredPrompt = null;

// PWA install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBanner').style.display = 'block';
});

document.getElementById('installBtn')?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  document.getElementById('installBanner').style.display = 'none';
});

// Init
document.addEventListener('DOMContentLoaded', () => {
  allSalons = DB.getSalons();
  renderFilterTags();
  renderSalons(allSalons);

  // Live search
  document.getElementById('searchInput').addEventListener('input', filterSalons);
});

function renderFilterTags() {
  const cats = new Set();
  allSalons.forEach(s => (s.categories || []).forEach(c => cats.add(c)));
  const container = document.getElementById('filterTags');
  container.innerHTML = '';

  const allBtn = makeTag('Todos', null);
  allBtn.classList.add('active');
  container.appendChild(allBtn);

  cats.forEach(c => container.appendChild(makeTag(c, c)));
}

function makeTag(label, cat) {
  const btn = document.createElement('button');
  btn.className = 'filter-tag';
  btn.textContent = label;
  btn.onclick = () => {
    document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = cat;
    filterSalons();
  };
  return btn;
}

function filterSalons() {
  const q = (document.getElementById('searchInput').value || '').toLowerCase();
  let filtered = allSalons;

  if (activeCategory) {
    filtered = filtered.filter(s => (s.categories || []).includes(activeCategory));
  }
  if (q) {
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.tagline || '').toLowerCase().includes(q) ||
      (s.categories || []).some(c => c.toLowerCase().includes(q))
    );
  }
  renderSalons(filtered);
}

function renderSalons(list) {
  const grid = document.getElementById('salonsGrid');
  const empty = document.getElementById('emptyState');

  if (!list.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = list.map(salon => {
    const url = DB.getSalonUrl(salon.id);
    const logoHtml = salon.logo
      ? `<img src="${salon.logo}" alt="${salon.name}" />`
      : `<span style="font-size:1.6rem">💅</span>`;
    const tags = (salon.categories || []).slice(0,3).map(c =>
      `<span class="card-tag">${c}</span>`
    ).join('');

    const accentStyle = salon.color
      ? `background: linear-gradient(135deg, ${salon.color}33, ${salon.color}11);`
      : `background: linear-gradient(135deg, #261540, #160c2a);`;

    return `
      <a class="salon-card" href="${url}">
        <div class="card-banner" style="${accentStyle}">
          <div class="card-logo">${logoHtml}</div>
        </div>
        <div class="card-body">
          <div class="card-name">${esc(salon.name)}</div>
          <div class="card-tagline">${esc(salon.tagline || '')}</div>
          <div class="card-tags">${tags}</div>
          <div class="card-footer">
            <span>${salon.city ? '📍 ' + esc(salon.city) : ''}</span>
            <span class="card-book-btn">Reservar ✦</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
