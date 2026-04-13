/**
 * ============================================================
 * VIEWMODEL — PasajeroViewModel
 * js/viewmodels/PasajeroViewModel.js
 * Centraliza la lógica de inicialización y eventos de pasajero.
 * Mantiene intacta la lógica original (Reloj, IA, Stats).
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar autenticación
    if (!window.AuthViewModel && !window.AuthController) return;
    const _auth = window.AuthViewModel || window.AuthController;
    const sesion = _auth.requireAuth('pasajero');
    if (!sesion) return;

    // 2. Inicializar Vistas Básicas
    let usuarioFull = window.SesionModel ? window.SesionModel.getUsuarioCompleto() : null;
    
    // Si no hay datos completos localmente, intentar traerlos de la base de datos
    if (!usuarioFull && sesion.id && window.UsuarioModel) {
        window.UsuarioModel.buscarPorAuthUid(sesion.id).then(u => {
            if (u) {
                usuarioFull = u;
                if (window.SesionModel) sessionStorage.setItem('movicali_usuario_full', JSON.stringify(u));
                if (window.NavView) window.NavView.actualizarPerfilPantalla(u, sesion);
                // Actualizar barrio en el contexto si cargó
                if (u.barrio) actualizarBarrioContexto(u.barrio);
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
                if (rActivas) rActivas.textContent = '4';
            }
        }
    }
    setTimeout(actualizarStatsBuses, 1000);
    setInterval(actualizarStatsBuses, 5000);

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
        if (mapaOrigen) mapaOrigen.value = `Barrio ${barrio}`;
        const quickOrigin = document.getElementById('quickOrigin');
        if (quickOrigin) quickOrigin.value = `Barrio ${barrio}`;
        
        const ctxUbicacion = document.getElementById('ctxUbicacion');
        if (ctxUbicacion) ctxUbicacion.textContent = `${barrio}, Cali`;
        
        // Actualizar mensaje de IA si existe
        if (aiMessages) {
            const firstMsg = aiMessages.querySelector('.msg-bubble');
            if (firstMsg) {
                firstMsg.innerHTML = `¡Hola ${userFirstName}! 👋 Soy WayAI, tu asistente de movilidad para Cali.<br><br>` +
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

    // E. Lógica de Guardado (MVVM — ViewModel expone guardarPerfil a la Vista)
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
        btn.textContent = '⏳ Guardando...';

        const result = await window.UsuarioModel.actualizar(nuevosDatos);

        btn.disabled = false;
        btn.textContent = 'Guardar cambios en base de datos';

        if (result.ok) {
            window.Toast.show('✅ Datos actualizados correctamente en Supabase.');
            
            // Actualizar Vistas
            const updatedUser = result.usuario;
            document.getElementById('perfilNombreHeader').textContent = updatedUser.nombre;
            document.getElementById('perfilContactoHeader').textContent = '📧 ' + updatedUser.correo + ' · 📱 ' + updatedUser.celular;
            document.getElementById('perfilUbicacionHeader').textContent = '📍 ' + updatedUser.barrio + ', Cali · Pasajero activo';
            
            window.NavView.actualizarUsuarioNav(window.SesionModel.getSesion());
        } else {
            window.Toast.show('❌ Error: ' + result.error);
        }
    };
});
