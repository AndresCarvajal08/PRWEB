/**
 * ============================================================
 * VIEW — AlertaView
 * js/views/AlertaView.js
 * ============================================================
 * FIXES:
 * 1. Mapa gris → invalidateSize() al mostrarse + observer
 * 2. Geocodificador real usando Nominatim (OpenStreetMap) 
 *    en lugar de direcciones hardcodeadas
 * ============================================================
 */

const AlertaView = {
    _map: null,
    _markerGroup: null,
    _geocodeCache: {}, // caché para no repetir peticiones

    /* ----------------------------------------------------------------
       RENDER LISTA
    ---------------------------------------------------------------- */
    renderLista(alertas, containerId = 'globalAlertsContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (alertas.length === 0) {
            container.innerHTML = `
                <div class="text-sm text-gray text-center p-4">
                    No hay alertas de movilidad activas hoy.
                </div>`;
            return;
        }

        container.innerHTML = alertas.map(al => this._cardTemplate(al)).join('');
        this.actualizarMapa(alertas);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /* ----------------------------------------------------------------
       MAPA — inicializa y actualiza pines
    ---------------------------------------------------------------- */
    actualizarMapa(alertas) {
        const mapContainer = document.getElementById('alertsMap');
        if (!mapContainer) return;

        // 1. Inicializar mapa si no existe
        if (!this._map) {
            this._map = L.map('alertsMap', {
                center: [3.43722, -76.5225],
                zoom: 13,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap | WayRoute'
            }).addTo(this._map);

            this._markerGroup = L.layerGroup().addTo(this._map);
        }

        // 2. FIX MAPA GRIS — forzar redibujado cada vez que se muestre
        //    Usamos ResizeObserver para detectar cuando el contenedor
        //    pasa de oculto a visible
        this._observarVisibilidad(mapContainer);

        // 3. Limpiar pines anteriores
        this._markerGroup.clearLayers();

        // 4. Geocodificar y pintar pines (async)
        this._pintarPines(alertas);
    },

    /* ----------------------------------------------------------------
       FIX MAPA GRIS — observer que detecta visibilidad
    ---------------------------------------------------------------- */
    _observarVisibilidad(mapContainer) {
        // Ejecutar invalidateSize cuando el contenedor tenga dimensiones reales
        const checkAndFix = () => {
            if (this._map && mapContainer.offsetWidth > 0 && mapContainer.offsetHeight > 0) {
                this._map.invalidateSize({ animate: false });
            }
        };

        // Intento inmediato
        checkAndFix();

        // Observer por si el contenedor estaba oculto
        if (typeof ResizeObserver !== 'undefined') {
            if (!this._resizeObserver) {
                this._resizeObserver = new ResizeObserver(() => {
                    checkAndFix();
                });
            }
            this._resizeObserver.observe(mapContainer);
        }

        // Fallback con timeouts escalonados
        [100, 300, 600, 1000].forEach(ms => {
            setTimeout(checkAndFix, ms);
        });
    },

    /* ----------------------------------------------------------------
       PINTAR PINES — geocodifica y agrega marcadores
    ---------------------------------------------------------------- */
    async _pintarPines(alertas) {
        for (const al of alertas) {
            let lat = al.lat;
            let lng = al.lng;

            // Si no tiene coordenadas, geocodificar la dirección
            if (!lat || !lng) {
                const coords = await this._geocodificar(al.ubicacion);
                lat = coords.lat;
                lng = coords.lng;
            }

            if (!lat || !lng) continue;

            const color = al.severidad === 'alta' ? '#ef4444'
                : al.severidad === 'baja' ? '#10b981'
                    : '#f59e0b';

            const icono = L.divIcon({
                className: '',
                html: `<div style="
                    background:${color};
                    border:2px solid #fff;
                    border-radius:50%;
                    width:36px;height:36px;
                    display:flex;align-items:center;justify-content:center;
                    font-size:18px;
                    box-shadow:0 2px 8px rgba(0,0,0,0.3);
                ">${this._emojiTipo(al.tipo)}</div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });

            const hora = al.fecha
                ? new Date(al.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

            L.marker([lat, lng], { icon: icono })
                .addTo(this._markerGroup)
                .bindPopup(`
                    <div style="font-family:sans-serif;min-width:180px;">
                        <strong style="color:#0d2136;">${al.titulo}</strong><br>
                        <small style="color:#6b7280;">${al.ubicacion || ''}</small>
                        <p style="margin:6px 0 0;font-size:12px;line-height:1.4;">${al.descripcion}</p>
                        ${hora ? `<div style="margin-top:6px;font-size:11px;color:#9ca3af;">🕐 ${hora}</div>` : ''}
                    </div>
                `);
        }

        // Ajustar vista al grupo de marcadores si hay pines
        if (this._markerGroup.getLayers().length > 0) {
            try {
                const group = L.featureGroup(this._markerGroup.getLayers());
                this._map.fitBounds(group.getBounds().pad(0.2));
            } catch (e) {
                // Si falla, mantener vista actual
            }
        }
    },

    /* ----------------------------------------------------------------
       GEOCODIFICADOR REAL — Nominatim (OpenStreetMap)
       Funciona con cualquier dirección, no solo las hardcodeadas.
       Agrega ", Cali, Colombia" automáticamente para mayor precisión.
    ---------------------------------------------------------------- */
    async _geocodificar(direccion) {
        if (!direccion) return this._fallbackCali();

        // Revisar caché primero
        const key = direccion.toLowerCase().trim();
        if (this._geocodeCache[key]) return this._geocodeCache[key];

        // Construir query: agrega Cali Colombia si no está en la dirección
        const query = key.includes('cali') ? direccion : `${direccion}, Cali, Colombia`;

        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=co`;

            const resp = await fetch(url, {
                headers: {
                    // Nominatim requiere User-Agent
                    'Accept-Language': 'es',
                }
            });

            if (!resp.ok) throw new Error('Nominatim error');

            const data = await resp.json();

            if (data && data.length > 0) {
                const result = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                };
                // Guardar en caché
                this._geocodeCache[key] = result;
                return result;
            }
        } catch (e) {
            console.warn('AlertaView: Nominatim falló para:', direccion, e.message);
        }

        // Fallback: geocodificador simulado para frases comunes de Cali
        const fallback = this._geocodificarSimulado(direccion);
        this._geocodeCache[key] = fallback;
        return fallback;
    },

    /* ----------------------------------------------------------------
       GEOCODIFICADOR SIMULADO — solo como fallback si Nominatim falla
    ---------------------------------------------------------------- */
    _geocodificarSimulado(dir) {
        if (!dir) return this._fallbackCali();
        const d = dir.toLowerCase();

        if (d.includes('centenario')) return { lat: 3.4516, lng: -76.5319 };
        if (d.includes('calle 5') || d.includes('cll 5')) return { lat: 3.4427, lng: -76.5409 };
        if (d.includes('av. 6') || d.includes('avenida 6')) return { lat: 3.4675, lng: -76.5235 };
        if (d.includes('chipichape')) return { lat: 3.4770, lng: -76.5178 };
        if (d.includes('aguablanca') || d.includes('oriente')) return { lat: 3.4219, lng: -76.4899 };
        if (d.includes('unicentro') || d.includes('pasoancho')) return { lat: 3.3797, lng: -76.5317 };
        if (d.includes('nariño') || d.includes('antonio nariño')) return { lat: 3.3595, lng: -76.5170 };
        if (d.includes('roosevelt')) return { lat: 3.4350, lng: -76.5417 };
        if (d.includes('terminal')) return { lat: 3.4715, lng: -76.5015 };
        if (d.includes('pance')) return { lat: 3.3510, lng: -76.5340 };
        if (d.includes('san fernando')) return { lat: 3.4312, lng: -76.5435 };
        if (d.includes('centro') || d.includes('caicedo')) return { lat: 3.4518, lng: -76.5325 };
        if (d.includes('granada')) return { lat: 3.4620, lng: -76.5270 };
        if (d.includes('menga')) return { lat: 3.4850, lng: -76.5150 };
        if (d.includes('siloé') || d.includes('siloe')) return { lat: 3.4380, lng: -76.5530 };
        if (d.includes('ciudad jardín') || d.includes('jardin')) return { lat: 3.3900, lng: -76.5450 };
        if (d.includes('santa monica') || d.includes('santa mónica')) return { lat: 3.5010, lng: -76.5060 };
        if (d.includes('pryca')) return { lat: 3.3798, lng: -76.5317 };

        // Fallback con dispersión aleatoria para no solapar pines
        return this._fallbackCali();
    },

    _fallbackCali() {
        return {
            lat: 3.43722 + (Math.random() - 0.5) * 0.02,
            lng: -76.5225 + (Math.random() - 0.5) * 0.02,
        };
    },

    /* ----------------------------------------------------------------
       FEED DE INICIO
    ---------------------------------------------------------------- */
    renderFeedInicio(alertas, containerId = 'inicioAlertsList') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (alertas.length === 0) {
            container.innerHTML = `
                <div class="alert-item alert-info">
                    <div class="alert-icon">
                        <i data-lucide="check-circle" style="width:18px;height:18px;color:var(--green);"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">Todo normal</div>
                        <div class="alert-desc">No hay reportes que afecten la movilidad en este momento.</div>
                    </div>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = alertas.slice(0, 2).map(al => `
            <div class="alert-item alert-${al.severidad === 'alta' ? 'danger' : 'warning'}">
                <div class="alert-icon">
                    <i data-lucide="${this._iconoLucide(al.tipo)}" style="width:18px;height:18px;"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${al.titulo}</div>
                    <div class="alert-desc" style="font-size:.8rem;">${al.descripcion}</div>
                </div>
            </div>`).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /* ----------------------------------------------------------------
       CONTADORES
    ---------------------------------------------------------------- */
    actualizarContadores(total) {
        ['notifBadge', 'inicioAlertCount', 'navAlertChip', 'notifCountBadge', 'alertsCountBadge']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = total;
            });

        const trendEl = document.getElementById('inicioAlertTrend');
        if (trendEl) trendEl.textContent = total > 0 ? `↑ ${total} activas` : 'Vía despejada';
    },

    /* ----------------------------------------------------------------
       TABLA REPORTES CONDUCTOR
    ---------------------------------------------------------------- */
    renderTablaReportes(reportes, tbodyId = 'bodyReportesRecientes') {
        const body = document.getElementById(tbodyId);
        if (!body) return;

        if (reportes.length === 0) {
            body.innerHTML = '<tr><td colspan="4" class="text-center p-4">No has enviado reportes hoy.</td></tr>';
            return;
        }

        body.innerHTML = reportes.map(al => `
            <tr>
                <td>${al.titulo}</td>
                <td class="text-xs">${al.ubicacion}</td>
                <td class="font-bold">${al.ruta}</td>
                <td><span class="tag tag-green">Enviado</span></td>
            </tr>`).join('');
    },

    /* ----------------------------------------------------------------
       PRIVADOS
    ---------------------------------------------------------------- */
    _cardTemplate(al) {
        const level = al.severidad === 'alta' ? 'danger' : al.severidad === 'baja' ? 'success' : 'warning';
        const tagColor = al.severidad === 'alta' ? 'red' : 'amber';
        const tagLabel = al.severidad === 'alta' ? 'Crítica' : 'Activa';
        const hora = al.fecha
            ? new Date(al.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';

        return `
        <div class="alert-item alert-${level}">
            <div class="alert-icon">
                <i data-lucide="${this._iconoLucide(al.tipo)}" style="width:20px;height:20px;"></i>
            </div>
            <div class="alert-content">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                    <div class="alert-title">${al.titulo}</div>
                    <span class="tag tag-${tagColor}">${tagLabel}</span>
                </div>
                <div class="alert-desc">${al.descripcion}</div>
                <div class="alert-time">Reportado: ${hora} · ${al.ubicacion || 'Sector Cali'}</div>
            </div>
        </div>`;
    },

    _emojiTipo(tipo) {
        const emojis = { bloqueo: '🚧', falla: '🔧', seguridad: '🚨', congestion: '🚦', clima: '⛈️' };
        return emojis[tipo] || '⚠️';
    },

    _iconoLucide(tipo) {
        const iconos = { bloqueo: 'traffic-cone', falla: 'wrench', seguridad: 'shield-alert', congestion: 'alert-triangle', clima: 'cloud-rain' };
        return iconos[tipo] || 'alert-triangle';
    },
};

window.AlertaView = AlertaView;