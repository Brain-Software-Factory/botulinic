/**
 * Configuración del sitio — endpoints según entorno.
 *
 * Única fuente de verdad para las URLs externas que usa el sitio. Se carga
 * ANTES que sus consumidores (form-webhook.js, main.js, chat-widget.js), así que
 * debe incluirse primero en el bloque de <script> de cada página.
 *
 * `bookingUrl` es el único endpoint que cambia entre entornos, por eso se elige
 * según el hostname: producción (botulinic.com.ar) vs la plataforma dev/staging.
 * El archivo es idéntico en todas las ramas, de modo que un merge develop -> main
 * nunca lo pisa.
 */
(function () {
  "use strict";

  var host = window.location.hostname;
  var isProd = host === "botulinic.com.ar" || host === "www.botulinic.com.ar";

  window.SITE_CONFIG = {
    bookingUrl: isProd
      ? "https://platform.botulinic.com.ar/book?layout=fixed"
      : "https://platformdev.brain.com.ar/book?layout=fixed",
    chatWebhook:
      "https://webhook.botulinic.com.ar/webhook/c1a6f9ab-421d-47f6-91f4-8270439d5067/chat",
    formWebhook: "https://webhook.botulinic.com.ar/webhook/form-web"
  };
})();
