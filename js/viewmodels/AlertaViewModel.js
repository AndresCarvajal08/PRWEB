/**
 * ============================================================
 * VIEWMODEL — AlertaViewModel
 * js/viewmodels/AlertaViewModel.js
 * Orquesta la sincronización y renderizado de alertas.
 * ============================================================
 */

const AlertaViewModel = {
    _interval: null,

    /**
     * Inicializa la sincronización periódica de alertas.
     * @param {boolean} esConductor 
     */
    init(esConductor = false) {
        this.sincronizar(esConductor);
        
        // Polling cada 15s Pasajero, 10s Conductor
        const tiempoSync = esConductor ? 10000 : 15000;
        this._interval = setInterval(() => this.sincronizar(esConductor), tiempoSync);
    },

    /**
     * Trae alertas de Model y ordena renderizarlas en View.
     */
    async sincronizar(esConductor) {
        if (!window.AlertaModel || !window.AlertaView) return;

        const alertas = await window.AlertaModel.obtener();
        
        // 1. Vista global (Alertas tab)
        const listContainer = document.getElementById('globalAlertsContainer') || document.getElementById('alertsListDisplay');
        if (listContainer) {
            window.AlertaView.renderLista(alertas, listContainer.id);
        }

        // 2. Tabs filtradas (congestion, bloqueo, seguridad) + contadores + resumen
        window.AlertaView.renderTabsFiltradas(alertas);

        // 3. Feed de inicio y Contadores
        const feedContainer = document.getElementById('inicioAlertsList') || document.getElementById('inicioAlertsFeed');
        if (feedContainer) {
            window.AlertaView.renderFeedInicio(alertas, feedContainer.id);
        }

        window.AlertaView.actualizarContadores(alertas.length);

        // 3. Tabla de Conductor (mis reportes)
        if (esConductor) {
            const sesion = window.SesionModel ? window.SesionModel.getSesion() : null;
            if (sesion) {
                const misReportes = window.AlertaModel.filtrarPorConductor(alertas, sesion.id);
                window.AlertaView.renderTablaReportes(misReportes, 'bodyReportesRecientes');
            }
        }
    },

    /**
     * Recibe los datos del form del conductor y crea la alerta.
     */
    async reportar(tipoRapido = null) {
        if (!window.AlertaModel || !window.SesionModel) return;
        const sesion = window.SesionModel.getSesion();
        const usuarioFull = window.SesionModel.getUsuarioCompleto();
        
        let datos = {};

        if (tipoRapido) {
            datos = {
                tipo: tipoRapido,
                titulo: window.AlertaModel.getEtiquetaTipo(tipoRapido),
                descripcion: 'Reporte rápido vía UI de conductor.',
                ubicacion: "Ubicación actual",
                ruta: usuarioFull ? usuarioFull.codigo_ruta : 'N/A',
                conductorId: sesion.id,
                severidad: (tipoRapido === 'seguridad' || tipoRapido === 'bloqueo') ? 'alta' : 'moderada'
            };
        } else {
            // Form detallado
            const vTipo = document.getElementById('formTipoIncidencia').value;
            const vDesc = document.getElementById('formDescIncidencia').value;
            const vUbic = document.getElementById('formUbicacionIncidencia').value;
            
            if (!vDesc || !vUbic) {
                if (window.Toast) window.Toast.show('⚠️ Por favor completa la ubicación y la descripción.');
                return;
            }

            datos = {
                tipo: vTipo,
                titulo: document.getElementById('formTipoIncidencia').options[document.getElementById('formTipoIncidencia').selectedIndex].text,
                descripcion: vDesc,
                ubicacion: vUbic,
                ruta: document.getElementById('formRutaIncidencia').value,
                severidad: document.getElementById('formSeveridadIncidencia').value,
                conductorId: sesion.id
            };
        }

        const btn = document.getElementById('btnEnviarReporteDetalle');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Enviando...';
        }

        // Intentar capturar ubicación GPS si es posible (Opcional)
        let gps = { lat: null, lng: null };
        try {
            // Solo intentamos si el navegador soporta y no estamos en un entorno bloqueado
            if (navigator.geolocation) {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { 
                        timeout: 3000, 
                        maximumAge: 60000 
                    });
                });
                gps.lat = pos.coords.latitude;
                gps.lng = pos.coords.longitude;
            }
        } catch (e) {
            console.warn('[AlertaViewModel] No se usó GPS para el reporte:', e.message);
            // No bloqueamos el reporte por falta de GPS
        }

        const ok = await window.AlertaModel.crear({ ...datos, ...gps });

        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Enviar Reporte a Base de Datos →';
        }

        if (ok) {
            if (window.Toast) window.Toast.show('✅ Reporte guardado exitosamente.');
            // Limpiar formulario detallado
            if (!tipoRapido) {
                if (document.getElementById('formDescIncidencia')) document.getElementById('formDescIncidencia').value = '';
                // No limpiamos ubicación por si quiere reportar algo similar rápido
            }
            // Sincronizar para ver el nuevo marcador
            setTimeout(() => this.sincronizar(true), 800);
        } else {
            console.error('[AlertaViewModel] Falló la creación en AlertaModel');
            if (window.Toast) window.Toast.show('❌ Error: No se pudo conectar con la base de datos de reportes.');
        }
    }
};

window.AlertaViewModel = AlertaViewModel;
window.AlertaController = AlertaViewModel; // Alias retrocompatibilidad
// Alias retrocompatibilidad para onclick en HTML
window.reportar = (tipo) => AlertaViewModel.reportar(tipo);
window.enviarReporteForm = () => AlertaViewModel.reportar(null);
