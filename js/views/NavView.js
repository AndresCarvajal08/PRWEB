/**
 * ============================================================
 * VIEW — NavView
 * js/views/NavView.js
 * Renderizado y actualización de elementos de navegación y perfil.
 * ============================================================
 */

const NavView = {
    /**
     * Actualiza la información del usuario en la barra de navegación.
     * @param {object} sesion
     */
    actualizarUsuarioNav(sesion) {
        if (!sesion) return;
        
        const firstName = sesion.nombre ? sesion.nombre.split(' ')[0] : 'Usuario';
        const avatarStr = sesion.avatar || firstName.substring(0, 2).toUpperCase();

        const navUsr = document.getElementById('navUserName');
        const navAvt = document.getElementById('navAvatar');
        
        if (navUsr) navUsr.textContent = firstName;
        if (navAvt) navAvt.textContent = avatarStr;
    },

    /**
     * Actualiza la pantalla de perfil principal (nombres, avatares grandes).
     * @param {object} usuarioFull
     */
    actualizarPerfilPantalla(usuarioFull, sesionFallback) {
        if (!usuarioFull && !sesionFallback) return;

        const nombreStr = usuarioFull?.nombre || sesionFallback?.nombre || 'Usuario';
        const firstName = nombreStr.split(' ')[0];
        const avatarStr = sesionFallback?.avatar || firstName.substring(0, 2).toUpperCase();

        const welcomeGreeting = document.getElementById('welcomeGreeting');
        const profileName = document.getElementById('profileName');
        const profileAvatarLg = document.getElementById('profileAvatarLg');

        if (welcomeGreeting) welcomeGreeting.textContent = `¡Buenos días, ${firstName}!`;
        if (profileName) profileName.textContent = nombreStr;
        if (profileAvatarLg) profileAvatarLg.textContent = avatarStr;
        
        // Render inputs if they exist
        this._llenarInputsFormulario(usuarioFull || sesionFallback);
    },

    _llenarInputsFormulario(datos) {
        const inNombre = document.getElementById('profileInputNombre');
        const inCorreo = document.getElementById('profileInputEmail');
        
        if (inNombre) inNombre.value = datos.nombre || datos.nombres || '';
        if (inCorreo) inCorreo.value = datos.correo || '';

        // Específico pasajero
        const inCelular = document.getElementById('profileInputTelefono');
        const inBarrio = document.getElementById('profileInputBarrio');
        if (inCelular) inCelular.value = datos.celular || '';
        if (inBarrio) inBarrio.value = datos.barrio || '';
        
        // Específico conductor
        const inPlaca = document.getElementById('profileInputPlaca');
        if (inPlaca && datos.vehiculo) inPlaca.value = datos.vehiculo.placa || '...';
    }
};

window.NavView = NavView;
