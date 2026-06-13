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
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
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
  window.addEventListener('load', aosInit);

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
   * Booking widget — native integration
   *
   * 1) Skeleton/spinner de marca: se oculta cuando el iframe dispara `load`
   *    (agregamos .is-loaded al wrapper; el CSS lo desvanece).
   * 2) Auto-resize por postMessage: el widget puede emitir su altura desde su
   *    origin. Validamos el origin por seguridad y ajustamos la altura del iframe,
   *    con un mínimo de respaldo para que nunca colapse.
   */
  (function bookingWidget() {
    const iframe = document.getElementById('booking-widget');
    if (!iframe) return;

    const wrapper = document.getElementById('booking-wrapper');
    const config = window.SITE_CONFIG || {};
    const bookingUrl = config.bookingUrl;
    if (!bookingUrl) return; // sin URL configurada no hay widget que cargar

    // El origin de confianza para el postMessage se deriva de la URL del widget
    // (assets/js/config.js), así prod y dev quedan cubiertos sin hardcodear nada.
    const ALLOWED_ORIGIN = new URL(bookingUrl).origin;
    const MIN_HEIGHT = 540; // px — respaldo: el widget nunca queda más bajo que esto

    // 1) Ocultar el skeleton al cargar el iframe
    function markLoaded() {
      if (wrapper) wrapper.classList.add('is-loaded');
    }
    iframe.addEventListener('load', markLoaded);
    // La URL del widget vive en config.js; la asignamos tras enganchar el listener
    // de `load` para no perder el evento si el recurso viene de caché.
    iframe.src = bookingUrl;
    // Respaldo: si el `load` ya ocurrió o tarda demasiado, ocultamos igual
    if (iframe.contentWindow && iframe.contentDocument &&
      iframe.contentDocument.readyState === 'complete') {
      markLoaded();
    }
    setTimeout(markLoaded, 8000);

    // 2) Auto-resize seguro por postMessage
    window.addEventListener('message', function (event) {
      if (event.origin !== ALLOWED_ORIGIN) return; // guarda de seguridad

      const data = event.data;
      let height = null;

      if (typeof data === 'number') {
        height = data;
      } else if (data && typeof data === 'object') {
        // Aceptamos varias convenciones de payload sin acoplarnos a una sola
        height = data.height || data.frameHeight ||
          (data.type === 'resize' ? data.value : null);
      }

      height = parseInt(height, 10);
      if (!height || isNaN(height)) return;

      iframe.style.height = Math.max(height, MIN_HEIGHT) + 'px';
    });
  })();

})();