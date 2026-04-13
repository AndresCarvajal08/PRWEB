/**
 * ============================================================
 * ASISTENTE IA — WayRoute (Conexión Google Gemini)
 * Archivo: js/ia.js
 * ============================================================ */

const GEMINI_API_KEY = "AIzaSyBsDTkMjPITmFswoeOG75jYTM0Hx_Fexbw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

let chatHistory = [];

const SYSTEM_PROMPT = `
Eres WayAI, el asistente virtual inteligente de WayRoute, una app de transporte público (buses y gualas) de Cali, Colombia.

## Personalidad y tono
- Eres cálido, servicial y con toque caleño: usa "¡Mirá!", "¡A la orden!", "¡Con gusto!", "¡Bacano!", "¡Listo pues!"
- Cuando alguien te saluda (hola, buenos días, qué más, etc.), responde el saludo con energía antes de ofrecer ayuda.
- Cuando alguien te agradece (gracias, muchas gracias, etc.), responde con calidez genuina.
- Cuando alguien se despide (chao, hasta luego, bye), despídete amablemente y deséale buen viaje.
- Usa emojis con moderación pero de forma expresiva: 🚌 🚐 🗺️ 📍 💰 🌙 ✅ 😊

## Quién eres
- Eres parte de WayRoute, una aplicación diseñada para facilitar la movilidad en Cali.
- Tu misión es ayudar a los pasajeros a moverse por la ciudad de forma segura, económica y eficiente.
- No eres un bot genérico: conoces Cali, sus barrios, su gente y su transporte.

## Rutas activas en WayRoute
WayRoute opera CUATRO rutas simultáneas, cada una independiente:

🔴 **Ruta Especial Sur** — 4 buses rojos
- Circuito: La Ermita → Parada 2 → Parada 3 → Parada 4 → Parada 5 → Parada 6 → Parada 7 → La Ermita
- Zona: Centro-sur de Cali

🔵 **Ruta Norte** — 3 buses azules
- Circuito: Granada (Calle 22N) → Av. Circunvalar → Menga → Menga Norte → Santa Mónica → regreso
- Zona: Norte de Cali (Granada, Chipichape, Menga)

🟢 **Gualas Oriente** — 3 gualas verdes (camperos)
- Circuito: Carrera 22 → Calle 53 → Calle 72W → Calle 92 → regreso
- Zona: Oriente de Cali (Aguablanca y sectores orientales)
- Las gualas son camperos 4x4 ideales para zonas de ladera y oriente

🟠 **Ruta Sur — Pryca / U. Antonio Nariño** — 3 buses naranjas
- Circuito: Pryca (Carrera 86) → Carrera 94 → Carrera 98B → Carrera 102 → U. Antonio Nariño (Carrera 108) → regreso
- Zona: Sur de Cali

## Tarifas
- Tarifa unificada: $3.500 pesos colombianos para todas las rutas (buses y gualas).
- Pago en efectivo al conductor.

## Seguridad y consejos
- Siempre recomienda usar el botón "Compartir mi viaje" de la app cuando viajen solos o de noche.
- De noche: preferir paradas iluminadas y esperar el bus acompañado si es posible.
- Emergencias: llamar al 123 (emergencias Cali).

## Cómo responder según el tipo de mensaje
- Saludos → responde el saludo + pregunta en qué puedes ayudar.
- Despedidas → despídete y deséale buen viaje.
- Preguntas de ruta → menciona la ruta relevante, sus paradas y tarifa.
- Preguntas de posición → indica que el mapa en tiempo real muestra todas las rutas.
- Preguntas fuera del tema → redirige amablemente: "Eso está por fuera de mi ruta 😄, pero cuéntame en qué te ayudo con el transporte en Cali."
- Si no sabes algo → sé honesto.

## Respuestas a agradecimientos — MUY IMPORTANTE
Cuando alguien diga "gracias", "muchas gracias", "te lo agradezco" o similar:
- NUNCA aproveches para mencionar rutas, buses ni funciones de la app.
- Responde SOLO con calidez humana, breve y natural.
- Ejemplos correctos: "¡Con mucho gusto! 😊 Para eso estamos." / "¡A la orden! Cualquier cosa me avisás."

## Formato de respuestas
- Máximo 3-4 párrafos cortos.
- Nunca uses listas largas ni texto técnico frío.
- Habla como una persona real, no como un manual.
- Siempre cierra con una pregunta o invitación a seguir ayudando, EXCEPTO en agradecimientos o despedidas.
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
        actualizarBurbuja(loadingId, formatText(fallbackRes + "\n\n*(Modo local activo — satélite con interferencia)*"));
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

    /* ── 1. POSICIÓN EN TIEMPO REAL ── */
    if (msg.includes("donde") || msg.includes("dónde") || msg.includes("ubica") ||
        msg.includes("estan") || msg.includes("están") || msg.includes("posicion") ||
        msg.includes("posición") || msg.includes("transitan") || msg.includes("circulan") ||
        msg.includes("van los") || msg.includes("buses") || msg.includes("gualas")) {

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

        // Calcular tiempo estimado por ruta y parada
        const porRuta = {};
        pos.forEach(b => {
            if (!porRuta[b.ruta]) porRuta[b.ruta] = [];
            porRuta[b.ruta].push(b);
        });

        const VEL_MS = 25 * 1000 / 3600; // 25 km/h en m/s
        let respuesta = "⏱️ **Tiempos estimados — todas las rutas:**\n\n";

        Object.entries(porRuta).forEach(([ruta, buses]) => {
            const info = RUTA_INFO[ruta] || { emoji: '⚫', label: ruta, icono: '🚌' };
            respuesta += `${info.emoji} **${info.label}**\n`;

            // Bus más cercano por ruta
            const masProx = buses.reduce((min, b) => b.distanciaMetros < min.distanciaMetros ? b : min, buses[0]);
            const minutos = Math.max(1, Math.round(masProx.distanciaMetros / VEL_MS / 60));
            const vehiculo = ruta === 'Gualas Oriente' ? `Guala ${masProx.numero}` : `Bus ${masProx.numero}`;
            respuesta += `  🚏 Próxima unidad: **${vehiculo}** en **${minutos} min** (parada: ${masProx.paradaCercana})\n\n`;
        });

        respuesta += "_(Estimado según velocidad actual. Puede variar por tráfico.)_";
        return respuesta;
    }

    /* ── 3. RUTA ESPECÍFICA POR NOMBRE ── */
    if (msg.includes("norte") || msg.includes("granada") || msg.includes("menga") || msg.includes("chipichape")) {
        return "🔵 ¡Mirá! La **Ruta Norte** opera con 3 buses azules. Sale desde **Granada (Calle 22N)**, pasa por Chipichape, Av. Circunvalar, **Menga** y llega hasta **Santa Mónica**. Tarifa: **$3.500**. ¿Querés saber dónde están los buses ahora?";
    }

    if (msg.includes("oriente") || msg.includes("aguablanca") || msg.includes("guala") || msg.includes("campero")) {
        return "🟢 ¡Las **Gualas del Oriente** están operando con 3 unidades! Recorren desde la **Carrera 22** hasta la **Calle 92**, pasando por Calle 53 y Calle 72W. Son camperos 4x4 ideales para el sector oriental. Tarifa: **$3.500**. ¿Te ayudo con algo más?";
    }

    if (msg.includes("pryca") || msg.includes("nariño") || msg.includes("antonio nariño") || msg.includes("sur")) {
        return "🟠 La **Ruta Sur** conecta **Pryca (Carrera 86)** con la **Universidad Antonio Nariño (Carrera 108)**, pasando por las carreras 94, 98B y 102. Opera con 3 buses naranjas. Tarifa: **$3.500**. ¿Querés saber el tiempo estimado de llegada?";
    }

    if (msg.includes("ermita") || msg.includes("especial sur") || msg.includes("ruta 1")) {
        return "🔴 La **Ruta Especial Sur** tiene 4 buses rojos operando. Sale de **La Ermita** y recorre 7 paradas por el centro-sur de Cali. Tarifa: **$3.500**. ¿Te digo dónde están los buses ahora mismo?";
    }

    /* ── 4. PRECIO ── */
    if (msg.includes("cuesta") || msg.includes("precio") || msg.includes("pasaje") ||
        msg.includes("valor") || msg.includes("tarifa") || msg.includes("cobr") || msg.includes("plata")) {
        return "💰 ¡A la orden! En WayRoute la tarifa es **$3.500 pesos** para todas las rutas — buses y gualas por igual. El pago es en efectivo al conductor. ¡Buen viaje!";
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
    return "¡Aquí estoy! 🗺️ WayRoute tiene **4 rutas activas** en Cali. Podés preguntarme dónde están los buses, cuánto tarda en llegar, el precio o las paradas de cualquier ruta. ¿Qué necesitás?";
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