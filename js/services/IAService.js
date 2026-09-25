/**
 * ============================================================
 * ASISTENTE IA — WayRoute (Conexión Google Gemini)
 * Archivo: js/ia.js
 * ============================================================ */

const GEMINI_API_KEY = "AQ.Ab8RN6LxvEZXkU2HTL0DoVJZUeBM6H171gbgIKzrPRLjuKUHIw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

let chatHistory = [];

const SYSTEM_PROMPT = `
Eres WayAI, el asistente virtual de WayRoute — una app de transporte público de Cali, Colombia. Eres inteligente, amable y con personalidad caleña auténtica.

## Personalidad
- Cálido y natural: usás frases como "¡Mirá!", "¡A la orden!", "¡Bacano!", "¡Listo pues!", "Vé".
- Sos conversacional: si alguien saluda, respondés el saludo antes de ofrecer ayuda.
- Si alguien agradece, respondés con calidez sin mencionar rutas ni funciones.
- Si alguien se despide, te despedís amablemente.
- Usás emojis con moderación: 🚌 🚐 🗺️ 📍 💰 🌙 ✅ 😊

## Tu especialidad es movilidad en Cali, pero sos un asistente abierto
- Podés charlar brevemente sobre temas generales si el usuario lo inicia.
- Para preguntas de matemáticas, trivia o temas lejanos al transporte: respondés brevemente y luego ofrecés volver al tema de movilidad. Ejemplo: si preguntan "2+2", respondés "¡4! 😄 Aunque los números que más me gustan son los minutos que falta el bus. ¿Te ayudo con eso?"
- NUNCA respondas de forma robótica ni forzada. Si la pregunta es simple, respondés simple.

## Rutas activas en WayRoute
🔴 **Ruta Especial Sur** — 4 buses rojos · La Ermita → 7 paradas → La Ermita · Tarifa: $2.950
🔵 **Ruta Norte** — 3 buses azules · Granada (Cll 22N) → Chipichape → Menga → Santa Mónica · Tarifa: $3.100
🟢 **Gualas Oriente** — 3 camperos verdes · Cra 22 → Cll 53 → Cll 72W → Cll 92 · Tarifa: $2.800
🟠 **Ruta Sur** — 3 buses naranjas · Pryca (Cra 86) → Cra 94 → Cra 102 → U. Antonio Nariño · Tarifa: $3.200
🟣 **Ruta Calle 17** — 3 buses morados · circuito de ida y vuelta por Carrera 30, Carrera 29B y Carrera 23 · Tarifa: $3.000

Pago en efectivo al conductor. Cada ruta tiene tarifa diferente según distancia.

## Seguridad
- Recomendá "Compartir ubicación" en la app al viajar solos o de noche.
- Emergencias: llamar al 123.

## Reglas de formato
- Respuestas cortas y naturales. Máximo 3 párrafos.
- No hagas listas largas ni texto técnico frío.
- Cerrá siempre con una pregunta o invitación, EXCEPTO en agradecimientos y despedidas.

## Cuando te pregunten por posición, tiempos o info de rutas
- Si el usuario menciona UNA ruta específica (por nombre, zona o punto de referencia), respondé SOLO sobre esa ruta.
- Si menciona DOS rutas, respondé sobre esas dos únicamente.
- Si NO menciona ninguna ruta en particular, o pide explícitamente "todas"/"todos los buses", ahí sí mostrá las 4.
- Nunca respondas con las 4 rutas si el usuario preguntó por una sola.
`;

// ─────────────────────────────────────────────
//  NOMBRES Y EMOJIS POR RUTA
// ─────────────────────────────────────────────
const RUTA_INFO = {
    'Especial Sur': { emoji: '🔴', label: 'Ruta Especial Sur', icono: '🚌', tarifa: 2950 },
    'Norte': { emoji: '🔵', label: 'Ruta Norte (Granada→Menga)', icono: '🚌', tarifa: 3100 },
    'Gualas Oriente': { emoji: '🟢', label: 'Gualas Oriente', icono: '🚐', tarifa: 2800 },
    'Sur — Pryca/U.Nariño': { emoji: '🟠', label: 'Ruta Sur (Pryca→U.Nariño)', icono: '🚌', tarifa: 3200 },
    'Calle 17': { emoji: '🟣', label: 'Ruta Calle 17', icono: '🚌', tarifa: 3000 },
};

