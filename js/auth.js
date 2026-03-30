/**
 * ============================================================
 * CAPA DE AUTENTICACIÓN — MoviCali
 * Archivo: js/auth.js
 * Capa: Presentación / Lógica de Negocio (Layered Architecture)
 * ============================================================
 * NOTA: Los datos de usuario están quemados (hardcoded) para la
 * fase de prototipo. La integración con Supabase se realizará
 * en la siguiente fase del proyecto.
 * ============================================================
 */

// ──────────────────────────────────────────────
// BASE DE DATOS SIMULADA DE USUARIOS
// ──────────────────────────────────────────────
const USUARIOS_DB = [
  // ── ROL: ADMINISTRADOR ──
  {
    id: 'adm-001',
    nombre: 'Andrés Silva',
    correo: 'admin@movicali.gov.co',
    password: 'Admin2025*',
    rol: 'administrador',
    cargo: 'Administrador del Sistema',
    dependencia: 'Secretaría de Movilidad de Cali',
    avatar: 'AS',
    activo: true,
    permisos: ['gestion_rutas', 'gestion_usuarios', 'gestion_empresas', 'validar_reportes', 'ver_alertas', 'configuracion']
  },
  {
    id: 'adm-002',
    nombre: 'María Fernanda Ospina',
    correo: 'mospina@movicali.gov.co',
    password: 'Movil2025*',
    rol: 'administrador',
    cargo: 'Coordinadora de Operaciones',
    dependencia: 'Secretaría de Movilidad de Cali',
    avatar: 'MO',
    activo: true,
    permisos: ['gestion_rutas', 'validar_reportes', 'ver_alertas']
  },

  // ── ROL: CONDUCTOR ──
  {
    id: 'con-001',
    nombre: 'Jorge Armando Caicedo',
    correo: 'jcaicedo@laermita.com.co',
    password: 'Conductor1*',
    rol: 'conductor',
    empresa: 'Empresa La Ermita S.A.',
    nit_empresa: '890.300.802-1',
    ruta_asignada: 'Ruta 101 – Ciudad Córdoba ↔ Centro',
    codigo_ruta: 'R101',
    turno: 'Mañana (05:00 – 13:00)',
    // Datos personales legales (Ley 1581 de 2012 — Protección de datos Colombia)
    cedula: '14.932.051',
    celular: '+57 316 742 8810',
    fecha_ingreso: '2021-03-15',
    // Datos del vehículo (Resolución 20203040021965 Min-Transporte)
    vehiculo: {
      placa: 'WXY-219',
      marca: 'Mercedes-Benz',
      modelo: 'OF-1418',
      año: 2019,
      color: 'Amarillo con franja roja',
      capacidad: 39,
      tipo: 'Bus urbano',
      tarjeta_operacion: 'TOP-20240312-001',
      soat_vence: '2026-01-15',
      tecnomecanica_vence: '2026-06-30',
      ultimo_mantenimiento: '2025-12-10'
    },
    // Licencia de conducción (Código Nacional de Tránsito — Ley 769 de 2002)
    licencia: {
      numero: '14932051',
      categoria: 'C3',  // Vehículos automotores de servicio público colectivo
      restricciones: 'Ninguna',
      fecha_expedicion: '2015-08-20',
      fecha_vencimiento: '2027-08-20',
      autoridad_expedidora: 'Secretaría de Movilidad de Cali',
      horas_conduccion_acumuladas: 12480
    },
    avatar: 'JC',
    activo: true
  },
  {
    id: 'con-002',
    nombre: 'Carlos Hernán Mosquera',
    correo: 'cmosquera@riocali.com.co',
    password: 'Conductor2*',
    rol: 'conductor',
    empresa: 'Empresa Riocali S.A.',
    nit_empresa: '890.300.950-4',
    ruta_asignada: 'Ruta 204 – Aguablanca ↔ Universidades',
    codigo_ruta: 'R204',
    turno: 'Tarde (13:00 – 21:00)',
    cedula: '16.782.334',
    celular: '+57 301 558 7291',
    fecha_ingreso: '2019-07-22',
    vehiculo: {
      placa: 'TRS-045',
      marca: 'Chevrolet',
      modelo: 'NQR 916',
      año: 2021,
      color: 'Azul con franjas blancas',
      capacidad: 42,
      tipo: 'Bus urbano',
      tarjeta_operacion: 'TOP-20240108-004',
      soat_vence: '2026-03-20',
      tecnomecanica_vence: '2025-12-15',
      ultimo_mantenimiento: '2026-01-08'
    },
    licencia: {
      numero: '16782334',
      categoria: 'C3',
      restricciones: 'Lentes correctivos obligatorios',
      fecha_expedicion: '2013-05-10',
      fecha_vencimiento: '2025-05-10',
      autoridad_expedidora: 'Secretaría de Movilidad de Cali',
      horas_conduccion_acumuladas: 18200
    },
    avatar: 'CM',
    activo: true
  },
  {
    id: 'con-003',
    nombre: 'Luis Enrique Perea',
    correo: 'lperea@montebello.com.co',
    password: 'Guala2025*',
    rol: 'conductor',
    empresa: 'Cooperativa Montebello Ltda.',
    nit_empresa: '890.300.741-7',
    ruta_asignada: 'Ruta G-7 – Ladera Occidental ↔ Alfonso López',
    codigo_ruta: 'G07',
    turno: 'Mañana (06:00 – 14:00)',
    cedula: '94.425.680',
    celular: '+57 310 883 5502',
    fecha_ingreso: '2022-11-01',
    vehiculo: {
      placa: 'OPC-781',
      marca: 'Toyota',
      modelo: 'Land Cruiser 79',
      año: 2018,
      color: 'Blanco con vinilos verdes',
      capacidad: 10,
      tipo: 'Campero / Guala',
      tarjeta_operacion: 'TOP-20231201-012',
      soat_vence: '2026-05-30',
      tecnomecanica_vence: '2026-04-10',
      ultimo_mantenimiento: '2026-02-20'
    },
    licencia: {
      numero: '94425680',
      categoria: 'C2',  // Vehículos con peso > 3.5 ton servicio público especial
      restricciones: 'Ninguna',
      fecha_expedicion: '2017-09-14',
      fecha_vencimiento: '2029-09-14',
      autoridad_expedidora: 'Secretaría de Movilidad de Cali',
      horas_conduccion_acumuladas: 6800
    },
    avatar: 'LP',
    activo: true
  },

  // ── ROL: PASAJERO ──
  {
    id: 'pas-001',
    nombre: 'Laura Valentina Ruiz',
    correo: 'lauraruiz@gmail.com',
    password: 'Pasajero1*',
    rol: 'pasajero',
    cedula: '1.130.682.441',
    celular: '+57 312 496 7830',
    barrio: 'Ciudad Jardín',
    fecha_registro: '2025-09-10',
    rutas_favoritas: ['R101', 'R204'],
    avatar: 'LR',
    activo: true
  },
  {
    id: 'pas-002',
    nombre: 'Miguel Ángel Torres',
    correo: 'migueltorres@hotmail.com',
    password: 'Pasajero2*',
    rol: 'pasajero',
    cedula: '1.006.874.920',
    celular: '+57 318 334 0021',
    barrio: 'Aguablanca',
    fecha_registro: '2025-11-22',
    rutas_favoritas: ['R204', 'G07'],
    avatar: 'MT',
    activo: true
  }
];

