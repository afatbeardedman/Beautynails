/* =============================================
   SALON.JS — Individual salon page
   ============================================= */

let currentSalon = null;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.body.innerHTML = '<div style="padding:100px 20px;text-align:center;color:#9b87c0;font-family:sans-serif"><h2>Salón no encontrado</h2><a href="index.html" style="color:#c77dff">← Volver al inicio</a></div>';
    return;
  }

  currentSalon = DB.getSalon(id);
  if (!currentSalon) {
    document.body.innerHTML = '<div style="padding:100px 20px;text-align:center;color:#9b87c0;font-family:sans-serif"><h2>Salón no encontrado</h2><a href="index.html" style="color:#c77dff">← Volver al inicio</a></div>';
    return;
  }

  populatePage();
  populateBookingForm();

  // Update page title
  document.title = `${currentSalon.name} — GlowBook`;

  // Update theme-color to salon color
  if (currentSalon.color) {
    document.querySelector('meta[name="theme-color"]').setAttribute('content', currentSalon.color);
  }

  // Set min date for booking
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bkDate').min = today;

  // Generate time slots
  populateTimeSlots();
});

function populatePage() {
  const s = currentSalon;

  // Hero background color
  const bg = document.getElementById('salonBg');
  bg.style.background = `linear-gradient(135deg, ${s.color || '#261540'}44, var(--bg-2))`;

  // Logo
  if (s.logo) {
    document.getElementById('salonLogoImg').src = s.logo;
    document.getElementById('salonLogoImg').style.display = 'block';
    document.getElementById('salonLogoFallback').style.display = 'none';
  } else {
    document.getElementById('salonLogoFallback').textContent = '💅';
  }

  // Accent color on logo wrap
  document.getElementById('salonLogoWrap').style.borderColor = s.color || '#c77dff';

  // Text
  document.getElementById('salonName').textContent = s.name;
  document.getElementById('salonTagline').textContent = s.tagline || '';

  // Badges
  const badges = document.getElementById('salonBadges');
  badges.innerHTML = (s.categories || []).map(c =>
    `<span class="salon-badge">${c}</span>`
  ).join('');

  // Contact
  const contact = document.getElementById('salonContact');
  let links = [];
  if (s.phone) links.push(`<a href="tel:${s.phone}">📞 ${s.phone}</a>`);
  if (s.phone) links.push(`<a href="https://wa.me/${s.phone.replace(/\D/g,'')}" target="_blank">💬 WhatsApp</a>`);
  if (s.instagram) links.push(`<a href="https://instagram.com/${s.instagram}" target="_blank">📷 @${s.instagram}</a>`);
  if (s.address) links.push(`<a href="https://maps.google.com/?q=${encodeURIComponent(s.address + ' ' + (s.city||''))}" target="_blank">📍 ${s.address}</a>`);
  contact.innerHTML = links.join('');

  // Services
  renderServices();

  // Gallery
  renderGallery();
}

function renderServices() {
  const grid = document.getElementById('servicesGrid');
  const services = currentSalon.services || [];

  if (!services.length) {
    grid.innerHTML = '<p style="color:var(--text-faint);padding:40px 0;text-align:center">Este salón aún no ha agregado servicios.</p>';
    return;
  }

  grid.innerHTML = services.map(svc => `
    <div class="service-card">
      <div class="service-name">${esc(svc.name)}</div>
      <div class="service-desc">${esc(svc.desc || '')}</div>
      <div class="service-footer">
        <div>
          <span class="service-price">$${svc.price || 0}</span>
          ${svc.duration ? `<span class="service-duration"> · ${svc.duration} min</span>` : ''}
        </div>
        <button class="service-book-btn" onclick="quickBook('${esc(svc.name)}')">Reservar →</button>
      </div>
    </div>
  `).join('');
}

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  const imgs = currentSalon.gallery || [];

  if (!imgs.length) {
    grid.innerHTML = '<p class="placeholder-text">La dueña del salón aún no ha agregado fotos.</p>';
    return;
  }

  grid.innerHTML = imgs.map((src, i) =>
    `<img src="${src}" alt="Trabajo ${i+1}" onclick="openLightbox('${src}')" loading="lazy" />`
  ).join('');
}

function quickBook(serviceName) {
  showTab('booking');
  document.getElementById('bkService').value = serviceName;
  document.querySelector('.tabs-bar').scrollIntoView({ behavior: 'smooth' });
}