const RESPUESTA_POR_RUTA = {
    'Norte': "🔵 ¡Mirá! La **Ruta Norte** opera con 3 buses azules. Sale desde **Granada (Calle 22N)**, pasa por Chipichape, Av. Circunvalar, **Menga** y llega hasta **Santa Mónica**. Tarifa: **$3.100**. ¿Querés saber dónde están los buses ahora?",
    'Gualas Oriente': "🟢 ¡Las **Gualas del Oriente** están operando con 3 unidades! Recorren desde la **Carrera 22** hasta la **Calle 92**, pasando por Calle 53 y Calle 72W. Son camperos 4x4 ideales para el sector oriental. Tarifa: **$2.800**. ¿Te ayudo con algo más?",
    'Sur — Pryca/U.Nariño': "🟠 La **Ruta Sur** conecta **Pryca (Carrera 86)** con la **Universidad Antonio Nariño (Carrera 108)**, pasando por las carreras 94, 98B y 102. Opera con 3 buses naranjas. Tarifa: **$3.200**. ¿Querés saber el tiempo estimado de llegada?",
    'Especial Sur': "🔴 La **Ruta Especial Sur** tiene 4 buses rojos operando. Sale de **La Ermita** y recorre 7 paradas por el centro-sur de Cali. Tarifa: **$2.950**. ¿Te digo dónde están los buses ahora mismo?",
    'Calle 17': "🟣 La **Ruta Calle 17** hace un circuito de ida y vuelta sobre la Calle 17, con 3 buses morados. Pasa por Carrera 30 (El Jardín), Carrera 29B y Carrera 23 (Guayaquil). Tarifa: **$3.000**. ¿Querés saber cuánto falta para que pase por tu parada?",
};

// ─────────────────────────────────────────────
//  DETECTA QUÉ RUTA(S) MENCIONA EL MENSAJE
//  Devuelve un array vacío si no menciona ninguna en concreto (→ mostrar todas)
// ─────────────────────────────────────────────
function detectarRutasMencionadas(msg) {
    const rutas = [];
    if (msg.includes("norte") || msg.includes("granada") || msg.includes("menga") || msg.includes("chipichape")) rutas.push("Norte");
    if (msg.includes("oriente") || msg.includes("guala") || msg.includes("aguablanca") || msg.includes("campero")) rutas.push("Gualas Oriente");
    if (msg.includes("pryca") || msg.includes("nariño") || msg.includes("narino") || msg.includes("antonio")) rutas.push("Sur — Pryca/U.Nariño");
    if (msg.includes("ermita") || msg.includes("especial") || msg.includes("sur")) rutas.push("Especial Sur");
    if (msg.includes("calle 17") || msg.includes("cll 17") || msg.includes("29b") || msg.includes("29 b") || msg.includes("ruta 17")) rutas.push("Calle 17");
    return [...new Set(rutas)];
}

// ─────────────────────────────────────────────
//  MEMORIA DE CONTEXTO — recuerda de qué ruta(s) se habló
//  para que un "sí" / "dale" de seguimiento no pierda el hilo
// ─────────────────────────────────────────────
let contextoRutaActiva = [];
const PALABRAS_CONTINUACION = ["si", "sí", "claro", "dale", "va pues", "de una", "listo", "obvio"];

function esPalabraContinuacion(msg) {
    return PALABRAS_CONTINUACION.some(p => msg === p || msg.startsWith(p + " ") || msg.startsWith(p + ","));
}

// ─────────────────────────────────────────────
//  RECONOCIMIENTO DE LUGARES REALES (geocodificación)
//  Si el mensaje no menciona ninguna de las 4 rutas por palabra clave,
//  se intenta extraer el nombre del lugar y geocodificarlo de verdad
//  (mismo servicio que usa el buscador de Mapa & Rutas) para calcular
//  qué ruta pasa más cerca.
// ─────────────────────────────────────────────
const PALABRAS_RELLENO_LUGAR = [
    "dime", "cual", "cuál", "que", "qué", "es", "esta", "está", "estan", "están", "son", "hay",
    "hacia", "hasta", "cerca de", "cerca", "para", "me", "te", "lleva", "llevan", "llega", "llegan",
    "llego", "voy", "va", "ir", "el", "la", "los", "las", "una", "un", "de", "del", "al", "a", "en",
    "ruta", "rutas", "bus", "buses", "guala", "gualas", "donde", "dónde", "como", "cómo", "puedo",
    "podria", "podría", "llegar", "cuanto", "cuánto", "cuanta", "cuánta", "se", "demora", "demoran",
    "tarda", "tardan", "falta", "faltan", "minutos", "tiempo", "quiero", "necesito", "quisiera",
    "sabes", "sabe", "porfa", "porfavor", "favor",
];

function extraerLugarDeMensaje(msg) {
    const patron = new RegExp('\\b(' + PALABRAS_RELLENO_LUGAR.join('|') + ')\\b', 'g');
    return msg.replace(/[¿?¡!]/g, '').replace(patron, ' ').replace(/\s+/g, ' ').trim();
}

// "cerca de mi casa" / "donde vivo" no son direcciones geocodificables tal
// cual, pero el barrio real del pasajero sí lo es (el mismo que ya aparece
// en el campo Origen del mapa, tomado de su perfil). En vez de fallar al
// intentar geocodificar la frase literal, se usa ese barrio real.
const FRASES_MI_UBICACION = [
    "mi casa", "donde vivo", "cerca de mi", "cerca de mí", "cerca a mi", "cerca a mí",
    "mi barrio", "cerca mio", "cerca mío", "cerca de aca", "cerca de acá",
];