// ──────────────────────────────────────────────
// FUNCIONES DE AUTENTICACIÓN
// ──────────────────────────────────────────────

/**
 * Intenta autenticar un usuario con correo y contraseña.
 * @param {string} correo
 * @param {string} password
 * @returns {{ ok: boolean, usuario?: object, error?: string }}
 */
async function loginUsuario(correo, password) {
  // Verificamos si Supabase está activo
  if (typeof window.supabaseClient !== 'undefined') {
    // 1. Autenticar en Supabase Auth
    const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
      email: correo.trim(),
      password: password
    });
    
    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        return { ok: false, error: 'Correo o contraseña incorrectos.' };
      }
      return { ok: false, error: authError.message };
    }
    
    // 2. Obtener datos descriptivos de la tabla pública
    const { data: userData, error: userError } = await window.supabaseClient
      .from('usuarios')
      .select('*')
      .eq('auth_uid', authData.user.id)
      .single();
      
    if (userError || !userData) {
      return { ok: false, error: 'No se encontraron datos del perfil.' };
    }
    
    if (!userData.activo) {
      return { ok: false, error: 'Tu cuenta se encuentra desactivada. Contacta al administrador.' };
    }
    
    // 3. Crear sesión en el navegador
    const usuario = userData;
    const sesion = {
      id: usuario.id,
      nombre: usuario.nombres + ' ' + (usuario.apellidos || ''),
      correo: usuario.correo,
      rol: usuario.rol,
      avatar: (usuario.nombres[0] + (usuario.apellidos ? usuario.apellidos[0] : '')).toUpperCase(),
      timestamp: Date.now()
    };
    sessionStorage.setItem('movicali_sesion', JSON.stringify(sesion));
    sessionStorage.setItem('movicali_usuario_full', JSON.stringify(usuario));
    
    // Mapeo local para compatibilidad (por si otros scripts leen .nombre)
    usuario.nombre = sesion.nombre;
    
    return { ok: true, usuario };
  }

  // Fallback si Supabase no está cargado (Modo Demo)
  const usuario = USUARIOS_DB.find(
    u => u.correo.toLowerCase() === correo.toLowerCase() && u.password === password
  );

  if (!usuario) {
    return { ok: false, error: 'Correo o contraseña incorrectos.' };
  }
  if (!usuario.activo) {
    return { ok: false, error: 'Tu cuenta se encuentra desactivada. Contacta al administrador.' };
  }

  // Guardar sesión en sessionStorage (se borra al cerrar pestaña)
  const sesion = {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    avatar: usuario.avatar,
    timestamp: Date.now()
  };
  sessionStorage.setItem('movicali_sesion', JSON.stringify(sesion));
  sessionStorage.setItem('movicali_usuario_full', JSON.stringify(usuario));

  return { ok: true, usuario };
}

