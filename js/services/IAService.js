/**
 * ============================================================
 * ASISTENTE IA — WayRoute (Gemini 2.0 Flash)
 * ============================================================ */

const GEMINI_API_KEY = "AIzaSyBsDTkMjPITmFswoeOG75jYTM0Hx_Fexbw";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

let chatHistory = [];
let ultimaPreguntaBot = ""; // contexto de la última pregunta hecha por el bot

// ─────────────────────────────────────────────
//  DATOS DE RUTAS
// ─────────────────────────────────────────────
const RUTAS_DATA = {
    'Especial Sur': {
        emoji: '🔴', color: 'roja', vehiculo: 'buses', cantidad: 4,
        inicio: 'La Ermita', fin: 'El Calvario',
        paradas: ['La Ermita — Terminal Norte', 'San Nicolás — Calle 15', 'Libertadores — Calle 25', 'Alfonso López — Calle 32', 'El Calvario — Terminal Sur'],
        zona: 'Centro-sur de Cali'
    },
    'Norte — Granada/Menga': {
        emoji: '🔵', color: 'azul', vehiculo: 'buses', cantidad: 3,
        inicio: 'Granada', fin: 'Santa Mónica',
        paradas: ['Granada — Calle 22N', 'Chipichape — Av. 6N', 'Menga — Calle 52N', 'Santa Mónica — Terminal'],
        zona: 'Norte de Cali (Granada, Chipichape, Menga, Santa Mónica)'
    },
    'Gualas Oriente': {
        emoji: '🟢', color: 'verde', vehiculo: 'gualas', cantidad: 3,
        inicio: 'Carrera 22 — Aguablanca Norte', fin: 'Calle 92 — Terminal Oriente',
        paradas: ['Carrera 22 — Aguablanca Norte', 'Calle 72W — Oriente Centro', 'Calle 92 — Terminal Oriente'],
        zona: 'Oriente de Cali (Aguablanca, sectores orientales)'
    },
    'Sur — Pryca/U.Nariño': {
        emoji: '🟠', color: 'naranja', vehiculo: 'buses', cantidad: 3,
        inicio: 'Pryca — Terminal Norte', fin: 'U. Antonio Nariño',
        paradas: ['Pryca — Terminal Norte', 'Ciudad Jardín — Calle 14', 'U. Antonio Nariño — Terminal Sur'],
        zona: 'Sur de Cali (Pryca, Ciudad Jardín, Universidad Antonio Nariño)'
    },
    'Ladera — Terrón Colorado/Siloé': {
        emoji: '🟣', color: 'morada', vehiculo: 'gualas', cantidad: 3,
        inicio: 'Calle 25 — Sector Univalle', fin: 'El Ingenio — Carrera 116',
        paradas: ['Calle 25 — Sector Univalle', 'Ciudad Jardín Norte', 'Ciudad Jardín Sur', 'Meléndez — Calle 13 Sur', 'Autopista — Sector El Ingenio', 'El Ingenio — Carrera 116'],
        zona: 'Sur-occidente de Cali (Univalle, Ciudad Jardín, Meléndez, El Ingenio)'
    }
};

const VEL_MS = 12 * 1000 / 3600; // 12 km/h velocidad comercial real Cali

