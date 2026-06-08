/* =============================================
   ADMIN.JS — Salon owner panel
   ============================================= */

let currentSalonId = null;

document.addEventListener('DOMContentLoaded', () => {
  renderExistingSalons();
  buildScheduleGrid();
});

// ---- SALON LIST ----
function renderExistingSalons() {
  const salons = DB.getSalons();
  const container = document.getElementById('existingSalons');

  if (!salons.length) {
    container.innerHTML = '<p style="color:var(--text-faint);font-size:0.88rem;margin-bottom:16px">No tienes salones registrados aún.</p>';
    return;
  }

  container.innerHTML = salons.map(s => {
    const logoHtml = s.logo
      ? `<img src="${s.logo}" alt="${s.name}" />`
      : `<span>💅</span>`;
    return `
      <div class="existing-salon-item" onclick="editSalon('${s.id}')">
        <div class="ex-logo">${logoHtml}</div>
        <div class="ex-info">
          <div class="ex-name">${esc(s.name)}</div>
          <div class="ex-city">${s.city || 'Sin ciudad'}</div>
        </div>
        <span class="ex-arrow">→</span>
        <button class="ex-delete" onclick="event.stopPropagation();confirmDelete('${s.id}','${esc(s.name)}')">Eliminar</button>
      </div>
    `;
  }).join('');
}

function confirmDelete(id, name) {
  if (confirm(`¿Eliminar el salón "${name}"? Esta acción no se puede deshacer.`)) {
    DB.deleteSalon(id);
    renderExistingSalons();
    showToast('Salón eliminado');
  }
}

// ---- CREATE / EDIT ----
function startCreate() {
  const name = prompt('¿Cómo se llama tu salón?');
  if (!name || !name.trim()) return;
  const salon = DB.createSalon(name.trim());
  editSalon(salon.id);
}

function editSalon(id) {
  currentSalonId = id;
  const salon = DB.getSalon(id);
  if (!salon) return;

  document.getElementById('stepSelect').style.display = 'none';
  document.getElementById('stepEdit').style.display = 'block';

  // Fill info form
  document.getElementById('editId').value = salon.id;
  document.getElementById('editName').value = salon.name || '';
  document.getElementById('editTagline').value = salon.tagline || '';
  document.getElementById('editCity').value = salon.city || '';
  document.getElementById('editAddress').value = salon.address || '';
  document.getElementById('editPhone').value = salon.phone || '';
  document.getElementById('editInstagram').value = salon.instagram || '';
  document.getElementById('editColor').value = salon.color || '#c77dff';

  // Logo
  if (salon.logo) {
    document.getElementById('logoPreview').src = salon.logo;
    document.getElementById('logoPreview').style.display = 'block';
    document.getElementById('logoPlaceholder').style.display = 'none';
  }

  // Categories
  document.querySelectorAll('#catGroup input[type="checkbox"]').forEach(cb => {
    cb.checked = (salon.categories || []).includes(cb.value);
  });

  // Schedule
  fillSchedule(salon.schedule || DB.defaultSchedule());

  // Services
  renderServicesAdmin(salon.services || []);

  // Gallery
  renderGalleryAdmin(salon.gallery || []);

  // Appointments
  renderAppointmentsAdmin();

  // Show link
  updateSalonLink(id);
}

// ---- INFO ----
function saveInfo() {
  if (!currentSalonId) return;
  const salon = DB.getSalon(currentSalonId);

  salon.name = document.getElementById('editName').value.trim();
  salon.tagline = document.getElementById('editTagline').value.trim();
  salon.city = document.getElementById('editCity').value.trim();
  salon.address = document.getElementById('editAddress').value.trim();
  salon.phone = document.getElementById('editPhone').value.trim();
  salon.instagram = document.getElementById('editInstagram').value.trim();
  salon.color = document.getElementById('editColor').value;

  salon.categories = Array.from(
    document.querySelectorAll('#catGroup input[type="checkbox"]:checked')
  ).map(cb => cb.value);

  // Schedule
  salon.schedule = readSchedule();

  DB.saveSalon(salon);
  renderExistingSalons();
  updateSalonLink(currentSalonId);
  showToast('✦ Información guardada');
}

