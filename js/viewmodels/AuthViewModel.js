/**
 * ============================================================
 * VIEWMODEL — AuthViewModel
 * js/viewmodels/AuthViewModel.js
 * Orquestador central para la lógica de inicio de sesión y registro.
 * ============================================================
 */

const AuthViewModel = {
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

window.AuthViewModel = AuthViewModel;
window.AuthController = AuthViewModel; // Alias por retrocompatibilidad
// Alias por retrocompatibilidad para onclick en HTML
window.logoutUsuario = () => AuthViewModel.logout();
window.requireAuth = (rol) => AuthViewModel.requireAuth(rol);
