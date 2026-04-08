/**
 * ============================================================
 * CONTROLLER — AuthController
 * js/controllers/AuthController.js
 * Orquestador central para la lógica de inicio de sesión y registro.
 * ============================================================
 */

const AuthController = {
    /**
     * Verifica la sesión actual y redirige si no es válida.
     * @param {string} rolRequerido
     * @returns {object|null}
     */
    requireAuth(rolRequerido) {
        if (!window.SesionModel) return null;
        
        const sesion = window.SesionModel.verificar(rolRequerido);
        if (!sesion) {
            if (rolRequerido) alert('No tienes permisos para acceder a esta sección.');
            window.location.href = '../login.html';
            return null;
        }
        return sesion;
    },

    /**
     * Cierra la sesión activa y redirige al login.
     */
    logout() {
        if (window.SesionModel) window.SesionModel.destruirSesion();
        window.location.href = '../login.html';
    }
};

window.AuthController = AuthController;
// Alias por retrocompatibilidad
window.logoutUsuario = () => AuthController.logout();
window.requireAuth = (rol) => AuthController.requireAuth(rol);
