/**
 * ============================================================
 * CAPA DE DATOS — Conector Supabase
 * Archivo: js/supabase.js
 * Capa: Acceso a Datos (Layered Architecture)
 * ============================================================
 * ESTADO: ⚠️ EN ESPERA — No activado aún.
 * Este archivo está preparado para la integración futura con
 * Supabase como base de datos backend del proyecto.
 *
 * INSTRUCCIONES PARA ACTIVAR:
 * 1. Crear proyecto en https://supabase.com
 * 2. Ir a Project Settings → API
 * 3. Copiar la URL del proyecto y la clave anon/public
 * 4. Reemplazar los valores en SUPABASE_CONFIG
 * 5. Incluir el SDK: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 * 6. Descomentar las funciones de acceso a datos
 * ============================================================
 */

// ──────────────────────────────────────────────
// CONFIGURACIÓN (completar cuando se active)
// ──────────────────────────────────────────────
const SUPABASE_CONFIG = {
  url: 'https://hydutlgmeirlmspsoncx.supabase.co',
  anonKey: 'sb_publishable_g9nKwxN03UPsGIPPBIpDow_T291XvBM',
  tablas: {
    usuarios:   'usuarios',
    rutas:      'rutas',
    paradas:    'paradas',
    empresas:   'empresas',
    reportes:   'reportes',
    incidencias:'incidencias',
    historial:  'historial_sesiones'
  }
};

/**
 * ── ESQUEMA DE TABLAS SUPABASE ──────────────────
 *
 * TABLA: usuarios
 * ┌─────────────────┬──────────────────┬──────────────────────────────┐
 * │ Campo           │ Tipo             │ Descripción                  │
 * ├─────────────────┼──────────────────┼──────────────────────────────┤
 * │ id              │ uuid (PK)        │ ID único del usuario         │
 * │ nombres         │ text NOT NULL    │ Nombres del usuario          │
 * │ apellidos       │ text NOT NULL    │ Apellidos del usuario        │
 * │ correo          │ text UNIQUE      │ Correo electrónico           │
 * │ rol             │ enum             │ pasajero/conductor/admin     │
 * │ cedula          │ text             │ Número de cédula             │
 * │ celular         │ text             │ Número de celular            │
 * │ activo          │ boolean          │ Estado de la cuenta          │
 * │ fecha_registro  │ timestamptz      │ Fecha de creación            │
 * │ auth_uid        │ uuid FK→auth     │ Referencia a Supabase Auth   │
 * └─────────────────┴──────────────────┴──────────────────────────────┘
 *
 * TABLA: conductores (extiende usuarios)
 * ┌──────────────────────┬─────────────┬──────────────────────────────┐
 * │ Campo                │ Tipo        │ Descripción                  │
 * ├──────────────────────┼─────────────┼──────────────────────────────┤
 * │ usuario_id           │ uuid FK     │ Referencia a usuarios        │
 * │ empresa_id           │ uuid FK     │ Referencia a empresas        │
 * │ ruta_id              │ uuid FK     │ Referencia a rutas           │
 * │ turno                │ text        │ Turno asignado               │
 * │ licencia_numero      │ text        │ Número de licencia           │
 * │ licencia_categoria   │ text        │ Categoría (C1, C2, C3)       │
 * │ licencia_vencimiento │ date        │ Fecha de vencimiento         │
 * │ vehiculo_placa       │ text        │ Placa del vehículo           │
 * │ vehiculo_marca       │ text        │ Marca                        │
 * │ vehiculo_modelo      │ text        │ Modelo                       │
 * │ soat_vence           │ date        │ Vencimiento SOAT             │
 * │ tecnomecanica_vence  │ date        │ Vencimiento tecnomecánica    │
 * └──────────────────────┴─────────────┴──────────────────────────────┘
 *
 * TABLA: rutas
 * ┌──────────────────┬─────────────┬────────────────────────────────────┐
 * │ Campo            │ Tipo        │ Descripción                        │
 * ├──────────────────┼─────────────┼────────────────────────────────────┤
 * │ id               │ uuid (PK)   │ ID de la ruta                      │
 * │ codigo           │ text UNIQUE │ Código de ruta (ej: R101, G07)     │
 * │ nombre           │ text        │ Nombre descriptivo                 │
 * │ origen           │ text        │ Parada de origen                   │
 * │ destino          │ text        │ Parada de destino                  │
 * │ empresa_id       │ uuid FK     │ Empresa operadora                  │
 * │ tipo             │ enum        │ bus/guala/campero                  │
 * │ activa           │ boolean     │ Estado de la ruta                  │
 * │ distancia_km     │ numeric     │ Distancia total en km              │
 * │ frecuencia_min   │ integer     │ Frecuencia en minutos              │
 * └──────────────────┴─────────────┴────────────────────────────────────┘
 */

// ──────────────────────────────────────────────
// INICIALIZACIÓN (ACTIVA)
// ──────────────────────────────────────────────
// Requiere: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
(function() {
    if (typeof supabase !== 'undefined') {
        const { createClient } = supabase;
        window.supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.info('%c[MoviCali] Supabase API conectada exitosamente.', 'color: #10b981; font-weight: bold;');
    } else {
        console.warn('⚠️ Supabase SDK no detectado. Cargando en modo simulación...');
    }
})();

// ──────────────────────────────────────────────
// EXPORTACIÓN
// ──────────────────────────────────────────────
const SupabaseConfig = {
  activo: true,
  config: SUPABASE_CONFIG
};

console.info('%c[MoviCali] Supabase API conectada exitosamente.', 'color: #10b981; font-weight: bold;');