// ---- LOGO ----
function handleLogo(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const b64 = ev.target.result;
    document.getElementById('logoPreview').src = b64;
    document.getElementById('logoPreview').style.display = 'block';
    document.getElementById('logoPlaceholder').style.display = 'none';

    const salon = DB.getSalon(currentSalonId);
    salon.logo = b64;
    DB.saveSalon(salon);
    showToast('Logo guardado');
  };
  reader.readAsDataURL(file);
}

// ---- SERVICES ----
function renderServicesAdmin(services) {
  const list = document.getElementById('servicesList');
  if (!services.length) {
    list.innerHTML = '<p style="color:var(--text-faint);font-size:0.85rem;margin-bottom:12px">Aún no hay servicios. Agrega uno abajo.</p>';
    return;
  }
  list.innerHTML = services.map(svc => `
    <div class="service-admin-item">
      <div class="svc-info">
        <strong>${esc(svc.name)}</strong>
        <span>${esc(svc.desc || '')} ${svc.duration ? '· ' + svc.duration + ' min' : ''}</span>
      </div>
      <span class="svc-price-badge">$${svc.price || 0}</span>
      <button class="svc-delete" onclick="deleteService('${svc.id}')">✕</button>
    </div>
  `).join('');
}

function addService() {
  const name = document.getElementById('svcName').value.trim();
  const desc = document.getElementById('svcDesc').value.trim();
  const price = parseFloat(document.getElementById('svcPrice').value) || 0;
  const duration = parseInt(document.getElementById('svcDuration').value) || 0;

  if (!name) { showToast('El nombre del servicio es requerido'); return; }

  const salon = DB.getSalon(currentSalonId);
  const svc = {
    id: 'svc_' + Date.now(),
    name, desc, price, duration
  };
  salon.services = [...(salon.services || []), svc];
  DB.saveSalon(salon);

  renderServicesAdmin(salon.services);
  ['svcName','svcDesc','svcPrice','svcDuration'].forEach(id => document.getElementById(id).value = '');
  showToast('Servicio agregado');
}

function deleteService(svcId) {
  const salon = DB.getSalon(currentSalonId);
  salon.services = (salon.services || []).filter(s => s.id !== svcId);
  DB.saveSalon(salon);
  renderServicesAdmin(salon.services);
  showToast('Servicio eliminado');
}

// ---- GALLERY ----
function handleGallery(e) {
  const files = Array.from(e.target.files);
  const salon = DB.getSalon(currentSalonId);

  let pending = files.length;
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      salon.gallery = [...(salon.gallery || []), ev.target.result];
      pending--;
      if (pending === 0) {
        DB.saveSalon(salon);
        renderGalleryAdmin(salon.gallery);
        showToast('Fotos agregadas');
      }
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
}

function renderGalleryAdmin(imgs) {
  const grid = document.getElementById('galleryAdminGrid');
  if (!imgs.length) {
    grid.innerHTML = '<p style="color:var(--text-faint);font-size:0.85rem">Sin fotos aún.</p>';
    return;
  }
  grid.innerHTML = imgs.map((src, i) => `
    <div class="gallery-thumb-wrap">
      <img src="${src}" alt="Foto ${i+1}" />
      <button class="gallery-remove" onclick="removeGalleryImg(${i})">✕</button>
    </div>
  `).join('');
}

function removeGalleryImg(idx) {
  const salon = DB.getSalon(currentSalonId);
  salon.gallery.splice(idx, 1);
  DB.saveSalon(salon);
  renderGalleryAdmin(salon.gallery);
  showToast('Foto eliminada');
}

// ---- SCHEDULE ----
const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

function buildScheduleGrid() {
  const grid = document.getElementById('scheduleGrid');
  grid.innerHTML = DAYS.map((day, i) => `
    <div class="schedule-day">
      <label class="day-name">
        <input type="checkbox" id="dayOpen_${i}" onchange="toggleDay(${i})" />
        ${day}
      </label>
      <input type="time" id="dayFrom_${i}" value="09:00" />
      <span class="time-sep">–</span>
      <input type="time" id="dayTo_${i}" value="19:00" />
    </div>
  `).join('');
}