// ─────────────────────────────────────────────
//  CONTEXTO EN TIEMPO REAL
// ─────────────────────────────────────────────
function obtenerContextoTiempoReal() {
    if (typeof window.WayRoute === 'undefined') return null;

    const posiciones = typeof window.WayRoute.obtenerPosicionBuses === 'function'
        ? window.WayRoute.obtenerPosicionBuses() : null;
    const tiempos = typeof window.WayRoute.tiempoLlegadaProximo === 'function'
        ? window.WayRoute.tiempoLlegadaProximo() : null;

    if (!posiciones || posiciones.length === 0) return null;

    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const horaNum = ahora.getHours();
    const esPico = (horaNum >= 6 && horaNum <= 9) || (horaNum >= 17 && horaNum <= 20);

    // Agrupar por ruta
    const porRuta = {};
    posiciones.forEach(b => {
        if (!porRuta[b.ruta]) porRuta[b.ruta] = [];
        porRuta[b.ruta].push(b);
    });

    let ctx = `\n\n=== DATOS EN TIEMPO REAL (${hora} — ${esPico ? 'HORA PICO' : 'hora valle'}) ===\n`;

    Object.entries(porRuta).forEach(([ruta, buses]) => {
        const info = RUTAS_DATA[ruta];
        ctx += `\n${info?.emoji || '⚫'} ${ruta}:\n`;
        buses.forEach(b => {
            const tipo = ruta.includes('Guala') || ruta.includes('Ladera') ? 'Guala' : 'Bus';
            const minutos = Math.max(1, Math.round(b.distanciaMetros / VEL_MS / 60));
            ctx += `  - ${tipo} ${b.numero}: cerca de "${b.paradaCercana}" | distancia: ${b.distanciaMetros}m | aprox. ${minutos} min para próxima parada | ${b.porcentajeRuta}% del recorrido\n`;
        });
    });

    if (tiempos && tiempos.length > 0) {
        ctx += '\nPróximas llegadas ordenadas por tiempo:\n';
        tiempos.slice(0, 8).forEach(t => {
            ctx += `  - ${t.busProximo} → "${t.parada}" en ${t.minutos} min (${t.distanciaMetros}m)\n`;
        });
    }

    ctx += `\nCondición actual: ${esPico ? '⚠️ HORA PICO — posibles demoras de 3-8 min adicionales' : '✅ Hora valle — flujo normal'}\n`;
    ctx += '=== FIN DATOS TIEMPO REAL ===\n';

    return ctx;
}