/**
 * Cierra la sesión activa.
 */
function logoutUsuario() {
  sessionStorage.removeItem('movicali_sesion');
  sessionStorage.removeItem('movicali_usuario_full');
  window.location.href = '../login.html';
}

/**
 * Obtiene los datos de la sesión actual.
 * @returns {object|null}
 */
function getSesion() {
  const raw = sessionStorage.getItem('movicali_sesion');
  return raw ? JSON.parse(raw) : null;
}

/**
 * Obtiene el usuario completo de la sesión actual.
 * @returns {object|null}
 */
function getUsuarioCompleto() {
  const raw = sessionStorage.getItem('movicali_usuario_full');
  return raw ? JSON.parse(raw) : null;
}

/**
 * Verifica si hay sesión activa. Si no, redirige al login.
 * @param {string} rolRequerido - Rol necesario para acceder a la página
 */
function requireAuth(rolRequerido) {
  const sesion = getSesion();
  if (!sesion) {
    window.location.href = '../login.html';
    return null;
  }
  if (rolRequerido && sesion.rol !== rolRequerido) {
    alert('No tienes permisos para acceder a esta sección.');
    window.location.href = '../login.html';
    return null;
  }
  return sesion;
}

/**
 * Redirige según el rol del usuario autenticado.
 * @param {string} rol
 */
function redirigirPorRol(rol) {
  const rutas = {
    administrador: 'pages/panelAdministrador.html',
    conductor: 'pages/panelConductor.html',
    pasajero: 'pages/panelPasajero.html'
  };
  window.location.href = rutas[rol] || 'login.html';
}

/**
 * Registra un nuevo pasajero en la base de datos simulada.
 * En producción, esto se enviará a Supabase via API.
 * @param {object} datos
 * @returns {{ ok: boolean, error?: string }}
 */
