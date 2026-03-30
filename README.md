# 🚌 MoviCali — Sistema de Transporte Público Tradicional

**Proyecto de grado — Ingeniería de Sistemas**  
Universidad · Santiago de Cali, Colombia · 2025–2026

---

## 📋 Descripción del Proyecto

**MoviCali** es una aplicación web para la consulta y gestión de rutas del **transporte público tradicional** de Santiago de Cali (buses de empresas como La Ermita, Riocali, Montebello, y gualas/camperos de la ladera). Resuelve la brecha de información digital que existe para este sistema, que carece de herramientas como las que tiene el MÍO (ej: Moovit).

---

## 🏗️ Arquitectura del Sistema

El proyecto usa **Layered Architecture (Arquitectura en Capas)**:

```
┌─────────────────────────────────────────────┐
│          CAPA DE PRESENTACIÓN               │
│   login.html, index.html, panelConductor,   │
│   panelAdministrador, registro-*.html       │
├─────────────────────────────────────────────┤
│          CAPA DE LÓGICA DE NEGOCIO          │
│   js/auth.js — autenticación, roles,        │
│   validaciones, registro de usuarios        │
├─────────────────────────────────────────────┤
│          CAPA DE ACCESO A DATOS             │
│   js/supabase.js — conector BD (pendiente)  │
│   [Actualmente: datos en memoria simulados] │
├─────────────────────────────────────────────┤
│          CAPA DE ESTILOS / RECURSOS         │
│   css/global.css — sistema de diseño        │
│   assets/ — imágenes y recursos             │
└─────────────────────────────────────────────┘
```

---

## 📁 Estructura de Archivos

```
PRWEB/
│
├── 📄 login.html               ← Pantalla de inicio de sesión (3 roles)
├── 📄 index.html               ← Panel del PASAJERO (consulta de rutas)
│
├── pages/
│   ├── 📄 panelAdministrador.html   ← Panel del ADMINISTRADOR
│   ├── 📄 panelConductor.html       ← Panel del CONDUCTOR
│   ├── 📄 registro-pasajero.html    ← Formulario registro pasajero
│   └── 📄 registro-conductor.html   ← Formulario registro conductor
│
├── js/
│   ├── 📄 auth.js              ← Capa de autenticación y lógica de usuarios
│   └── 📄 supabase.js          ← Conector Supabase (pendiente de activar)
│
├── css/
│   └── 📄 global.css           ← Sistema de diseño institucional
│
└── assets/                     ← Recursos multimedia (imágenes, etc.)
```

---

## 👥 Roles del Sistema y Credenciales de Prueba

### 🧍 Pasajero
| Campo | Valor |
|-------|-------|
| Correo | `lauraruiz@gmail.com` |
| Contraseña | `Pasajero1*` |
| Acceso | `/index.html` |

### 🚌 Conductor
| Campo | Valor |
|-------|-------|
| Correo | `jcaicedo@laermita.com.co` |
| Contraseña | `Conductor1*` |
| Empresa | La Ermita S.A. |
| Ruta | R101 — Ciudad Córdoba ↔ Centro |
| Acceso | `/pages/panelConductor.html` |

| Conductor 2 | Valor |
|-------|-------|
| Correo | `lperea@montebello.com.co` |
| Contraseña | `Guala2025*` |
| Empresa | Cooperativa Montebello Ltda. |
| Tipo | Guala/Campero |

### ⚙️ Administrador
| Campo | Valor |
|-------|-------|
| Correo | `admin@movicali.gov.co` |
| Contraseña | `Admin2025*` |
| Cargo | Administrador del Sistema |
| Acceso | `/pages/panelAdministrador.html` |

---

## ✅ Funcionalidades Implementadas

### 🔐 Autenticación (auth.js)
- [x] Login con validación de correo y contraseña
- [x] Selector de rol (Pasajero / Conductor / Administrador)
- [x] Acceso rápido con credenciales de demostración
- [x] Guardia de autenticación en cada panel (`requireAuth`)
- [x] Cierre de sesión (logout) con redirección al login
- [x] Sesión almacenada en `sessionStorage` (se limpia al cerrar pestaña)
- [x] Datos del usuario mostrados dinámicamente en la navbar

### 🧍 Panel del Pasajero (index.html)
- [x] Mapa interactivo con rutas y paradas
- [x] Búsqueda de rutas con filtros
- [x] Asistente IA de consulta de rutas
- [x] Alertas de novedades en tiempo real
- [x] Historial de rutas consultadas
- [x] Perfil de usuario y configuración de seguridad
- [x] Rutas favoritas
- [x] Información de empresas de transporte

### 🚌 Panel del Conductor (panelConductor.html)
- [x] Vista del turno activo
- [x] Información detallada de la ruta asignada
- [x] Mapa de progreso de la ruta con paradas
- [x] Reporte de incidencias (bloqueo, falla mecánica, seguridad)
- [x] Historial de turnos anteriores
- [x] Perfil del conductor con datos del vehículo y licencia
- [x] Datos dinámicos según conductor autenticado

