/**
* Botulinic — Envío de formularios a webhook
* Desarrollado por Brain Software Factory — https://brain.com.ar
*
* Serializa los campos del formulario y los envía en JSON al webhook
* indicado en el atributo data-webhook. Usa .loading, .error-message
* y .sent-message para el feedback visual.
*/
(function () {
  "use strict";

  document.querySelectorAll('form[data-webhook]').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      let webhookUrl = form.getAttribute('data-webhook');
      let loadingEl = form.querySelector('.loading');
      let errorEl = form.querySelector('.error-message');
      let sentEl = form.querySelector('.sent-message');

      if (loadingEl) loadingEl.classList.add('d-block');
      if (errorEl) errorEl.classList.remove('d-block');
      if (sentEl) sentEl.classList.remove('d-block');

      let payload = {};
      new FormData(form).forEach(function (value, key) {
        payload[key] = value;
      });

      fetch(webhookUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' }
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error(response.status + ' ' + response.statusText);
          }
          if (loadingEl) loadingEl.classList.remove('d-block');
          if (sentEl) sentEl.classList.add('d-block');
          form.reset();
        })
        .catch(function (error) {
          if (loadingEl) loadingEl.classList.remove('d-block');
          if (errorEl) {
            errorEl.innerHTML = error.message || String(error);
            errorEl.classList.add('d-block');
          }
        });
    });
  });

})();
