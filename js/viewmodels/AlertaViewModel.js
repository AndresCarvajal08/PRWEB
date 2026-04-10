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
        window.AlertaView.renderLista(alertas, 'alertsListDisplay');
        
        // 2. Feed de inicio y Contadores
        window.AlertaView.renderFeedInicio(alertas, 'inicioAlertsFeed');
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
            datos = {
                tipo: document.getElementById('formTipoIncidencia').value,
                titulo: document.getElementById('formTipoIncidencia').options[document.getElementById('formTipoIncidencia').selectedIndex].text,
                descripcion: document.getElementById('formDescIncidencia').value,
                ubicacion: document.getElementById('formUbicacionIncidencia').value,
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

        const ok = await window.AlertaModel.crear(datos);

        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Enviar Reporte a Base de Datos →';
        }

        if (ok) {
            if (window.Toast) window.Toast.show('✅ Reporte guardado en Supabase.');
            if (document.getElementById('formDescIncidencia')) document.getElementById('formDescIncidencia').value = '';
            setTimeout(() => this.sincronizar(true), 500);
        } else {
            if (window.Toast) window.Toast.show('❌ Error al intentar guardar en la base de datos.');
        }
    }
};

window.AlertaViewModel = AlertaViewModel;
window.AlertaController = AlertaViewModel; // Alias retrocompatibilidad
// Alias retrocompatibilidad para onclick en HTML
window.reportar = (tipo) => AlertaViewModel.reportar(tipo);
window.enviarReporteForm = () => AlertaViewModel.reportar(null);