async function registrarPasajero(datos) {
  // Verificamos si Supabase está activo
  if (typeof window.supabaseClient !== 'undefined') {
    // 1. Crear usuario en Auth de Supabase (Credenciales)
    const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
      email: datos.correo,
      password: datos.password,
    });

    if (authError) {
      if (authError.status === 400 && authError.message.includes('already registered')) {
        return { ok: false, error: 'Ya existe una cuenta con este correo.' };
      }
      return { ok: false, error: authError.message };
    }

    // 2. Crear el perfil en la tabla "usuarios" pública
    const { data: userData, error: userError } = await window.supabaseClient
      .from('usuarios')
      .insert([{
        auth_uid: authData.user.id,
        nombres: datos.nombres,
        apellidos: datos.apellidos,
        correo: datos.correo,
        rol: 'pasajero',
        cedula: datos.cedula,
        celular: datos.celular,
        barrio: datos.barrio || '',
        activo: true
      }])
      .select()
      .single();

    if (userError) {
      return { ok: false, error: 'Error creando perfil: ' + userError.message };
    }

    // 3. Crear sesión en el navegador (Local)
    const nuevo = userData;
    sessionStorage.setItem('movicali_sesion', JSON.stringify({
      id: nuevo.id, 
      nombre: nuevo.nombres, 
      correo: nuevo.correo,
      rol: nuevo.rol, 
      avatar: (nuevo.nombres[0] + (nuevo.apellidos[0] || '')).toUpperCase(),
      timestamp: Date.now()
    }));
    sessionStorage.setItem('movicali_usuario_full', JSON.stringify(nuevo));
    
    return { ok: true, usuario: nuevo };
  }

  // Fallback si Supabase no está cargado:
  const existe = USUARIOS_DB.find(u => u.correo.toLowerCase() === datos.correo.toLowerCase());
  if (existe) {
    return { ok: false, error: 'Ya existe una cuenta registrada con este correo.' };
  }
  const nuevo = {
    id: 'pas-' + String(Date.now()).slice(-6),
    nombre: `${datos.nombres} ${datos.apellidos}`,
    correo: datos.correo,
    password: datos.password,
    rol: 'pasajero',
    cedula: datos.cedula,
    celular: datos.celular,
    barrio: datos.barrio || '',
    fecha_registro: new Date().toISOString().split('T')[0],
    rutas_favoritas: [],
    avatar: (datos.nombres[0] + (datos.apellidos[0] || '')).toUpperCase(),
    activo: true
  };
  USUARIOS_DB.push(nuevo);
  // Iniciar sesión automáticamente tras registro
  sessionStorage.setItem('movicali_sesion', JSON.stringify({
    id: nuevo.id, nombre: nuevo.nombre, correo: nuevo.correo,
    rol: nuevo.rol, avatar: nuevo.avatar, timestamp: Date.now()
  }));
  sessionStorage.setItem('movicali_usuario_full', JSON.stringify(nuevo));
  return { ok: true, usuario: nuevo };
}

/**
 * Registra un nuevo conductor. Solo disponible para administradores.
 * Los datos incluyen información personal, vehicular y licencia de conducción
 * conforme a la normativa colombiana (Ley 769/2002, Ley 1581/2012).
 * @param {object} datos
 * @returns {{ ok: boolean, error?: string }}
 */
function registrarConductor(datos) {
  const existe = USUARIOS_DB.find(u => u.correo.toLowerCase() === datos.correo.toLowerCase());
  if (existe) {
    return { ok: false, error: 'Ya existe una cuenta registrada con este correo.' };
  }
  const nuevo = {
    id: 'con-' + String(Date.now()).slice(-6),
    nombre: `${datos.nombres} ${datos.apellidos}`,
    correo: datos.correo,
    password: datos.password,
    rol: 'conductor',
    empresa: datos.empresa,
    ruta_asignada: datos.ruta_asignada || 'Por asignar',
    codigo_ruta: datos.codigo_ruta || 'N/A',
    turno: datos.turno || 'Por asignar',
    cedula: datos.cedula,
    celular: datos.celular,
    fecha_ingreso: new Date().toISOString().split('T')[0],
    vehiculo: {
      placa: datos.placa,
      marca: datos.marca_vehiculo,
      modelo: datos.modelo_vehiculo,
      año: datos.anio_vehiculo,
      color: datos.color_vehiculo,
      capacidad: datos.capacidad,
      tipo: datos.tipo_vehiculo,
      tarjeta_operacion: datos.tarjeta_operacion,
      soat_vence: datos.soat_vence,
      tecnomecanica_vence: datos.tecnomecanica_vence,
      ultimo_mantenimiento: ''
    },
    licencia: {
      numero: datos.licencia_numero,
      categoria: datos.licencia_categoria,
      restricciones: datos.restricciones || 'Ninguna',
      fecha_expedicion: datos.licencia_expedicion,
      fecha_vencimiento: datos.licencia_vencimiento,
      autoridad_expedidora: 'Secretaría de Movilidad de Cali',
      horas_conduccion_acumuladas: 0
    },
    avatar: (datos.nombres[0] + (datos.apellidos[0] || '')).toUpperCase(),
    activo: true
  };
  USUARIOS_DB.push(nuevo);
  return { ok: true, usuario: nuevo };
}

// Exportar para uso con módulos (cuando se integre con bundler o Supabase)
if (typeof module !== 'undefined') {
  module.exports = {
    loginUsuario, logoutUsuario, getSesion, getUsuarioCompleto,
    requireAuth, redirigirPorRol, registrarPasajero, registrarConductor,
    USUARIOS_DB
  };
}
