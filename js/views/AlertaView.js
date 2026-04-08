/**
 * ============================================================
 * VIEW — AlertaView
 * js/views/AlertaView.js
 * Renderizado de tarjetas de alerta en el DOM.
 * No conoce Supabase. Solo recibe datos y pinta HTML.
 * ============================================================
 */

const AlertaView = {

    /**
     * Renderiza la lista completa de alertas en el contenedor de la vista Alertas.
     * @param {Array} alertas
     * @param {string} containerId - ID del elemento DOM destino
     */
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
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Renderiza el feed rápido de alertas en la vista de Inicio (máx. 2).
     * @param {Array} alertas
     * @param {string} containerId
     */
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

    /**
     * Actualiza los contadores/badges de alertas en nav y stats.
     * @param {number} total
     */
    actualizarContadores(total) {
        const ids = ['notifBadge', 'inicioAlertCount', 'navAlertChip',
                     'notifCountBadge', 'alertsCountBadge'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = total;
        });

        const trendEl = document.getElementById('inicioAlertTrend');
        if (trendEl) {
            trendEl.textContent = total > 0 ? `↑ ${total} activas` : 'Vía despejada';
        }
    },

    /**
     * Renderiza la tabla de reportes recientes del conductor.
     * @param {Array} reportes
     * @param {string} tbodyId
     */
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

    // ── Privados ─────────────────────────────────

    _cardTemplate(al) {
        const level = al.severidad === 'alta' ? 'danger' : al.severidad === 'baja' ? 'success' : 'warning';
        const tagColor = al.severidad === 'alta' ? 'red' : 'amber';
        const tagLabel = al.severidad === 'alta' ? 'Crítica' : 'Activa';
        const hora = new Date(al.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

    _iconoLucide(tipo) {
        const iconos = {
            bloqueo:    'traffic-cone',
            falla:      'wrench',
            seguridad:  'shield-alert',
            congestion: 'alert-triangle',
            clima:      'cloud-rain'
        };
        return iconos[tipo] || 'alert-triangle';
    }
};

window.AlertaView = AlertaView;