function buildSystemPrompt() {
    const ctx = obtenerContextoTiempoReal();
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const dia = ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
    const horaNum = ahora.getHours();
    const esPico = (horaNum >= 6 && horaNum <= 9) || (horaNum >= 17 && horaNum <= 20);
    const esNoche = horaNum >= 21 || horaNum < 5;

    return `Eres WayAI, el asistente inteligente de WayRoute — app oficial de transporte público tradicional de Santiago de Cali, Colombia. Proyecto de grado de Ingeniería de Sistemas, respaldado por la Secretaría de Movilidad de Cali.

Fecha y hora: ${dia}, ${hora} — ${esPico ? '⚠️ HORA PICO (mayor congestión)' : esNoche ? '🌙 Servicio nocturno' : '✅ Hora valle (flujo normal)'}.

## TU IDENTIDAD
- Eres WayAI, parte de WayRoute. No eres ChatGPT ni Gemini visible al usuario.
- Tono: cálido, caleño, servicial. Usa "¡Mirá!", "vé", "¡Listo pues!", "¡Bacano!", "¡A la orden!" con naturalidad.
- Respuestas: cortas, directas, útiles. Máximo 3-4 párrafos. Sin tecnicismos.
- Si alguien dice "sí", "claro", "dale" o similar, responde a la ÚLTIMA pregunta que hiciste, no ignores el contexto.

## LAS 5 RUTAS DE WAYROUTE

🔴 **Ruta Especial Sur** — 4 buses rojos | Centro-sur Cali
- Paradas: La Ermita → San Nicolás (Cll 15) → Libertadores (Cll 25) → Alfonso López (Cll 32) → El Calvario
- Recorrido circular ~35 min completo | Frecuencia: 8-12 min

🔵 **Ruta Norte** — 3 buses azules | Norte de Cali
- Paradas: Granada (Cll 22N) → Chipichape (Av. 6N) → Menga (Cll 52N) → Santa Mónica
- Recorrido circular ~40 min completo | Frecuencia: 10-15 min
- Pasa por Centro Comercial Chipichape y sector empresarial norte

🟢 **Gualas Oriente** — 3 gualas verdes (camperos 4x4) | Oriente Cali
- Paradas: Carrera 22 (Aguablanca Norte) → Calle 72W → Calle 92 (Terminal Oriente)
- Recorrido circular ~30 min | Frecuencia: 10-15 min
- Camperos 4x4 adaptados para vías del oriente

🟠 **Ruta Sur** — 3 buses naranjas | Sur de Cali
- Paradas: Pryca (Cra 86) → Ciudad Jardín (Cll 14) → U. Antonio Nariño (Cra 108)
- Recorrido circular ~35 min | Frecuencia: 10-15 min

🟣 **Ruta Univalle–El Ingenio** — 3 gualas moradas | Sur-occidente
- Paradas: Calle 25 (Univalle) → Ciudad Jardín Norte → Ciudad Jardín Sur → Meléndez (Cll 13 Sur) → El Ingenio (Cra 116)
- Recorrido circular ~45 min | Frecuencia: 10-15 min
- Sirve a estudiantes de Univalle, residentes de Ciudad Jardín, Meléndez y El Ingenio

## TARIFAS
- $3.500 pesos TODAS las rutas (buses y gualas). Pago en efectivo al conductor. Sin cambio exacto si es posible.

## CONOCIMIENTO DE CALI

**Barrios y zonas que cubre WayRoute:**
- Centro: La Ermita, San Nicolás, El Calvario, San Fernando
- Norte: Granada, Chipichape, Menga, Santa Mónica, Av. 6N, Ciudad Jardín (norte)
- Sur: Pryca, Ciudad Jardín, Univalle, Meléndez, El Ingenio, U. Antonio Nariño
- Oriente: Aguablanca, Calle 72W, sector oriental

**Conexiones y transbordos útiles:**
- Para ir de la zona norte al oriente: Ruta Norte hasta el centro + Guala Oriente
- Para ir al sur desde el centro: Ruta Especial Sur + Ruta Sur (transbordo en sector Pryca)
- Univalle a El Ingenio: directamente con Ruta Univalle–El Ingenio (morada)
- Granada/Chipichape a Univalle: Norte hasta centro + guala morada

**Puntos de referencia caleños:**
- La Ermita: iglesia icónica del centro, orillas del río Cali
- Chipichape: centro comercial norte, zona empresarial
- Pryca: sector comercial sur, Carrera 86
- Ciudad Jardín: barrio residencial, zona universitaria sur
- El Ingenio: barrio residencial sur, cerca de Carrera 100 y vía Palmira
- Meléndez: sector universitario (Univalle), río Meléndez
- Aguablanca: sector popular oriente, alta densidad poblacional
- Santa Mónica: barrio norte, zona residencial tranquila

**Hora pico en Cali:**
- Mañana: 6:00–9:00 AM (empleados y estudiantes saliendo)
- Tarde: 5:00–8:00 PM (regreso masivo)
- Congestión típica en: Av. Cañasgordas, Autopista Suroccidental, Carrera 1ª, Av. 6N
- Retraso adicional en hora pico: 3–8 minutos por ruta

**Clima de Cali:**
- Época lluviosa (abril–mayo y octubre–noviembre): puede haber desvíos por inundaciones
- En lluvia fuerte: los buses pueden tardar hasta 15 min adicionales
- Temperatura promedio: 25°C, sin estaciones marcadas

**Seguridad:**
- Botón SOS en la app: notifica ubicación a contactos de confianza
- Zonas de cuidado nocturno: El Calvario, sector La Luna, Aguablanca después de 9 PM
- Zonas seguras para esperar: paradas con iluminación, cerca a comercios abiertos
- Emergencias Cali: 123 (Policía/Bomberos/Ambulancia unificado)
- Secretaría de Movilidad: 554-4900

## CÁLCULO DE TIEMPOS
- Velocidad comercial promedio: 12 km/h (con semáforos, paradas y tráfico)
- Entre paradas consecutivas: ~5-8 minutos
- Hora pico: suma 3-8 min adicionales
- Lluvia intensa: suma hasta 15 min
- Si tienes datos en tiempo real: USA los minutos exactos calculados, no estimados genéricos

## REGLAS DE RESPUESTA
1. Si el usuario dice "sí", "claro", "dale", "por favor", "sigue": responde a la ÚLTIMA pregunta u oferta que hiciste en tu mensaje anterior.
2. Si preguntan dónde están los buses: usa datos en tiempo real si están disponibles, si no, da la frecuencia normal.
3. Si preguntan por una ruta específica: menciona paradas, tiempo estimado, color y zona que cubre.
4. Si preguntan cómo ir de A a B: identifica qué ruta(s) los conecta(n) y si necesitan transbordo.
5. Si agradecen: solo calidez, sin mencionar rutas.
6. Nunca digas que eres Gemini, GPT ni IA de Google. Solo eres WayAI de WayRoute.
7. Si algo está fuera de tu alcance: redirige amablemente al tema de transporte en Cali.
${ctx || '\n[Sin datos en tiempo real — usa frecuencias normales para estimaciones]'}`;
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

    const loadingId = agregarBurbuja("WayAI está consultando...", "bot");

    // Construir historial con contexto actualizado
    const systemPrompt = buildSystemPrompt();
    const historyForGemini = [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "¡Entendido! Soy WayAI. Tengo acceso a los datos en tiempo real de WayRoute. ¿En qué te ayudo?" }] }
    ];

    chatHistory.slice(-8).forEach(h => {
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
            body: JSON.stringify({
                contents: historyForGemini,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 512,
                    topP: 0.9
                }
            })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        let respuestaBot = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!respuestaBot) throw new Error("Respuesta vacía");

        actualizarBurbuja(loadingId, formatText(respuestaBot));
        chatHistory.push({ role: "user", text: msg });
        chatHistory.push({ role: "bot", text: respuestaBot });
        document.getElementById("aiMessages").scrollTop = 99999;

    } catch (e) {
        console.warn("Gemini no disponible, usando motor local:", e.message);
        const fallback = respuestaLocal(msg);
        actualizarBurbuja(loadingId, formatText(fallback));
        chatHistory.push({ role: "user", text: msg });
        chatHistory.push({ role: "bot", text: fallback });
    }
}

