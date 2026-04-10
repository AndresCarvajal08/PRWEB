/**
 * ============================================================
 * SISTEMA DE ALERTAS Y REPORTES — MoviCali (SUPABASE PRO)
 * Maneja la lógica de incidencias reportadas por conductores.
 * ============================================================
 */

const WayAlertas = {
    // Solo permitimos ver hoy
    getHoyISO() {
        const d = new Date();
        d.setHours(0,0,0,0);
        return d.toISOString();
    },

    /**
     * Obtiene alertas desde Supabase con manejo de errores robusto
     */
    async obtenerAlertas() {
        if (!window.supabaseClient) {
            console.error('🚫 WayRoute: Supabase no inicializado en obtenerAlertas.');
            return [];
        }

        try {
            console.log('🔄 Sincronizando alertas desde Supabase...');
            const { data, error } = await window.supabaseClient
                .from('reportes')
                .select('*')
                .gte('fecha', this.getHoyISO())
                .order('fecha', { ascending: false });

            if (error) {
                console.error('❌ Supabase SELECT Error:', error.message, error.details);
                return [];
            }

            console.log(`✅ Sincronización exitosa: ${data.length} alertas activas.`);
            return data.map(al => ({
                ...al,
                icono: this.getIcono(al.tipo)
            }));
        } catch (err) {
            console.error('❌ Error inesperado en obtenerAlertas:', err);
            return [];
        }
    },

    /**
     * Crea un reporte en Supabase con diagnóstico detallado
     */
    async crearAlerta(datos) {
        if (!window.supabaseClient) {
            console.error('🚫 WayRoute: Supabase no inicializado en crearAlerta.');
            alert('Error de conexión con el servidor. Por favor, recarga la página.');
            return false;
        }

        try {
            console.log('📡 Intentando guardar reporte en Supabase:', datos);
            
            // Construcción del objeto de inserción
            const nuevoReporte = {
                tipo: datos.tipo,
                titulo: datos.titulo,
                descripcion: datos.descripcion,
                ubicacion: datos.ubicacion,
                ruta: datos.ruta || 'N/A',
                severidad: datos.severidad || 'moderada',
                conductor_id: datos.conductorId, // Si falla aquí es por el tipo UUID vs TEXT en el SQL
                fecha: new Date().toISOString()
            };

            const { data, error } = await window.supabaseClient
                .from('reportes')
                .insert([nuevoReporte])
                .select(); // Devolver el dato insertado para confirmar

            if (error) {
                console.group('❌ FALLA DE INSERCIÓN EN SUPABASE');
                console.error('Mensaje:', error.message);
                console.error('Detalles:', error.details);
                console.error('Sugerencia:', error.hint);
                console.error('Datos enviados:', nuevoReporte);
                console.groupEnd();
                
                // Alertar al usuario para que sepa por qué falló
                alert(`Error en Base de Datos: ${error.message}\n\nDetalle: ${error.details || 'ID no válido format (UUID).'}`);
                return false;
            }

            console.log('✅ Reporte guardado con éxito:', data);
            return true;
        } catch (err) {
            console.error('❌ Error crítico en crearAlerta:', err);
            return false;
        }
    },

    /**
     * Limpieza automática de hoy (Solo para mantenimiento)
     */
    async limpiarAlertasAntiguas() {
        if (!window.supabaseClient) return;
        try {
            const { error } = await window.supabaseClient
                .from('reportes')
                .delete()
                .lt('fecha', this.getHoyISO());
            
            if (error) console.warn('⚠️ No se pudieron borrar físicamente los reportes antiguos (Posible RLS).');
        } catch (err) {
            console.error('❌ Error en limpieza de Supabase:', err);
        }
    },

    getIcono(tipo) {
        const iconos = {
            'bloqueo': '🚧',
            'falla': '🔧',
            'seguridad': '🚨',
            'congestion': '🚦',
            'clima': '⛈️'
        };
        return iconos[tipo] || '⚠️';
    }
};

// Exponer globalmente
window.WayAlertas = WayAlertas;

// Autolimpieza retrasada para dar tiempo a la conexión
setTimeout(() => WayAlertas.limpiarAlertasAntiguas(), 2000);
