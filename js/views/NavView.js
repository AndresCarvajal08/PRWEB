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
        if (!datos) return;

        const inNombre = document.getElementById('profileInputNombre') || document.getElementById('inputPerfilNombre');
        const inCorreo = document.getElementById('profileInputEmail') || document.getElementById('inputPerfilCorreo');
        const inCelular = document.getElementById('profileInputTelefono') || document.getElementById('inputPerfilCelular');
        
        if (inNombre) inNombre.value = datos.nombre || datos.nombres || '';
        if (inCorreo) inCorreo.value = datos.correo || '';
        if (inCelular) inCelular.value = datos.celular || datos.telefono || '';

        // Pasajero (Barrio)
        const inBarrio = document.getElementById('profileInputBarrio') || document.getElementById('inputPerfilBarrio');
        if (inBarrio) inBarrio.value = datos.barrio || '';
        
        // Conductor (Placa, Licencia, Empresa, Ruta)
        const inPlaca = document.getElementById('profileInputPlaca');
        const inLicencia = document.getElementById('profileInputLicencia');
        const inEmpresa = document.getElementById('profileInputEmpresa'); // Si existiera en HTML futuro
        const inRuta = document.getElementById('profileInputRuta');      // Si existiera en HTML futuro

        // Manejo de Placa (Anidado o Plano)
        if (inPlaca) {
            inPlaca.value = datos.vehiculo?.placa || datos.vehiculo_placa || '';
        }

        // Manejo de Licencia
        if (inLicencia) {
            const lic = datos.licencia?.numero || datos.licencia_numero || '';
            const cat = datos.licencia?.categoria || datos.licencia_categoria || '';
            inLicencia.value = lic ? `${cat} — ${lic}` : '';
        }
    }
};

window.NavView = NavView;
