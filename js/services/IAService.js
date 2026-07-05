/**
 * ============================================================
 * ASISTENTE IA — WayRoute (Conexión Google Gemini)
 * Archivo: js/ia.js
 * ============================================================ */

const GEMINI_API_KEY = "AIzaSyBsDTkMjPITmFswoeOG75jYTM0Hx_Fexbw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

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

Pago en efectivo al conductor. Cada ruta tiene tarifa diferente según distancia.

## Seguridad
- Recomendá "Compartir ubicación" en la app al viajar solos o de noche.
- Emergencias: llamar al 123.

## Reglas de formato
- Respuestas cortas y naturales. Máximo 3 párrafos.
- No hagas listas largas ni texto técnico frío.
- Cerrá siempre con una pregunta o invitación, EXCEPTO en agradecimientos y despedidas.
`;

// ─────────────────────────────────────────────
//  NOMBRES Y EMOJIS POR RUTA
// ─────────────────────────────────────────────
const RUTA_INFO = {
    'Especial Sur': { emoji: '🔴', label: 'Ruta Especial Sur', icono: '🚌' },
    'Norte': { emoji: '🔵', label: 'Ruta Norte (Granada→Menga)', icono: '🚌' },
    'Gualas Oriente': { emoji: '🟢', label: 'Gualas Oriente', icono: '🚐' },
    'Sur — Pryca/U.Nariño': { emoji: '🟠', label: 'Ruta Sur (Pryca→U.Nariño)', icono: '🚌' },
};

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
        { role: "user", parts: [{ text: "Contexto del sistema: " + SYSTEM_PROMPT }] },
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

    /* ── 1. POSICIÓN EN TIEMPO REAL ── */
    if (msg.includes("donde") || msg.includes("dónde") || msg.includes("ubica") ||
        msg.includes("estan") || msg.includes("están") || msg.includes("posicion") ||
        msg.includes("posición") || msg.includes("transitan") || msg.includes("circulan") ||
        msg.includes("van los")) {

        const pos = obtenerPosiciones();
        if (!pos) return "🗺️ El mapa aún no está activo. Abrí la vista **Mapa** primero y WayAI podrá decirte exactamente dónde está cada unidad.";

        // Agrupar por ruta
        const porRuta = {};
        pos.forEach(b => {
            if (!porRuta[b.ruta]) porRuta[b.ruta] = [];
            porRuta[b.ruta].push(b);
        });

        let respuesta = "📍 **Posición en tiempo real — todas las rutas:**\n\n";
        Object.entries(porRuta).forEach(([ruta, buses]) => {
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

    /* ── 2. TIEMPO DE LLEGADA ── */
    if (msg.includes("falta") || msg.includes("llega") || msg.includes("minutos") ||
        msg.includes("tiempo") || msg.includes("cuánto falta") || msg.includes("cuanto falta") ||
        msg.includes("cuando llega") || msg.includes("cuándo llega") ||
        msg === "si" || msg === "sí" || msg.includes("claro") || msg.includes("por favor")) {

        const pos = obtenerPosiciones();
        if (!pos) return "⏱️ No puedo calcular tiempos porque el mapa no está activo. ¡Abrí la vista **Mapa** y volvé a preguntarme!";

        // Detectar ruta específica mencionada en el mensaje
        const filtroRuta = (() => {
            if (msg.includes("norte") || msg.includes("granada") || msg.includes("menga") || msg.includes("chipichape")) return "Norte";
            if (msg.includes("oriente") || msg.includes("guala") || msg.includes("aguablanca") || msg.includes("campero")) return "Gualas Oriente";
            if (msg.includes("pryca") || msg.includes("nariño") || msg.includes("antonio")) return "Sur — Pryca/U.Nariño";
            if (msg.includes("ermita") || msg.includes("especial") || msg.includes("sur")) return "Especial Sur";
            return null; // sin filtro → mostrar todas
        })();

        const porRuta = {};
        pos.forEach(b => {
            if (!porRuta[b.ruta]) porRuta[b.ruta] = [];
            porRuta[b.ruta].push(b);
        });

        const VEL_MS = 25 * 1000 / 3600;
        const entradasRuta = filtroRuta
            ? Object.entries(porRuta).filter(([r]) => r === filtroRuta)
            : Object.entries(porRuta);

        if (!entradasRuta.length) {
            return `⏱️ No encontré buses activos para esa ruta en este momento. ¿Te puedo ayudar con otra?`;
        }

        const titulo = filtroRuta
            ? `⏱️ **Tiempo estimado — ${RUTA_INFO[filtroRuta]?.label || filtroRuta}:**\n\n`
            : "⏱️ **Tiempos estimados — todas las rutas:**\n\n";

        let respuesta = titulo;
        entradasRuta.forEach(([ruta, buses]) => {
            const info = RUTA_INFO[ruta] || { emoji: '⚫', label: ruta, icono: '🚌' };
            if (!filtroRuta) respuesta += `${info.emoji} **${info.label}**\n`;

            const masProx = buses.reduce((min, b) => b.distanciaMetros < min.distanciaMetros ? b : min, buses[0]);
            const minutos = Math.max(1, Math.round(masProx.distanciaMetros / VEL_MS / 60));
            const vehiculo = ruta === 'Gualas Oriente' ? `Guala ${masProx.numero}` : `Bus ${masProx.numero}`;
            respuesta += `  🚏 Próxima unidad: **${vehiculo}** en **${minutos} min** (parada: ${masProx.paradaCercana})\n\n`;
        });

        respuesta += "_(Estimado según velocidad actual. Puede variar por tráfico.)_";
        return respuesta;
    }

    /* ── 2b. SOLO RESPONDES DE BUSES / PREGUNTAS SOBRE EL ALCANCE ── */
    if ((msg.includes("solo respondes") || msg.includes("sólo respondes") ||
         msg.includes("solo hablas") || msg.includes("solo sabes") ||
         msg.includes("qué puedes") || msg.includes("que puedes") ||
         msg.includes("para qué sirves") || msg.includes("para que sirves") ||
         msg.includes("qué haces") || msg.includes("que haces")) &&
        (msg.includes("bus") || msg.includes("ruta") || msg.includes("transport") || msg.includes("guala"))) {
        return "¡No solo eso! 😄 Me especializo en transporte de Cali — rutas, posición en tiempo real, tiempos de llegada y tarifas — pero también puedo charlar un poco. Lo que sí te aseguro es que de buses soy el más sabe. ¿Qué necesitás?";
    }

    /* ── 3. RUTA ESPECÍFICA POR NOMBRE ── */
    if (msg.includes("norte") || msg.includes("granada") || msg.includes("menga") || msg.includes("chipichape")) {
        return "🔵 ¡Mirá! La **Ruta Norte** opera con 3 buses azules. Sale desde **Granada (Calle 22N)**, pasa por Chipichape, Av. Circunvalar, **Menga** y llega hasta **Santa Mónica**. Tarifa: **$3.100**. ¿Querés saber dónde están los buses ahora?";
    }

    if (msg.includes("oriente") || msg.includes("aguablanca") || msg.includes("guala") || msg.includes("campero")) {
        return "🟢 ¡Las **Gualas del Oriente** están operando con 3 unidades! Recorren desde la **Carrera 22** hasta la **Calle 92**, pasando por Calle 53 y Calle 72W. Son camperos 4x4 ideales para el sector oriental. Tarifa: **$2.800**. ¿Te ayudo con algo más?";
    }

    if (msg.includes("pryca") || msg.includes("nariño") || msg.includes("antonio nariño") || msg.includes("sur")) {
        return "🟠 La **Ruta Sur** conecta **Pryca (Carrera 86)** con la **Universidad Antonio Nariño (Carrera 108)**, pasando por las carreras 94, 98B y 102. Opera con 3 buses naranjas. Tarifa: **$3.200**. ¿Querés saber el tiempo estimado de llegada?";
    }

    if (msg.includes("ermita") || msg.includes("especial sur") || msg.includes("ruta 1")) {
        return "🔴 La **Ruta Especial Sur** tiene 4 buses rojos operando. Sale de **La Ermita** y recorre 7 paradas por el centro-sur de Cali. Tarifa: **$2.950**. ¿Te digo dónde están los buses ahora mismo?";
    }

    /* ── 4. PRECIO ── */
    if (msg.includes("cuesta") || msg.includes("precio") || msg.includes("pasaje") ||
        msg.includes("valor") || msg.includes("tarifa") || msg.includes("cobr") || msg.includes("plata")) {
        return "💰 ¡A la orden! Las tarifas en WayRoute son:\n\n🔴 Ruta Especial Sur — **$2.950**\n🔵 Ruta Norte — **$3.100**\n🟢 Gualas Oriente — **$2.800**\n🟠 Ruta Sur (Pryca) — **$3.200**\n\nEl pago es en efectivo al conductor. ¡Buen viaje!";
    }

    /* ── 5. CUÁNTAS RUTAS / QUÉ RUTAS HAY ── */
    if (msg.includes("rutas") || msg.includes("cuantas") || msg.includes("cuántas") ||
        msg.includes("qué tienen") || msg.includes("que tienen") || msg.includes("opciones")) {
        return "🗺️ WayRoute tiene **4 rutas activas** en Cali:\n\n🔴 **Ruta Especial Sur** — La Ermita, centro-sur\n🔵 **Ruta Norte** — Granada, Chipichape, Menga\n🟢 **Gualas Oriente** — Carrera 22 hasta Calle 92\n🟠 **Ruta Sur** — Pryca hasta U. Antonio Nariño\n\n¿Por cuál te puedo dar más info?";
    }

    /* ── 6. SEGURIDAD ── */
    if (msg.includes("segur") || msg.includes("noche") || msg.includes("peligro")) {
        return "🛡️ Tu seguridad es lo primero. Usá siempre el botón **'Compartir mi viaje'** en la app para que tus familiares sepan dónde vas. De noche preferí paradas iluminadas. Ante cualquier emergencia, llamá al **123**. ¡Cuídate vé!";
    }

    /* ── 7. SALUDOS ── */
    if (msg.includes("hola") || msg.includes("buenos") || msg.includes("buenas") ||
        msg.includes("qué más") || msg.includes("que mas") || msg.includes("wayai")) {
        return "¡Hola vé! 👋 Soy **WayAI** de WayRoute. Tenemos **4 rutas activas** en Cali — buses y gualas. Puedo decirte dónde está cada unidad en tiempo real, los tiempos de llegada, paradas y tarifas. ¿En qué te ayudo?";
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

    /* ── 10. FALLBACK ── */
    const fallbacks = [
        "¡Aquí estoy! 🗺️ WayRoute tiene **4 rutas activas** en Cali. Podés preguntarme dónde están los buses, cuánto tarda en llegar, el precio o las paradas. ¿Qué necesitás?",
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