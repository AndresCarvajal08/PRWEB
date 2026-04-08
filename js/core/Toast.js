/**
 * ============================================================
 * CORE — Toast
 * js/core/Toast.js
 * Utilidad centralizada de notificaciones toast.
 * Antes estaba duplicada en cada HTML como función inline.
 * ============================================================
 */

const Toast = {
    _timer: null,

    /**
     * Muestra un mensaje toast en pantalla.
     * @param {string} msg - Mensaje a mostrar
     * @param {number} duration - Duración en ms (default: 2800)
     */
    show(msg, duration = 2800) {
        const t = document.getElementById('toast');
        const msgEl = document.getElementById('toastMsg');
        if (!t || !msgEl) return;

        msgEl.textContent = msg;
        t.classList.add('show');

        clearTimeout(this._timer);
        this._timer = setTimeout(() => t.classList.remove('show'), duration);
    }
};

// Alias global para compatibilidad con el código existente (panelPasajero, panelConductor, etc.)
window.showToast = (msg, duration) => Toast.show(msg, duration);
window.Toast = Toast;
