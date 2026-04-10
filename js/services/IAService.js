/**
 * ============================================================
 * ASISTENTE IA — WayRoute (Conexión Google Gemini)
 * Archivo: js/ia.js
 * ============================================================
 */

// ⚠️ AQUÍ DEBES PEGAR TU API KEY DE GOOGLE AI STUDIO ⚠️
// Obténla gratis en: https://aistudio.google.com/app/apikey
const GEMINI_API_KEY = "AIzaSyBsDTkMjPITmFswoeOG75jYTM0Hx_Fexbw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Historial del chat para que Gemini tenga memoria
let chatHistory = [];

// Instrucciones maestras de la IA (Personalidad y conocimiento)
const SYSTEM_PROMPT = `
Eres WayAI, el asistente virtual inteligente de WayRoute, una app de transporte público (buses y gualas) de Cali, Colombia.

## Personalidad y tono
- Eres cálido, servicial y con toque caleño: usa "¡Mirá!", "¡A la orden!", "¡Con gusto!", "¡Bacano!", "¡Listo pues!"
- Cuando alguien te saluda (hola, buenos días, qué más, etc.), responde el saludo con energía antes de ofrecer ayuda.
- Cuando alguien te agradece (gracias, muchas gracias, etc.), responde con calidez genuina (ej: "¡Con mucho gusto! Para eso estamos 😊").
- Cuando alguien se despide (chao, hasta luego, bye), despídete amablemente y deséale buen viaje.
- Usa emojis con moderación pero de forma expresiva: 🚌 🗺️ 📍 💰 🌙 ✅ 😊

## Quién eres
- Eres parte de WayRoute, una aplicación diseñada para facilitar la movilidad en Cali.
- Tu misión es ayudar a los pasajeros a moverse por la ciudad de forma segura, económica y eficiente.
- No eres un bot genérico: conoces Cali, sus barrios, su gente y su transporte.

## Conocimiento de rutas y operación
- Ruta activa: "Ruta Especial Sur" — circuito completo con 4 buses operando en tiempo real.
- Paradas de la Ruta Especial Sur: La Ermita (inicio/cierre) → Parada 2 → Parada 3 (cerca Calle 5) → Parada 4 → Parada 5 → Parada 6 → Parada 7 → regresa a La Ermita.
- Gualas/Camperos: unidades G-07 y G-12 que suben a la ladera occidente (Siloé, Terrón Colorado, Alto Nápoles). Son la única opción para esos sectores de ladera.
- Tarifa unificada: $3.500 pesos colombianos, tanto para buses urbanos como para Gualas.
- Frecuencia aproximada: un bus cada 15-20 minutos en la Ruta Especial Sur.
- El mapa en tiempo real de la app muestra la posición exacta de los 4 buses activos.

## Seguridad y consejos
- Siempre recomienda usar el botón "Compartir mi viaje" de la app cuando viajen solos o de noche.
- De noche: preferir paradas iluminadas y esperar el bus acompañado si es posible.
- Si alguien reporta una emergencia o peligro, indícale que llame al 123 (emergencias Cali) y que use el botón de compartir viaje.

## Cómo responder según el tipo de mensaje
- Saludos → responde el saludo + pregunta en qué puedes ayudar con el transporte.
- Despedidas → despídete, deséale buen viaje y recuérdale que WayRoute siempre está disponible.
- Preguntas de ruta → da la información clara, menciona paradas relevantes y tarifa.
- Preguntas de horario → menciona la frecuencia aproximada y que el mapa en tiempo real es la mejor forma de ver dónde está el bus.
- Preguntas fuera del tema de transporte en Cali → redirige amablemente: "Eso está por fuera de mi ruta 😄, pero cuéntame en qué te ayudo con el transporte en Cali."
- Si no sabes algo → sé honesto: "Esa info no la tengo ahorita, pero puedes consultar directamente en la app o escribirnos."

## Respuestas a agradecimientos — MUY IMPORTANTE
Cuando alguien diga "gracias", "muchas gracias", "te lo agradezco" o similar:
- NUNCA aproveches para mencionar rutas, buses ni funciones de la app.
- Responde SOLO con calidez humana, breve y natural.
- Ejemplos de respuestas correctas:
  * "¡Con mucho gusto! 😊 Para eso estamos."
  * "¡A la orden! Cualquier cosa me avisás."
  * "¡Bacano! No hay de qué. Cuando necesités algo, acá estoy."
- Ejemplos de respuestas INCORRECTAS (nunca hagas esto):
  * Mencionar la Ruta Especial Sur después de un gracias.
  * Ofrecer información de buses cuando solo te están agradeciendo.
  * Usar el agradecimiento como excusa para dar más información no pedida.

## Formato de respuestas
- Máximo 3-4 párrafos cortos.
- Nunca uses listas largas ni texto técnico frío.
- Habla como una persona real, no como un manual.
- Siempre cierra con una pregunta o invitación a seguir ayudando, EXCEPTO cuando respondas a un agradecimiento o despedida.
`;

