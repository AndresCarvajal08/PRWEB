/**
 * ============================================================
 * ASISTENTE IA — MoviCali (Conexión Google Gemini)
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
Eres MobiIA, el asistente virtual inteligente de MoviCali, una aplicación para el sistema de transporte público (buses y gualas) de Cali, Colombia.
Tu tono es muy servicial, amigable, claro y ligeramente 'caleño' (puedes usar palabras amables típicas de la región como "¡Mirá!", "¡A la orden!", "¡Con gusto!").

Conocimiento específico del proyecto:
- Actualmente contamos con la "Ruta Especial Sur" activa.
- Paradas principales de la Ruta Especial Sur: La Ermita (Inicio/Cierre), Parada 2, Parada 3 (Cerca a Calle 5), Parada 4, Parada 5, Parada 6 y Parada 7.
- Hay 4 buses operando en tiempo real en este circuito.
- Tarifa unificada: $3.500 pesos (tanto para buses urbanos como para Gualas/Camperos).
- Las Gualas (como la G-07 o G-12) suben a la ladera occidente (Siloe, Terrón Colorado).
- Seguridad: Recomienda usar el botón 'Compartir mi viaje' de la app y preferir rutas iluminadas de noche.

Instrucciones:
1. Responde SIEMPRE basándote en que eres parte de MoviCali.
2. Si preguntan por rutas, prioriza mencionar la "Ruta Especial Sur" y las Gualas.
3. Mantén tus respuestas precisas y cortas (máximo 3-4 párrafos). Usa Emojis.
4. Si alguien te pregunta algo ajeno a movilidad en Cali o el proyecto MoviCali, redirige la conversación amablemente a temas de transporte local.
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
    const loadingId = agregarBurbuja("MobiIA está pensando... 🤔", "bot");

    // 3. Preparar el historial de mensajes para Gemini
    // Formato requerido por Gemini (role: 'user' o 'model')
    const historyForGemini = [
        { role: "user", parts: [{ text: "Contexto del sistema: " + SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "¡Entendido! Soy MobiIA de MoviCali. ¿En qué puedo ayudarte a moverte por Cali hoy?" }] }
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
    const idUnico = "msg-" + Date.now();
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const divMsj = document.createElement("div");
    divMsj.className = `msg msg-${tipo}`;
    divMsj.innerHTML = `
        <div class="msg-bubble" id="${idUnico}">${texto}</div>
        <div class="msg-meta">${tipo === 'user' ? 'Tú' : 'MobiIA'} • ${hora}</div>
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

    // 1. Detección de la Ruta Especial Sur
    if (msg.includes("ruta") || msg.includes("sur") || msg.includes("ermita")) {
        return "¡Mirá! 🚌 Actualmente la **Ruta Especial Sur** está operando con 4 buses. Pasa por **La Ermita** y tiene 7 paradas en total. ¿Te gustaría saber cuánto falta para que pase el próximo bus?";
    }

    // 2. Detección de precios y costos
    if (msg.includes("cuesta") || msg.includes("precio") || msg.includes("pasaje") || msg.includes("valor") || msg.includes("cuanto")) {
        return "¡A la orden! 💸 El pasaje en MoviCali (buses y gualas) cuesta **$3.500 pesos**. El pago se hace en efectivo directamente al conductor. ¡Buen viaje!";
    }

    // 3. Detección de seguridad / noche
    if (msg.includes("segur") || msg.includes("noche") || msg.includes("peligro")) {
        return "🛡️ **Seguridad MoviCali:**\nTe recomiendo usar siempre el botón **'Compartir mi viaje'** dentro de la app para que tus familiares sepan dónde vas. Además, la **Ruta Especial Sur** transita por zonas bien iluminadas. ¡Cuídate vé!";
    }

    // 4. Saludos y genéricos
    if (msg.includes("hola") || msg.includes("mobiia") || msg.includes("buenos") || msg.includes("buenas")) {
        return "¡Hola vé! 👋 Soy **MobiIA**, tu asistente de MoviCali. ¿Buscás la **Ruta Especial Sur** o necesitás llegar a la ladera en una **Guala**?";
    }

    // 5. Fallback por defecto
    return "¡Entendido! 🗺️ Recordá que en MoviCali tenemos la **Ruta Especial Sur** activa ahora mismo. Si necesitás ayuda con los horarios o alguna parada específica como **La Ermita**, aquí estoy para servirte.";
}
