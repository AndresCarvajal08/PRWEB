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
    _ultimasAlertas: [],

    /* ----------------------------------------------------------------
       RENDER LISTA
    ---------------------------------------------------------------- */
    renderLista(alertas, containerId = 'globalAlertsContainer') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (alertas.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:28px 16px;color:#6b7280;">
                    <div style="margin-bottom:12px;">
                        <i data-lucide="map-pin" style="width:38px;height:38px;opacity:.35;display:inline-block;"></i>
                    </div>
                    <div style="font-size:.95rem;font-weight:600;color:#374151;margin-bottom:6px;">Sin alertas activas en este momento</div>
                    <div style="font-size:.82rem;line-height:1.55;">
                        El mapa muestra la cobertura de WayRoute en Cali.<br>
                        Cuando los conductores reporten incidentes, aparecerán aquí en tiempo real.
                    </div>
                </div>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } else {
            container.innerHTML = alertas.map(al => this._cardTemplate(al)).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // Siempre guardar alertas y actualizar mapa (aunque sea vacío)
        this.actualizarMapa(alertas);
    },

    /* El mapa de alertas ahora es un iframe de Google Maps — sin Leaflet */
    actualizarMapa(alertas) { this._ultimasAlertas = alertas || []; },

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

    refreshMapa() { /* mapa es iframe de Google Maps — sin acción requerida */ },

    /* ----------------------------------------------------------------
       TABS FILTRADAS — rellena tab-congestion, tab-bloqueo, tab-seguridad
       y actualiza contadores, header y resumen dinámicamente.
    ---------------------------------------------------------------- */
    renderTabsFiltradas(alertas) {
        const tipos = ['congestion', 'bloqueo', 'seguridad'];
        const labels = { congestion: 'congestión', bloqueo: 'bloqueo', seguridad: 'seguridad' };

        tipos.forEach(tipo => {
            const container = document.getElementById('tab-' + tipo);
            if (!container) return;

            const filtradas = alertas.filter(al => al.tipo === tipo);
            if (filtradas.length === 0) {
                container.innerHTML = `<div class="text-sm text-gray text-center p-4">No hay alertas de ${labels[tipo]} activas ahora.</div>`;
                return;
            }
            container.innerHTML = filtradas.map(al => this._cardTemplate(al)).join('');
        });

        this._actualizarBotonesTabs(alertas);
        this._actualizarResumenTipos(alertas);
        this._actualizarHeaderAlertas(alertas);

        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    _actualizarBotonesTabs(alertas) {
        const total = alertas.length;
        const counts = alertas.reduce((acc, al) => { acc[al.tipo] = (acc[al.tipo] || 0) + 1; return acc; }, {});

        const btnTodas = document.getElementById('tabBtn-todas');
        if (btnTodas) btnTodas.textContent = `Todas (${total})`;

        const btnCong = document.getElementById('tabBtn-congestion');
        if (btnCong) btnCong.textContent = `Congestión (${counts.congestion || 0})`;

        const btnBloq = document.getElementById('tabBtn-bloqueo');
        if (btnBloq) btnBloq.textContent = `Bloqueos (${counts.bloqueo || 0})`;

        const btnSeg = document.getElementById('tabBtn-seguridad');
        if (btnSeg) btnSeg.textContent = `Seguridad (${counts.seguridad || 0})`;
    },

    _actualizarResumenTipos(alertas) {
        const total = alertas.length || 1;
        const counts = alertas.reduce((acc, al) => { acc[al.tipo] = (acc[al.tipo] || 0) + 1; return acc; }, {});

        const tipos = [
            { tipo: 'bloqueo', cntId: 'resumenBloqueos', fillId: 'resumenBloqueosFill' },
            { tipo: 'congestion', cntId: 'resumenCongestion', fillId: 'resumenCongestionFill' },
            { tipo: 'seguridad', cntId: 'resumenSeguridad', fillId: 'resumenSeguridadFill' },
            { tipo: 'clima', cntId: 'resumenClima', fillId: 'resumenClimaFill' },
        ];

        tipos.forEach(({ tipo, cntId, fillId }) => {
            const n = counts[tipo] || 0;
            const pct = Math.round((n / total) * 100);

            const cntEl = document.getElementById(cntId);
            if (cntEl) cntEl.textContent = n;

            const fillEl = document.getElementById(fillId);
            if (fillEl) fillEl.style.width = `${pct}%`;
        });
    },

    _actualizarHeaderAlertas(alertas) {
        const criticas = alertas.filter(al => al.severidad === 'alta').length;
        const moderadas = alertas.length - criticas;

        const elCrit = document.getElementById('alertHeaderCriticas');
        if (elCrit) elCrit.textContent = `● ${criticas} Crítica${criticas !== 1 ? 's' : ''}`;

        const elMod = document.getElementById('alertHeaderModeradas');
        if (elMod) elMod.textContent = `● ${moderadas} Moderada${moderadas !== 1 ? 's' : ''}`;
    },
};

window.AlertaView = AlertaView;