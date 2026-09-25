/**
 * ============================================================
 * VIEWMODEL — PasajeroViewModel
 * js/viewmodels/PasajeroViewModel.js
 * Centraliza la lógica de inicialización y eventos de pasajero.
 * Mantiene intacta la lógica original (Reloj, IA, Stats).
 * ============================================================
 */

console.log('[PasajeroViewModel] archivo cargado, version con seguimiento de turnos activos');

document.addEventListener('DOMContentLoaded', () => {
    console.log('[PasajeroViewModel] DOMContentLoaded disparado');

    // 1. Verificar autenticación
    if (!window.AuthViewModel && !window.AuthController) {
        console.warn('[PasajeroViewModel] Se detiene: no existe window.AuthViewModel ni window.AuthController');
        return;
    }
    const _auth = window.AuthViewModel || window.AuthController;
    const sesion = _auth.requireAuth('pasajero');
    if (!sesion) {
        console.warn('[PasajeroViewModel] Se detiene: requireAuth("pasajero") no devolvió sesión');
        return;
    }
    console.log('[PasajeroViewModel] Sesión OK, continuando inicialización', sesion);

    // 2. Inicializar Vistas Básicas
    let usuarioFull = window.SesionModel ? window.SesionModel.getUsuarioCompleto() : null;
    
    // Si no hay datos completos localmente, traerlos de la base de datos
    if (!usuarioFull && sesion.id && window.UsuarioModel) {
        window.UsuarioModel.buscarPorAuthUid(sesion.id).then(u => {
            if (u) {
                usuarioFull = u;
                if (window.SesionModel) sessionStorage.setItem('movicali_usuario_full', JSON.stringify(u));
                if (window.NavView) window.NavView.actualizarPerfilPantalla(u, sesion);
                if (u.barrio) actualizarBarrioContexto(u.barrio);
                cargarDatosPerfil(u);
            }
        });
    }

    if (window.NavView) {
        window.NavView.actualizarUsuarioNav(sesion);
        window.NavView.actualizarPerfilPantalla(usuarioFull, sesion);
    }
    
    // Iniciar Módulo de Alertas (polling cada 15s)
    const _alertas = window.AlertaViewModel || window.AlertaController;
    if (_alertas) {
        _alertas.init(false);
    }

    // ── Seguimiento de turnos activos: resalta en el mapa el bus que tiene
    // un conductor real en turno, y fija el contexto del asistente de IA
    // en esa ruta. Antes de que exista un turno activo, el bus se ve igual
    // que el resto de la flota simulada (ver MapaService.resaltarBusActivo). ──
    let _busesResaltados = new Set();
    async function sincronizarTurnosActivos() {
        if (!window.TurnoModel || !window.WayRoute) {
            console.warn('[PasajeroViewModel] sincronizarTurnosActivos: falta window.TurnoModel o window.WayRoute, se detiene.',
                { TurnoModel: !!window.TurnoModel, WayRoute: !!window.WayRoute });
            return;
        }
        const activos = await window.TurnoModel.obtenerActivos();
        console.log('[PasajeroViewModel] Turnos activos encontrados:', activos.length, activos);

        const nombresPorId = activos.length && window.UsuarioModel
            ? await window.UsuarioModel.obtenerNombresPorIds(activos.map(t => t.conductor_id))
            : {};

        const clavesVistas = new Set();
        activos.forEach(t => {
            if (!t.ruta || !t.numero_bus) {
                console.warn('[PasajeroViewModel] Turno activo sin ruta o numero_bus, no se puede resaltar. ' +
                    'Si numero_bus falta, probablemente falta correr en Supabase: ' +
                    'ALTER TABLE turnos ADD COLUMN numero_bus integer;', t);
                return;
            }
            const clave = t.ruta + '|' + t.numero_bus;
            clavesVistas.add(clave);
            const conductor = nombresPorId[t.conductor_id];
            const nombre = conductor ? `${conductor.nombres || ''} ${conductor.apellidos || ''}`.trim() : undefined;
            const resaltado = window.WayRoute.resaltarBusActivo(t.ruta, t.numero_bus, { nombre, horaInicio: t.hora_inicio });
            if (!resaltado) {
                console.warn('[PasajeroViewModel] No se pudo resaltar el bus, revisa que "' + t.ruta +
                    '" coincida exactamente con una clave de MapaService y que el mapa ya se haya abierto una vez.');
            } else {
                console.log('[PasajeroViewModel] Bus resaltado con éxito:', t.ruta, 'bus', t.numero_bus, 'conductor', nombre);
            }
            _busesResaltados.add(clave);
        });

        // Quitar el resalte de turnos que ya no están activos
        _busesResaltados.forEach(clave => {
            if (clavesVistas.has(clave)) return;
            const [ruta, numeroBus] = clave.split('|');
            window.WayRoute.quitarResaltadoBus(ruta, parseInt(numeroBus, 10));
        });
        _busesResaltados = clavesVistas;

        // El asistente de IA prioriza la ruta del primer turno activo
        if (typeof window.fijarContextoRutaIA === 'function') {
            window.fijarContextoRutaIA(activos[0]?.ruta || null);
        }

        // El mapa muestra solo las rutas con conductor real en turno ahora
        // mismo. Si no hay ningún turno activo, se ven todas (para no dejar
        // el mapa vacío cuando nadie ha iniciado turno). EXCEPTO si el
        // pasajero eligió a mano ver una ruta en concreto (ver verRuta() en
        // panelPasajero.html) — esa selección manual gana mientras siga
        // activa, para que este sondeo (cada 7s) no se la pise.
        if (typeof window.WayRoute?.mostrarSoloRutas === 'function') {
            if (window.WayRouteRutaEnfocada) {
                window.WayRoute.mostrarSoloRutas([window.WayRouteRutaEnfocada]);
            } else {
                const clavesConTurno = [...new Set(activos.filter(t => t.ruta).map(t => t.ruta))];
                window.WayRoute.mostrarSoloRutas(clavesConTurno);
            }
        }
    }
    sincronizarTurnosActivos();
    setInterval(sincronizarTurnosActivos, 7000);

    // 3. ── LÓGICA ESPECÍFICA DE PASAJERO (Migrada del HTML) ──
    const userFirstName = sesion.nombre ? sesion.nombre.split(' ')[0] : 'Pasajero';

    // A. Actualizar Fecha y Hora
    function actualizarReloj() {
        const now = new Date();
        const opciones = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const str = now.toLocaleDateString('es-ES', opciones);
        const capitalizada = str.charAt(0).toUpperCase() + str.slice(1);
        const dtEl = document.getElementById('currentDateTime');
        if (dtEl) dtEl.textContent = `Cali, Valle del Cauca • ${capitalizada}`;

        const iaHoraEl = document.getElementById('iaHoraContexto');
        if (iaHoraEl) iaHoraEl.textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    actualizarReloj();
    setInterval(actualizarReloj, 60000);

    // B. Actualizar Stats Buses Reales
    function actualizarStatsBuses() {
        if (window.WayRoute && typeof window.WayRoute.tiempoLlegadaProximo === 'function') {
            const tiempos = window.WayRoute.tiempoLlegadaProximo();
            if (tiempos && tiempos.length > 0) {
                const proximo = tiempos[0]; // La Ermita
                const tGuala = document.getElementById('statTiempoGuala');
                const pGuala = document.getElementById('statProximaGuala');
                const rActivas = document.getElementById('statRutasActivas');

                if (tGuala) tGuala.innerHTML = `${proximo.minutos}<span style="font-size:1rem;font-weight:400;color:var(--gray-400)"> min</span>`;
                if (pGuala) pGuala.textContent = `Bus ${proximo.busProximo} llegando a ${proximo.parada}`;
                // Antes era un '4' fijo en el texto, se quedaba desactualizado
                // cada vez que se agregaba o quitaba una ruta (ej. Calle 17).
                if (rActivas && typeof window.WayRoute.getConfigRutas === 'function') {
                    rActivas.textContent = window.WayRoute.getConfigRutas().length;
                }
            }
        }
    }
    setTimeout(actualizarStatsBuses, 1000);
    setInterval(actualizarStatsBuses, 5000);

    // B2. Tarjetas "Rutas disponibles ahora" del inicio: antes eran 4
    // tarjetas fijas (G-07/B-22A/G-12/B-14) que nunca reflejaban las rutas
    // reales. Ahora se generan a partir de la configuración real de rutas,
    // así que una ruta nueva aparece sola, sin tocar este archivo de nuevo.
    function actualizarRutasDisponiblesGrid() {
        const grid = document.getElementById('rutasDisponiblesGrid');
        if (!grid || !window.WayRoute?.getConfigRutas || !window.WayRoute?.tiempoLlegadaProximo) return;

        const rutas = window.WayRoute.getConfigRutas();
        const tiempos = window.WayRoute.tiempoLlegadaProximo();

        grid.innerHTML = rutas.map(r => {
            const delaRuta = tiempos.filter(t => t.ruta === r.clave);
            const masCercano = delaRuta.length ? delaRuta.reduce((a, b) => a.minutos < b.minutos ? a : b) : null;
            const minutos = masCercano ? masCercano.minutos : null;
            const tagClase = minutos === null ? 'tag-gray' : (minutos <= 5 ? 'tag-green' : 'tag-amber');
            const etiquetaTiempo = minutos === null ? 'Sin datos' : `${minutos} min`;
            // r.label es la etiqueta de VEHICULO ("Bus La Ermita", "Guala"), no
            // el nombre de la ruta, y r.clave es el identificador tecnico
            // interno — ninguno de los dos es lo que debe ver el pasajero aqui.
            const nombreVisible = window.WayRoute?.nombreRuta?.(r.clave) || r.clave;
            return `
                <div class="route-card" onclick="verRuta('${r.clave}')">
                    <div style="font-weight:800;font-size:1.1rem;margin-bottom:4px;">${nombreVisible}</div>
                    <div class="text-xs text-gray">${r.esGuala ? 'Guala' : 'Bus'}</div>
                    <div class="tag ${tagClase} mt-2" style="font-size:10px;">${etiquetaTiempo}</div>
                </div>`;
        }).join('');
    }
    setTimeout(actualizarRutasDisponiblesGrid, 1000);
    setInterval(actualizarRutasDisponiblesGrid, 5000);

    // C. Personalizar Banner IA y Chat
    const iaHora = document.getElementById('iaRecomendacionHora');
    if (iaHora) {
        const dias = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
        const hoy = dias[new Date().getDay()];
        iaHora.textContent = `los ${hoy} a esta hora`;
    }

    const aiMessages = document.getElementById('aiMessages');
    function actualizarBarrioContexto(barrio) {
        if (!barrio) return;
        const mapaOrigen = document.getElementById('mapaOrigen');
        if (mapaOrigen) mapaOrigen.value = barrio;
        const quickOrigin = document.getElementById('quickOrigin');
        if (quickOrigin) quickOrigin.value = barrio;
        
        const ctxUbicacion = document.getElementById('ctxUbicacion');
        if (ctxUbicacion) ctxUbicacion.textContent = `${barrio}, Cali`;
        
        // Actualizar mensaje de IA si existe
        if (aiMessages) {
            const firstMsg = aiMessages.querySelector('.msg-bubble');
            if (firstMsg) {
                firstMsg.innerHTML = `¡Hola ${userFirstName}! Soy WayAI, tu asistente de movilidad para Cali.<br><br>` +
                    `Veo que estás en el barrio <strong>${barrio}</strong>. ` +
                    `¿A dónde necesitas ir hoy? Puedo recomendarte la ruta más segura y económica según el tráfico actual.`;
            }
        }
    }
    
    if (usuarioFull?.barrio) actualizarBarrioContexto(usuarioFull.barrio);

    function updateCtxTime() {
        const now = new Date();
        const ctxHora = document.getElementById('ctxHora');
        const ctxDia = document.getElementById('ctxDia');
        if (ctxHora) {
            const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });
            const isPico = (now.getHours() >= 6 && now.getHours() <= 9) || (now.getHours() >= 17 && now.getHours() <= 20);
            ctxHora.textContent = `${timeStr} ${isPico ? '(hora pico)' : '(hora valle)'}`;
        }
        if (ctxDia) {
            const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            ctxDia.textContent = `${dias[now.getDay()]} ${now.getDay() === 0 || now.getDay() === 6 ? 'festivo' : 'laboral'}`;
        }
    }
    updateCtxTime();
    setInterval(updateCtxTime, 60000);

    // E. Cargar foto y estadísticas reales de perfil
    async function cargarDatosPerfil(usuario) {
        if (!usuario) return;

        // Mostrar foto si existe
        if (usuario.avatar_url && window.NavView) {
            window.NavView.mostrarFoto(usuario.avatar_url);
        }

        // Meses activo desde fecha_registro
        if (usuario.fecha_registro) {
            const meses = Math.floor((new Date() - new Date(usuario.fecha_registro)) / (1000 * 60 * 60 * 24 * 30));
            const desde = new Date(usuario.fecha_registro).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
            const elMeses = document.getElementById('statMesesActivo');
            const elDesde = document.getElementById('statMiembroDesde');
            if (elMeses) elMeses.textContent = meses > 0 ? meses : '< 1';
            if (elDesde) elDesde.textContent = desde;
        }

        // Contar reportes enviados por este usuario
        if (window.supabaseClient && usuario.id) {
            try {
                const { count } = await window.supabaseClient
                    .from('reportes')
                    .select('*', { count: 'exact', head: true })
                    .eq('conductor_id', usuario.id);
                const elRep = document.getElementById('statReportesPerfil');
                if (elRep) elRep.textContent = count ?? 0;
            } catch (_) {}
        }
    }

    // Llamar cuando el usuario esté disponible
    if (usuarioFull) {
        cargarDatosPerfil(usuarioFull);
    } else if (sesion.id && window.UsuarioModel) {
        window.UsuarioModel.buscarPorAuthUid(sesion.id).then(u => {
            if (u) cargarDatosPerfil(u);
        });
    }

    // F. Subir foto de perfil
    window.triggerFotoUpload = function () {
        document.getElementById('inputFotoPerfil')?.click();
    };

    window.subirFotoPerfil = async function (input) {
        const file = input.files[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            window.Toast?.show('La imagen no puede superar 3MB');
            return;
        }

        const usuario = window.SesionModel?.getUsuarioCompleto();
        if (!usuario || !window.supabaseClient) return;

        // Mostrar spinner
        const spinner = document.getElementById('avatarSpinner');
        const overlay = document.querySelector('.avatar-edit-overlay');
        if (spinner) spinner.style.display = 'flex';
        if (overlay) overlay.style.display = 'none';

        try {
            const ext = file.name.split('.').pop();
            const fileName = `${usuario.id}.${ext}`;

            const { error: upError } = await window.supabaseClient.storage
                .from('avatares')
                .upload(fileName, file, { upsert: true, contentType: file.type });

            if (upError) throw upError;

            const { data: { publicUrl } } = window.supabaseClient.storage
                .from('avatares')
                .getPublicUrl(fileName);

            // Cachebust para forzar recarga
            const urlConCache = publicUrl + '?t=' + Date.now();

            const { error: updError } = await window.supabaseClient
                .from('usuarios')
                .update({ avatar_url: urlConCache })
                .eq('id', usuario.id);

            if (updError) throw updError;

            // Actualizar sesión local
            usuario.avatar_url = urlConCache;
            sessionStorage.setItem('movicali_usuario_full', JSON.stringify(usuario));

            // Mostrar en UI
            if (window.NavView) window.NavView.mostrarFoto(urlConCache);
            window.Toast?.show('Foto de perfil actualizada');

        } catch (e) {
            window.Toast?.show('Error al subir foto: ' + e.message);
            // Restaurar iniciales
            const perfilAvt = document.getElementById('perfilAvatarLg');
            if (perfilAvt && !perfilAvt.querySelector('img')) {
                perfilAvt.textContent = sesion.avatar || sesion.nombre?.slice(0, 2).toUpperCase() || '?';
            }
        } finally {
            if (spinner) spinner.style.display = 'none';
            if (overlay) overlay.style.display = '';
            input.value = '';
        }
    };

    // G. Lógica de Guardado (MVVM — ViewModel expone guardarPerfil a la Vista)
    window.guardarPerfil = async function () {
        const btn = document.getElementById('btnGuardarPerfil');
        if (!btn || !window.UsuarioModel) return;

        const nuevosDatos = {
            nombres: document.getElementById('inputPerfilNombre').value,
            correo: document.getElementById('inputPerfilCorreo').value,
            celular: document.getElementById('inputPerfilCelular').value,
            barrio: document.getElementById('inputPerfilBarrio').value
        };

        const partes = nuevosDatos.nombres.split(' ');
        nuevosDatos.nombres = partes[0];
        nuevosDatos.apellidos = partes.length > 1 ? partes.slice(1).join(' ') : '';

        btn.disabled = true;
        btn.textContent = 'Guardando...';

        const result = await window.UsuarioModel.actualizar(nuevosDatos);

        btn.disabled = false;
        btn.textContent = 'Guardar cambios';

        if (result.ok) {
            window.Toast.show('Datos actualizados correctamente en Supabase.');

            // Actualizar Vistas
            const updatedUser = result.usuario;
            document.getElementById('perfilNombreHeader').textContent = updatedUser.nombre;
            document.getElementById('perfilContactoHeader').textContent = updatedUser.correo + ' · ' + updatedUser.celular;
            document.getElementById('perfilUbicacionHeader').textContent = updatedUser.barrio + ', Cali · Pasajero activo';

            const viewNombre = document.getElementById('viewPerfilNombre');
            if (viewNombre) viewNombre.textContent = updatedUser.nombre || '—';
            const viewCorreo = document.getElementById('viewPerfilCorreo');
            if (viewCorreo) viewCorreo.textContent = updatedUser.correo || '—';
            const viewCelular = document.getElementById('viewPerfilCelular');
            if (viewCelular) viewCelular.textContent = updatedUser.celular || '—';
            const viewBarrio = document.getElementById('viewPerfilBarrio');
            if (viewBarrio) viewBarrio.textContent = updatedUser.barrio || '—';

            if (typeof window.cerrarModalEditarPerfil === 'function') window.cerrarModalEditarPerfil();

            window.NavView.actualizarUsuarioNav(window.SesionModel.getSesion());
        } else {
            window.Toast.show('Error: ' + result.error);
        }
    };
});
