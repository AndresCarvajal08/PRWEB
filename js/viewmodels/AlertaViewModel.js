/**
 * ============================================================
 * VIEWMODEL — AlertaViewModel
 * js/viewmodels/AlertaViewModel.js
 * Orquesta la sincronización y renderizado de alertas.
 * ============================================================
 */

const AlertaViewModel = {
    _interval: null,
    _idsConocidos: null,

    /**
     * Inicializa la sincronización periódica de alertas.
     * @param {boolean} esConductor 
     */
    init(esConductor = false) {
        this.sincronizar(esConductor);

        // Polling cada 15s Pasajero, 10s Conductor. Se mantiene siempre activo
        // como respaldo, aunque exista suscripción en tiempo real (ver abajo).
        const tiempoSync = esConductor ? 10000 : 15000;
        this._interval = setInterval(() => this.sincronizar(esConductor), tiempoSync);

        this._suscribirRealtime(esConductor);
    },

    /* Complementa (no reemplaza) el polling: si Supabase Realtime está
       disponible y las políticas RLS lo permiten, las alertas nuevas llegan
       en 1-2s en vez de esperar al siguiente sondeo. Si falla por cualquier
       motivo (Realtime no habilitado, RLS, conexión), el polling de arriba
       sigue funcionando igual que hoy. */
    _suscribirRealtime(esConductor) {
        if (!window.supabaseClient?.channel) return;
        try {
            if (this._channel) window.supabaseClient.removeChannel(this._channel);
            this._channel = window.supabaseClient
                .channel('reportes-realtime')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'reportes' }, () => {
                    this.sincronizar(esConductor);
                })
                .subscribe();
        } catch (err) {
            console.warn('[AlertaViewModel] Realtime no disponible, se sigue usando polling:', err.message);
        }
    },

    /**
     * Trae alertas de Model y ordena renderizarlas en View.
     */
    async sincronizar(esConductor) {
        if (!window.AlertaModel || !window.AlertaView) {
            console.warn('[AlertaViewModel] sincronizar: falta AlertaModel o AlertaView, se detiene.',
                { AlertaModel: !!window.AlertaModel, AlertaView: !!window.AlertaView });
            return;
        }

        const alertas = await window.AlertaModel.obtener();
        console.log('[AlertaViewModel] sincronizar esConductor=' + esConductor + ', alertas obtenidas:', alertas.length);

        // Aviso en pantalla al pasajero cuando llega una alerta nueva. En la
        // primera sincronización solo se establece la línea base (para no
        // notificar de golpe todas las alertas que ya existían); al
        // conductor no se le avisa aquí porque ya recibe su propio toast al
        // enviar el reporte.
        if (!esConductor) {
            const idsActuales = new Set(alertas.map(a => a.id));
            if (this._idsConocidos === null) {
                console.log('[AlertaViewModel] Primera sincronización: se establece línea base de', idsActuales.size, 'alertas, no se notifica nada todavía.');
            } else {
                const nuevas = alertas.filter(a => !this._idsConocidos.has(a.id));
                console.log('[AlertaViewModel] Alertas nuevas desde el último sondeo:', nuevas.length, nuevas);
                nuevas.forEach(a => this._notificarAlertaNueva(a));
            }
            this._idsConocidos = idsActuales;
        }

        // 1. Vista global (Alertas tab)
        const listContainer = document.getElementById('globalAlertsContainer') || document.getElementById('alertsListDisplay');
        if (listContainer) {
            window.AlertaView.renderLista(alertas, listContainer.id);
        }

        // 2. Tabs filtradas (congestion, bloqueo, seguridad) + contadores + resumen
        window.AlertaView.renderTabsFiltradas(alertas);

        // 3. Feed de inicio y Contadores
        const feedContainer = document.getElementById('inicioAlertsList') || document.getElementById('inicioAlertsFeed');
        if (feedContainer) {
            window.AlertaView.renderFeedInicio(alertas, feedContainer.id);
        }

        window.AlertaView.actualizarContadores(alertas.length);

        // 3. Tabla de Conductor (mis reportes)
        if (esConductor) {
            const sesion = window.SesionModel ? window.SesionModel.getSesion() : null;
            if (sesion) {
                const misReportesRecientes = window.AlertaModel.filtrarPorConductor(alertas, sesion.id);
                // Para las estadísticas (Hoy/Este mes/Total) se necesita el historial
                // completo del conductor, no solo las alertas activas de las últimas 24h.
                const misReportesTotal = await window.AlertaModel.obtenerPorConductor(sesion.id);
                window.AlertaView.renderTablaReportes(misReportesRecientes, 'bodyReportesRecientes', misReportesTotal);
            }
        }
    },

    /* Muestra el aviso en pantalla. panelPasajero.html usa una función
       showToast() propia; panelConductor.html usa window.Toast.show(); se
       intentan ambas para que funcione sin importar en cuál página corra. */
    _notificarAlertaNueva(alerta) {
        const titulo = alerta.titulo || alerta.tipo || 'Alerta del conductor';
        const partes = [];
        if (alerta.ruta) partes.push(window.WayRoute?.nombreRuta?.(alerta.ruta) || ('Ruta ' + alerta.ruta));
        if (alerta.ubicacion) partes.push(alerta.ubicacion);
        const mensaje = partes.join(', ');

        if (typeof window.mostrarNotificacionPush === 'function') {
            console.log('[AlertaViewModel] Notificando con window.mostrarNotificacionPush():', titulo, mensaje);
            window.mostrarNotificacionPush(titulo, mensaje);
        } else if (typeof window.showToast === 'function') {
            console.log('[AlertaViewModel] Notificando con window.showToast():', titulo, mensaje);
            window.showToast('Alerta del conductor: ' + titulo + (mensaje ? ', ' + mensaje : ''), 6000);
        } else if (window.Toast?.show) {
            console.log('[AlertaViewModel] Notificando con window.Toast.show():', titulo, mensaje);
            window.Toast.show('Alerta del conductor: ' + titulo + (mensaje ? ', ' + mensaje : ''));
        } else {
            console.warn('[AlertaViewModel] No existe ningún mecanismo de notificación disponible en esta página:', titulo, mensaje);
        }
    },

    /**
     * Recibe los datos del form del conductor y crea la alerta.
     * @param {string|null} tipoRapido
     * @param {string|null} tituloOverride - Usado por el botón de Emergencia
     *   para que quede claramente identificado como tal, en vez de un
     *   "Incidente de seguridad" genérico.
     */
    async reportar(tipoRapido = null, tituloOverride = null) {
        if (!window.AlertaModel || !window.SesionModel) return;
        const sesion = window.SesionModel.getSesion();
        const usuarioFull = window.SesionModel.getUsuarioCompleto();

        let datos = {};

        // Si hay un turno realmente activo (con ruta y bus elegidos al iniciar turno),
        // el reporte se etiqueta con esa ruta en vez de la asignada al registrarse,
        // para que el pasajero vea la alerta ligada al bus que está viendo en el mapa.
        const rutaActiva = window.WayRouteTurnoActivo?.ruta || (usuarioFull ? usuarioFull.codigo_ruta : 'N/A');

        if (tipoRapido) {
            datos = {
                tipo: tipoRapido,
                titulo: tituloOverride || window.AlertaModel.getEtiquetaTipo(tipoRapido),
                descripcion: tituloOverride ? 'Botón de emergencia activado por el conductor.' : 'Reporte rápido vía UI de conductor.',
                ubicacion: "Ubicación actual",
                ruta: rutaActiva,
                conductorId: sesion.id,
                severidad: (tipoRapido === 'seguridad' || tipoRapido === 'bloqueo') ? 'alta' : 'moderada'
            };
        } else {
            // Form detallado
            const vTipo = document.getElementById('formTipoIncidencia').value;
            const vDesc = document.getElementById('formDescIncidencia').value;
            const vUbic = document.getElementById('formUbicacionIncidencia').value;
            
            if (!vDesc || !vUbic) {
                if (window.Toast) window.Toast.show('Por favor completa la ubicación y la descripción.');
                return;
            }

            datos = {
                tipo: vTipo,
                titulo: document.getElementById('formTipoIncidencia').options[document.getElementById('formTipoIncidencia').selectedIndex].text,
                descripcion: vDesc,
                ubicacion: vUbic,
                ruta: rutaActiva || document.getElementById('formRutaIncidencia').value,
                severidad: document.getElementById('formSeveridadIncidencia').value,
                conductorId: sesion.id
            };
        }

        const btn = document.getElementById('btnEnviarReporteDetalle');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '⏳ Enviando...';
        }

        // Intentar capturar ubicación GPS si es posible (Opcional)
        let gps = { lat: null, lng: null };
        try {
            // Solo intentamos si el navegador soporta y no estamos en un entorno bloqueado
            if (navigator.geolocation) {
                // OJO: timeout muy corto (antes 3000ms) y sin enableHighAccuracy
                // hacian que el navegador devolviera casi siempre una posicion
                // aproximada por red/IP en vez de GPS real — eso fue lo que puso
                // varios reportes de prueba en Palmira en vez de Cali (~25km de
                // error), y otros ni siquiera alcanzaron a responder a tiempo y
                // quedaron sin coordenadas. Mismos parametros que ya usa
                // compartirUbicacion() en el mapa del pasajero, que sí da una
                // posicion precisa.
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 8000,
                        maximumAge: 60000,
                        enableHighAccuracy: true
                    });
                });
                gps.lat = pos.coords.latitude;
                gps.lng = pos.coords.longitude;

                // En el reporte rápido, "Ubicación actual" era un texto fijo
                // que nunca cambiaba. Con el GPS ya en mano, se reemplaza por
                // la dirección real más cercana (misma técnica de geocodificación
                // inversa que ya usa detectarUbicacion() en el mapa del pasajero).
                if (datos.ubicacion === 'Ubicación actual') {
                    try {
                        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${gps.lat}&lon=${gps.lng}&zoom=17&addressdetails=1`);
                        const geo = await resp.json();
                        const a = geo.address || {};
                        const via = a.road ? `${a.road}${a.house_number ? ' #' + a.house_number : ''}` : null;
                        const barrio = a.neighbourhood || a.suburb || a.quarter;
                        const real = [via, barrio].filter(Boolean).join(', ');
                        if (real) datos.ubicacion = real;
                    } catch (geoErr) {
                        // Sin geocodificación disponible: se deja "Ubicación actual" como respaldo
                    }
                }
            }
        } catch (e) {
            console.warn('[AlertaViewModel] No se usó GPS para el reporte:', e.message);
            // No bloqueamos el reporte por falta de GPS
        }

        const ok = await window.AlertaModel.crear({ ...datos, ...gps });

        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Enviar Reporte a Base de Datos →';
        }

        if (ok) {
            if (window.Toast) window.Toast.show('Reporte guardado exitosamente.');
            // Limpiar formulario detallado
            if (!tipoRapido) {
                if (document.getElementById('formDescIncidencia')) document.getElementById('formDescIncidencia').value = '';
                // No limpiamos ubicación por si quiere reportar algo similar rápido
            }
            // Sincronizar para ver el nuevo marcador
            setTimeout(() => this.sincronizar(true), 800);
        } else {
            console.error('[AlertaViewModel] Falló la creación en AlertaModel');
            if (window.Toast) window.Toast.show('Error: No se pudo conectar con la base de datos de reportes.');
        }
    }
};

window.AlertaViewModel = AlertaViewModel;
window.AlertaController = AlertaViewModel; // Alias retrocompatibilidad
// Alias retrocompatibilidad para onclick en HTML
window.reportar = (tipo) => AlertaViewModel.reportar(tipo);
window.enviarReporteForm = () => AlertaViewModel.reportar(null);
