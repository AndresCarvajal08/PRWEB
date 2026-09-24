# 🚌 WayRoute — Sistema de Transporte Público de Cali

**Proyecto de grado — Ingeniería de Sistemas**
Santiago de Cali, Colombia · 2025–2026

---

## 📋 Descripción del Proyecto

**WayRoute** es una aplicación web para la consulta y gestión de rutas del **transporte público tradicional** de Santiago de Cali (buses y gualas/camperos de ladera). Resuelve la brecha de información digital que existe para este sistema, que no cuenta con herramientas como las de otras ciudades (ej: Moovit).

---

## 🏗️ Arquitectura del Sistema

El proyecto usa **MVVM (Model-View-ViewModel)**, con separación real de capas:

```
js/
├── models/        ← Acceso a datos (Supabase): UsuarioModel, TurnoModel,
│                    AlertaModel, ContactoModel, SesionModel, ConductorModel
├── views/         ← Renderizado en el DOM: AlertaView, NavView
├── viewmodels/    ← Orquestación: PasajeroViewModel, ConductorViewModel,
│                    AlertaViewModel, AuthViewModel
├── services/      ← Servicios transversales: supabase.js (conexión real),
│                    MapaService.js (simulación de flota sobre Leaflet),
│                    IAService.js (asistente WayAI), AuthService.js
└── core/          ← Utilidades compartidas: Toast, Router, EventBus, habeasData
```

Base de datos y autenticación: **Supabase**, conectado y en uso (no simulado). Mapa: **Leaflet.js** sobre tiles de OpenStreetMap, con rutas reales de Cali. Asistente conversacional: **Google Gemini**, con un motor local de respuestas como respaldo cuando la API externa no está disponible.

---

## 📁 Estructura de Archivos

```
PRWEB/
│
├── login.html                       ← Inicio de sesión
├── index.html                       ← Redirección inicial
│
├── pages/
│   ├── panelPasajero.html           ← Panel del PASAJERO
│   ├── panelConductor.html          ← Panel del CONDUCTOR
│   ├── panelAdministrador.html      ← Panel del ADMINISTRADOR
│   ├── registro-pasajero.html       ← Registro de pasajero
│   └── registro-conductor.html      ← Registro de conductor
│
├── js/
│   ├── models/, views/, viewmodels/, services/, core/   ← ver arquitectura arriba
│
├── css/                              ← Hojas de estilo por panel
├── assets/                           ← Logo e íconos
└── www/                              ← Espejo del proyecto usado por Capacitor (build Android)
```

---

## ✅ Funcionalidades Implementadas

### 🔐 Autenticación
- Login y registro reales contra Supabase Auth (con respaldo local si Supabase no está disponible)
- Guardia de autenticación por rol en cada panel
- Recuperación de contraseña por enlace al correo
- Sesión en `sessionStorage`, datos de usuario reales en la navbar

### 🧍 Panel del Pasajero
- Mapa interactivo (Leaflet) con 5 rutas reales de Cali, buses simulados en tiempo real sobre el trazado
- Buscador de destino con geocodificación real (Nominatim/OpenStreetMap)
- Asistente WayAI: responde sobre rutas específicas, tiempos de llegada, tarifas y reconoce ubicaciones como "cerca de mi casa"
- Alertas de conductores en tiempo real (notificación tipo push + Supabase Realtime, con respaldo por sondeo)
- Alerta de proximidad basada en la ubicación GPS real del pasajero
- Perfil editable con guardado real en base de datos
- Contactos de confianza y compartir ubicación

### 🚌 Panel del Conductor
- Inicio de turno con selección real de ruta y número de bus
- Mapa de "Mi Ruta Activa" con el recorrido real de la ruta elegida
- Botón de Emergencia (registra ubicación real y notifica de inmediato)
- Reporte de incidencias (bloqueo, falla mecánica, seguridad) con geocodificación de la ubicación
- Historial de turnos real
- Perfil con datos de vehículo y licencia

### ⚙️ Panel del Administrador
- Dashboard con KPIs reales (usuarios, conductores, empresas, reportes)
- Turnos activos en tiempo real
- Validación y rechazo de reportes
- Gestión de usuarios, conductores y empresas
- Alertas de vencimiento de SOAT, tecnomecánica y licencia

---

## ⚖️ Marco Legal Implementado

| Norma | Aplicación |
|-------|-----------|
| **Ley 1581 de 2012** | Protección de datos personales (Habeas Data) |
| **Decreto 1377 de 2013** | Reglamento de tratamiento de datos personales |
| **Ley 769 de 2002** | Código Nacional de Tránsito — Licencias de conducción |
| **Res. 20203040021965** | Min-Transporte — Tarjeta de operación vehículos |
| **Decreto 2150 de 1995** | Revisión técnico-mecánica obligatoria |

---

## 🎨 Sistema de Diseño

```css
--primary: #1EA0D8;  /* Azul institucional WayRoute */
```

Tipografía: **Inter** (Google Fonts), con fallback a Segoe UI / system-ui.

---

## 🚀 Cómo Ejecutar el Proyecto

Es **100% HTML/CSS/JS**, sin build tools para la web (el proyecto Android usa Capacitor sobre `www/`).

```bash
# Con Python
python -m http.server 8080
# Luego abrir: http://localhost:8080/login.html

# Con Node.js
npx serve .
```

⚠️ Al editar cualquier archivo, sincronízalo también en `www/` (mismo path), es la carpeta que usa el build de Android.

---

## 🔮 Limitaciones conocidas y siguientes pasos

- **Geolocalización de buses**: la posición de cada unidad es una simulación sobre coordenadas GPS reales de cada ruta, no telemetría de un vehículo físico. Integrar GPS real es la siguiente etapa, sujeta a hardware en las unidades y alianza con las empresas de transporte.
- **Clave de API de Gemini**: por ahora se llama directo desde el cliente. La siguiente iteración la mueve detrás de una función servidor (Supabase Edge Function) para no exponerla en el código público.
- **Políticas de RLS en Supabase**: algunas tablas quedaron con RLS deshabilitado tras resolver bloqueos de escritura durante el desarrollo. Antes de un despliegue en producción real, se deben definir políticas por rol.

---

## 👨‍💻 Equipo

**Proyecto de Grado — Ingeniería de Sistemas**
Estudiante: Andrés

---

*Norma de calidad: **ISO 25000** · Estándar de documentación: **UML 2.x***
