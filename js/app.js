const CACHE_USER_DATA = 'dia-muertos-ofrendas-v1';
let deferredPrompt;

// 1. Registro de SW e inicialización
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registrado con éxito:', reg);
      cargarOfrendasDesdeCache();
    } catch (err) {
      console.error('Error al registrar SW:', err);
    }
  });
}

// 2. Evento para Instalar la App
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btnInstalar = document.getElementById('btnInstalar');
  if (btnInstalar) btnInstalar.style.display = 'inline-block';
});

document.getElementById('btnInstalar')?.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Resultado de instalación: ${outcome}`);
    deferredPrompt = null;
    document.getElementById('btnInstalar').style.display = 'none';
  }
});

// 3. Permisos y Notificaciones
async function solicitarPermisoNotificaciones() {
  if ('Notification' in window) {
    const permiso = await Notification.requestPermission();
    if (permiso === 'granted') {
      alert('¡Notificaciones activadas!');
    }
  }
}

function lanzarNotificacionDirecta() {
  if (Notification.permission === 'granted' && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification('🌼 Recuerda tu Altar', {
        body: 'Prepara las veladoras y la flor de cempasúchil para tus difuntos.',
        icon: 'icons/android-chrome-192x192.png'
      });
    });
  } else {
    solicitarPermisoNotificaciones();
  }
}

const datosCuriosos = [
  "💡 ¿Sabías que? El Cempasúchil cuenta con 30 variedades y su color naranja simboliza el sol.",
  "💡 ¿Sabías que? El Mictlán consta de 9 niveles que el alma debe cruzar durante 4 años.",
  "💡 ¿Sabías que? La sal en la ofrenda evita que el alma del difunto se corrompa.",
  "💡 ¿Sabías que? Las calaveritas de azúcar representan la presencia de la muerte con dulzura."
];

function lanzarNotificacionDatoCurioso() {
  if (Notification.permission === 'granted' && navigator.serviceWorker.controller) {
    const datoAleatorio = datosCuriosos[Math.floor(Math.random() * datosCuriosos.length)];
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification('✨ Dato Curioso - Día de Muertos', {
        body: datoAleatorio,
        icon: 'icons/android-chrome-192x192.png'
      });
    });
  } else {
    solicitarPermisoNotificaciones();
  }
}

// 4. Guardar datos en Cache Storage y disparar Background Sync
document.getElementById('btnGuardar').addEventListener('click', async () => {
  const nombre = document.getElementById('nombreDifunto').value.trim();
  const frase = document.getElementById('fraseDifunto').value.trim();
  const fotoInput = document.getElementById('fotoDifunto');
  const foto = fotoInput.files[0];

  if (!nombre || !frase || !foto) {
    alert('Por favor completa el nombre, la frase y selecciona una foto.');
    return;
  }

  // Convertir imagen a Base64
  const reader = new FileReader();
  reader.readAsDataURL(foto);
  reader.onloadend = async () => {
    const base64Foto = reader.result;

    const objetoOfrenda = {
      id: Date.now(),
      nombre: nombre,
      frase: frase,
      foto: base64Foto,
      fecha: new Date().toISOString()
    };

    // GUARDAR EN CACHE STORAGE
    const cache = await caches.open(CACHE_USER_DATA);
    const jsonResponse = new Response(JSON.stringify(objetoOfrenda), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`./ofrenda-${objetoOfrenda.id}.json`, jsonResponse);

    // REGISTRAR SYNC
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-ofrendas');
    }

    // Limpiar formulario y refrescar
    document.getElementById('nombreDifunto').value = '';
    document.getElementById('fraseDifunto').value = '';
    fotoInput.value = '';
    cargarOfrendasDesdeCache();
  };
});

// 5. Cargar ofrendas desde Cache Storage
async function cargarOfrendasDesdeCache() {
  const contenedor = document.getElementById('contenedorOfrendas');
  contenedor.innerHTML = '';

  const cache = await caches.open(CACHE_USER_DATA);
  const requests = await cache.keys();

  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const item = await response.json();

      const tarjeta = document.createElement('div');
      tarjeta.className = 'tarjeta-ofrenda';
      tarjeta.innerHTML = `
        <img src="${item.foto}" alt="${item.nombre}">
        <p><strong>${item.nombre}</strong></p>
        <p class="frase-recuerdo">"${item.frase}"</p>
        <p class="estado-pendiente">⏳ Pendiente de Sync</p>
      `;
      contenedor.appendChild(tarjeta);
    }
  }
}