/**
 * ============================================================
 * MODEL — TurnoModel
 * js/models/TurnoModel.js
 * CRUD de turnos de conductores contra Supabase.
 * Tabla: turnos (conductor_id, fecha, hora_inicio, hora_fin, ruta, numero_bus, vueltas, estado)
 * ============================================================
 */

const TurnoModel = {

    async obtenerPorConductor(conductorId) {
        if (!window.supabaseClient) return this._datosFallback();

        const { data, error } = await window.supabaseClient
            .from('turnos')
            .select('*')
            .eq('conductor_id', conductorId)
            .order('fecha', { ascending: false })
            .limit(20);

        if (error) {
            console.warn('[TurnoModel] Error obteniendo turnos:', error.message);
            return this._datosFallback();
        }
        return data || [];
    },

    async iniciarTurno(conductorId, ruta, numeroBus = null) {
        if (!window.supabaseClient) return { ok: false, error: 'Sin conexión.' };

        // Cierra cualquier turno anterior de este mismo conductor que haya
        // quedado "activo" sin finalizar (ej. si refrescó la página o cerró
        // la pestaña sin darle a Finalizar Turno). Un conductor solo puede
        // tener un turno activo a la vez, si no, el pasajero ve dos buses
        // resaltados como si hubiera dos conductores reales en la ruta.
        await window.supabaseClient
            .from('turnos')
            .update({ hora_fin: new Date().toTimeString().slice(0, 5), estado: 'completado' })
            .eq('conductor_id', conductorId)
            .eq('estado', 'activo');

        const nuevoTurno = {
            conductor_id: conductorId,
            fecha: new Date().toISOString().split('T')[0],
            hora_inicio: new Date().toTimeString().slice(0, 5),
            hora_fin: null,
            ruta: ruta || 'N/A',
            numero_bus: numeroBus,
            vueltas: 0,
            estado: 'activo'
        };

        // OJO: insert() sin .select() a propósito. Encadenar .select().single()
        // exige que ademas de la politica de INSERT exista una de SELECT que
        // deje leer de vuelta la fila recien creada bajo el rol actual (anon).
        // Si esa segunda politica no está bien puesta, Supabase reporta como
        // "fallo" una insercion que en realidad sí funcionó. Como no
        // necesitamos el id que genera la base de datos para nada mas que
        // finalizar el turno (y eso ya lo resolvemos por conductor_id, ver
        // finalizarTurno), evitamos ese punto de falla por completo.
        let { error } = await window.supabaseClient.from('turnos').insert([nuevoTurno]);

        // Si la tabla aun no tiene la columna numero_bus, reintentar sin ella
        // para no bloquear el inicio de turno por un desfase de esquema.
        if (error && error.message.toLowerCase().includes('numero_bus')) {
            console.warn('[TurnoModel] Tabla turnos no tiene columna numero_bus. Reintentando sin ella...');
            delete nuevoTurno.numero_bus;
            ({ error } = await window.supabaseClient.from('turnos').insert([nuevoTurno]));
        }

        if (error) return { ok: false, error: error.message };
        return { ok: true, turno: nuevoTurno };
    },

    /* Turnos activos ahora mismo (cualquier conductor). Usado por el
       pasajero para resaltar en el mapa el bus que tiene conductor real,
       y por el admin para la tarjeta "Turnos activos ahora". */
    async obtenerActivos() {
        if (!window.supabaseClient) return [];
        try {
            const { data, error } = await window.supabaseClient
                .from('turnos')
                .select('*')
                .eq('estado', 'activo');

            if (error) {
                console.warn('[TurnoModel] Error obteniendo turnos activos:', error.message);
                return [];
            }

            // Un turno "activo" por mas de unas horas casi siempre es porque
            // el conductor cerro la pestana sin darle a Finalizar Turno, no
            // un turno real en curso (una jornada real no dura mas que esto).
            // Se ignora para el mapa y las alertas del pasajero, sin borrarlo
            // ni tocar la base de datos, solo no cuenta como "en vivo".
            const LIMITE_HORAS = 6;
            const ahora = Date.now();
            return (data || []).filter(t => {
                if (!t.fecha || !t.hora_inicio) return true; // sin datos para evaluar, se deja pasar
                const inicio = new Date(`${t.fecha}T${t.hora_inicio}`).getTime();
                const horas = (ahora - inicio) / 3600000;
                return horas >= 0 && horas <= LIMITE_HORAS;
            });
        } catch (err) {
            console.error('[TurnoModel] Error inesperado:', err);
            return [];
        }
    },

    /* Recibe el id del conductor, no el id del turno, porque ya no leemos
       de vuelta la fila insertada (ver nota en iniciarTurno). Un conductor
       solo tiene un turno activo a la vez, así que esto es suficiente. */
    async finalizarTurno(conductorId) {
        if (!window.supabaseClient) return { ok: false, error: 'Sin conexión.' };

        const { error } = await window.supabaseClient
            .from('turnos')
            .update({
                hora_fin: new Date().toTimeString().slice(0, 5),
                estado: 'completado'
            })
            .eq('conductor_id', conductorId)
            .eq('estado', 'activo');

        return error ? { ok: false, error: error.message } : { ok: true };
    },

    // Datos de respaldo cuando Supabase no está disponible
    _datosFallback() {
        const hoy = new Date();
        const fmt = (d) => d.toISOString().split('T')[0];
        const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1);
        const antes = new Date(hoy); antes.setDate(hoy.getDate() - 2);

        return [
            { fecha: fmt(hoy),   ruta: 'G-07', hora_inicio: '05:30', hora_fin: null,    vueltas: 7, estado: 'activo' },
            { fecha: fmt(ayer),  ruta: 'G-07', hora_inicio: '05:30', hora_fin: '14:00', vueltas: 10, estado: 'completado' },
            { fecha: fmt(antes), ruta: 'G-07', hora_inicio: '06:00', hora_fin: '13:30', vueltas: 9,  estado: 'completado' },
        ];
    }
};

window.TurnoModel = TurnoModel;
