/**
 * ============================================================
 * CORE — Router
 * js/core/Router.js
 * Navegación entre vistas (SPA) centralizada.
 * Antes estaba duplicada como navigate() en cada HTML.
 * ============================================================
 */

const Router = {
    _currentView: null,
    _onNavigate: null, // callback opcional para efectos secundarios

    /**
     * Navega a una vista de la SPA.
     * @param {string} viewId - ID de la vista (sin el prefijo 'view-')
     */
    navigate(viewId) {
        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

        // Desactivar todos los nav items
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.bottom-nav-item').forEach(i => i.classList.remove('active'));

        // Activar la vista destino
        const targetView = document.getElementById('view-' + viewId);
        if (targetView) {
            targetView.classList.add('active');
            this._currentView = viewId;
        }

        // Activar nav item correspondiente
        const navItem = document.getElementById('nav-' + viewId);
        if (navItem) navItem.classList.add('active');

        const bnavItem = document.getElementById('bnav-' + viewId);
        if (bnavItem) bnavItem.classList.add('active');

        // Scroll al tope del área de contenido
        const contentArea = document.getElementById('contentArea');
        if (contentArea) contentArea.scrollTo(0, 0);

        // Cerrar panel de notificaciones si está abierto
        const notifPanel = document.getElementById('notifPanel');
        if (notifPanel && notifPanel.classList.contains('open')) {
            notifPanel.classList.remove('open');
        }

        // Ejecutar callback opcional
        if (typeof this._onNavigate === 'function') {
            this._onNavigate(viewId);
        }

        // Re-inicializar Lucide Icons (SVGs dinámicos pueden perderse)
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    /**
     * Retorna la vista actualmente activa.
     * @returns {string|null}
     */
    current() {
        return this._currentView;
    },

    /**
     * Registra un callback que se ejecuta en cada navegación.
     * @param {Function} fn
     */
    onNavigate(fn) {
        this._onNavigate = fn;
    }
};

// Alias global para compatibilidad total con el código existente
window.navigate = (viewId) => Router.navigate(viewId);
window.Router = Router;