### ⚙️ Panel del Administrador (panelAdministrador.html)
- [x] Dashboard con KPIs del sistema
- [x] Validación y rechazo de reportes de conductores
- [x] Estado de rutas en tiempo real
- [x] Gestión de rutas (crear, editar, activar/desactivar)
- [x] Gestión de usuarios (pasajeros y conductores)
- [x] Gestión de empresas de transporte
- [x] Sistema de alertas activas
- [x] Configuración del sistema

### 📝 Formularios de Registro
- [x] **Registro de Pasajero**: Formulario 3 pasos con datos personales, credenciales y confirmación
- [x] **Registro de Conductor**: Formulario 5 pasos con:
  - Datos personales completos
  - Datos del vehículo (placa, marca, modelo, tipo, SOAT, tecno-mecánica)
  - Datos de licencia de conducción (categoría, vencimiento, restricciones)
  - Credenciales de acceso y asignación de ruta
  - Confirmación con términos legales
- [x] Validaciones en tiempo real
- [x] Indicador de fuerza de contraseña
- [x] Avisos legales (Ley 1581/2012, Ley 769/2002)

---

## ⚖️ Marco Legal Implementado

El sistema contempla la normativa colombiana aplicable:

| Norma | Aplicación |
|-------|-----------|
| **Ley 1581 de 2012** | Protección de datos personales (Habeas Data) |
| **Decreto 1377 de 2013** | Reglamento de tratamiento de datos personales |
| **Ley 769 de 2002** | Código Nacional de Tránsito — Licencias de conducción |
| **Res. 20203040021965** | Min-Transporte — Tarjeta de operación vehículos |
| **Decreto 2150 de 1995** | Revisión técnico-mecánica obligatoria |

### Categorías de Licencia de Conducción Registradas
- **C3** — Vehículos de servicio público colectivo urbano (buses)
- **C2** — Vehículos de servicio público especial (gualas/camperos ladera)

---

## 🎨 Sistema de Diseño

### Color Principal Institucional
```css
--primary: #1EA0D8;  /* Azul institucional MoviCali */
```

### Paleta Completa
| Variable | Color | Uso |
|----------|-------|-----|
| `--primary` | `#1EA0D8` | Color principal, botones, acentos |
| `--primary-dark` | `#1478A8` | Hover, textos resaltados |
| `--primary-light` | `#E5F4FB` | Fondos suaves, badges |
| `--accent` | `#0DCCA0` | Éxito, rutas activas |
| `--warn` | `#F59E0B` | Advertencias, mantenimiento |
| `--danger` | `#EF4444` | Errores, alertas críticas |

### Tipografía
- **Inter** (Google Fonts) — Principal
- Fallback: Segoe UI, system-ui

---

## 🗄️ Base de Datos (Futura integración — Supabase)

El archivo `js/supabase.js` está preparado con:
- Configuración del cliente (pendiente de credenciales)
- Esquema documentado de tablas (`usuarios`, `conductores`, `rutas`, `paradas`, `empresas`, `reportes`)
- Funciones de autenticación y CRUD comentadas
- Instrucciones paso a paso para activar la integración

### Para activar Supabase:
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **Project Settings → API**
3. Copiar URL y clave `anon` pública
4. Editar `js/supabase.js` con las credenciales
5. Agregar el SDK: `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>`
6. Descomentar las funciones en `supabase.js`
7. Reemplazar las funciones en `auth.js` por las de `supabase.js`

---

## 🚀 Cómo Ejecutar el Proyecto

El proyecto es **100% HTML/CSS/JS puro**, sin dependencias de npm ni build tools.

### Opción 1 — Abrir directamente
Abrir `login.html` en el navegador. ⚠️ Algunas funciones pueden estar limitadas por CORS en modo `file://`.

### Opción 2 — Servidor local (recomendado)
```bash
# Con Python
python -m http.server 8080
# Luego abrir: http://localhost:8080/login.html

# Con Node.js (npx)
npx serve .
# Luego abrir: http://localhost:3000/login.html

# Con VS Code: instalar extensión Live Server
# Clic derecho en login.html → "Open with Live Server"
```

---

## 📐 Diagramas UML

Los diagramas de secuencia (formato PNG) están disponibles para los 3 roles del sistema siguiendo el estándar **UML 2.x**:

- Actor claramente definido
- Evento disparador del flujo
- Flujo principal de interacción
- Respuesta del sistema

---

## 🔮 Próximos Pasos

- [ ] Integración con Supabase (base de datos real)
- [ ] Integración con API REST del backend
- [ ] Mapa real con Leaflet.js / Google Maps API
- [ ] Notificaciones push en tiempo real (WebSockets)
- [ ] PWA (Progressive Web App) para uso offline
- [ ] Panel de reportes y estadísticas avanzadas
- [ ] Sistema de calificación de rutas por pasajeros

---

## 👨‍💻 Equipo

**Proyecto de Grado — Ingeniería de Sistemas**  
Director: [Nombre del director]  
Estudiante: Andrés  
Universidad: [Nombre de la universidad]  
Año: 2025–2026

---

*Norma de calidad: **ISO 25000** · Estándar de documentación: **UML 2.x***