// Función principal que lee el cuadro de texto y envía el mensaje
async function sendAI() {
    const inputEl = document.getElementById("aiInput");
    const msg = inputEl.value.trim();
    if (!msg) return;

    // 1. Mostrar mensaje del usuario
    agregarBurbuja(msg, "user");
    inputEl.value = "";

    // 2. Burbuja de carga
    const loadingId = agregarBurbuja("WayAI está pensando... 🤔", "bot");

    // 3. Preparar el historial de mensajes para Gemini
    // Formato requerido por Gemini (role: 'user' o 'model')
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

    // Agregar mensaje actual
    historyForGemini.push({ role: "user", parts: [{ text: msg }] });

    try {
        // Enviar a la API de Gemini
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

        // 5. Mostrar la respuesta real
        actualizarBurbuja(loadingId, formatText(respuestaBot));
        chatHistory.push({ role: "user", text: msg });
        chatHistory.push({ role: "bot", text: respuestaBot });

        const container = document.getElementById("aiMessages");
        container.scrollTop = container.scrollHeight;

    } catch (e) {
        console.error("Error Gemini:", e);
        // FALLBACK: Si falla la API, usamos el motor local simulado
        const fallbackRes = await simulateAIResponse(msg);
        actualizarBurbuja(loadingId, formatText(fallbackRes + "\n\n*(Nota: Estoy en modo local porque el satélite está fallando un poco)*"));
        chatHistory.push({ role: "user", text: msg });
        chatHistory.push({ role: "bot", text: fallbackRes });
    }
}

// Función auxiliar para botones de sugerencia rápida
window.sendAISuggestion = function (el) {
    const text = el.innerText;
    document.getElementById("aiInput").value = text;
    sendAI();
}

// ======================
// FUNCIONES DE INTERFAZ
// ======================

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
    if (burbuja) {
        burbuja.innerHTML = nuevoTexto;
    }
}