window.sendAISuggestion = function (el) {
    document.getElementById("aiInput").value = el.innerText;
    sendAI();
};

// ─────────────────────────────────────────────
//  MOTOR LOCAL — FALLBACK MEJORADO
// ─────────────────────────────────────────────
function respuestaLocal(mensaje) {
    const msg = mensaje.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

    const pos = obtenerPosicionesConTiempos();
    const ahora = new Date();
    const horaNum = ahora.getHours();
    const esPico = (horaNum >= 6 && horaNum <= 9) || (horaNum >= 17 && horaNum <= 20);
    const esNoche = horaNum >= 21 || horaNum < 5;

    // ── RESPUESTA AFIRMATIVA (sí/claro/dale) — usa contexto anterior ──
    if (/^(si|sí|claro|dale|bueno|ok|oke|listo|sigue|por favor|dimelo|dime|obvio|of course|yes)$/.test(msg.trim())) {
        const ctx = ultimaPreguntaBot.toLowerCase();
        if (ctx.includes('tiempo') || ctx.includes('llega') || ctx.includes('falta') || ctx.includes('próxima') || ctx.includes('proxima')) {
            if (!pos) return noMapaMsg();
            let r = "⏱️ **Próximas llegadas ahora mismo:**\n\n";
            pos.tiemposOrdenados.slice(0, 6).forEach(t => {
                const info = RUTAS_DATA[t.ruta] || { emoji: '⚫' };
                r += `${info.emoji} **${t.busProximo}** llega a **${t.parada}** en **${t.minutos} min**\n`;
            });
            if (esPico) r += "\n⚠️ Hora pico — puede haber 3-8 min adicionales.";
            return r;
        }
        if (ctx.includes('ruta') || ctx.includes('info') || ctx.includes('más detalles') || ctx.includes('más info')) {
            return "¡Listo! ¿Sobre cuál ruta querés más detalles? 🔴 Especial Sur · 🔵 Norte · 🟢 Gualas Oriente · 🟠 Sur · 🟣 Univalle–El Ingenio";
        }
        if (ctx.includes('seguridad') || ctx.includes('sos') || ctx.includes('contactos')) {
            return "Para configurar tus contactos de seguridad, andá a **Mi Perfil → Contactos de Confianza** en la app. Podés agregar hasta 5 personas que recibirán tu ubicación cuando activés el botón SOS. ¿Querés saber algo más?";
        }
        // Fallback afirmativo genérico
        if (!pos) return noMapaMsg();
        let r = "⏱️ **Tiempos de llegada actuales:**\n\n";
        pos.tiemposOrdenados.slice(0, 5).forEach(t => {
            const info = RUTAS_DATA[t.ruta] || { emoji: '⚫' };
            r += `${info.emoji} **${t.busProximo}** → ${t.parada} en **${t.minutos} min**\n`;
        });
        return r;
    }

    // ── CÓMO IR DE A A B ──
    if (/como llego|como voy|como llegar|que ruta tomo|que bus|cual bus|cual ruta|que guala|como puedo ir/.test(msg)) {
        return recomendarRuta(msg, pos, esPico);
    }

    // ── POSICIÓN EN TIEMPO REAL ──
    if (/donde|ubica|estan|posicion|transitan|circulan|van los buses|que buses/.test(msg)) {
        if (!pos) return noMapaMsg();
        let r = "📍 **Posición actual de todas las unidades:**\n\n";
        Object.entries(pos.porRuta).forEach(([ruta, buses]) => {
            const info = RUTAS_DATA[ruta] || { emoji: '⚫', vehiculo: 'unidad' };
            r += `${info.emoji} **${ruta}**\n`;
            buses.forEach(b => {
                const tipo = ruta.includes('Guala') || ruta.includes('Ladera') ? 'Guala' : 'Bus';
                r += `  • ${tipo} ${b.numero} — parada **${b.paradaCercana}** (~${b.distanciaMetros}m, ${b.minutos} min)\n`;
            });
            r += "\n";
        });
        if (esPico) r += "⚠️ Hora pico activa — puede haber 3-8 min de demora adicional.\n";
        r += "\n¿Querés el tiempo exacto de llegada a alguna parada?";
        return r;
    }

    // ── TIEMPO / CUÁNTO FALTA ──
    if (/falta|llega|minutos|tiempo|cuando llega|cuanto tarda|proximo bus|siguiente/.test(msg)) {
        if (!pos) return noMapaMsg();
        let r = "⏱️ **Próximas llegadas — todas las rutas:**\n\n";
        pos.tiemposOrdenados.slice(0, 6).forEach(t => {
            const info = RUTAS_DATA[t.ruta] || { emoji: '⚫' };
            r += `${info.emoji} **${t.busProximo}** → llega a **${t.parada}** en **${t.minutos} min**\n`;
        });
        if (esPico) r += "\n⚠️ En hora pico puede haber 3-8 min adicionales.";
        r += "\n\n¿Te interesa una ruta específica?";
        return r;
    }

    // ── RUTA 5 — UNIVALLE / EL INGENIO ──
    if (/univalle|ingenio|melendez|ciudad jardin|ladera|morado|morada/.test(msg)) {
        const info = RUTAS_DATA['Ladera — Terrón Colorado/Siloé'];
        let r = `🟣 ¡Mirá! La **Ruta Univalle–El Ingenio** opera con ${info.cantidad} gualas moradas.\n\n`;
        r += `**Recorrido:** ${info.paradas.join(' → ')}\n\n`;
        r += `**Zona:** ${info.zona}\n**Tarifa:** $3.500\n\n`;
        if (pos) {
            const buses = pos.porRuta['Ladera — Terrón Colorado/Siloé'];
            if (buses?.length) {
                r += `Ahora mismo: `;
                buses.forEach(b => r += `Guala ${b.numero} está en **${b.paradaCercana}** (~${b.minutos} min)\n`);
            }
        }
        r += "\n¿Necesitás saber cuándo llega la próxima guala?";
        return r;
    }

    // ── RUTA NORTE ──
    if (/norte|granada|menga|chipichape|santa monica|azul/.test(msg)) {
        const info = RUTAS_DATA['Norte — Granada/Menga'];
        let r = `🔵 La **Ruta Norte** opera con ${info.cantidad} buses azules.\n\n**Paradas:** ${info.paradas.join(' → ')}\n**Tarifa:** $3.500\n\n`;
        if (pos) {
            const buses = pos.porRuta['Norte — Granada/Menga'];
            if (buses?.length) {
                const prox = buses.reduce((a, b) => a.minutos < b.minutos ? a : b);
                r += `Próximo bus: **Bus ${prox.numero}** en ~**${prox.minutos} min** cerca de ${prox.paradaCercana}.\n\n`;
            }
        }
        r += "¿Querés que te diga cuándo llega el próximo?";
        return r;
    }

    // ── RUTA ORIENTE ──
    if (/oriente|aguablanca|guala|campero|carrera 22|calle 92|calle 72/.test(msg)) {
        const info = RUTAS_DATA['Gualas Oriente'];
        let r = `🟢 Las **Gualas del Oriente** — ${info.cantidad} camperos 4x4 operando.\n\n**Paradas:** ${info.paradas.join(' → ')}\n**Zona:** ${info.zona}\n**Tarifa:** $3.500\n\n`;
        if (pos) {
            const buses = pos.porRuta['Gualas Oriente'];
            if (buses?.length) {
                const prox = buses.reduce((a, b) => a.minutos < b.minutos ? a : b);
                r += `Próxima guala: **Guala ${prox.numero}** en ~**${prox.minutos} min**.\n\n`;
            }
        }
        r += "¿Necesitás más información de esta ruta?";
        return r;
    }

    // ── RUTA SUR / PRYCA ──
    if (/pryca|nariño|antonio narino|sur|carrera 86|carrera 108|naranja/.test(msg)) {
        const info = RUTAS_DATA['Sur — Pryca/U.Nariño'];
        let r = `🟠 La **Ruta Sur** con ${info.cantidad} buses naranjas.\n\n**Paradas:** ${info.paradas.join(' → ')}\n**Zona:** ${info.zona}\n**Tarifa:** $3.500\n\n`;
        if (pos) {
            const buses = pos.porRuta['Sur — Pryca/U.Nariño'];
            if (buses?.length) {
                const prox = buses.reduce((a, b) => a.minutos < b.minutos ? a : b);
                r += `Próximo bus: **Bus ${prox.numero}** en ~**${prox.minutos} min**.\n\n`;
            }
        }
        r += "¿Querés saber el tiempo de llegada exacto?";
        return r;
    }

    // ── RUTA ESPECIAL SUR / ERMITA ──
    if (/ermita|especial sur|roja|rojo|san nicolas|libertadores|alfonso lopez/.test(msg)) {
        const info = RUTAS_DATA['Especial Sur'];
        let r = `🔴 La **Ruta Especial Sur** con ${info.cantidad} buses rojos.\n\n**Paradas:** ${info.paradas.join(' → ')}\n**Zona:** ${info.zona}\n**Tarifa:** $3.500\n\n`;
        if (pos) {
            const buses = pos.porRuta['Especial Sur'];
            if (buses?.length) {
                const prox = buses.reduce((a, b) => a.minutos < b.minutos ? a : b);
                r += `Próximo bus: **Bus ${prox.numero}** en ~**${prox.minutos} min** cerca de ${prox.paradaCercana}.\n\n`;
            }
        }
        r += "¿Querés más detalles?";
        return r;
    }

    // ── TODAS LAS RUTAS ──
    if (/rutas|cuantas|que tienen|opciones|disponibles|hay/.test(msg)) {
        let r = "🗺️ WayRoute tiene **5 rutas activas** en Cali:\n\n";
        Object.entries(RUTAS_DATA).forEach(([nombre, info]) => {
            r += `${info.emoji} **${nombre}** — ${info.cantidad} ${info.vehiculo} | ${info.inicio} → ${info.fin}\n`;
        });
        r += "\nTarifa unificada: **$3.500** en todas. ¿Por cuál te doy más info?";
        return r;
    }

    // ── PRECIO / TARIFA ──
    if (/cuesta|precio|pasaje|valor|tarifa|cobran|plata|paga|cuanto es/.test(msg)) {
        return "💰 La tarifa es **$3.500 pesos colombianos** para todas las rutas — buses y gualas por igual. Pago en efectivo directamente al conductor. ¡Sin complicaciones!";
    }

    // ── SEGURIDAD ──
    if (/segur|noche|peligro|sos|emergencia|123/.test(msg)) {
        let r = "🛡️ Tu seguridad es prioridad en WayRoute.\n\n";
        if (esNoche) r += "🌙 Siendo de noche, te recomiendo especialmente:\n";
        r += "• Usá el botón **SOS** de la app para compartir tu ubicación en tiempo real con tus contactos de confianza.\n";
        r += "• Esperá el bus en **paradas iluminadas** y preferiblemente acompañado.\n";
        r += "• Ante cualquier emergencia: llamá al **123** (emergencias Cali).\n\n";
        r += "¿Necesitás configurar tus contactos de seguridad?";
        return r;
    }

    // ── HORA PICO ──
    if (/pico|congestion|trafico|demora|tarda mas/.test(msg)) {
        return `${esPico ? '⚠️ Sí, **estamos en hora pico** ahora mismo.' : '✅ Actualmente es hora valle.'} En hora pico (6-9 AM y 5-8 PM) los buses pueden tardar **3-8 minutos adicionales** por la congestión en Cali. Te recomiendo salir con margen extra. ¿Necesitás el tiempo estimado para alguna ruta?`;
    }

    // ── SALUDOS ──
    if (/^(hola|buenos|buenas|que mas|que hay|quiubo|ey|hey|wayai)/.test(msg)) {
        return `¡Hola vé! 👋 Soy **WayAI**, tu asistente de movilidad en Cali. ${esPico ? '⚠️ Ojo que estamos en hora pico.' : esNoche ? '🌙 Servicio nocturno activo.' : '✅ Todo fluyendo bien.'}\n\nTenemos **5 rutas activas** — buses y gualas. Puedo decirte:\n• Dónde están los buses ahora mismo\n• Cuánto falta para el próximo\n• Qué ruta te conviene según tu destino\n\n¿En qué te ayudo?`;
    }

    // ── AGRADECIMIENTOS ──
    if (/gracias|agradezco|bacano|genial|perfecto|que chimba/.test(msg)) {
        return "¡Con mucho gusto! 😊 Para eso estamos. Cualquier cosa me avisás.";
    }

    // ── DESPEDIDAS ──
    if (/chao|adios|bye|hasta luego|nos vemos|hasta pronto/.test(msg)) {
        return "¡Chao vé! 👋 Que tengas un viaje seguro. WayRoute siempre está disponible. ¡Buen viaje!";
    }

    // ── FALLBACK ──
    return `¡Aquí estoy! 🗺️ WayRoute tiene **5 rutas activas** en Cali. Puedo ayudarte con:\n\n• **¿Dónde están los buses?** — posición en tiempo real\n• **¿Cuánto falta?** — tiempo estimado de llegada\n• **¿Qué ruta tomo?** — según tu origen y destino\n• **Precio, paradas, zonas** de cada ruta\n\n¿Qué necesitás?`;
}

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function obtenerPosicionesConTiempos() {
    if (typeof window.WayRoute === 'undefined') return null;

    const posiciones = typeof window.WayRoute.obtenerPosicionBuses === 'function'
        ? window.WayRoute.obtenerPosicionBuses() : null;
    const tiempos = typeof window.WayRoute.tiempoLlegadaProximo === 'function'
        ? window.WayRoute.tiempoLlegadaProximo() : null;

    if (!posiciones || posiciones.length === 0) return null;

    // Enriquecer posiciones con tiempo calculado
    const posConTiempo = posiciones.map(b => ({
        ...b,
        minutos: Math.max(1, Math.round(b.distanciaMetros / VEL_MS / 60))
    }));

    const porRuta = {};
    posConTiempo.forEach(b => {
        if (!porRuta[b.ruta]) porRuta[b.ruta] = [];
        porRuta[b.ruta].push(b);
    });

    const tiemposOrdenados = tiempos || posConTiempo.sort((a, b) => a.minutos - b.minutos).map(b => ({
        ruta: b.ruta,
        busProximo: `${b.ruta.includes('Guala') || b.ruta.includes('Ladera') ? 'Guala' : 'Bus'} ${b.numero}`,
        parada: b.paradaCercana,
        minutos: b.minutos,
        distanciaMetros: b.distanciaMetros
    }));

    return { porRuta, tiemposOrdenados };
}

