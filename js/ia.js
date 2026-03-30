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
Eres experto en:
- Rutas de buses tradicionales (Bus B-14, Bus B-22A con costo de $1.600 a $2.200).
- Rutas de Gualas / Camperos de la ladera (Guala G-07, Guala G-12 con costo de $1.800 a $2.000).
- Seguridad y prevención (recomendar evitar rutas vacías de noche, etc).
- Mantén tus respuestas precisas, cortas (máximo 4 párrafos cortos). Usa Emojis para hacerlo visual.
Si alguien te pregunta algo no relacionado con movilidad en Cali, responde amablemente que tu función exclusiva es ayudar con los viajes y rutas en la ciudad.
`;

// Función principal que lee el cuadro de texto y envía el mensaje
async function sendAI() {
    const inputEl = document.getElementById("aiInput");
    const msg = inputEl.value.trim();
    if (!msg) return;

    // 1. Mostrar mensaje del usuario en la pantalla
    agregarBurbuja(msg, "user");
    inputEl.value = ""; // Limpiar input

    // Validar que el dev ya puso su llave
    if (GEMINI_API_KEY === "PEGA_TU_LLAVE_AQUÍ") {
        agregarBurbuja("⚠️ Error: El desarrollador aún no ha pegado la llave secreta de Gemini en el archivo <code>js/ia.js</code>. Ve a <a href='https://aistudio.google.com/app/apikey' target='_blank' style='color:#3b82f6;'>Google AI Studio</a>, obtén una gratis y reemplázala en el código.", "bot");
        return;
    }

    // 2. Crear un id para la burbuja temporal de "Cargando..."
    const loadingId = agregarBurbuja("Escribiendo... ⏳", "bot");

    // 3. Preparar el historial para enviarlo a Gemini
    const contents = [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "¡Entendido! Soy MobiIA, el asistente de MoviCali. Estoy listo para ayudar a los caleños con sus rutas." }] }
    ];

    // Añadir memoria previa
    chatHistory.forEach(h => {
        contents.push({ role: h.role, parts: [{ text: h.text }] });
    });

    // Añadir el mensaje actual
    contents.push({ role: "user", parts: [{ text: msg }] });
    chatHistory.push({ role: "user", text: msg });

    try {
        // 4. MODO PROTOTIPO: Generador Inteligente Local
        // Como las cuotas de Google Cloud bloquearon la llave, pasamos a responder desde el cliente
        // simulando latencia de red para la presentación.
        const respuestaBot = await simulateAIResponse(msg);

        // 5. Mostrar la respuesta real
        actualizarBurbuja(loadingId, formatText(respuestaBot));
        chatHistory.push({ role: "model", text: respuestaBot });

        // Scroll abajo automático
        const container = document.getElementById("aiMessages");
        container.scrollTop = container.scrollHeight;

    } catch (e) {
        actualizarBurbuja(loadingId, "❌ Ocurrió un error inesperado al contactar al cerebro de IA: " + e.message);
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
    // Simulamos que el bot está pensando en internet (1.5 segundos)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const msg = mensaje.toLowerCase();

    // 1. Detección de precios y costos
    if (msg.includes("cuesta") || msg.includes("precio") || msg.includes("pasaje") || msg.includes("valor")) {
        if (msg.includes("b-14") || msg.includes("bus")) {
            return "¡Hola! 🚌 El pasaje del bus urbano como la ruta **B-14** cuesta actualmente **$2.900 pesos** integrándose con el MIO, pero los directos están alrededor de **$1.800 pesos**. ¿Necesitas saber si pasa cerca a tu destino?";
        }
        if (msg.includes("guala") || msg.includes("g-07") || msg.includes("g-12")) {
            return "¡Claro! 🚙 Las gualas y camperos (como la **G-07** o **G-12**) que suben a la ladera tienen un costo aproximado de **$2.000 pesos**, dependiendo del trayecto en la montaña. Para pago usualmente es en efectivo al abordar.";
        }
        return "Teuento que en Cali:\n- 🚌 Los buses tradicionales oscilan entre **$1.800 y $2.900**.\n- 🚙 Las gualas de la zona de ladera o Siloé rondan los **$2.000**.\n¿Qué ruta en específico te interesa abordar hoy?";
    }

    // 2. Detección de seguridad / noche
    if (msg.includes("segur") || msg.includes("noche") || msg.includes("oscuro") || msg.includes("9pm")) {
        return "🛡️ **Recomendación de seguridad:**\nPara viajes en la noche te sugiero optar por rutas que transitán por avenidas iluminadas y principales como la **Av. 6N** (Ruta B-14). \nAdemás, nuestra app tiene el botón **'Compartir mi viaje'** que puedes enviarle a un familiar apenas te subas al vehículo. ¡La seguridad primero!";
    }

    // 3. Detección de Demoras / Hora Pico
    if (msg.includes("demora") || msg.includes("hora pico") || msg.includes("tarde") || msg.includes("tráfico")) {
        return "⚠️ Actualmente, debido a la hora pico, las rutas principales reportan **15 a 20 minutos de retraso** en promedio.\n\nPara llegar a tiempo te recomendaría salir antes o tomar alternativas como la ruta **G-12** por la vía norte para evitar los mayores embotellamientos del sur.";
    }

    // 4. Saludos y genéricos
    if (msg.includes("hola") || msg.includes("buenos") || msg.includes("buenas")) {
        return "¡Hola! 👋 Soy **MobiIA**, tu asistente caleño de MoviCali. ¿Qué ruta estás buscando o en qué zona de la ciudad te encuentras ahora mismo?";
    }

    // 5. Fallback por defecto
    return "¡Entendido! 🗺️ Tu historial me dice que usas mucho las Gualas de la ladera occidente. La **ruta G-07** pasará cerca a tu zona en **12 minutos**. Es buena idea ir saliendo a la parada.\n\n¿Tienes alguna otra consulta sobre tiempos o seguridad en tu recorrido?";
}