// Formatea negritas simples a HTML para que el chat se vea bonito
function formatText(t) {
    return t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

// ──────────────────────────────────────────────
// CEREBRO DEL ASISTENTE (MOTOR LOCAL)
// ──────────────────────────────────────────────
async function simulateAIResponse(mensaje) {
    // Simulamos que el bot está pensando (1.2 segundos)
    await new Promise(resolve => setTimeout(resolve, 1200));

    const msg = mensaje.toLowerCase();

    // 0. 🚌 POSICIÓN EN TIEMPO REAL DE LOS BUSES (prioridad máxima)
    if (msg.includes("donde") || msg.includes("dónde") || msg.includes("ubica") ||
        msg.includes("estan") || msg.includes("están") || msg.includes("posicion") ||
        msg.includes("posición") || msg.includes("transitan") || msg.includes("circulan") ||
        msg.includes("van los") || msg.includes("buses") || msg.includes("bus ")) {

        const posiciones = (typeof window.WayRoute !== 'undefined' && typeof window.WayRoute.obtenerPosicionBuses === 'function')
            ? window.WayRoute.obtenerPosicionBuses()
            : null;

        if (posiciones && posiciones.length > 0) {
            const emojis = ['🔴', '🟠', '🟡', '🟢'];
            const lineas = posiciones.map((b, i) =>
                `${emojis[i]} **Bus ${b.numero}** — cerca de **${b.paradaCercana}** (a ~${b.distanciaMetros} m · ${b.porcentajeRuta}% del recorrido)`
            ).join('\n');
            return `📍 **Posición en tiempo real — Ruta Especial Sur:**\n\n${lineas}\n\n¿Querés saber cuánto tiempo falta para que alguno llegue a tu parada?`;
        } else {
            return "🗺️ El mapa aún no está activo. Abrí la vista **Mapa** primero y WayAI podrá decirte exactamente dónde están los buses en este momento. ¡Solo toca el ícono del mapa!";
        }
    }

    // 0b. ⏱️ TIEMPO DE LLEGADA A CADA PARADA
    if (msg.includes("falta") || msg.includes("llega") || msg.includes("tiempo") ||
        msg.includes("minutos") || msg.includes("cuánto falta") || msg.includes("cuanto falta") ||
        msg.includes("cuando llega") || msg.includes("cuándo llega") ||
        msg === "si" || msg === "sí" || msg === "sí!" || msg === "si!" || msg.includes("claro") || msg.includes("sí, por favor") || msg.includes("si, por favor")) {

        const tiempos = (typeof window.WayRoute !== 'undefined' && typeof window.WayRoute.tiempoLlegadaProximo === 'function')
            ? window.WayRoute.tiempoLlegadaProximo()
            : null;

        if (tiempos && tiempos.length > 0) {
            const lineas = tiempos.map(t =>
                `🚏 **${t.parada}** — Bus ${t.busProximo} llega en aprox. **${t.minutos} min**`
            ).join('\n');
            return `⏱️ **Tiempos estimados de llegada — Ruta Especial Sur:**\n\n${lineas}\n\n_(Estimado a velocidad de circulación actual. Puede variar por tráfico.)_`;
        } else {
            return "⏱️ No puedo calcular los tiempos justo ahora porque el mapa no está activo. ¡Abrí la vista **Mapa** y volvé a preguntarme!";
        }
    }

    // 1. Detección de la Ruta Especial Sur
    if (msg.includes("ruta") || msg.includes("sur") || msg.includes("ermita")) {
        return "¡Mirá! 🚌 Actualmente la **Ruta Especial Sur** está operando con 4 buses. Pasa por **La Ermita** y tiene 7 paradas en total. ¿Te gustaría saber cuánto falta para que pase el próximo bus?";
    }

    // 2. Detección de precios y costos
    if (msg.includes("cuesta") || msg.includes("precio") || msg.includes("pasaje") ||
        msg.includes("valor") || msg.includes("cuanto cuesta") || msg.includes("cuánto cuesta") ||
        msg.includes("cuanto vale") || msg.includes("cuánto vale") ||
        msg.includes("tarifa") || msg.includes("plata") || msg.includes("cobran") || msg.includes("cobr")) {
        return "¡A la orden! 💸 El pasaje en WayRoute (buses y gualas) cuesta **$3.500 pesos**. El pago se hace en efectivo directamente al conductor. ¡Buen viaje!";
    }

    // 3. Detección de seguridad / noche
    if (msg.includes("segur") || msg.includes("noche") || msg.includes("peligro")) {
        return "🛡️ **Seguridad WayRoute:**\nTe recomiendo usar siempre el botón **'Compartir mi viaje'** dentro de la app para que tus familiares sepan dónde vas. Además, la **Ruta Especial Sur** transita por zonas bien iluminadas. ¡Cuídate vé!";
    }

    // 4. Saludos y genéricos
    if (msg.includes("hola") || msg.includes("wayai") || msg.includes("buenos") || msg.includes("buenas")) {
        return "¡Hola vé! 👋 Soy **WayAI**, tu asistente de WayRoute. Puedo decirte **dónde están los buses ahora mismo**, el precio del pasaje, las paradas y más. ¿En qué te ayudo?";
    }

    // 5. Fallback por defecto
    return "¡Entendido! 🗺️ Recordá que en WayRoute tenemos la **Ruta Especial Sur** activa ahora mismo. Preguntame **¿dónde están los buses?** y te digo su posición exacta en tiempo real. ¡Aquí estoy para servirte!";
}
