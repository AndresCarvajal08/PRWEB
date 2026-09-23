/**
 * ============================================================
 * MODEL — ContactoModel
 * js/models/ContactoModel.js
 * CRUD de contactos de confianza (emergencia) contra Supabase.
 * Tabla: contactos_emergencia (id, usuario_id, nombre, telefono, relacion, created_at)
 * ============================================================
 */

const ContactoModel = {

    async obtenerPorUsuario(usuarioId) {
        if (!window.supabaseClient || !usuarioId) return [];
        try {
            const { data, error } = await window.supabaseClient
                .from('contactos_emergencia')
                .select('*')
                .eq('usuario_id', usuarioId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('[ContactoModel] Error al obtener contactos:', error.message);
                return [];
            }
            return data || [];
        } catch (err) {
            console.error('[ContactoModel] Error inesperado:', err);
            return [];
        }
    },

    async crear(usuarioId, { nombre, telefono, relacion }) {
        if (!window.supabaseClient) return { ok: false, error: 'Supabase no disponible.' };
        const { data, error } = await window.supabaseClient
            .from('contactos_emergencia')
            .insert([{ usuario_id: usuarioId, nombre, telefono, relacion: relacion || null }])
            .select()
            .single();

        if (error) return { ok: false, error: error.message };
        return { ok: true, contacto: data };
    },

    async eliminar(contactoId) {
        if (!window.supabaseClient) return { ok: false, error: 'Supabase no disponible.' };
        const { error } = await window.supabaseClient
            .from('contactos_emergencia')
            .delete()
            .eq('id', contactoId);

        return error ? { ok: false, error: error.message } : { ok: true };
    }
};

window.ContactoModel = ContactoModel;
