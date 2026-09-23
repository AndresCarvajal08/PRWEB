/**
 * ============================================================
 * VIEWMODEL — ConductorViewModel
 * js/viewmodels/ConductorViewModel.js
 * Centraliza la lógica de inicialización y eventos de conductor.
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar autenticación
    if (!window.AuthViewModel && !window.AuthController) return;
    const _auth = window.AuthViewModel || window.AuthController;
    const sesion = _auth.requireAuth('conductor');
    if (!sesion) return;

    // 2. Datos de sesión
    let usuarioFull = window.SesionModel ? window.SesionModel.getUsuarioCompleto() : null;

    if (!usuarioFull && sesion.id && window.UsuarioModel) {
        window.UsuarioModel.buscarPorAuthUid(sesion.id).then(u => {
            if (u) {
                usuarioFull = u;
                sessionStorage.setItem('movicali_usuario_full', JSON.stringify(u));
                window.NavView?.actualizarPerfilPantalla(u, sesion);
                cargarDetallesTecnicos(u);
                rellenarFormularioPerfil(u);
            }
        });
    }

    window.NavView?.actualizarUsuarioNav(sesion);
    window.NavView?.actualizarPerfilPantalla(usuarioFull, sesion);

    function cargarDetallesTecnicos(u) {
        if (sesion.rol === 'conductor' && u && window.ConductorModel) {
            window.ConductorModel.obtenerDetalles(sesion.id).then(detalles => {
                if (detalles) {
                    const updatedUser = { ...u, ...detalles };
                    sessionStorage.setItem('movicali_usuario_full', JSON.stringify(updatedUser));
                    window.NavView?.actualizarPerfilPantalla(updatedUser, sesion);
                    rellenarFormularioPerfil(updatedUser);
                }
            });
        }
    }

    function rellenarFormularioPerfil(u) {
        const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        setVal('profileInputNombre',   (u.nombres || '') + (u.apellidos ? ' ' + u.apellidos : ''));
        setVal('profileInputEmail',    u.correo);
        setVal('profileInputTelefono', u.celular);
        setVal('profileInputPlaca',    u.vehiculo_placa);
        if (u.licencia_categoria || u.licencia_numero) {
            setVal('profileInputLicencia', `${u.licencia_categoria || ''} — ${u.licencia_numero || ''}`);
        }
        const nameEl = document.getElementById('profileName');
        if (nameEl) nameEl.textContent = (u.nombres || '') + ' ' + (u.apellidos || '');
    }

    if (usuarioFull) {
        cargarDetallesTecnicos(usuarioFull);
        rellenarFormularioPerfil(usuarioFull);

        const shiftInfo  = document.getElementById('shiftInfo');
        const profileSub = document.getElementById('profileSub');
        const empresa    = usuarioFull.empresa || 'Empresa Independiente';
        const rutaStr    = usuarioFull.ruta_asignada || 'Ruta no asignada';

        if (shiftInfo)  shiftInfo.textContent  = `Turno activo · ${rutaStr} · ${empresa}`;
        if (profileSub) profileSub.textContent = `Conductor · ${empresa} · ${rutaStr}`;
    }

    // 3. Alertas
    const _alertas = window.AlertaViewModel || window.AlertaController;
    if (_alertas) _alertas.init(true);

    // ── C-HU-04: Cargar historial de turnos desde Supabase ──
    window.cargarHistorialTurnos = async function () {
        const tbody = document.getElementById('bodyTurnosDinamico');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:16px;color:#94a3b8;">⏳ Cargando turnos...</td></tr>';

        let turnos = await (window.TurnoModel
            ? window.TurnoModel.obtenerPorConductor(sesion.id)
            : Promise.resolve([]));

        // Si no hay registros reales, usar datos de ejemplo
        if (!turnos.length && window.TurnoModel) {
            turnos = window.TurnoModel._datosFallback();
        }

        if (!turnos.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:16px;color:#94a3b8;">Sin registros de turnos aún.</td></tr>';
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];
        const mesActual = hoy.slice(0, 7); // YYYY-MM
        const turnosMes  = turnos.filter(t => (t.fecha || '').startsWith(mesActual)).length;
        const vueltasTotal = turnos.reduce((s, t) => s + (t.vueltas || 0), 0);
        const reportesTotal = turnos.reduce((s, t) => s + (t.reportes || 0), 0);

        const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
        setEl('statTurnosMes', turnosMes);
        setEl('statVueltasTotales', vueltasTotal);
        setEl('statReportesEnv', reportesTotal);
        const trendEl = document.getElementById('statTurnosMesTrend');
        if (trendEl) trendEl.textContent = `↑ ${turnosMes} este mes`;

        tbody.innerHTML = turnos.map(t => {
            const estaActivo = t.estado === 'activo';
            const fechaLabel = t.fecha === hoy ? 'Hoy' : t.fecha;
            const estadoTag  = estaActivo
                ? '<span class="tag tag-green">Activo</span>'
                : '<span class="tag tag-gray">Completado</span>';
            return `<tr>
                <td>${fechaLabel}</td>
                <td><strong>${t.ruta || '—'}</strong></td>
                <td>${t.hora_inicio || '—'}</td>
                <td>${estaActivo ? 'En curso' : (t.hora_fin || '—')}</td>
                <td>${t.vueltas ?? '—'}</td>
                <td>${t.reportes ?? '—'}</td>
                <td>${estadoTag}</td>
            </tr>`;
        }).join('');
    };

    // ── C-HU-03: Guardar perfil completo del conductor ──
    window.guardarPerfil = async function () {
        const btn = document.getElementById('btnGuardarPerfil');
        if (!btn || !window.UsuarioModel) return;

        const nombres     = document.getElementById('profileInputNombre').value.trim();
        const correo      = document.getElementById('profileInputEmail').value.trim();
        const celular     = document.getElementById('profileInputTelefono').value.trim();
        const placa       = document.getElementById('profileInputPlaca').value.trim();
        const licenciaStr = document.getElementById('profileInputLicencia').value.trim();

        if (!nombres) {
            window.Toast?.show('⚠️ El nombre es obligatorio.');
            return;
        }

        const partes    = nombres.split(' ');
        const nuevosDatos = {
            nombres:   partes[0],
            apellidos: partes.length > 1 ? partes.slice(1).join(' ') : '',
            celular,
            barrio:    null
        };

        btn.disabled    = true;
        btn.textContent = '⏳ Guardando...';

        // 1. Actualizar tabla usuarios
        const result = await window.UsuarioModel.actualizar(nuevosDatos);

        // 2. Actualizar correo directamente en tabla usuarios (sin tocar auth)
        if (result.ok && correo && window.supabaseClient) {
            const u = window.SesionModel?.getUsuarioCompleto();
            if (u?.id) {
                await window.supabaseClient
                    .from('usuarios')
                    .update({ correo })
                    .eq('id', u.id);
            }
        }

        // 3. Actualizar tabla conductores (placa, licencia)
        if (result.ok && window.ConductorModel) {
            const licNum = licenciaStr.includes('—') ? licenciaStr.split('—')[1].trim() : licenciaStr;
            const licCat = licenciaStr.includes('—') ? licenciaStr.split('—')[0].trim() : '';

            await window.ConductorModel.actualizarDetalles(sesion.id, {
                vehiculo_placa:      placa,
                licencia_numero:     licNum,
                licencia_categoria:  licCat
            });
        }

        btn.disabled    = false;
        btn.textContent = 'Guardar cambios en base de datos';

        if (result.ok) {
            // Actualizar header del perfil en pantalla
            const nameEl = document.getElementById('profileName');
            if (nameEl) nameEl.textContent = nombres;

            window.Toast?.show('✅ Perfil actualizado correctamente en Supabase.');
            window.NavView?.actualizarUsuarioNav(window.SesionModel.getSesion());
        } else {
            window.Toast?.show('❌ Error: ' + result.error);
        }
    };

    // ── C-HU-07: Compartir reporte de incidente ──
    window.compartirIncidente = function (tipo, desc, ubicacion, fecha) {
        const texto = `🚨 REPORTE DE INCIDENTE — WayRoute\n` +
            `Tipo: ${tipo}\n` +
            `Descripción: ${desc}\n` +
            `Ubicación: ${ubicacion}\n` +
            `Fecha: ${fecha}\n` +
            `Reportado desde la app WayRoute / MoviCali`;

        if (navigator.share) {
            navigator.share({ title: 'Reporte WayRoute', text: texto })
                .catch(() => copiarAlPortapapeles(texto));
        } else {
            copiarAlPortapapeles(texto);
        }
    };

    function copiarAlPortapapeles(texto) {
        navigator.clipboard?.writeText(texto).then(() => {
            window.Toast?.show('📋 Reporte copiado al portapapeles.');
        }).catch(() => {
            window.Toast?.show('⚠️ No se pudo copiar. Copia manualmente.');
        });
    }
});