function obtenerBarrioRealDelPasajero() {
    const candidatos = [
        document.getElementById('quickOrigin')?.value,
        document.getElementById('mapaOrigen')?.value,
    ];
    return candidatos.find(v => v && !/detectando|^lat:/i.test(v)) || null;
}

async function resolverRutaPorGeocodificacion(msg) {
    if (typeof window.geocodificarEnCali !== 'function' ||
        !window.WayRoute || typeof window.WayRoute.distanciaARuta !== 'function') return [];

    let lugar = extraerLugarDeMensaje(msg);

    if (FRASES_MI_UBICACION.some(f => msg.includes(f))) {
        const miBarrio = obtenerBarrioRealDelPasajero();
        if (miBarrio) lugar = miBarrio;
    }

    if (lugar.length < 3) return [];

    try {
        const geo = await window.geocodificarEnCali(lugar);
        if (!geo) return [];
        const distancias = window.WayRoute.distanciaARuta(geo.lat, geo.lon);
        const RADIO_CERCA_M = 2500;
        const cercanas = distancias.filter(d => d.distanciaMetros <= RADIO_CERCA_M);
        return (cercanas.length ? cercanas : distancias.slice(0, 1)).map(d => d.clave);
    } catch (e) {
        return []; // sin internet o Nominatim no disponible → sin ruta detectada
    }
}

async function resolverRutasContexto(msg) {
    const mencionadas = detectarRutasMencionadas(msg);
    if (mencionadas.length) {
        contextoRutaActiva = mencionadas;
        return mencionadas;
    }

    if (esPalabraContinuacion(msg) && contextoRutaActiva.length) {
        return contextoRutaActiva; // seguir hablando de la misma ruta que ya se mencionó
    }

    const porGeocodificacion = await resolverRutaPorGeocodificacion(msg);
    if (porGeocodificacion.length) {
        contextoRutaActiva = porGeocodificacion;
        return porGeocodificacion;
    }

    contextoRutaActiva = []; // tema nuevo sin ruta específica → mostrar todas
    return [];
}

// Gemini no tiene forma de saber por su cuenta dónde está cada bus ahora
// mismo (eso solo existe en la simulación del navegador), así que sin esto
// respondía con evasivas honestas en vez de los datos reales que sí
// tenemos. Se arma un resumen en vivo y se agrega al contexto en cada
// mensaje, para que responda con los números reales, no inventados.
function construirContextoEnVivo() {
    if (typeof window.WayRoute?.tiempoLlegadaProximo !== "function") return "";
    try {
        const tiempos = window.WayRoute.tiempoLlegadaProximo();
        if (!tiempos || !tiempos.length) return "";
        const resumen = tiempos.map(t =>
            `${t.ruta} bus ${t.busProximo}: llega en ${t.minutos} min a ${t.parada} (${t.distanciaMetros} m)`
        ).join("\n");
        return "\n\n## Posición en vivo de los buses ahora mismo (usa estos datos reales si preguntan por posición o tiempo de llegada, nunca inventes otros)\n" + resumen;
    } catch (e) {
        return "";
    }
}

// ─────────────────────────────────────────────
//  FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────
async function sendAI() {
    const inputEl = document.getElementById("aiInput");
    const msg = inputEl.value.trim();
    if (!msg) return;

    agregarBurbuja(msg, "user");
    inputEl.value = "";

    const loadingId = agregarBurbuja("WayAI está pensando... 🤔", "bot");

    const historyForGemini = [
        { role: "user", parts: [{ text: "Contexto del sistema: " + SYSTEM_PROMPT + construirContextoEnVivo() }] },
        { role: "model", parts: [{ text: "¡Entendido! Soy WayAI de WayRoute. ¿En qué puedo ayudarte a moverte por Cali hoy?" }] }
    ];

    chatHistory.forEach(h => {
        historyForGemini.push({
            role: h.role === "bot" ? "model" : "user",
            parts: [{ text: h.text }]
        });
    });
    historyForGemini.push({ role: "user", parts: [{ text: msg }] });

    try {
        const response = await fetch(GEMINI_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: historyForGemini })
        });

        const data = await response.json();
        let respuestaBot = "";

        if (data.candidates && data.candidates[0].content.parts[0].text) {
            respuestaBot = data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Respuesta de IA vacía");
        }

        actualizarBurbuja(loadingId, formatText(respuestaBot));
        chatHistory.push({ role: "user", text: msg });
        chatHistory.push({ role: "bot", text: respuestaBot });

        document.getElementById("aiMessages").scrollTop = 99999;

    } catch (e) {
        console.error("Error Gemini:", e);
        const fallbackRes = await simulateAIResponse(msg);
        actualizarBurbuja(loadingId, formatText(fallbackRes));
        chatHistory.push({ role: "user", text: msg });
        chatHistory.push({ role: "bot", text: fallbackRes });
    }
}

window.sendAISuggestion = function (el) {
    document.getElementById("aiInput").value = el.innerText;
    sendAI();
};

