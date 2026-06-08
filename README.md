# GlowBook 💅 — Plataforma de Reservas para Salones de Belleza

Proyecto listo para subir a **GitHub Pages**. No requiere backend ni base de datos. Toda la información se guarda en el `localStorage` del navegador.

## 🚀 Cómo subir a GitHub Pages

1. Crea un repositorio público en GitHub (ej. `glowbook`)
2. Sube todos los archivos de esta carpeta al repositorio
3. Ve a **Settings → Pages → Branch: main → / (root)**
4. Tu sitio estará en: `https://TU_USUARIO.github.io/glowbook/`

## 📂 Estructura

```
/
├── index.html          ← Página principal (listado de salones)
├── salon.html          ← Página individual de cada salón
├── admin.html          ← Panel para dueñas de salones
├── manifest.json       ← PWA manifest (instalación móvil)
├── sw.js               ← Service Worker (offline + PWA)
├── css/
│   ├── main.css        ← Estilos globales
│   ├── salon.css       ← Estilos página de salón
│   └── admin.css       ← Estilos panel admin
├── js/
│   ├── data.js         ← Capa de datos (localStorage)
│   ├── main.js         ← JS página principal
│   ├── salon.js        ← JS página de salón
│   └── admin.js        ← JS panel admin
└── icons/              ← Íconos PWA
```

## 📱 Instalación en móvil (PWA)

El sitio es una **Progressive Web App**:
- En Android: aparece banner automático "Agregar a pantalla de inicio"
- En iPhone: Safari → botón Compartir → "Agregar a pantalla de inicio"

## 🏪 Para dueñas de salón

1. Ir a `admin.html` o clic en "Soy dueña de salón"
2. Crear su salón con nombre, logo y color
3. Agregar servicios con precio y duración
4. Subir fotos a la galería
5. Configurar horarios
6. Compartir su enlace personalizado con las clientas

## 👩 Para clientas

1. Explorar salones en la página principal
2. Ver catálogo de servicios y galería
3. Agendar cita con nombre, teléfono, servicio, fecha y hora
4. Opción de confirmar por WhatsApp automáticamente

## ⚠️ Notas importantes

- Los datos se guardan en el `localStorage` del navegador de cada usuaria
- Para producción real, considera usar Firebase o Supabase como backend
- Cada dueña debe usar el panel desde el mismo dispositivo/navegador para ver sus citas