function fillSchedule(schedule) {
  schedule.forEach((d, i) => {
    const cb = document.getElementById(`dayOpen_${i}`);
    const from = document.getElementById(`dayFrom_${i}`);
    const to = document.getElementById(`dayTo_${i}`);
    if (cb) cb.checked = d.open;
    if (from) from.value = d.from || '09:00';
    if (to) to.value = d.to || '19:00';
    toggleDay(i);
  });
}

function toggleDay(i) {
  const open = document.getElementById(`dayOpen_${i}`)?.checked;
  const from = document.getElementById(`dayFrom_${i}`);
  const to = document.getElementById(`dayTo_${i}`);
  if (from) from.disabled = !open;
  if (to) to.disabled = !open;
}

function readSchedule() {
  return DAYS.map((day, i) => ({
    day,
    open: document.getElementById(`dayOpen_${i}`)?.checked || false,
    from: document.getElementById(`dayFrom_${i}`)?.value || '09:00',
    to: document.getElementById(`dayTo_${i}`)?.value || '19:00'
  }));
}

// ---- APPOINTMENTS ----
function renderAppointmentsAdmin() {
  const list = document.getElementById('appointmentsAdmin');
  const appts = DB.getAppointments(currentSalonId);

  if (!appts.length) {
    list.innerHTML = '<p style="color:var(--text-faint);font-size:0.88rem">No hay citas aún.</p>';
    return;
  }

  const sorted = [...appts].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  list.innerHTML = sorted.map(a => `
    <div class="appt-admin-item" id="appt_${a.id}">
      <div class="appt-main-info">
        <strong>${esc(a.name)}</strong>
        <div class="appt-det">
          ${esc(a.service)} · ${formatDate(a.date)} · ${formatTime(a.time)}<br/>
          📞 ${esc(a.phone)} ${a.notes ? '· ' + esc(a.notes) : ''}
        </div>
      </div>
      <div class="appt-actions">
        ${a.status === 'pending' ? `
          <button class="btn-confirm" onclick="confirmAppt('${a.id}')">Confirmar</button>
          <button class="btn-reject" onclick="rejectAppt('${a.id}')">Rechazar</button>
        ` : `<span class="appt-status ${a.status}">${a.status === 'confirmed' ? 'Confirmada' : 'Rechazada'}</span>`}
      </div>
    </div>
  `).join('');
}

function confirmAppt(id) {
  DB.updateAppointment(id, { status: 'confirmed' });
  renderAppointmentsAdmin();
  showToast('Cita confirmada ✓');
}

function rejectAppt(id) {
  DB.updateAppointment(id, { status: 'rejected' });
  renderAppointmentsAdmin();
  showToast('Cita rechazada');
}

// ---- TABS ----
function switchAdmTab(name) {
  document.querySelectorAll('.adm-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.adm-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('adm-' + name)?.classList.add('active');
  document.querySelectorAll('.adm-tab').forEach(b => {
    if (b.getAttribute('onclick')?.includes(name)) b.classList.add('active');
  });

  if (name === 'appointments') renderAppointmentsAdmin();
}

// ---- LINK ----
function updateSalonLink(id) {
  const box = document.getElementById('salonLinkBox');
  const input = document.getElementById('salonLinkInput');
  const openLink = document.getElementById('salonLinkOpen');
  const url = DB.getSalonUrl(id);
  input.value = url;
  openLink.href = url;
  box.style.display = 'block';
}

function copyLink() {
  const val = document.getElementById('salonLinkInput').value;
  navigator.clipboard?.writeText(val).then(() => showToast('Enlace copiado ✓'));
}

// ---- TOAST ----
function showToast(msg) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ---- UTILS ----
function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatTime(val) {
  if (!val) return '';
  const [h, m] = val.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${suffix}`;
}
