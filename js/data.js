/* =============================================
   DATA.JS — GlowBook data layer
   All data is stored in localStorage
   ============================================= */

const DB_KEY = 'glowbook_salons';
const APPT_KEY = 'glowbook_appointments';

const DB = {
  // ---- SALONS ----
  getSalons() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEY) || '[]');
    } catch { return []; }
  },

  getSalon(id) {
    return this.getSalons().find(s => s.id === id) || null;
  },

  saveSalon(salon) {
    const salons = this.getSalons();
    const idx = salons.findIndex(s => s.id === salon.id);
    if (idx >= 0) {
      salons[idx] = salon;
    } else {
      salons.push(salon);
    }
    localStorage.setItem(DB_KEY, JSON.stringify(salons));
    return salon;
  },

  deleteSalon(id) {
    const salons = this.getSalons().filter(s => s.id !== id);
    localStorage.setItem(DB_KEY, JSON.stringify(salons));
    // Also delete appointments for this salon
    const appts = this.getAppointments().filter(a => a.salonId !== id);
    localStorage.setItem(APPT_KEY, JSON.stringify(appts));
  },

  createSalon(name) {
    const id = 'salon_' + Date.now() + '_' + Math.random().toString(36).substr(2,5);
    const salon = {
      id,
      name,
      tagline: '',
      logo: '',          // base64
      city: '',
      address: '',
      phone: '',
      instagram: '',
      color: '#c77dff',
      categories: [],
      services: [],
      gallery: [],       // array of base64
      schedule: DB.defaultSchedule(),
      createdAt: new Date().toISOString()
    };
    return this.saveSalon(salon);
  },

  defaultSchedule() {
    const days = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
    return days.map((d, i) => ({
      day: d,
      open: i < 6,
      from: '09:00',
      to: '19:00'
    }));
  },

  // ---- APPOINTMENTS ----
  getAppointments(salonId = null) {
    try {
      const all = JSON.parse(localStorage.getItem(APPT_KEY) || '[]');
      return salonId ? all.filter(a => a.salonId === salonId) : all;
    } catch { return []; }
  },

  saveAppointment(appt) {
    const appts = this.getAppointments();
    appts.push(appt);
    localStorage.setItem(APPT_KEY, JSON.stringify(appts));
    return appt;
  },

  updateAppointment(id, changes) {
    const appts = this.getAppointments();
    const idx = appts.findIndex(a => a.id === id);
    if (idx >= 0) {
      appts[idx] = { ...appts[idx], ...changes };
      localStorage.setItem(APPT_KEY, JSON.stringify(appts));
    }
  },

  deleteAppointment(id) {
    const appts = this.getAppointments().filter(a => a.id !== id);
    localStorage.setItem(APPT_KEY, JSON.stringify(appts));
  },

  createAppointment(salonId, data) {
    const appt = {
      id: 'appt_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
      salonId,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    return this.saveAppointment(appt);
  },

  // ---- UTILS ----
  generateSlug(name) {
    return name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  },

  getSalonUrl(salonId) {
    const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
    return `${base}/salon.html?id=${salonId}`;
  },

  // Demo salons for first load
  seedDemo() {
    if (this.getSalons().length > 0) return;
    const demos = [
      {
        name: 'Nail Studio Sofía',
        tagline: 'Arte en cada uña',
        city: 'Ciudad de México',
        phone: '+52 55 1234 5678',
        instagram: 'nailstudio_sofia',
        color: '#c77dff',
        categories: ['Uñas', 'Cejas y pestañas'],
        services: [
          { id: 's1', name: 'Manicure clásica', desc: 'Limado, cutícula y esmalte', price: 150, duration: 45 },
          { id: 's2', name: 'Uñas acrílicas', desc: 'Con diseño incluido', price: 350, duration: 90 },
          { id: 's3', name: 'Gel con diseño', desc: 'Diseños personalizados', price: 280, duration: 75 },
          { id: 's4', name: 'Depilación de cejas', desc: 'Cera y pinzas', price: 80, duration: 20 },
        ],
        gallery: [],
        schedule: this.defaultSchedule(),
      },
      {
        name: 'Beauty Corner Paola',
        tagline: 'Tu espacio de relajación',
        city: 'Guadalajara',
        phone: '+52 33 9876 5432',
        instagram: 'beautycorner_paola',
        color: '#e8a0bf',
        categories: ['Cabello', 'Maquillaje', 'Faciales'],
        services: [
          { id: 's1', name: 'Corte de cabello', desc: 'Con lavado y secado', price: 200, duration: 60 },
          { id: 's2', name: 'Tinte completo', desc: 'Incluye tratamiento', price: 550, duration: 120 },
          { id: 's3', name: 'Maquillaje social', desc: 'Para eventos y fiestas', price: 450, duration: 60 },
          { id: 's4', name: 'Facial hidratante', desc: 'Limpieza profunda + mascarilla', price: 320, duration: 75 },
        ],
        gallery: [],
        schedule: this.defaultSchedule(),
      }
    ];
    demos.forEach(d => {
      const salon = this.createSalon(d.name);
      Object.assign(salon, d);
      salon.id = salon.id; // keep generated id
      this.saveSalon(salon);
    });
  }
};

// Seed on first load
DB.seedDemo();
