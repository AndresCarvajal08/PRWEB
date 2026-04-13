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
     * Obtiene el tiempo de hace 24 horas en formato ISO.
     * @returns {string}
     */
    _get24hAgoISO() {
        const d = new Date();
        d.setHours(d.getHours() - 24);
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
                .gte('fecha', this._get24hAgoISO())
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

            // Solo agregar lat/lng si tienen valor REAL (no null)
            if (datos.lat && datos.lng) {
                nuevoReporte.lat = datos.lat;
                nuevoReporte.lng = datos.lng;
            }

            let response = await window.supabaseClient.from('reportes').insert([nuevoReporte]);

            // Si hay error, verificar si es por columnas faltantes (en caso de que el usuario no haya actualizado Supabase)
            if (response.error) {
                const msg = response.error.message.toLowerCase();
                if (msg.includes('column') && (msg.includes('lat') || msg.includes('lng'))) {
                    console.warn('[AlertaModel] Tabla reportes no tiene columnas lat/lng. Reintentando sin ellas...');
                    delete nuevoReporte.lat;
                    delete nuevoReporte.lng;
                    response = await window.supabaseClient.from('reportes').insert([nuevoReporte]);
                }
            }

            if (response.error) {
                console.error('[AlertaModel] Error al insertar reporte:', response.error.message);
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
