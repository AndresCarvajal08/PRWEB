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
        
        const rawName = sesion.nombre || 'Usuario';
        const firstName = rawName.split(' ')[0];
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
        // Asegurar que tenemos algo de donde sacar el nombre
        const datos = usuarioFull || sesionFallback;
        if (!datos) return;

        // Intentar reconstruir nombre completo si solo están nombres/apellidos
        let nombreStr = datos.nombre || datos.nombres || 'Usuario';
        if (!datos.nombre && datos.nombres) {
            nombreStr = datos.nombres + (datos.apellidos ? ' ' + datos.apellidos : '');
        }

        const firstName = nombreStr.split(' ')[0] || 'Usuario';
        const avatarStr = datos.avatar || firstName.substring(0, 2).toUpperCase();

        const welcomeGreeting = document.getElementById('welcomeGreeting');
        const profileName = document.getElementById('profileName') || document.getElementById('perfilNombreHeader');
        const profileAvatarLg = document.getElementById('profileAvatarLg') || document.getElementById('perfilAvatarLg');

        if (welcomeGreeting) welcomeGreeting.textContent = `¡Buenos días, ${firstName}!`;
        if (profileName) profileName.textContent = nombreStr;
        if (profileAvatarLg) profileAvatarLg.textContent = avatarStr;

        // Específicos de Pasajero (Cabecera banner)
        const perfilContacto = document.getElementById('perfilContactoHeader');
        const perfilUbicacion = document.getElementById('perfilUbicacionHeader');
        
        if (perfilContacto) {
            const correoStr = datos.correo || datos.email || '...';
            const telStr = datos.celular || datos.telefono || '...';
            perfilContacto.textContent = `📧 ${correoStr} · 📱 ${telStr}`;
        }
        if (perfilUbicacion) {
            perfilUbicacion.textContent = `📍 ${datos.barrio || 'Cali, CO'}`;
        }
        
        // Render inputs if they exist
        this._llenarInputsFormulario(datos);
    },

    _llenarInputsFormulario(datos) {
        if (!datos) return;

        const inNombre = document.getElementById('profileInputNombre') || document.getElementById('inputPerfilNombre');
        const inCorreo = document.getElementById('profileInputEmail') || document.getElementById('inputPerfilCorreo');
        const inCelular = document.getElementById('profileInputTelefono') || document.getElementById('inputPerfilCelular');
        
        if (inNombre) {
            inNombre.value = datos.nombre || datos.nombres || '';
            // Si solo hay nombres en Supabase, intentar concatenar apellidos en el input de nombre completo
            if (!datos.nombre && datos.nombres && inNombre.id === 'profileInputNombre') {
                inNombre.value = datos.nombres + (datos.apellidos ? ' ' + datos.apellidos : '');
            }
        }
        if (inCorreo) inCorreo.value = datos.correo || datos.email || '';
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
