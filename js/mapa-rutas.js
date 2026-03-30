/* ================================================================
   MAPA & RUTAS — MoviCali
   js/mapa-rutas.js
   - Leaflet + OSRM (rutas por calles reales)
   - Buses animados con paradas y tiempo de espera
   - Animacion en bucle infinito
   - Seleccion interactiva de rutas
   ================================================================ */

(function initMapaRutas() {

    // ── DATOS DE RUTAS ──────────────────────────────────────────────
    // Coordenadas reales de Cali siguiendo las vias principales
    // Formato paradas: { nombre, lat, lng }
    const RUTAS = [
        {
            id: 'G-07',
            nombre: 'Guala G-07',
            tipo: '\ud83d\ude90',         // 🚐
            empresa: 'Coopcencar',
            color: '#10b981',
            precio: '$1.800',
            tiempo: '28 min',
            tagClass: 'tag-green',
            tagTexto: '\u2b50 Recomendada',
            estadoClass: 'tag-green',
            estadoTexto: '\ud83d\udfe2 Operando',
            alertaClass: 'tag-amber',
            alertaTexto: '\u26a0\ufe0f Moderada demora',
            descripcion: 'Centenario \u2192 Unicentro v\u00eda Av. 6N',
            // Paradas reales sobre Av. 6N / Cra 5 hacia el norte de Cali
            paradas: [
                { nombre: 'Barrio Centenario',    lat: 3.4284, lng: -76.5318 },
                { nombre: 'Cll 34 con Av. 6N',    lat: 3.4352, lng: -76.5282 },
                { nombre: 'Chipichape',            lat: 3.4421, lng: -76.5249 },
                { nombre: 'Parque del Perro',      lat: 3.4469, lng: -76.5223 },
                { nombre: 'Av. 6N con Cll 48',    lat: 3.4518, lng: -76.5185 },
                { nombre: 'Unicentro',             lat: 3.4562, lng: -76.5148 }
            ]
        },
        {
            id: 'B-22A',
            nombre: 'Bus B-22A',
            tipo: '\ud83d\ude8c',         // 🚌
            empresa: 'Transurbano',
            color: '#3b82f6',
            precio: '$2.200',
            tiempo: '+18 min',
            tagClass: 'tag-amber',
            tagTexto: '\ud83d\udd50 Demorado',
            estadoClass: 'tag-red',
            estadoTexto: '\ud83d\udd34 Congesti\u00f3n Av.6N',
            alertaClass: 'tag-red',
            alertaTexto: '\ud83d\udd34 Congesti\u00f3n Av.6N',
            descripcion: 'Centenario \u2192 Centro \u2192 Unicentro',
            // Va por Av. Colombia y luego sube al norte por Cra 15
            paradas: [
                { nombre: 'Barrio Centenario',    lat: 3.4284, lng: -76.5318 },
                { nombre: 'Av. 2N con Cll 34',    lat: 3.4310, lng: -76.5358 },
                { nombre: 'Av. Colombia Cll 15',  lat: 3.4365, lng: -76.5410 },
                { nombre: 'Av. Colombia Cll 5',   lat: 3.4295, lng: -76.5448 },
                { nombre: 'Centro — Cra 10',      lat: 3.4328, lng: -76.5388 },
                { nombre: 'Cll 10 con Cra 1N',    lat: 3.4390, lng: -76.5292 },
                { nombre: 'Av. Estaci\u00f3n',         lat: 3.4455, lng: -76.5220 },
                { nombre: 'Unicentro',             lat: 3.4562, lng: -76.5148 }
            ]
        },
        {
            id: 'G-12',
            nombre: 'Guala G-12',
            tipo: '\ud83d\ude90',         // 🚐
            empresa: 'Coopcencar',
            color: '#8b5cf6',
            precio: '$2.000',
            tiempo: '32 min',
            tagClass: 'tag-blue',
            tagTexto: '\ud83d\udd04 Alternativa',
            estadoClass: 'tag-green',
            estadoTexto: '\ud83d\udfe2 Sin inconvenientes',
            alertaClass: null,
            alertaTexto: null,
            descripcion: 'Centenario \u2192 Menga \u2192 Univalle',
            // Va al sur hacia Univalle por Av. 3N
            paradas: [
                { nombre: 'Barrio Centenario',    lat: 3.4284, lng: -76.5318 },
                { nombre: 'Av. 3N con Cll 38',    lat: 3.4245, lng: -76.5362 },
                { nombre: 'Sameco',               lat: 3.4178, lng: -76.5398 },
                { nombre: 'San Fernando',         lat: 3.4110, lng: -76.5422 },
                { nombre: 'Ciudad Universitaria', lat: 3.3820, lng: -76.5458 },
                { nombre: 'Univalle',             lat: 3.3762, lng: -76.5422 }
            ]
        },
        {
            id: 'B-14',
            nombre: 'Bus B-14',
            tipo: '\ud83d\ude8c',         // 🚌
            empresa: 'Unitransco',
            color: '#f59e0b',
            precio: '$1.600',
            tiempo: '42 min',
            tagClass: 'tag-gray',
            tagTexto: 'Econ\u00f3mico',
            estadoClass: 'tag-green',
            estadoTexto: '\ud83d\udfe2 A tiempo',
            alertaClass: null,
            alertaTexto: null,
            descripcion: 'Centenario \u2192 Av. Colombia \u2192 Unicentro',
            // Ruta larga por Av. Colombia hacia el norte
            paradas: [
                { nombre: 'Barrio Centenario',    lat: 3.4284, lng: -76.5318 },
                { nombre: 'Av. Ca\u00f1asgordas',    lat: 3.4320, lng: -76.5340 },
                { nombre: 'Av. Colombia Cll 25',  lat: 3.4380, lng: -76.5380 },
                { nombre: 'Hospital Militar',     lat: 3.4430, lng: -76.5330 },
                { nombre: 'Bulevar del R\u00edo',    lat: 3.4482, lng: -76.5260 },
                { nombre: 'Cll 48 con Cra 5N',    lat: 3.4528, lng: -76.5200 },
                { nombre: 'Unicentro',             lat: 3.4562, lng: -76.5148 }
            ]
        }
    ];

    // ── ESTADO ─────────────────────────────────────────────────────
    let mapaIniciado = false;
    let leafletMap   = null;
    let rutaActivaId = 'G-07';
    let capasRutas   = {};   // { id: { sombra, principal } }
    let markersBuses = {};   // { id: L.Marker }
    let animState    = {};   // { id: { timeoutId, segIdx, ptIdx, enParada } }

    const VELOCIDAD_MS = 220;   // ms entre cada punto del recorrido (más lento = más real)
    const DWELL_MS     = 4500;  // ms que el bus espera en cada parada

    // ── OSRM: rutas por calles reales ──────────────────────────────
    async function getOSRMPath(p1, p2) {
        const url = `https://router.project-osrm.org/route/v1/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=full&geometries=geojson`;
        try {
            const ctrl = new AbortController();
            const tid  = setTimeout(() => ctrl.abort(), 6000);
            const resp = await fetch(url, { signal: ctrl.signal });
            clearTimeout(tid);
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            const data = await resp.json();
            if (data.code === 'Ok') {
                // Convertir [lon,lat] → [lat,lon] para Leaflet
                return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            }
        } catch (e) {
            // OSRM no disponible — usar interpolación densa
        }
        return interpolarSegmento(p1, p2, 30);
    }

    function interpolarSegmento(p1, p2, pasos) {
        const pts = [];
        for (let i = 0; i <= pasos; i++) {
            const t = i / pasos;
            pts.push([p1.lat + (p2.lat - p1.lat) * t, p1.lng + (p2.lng - p1.lng) * t]);
        }
        return pts;
    }

    // Construye array de segmentos con ruta OSRM entre paradas consecutivas
    async function construirSegmentos(ruta) {
        const segs = [];
        for (let i = 0; i < ruta.paradas.length - 1; i++) {
            const pts = await getOSRMPath(ruta.paradas[i], ruta.paradas[i + 1]);
            segs.push({ puntos: pts, idxParadaFin: i + 1 });
        }
        return segs;
    }

    // ── ANIMACIÓN ───────────────────────────────────────────────────
    function iniciarAnimacion(rutaId, marker, segmentos, onParada) {
        // Detenemos animación previa si hubiera
        if (animState[rutaId]) clearTimeout(animState[rutaId].timeoutId);

        const st = { segIdx: 0, ptIdx: 0, enParada: false };
        animState[rutaId] = st;

        function tick() {
            if (st.enParada) {
                // Salir de parada → siguiente segmento
                st.segIdx++;
                st.ptIdx   = 0;
                st.enParada = false;
                if (st.segIdx >= segmentos.length) {
                    // Fin del recorrido → reiniciar en bucle
                    st.segIdx = 0;
                    onParada(0);
                }
            }

            const seg = segmentos[st.segIdx];
            if (st.ptIdx >= seg.puntos.length - 1) {
                // Llegó al final del segmento = PARADA
                marker.setLatLng(seg.puntos[seg.puntos.length - 1]);
                st.enParada = true;
                onParada(seg.idxParadaFin);
                st.timeoutId = setTimeout(tick, DWELL_MS);
                return;
            }

            marker.setLatLng(seg.puntos[st.ptIdx]);
            st.ptIdx++;
            st.timeoutId = setTimeout(tick, VELOCIDAD_MS);
        }

        st.timeoutId = setTimeout(tick, VELOCIDAD_MS);
    }

    // ── PANEL DE PARADAS ────────────────────────────────────────────
    function renderStopPanel(ruta, paradaActivaIdx) {
        const panel = document.getElementById('stopPanel');
        if (!panel) return;

        let html = `<div class="card-title" style="margin-bottom:10px;">
            \ud83d\udccd Paradas \u2014 ${ruta.nombre}
            <span class="tag ${ruta.estadoClass}" style="margin-left:auto;font-size:.72rem;">${ruta.estadoTexto}</span>
        </div><div class="route-stop-row">`;

        ruta.paradas.forEach((p, i) => {
            const isPassed  = i < paradaActivaIdx;
            const isActive  = i === paradaActivaIdx;
            const isEnd     = i === ruta.paradas.length - 1;
            const dotStyle  = isActive
                ? `border-color:${ruta.color};background:${ruta.color};box-shadow:0 0 0 3px ${ruta.color}33;`
                : isPassed
                    ? `border-color:${ruta.color};background:${ruta.color};opacity:.55;`
                    : `border-color:${ruta.color};`;
            const nameStyle = isActive ? `font-weight:700;color:${ruta.color};` : '';
            const label     = isActive ? ' \u23f3' : (isPassed ? ' \u2713' : '');

            if (i > 0) {
                const lineStyle = isPassed
                    ? `background:${ruta.color};opacity:.5;`
                    : 'background:var(--gray-200);';
                html += `<div class="route-stop-line" style="${lineStyle}"></div>`;
            }
            html += `<div class="route-stop">
                <div class="route-stop-dot${i === 0 || isEnd ? ' start' : ''}" style="${dotStyle}"></div>
                <div class="route-stop-name" style="${nameStyle}">${p.nombre}${label}</div>
            </div>`;
        });

        html += '</div>';
        panel.innerHTML = html;
    }

    // ── TARJETAS DE RUTAS ───────────────────────────────────────────
    function renderRouteCards() {
        const el = document.getElementById('routeResults');
        const ti = document.getElementById('routeResultsTitle');
        if (!el) return;
        if (ti) ti.textContent = `\ud83d\udccb Rutas encontradas (${RUTAS.length})`;

        el.innerHTML = RUTAS.map((r, idx) => `
            <div class="route-card ${idx === 0 ? 'selected' : ''}" id="card-${r.id}"
                 onclick="window.seleccionarRuta('${r.id}')">
                <div class="route-header">
                    <div class="route-number">
                        <div class="route-dot" style="background:${r.color};"></div>
                        ${r.nombre}
                    </div>
                    <span class="tag ${r.tagClass}">${r.tagTexto}</span>
                </div>
                <div class="route-meta mb-3">
                    <span>\u23f1\ufe0f ${r.tiempo}</span>
                    <span>\ud83d\udcb0 ${r.precio}</span>
                    <span>${r.tipo} ${r.tipo.includes('\ud83d\ude90') ? 'Guala' : 'Bus'}</span>
                </div>
                <div class="text-sm text-gray mb-3">
                    Empresa: ${r.empresa} &middot; ${r.descripcion} &middot; ${r.paradas.length} paradas
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <span class="tag ${r.estadoClass}">${r.estadoTexto}</span>
                    ${r.alertaClass ? `<span class="tag ${r.alertaClass}">${r.alertaTexto}</span>` : ''}
                </div>
            </div>
        `).join('');
    }

    // ── SELECCIÓN DE RUTA ───────────────────────────────────────────
    window.seleccionarRuta = function (rutaId) {
        rutaActivaId = rutaId;

        // Resaltar tarjeta
        document.querySelectorAll('.route-card').forEach(c => c.classList.remove('selected'));
        const card = document.getElementById('card-' + rutaId);
        if (card) card.classList.add('selected');

        // Resaltar polilínea en el mapa
        Object.keys(capasRutas).forEach(id => {
            const c = capasRutas[id];
            if (id === rutaId) {
                c.principal.setStyle({ opacity: 0.95, weight: 5 });
                c.sombra.setStyle({ opacity: 0.22, weight: 10 });
            } else {
                c.principal.setStyle({ opacity: 0.35, weight: 2.5 });
                c.sombra.setStyle({ opacity: 0.05, weight: 7 });
            }
        });

        // Centrar mapa en la ruta
        const ruta = RUTAS.find(r => r.id === rutaId);
        if (ruta && leafletMap && capasRutas[rutaId]) {
            leafletMap.fitBounds(capasRutas[rutaId].principal.getBounds(), { padding: [30, 30] });
        }

        // Actualizar panel de paradas con la parada actual del bus
        if (ruta) renderStopPanel(ruta, 0);
    };

    // ── INTEGRACIÓN CON BUSCAR ──────────────────────────────────────
    window.buscarRutasMapa = function () {
        const origen  = (document.getElementById('mapaOrigen')  || {}).value || '';
        const destino = (document.getElementById('mapaDest')    || {}).value || '';
        // Recomendar la ruta activa (G-07 si no hay congestión)
        const recomendada = RUTAS.find(r => r.estadoClass !== 'tag-red') || RUTAS[0];
        window.seleccionarRuta(recomendada.id);
        if (typeof showToast === 'function') {
            showToast('\ud83d\udd0d Mejor ruta: ' + recomendada.nombre + ' (' + recomendada.tiempo + ')');
        }
    };

    // ── INICIO DEL MAPA ─────────────────────────────────────────────
    async function iniciarMapa() {
        if (mapaIniciado) return;
        mapaIniciado = true;

        // Render tarjetas primero
        renderRouteCards();

        // Crear mapa centrado en Cali Norte
        leafletMap = L.map('leafletMap', {
            center: [3.4400, -76.5280],
            zoom: 13,
            zoomControl: true,
            attributionControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> | MoviCali'
        }).addTo(leafletMap);

        // Procesar cada ruta de manera asíncrona
        for (let ri = 0; ri < RUTAS.length; ri++) {
            const ruta = RUTAS[ri];

            // Construir segmentos con OSRM / fallback
            const segmentos    = await construirSegmentos(ruta);
            const todosLosPts  = segmentos.flatMap(s => s.puntos);
            // Añadir último punto de la última parada
            const ultParada    = ruta.paradas[ruta.paradas.length - 1];
            todosLosPts.push([ultParada.lat, ultParada.lng]);

            // Polilínea sombra
            const sombra = L.polyline(todosLosPts, {
                color: ruta.color, weight: 9, opacity: 0.10, lineJoin: 'round'
            }).addTo(leafletMap);

            // Polilínea principal
            const principal = L.polyline(todosLosPts, {
                color: ruta.color,
                weight: ri === 0 ? 5 : 3,
                opacity: ri === 0 ? 0.95 : 0.45,
                lineJoin: 'round',
                dashArray: ruta.id === 'B-22A' ? '9,6' : null
            }).addTo(leafletMap);

            principal.on('click', () => window.seleccionarRuta(ruta.id));
            principal.bindPopup(`
                <div class="route-popup">
                    <strong style="color:${ruta.color}">${ruta.nombre}</strong><br>
                    <span style="font-size:.8rem;color:#6b7280">${ruta.empresa}</span><br>
                    <span style="font-size:.8rem">${ruta.estadoTexto}</span><br>
                    <span style="font-size:.75rem;color:#9ca3af">${ruta.paradas.length} paradas &middot; ${ruta.tiempo} &middot; ${ruta.precio}</span>
                </div>
            `);

            capasRutas[ruta.id] = { sombra, principal };

            // Marcadores de paradas
            ruta.paradas.forEach((p, i) => {
                const isEndpoint = i === 0 || i === ruta.paradas.length - 1;
                L.circleMarker([p.lat, p.lng], {
                    radius: isEndpoint ? 7 : 4,
                    color: ruta.color,
                    fillColor: isEndpoint ? ruta.color : '#ffffff',
                    fillOpacity: 1,
                    weight: 2.5
                }).addTo(leafletMap)
                  .bindTooltip(`<strong>${p.nombre}</strong><br><span style="font-size:.75rem;color:#6b7280">${ruta.nombre}</span>`, { direction: 'top' });
            });

            // Icono del bus
            const busIcon = L.divIcon({
                className: '',
                html: `<div style="
                    background:${ruta.color};border:2.5px solid #fff;border-radius:50%;
                    width:30px;height:30px;display:flex;align-items:center;justify-content:center;
                    box-shadow:0 2px 8px rgba(0,0,0,.32);font-size:15px;cursor:pointer;" 
                    title="${ruta.nombre}">${ruta.tipo}</div>`,
                iconSize: [30, 30], iconAnchor: [15, 15]
            });

            const busMarker = L.marker([ruta.paradas[0].lat, ruta.paradas[0].lng], {
                icon: busIcon, zIndexOffset: 1000 + ri
            }).addTo(leafletMap);

            busMarker.on('click', () => window.seleccionarRuta(ruta.id));
            busMarker.bindPopup(`
                <div class="route-popup">
                    <strong style="color:${ruta.color}">${ruta.nombre}</strong><br>
                    <span>${ruta.estadoTexto}</span>
                </div>
            `);

            markersBuses[ruta.id] = busMarker;

            // Animar con offset de inicio para que los buses estén en diferentes posiciones
            const offsetDelay = ri * 3500;
            setTimeout(() => {
                iniciarAnimacion(ruta.id, busMarker, segmentos, (paradaIdx) => {
                    if (rutaActivaId === ruta.id) {
                        renderStopPanel(ruta, paradaIdx);
                    }
                });
            }, offsetDelay);
        }

        // Mostrar paradas de la ruta por defecto (G-07)
        renderStopPanel(RUTAS[0], 0);
        setTimeout(() => leafletMap.invalidateSize(), 200);
    }

    // ── ENGANCHE CON navigate() ─────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const _navOrig = window.navigate;
        if (typeof _navOrig === 'function') {
            window.navigate = function (view) {
                _navOrig(view);
                if (view === 'mapa') setTimeout(iniciarMapa, 120);
            };
        }
        // Si la vista mapa ya está activa al cargar
        const vm = document.getElementById('view-mapa');
        if (vm && vm.classList.contains('active')) setTimeout(iniciarMapa, 250);
    });

})();
