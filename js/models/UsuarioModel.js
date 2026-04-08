/**
 * ============================================================
 * MODEL — UsuarioModel
 * js/models/UsuarioModel.js
 * Operaciones CRUD de usuarios contra Supabase.
 * Extraído de: js/auth.js (funciones actualizarUsuario, Supabase queries)
 * ============================================================
 */

const UsuarioModel = {

    /**
     * Busca un usuario autenticado por su auth_uid en la tabla usuarios.
     * @param {string} authUid
     * @returns {Promise<object|null>}
     */
    async buscarPorAuthUid(authUid) {
        if (!window.supabaseClient) return null;
        const { data, error } = await window.supabaseClient
            .from('usuarios')
            .select('*')
            .eq('auth_uid', authUid)
            .single();

        if (error) {
            console.error('[UsuarioModel] buscarPorAuthUid error:', error.message);
            return null;
        }
        return data;
    },

    /**
     * Actualiza los datos del usuario actual en Supabase y en sessionStorage.
     * @param {object} nuevosDatos - { nombres, apellidos, celular, barrio }
     * @returns {Promise<{ ok: boolean, usuario?: object, error?: string }>}
     */
    async actualizar(nuevosDatos) {
        const usuario = window.SesionModel?.getUsuarioCompleto();
        if (!usuario) return { ok: false, error: 'No hay sesión activa.' };

        if (window.supabaseClient) {
            const { error } = await window.supabaseClient
                .from('usuarios')
                .update({
                    nombres:   nuevosDatos.nombres,
                    apellidos: nuevosDatos.apellidos,
                    celular:   nuevosDatos.celular,
                    barrio:    nuevosDatos.barrio
                })
                .eq('id', usuario.id);

            if (error) return { ok: false, error: 'Error en base de datos: ' + error.message };
        }

        // Actualizar sessionStorage
        const userFull = window.SesionModel?.actualizarLocal(nuevosDatos) || { ...usuario, ...nuevosDatos };
        return { ok: true, usuario: userFull };
    },

    /**
     * Inserta un nuevo usuario en la tabla 'usuarios' de Supabase.
     * @param {object} perfil
     * @returns {Promise<{ data, error }>}
     */
    async insertar(perfil) {
        if (!window.supabaseClient) return { data: null, error: { message: 'Supabase no disponible.' } };
        return await window.supabaseClient.from('usuarios').insert([perfil]).select().single();
    },

    /**
     * Actualiza perfil del conductor en Supabase (tabla usuarios).
     * @param {string} usuarioId
     * @param {object} datos - { nombre, correo }
     * @returns {Promise<{ ok, error? }>}
     */
    async actualizarConductor(usuarioId, datos) {
        if (!window.supabaseClient) return { ok: false, error: 'Supabase no disponible.' };
        const { error } = await window.supabaseClient
            .from('usuarios')
            .update({ nombre: datos.nombre, correo: datos.correo })
            .eq('id', usuarioId);

        if (error) return { ok: false, error: error.message };
        return { ok: true };
    }
};

window.UsuarioModel = UsuarioModel;