function noMapaMsg() {
    return "🗺️ Para darte la posición exacta necesito que tengas el **Mapa** abierto (al menos una vez en esta sesión). Abrilo en el menú y volvé a preguntarme — ahí te digo exactamente dónde está cada unidad y cuánto falta. ¿Querés info general de las rutas mientras tanto?";
}

// ─────────────────────────────────────────────
//  INTERFAZ
// ─────────────────────────────────────────────
function agregarBurbuja(texto, tipo) {
    const container = document.getElementById("aiMessages");
    const idUnico = "msg-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const div = document.createElement("div");
    div.className = `msg msg-${tipo}`;
    div.innerHTML = `
        <div class="msg-bubble" id="${idUnico}">${texto}</div>
        <div class="msg-meta">${tipo === 'user' ? 'Tú' : 'WayAI'} • ${hora}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return idUnico;
}

function actualizarBurbuja(id, nuevoTexto) {
    const b = document.getElementById(id);
    if (b) b.innerHTML = nuevoTexto;
    document.getElementById("aiMessages").scrollTop = 99999;
    // Guardar contexto de la última pregunta del bot
    const textoPlano = nuevoTexto.replace(/<[^>]+>/g, '').toLowerCase();
    if (textoPlano.includes('?')) ultimaPreguntaBot = textoPlano;
}

// ─────────────────────────────────────────────
//  RECOMENDADOR DE RUTAS A→B
// ─────────────────────────────────────────────
function recomendarRuta(msg, pos, esPico) {
    const m = msg.toLowerCase();

    // Univalle / El Ingenio / Meléndez / Ciudad Jardín
    if ((m.includes('univalle') || m.includes('ingenio') || m.includes('melendez') || m.includes('ciudad jardin')) &&
        (m.includes('univalle') || m.includes('ingenio') || m.includes('melendez') || m.includes('ciudad jardin'))) {
        let r = "🟣 Para esa zona tomás la **Ruta Univalle–El Ingenio** (gualas moradas).\n\n";
        r += "**Paradas:** Calle 25 Univalle → Ciudad Jardín Norte → Ciudad Jardín Sur → Meléndez → El Ingenio (Cra 116)\n";
        r += "**Tiempo estimado:** 15-25 min según tu parada | **Tarifa:** $3.500\n\n";
        if (pos) {
            const buses = pos.porRuta['Ladera — Terrón Colorado/Siloé'];
            if (buses?.length) {
                const prox = buses.reduce((a, b) => a.minutos < b.minutos ? a : b);
                r += `Próxima guala morada: llega en ~**${prox.minutos} min** a ${prox.paradaCercana}.\n\n`;
            }
        }
        if (esPico) r += "⚠️ Hora pico: suma 3-5 min. Salí con tiempo. ";
        r += "¿Querés más detalles del recorrido?";
        return r;
    }

    // Norte / Granada / Menga / Chipichape
    if (m.includes('granada') || m.includes('menga') || m.includes('chipichape') || m.includes('santa monica') || m.includes('norte')) {
        let r = "🔵 Para el norte de Cali usás la **Ruta Norte** (buses azules).\n\n";
        r += "**Paradas:** Granada (Cll 22N) → Chipichape → Menga → Santa Mónica\n";
        r += "**Tiempo estimado:** 10-30 min | **Tarifa:** $3.500\n\n";
        if (pos) {
            const buses = pos.porRuta['Norte — Granada/Menga'];
            if (buses?.length) {
                const prox = buses.reduce((a, b) => a.minutos < b.minutos ? a : b);
                r += `Próximo bus: llega en ~**${prox.minutos} min**.\n\n`;
            }
        }
        r += "¿Necesitás saber el tiempo exacto?";
        return r;
    }

    // Aguablanca / Oriente
    if (m.includes('aguablanca') || m.includes('oriente') || m.includes('calle 72') || m.includes('calle 92')) {
        let r = "🟢 Para el oriente de Cali usás las **Gualas Oriente** (camperos verdes 4x4).\n\n";
        r += "**Paradas:** Carrera 22 → Calle 72W → Calle 92\n";
        r += "**Tiempo estimado:** 10-25 min | **Tarifa:** $3.500\n\n";
        if (pos) {
            const buses = pos.porRuta['Gualas Oriente'];
            if (buses?.length) {
                const prox = buses.reduce((a, b) => a.minutos < b.minutos ? a : b);
                r += `Próxima guala verde: llega en ~**${prox.minutos} min**.\n\n`;
            }
        }
        r += "¿Querés más información de esta ruta?";
        return r;
    }

    // Sur / Pryca / Nariño
    if (m.includes('pryca') || m.includes('nariño') || m.includes('antonio narino') || m.includes('carrera 86') || m.includes('carrera 108')) {
        let r = "🟠 Para el sur usás la **Ruta Sur** (buses naranjas).\n\n";
        r += "**Paradas:** Pryca (Cra 86) → Ciudad Jardín (Cll 14) → U. Antonio Nariño (Cra 108)\n";
        r += "**Tiempo estimado:** 10-25 min | **Tarifa:** $3.500\n\n";
        if (pos) {
            const buses = pos.porRuta['Sur — Pryca/U.Nariño'];
            if (buses?.length) {
                const prox = buses.reduce((a, b) => a.minutos < b.minutos ? a : b);
                r += `Próximo bus: llega en ~**${prox.minutos} min**.\n\n`;
            }
        }
        if (esPico) r += "⚠️ Hora pico activa — puede tardar un poco más. ";
        r += "¿Querés saber el tiempo exacto?";
        return r;
    }

    // Centro / La Ermita
    if (m.includes('centro') || m.includes('ermita') || m.includes('san nicolas') || m.includes('calvario')) {
        let r = "🔴 Para el centro-sur usás la **Ruta Especial Sur** (buses rojos).\n\n";
        r += "**Paradas:** La Ermita → San Nicolás → Libertadores → Alfonso López → El Calvario\n";
        r += "**Tiempo estimado:** 8-20 min | **Tarifa:** $3.500\n\n";
        if (pos) {
            const buses = pos.porRuta['Especial Sur'];
            if (buses?.length) {
                const prox = buses.reduce((a, b) => a.minutos < b.minutos ? a : b);
                r += `Próximo bus: llega en ~**${prox.minutos} min**.\n\n`;
            }
        }
        r += "¿Necesitás más detalles del recorrido?";
        return r;
    }

    // No reconoce la ruta
    return "🗺️ Contame de dónde salís y a dónde querés llegar, y te digo exactamente qué ruta tomar. Por ejemplo: *\"¿Cómo voy de Granada a Meléndez?\"*";
}

function formatText(t) {
    return t
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
}