function showTab(name) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name)?.classList.add('active');
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(b => {
    if (b.getAttribute('onclick')?.includes(name)) b.classList.add('active');
  });
}

function populateBookingForm() {
  const sel = document.getElementById('bkService');
  const services = currentSalon.services || [];
  services.forEach(svc => {
    const opt = document.createElement('option');
    opt.value = svc.name;
    opt.textContent = `${svc.name} — $${svc.price}`;
    sel.appendChild(opt);
  });
}

function populateTimeSlots() {
  const sel = document.getElementById('bkTime');
  const schedule = currentSalon.schedule || [];

  // Default hours 9am–7pm every 30 min
  for (let h = 9; h < 19; h++) {
    ['00', '30'].forEach(m => {
      const val = `${String(h).padStart(2,'0')}:${m}`;
      const label = formatTime(val);
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = label;
      sel.appendChild(opt);
    });
  }

  // Filter by selected day's schedule
  document.getElementById('bkDate').addEventListener('change', (e) => {
    const date = new Date(e.target.value + 'T12:00:00');
    const dayIndex = (date.getDay() + 6) % 7; // Mon=0
    const daySchedule = schedule[dayIndex];

    sel.innerHTML = '<option value="">— Selecciona hora —</option>';
    if (!daySchedule || !daySchedule.open) {
      sel.innerHTML = '<option value="">Cerrado este día</option>';
      return;
    }

    const [fromH, fromM] = daySchedule.from.split(':').map(Number);
    const [toH, toM] = daySchedule.to.split(':').map(Number);
    const fromMins = fromH * 60 + fromM;
    const toMins = toH * 60 + toM;

    for (let m = fromMins; m < toMins; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const val = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = formatTime(val);
      sel.appendChild(opt);
    }
  });
}

function formatTime(val) {
  const [h, m] = val.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2,'0')} ${suffix}`;
}

function submitBooking() {
  const name = document.getElementById('bkName').value.trim();
  const phone = document.getElementById('bkPhone').value.trim();
  const service = document.getElementById('bkService').value;
  const date = document.getElementById('bkDate').value;
  const time = document.getElementById('bkTime').value;
  const notes = document.getElementById('bkNotes').value.trim();
  const msg = document.getElementById('bookingMsg');

  if (!name || !phone || !service || !date || !time) {
    showMsg(msg, 'Por favor completa todos los campos requeridos.', 'error');
    return;
  }

  DB.createAppointment(currentSalon.id, { name, phone, service, date, time, notes });

  showMsg(msg, `✦ ¡Cita agendada! ${name}, te esperamos el ${formatDate(date)} a las ${formatTime(time)} para ${service}.`, 'success');

  // Clear form
  ['bkName','bkPhone','bkNotes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('bkService').selectedIndex = 0;
  document.getElementById('bkDate').value = '';
  document.getElementById('bkTime').selectedIndex = 0;

  // WhatsApp notification
  if (currentSalon.phone) {
    const waText = encodeURIComponent(`Hola! Acabo de agendar una cita en GlowBook:\n👤 ${name}\n✂️ ${service}\n📅 ${formatDate(date)} a las ${formatTime(time)}${notes ? '\n📝 ' + notes : ''}`);
    const waUrl = `https://wa.me/${currentSalon.phone.replace(/\D/g,'')}?text=${waText}`;
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = '📲 Confirmar por WhatsApp →';
      link.style.cssText = 'display:block;margin-top:12px;color:#25d366;font-size:0.9rem;text-align:center;';
      msg.appendChild(link);
    }, 500);
  }
}

function showMsg(el, text, type) {
  el.textContent = text;
  el.className = `booking-msg ${type}`;
  el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

function shareSalon() {
  const url = DB.getSalonUrl(currentSalon.id);
  if (navigator.share) {
    navigator.share({
      title: currentSalon.name,
      text: currentSalon.tagline || 'Reserva tu cita aquí',
      url
    }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(url).then(() => {
      document.getElementById('shareBtn').textContent = '¡Enlace copiado! ✓';
      setTimeout(() => {
        document.getElementById('shareBtn').textContent = 'Compartir 🔗';
      }, 2000);
    });
  }
}

function openLightbox(src) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;';
  overlay.appendChild(img);
  overlay.onclick = () => document.body.removeChild(overlay);
  document.body.appendChild(overlay);
}

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
