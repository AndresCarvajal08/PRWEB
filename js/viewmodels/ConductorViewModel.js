/**
 * ============================================================
 * CONTROLLER — ConductorController
 * js/controllers/ConductorController.js
 * Centraliza la lógica de inicialización y eventos de conductor.
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar autenticación
    if (!window.AuthController) return;
    const sesion = window.AuthController.requireAuth('conductor');
    if (!sesion) return;

    // 2. Inicializar Vistas con datos de sesión
    const usuarioFull = window.SesionModel ? window.SesionModel.getUsuarioCompleto() : null;
    
    if (window.NavView) {
        window.NavView.actualizarUsuarioNav(sesion);
        window.NavView.actualizarPerfilPantalla(usuarioFull, sesion);
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
    if (window.AlertaController) {
        window.AlertaController.init(true); // true = conductor
    }

    // 4. Exponer guardado de perfil unificado
    window.guardarPerfil = async function() {
        const btn = document.getElementById('btnGuardarPerfil');
        if (!btn || !window.UsuarioModel) return;

        const nuevosDatos = {
            nombres: document.getElementById('profileInputNombre').value,
            correo: document.getElementById('profileInputEmail').value
        };

        btn.disabled = true;
        btn.textContent = '⏳ Guardando...';

        const result = await window.UsuarioModel.actualizar(nuevosDatos);
        
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
