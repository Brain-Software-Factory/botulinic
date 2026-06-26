/**
 * Configuración del sitio — endpoints según entorno.
 *
 * Única fuente de verdad para las URLs externas que usa el sitio. Se carga
 * ANTES que sus consumidores (form-webhook.js, main.js, chat-widget.js), así que
 * debe incluirse primero en el bloque de <script> de cada página.
 *
 * `apiBase` apunta a la API pública de Platform según el entorno:
 *   - producción (botulinic.com.ar / www): plataforma de producción.
 *   - cualquier otro host (dev/staging/local): plataforma de desarrollo.
 * El archivo es idéntico en todas las ramas, de modo que un merge develop → main
 * nunca lo pisa.
 *
 * `waFallback` es el número de WhatsApp al que se redirige cuando el paciente
 * no existe en la base o el sistema de turnos no está disponible.
 */
(function () {
  "use strict";

  var host = window.location.hostname;
  var isProd = host === "botulinic.com.ar" || host === "www.botulinic.com.ar";

  window.SITE_CONFIG = {
    apiBase: isProd
      ? "https://platform.botulinic.com.ar/api/public"
      : "https://platformdev.brain.com.ar/api/public",
    waFallback: "https://wa.me/5491162633886",
    chatWebhook:
      "https://webhook.botulinic.com.ar/webhook/c1a6f9ab-421d-47f6-91f4-8270439d5067/chat",
    formWebhook: "https://webhook.botulinic.com.ar/webhook/form-web"
  };
})();
