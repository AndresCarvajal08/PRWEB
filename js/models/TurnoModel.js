/**
 * ============================================================
 * MODEL — TurnoModel
 * js/models/TurnoModel.js
 * CRUD de turnos de conductores contra Supabase.
 * Tabla: turnos (conductor_id, fecha, hora_inicio, hora_fin, ruta, vueltas, estado)
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

    async iniciarTurno(conductorId, ruta) {
        if (!window.supabaseClient) return { ok: false, error: 'Sin conexión.' };

        const { data, error } = await window.supabaseClient
            .from('turnos')
            .insert([{
                conductor_id: conductorId,
                fecha: new Date().toISOString().split('T')[0],
                hora_inicio: new Date().toTimeString().slice(0, 5),
                hora_fin: null,
                ruta: ruta || 'N/A',
                vueltas: 0,
                estado: 'activo'
            }])
            .select()
            .single();

        if (error) return { ok: false, error: error.message };
        return { ok: true, turno: data };
    },

    async finalizarTurno(turnoId) {
        if (!window.supabaseClient) return { ok: false, error: 'Sin conexión.' };

        const { error } = await window.supabaseClient
            .from('turnos')
            .update({
                hora_fin: new Date().toTimeString().slice(0, 5),
                estado: 'completado'
            })
            .eq('id', turnoId);

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