// ─────────────────────────────────────────────
//  MOTOR LOCAL (fallback sin internet)
// ─────────────────────────────────────────────
async function simulateAIResponse(mensaje) {
    await new Promise(r => setTimeout(r, 1200));
    const msg = mensaje.toLowerCase();

    /* ── 0. MATEMÁTICAS SIMPLES ── */
    const matchCalc = msg.match(/(\d+(?:[.,]\d+)?)\s*(\+|-|\*|\/|más|mas|menos|por|entre|dividido)\s*(\d+(?:[.,]\d+)?)/);
    if (matchCalc) {
        const a = parseFloat(matchCalc[1].replace(',', '.'));
        const op = matchCalc[2].trim();
        const b = parseFloat(matchCalc[3].replace(',', '.'));
        let res;
        if (['+', 'más', 'mas'].includes(op)) res = a + b;
        else if (['-', 'menos'].includes(op)) res = a - b;
        else if (['*', 'por'].includes(op)) res = a * b;
        else if (['/', 'entre', 'dividido'].includes(op)) res = b !== 0 ? +(a / b).toFixed(4) : null;
        if (res !== null && res !== undefined) {
            return `¡${res}! 😄 Aunque los números que más me sé son los minutos que falta el bus. ¿Te ayudo con el transporte en Cali?`;
        }
    }

    /* ── 0b. QUIÉN SOY / CÓMO FUNCIONO ── */
    if (msg.includes("eres un bot") || msg.includes("eres una ia") || msg.includes("eres inteligencia") ||
        msg.includes("cómo funcionas") || msg.includes("como funcionas") ||
        msg.includes("quién te hizo") || msg.includes("quien te hizo") ||
        msg.includes("qué eres") || msg.includes("que eres")) {
        return "¡Soy WayAI! 🤖 Soy el asistente virtual de **WayRoute**, entrenado para ayudarte con el transporte público de Cali — rutas, buses, gualas, tiempos y tarifas. No soy un chatbot genérico, soy 100% caleño y especializado en movilidad. 😄 ¿En qué te puedo ayudar hoy?";
    }

    /* ── 0c. PREGUNTAS FUERA DE TEMA ── */
    const temasAjenos = [
        /\bcapital de\b/, /\bpresidente\b/, /\bpoblación de\b/, /\bclima en\b/,
        /\breceta\b/, /\bcocina\b/, /\bpelícula\b/, /\bdeporte\b/, /\bfútbol\b/,
        /\bprogramar?\b/, /\bpython\b/, /\bjava(?:script)?\b/, /\bhtml\b/,
        /\bcódigo\b/, /\bchiste\b/, /\bcuento\b/, /\bpoema\b/, /\bcanción\b/,
        /\bnoticia\b/, /\bpolítica\b/, /\belección\b/, /\bguerra\b/,
        /\bsalud\b/, /\bmedicamento\b/, /\bdoctor\b/, /\benfermed/,
    ];
    const esAjeno = temasAjenos.some(r => r.test(msg));
    if (esAjeno) {
        return "¡Uy vé! 😄 Eso ya me queda lejos de la ruta. Soy WayAI y estoy especializado en el transporte de Cali — rutas, buses, gualas, tiempos y tarifas. ¿Te cuento algo de eso mejor?";
    }

    /* ── 0d. REPORTAR UN PROBLEMA (función de la app, no charla libre) ── */
    if (msg.includes("reportar un problema") || msg.includes("reporto un problema") ||
        msg.includes("reportar una incidencia") || msg.includes("reportar algo") ||
        msg.includes("como reporto") || msg.includes("cómo reporto")) {
        return "🚨 Para reportar un problema andá a la sección **Alertas** en el menú y tocá **'Reportar Incidencia'** — queda registrado con tu ubicación. Si es una emergencia real, usá el botón de emergencia o llamá al **123**. ¿Te ayudo con algo más?";
    }

    /* ── 0e. COMPARTIR UBICACIÓN / CONTACTOS DE EMERGENCIA (función de la app) ──
       "ubica" es keyword del bloque de POSICIÓN EN TIEMPO REAL (justo abajo),
       pero si el usuario habla de COMPARTIR SU PROPIA ubicación o de agregar
       un contacto, está preguntando por una función de seguridad de la app,
       no por dónde están los buses — hay que interceptar esto ANTES. */
    if ((msg.includes("compart") && (msg.includes("ubicac") || msg.includes("viaje"))) ||
        msg.includes("contacto de emergencia") || msg.includes("agregar un contacto") ||
        msg.includes("agrego un contacto")) {
        return "📍 Tenés el botón **'Compartir mi viaje'** en la app — actívalo antes de subir al bus para que un contacto de confianza vea tu recorrido en tiempo real. También podés guardar contactos de emergencia desde tu perfil, en la sección de Seguridad. ¿Te ayudo con algo más?";
    }

    /* ── 1. POSICIÓN EN TIEMPO REAL ── */
    if (msg.includes("donde") || msg.includes("dónde") || msg.includes("ubica") ||
        msg.includes("estan") || msg.includes("están") || msg.includes("posicion") ||
        msg.includes("posición") || msg.includes("transitan") || msg.includes("circulan") ||
        msg.includes("van los") || msg.includes("mas cerca") || msg.includes("más cerca") ||
        msg.includes("cerca de mi") || msg.includes("cerca de mí")) {

        const pos = obtenerPosiciones();
        if (!pos) return "🗺️ El mapa aún no está activo. Abrí la vista **Mapa** primero y WayAI podrá decirte exactamente dónde está cada unidad.";

        // Agrupar por ruta
        const porRuta = {};
        pos.forEach(b => {
            if (!porRuta[b.ruta]) porRuta[b.ruta] = [];
            porRuta[b.ruta].push(b);
        });

        // Filtrar solo por la(s) ruta(s) que el usuario mencionó (o de la que veníamos hablando)
        const rutasMencionadas = await resolverRutasContexto(msg);
        const entradasRuta = rutasMencionadas.length
            ? Object.entries(porRuta).filter(([r]) => rutasMencionadas.includes(r))
            : Object.entries(porRuta);

        if (!entradasRuta.length) {
            return "📍 No encontré esa ruta activa en este momento. ¿Te puedo ayudar con otra?";
        }

        const tituloPos = rutasMencionadas.length === 1
            ? `📍 **Posición en tiempo real — ${RUTA_INFO[rutasMencionadas[0]]?.label || rutasMencionadas[0]}:**\n\n`
            : "📍 **Posición en tiempo real:**\n\n";

        let respuesta = tituloPos;
        entradasRuta.forEach(([ruta, buses]) => {
            const info = RUTA_INFO[ruta] || { emoji: '⚫', label: ruta, icono: '🚌' };
            respuesta += `${info.emoji} **${info.label}**\n`;
            buses.forEach(b => {
                const vehiculo = ruta === 'Gualas Oriente' ? `Guala ${b.numero}` : `Bus ${b.numero}`;
                respuesta += `  ${info.icono} ${vehiculo} — cerca de **${b.paradaCercana}** (~${b.distanciaMetros} m · ${b.porcentajeRuta}% del recorrido)\n`;
            });
            respuesta += "\n";
        });

        respuesta += "¿Querés saber el tiempo estimado de llegada a alguna parada?";
        return respuesta;
    }

    /* ── 1.5 PRECIO + TIEMPO EN LA MISMA PREGUNTA ── */
    // Antes esPreguntaPrecio/esPreguntaTiempo no reconocian frases como
    // "¿cuándo sale el próximo?" o "rutas más económicas" (paráfrasis
    // comunes que la propia interfaz sugiere como chips rápidos).
    const esPreguntaPrecio = msg.includes("cuesta") || msg.includes("precio") || msg.includes("pasaje") ||
        msg.includes("valor") || msg.includes("tarifa") || msg.includes("cobr") || msg.includes("plata") ||
        msg.includes("económic") || msg.includes("economic") || msg.includes("barat") || msg.includes("efectivo");
    const esPreguntaTiempo = msg.includes("falta") || msg.includes("llega") || msg.includes("minutos") ||
        msg.includes("tiempo") || msg.includes("demora") || msg.includes("tarda") ||
        msg.includes("cuando llega") || msg.includes("cuándo llega") ||
        msg.includes("sale") || msg.includes("próximo") || msg.includes("proximo") ||
        msg.includes("próxima") || msg.includes("proxima") || msg.includes("viene");

    if (esPreguntaPrecio && esPreguntaTiempo) {
        const rutasMencionadas = await resolverRutasContexto(msg);
        const listaRutas = rutasMencionadas.length ? rutasMencionadas : Object.keys(RUTA_INFO);

        let respuesta = "💰 **Tarifas:**\n\n";
        listaRutas.forEach(r => {
            const t = RUTA_INFO[r];
            if (t && t.tarifa != null) respuesta += `${t.emoji} ${t.label} — **$${t.tarifa.toLocaleString('es-CO')}**\n`;
        });

        const pos = obtenerPosiciones();
        if (!pos) {
            respuesta += "\n⏱️ Para el tiempo exacto de llegada, abrí la vista **Mapa** y volvé a preguntarme.";
        } else {
            const porRuta = {};
            pos.forEach(b => { if (!porRuta[b.ruta]) porRuta[b.ruta] = []; porRuta[b.ruta].push(b); });
            const VEL_MS = 25 * 1000 / 3600;
            const entradas = Object.entries(porRuta).filter(([r]) => listaRutas.includes(r));

            if (entradas.length) {
                respuesta += "\n⏱️ **Tiempo estimado de llegada:**\n\n";
                entradas.forEach(([ruta, buses]) => {
                    const info = RUTA_INFO[ruta] || { emoji: '⚫', label: ruta };
                    const masProx = buses.reduce((min, b) => b.distanciaMetros < min.distanciaMetros ? b : min, buses[0]);
                    const minutos = Math.max(1, Math.round(masProx.distanciaMetros / VEL_MS / 60));
                    const vehiculo = ruta === 'Gualas Oriente' ? `Guala ${masProx.numero}` : `Bus ${masProx.numero}`;
                    respuesta += `${info.emoji} ${info.label} — próxima unidad **${vehiculo}** en **${minutos} min** (parada: ${masProx.paradaCercana})\n`;
                });
            }
        }

        respuesta += "\nEl pago es en efectivo al conductor. ¡Buen viaje!";
        return respuesta;
    }

    /* ── 2. TIEMPO DE LLEGADA ──
       Antes solo aceptaba "si"/"sí" EXACTOS como confirmación de seguimiento,
       así que "si, de la ruta 17" (respondiendo a "¿querés el tiempo
       estimado?") no entraba aquí y terminaba geocodificando literalmente
       "si, 17" como si fuera una dirección real. Ahora reutiliza la misma
       lista de palabras de continuación que ya usa resolverRutasContexto. */
    if (esPreguntaTiempo || esPalabraContinuacion(msg) ||
        msg.includes("claro") || msg.includes("por favor")) {

        const pos = obtenerPosiciones();
        if (!pos) return "⏱️ No puedo calcular tiempos porque el mapa no está activo. ¡Abrí la vista **Mapa** y volvé a preguntarme!";

        // Detectar ruta(s) específica(s) mencionada(s) (o retomar de la que veníamos hablando)
        const rutasMencionadas = await resolverRutasContexto(msg);

        const porRuta = {};
        pos.forEach(b => {
            if (!porRuta[b.ruta]) porRuta[b.ruta] = [];
            porRuta[b.ruta].push(b);
        });

        const VEL_MS = 25 * 1000 / 3600;
        const entradasRuta = rutasMencionadas.length
            ? Object.entries(porRuta).filter(([r]) => rutasMencionadas.includes(r))
            : Object.entries(porRuta);

        if (!entradasRuta.length) {
            return `⏱️ No encontré buses activos para esa ruta en este momento. ¿Te puedo ayudar con otra?`;
        }

        const titulo = rutasMencionadas.length === 1
            ? `⏱️ **Tiempo estimado — ${RUTA_INFO[rutasMencionadas[0]]?.label || rutasMencionadas[0]}:**\n\n`
            : "⏱️ **Tiempos estimados:**\n\n";

        let respuesta = titulo;
        entradasRuta.forEach(([ruta, buses]) => {
            const info = RUTA_INFO[ruta] || { emoji: '⚫', label: ruta, icono: '🚌' };
            if (rutasMencionadas.length !== 1) respuesta += `${info.emoji} **${info.label}**\n`;

            const masProx = buses.reduce((min, b) => b.distanciaMetros < min.distanciaMetros ? b : min, buses[0]);
            const minutos = Math.max(1, Math.round(masProx.distanciaMetros / VEL_MS / 60));
            const vehiculo = ruta === 'Gualas Oriente' ? `Guala ${masProx.numero}` : `Bus ${masProx.numero}`;
            respuesta += `  🚏 Próxima unidad: **${vehiculo}** en **${minutos} min** (parada: ${masProx.paradaCercana})\n\n`;
        });

        respuesta += "_(Estimado según velocidad actual. Puede variar por tráfico.)_";
        return respuesta;
    }

    /* ── 2b. SOLO RESPONDES DE BUSES / PREGUNTAS SOBRE EL ALCANCE ──
       Antes exigía ADEMÁS que el mensaje mencionara "bus"/"ruta"/etc., pero
       preguntas normales como "¿para qué sirves?" o "¿en qué me ayudas?"
       nunca mencionan eso (el tema ya está implícito, es un chat con un
       asistente de transporte), así que caían siempre al genérico. */
    if (msg.includes("solo respondes") || msg.includes("sólo respondes") ||
        msg.includes("solo hablas") || msg.includes("solo sabes") ||
        msg.includes("qué puedes") || msg.includes("que puedes") ||
        msg.includes("puedes responder") || msg.includes("puedes ayudar") ||
        msg.includes("puedes contestar") || msg.includes("respondes cualquier") ||
        msg.includes("para qué sirves") || msg.includes("para que sirves") ||
        msg.includes("qué haces") || msg.includes("que haces") ||
        msg.includes("me ayudas") || msg.includes("me puedes ayudar") ||
        msg.includes("me sirves")) {
        return "¡No solo eso! 😄 Me especializo en transporte de Cali — rutas, posición en tiempo real, tiempos de llegada y tarifas — pero también puedo charlar un poco. Lo que sí te aseguro es que de buses soy el más sabe. ¿Qué necesitás?";
    }

    /* ── 3. RUTA ESPECÍFICA POR NOMBRE (solo palabra clave — rápido, sin red) ── */
    const rutasEspecificas = detectarRutasMencionadas(msg);
    if (rutasEspecificas.length) {
        contextoRutaActiva = rutasEspecificas; // recordar para un "sí"/"dale" de seguimiento
        if (rutasEspecificas.length === 1) return RESPUESTA_POR_RUTA[rutasEspecificas[0]];
        return rutasEspecificas.map(r => RESPUESTA_POR_RUTA[r]).join("\n\n");
    }

    /* ── 3b. MÉTODO DE PAGO / DESCUENTOS ──
       "¿aceptan tarjeta?" o "¿hay descuento de estudiante?" no preguntan por
       EL VALOR de la tarifa (eso es el bloque de PRECIO) sino por CÓMO se
       paga — si cayeran al bloque de precio, contestarían con una lista de
       tarifas que no responde lo que en verdad se preguntó. */
    if (msg.includes("tarjeta") || msg.includes("nequi") || msg.includes("daviplata") ||
        msg.includes("transferencia") || msg.includes("descuento")) {
        if (msg.includes("descuento")) {
            return "🎓 Por ahora no manejamos tarifa diferencial ni descuentos especiales — la tarifa es la misma para todos según la ruta. ¡Ojalá pronto se pueda gestionar un descuento estudiantil! ¿Querés que te diga el valor de alguna ruta?";
        }
        return "💳 El pago en WayRoute es únicamente en **efectivo**, directo al conductor — todavía no aceptamos tarjeta, Nequi ni otros pagos electrónicos. Si podés, llevá el valor exacto de tu ruta. ¿Querés saber cuánto cuesta?";
    }

    /* ── 4. PRECIO ── */
    if (msg.includes("cuesta") || msg.includes("precio") || msg.includes("pasaje") ||
        msg.includes("valor") || msg.includes("tarifa") || msg.includes("cobr") || msg.includes("plata") ||
        msg.includes("económic") || msg.includes("economic") || msg.includes("barat") || msg.includes("efectivo")) {
        // Si menciona una ruta puntual o un lugar real (incluido "mi casa"),
        // responde solo con esa tarifa, no con las de las 5 rutas.
        const pideMasBarata = msg.includes("económic") || msg.includes("economic") || msg.includes("barat") || msg.includes("menos cuesta");
        const rutasPrecio = await resolverRutasContexto(msg);
        let claves = rutasPrecio.length ? rutasPrecio : Object.keys(RUTA_INFO);
        // "Rutas más económicas" pide ordenar de la más barata a la más cara,
        // no solo listar en el orden que estén definidas.
        if (pideMasBarata && !rutasPrecio.length) {
            claves = [...claves].sort((a, b) => (RUTA_INFO[a]?.tarifa ?? Infinity) - (RUTA_INFO[b]?.tarifa ?? Infinity));
        }
        const detalle = claves.map(clave => {
            const info = RUTA_INFO[clave] || { emoji: '⚫', label: clave, tarifa: null };
            const precio = info.tarifa != null ? `$${info.tarifa.toLocaleString('es-CO')}` : 'no disponible';
            return `${info.emoji} ${info.label} — **${precio}**`;
        }).join('\n');
        const intro = rutasPrecio.length === 1
            ? '¡A la orden! La tarifa de esa ruta es'
            : (pideMasBarata ? '¡A la orden! De más económica a más cara' : '¡A la orden! Las tarifas son');
        return `💰 ${intro}:\n\n${detalle}\n\nEl pago es en efectivo al conductor. ¡Buen viaje!`;
    }

    /* ── 5. CUÁNTAS RUTAS / QUÉ RUTAS HAY ── */
    if (msg.includes("rutas") || msg.includes("cuantas") || msg.includes("cuántas") ||
        msg.includes("qué tienen") || msg.includes("que tienen") || msg.includes("opciones")) {
        const listado = Object.values(RUTA_INFO).map(info => `${info.emoji} **${info.label}**`).join('\n');
        return `🗺️ WayRoute tiene **${Object.keys(RUTA_INFO).length} rutas activas** en Cali:\n\n${listado}\n\n¿Por cuál te puedo dar más info?`;
    }

    /* ── 5b. FRECUENCIA Y HORARIO DE SERVICIO ── */
    if (msg.includes("cada cuanto") || msg.includes("cada cuánto") || msg.includes("frecuencia") ||
        msg.includes("hasta que hora") || msg.includes("hasta qué hora")) {
        return "🕐 Las unidades de WayRoute circulan de forma continua, aproximadamente de **5:00 a.m. a 10:00 p.m.**, sin un horario fijo por parada. Para saber qué tan cerca está el próximo bus AHORA, preguntame *'¿cuánto falta para el bus?'* y te doy el tiempo real. ¿Te ayudo con algo más?";
    }

    /* ── 5c. MASCOTAS / PUNTUALIDAD ── */
    if (msg.includes("mascota") || msg.includes("perro") || msg.includes("gato")) {
        return "🐾 No tenemos una política oficial sobre mascotas todavía — te recomiendo confirmar directo con el conductor al subir, por lo general se permiten si van en brazos o en un transportín. ¿Te ayudo con algo más?";
    }
    if (msg.includes("puntual")) {
        return "🕐 Los tiempos que te doy son estimados según la posición real de cada unidad, pero pueden variar por tráfico o el trancón de siempre en Cali 😄. Te recomiendo revisar el tiempo estimado justo antes de salir de casa. ¿Querés que te diga cuánto falta para alguna ruta?";
    }

    /* ── 6. SEGURIDAD ── */
    if (msg.includes("segur") || msg.includes("noche") || msg.includes("peligro") ||
        msg.includes("roban") || msg.includes("robo") || msg.includes("atraco") ||
        msg.includes("asalto") || msg.includes("me robaron")) {
        return "🛡️ Tu seguridad es lo primero. Usá siempre el botón **'Compartir mi viaje'** en la app para que tus familiares sepan dónde vas. De noche preferí paradas iluminadas. Ante cualquier emergencia o robo, llamá al **123** y reportalo desde **Alertas** en la app. ¡Cuídate vé!";
    }

    /* ── 7. SALUDOS ── */
    if (msg.includes("hola") || msg.includes("buenos") || msg.includes("buenas") ||
        msg.includes("qué más") || msg.includes("que mas") || msg.includes("wayai")) {
        return `¡Hola vé! 👋 Soy **WayAI** de WayRoute. Tenemos **${Object.keys(RUTA_INFO).length} rutas activas** en Cali — buses y gualas. Puedo decirte dónde está cada unidad en tiempo real, los tiempos de llegada, paradas y tarifas. ¿En qué te ayudo?`;
    }

    /* ── 8. AGRADECIMIENTOS ── */
    if (msg.includes("gracias") || msg.includes("gracia") || msg.includes("agradezco") || msg.includes("bacano")) {
        return "¡Con mucho gusto! 😊 Para eso estamos. Cualquier cosa me avisás.";
    }

    /* ── 9. DESPEDIDAS ── */
    if (msg.includes("chao") || msg.includes("adiós") || msg.includes("adios") ||
        msg.includes("bye") || msg.includes("hasta luego") || msg.includes("nos vemos")) {
        return "¡Chao vé! 👋 Que tengas un viaje seguro. WayRoute siempre está disponible cuando lo necesités. ¡Buen viaje!";
    }

    /* ── 9b. LUGAR REAL DE CALI POR GEOCODIFICACIÓN (último recurso antes del fallback) ──
       Solo se intenta acá, al final, para no gastar una llamada de red en cada saludo
       o mensaje que ya fue resuelto por los patrones anteriores. */
    const rutasPorLugar = await resolverRutaPorGeocodificacion(msg);
    if (rutasPorLugar.length) {
        contextoRutaActiva = rutasPorLugar;
        if (rutasPorLugar.length === 1) return RESPUESTA_POR_RUTA[rutasPorLugar[0]];
        return rutasPorLugar.map(r => RESPUESTA_POR_RUTA[r]).join("\n\n");
    }

    /* ── 10. FALLBACK ── */
    const fallbacks = [
        `¡Aquí estoy! 🗺️ WayRoute tiene **${Object.keys(RUTA_INFO).length} rutas activas** en Cali. Podés preguntarme dónde están los buses, cuánto tarda en llegar, el precio o las paradas. ¿Qué necesitás?`,
        "Mmm, no entendí bien vé 😄. Podés preguntarme: *¿dónde están los buses?*, *¿cuánto cuesta la ruta norte?* o *¿cuánto falta para la próxima guala?*. ¿Qué querés saber?",
        "¡A la orden! Estoy aquí para ayudarte con el transporte en Cali. ¿Buscás info de alguna ruta en específico, el tiempo de llegada o las tarifas?",
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

// Helper: obtiene posiciones de todas las rutas si el mapa está activo
function obtenerPosiciones() {
    if (typeof window.WayRoute !== 'undefined' &&
        typeof window.WayRoute.obtenerPosicionBuses === 'function') {
        const pos = window.WayRoute.obtenerPosicionBuses();
        return (pos && pos.length > 0) ? pos : null;
    }
    return null;
}

// ─────────────────────────────────────────────
//  FUNCIONES DE INTERFAZ
// ─────────────────────────────────────────────
function agregarBurbuja(texto, tipo) {
    const container = document.getElementById("aiMessages");
    const idUnico = "msg-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const divMsj = document.createElement("div");
    divMsj.className = `msg msg-${tipo}`;
    divMsj.innerHTML = `
        <div class="msg-bubble" id="${idUnico}">${texto}</div>
        <div class="msg-meta">${tipo === 'user' ? 'Tú' : 'WayAI'} • ${hora}</div>
    `;

    container.appendChild(divMsj);
    container.scrollTop = container.scrollHeight;
    return idUnico;
}

function actualizarBurbuja(id, nuevoTexto) {
    const burbuja = document.getElementById(id);
    if (burbuja) burbuja.innerHTML = nuevoTexto;
}

function formatText(t) {
    return t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

/* Fija de antemano la ruta activa para el asistente (ej. la del turno de
   conductor que el pasajero está siguiendo en el mapa), para que preguntas
   como "cuánto cuesta" o "cuándo llega" respondan sobre esa ruta sin que el
   usuario tenga que nombrarla. No afecta si el usuario menciona otra ruta
   explícitamente: detectarRutasMencionadas() sigue teniendo prioridad. */
window.fijarContextoRutaIA = function (clave) {
    contextoRutaActiva = clave ? [clave] : [];
};