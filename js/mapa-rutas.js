/* ================================================================
   MAPA & RUTAS — MoviCali (Versión Simplificada + Calles Reales)
   js/mapa-rutas.js
   ================================================================ */

(function initMapaRutas() {
    let mapaIniciado = false;
    let leafletMap = null;
    let buses = [];
    let interv = null;

    // ===============================
    // RUTA ESPECIAL SUR (CALI)
    // ===============================
    const rutaEspecialSur = {
      nombre: "Ruta Especial Sur",
      paradas: [
        [3.437220, -76.522499],
        [3.440500, -76.530200],
        [3.436800, -76.535900],
        [3.428000, -76.543500],
        [3.418200, -76.548900],
        [3.405000, -76.555800],
        [3.392500, -76.561200],
        // vuelta
        [3.405000, -76.555800],
        [3.418200, -76.548900],
        [3.428000, -76.543500],
        [3.436800, -76.535900],
        [3.440500, -76.530200],
        [3.437220, -76.522499]
      ]
    };

    // ===============================
    // INICIO DEL MAPA
    // ===============================
    async function iniciarMapa() {
        if (mapaIniciado) return;
        mapaIniciado = true;

        leafletMap = L.map('leafletMap', {
            center: [3.4400, -76.5280],
            zoom: 13
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap | MoviCali'
        }).addTo(leafletMap);

        // 1. Obtener la ruta que sigue las calles reales desde OSRM
        // Invertimos las lat/lng originales para pedirselas a OSRM
        const coordsParaOSRM = rutaEspecialSur.paradas.map(p => `${p[1]},${p[0]}`).join(';');
        const urlOSRM = `https://router.project-osrm.org/route/v1/driving/${coordsParaOSRM}?overview=full&geometries=geojson`;
        
        try {
            const resp = await fetch(urlOSRM);
            const data = await resp.json();
            if (data.code === 'Ok' && data.routes && data.routes[0]) {
                // Reemplazamos los 13 saltos bruscos por cientos de puntitos que hacen la calle
                rutaEspecialSur.paradas = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }
        } catch(e) {
            console.warn("MoviCali: Usando ruta en linea recta porque no hay internet u OSRM falló.");
        }

        // Trazar línea de la ruta que ahora sigue PERFECTAMENTE las calles
        L.polyline(rutaEspecialSur.paradas, {
            color: '#ef4444', 
            weight: 5, 
            opacity: 0.8
        }).addTo(leafletMap);

        // ===============================
        // CREAR MÚLTIPLES BUSES
        // ===============================
        const busIcon = L.divIcon({
            className: '',
            html: `<div style="background:#ef4444;border:2px solid #fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,.3);font-size:14px;">🚌</div>`,
            iconSize: [26, 26], iconAnchor: [13, 13]
        });

        function crearBus(offsetPuntos) {
          const marker = L.marker(rutaEspecialSur.paradas[offsetPuntos], {icon: busIcon, zIndexOffset: 1000}).addTo(leafletMap);
          
          // Magia CSS para animar suavemente
          if (marker._icon) marker._icon.style.transition = "transform 0.4s linear";
          marker.on('add', () => { if(marker._icon) marker._icon.style.transition = "transform 0.4s linear"; });

          return { index: offsetPuntos, marker: marker };
        }

        // Distribuimos los buses a lo largo de los cientos de puntos de la calle
        const totalPuntos = rutaEspecialSur.paradas.length;
        buses = [
          crearBus(0),
          crearBus(Math.floor(totalPuntos * 0.25)),
          crearBus(Math.floor(totalPuntos * 0.50)),
          crearBus(Math.floor(totalPuntos * 0.75))
        ];

        leafletMap.on('zoomstart', () => { buses.forEach(b => { if(b.marker._icon) b.marker._icon.style.transition = 'none'; }); });
        leafletMap.on('zoomend', () => { buses.forEach(b => { if(b.marker._icon) b.marker._icon.style.transition = 'transform 0.4s linear'; }); });

        // ===============================
        // MOVIMIENTO ESTRICTO POR CALLES
        // ===============================
        function moverBuses() {
          buses.forEach(bus => {
            bus.index++;
            if (bus.index >= rutaEspecialSur.paradas.length) {
              bus.index = 0;
            }
            bus.marker.setLatLng(rutaEspecialSur.paradas[bus.index]);
          });
        }

        // Como ahora hay muchísimos puntos (una calle entera), aceleramos un poco el intervalo
        // para que no vaya microscópicamente lento.
        if(interv) clearInterval(interv);
        interv = setInterval(moverBuses, 400);

        setTimeout(() => leafletMap.invalidateSize(), 200);
    }

    // ── ENGANCHE CON LA APLICACIÓN ──
    document.addEventListener('DOMContentLoaded', () => {
        const _navOrig = window.navigate;
        if (typeof _navOrig === 'function') {
            window.navigate = function (view) {
                _navOrig(view);
                if (view === 'mapa') setTimeout(iniciarMapa, 120);
            };
        }
        const vm = document.getElementById('view-mapa');
        if (vm && vm.classList.contains('active')) setTimeout(iniciarMapa, 250);
        setTimeout(window.actualizarDashboardInicio, 200);
    });

    window.actualizarDashboardInicio = function() {
        const dRutasActivas = document.getElementById('statRutasActivas');
        if(dRutasActivas) dRutasActivas.textContent = "1";
    };
    window.detectarUbicacion = function() { alert("Integración GPS desactivada en modo manual."); };
    window.seleccionarRuta = function(id) {};
    window.buscarRutasMapa = function() {};

})();
