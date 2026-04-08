/**
 * ============================================================
 * MODEL — SesionModel
 * js/models/SesionModel.js
 * Gestión del estado de sesión del usuario en el navegador.
 * Extraído de: js/auth.js
 * ============================================================
 */

const SesionModel = {
    _SESION_KEY: 'wayroute_sesion',
    _USUARIO_KEY: 'movicali_usuario_full',

    /**
     * Obtiene la sesión compacta del usuario autenticado.
     * @returns {{ id, nombre, correo, rol, avatar, timestamp } | null}
     */
    getSesion() {
        const raw = sessionStorage.getItem(this._SESION_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    /**
     * Obtiene el perfil completo del usuario.
     * @returns {object|null}
     */
    getUsuarioCompleto() {
        const raw = sessionStorage.getItem(this._USUARIO_KEY);
        return raw ? JSON.parse(raw) : null;
    },

    /**
     * Guarda la sesión en sessionStorage.
     * @param {object} sesion
     * @param {object} usuarioFull
     */
    guardarSesion(sesion, usuarioFull) {
        sessionStorage.setItem(this._SESION_KEY, JSON.stringify(sesion));
        sessionStorage.setItem(this._USUARIO_KEY, JSON.stringify(usuarioFull));
    },

    /**
     * Destruye la sesión activa.
     */
    destruirSesion() {
        sessionStorage.removeItem(this._SESION_KEY);
        sessionStorage.removeItem(this._USUARIO_KEY);
    },

    /**
     * Verifica si existe una sesión activa con el rol correcto.
     * @param {string} rolRequerido
     * @returns {object|null} Sesión si es válida, null si no
     */
    verificar(rolRequerido = null) {
        const sesion = this.getSesion();
        if (!sesion) return null;
        if (rolRequerido && sesion.rol !== rolRequerido) return null;
        return sesion;
    },

    /**
     * Actualiza datos de la sesión local sin recargar desde Supabase.
     * @param {object} nuevosDatos
     */
    actualizarLocal(nuevosDatos) {
        const usuario = this.getUsuarioCompleto();
        if (!usuario) return;

        const userFull = { ...usuario, ...nuevosDatos };
        if (nuevosDatos.nombres) {
            userFull.nombre = nuevosDatos.nombres + (nuevosDatos.apellidos ? ' ' + nuevosDatos.apellidos : '');
        }
        sessionStorage.setItem(this._USUARIO_KEY, JSON.stringify(userFull));

        const sesion = this.getSesion();
        if (sesion && userFull.nombre) {
            sesion.nombre = userFull.nombre;
            sessionStorage.setItem(this._SESION_KEY, JSON.stringify(sesion));
        }

        return userFull;
    }
};

window.SesionModel = SesionModel;
