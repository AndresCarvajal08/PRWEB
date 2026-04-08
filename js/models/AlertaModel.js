/**
 * ============================================================
 * MODEL — AlertaModel
 * js/models/AlertaModel.js
 * Acceso a datos de alertas/reportes desde Supabase.
 * Extraído de: js/alertas.js
 * ============================================================
 * Responsabilidad: SOLO comunicarse con Supabase.
 * No toca el DOM. No llama showToast. No renderiza nada.
 */

const AlertaModel = {

    /**
     * Obtiene el inicio del día actual en formato ISO (para filtrar "hoy").
     * @returns {string}
     */
    _getHoyISO() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    },

    /**
     * Mapea tipo de incidencia a su etiqueta de texto.
     * @param {string} tipo
     * @returns {string}
     */
    getEtiquetaTipo(tipo) {
        const etiquetas = {
            bloqueo:    'Bloqueo vial',
            falla:      'Falla mecánica',
            seguridad:  'Incidente de seguridad',
            congestion: 'Congestión inusual',
            clima:      'Daño por clima'
        };
        return etiquetas[tipo] || tipo;
    },

    /**
     * Obtiene todas las alertas activas de hoy desde Supabase.
     * @returns {Promise<Array>}
     */
    async obtener() {
        if (!window.supabaseClient) {
            console.warn('[AlertaModel] Supabase no disponible. Retornando array vacío.');
            return [];
        }
        try {
            const { data, error } = await window.supabaseClient
                .from('reportes')
                .select('*')
                .gte('fecha', this._getHoyISO())
                .order('fecha', { ascending: false });

            if (error) {
                console.error('[AlertaModel] Error al obtener alertas:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error('[AlertaModel] Error inesperado:', err);
            return [];
        }
    },

    /**
     * Crea un nuevo reporte en Supabase.
     * @param {object} datos - { tipo, titulo, descripcion, ubicacion, ruta, severidad, conductorId }
     * @returns {Promise<boolean>} true si fue exitoso
     */
    async crear(datos) {
        if (!window.supabaseClient) {
            console.error('[AlertaModel] Supabase no disponible para crear alerta.');
            return false;
        }
        try {
            const nuevoReporte = {
                tipo:         datos.tipo,
                titulo:       datos.titulo,
                descripcion:  datos.descripcion,
                ubicacion:    datos.ubicacion,
                ruta:         datos.ruta || 'N/A',
                severidad:    datos.severidad || 'moderada',
                conductor_id: datos.conductorId,
                fecha:        new Date().toISOString()
            };

            const { error } = await window.supabaseClient
                .from('reportes')
                .insert([nuevoReporte])
                .select();

            if (error) {
                console.error('[AlertaModel] Error al insertar reporte:', error.message);
                return false;
            }
            return true;
        } catch (err) {
            console.error('[AlertaModel] Error crítico al crear alerta:', err);
            return false;
        }
    },

    /**
     * Filtra alertas a las que pertenecen a un conductor específico.
     * @param {Array} alertas
     * @param {string} conductorId
     * @returns {Array}
     */
    filtrarPorConductor(alertas, conductorId) {
        return alertas.filter(a => a.conductor_id === conductorId);
    },

    /**
     * Elimina reportes anteriores a hoy (mantenimiento).
     * @returns {Promise<void>}
     */
    async limpiarAntiguos() {
        if (!window.supabaseClient) return;
        try {
            const { error } = await window.supabaseClient
                .from('reportes')
                .delete()
                .lt('fecha', this._getHoyISO());

            if (error) console.warn('[AlertaModel] No se pudo limpiar reportes antiguos:', error.message);
        } catch (err) {
            console.error('[AlertaModel] Error en limpieza:', err);
        }
    }
};

window.AlertaModel = AlertaModel;

// Retrocompatibilidad: WayAlertas delega a AlertaModel
window.WayAlertas = {
    obtenerAlertas: () => AlertaModel.obtener(),
    crearAlerta: (datos) => AlertaModel.crear(datos),
    limpiarAlertasAntiguas: () => AlertaModel.limpiarAntiguos(),
    getIcono: (tipo) => {
        const iconos = { bloqueo: '🚧', falla: '🔧', seguridad: '🚨', congestion: '🚦', clima: '⛈️' };
        return iconos[tipo] || '⚠️';
    },
    getHoyISO: () => AlertaModel._getHoyISO()
};
