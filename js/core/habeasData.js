/**
 * habeasData.js — WayRoute / MoviCali
 * Modal de Autorización de Tratamiento de Datos Personales
 *
 * API pública:
 *   HabeasData.init({ rol, onReject })  → muestra el modal al cargar
 *   HabeasData.getDatos()               → { aceptado, fecha, rol } para guardar en BD
 *   HabeasData.reabrir()                → reabre el modal en modo solo-lectura (sin bloqueo)
 * Conforme a: Ley 1581 de 2012 | Decreto 1377 de 2013 | Ley 769 de 2002
 *
 * Uso:
 *   <script src="../js/core/habeasData.js"></script>
 *   HabeasData.init({ rol: 'pasajero' | 'conductor' | 'administrador' });
 */

const HabeasData = (() => {
  const SESSION_KEY = 'hd_accepted_v1';

  // ─── Inyectar estilos ───────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('hd-styles')) return;
    const style = document.createElement('style');
    style.id = 'hd-styles';
    style.textContent = `
      /* ── Overlay ── */
      #hd-overlay {
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(5, 15, 30, 0.88);
        backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center;
        padding: 16px;
        animation: hd-fadein .35s ease;
      }
      @keyframes hd-fadein { from { opacity:0 } to { opacity:1 } }

      /* ── Modal ── */
      #hd-modal {
        background: #fff;
        border-radius: 20px;
        width: 100%; max-width: 680px;
        max-height: 92vh;
        display: flex; flex-direction: column;
        box-shadow: 0 24px 80px rgba(0,0,0,.45);
        overflow: hidden;
        animation: hd-slidein .38s cubic-bezier(.22,1,.36,1);
      }
      @keyframes hd-slidein {
        from { transform: translateY(32px); opacity:0 }
        to   { transform: translateY(0);    opacity:1 }
      }

      /* ── Header ── */
      #hd-header {
        padding: 24px 28px 20px;
        background: linear-gradient(135deg, #0a1628 0%, #1EA0D8 100%);
        color: #fff;
        flex-shrink: 0;
      }
      #hd-header .hd-eyebrow {
        font-size: .72rem; font-weight: 700; letter-spacing: .1em;
        text-transform: uppercase; opacity: .7; margin-bottom: 6px;
      }
      #hd-header h2 {
        margin: 0; font-size: 1.18rem; font-weight: 700; line-height: 1.3;
      }
      #hd-header p {
        margin: 6px 0 0; font-size: .8rem; opacity: .75; line-height: 1.5;
      }
      .hd-badge {
        display: inline-flex; align-items: center; gap: 6px;
        background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25);
        border-radius: 99px; padding: 3px 10px;
        font-size: .68rem; font-weight: 600; margin-top: 10px;
      }

      /* ── Body scrollable ── */
      #hd-body {
        flex: 1; overflow-y: auto; padding: 24px 28px;
        font-size: .83rem; line-height: 1.7; color: #2d3748;
        scroll-behavior: smooth;
      }
      #hd-body::-webkit-scrollbar { width: 6px; }
      #hd-body::-webkit-scrollbar-thumb { background: #1EA0D8; border-radius: 99px; }

      .hd-section { margin-bottom: 20px; }
      .hd-section-title {
        font-size: .78rem; font-weight: 700; letter-spacing: .08em;
        text-transform: uppercase; color: #1EA0D8;
        margin-bottom: 8px; display: flex; align-items: center; gap: 6px;
      }
      .hd-section-title span { font-size: 1rem; }
      .hd-section p { margin: 0 0 8px; }
      .hd-ul { margin: 6px 0 8px 0; padding-left: 18px; }
      .hd-ul li { margin-bottom: 5px; }

      .hd-law-ref {
        display: inline-block;
        background: #EFF8FF; border: 1px solid #BAE3FF;
        color: #0369A1; border-radius: 6px;
        padding: 1px 7px; font-size: .72rem; font-weight: 600;
        margin: 0 2px;
      }
      .hd-highlight-box {
        background: #F0FDF4; border: 1px solid #86EFAC;
        border-radius: 10px; padding: 12px 14px; margin: 12px 0;
        font-size: .8rem; color: #166534;
      }
      .hd-warn-box {
        background: #FFF7ED; border: 1px solid #FCD34D;
        border-radius: 10px; padding: 12px 14px; margin: 12px 0;
        font-size: .8rem; color: #92400E;
      }
      .hd-divider {
        border: none; border-top: 1px solid #E2E8F0; margin: 16px 0;
      }

      /* ── Scroll indicator ── */
      #hd-scroll-note {
        text-align: center; font-size: .74rem; color: #718096;
        padding: 8px 16px;
        background: #F7FAFC; border-top: 1px solid #E2E8F0;
        flex-shrink: 0;
        transition: opacity .3s;
      }
      #hd-scroll-note.hidden { display: none; }

      /* ── Checkbox ── */
      #hd-footer { padding: 16px 28px 20px; flex-shrink: 0; border-top: 1px solid #E2E8F0; }
      .hd-check-row {
        display: flex; align-items: flex-start; gap: 10px;
        margin-bottom: 16px; cursor: pointer;
      }
      .hd-check-row input[type=checkbox] {
        width: 18px; height: 18px; margin-top: 2px; flex-shrink: 0;
        accent-color: #1EA0D8; cursor: pointer;
      }
      .hd-check-label { font-size: .8rem; color: #374151; line-height: 1.5; }
      .hd-check-label strong { color: #1EA0D8; }

      /* ── Botones ── */
      .hd-btn-row { display: flex; gap: 10px; }
      #hd-btn-reject {
        flex: 1; padding: 11px 16px; border-radius: 10px;
        border: 1.5px solid #E2E8F0; background: #fff;
        color: #718096; font-size: .85rem; font-weight: 600;
        cursor: pointer; transition: all .2s;
      }
      #hd-btn-reject:hover { background: #FEF2F2; border-color: #FCA5A5; color: #DC2626; }
      #hd-btn-accept {
        flex: 2; padding: 11px 20px; border-radius: 10px;
        border: none; background: linear-gradient(135deg, #1EA0D8, #0DCCA0);
        color: #fff; font-size: .88rem; font-weight: 700;
        cursor: pointer; transition: all .2s; opacity: .45; pointer-events: none;
      }
      #hd-btn-accept.enabled { opacity: 1; pointer-events: auto; }
      #hd-btn-accept.enabled:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(30,160,216,.35); }

      /* ── Close success ── */
      #hd-overlay.closing {
        animation: hd-fadeout .3s ease forwards;
      }
      @keyframes hd-fadeout { to { opacity:0; pointer-events:none } }
    `;
    document.head.appendChild(style);
  }

  // ─── Construir HTML del modal ───────────────────────────────────────────────
  function buildHTML(rol) {
    const rolLabel = {
      pasajero: 'Pasajero',
      conductor: 'Conductor',
      administrador: 'Administrador'
    }[rol] || 'Usuario';

    const datosSegunRol = {
      pasajero: `nombres y apellidos, número de cédula de ciudadanía, fecha de nacimiento,
        número de celular, dirección de residencia, barrio/sector y correo electrónico`,
      conductor: `nombres y apellidos, número de cédula de ciudadanía, fecha de nacimiento,
        número de celular, dirección de residencia, correo electrónico, datos del vehículo
        (placa, tipo, marca, modelo, SOAT, tarjeta de operación, revisión técnico-mecánica)
        y datos de licencia de conducción (número, categoría, fechas de expedición y vencimiento)`,
      administrador: `nombres y apellidos, correo electrónico institucional y cargo dentro del sistema`
    }[rol] || 'datos personales de identificación y contacto';

    return `
    <div id="hd-overlay" role="dialog" aria-modal="true" aria-labelledby="hd-title">
      <div id="hd-modal">

        <!-- HEADER -->
        <div id="hd-header">
          <div class="hd-eyebrow">🛡️ Protección de Datos Personales</div>
          <h2 id="hd-title">Autorización de Tratamiento de Datos Personales</h2>
          <p>Antes de continuar con el registro como <strong>${rolLabel}</strong>, debes leer y aceptar la siguiente autorización conforme a la normativa colombiana vigente.</p>
          <div class="hd-badge">⚖️ Ley 1581 de 2012 &nbsp;·&nbsp; Decreto 1377 de 2013</div>
        </div>

        <!-- BODY -->
        <div id="hd-body">

          <div class="hd-section">
            <div class="hd-section-title"><span>🏢</span> 1. Responsable del Tratamiento</div>
            <p>
              <strong>WayRoute – Sistema de Transporte Público MoviCali</strong>, con operación en
              Santiago de Cali, Valle del Cauca, Colombia, es el Responsable del Tratamiento de sus
              datos personales, conforme al artículo 3° de la
              <span class="hd-law-ref">Ley 1581/2012</span>.
            </p>
            <p>
              <strong>Contacto del responsable:</strong> contacto@wayroute.movicali.gov.co<br>
              <strong>Dirección:</strong> Cali, Valle del Cauca, Colombia
            </p>
          </div>

          <hr class="hd-divider">

          <div class="hd-section">
            <div class="hd-section-title"><span>📋</span> 2. Datos Personales a Recopilar</div>
            <p>Para su registro como <strong>${rolLabel}</strong>, recopilaremos los siguientes datos personales:</p>
            <ul class="hd-ul">
              ${datosSegunRol.split(',').map(d => `<li>${d.trim()}</li>`).join('')}
            </ul>
            <div class="hd-warn-box">
              ⚠️ <strong>Datos sensibles:</strong> Los datos biométricos, de salud o de otra naturaleza sensible
              no son recopilados por esta plataforma en el proceso de registro.
            </div>
          </div>

          <hr class="hd-divider">

          <div class="hd-section">
            <div class="hd-section-title"><span>🎯</span> 3. Finalidades del Tratamiento</div>
            <p>Sus datos serán utilizados exclusivamente para las siguientes finalidades:</p>
            <ul class="hd-ul">
              <li>Gestionar su cuenta de usuario y autenticar su identidad en la plataforma WayRoute.</li>
              <li>Prestar los servicios de información sobre rutas y operación del transporte público tradicional de Cali.</li>
              <li>Enviar notificaciones relacionadas con el servicio (alertas, novedades, actualizaciones de ruta).</li>
              <li>Dar cumplimiento a obligaciones legales y regulatorias ante autoridades de tránsito y transporte.</li>
              <li>Mejorar la plataforma mediante análisis estadísticos anonimizados.</li>
              <li>Atender requerimientos de autoridades competentes en el marco legal vigente.</li>
            </ul>
            <div class="hd-highlight-box">
              ✅ Sus datos <strong>NO serán vendidos, cedidos ni transferidos</strong> a terceros con fines comerciales.
              Toda transferencia se realizará únicamente cuando sea requerida por ley o con su consentimiento expreso.
            </div>
          </div>

          <hr class="hd-divider">

          <div class="hd-section">
            <div class="hd-section-title"><span>⏳</span> 4. Vigencia del Tratamiento</div>
            <p>
              Sus datos serán tratados durante el tiempo que mantenga activa su cuenta en WayRoute y por el período
              adicional que exijan las obligaciones legales o contractuales aplicables, conforme al artículo 11 del
              <span class="hd-law-ref">Decreto 1377/2013</span>.
            </p>
          </div>

          <hr class="hd-divider">

          <div class="hd-section">
            <div class="hd-section-title"><span>⚖️</span> 5. Derechos del Titular (Art. 8° — Ley 1581/2012)</div>
            <p>Como titular de los datos personales, usted tiene derecho a:</p>
            <ul class="hd-ul">
              <li><strong>Conocer</strong> los datos personales que reposan en nuestras bases de datos.</li>
              <li><strong>Actualizar y rectificar</strong> sus datos cuando sean inexactos o incompletos.</li>
              <li><strong>Solicitar prueba</strong> de la autorización otorgada al Responsable del Tratamiento.</li>
              <li><strong>Ser informado</strong> sobre el uso que se ha dado a sus datos personales.</li>
              <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la normativa vigente.</li>
              <li><strong>Revocar la autorización</strong> y/o solicitar la supresión de sus datos cuando no se respeten los principios, derechos y garantías constitucionales y legales.</li>
              <li><strong>Acceder gratuitamente</strong> a sus datos personales que hayan sido objeto de tratamiento.</li>
            </ul>
            <p>
              Para ejercer sus derechos, puede contactarnos en:
              <strong>contacto@wayroute.movicali.gov.co</strong>
            </p>
          </div>

          <hr class="hd-divider">

          <div class="hd-section">
            <div class="hd-section-title"><span>🔒</span> 6. Seguridad de la Información</div>
            <p>
              WayRoute adopta las medidas técnicas, humanas y administrativas necesarias para garantizar
              la seguridad de sus datos personales y evitar su adulteración, pérdida, consulta, uso o
              acceso no autorizado o fraudulento, conforme al principio de seguridad establecido en el
              artículo 4° literal g) de la <span class="hd-law-ref">Ley 1581/2012</span>.
            </p>
          </div>

          <hr class="hd-divider">

          <div class="hd-section">
            <div class="hd-section-title"><span>📜</span> 7. Marco Legal Aplicable</div>
            <ul class="hd-ul">
              <li><span class="hd-law-ref">Ley 1581 de 2012</span> — Protección de datos personales (Habeas Data)</li>
              <li><span class="hd-law-ref">Decreto 1377 de 2013</span> — Reglamento de tratamiento de datos personales</li>
              <li><span class="hd-law-ref">Ley 769 de 2002</span> — Código Nacional de Tránsito (conductores)</li>
              <li><span class="hd-law-ref">Ley 1266 de 2008</span> — Habeas Data financiero y crediticio</li>
              <li><span class="hd-law-ref">Const. Política Art. 15</span> — Derecho fundamental a la intimidad y al buen nombre</li>
            </ul>
          </div>

        </div><!-- /hd-body -->

        <!-- SCROLL NOTE -->
        <div id="hd-scroll-note">
          📖 Desplázate hasta el final del documento para habilitar el botón de aceptar ↓
        </div>

        <!-- FOOTER -->
        <div id="hd-footer">
          <label class="hd-check-row" for="hd-checkbox">
            <input type="checkbox" id="hd-checkbox" disabled>
            <span class="hd-check-label">
              He leído, entiendo y autorizo expresamente el tratamiento de mis datos personales conforme a lo
              descrito en esta autorización, de acuerdo con la <strong>Ley 1581 de 2012</strong> y el
              <strong>Decreto 1377 de 2013</strong> de la República de Colombia.
            </span>
          </label>
          <div class="hd-btn-row">
            <button id="hd-btn-reject">✕ No acepto</button>
            <button id="hd-btn-accept" disabled>🛡️ Acepto el tratamiento de mis datos</button>
          </div>
        </div>

      </div>
    </div>`;
  }

  // ─── Lógica principal ───────────────────────────────────────────────────────
  function init(options = {}) {
    const rol   = (options.rol || 'pasajero').toLowerCase();
    const redirect = options.onReject || '../login.html';

    // Si ya fue aceptado en esta sesión, no mostrar
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const { accepted, ts } = JSON.parse(stored);
        // válido por 2 horas
        if (accepted && (Date.now() - ts) < 7200000) return;
      } catch (_) { /* ignorar */ }
    }

    injectStyles();
    document.body.insertAdjacentHTML('afterbegin', buildHTML(rol));

    const overlay   = document.getElementById('hd-overlay');
    const body      = document.getElementById('hd-body');
    const scrollNote= document.getElementById('hd-scroll-note');
    const checkbox  = document.getElementById('hd-checkbox');
    const btnAccept = document.getElementById('hd-btn-accept');
    const btnReject = document.getElementById('hd-btn-reject');

    // Deshabilitar scroll del fondo
    document.body.style.overflow = 'hidden';

    // Detectar cuando el usuario llega al final del scroll
    let hasScrolled = false;
    body.addEventListener('scroll', () => {
      if (hasScrolled) return;
      const { scrollTop, scrollHeight, clientHeight } = body;
      if (scrollTop + clientHeight >= scrollHeight - 40) {
        hasScrolled = true;
        scrollNote.classList.add('hidden');
        checkbox.disabled = false;
      }
    });

    // Habilitar botón cuando el checkbox esté marcado
    checkbox.addEventListener('change', () => {
      btnAccept.classList.toggle('enabled', checkbox.checked);
      btnAccept.disabled = !checkbox.checked;
    });

    // ACEPTAR
    btnAccept.addEventListener('click', () => {
      if (!checkbox.checked) return;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        accepted: true,
        rol,
        ts: Date.now()
      }));
      overlay.classList.add('closing');
      setTimeout(() => {
        overlay.remove();
        document.body.style.overflow = '';
      }, 320);
    });

    // RECHAZAR
    btnReject.addEventListener('click', () => {
      if (confirm('⚠️ Si no aceptas el tratamiento de datos, no podrás registrarte en WayRoute.\n\n¿Deseas volver al inicio?')) {
        window.location.href = redirect;
      }
    });
  }

  // ─── Reabrir en modo solo-lectura ─────────────────────────────────────────
  function reabrir() {
    injectStyles();
    // Detectar si el rol está guardado en sessionStorage
    let rol = 'usuario';
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
      if (stored.rol) rol = stored.rol;
    } catch (_) { /* ignorar */ }

    document.body.insertAdjacentHTML('afterbegin', buildHTML(rol));
    document.body.style.overflow = 'hidden';

    const overlay  = document.getElementById('hd-overlay');
    const body     = document.getElementById('hd-body');
    const footer   = document.getElementById('hd-footer');
    const scrollN  = document.getElementById('hd-scroll-note');
    const btnReject= document.getElementById('hd-btn-reject');

    // Ocultar footer de aceptación — solo lectura
    footer.style.display = 'none';
    scrollN.classList.add('hidden');

    // Cambiar título del botón rechazar → Cerrar
    btnReject.textContent = '✕ Cerrar';
    btnReject.style.flex = '1';
    footer.style.display = 'flex';
    footer.style.paddingTop = '12px';
    // Quitar el checklist del footer, solo mostrar botón cerrar
    footer.innerHTML = `
      <button id="hd-btn-close-ro" style="
        width:100%; padding:11px 20px; border-radius:10px;
        border:1.5px solid #E2E8F0; background:#fff;
        color:#374151; font-size:.88rem; font-weight:600; cursor:pointer;
      ">✕ Cerrar autorización</button>`;

    document.getElementById('hd-btn-close-ro').addEventListener('click', () => {
      overlay.classList.add('closing');
      setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 320);
    });
  }

  // ─── Obtener datos para guardar en BD ──────────────────────────────────────
  function getDatos() {
    try {
      const stored = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (!stored || !stored.accepted) return null;
      return {
        aceptado:     true,
        fecha:        new Date(stored.ts).toISOString(),
        fecha_ts:     stored.ts,
        rol:          stored.rol || 'usuario',
        ley_referencia: 'Ley 1581 de 2012 / Decreto 1377 de 2013'
      };
    } catch (_) {
      return null;
    }
  }

  // API pública
  return { init, getDatos, reabrir };
})();
