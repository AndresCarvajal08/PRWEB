/**
 * ============================================================
 * MODEL — ConductorModel
 * js/models/ConductorModel.js
 * Gestión de datos técnicos de conductores y vehículos.
 * ============================================================
 */

const ConductorModel = {
    /**
     * Obtiene los datos técnicos de un conductor (vehículo, licencia, empresa).
     * @param {string} usuarioId 
     * @returns {Promise<object|null>}
     */
    async obtenerDetalles(usuarioId) {
        if (!window.supabaseClient) return null;

        const { data, error } = await window.supabaseClient
            .from('conductores')
            .select('*')
            .eq('id', usuarioId)
            .single();

        if (error) {
            console.error('[ConductorModel] Error obteniendo detalles:', error.message);
            return null;
        }

        return data;
    },

    /**
     * Actualiza información técnica del conductor.
     * @param {string} usuarioId 
     * @param {object} datos 
     * @returns {Promise<boolean>}
     */
    async actualizarDetalles(usuarioId, datos) {
        if (!window.supabaseClient) return false;

        const { error } = await window.supabaseClient
            .from('conductores')
            .update(datos)
            .eq('id', usuarioId);

        if (error) {
            console.error('[ConductorModel] Error actualizando detalles:', error.message);
            return false;
        }

        return true;
    }
};

window.ConductorModel = ConductorModel;
