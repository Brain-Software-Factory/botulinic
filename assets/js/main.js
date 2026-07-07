/**
* Botulinic — Sitio web
* Desarrollado por Brain Software Factory — https://brain.com.ar
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  if (mobileNavToggleBtn) {
    mobileNavToggleBtn.addEventListener('click', mobileNavToogle);
  }

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  // El preloader se retira apenas el DOM está listo, sin esperar window.load
  // (que se demora hasta que descargan todas las imágenes). Evita la pantalla
  // en blanco prolongada en conexiones lentas.
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    preloader.remove();
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  // Inicializa AOS de inmediato (el script corre al final del body, con el DOM
  // listo) para que el contenido no quede invisible esperando window.load.
  aosInit();

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Native booking form — 4-step flow against Platform public API.
   *
   * Step 1 — Servicio + Sede  (GET /booking-config)
   * Step 2 — Date + slot grid (GET /disponibilidad)
   * Step 3 — Identity: phone or DNI → POST /otp → 6-digit code → POST /reservar
   * Step 4 — Result: success card or WhatsApp redirect
   *
   * No external deps. Endpoints from window.SITE_CONFIG.apiBase.
   */
  (function bookingWidget() {
    var wrapper    = document.getElementById('booking-wrapper');
    var nativeForm = document.getElementById('native-booking');
    if (!wrapper || !nativeForm) return;

    var cfg = window.SITE_CONFIG || {};
    var API = cfg.apiBase;
    if (!API) return;

    var WA_FALLBACK = cfg.waFallback || 'https://wa.me/5491162633886';
    var OTP_TTL = 300; // 5 minutes in seconds

    // State
    var s = {
      sedes: [], servicios: [],
      sedeCode: '', servicioCode: '',
      fecha: '', slot: null,
      idMode: 'dni', phone: '', dni: '',
      otpSent: false, countdownTimer: null, countdownSec: 0
    };

    // Helpers
    function el(id) { return document.getElementById(id); }
    function show(e) { if (e) e.hidden = false; }
    function hide(e) { if (e) e.hidden = true; }

    function setLoading(btn, loading) {
      if (!btn) return;
      if (loading) {
        btn.dataset.origHtml = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Cargando…';
        btn.disabled = true;
      } else {
        if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
        btn.disabled = false;
      }
    }

    async function apiFetch(method, path, body) {
      var opts = { method: method, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
      if (body) opts.body = JSON.stringify(body);
      try {
        var res  = await fetch(API + path, opts);
        var data = {};
        try { data = await res.json(); } catch (_) {}
        return { ok: res.ok, status: res.status, data: data };
      } catch (err) {
        return { ok: false, status: 0, data: {}, err: err };
      }
    }

    // Step navigation
    var panels  = [null, el('bk-panel-1'), el('bk-panel-2'), el('bk-panel-3'), el('bk-panel-4')];
    var stepEls = nativeForm.querySelectorAll('.bk-step');

    function goToStep(n) {
      panels.forEach(function (p, i) { if (p) p.hidden = (i !== n); });
      stepEls.forEach(function (st, i) {
        st.classList.toggle('active', i + 1 === n);
        st.classList.toggle('done',   i + 1 < n);
      });
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ── Step 1 ────────────────────────────────────────────────────────────
    var selServicio = el('bk-servicio');
    var selSede     = el('bk-sede');
    var btnNext1    = el('bk-next-1');

    function checkStep1() { btnNext1.disabled = !(selServicio.value && selSede.value); }
    selServicio.addEventListener('change', function () { s.servicioCode = selServicio.value; checkStep1(); });
    selSede.addEventListener('change',     function () { s.sedeCode     = selSede.value;     checkStep1(); });

    btnNext1.addEventListener('click', function () {
      s.servicioCode = selServicio.value;
      s.sedeCode     = selSede.value;
      initDatePicker();
      goToStep(2);
    });

    // ── Step 2 ────────────────────────────────────────────────────────────
    var inputFecha = el('bk-fecha');
    var slotsGrid  = el('bk-slots-grid');
    var slotsHint  = el('bk-slots-hint');
    var btnBack2   = el('bk-back-2');
    var btnNext2   = el('bk-next-2');

    function isoDate(d) { return d.toISOString().split('T')[0]; }

    function initDatePicker() {
      var today = new Date(), max = new Date();
      max.setDate(today.getDate() + 60);
      inputFecha.min = isoDate(today);
      inputFecha.max = isoDate(max);
      inputFecha.value = '';
      slotsGrid.innerHTML = '';
      show(slotsHint);
      s.slot = null;
      btnNext2.disabled = true;
    }

    inputFecha.addEventListener('change', function () {
      s.fecha = inputFecha.value;
      s.slot  = null;
      btnNext2.disabled = true;
      loadSlots();
    });

    async function loadSlots() {
      if (!s.fecha) return;
      hide(slotsHint);
      slotsGrid.innerHTML =
        '<div class="bk-slots-loading"><span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Buscando horarios…</div>';

      var path = '/disponibilidad?sede=' + encodeURIComponent(s.sedeCode) +
                 '&fecha='    + encodeURIComponent(s.fecha) +
                 '&servicio=' + encodeURIComponent(s.servicioCode);
      var r = await apiFetch('GET', path);

      if (!r.ok) {
        var msg = 'No se pudieron cargar los horarios. Intentá de nuevo.';
        if (r.status === 404) msg = 'No encontramos esa sede. Volvé al paso anterior.';
        if (r.status === 400) msg = 'La fecha seleccionada está fuera del rango permitido.';
        slotsGrid.innerHTML = '<p class="bk-slots-empty">' + msg + '</p>';
        return;
      }

      var slots = Array.isArray(r.data.slots) ? r.data.slots : [];
      if (!slots.length) {
        slotsGrid.innerHTML = '<p class="bk-slots-empty">No hay turnos disponibles para esta fecha. Probá con otro día.</p>';
        return;
      }

      slotsGrid.innerHTML = '';
      slots.forEach(function (slot) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'bk-slot';
        btn.setAttribute('role', 'option');
        btn.setAttribute('aria-selected', 'false');
        btn.textContent = slot.hora_local || slot.start_at;
        btn.addEventListener('click', function () {
          slotsGrid.querySelectorAll('.bk-slot').forEach(function (b) {
            b.classList.remove('selected');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('selected');
          btn.setAttribute('aria-selected', 'true');
          s.slot = slot;
          btnNext2.disabled = false;
        });
        slotsGrid.appendChild(btn);
      });
    }

    btnBack2.addEventListener('click', function () { goToStep(1); });
    btnNext2.addEventListener('click', function () {
      if (!s.slot) return;
      resetStep3();
      goToStep(3);
    });

    // ── Step 3 ────────────────────────────────────────────────────────────
    var tabPhone       = el('bk-tab-phone');
    var tabDni         = el('bk-tab-dni');
    var panelPhone     = el('bk-panel-phone');
    var panelDni       = el('bk-panel-dni');
    var inputPhone     = el('bk-phone');
    var btnSendOtpPhone = el('bk-send-otp-phone');
    var inputDni       = el('bk-dni');
    var btnLookupDni   = el('bk-lookup-dni');
    var dniFound       = el('bk-dni-found');
    var dniNotFound    = el('bk-dni-not-found');
    var patientName    = el('bk-patient-name');
    var patientPhone   = el('bk-patient-phone');
    var btnSendOtpDni  = el('bk-send-otp-dni');
    var waFallbackLink = el('bk-wa-fallback');
    var otpSection     = el('bk-otp-section');
    var inputOtp       = el('bk-otp');
    var countdownEl    = el('bk-countdown');
    var btnResend      = el('bk-resend-otp');
    var step3Error     = el('bk-step3-error');
    var btnBack3       = el('bk-back-3');
    var btnConfirm     = el('bk-confirm');

    function resetStep3() {
      s.idMode = 'dni'; s.otpSent = false;
      switchTab('dni');
      hide(otpSection); hide(btnConfirm); hide(step3Error);
      hide(dniFound); hide(dniNotFound);
      if (inputPhone) inputPhone.value = '';
      if (inputDni)   inputDni.value   = '';
      if (inputOtp)   inputOtp.value   = '';
      clearCountdown();
    }

    function switchTab(tab) {
      s.idMode = tab;
      tabPhone.classList.toggle('active', tab === 'phone');
      tabPhone.setAttribute('aria-selected', String(tab === 'phone'));
      tabDni.classList.toggle('active', tab === 'dni');
      tabDni.setAttribute('aria-selected', String(tab === 'dni'));
      panelPhone.hidden = (tab !== 'phone');
      panelDni.hidden   = (tab !== 'dni');
      hide(otpSection); hide(btnConfirm); hide(step3Error);
      hide(dniFound); hide(dniNotFound);
      s.otpSent = false;
      clearCountdown();
    }

    tabPhone.addEventListener('click', function () { switchTab('phone'); });
    tabDni.addEventListener('click',   function () { switchTab('dni');   });

    btnSendOtpPhone.addEventListener('click', async function () {
      var phone = inputPhone.value.trim().replace(/\D/g, '');
      if (!phone) { showStep3Error('Ingresá tu número de WhatsApp.'); return; }
      s.phone = phone;
      hide(step3Error);
      setLoading(btnSendOtpPhone, true);
      var r = await apiFetch('POST', '/otp', { phone: phone });
      setLoading(btnSendOtpPhone, false);
      if (!r.ok) { showStep3Error('No se pudo enviar el código. Verificá el número e intentá de nuevo.'); return; }
      s.otpSent = true;
      showOtpSection();
    });

    btnLookupDni.addEventListener('click', async function () {
      var dni = inputDni.value.trim().replace(/\D/g, '');
      if (!dni) { showStep3Error('Ingresá tu DNI.'); return; }
      s.dni = dni;
      hide(step3Error); hide(dniFound); hide(dniNotFound); hide(otpSection); hide(btnConfirm);
      setLoading(btnLookupDni, true);
      var r = await apiFetch('POST', '/identificar-dni', { dni: dni });
      setLoading(btnLookupDni, false);
      if (!r.ok) { showStep3Error('Error al buscar el DNI. Intentá de nuevo.'); return; }
      if (r.data && r.data.found) {
        patientName.textContent  = r.data.nombre       || '';
        patientPhone.textContent = r.data.phone_masked || '';
        show(dniFound);
      } else {
        if (waFallbackLink) waFallbackLink.href = WA_FALLBACK;
        show(dniNotFound);
      }
    });

    btnSendOtpDni.addEventListener('click', async function () {
      hide(step3Error);
      setLoading(btnSendOtpDni, true);
      var r = await apiFetch('POST', '/otp', { dni: s.dni });
      setLoading(btnSendOtpDni, false);
      if (!r.ok) { showStep3Error('No se pudo enviar el código. Intentá de nuevo.'); return; }
      s.otpSent = true;
      showOtpSection();
    });

    function showOtpSection() {
      show(otpSection); show(btnConfirm);
      if (inputOtp) inputOtp.value = '';
      startCountdown();
    }

    function startCountdown() {
      clearCountdown();
      s.countdownSec = OTP_TTL;
      if (btnResend) btnResend.disabled = true;
      tick();
      s.countdownTimer = setInterval(tick, 1000);
      function tick() {
        if (s.countdownSec <= 0) {
          clearCountdown();
          if (countdownEl) countdownEl.textContent = ' El código expiró.';
          if (btnResend) btnResend.disabled = false;
          return;
        }
        var m = Math.floor(s.countdownSec / 60), sec = s.countdownSec % 60;
        if (countdownEl) countdownEl.textContent = ' Expira en ' + m + ':' + String(sec).padStart(2, '0');
        s.countdownSec--;
      }
    }

    function clearCountdown() {
      if (s.countdownTimer) { clearInterval(s.countdownTimer); s.countdownTimer = null; }
      if (countdownEl) countdownEl.textContent = '';
    }

    btnResend.addEventListener('click', async function () {
      btnResend.disabled = true;
      hide(step3Error);
      var body = (s.idMode === 'phone') ? { phone: s.phone } : { dni: s.dni };
      var r = await apiFetch('POST', '/otp', body);
      if (!r.ok) { showStep3Error('No se pudo reenviar el código. Intentá de nuevo.'); btnResend.disabled = false; return; }
      if (inputOtp) inputOtp.value = '';
      startCountdown();
    });

    function showStep3Error(msg) {
      if (!step3Error) return;
      step3Error.textContent = msg;
      show(step3Error);
    }

    btnBack3.addEventListener('click', function () { clearCountdown(); goToStep(2); });

    // ── Confirm (POST /reservar) ──────────────────────────────────────────
    var resultSuccess = el('bk-result-success');
    var resultWa      = el('bk-result-wa');
    var resultWaLink  = el('bk-result-wa-link');
    var tDatetime     = el('bk-t-datetime');
    var tSede         = el('bk-t-sede');
    var tServicio     = el('bk-t-servicio');

    btnConfirm.addEventListener('click', async function () {
      var otp = inputOtp ? inputOtp.value.trim() : '';
      if (otp.length !== 6) { showStep3Error('Ingresá el código de 6 dígitos que recibiste por WhatsApp.'); return; }
      hide(step3Error);
      setLoading(btnConfirm, true);

      var body = { sede_code: s.sedeCode, start_at: s.slot.start_at, servicio_code: s.servicioCode, otp_code: otp };
      if (s.idMode === 'phone') body.phone = s.phone;
      else                      body.dni   = s.dni;

      var r = await apiFetch('POST', '/reservar', body);
      setLoading(btnConfirm, false);
      var d = r.data || {};

      if (d.redirect_wa) {
        clearCountdown();
        if (resultWaLink) resultWaLink.href = d.redirect_wa;
        hide(resultSuccess); show(resultWa);
        goToStep(4); return;
      }

      if (d.ok === false || r.status === 409) {
        var errCode = d.error || '';
        if (errCode === 'otp_expired')     showStep3Error('El código expiró. Hacé clic en "Reenviar código".');
        else if (errCode === 'otp_invalid')     showStep3Error('Código incorrecto. Revisálo e intentá de nuevo.');
        else if (errCode === 'double_booking' || r.status === 409) showStep3Error('Ya tenés un turno en ese horario. Elegí otro.');
        else                               showStep3Error('No se pudo confirmar el turno. Intentá de nuevo.');
        return;
      }

      if (!r.ok) { showStep3Error('Error de conexión. Verificá tu red e intentá de nuevo.'); return; }

      if (d.ok && d.turno) {
        clearCountdown();
        var t = d.turno;
        if (tDatetime) tDatetime.textContent = t.hora_local    || t.start_at       || '';
        if (tSede)     tSede.textContent     = t.sede_nombre   || s.sedeCode;
        if (tServicio) tServicio.textContent = t.servicio_nombre || s.servicioCode;
        show(resultSuccess); hide(resultWa);
        goToStep(4);
      }
    });

    // ── New booking (step 4 → step 1) ─────────────────────────────────────
    var btnNew = el('bk-new');
    if (btnNew) {
      btnNew.addEventListener('click', function () {
        selServicio.value = ''; selSede.value = '';
        s.sedeCode = ''; s.servicioCode = ''; s.slot = null; s.fecha = '';
        checkStep1();
        hide(resultSuccess); hide(resultWa);
        goToStep(1);
      });
    }

    // ── Init: fetch /booking-config ────────────────────────────────────────
    async function init() {
      try {
        var r = await apiFetch('GET', '/booking-config');
        if (!r.ok) throw new Error('booking-config HTTP ' + r.status);

        var data = r.data || {};
        (Array.isArray(data.servicios) ? data.servicios : []).forEach(function (sv) {
          var opt = document.createElement('option');
          opt.value = sv.code; opt.textContent = sv.nombre;
          selServicio.appendChild(opt);
        });
        (Array.isArray(data.sedes) ? data.sedes : []).forEach(function (sd) {
          var opt = document.createElement('option');
          opt.value = sd.code;
          opt.textContent = sd.nombre + (sd.ciudad ? ' — ' + sd.ciudad : '');
          selSede.appendChild(opt);
        });

        s.servicios = data.servicios || [];
        s.sedes     = data.sedes     || [];

        show(nativeForm);
        wrapper.classList.add('is-loaded');
        goToStep(1);

      } catch (_) {
        var sk = document.getElementById('booking-skeleton');
        if (sk) {
          sk.innerHTML =
            '<i class="bi bi-exclamation-triangle" style="font-size:2rem;color:var(--accent-strong)" aria-hidden="true"></i>' +
            '<p class="booking-skeleton-text">No se pudo cargar el sistema de turnos.</p>' +
            '<a href="' + WA_FALLBACK + '" target="_blank" rel="noopener noreferrer" ' +
            'class="btn btn-appointment btn-sm mt-2" style="position:relative;z-index:1">' +
            '<i class="bi bi-whatsapp me-1" aria-hidden="true"></i>Reservar por WhatsApp</a>';
          sk.removeAttribute('aria-hidden');
        }
      }
    }

    init();
  })();

})();