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

        // Si no hay registros reales, usar datos de ejemplo (dejando claro que NO son reales)
        const avisoEjemplo = document.getElementById('avisoTurnosEjemplo');
        const sonDatosEjemplo = !turnos.length && !!window.TurnoModel;
        if (avisoEjemplo) avisoEjemplo.style.display = sonDatosEjemplo ? 'block' : 'none';
        if (sonDatosEjemplo) {
            turnos = window.TurnoModel._datosFallback();
        }

        if (!turnos.length) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:16px;color:#94a3b8;">Sin registros de turnos aún.</td></tr>';
            return;
        }

        // La tabla `turnos` NUNCA tuvo una columna `reportes` — t.reportes
        // siempre fue undefined sin importar cuántos reportes reales se
        // hubieran enviado, por eso esta cifra y la columna de la tabla
        // daban 0 / "—" siempre. Se cuentan los reportes reales del
        // conductor (tabla `reportes`, ya tiene su propio historial) y se le
        // asignan a cada turno según en qué ventana de tiempo cayeron.
        if (!sonDatosEjemplo && window.AlertaModel) {
            const reportesConductor = await window.AlertaModel.obtenerPorConductor(sesion.id);
            const duracionMin = (horaInicio, horaFin) => {
                const [h1, m1] = horaInicio.split(':').map(Number);
                const [h2, m2] = horaFin.split(':').map(Number);
                let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
                if (mins < 0) mins += 24 * 60; // turno que cruzó la medianoche
                return mins;
            };
            // Si un reporte se envía justo en el minuto en que un turno
            // termina y el siguiente empieza (hora_fin se guarda redondeada
            // al minuto, no al segundo), su ventana podría solaparse con la
            // del turno siguiente. Se asigna cada reporte a un solo turno
            // (el más antiguo que lo contenga) para no contarlo dos veces.
            const yaAsignados = new Set();
            const conVentana = turnos.map(t => {
                // created_at es un timestamptz real de la base de datos, sin la
                // ambigüedad de zona horaria que tiene mezclar t.fecha (UTC) con
                // t.hora_inicio (local) — ver la nota en TurnoModel.obtenerActivos().
                const inicioMs = t.created_at
                    ? new Date(t.created_at).getTime()
                    : (t.fecha && t.hora_inicio ? new Date(`${t.fecha}T${t.hora_inicio}`).getTime() : null);
                const finMs = (inicioMs != null && t.hora_fin)
                    ? inicioMs + duracionMin(t.hora_inicio, t.hora_fin) * 60000
                    : Date.now();
                return { t, inicioMs, finMs };
            }).sort((a, b) => (a.inicioMs ?? 0) - (b.inicioMs ?? 0));

            conVentana.forEach(({ t, inicioMs, finMs }) => {
                if (inicioMs == null) { t.reportes = 0; return; }
                t.reportes = reportesConductor.filter(r => {
                    if (yaAsignados.has(r.id)) return false;
                    const rMs = new Date(r.fecha).getTime();
                    const dentro = rMs >= inicioMs && rMs <= finMs;
                    if (dentro) yaAsignados.add(r.id);
                    return dentro;
                }).length;
            });
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

    // ── RECOMENDACIONES DE WAYAI PARA EL VEHÍCULO (vista Alertas) ──
    // Reemplaza el mapa que iba en esta tarjeta (mostraba las mismas alertas
    // que ya están en la lista de la izquierda, sin aportar nada nuevo).
    // Combina dos cosas: (1) el estado REAL de los documentos del vehículo
    // (SOAT, tecnomecánica, licencia — misma info que ya usa el admin en su
    // Dashboard) para avisos que sí importan legalmente, y (2) una selección
    // rotativa de consejos generales de mantenimiento/manejo, para que el
    // panel no muestre siempre lo mismo aunque los documentos estén al día.
    const _CARAS_POR_URGENCIA = {
        vencido:  'frown',
        urgente:  'meh',
        pronto:   'smile',
        ok:       'laugh',
    };
    const _COLORES_POR_URGENCIA = {
        vencido:  { bg: '#fef2f2', border: '#fecaca', fg: '#991b1b', icon: '#dc2626' },
        urgente:  { bg: '#fffbeb', border: '#fde68a', fg: '#92400e', icon: '#f59e0b' },
        pronto:   { bg: '#eff6ff', border: '#bfdbfe', fg: '#1e40af', icon: '#2563eb' },
        ok:       { bg: '#f0fdf4', border: '#bbf7d0', fg: '#166534', icon: '#16a34a' },
    };

    function _mensajeDocumento(doc, dias) {
        const placa = doc.placa || 'tu vehículo';
        if (dias < 0) {
            const v = [
                `${doc.nombreCap} de ${placa} está ${doc.adjetivo} hace ${Math.abs(dias)} días. Circular así puede salirte en multa o inmovilización — hazlo tu prioridad de hoy.`,
                `Ojo: ${doc.nombre} venció hace ${Math.abs(dias)} días. No sigas rodando sin resolverlo cuanto antes.`,
                `Llevas ${Math.abs(dias)} días con ${doc.nombre} vencid${doc.genero}. Es momento de ponerlo al día antes de que te pare un control.`,
            ];
            return { urgencia: 'vencido', texto: v[Math.floor(Math.random() * v.length)] };
        }
        if (dias <= 15) {
            const v = [
                `${doc.nombreCap} de ${placa} vence en ${dias} día${dias === 1 ? '' : 's'}. Aprovecha esta semana para renovarlo y no te quedes sin tiempo.`,
                `Quedan ${dias} día${dias === 1 ? '' : 's'} para que venza ${doc.nombre}. Buen momento para agendar la renovación.`,
                `${doc.nombreCap} está por vencer (${dias} día${dias === 1 ? '' : 's'}). Resuélvelo pronto para evitar contratiempos.`,
            ];
            return { urgencia: 'urgente', texto: v[Math.floor(Math.random() * v.length)] };
        }
        if (dias <= 30) {
            const v = [
                `${doc.nombreCap} vence en ${dias} días. Todavía tienes margen, pero ya puedes ir programando la renovación.`,
                `En ${dias} días vence ${doc.nombre}. Vale la pena ir mirando dónde renovarlo con calma.`,
            ];
            return { urgencia: 'pronto', texto: v[Math.floor(Math.random() * v.length)] };
        }
        const v = [
            `${doc.nombreCap} está al día — vence en ${dias} días. Sigue así.`,
            `Todo en orden con ${doc.nombre}: te quedan ${dias} días de margen.`,
        ];
        return { urgencia: 'ok', texto: v[Math.floor(Math.random() * v.length)] };
    }

    const _TIPS_GENERALES = [
        { icono: 'gauge',       texto: 'Revisa la presión de tus llantas cada 15 días — una llanta baja aumenta el consumo de combustible y el riesgo de reventón.' },
        { icono: 'droplet',     texto: 'No dejes pasar más de 5.000 km sin revisar el nivel de aceite del motor. Un motor bien lubricado dura más y falla menos.' },
        { icono: 'lightbulb',   texto: 'Antes de salir a tu turno, comprueba direccionales, stop y luces altas — te vuelve visible ante los demás conductores.' },
        { icono: 'wind',        texto: 'Los frenos no avisan hasta que fallan: si el pedal se siente más duro o más blando de lo normal, llévalo a revisión.' },
        { icono: 'battery',     texto: 'Una batería con más de 3 años empieza a fallar en las madrugadas frías. Revisa bornes y nivel de carga de vez en cuando.' },
        { icono: 'flame',       texto: 'Verifica que el extintor esté cargado y dentro de su fecha — es obligatorio y puede salvar tu vehículo ante un pequeño incendio.' },
        { icono: 'life-buoy',   texto: 'Lleva siempre el kit de carretera completo: gato, cruceta, llanta de repuesto y chalecos reflectivos.' },
        { icono: 'thermometer', texto: 'Si el indicador de temperatura sube más de lo normal, para en un lugar seguro — seguir así puede dañar el motor.' },
        { icono: 'ear',         texto: 'Un ruido nuevo casi nunca es casualidad. Vale la pena que un mecánico lo escuche antes de que se vuelva un problema grave.' },
        { icono: 'eye',         texto: 'Ajusta bien tus espejos antes de arrancar — reducir los puntos ciegos es de las formas más simples de evitar un accidente.' },
        { icono: 'timer',       texto: 'En jornadas largas, haz pausas cada 2-3 horas. Un conductor descansado reacciona más rápido que uno cansado.' },
        { icono: 'cloud-rain',  texto: 'En días de lluvia, aumenta la distancia con el vehículo de adelante — el pavimento mojado duplica la distancia de frenado.' },
    ];

    window.cargarRecomendacionesIA = async function () {
        const cont = document.getElementById('iaRecomendacionesLista');
        if (!cont) return;

        let tarjetas = [];

        // 1) Estado real de los documentos del vehículo, si hay conexión y
        // el conductor tiene un registro en la tabla `conductores`.
        if (window.supabaseClient) {
            try {
                const { data: c } = await window.supabaseClient
                    .from('conductores')
                    .select('vehiculo_placa, vehiculo_soat_vence, vehiculo_tecnomecanica_vence, licencia_vencimiento')
                    .eq('id', sesion.id)
                    .single();

                if (c) {
                    const docs = [
                        { label: 'SOAT',                 fecha: c.vehiculo_soat_vence,          nombre: 'el SOAT',                nombreCap: 'El SOAT',                adjetivo: 'vencido', genero: 'o', icono: 'shield-check', placa: c.vehiculo_placa },
                        { label: 'Tecnomecánica',         fecha: c.vehiculo_tecnomecanica_vence, nombre: 'la tecnomecánica',        nombreCap: 'La tecnomecánica',        adjetivo: 'vencida', genero: 'a', icono: 'wrench',       placa: c.vehiculo_placa },
                        { label: 'Licencia de conducción', fecha: c.licencia_vencimiento,         nombre: 'tu licencia de conducción', nombreCap: 'Tu licencia de conducción', adjetivo: 'vencida', genero: 'a', icono: 'contact', placa: c.vehiculo_placa },
                    ].filter(d => d.fecha);

                    docs.forEach(doc => {
                        const dias = Math.ceil((new Date(doc.fecha) - Date.now()) / 86400000);
                        const { urgencia, texto } = _mensajeDocumento(doc, dias);
                        const col = _COLORES_POR_URGENCIA[urgencia];
                        tarjetas.push(`
                            <div style="display:flex;gap:10px;align-items:flex-start;padding:12px;background:${col.bg};border:1px solid ${col.border};border-radius:10px;">
                                <i data-lucide="${doc.icono}" style="width:18px;height:18px;color:${col.icon};flex-shrink:0;margin-top:1px;"></i>
                                <div style="flex:1;">
                                    <div style="font-size:.8rem;color:${col.fg};line-height:1.4;">${texto}</div>
                                </div>
                                <i data-lucide="${_CARAS_POR_URGENCIA[urgencia]}" style="width:20px;height:20px;color:${col.icon};flex-shrink:0;"></i>
                            </div>`);
                    });
                }
            } catch (e) {
                // Sin registro de vehículo o sin conexión: se sigue solo con los consejos generales.
            }
        }

        // 2) Selección rotativa de consejos generales (distinta cada vez que
        // se abre la vista, para que el panel no muestre siempre lo mismo).
        const barajados = [..._TIPS_GENERALES].sort(() => Math.random() - 0.5).slice(0, 4);
        barajados.forEach(tip => {
            tarjetas.push(`
                <div style="display:flex;gap:10px;align-items:flex-start;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                    <i data-lucide="${tip.icono}" style="width:18px;height:18px;color:#64748b;flex-shrink:0;margin-top:1px;"></i>
                    <div style="font-size:.8rem;color:#475569;line-height:1.4;">${tip.texto}</div>
                </div>`);
        });

        cont.innerHTML = tarjetas.join('');
        if (typeof lucide !== 'undefined') lucide.createIcons();
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
            window.Toast?.show('El nombre es obligatorio.');
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

            window.Toast?.show('Perfil actualizado correctamente en Supabase.');
            window.NavView?.actualizarUsuarioNav(window.SesionModel.getSesion());
        } else {
            window.Toast?.show('Error: ' + result.error);
        }
    };

    // ── C-HU-07: Compartir reporte de incidente ──
    window.compartirIncidente = function (tipo, desc, ubicacion, fecha) {
        const texto = `REPORTE DE INCIDENTE — WayRoute\n` +
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
            window.Toast?.show('Reporte copiado al portapapeles.');
        }).catch(() => {
            window.Toast?.show('No se pudo copiar. Copia manualmente.');
        });
    }
});
