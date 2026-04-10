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

    // 2. Inicializar Vistas con datos de sesión
    let usuarioFull = window.SesionModel ? window.SesionModel.getUsuarioCompleto() : null;
    
    if (window.NavView) {
        window.NavView.actualizarUsuarioNav(sesion);
        window.NavView.actualizarPerfilPantalla(usuarioFull, sesion);
    }

    // 2b. Si es conductor y faltan datos técnicos, intentar cargarlos de Supabase
    if (sesion.rol === 'conductor' && usuarioFull && !usuarioFull.vehiculo_placa && window.ConductorModel) {
        window.ConductorModel.obtenerDetalles(sesion.id).then(detalles => {
            if (detalles) {
                const updatedUser = { ...usuarioFull, ...detalles };
                // Guardar localmente para no repetir query
                if (window.SesionModel) {
                    sessionStorage.setItem('movicali_usuario_full', JSON.stringify(updatedUser));
                }
                // Refrescar vista
                if (window.NavView) {
                    window.NavView.actualizarPerfilPantalla(updatedUser, sesion);
                }
            }
        });
    }
    
    // Updates específicos de conductor
    if (usuarioFull) {
        const shiftInfo = document.getElementById('shiftInfo');
        const profileSub = document.getElementById('profileSub');
        const empresa = usuarioFull.empresa || 'Empresa Independiente';
        const rutaStr = usuarioFull.ruta_asignada || 'Ruta no asignada';

        if (shiftInfo) shiftInfo.textContent = `Turno activo · ${rutaStr} · ${empresa}`;
        if (profileSub) profileSub.textContent = `Conductor · ${empresa} · ${rutaStr}`;
    }

    // 3. Inicializar Módulos de datos (Sincroniza y hace polling)
    const _alertas = window.AlertaViewModel || window.AlertaController;
    if (_alertas) {
        _alertas.init(true); // true = conductor
    }

    // 4. Exponer guardado de perfil unificado
    window.guardarPerfil = async function() {
        const btn = document.getElementById('btnGuardarPerfil');
        if (!btn || !window.UsuarioModel) return;

        const nuevosDatos = {
            nombres: document.getElementById('profileInputNombre').value,
            correo: document.getElementById('profileInputEmail').value,
            celular: document.getElementById('profileInputTelefono').value
        };

        const placa = document.getElementById('profileInputPlaca').value;
        const licenciaStr = document.getElementById('profileInputLicencia').value;

        btn.disabled = true;
        btn.textContent = '⏳ Guardando...';

        const result = await window.UsuarioModel.actualizar(nuevosDatos);
        
        // Actualizar detalles técnicos si existen
        if (result.ok && window.ConductorModel) {
            const sesion = window.SesionModel.getSesion();
            // Parsing simple de la licencia (tomar lo que está después del guion o todo el string)
            const licNum = licenciaStr.includes('—') ? licenciaStr.split('—')[1].trim() : licenciaStr;
            const licCat = licenciaStr.includes('—') ? licenciaStr.split('—')[0].trim() : '';

            await window.ConductorModel.actualizarDetalles(sesion.id, {
                vehiculo_placa: placa,
                licencia_numero: licNum,
                licencia_categoria: licCat
            });
        }
        
        btn.disabled = false;
        btn.textContent = 'Guardar cambios en base de datos';

        if (result.ok) {
            window.Toast.show('✅ Perfil actualizado en la base de datos de Supabase.');
            window.NavView.actualizarUsuarioNav(window.SesionModel.getSesion());
        } else {
            window.Toast.show('❌ Error: ' + result.error);
        }
    };
});
