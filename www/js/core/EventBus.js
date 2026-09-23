/**
 * ============================================================
 * CORE — EventBus
 * js/core/EventBus.js
 * Sistema pub/sub simple para comunicación desacoplada
 * entre Controllers sin referencias directas.
 * ============================================================
 *
 * Uso:
 *   EventBus.on('alerta:nueva', (data) => AlertaView.render(data));
 *   EventBus.emit('alerta:nueva', { titulo: '...' });
 *   EventBus.off('alerta:nueva', handler);
 */

const EventBus = {
    _listeners: {},

    /**
     * Suscribirse a un evento.
     * @param {string} event
     * @param {Function} handler
     */
    on(event, handler) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(handler);
    },

    /**
     * Desubscribirse de un evento.
     * @param {string} event
     * @param {Function} handler
     */
    off(event, handler) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(h => h !== handler);
    },

    /**
     * Emitir un evento con datos opcionales.
     * @param {string} event
     * @param {*} data
     */
    emit(event, data) {
        if (!this._listeners[event]) return;
        this._listeners[event].forEach(handler => {
            try {
                handler(data);
            } catch (err) {
                console.error(`[EventBus] Error en handler de '${event}':`, err);
            }
        });
    },

    /**
     * Suscribirse una sola vez.
     * @param {string} event
     * @param {Function} handler
     */
    once(event, handler) {
        const wrapper = (data) => {
            handler(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }
};

window.EventBus = EventBus;
