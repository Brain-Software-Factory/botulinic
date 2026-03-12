/**
 * Chat Widget - Widget de chatbot integrado
 * Respeta variables del tema; config vía window.ChatWidgetConfig
 */
(function () {
  "use strict";

  var defaultConfig = {
    webhook: {
      url: "https://webhook.botulinic.com.ar/webhook/c1a6f9ab-421d-47f6-91f4-8270439d5067/chat",
      route: "general",
    },
    style: {
      primaryColor: null,
      secondaryColor: null,
      position: "right",
      backgroundColor: null,
      fontColor: null,
    },
  };

  var config = (function mergeConfig() {
    var user = window.ChatWidgetConfig || {};
    return {
      webhook: Object.assign({}, defaultConfig.webhook, user.webhook),
      style: Object.assign({}, defaultConfig.style, user.style),
    };
  })();

  function injectStyles() {
    var script = document.currentScript;
    if (!script || !script.src) return;
    var cssHref = script.src.replace(/\/js\/[^/]*$/, "/css/chat-widget.css");
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssHref;
    document.head.appendChild(link);
  }

  function getChatId() {
    var chatId = sessionStorage.getItem("chatId");
    if (!chatId) {
      chatId = "chat_" + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem("chatId", chatId);
    }
    return chatId;
  }

  function applyStyleOverrides(container, button) {
    var primary = config.style.primaryColor;
    if (!primary) return;
    var header = container.querySelector(".chat-widget__header");
    var sendBtn = container.querySelector(".chat-widget__send");
    if (header) header.style.backgroundColor = primary;
    if (button) button.style.backgroundColor = primary;
    if (sendBtn) sendBtn.style.backgroundColor = primary;
  }

  function createMarkup() {
    var container = document.createElement("div");
    container.className = "chat-widget-container";
    container.id = "chat-widget-container";
    container.setAttribute("aria-hidden", "true");

    container.innerHTML =
      '<div class="chat-widget__header">' +
      '<span>Chat</span>' +
      '<button type="button" class="chat-widget__close" aria-label="Cerrar chat">✖</button>' +
      "</div>" +
      '<div class="chat-widget__body" id="chat-widget-body">' +
      '<p class="chat-widget__message-bot"><strong>Hola 👋, ¿en qué podemos ayudarte?</strong></p>' +
      "</div>" +
      '<div class="chat-widget__footer">' +
      '<input type="text" class="chat-widget__input" id="chat-widget-input" placeholder="Escribí tu mensaje..." autocomplete="off">' +
      '<button type="button" class="chat-widget__send" id="chat-widget-send">Enviar</button>' +
      "</div>";

    var bubble = document.createElement("button");
    bubble.type = "button";
    bubble.className = "chat-widget-button";
    bubble.id = "chat-widget-button";
    bubble.setAttribute("aria-label", "Abrir chat");
    bubble.innerHTML = "💬";

    document.body.appendChild(container);
    document.body.appendChild(bubble);

    applyStyleOverrides(container, bubble);

    return { container: container, bubble: bubble };
  }

  function openWidget(container, bubble) {
    container.classList.add("chat-widget-open");
    container.style.display = "flex";
    bubble.classList.add("chat-widget-hidden");
    container.setAttribute("aria-hidden", "false");
  }

  function closeWidget(container, bubble) {
    container.classList.remove("chat-widget-open");
    container.style.display = "none";
    bubble.classList.remove("chat-widget-hidden");
    container.setAttribute("aria-hidden", "true");
  }

  window.closeChatWidget = function () {
    var container = document.getElementById("chat-widget-container");
    var bubble = document.getElementById("chat-widget-button");
    if (container && bubble) closeWidget(container, bubble);
  };

  function sendMessage(bodyEl, inputEl) {
    var message = (inputEl.value || "").trim();
    if (!message) return;

    var userMsg = document.createElement("p");
    userMsg.className = "chat-widget__message-user";
    userMsg.textContent = message;
    bodyEl.appendChild(userMsg);

    inputEl.value = "";
    var sendBtn = document.getElementById("chat-widget-send");
    if (sendBtn) {
      sendBtn.disabled = true;
    }

    fetch(config.webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: getChatId(),
        message: message,
        route: config.webhook.route,
      }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        var botMsg = document.createElement("p");
        botMsg.className = "chat-widget__message-bot";
        botMsg.innerHTML = data.output || "Disculpá, no pude entender eso.";
        if (config.style.primaryColor) {
          botMsg.style.background = config.style.primaryColor;
        }
        bodyEl.appendChild(botMsg);
        bodyEl.scrollTop = bodyEl.scrollHeight;
      })
      .catch(function (err) {
        var errMsg = document.createElement("p");
        errMsg.className = "chat-widget__message-bot";
        errMsg.textContent = "Disculpá, hubo un error. Intentá de nuevo.";
        if (config.style.primaryColor) {
          errMsg.style.background = config.style.primaryColor;
        }
        bodyEl.appendChild(errMsg);
        bodyEl.scrollTop = bodyEl.scrollHeight;
        console.error("Chat widget error:", err);
      })
      .finally(function () {
        if (sendBtn) sendBtn.disabled = false;
      });
  }

  function init() {
    injectStyles();
    var nodes = createMarkup();
    var container = nodes.container;
    var bubble = nodes.bubble;
    var bodyEl = document.getElementById("chat-widget-body");
    var inputEl = document.getElementById("chat-widget-input");

    bubble.addEventListener("click", function () {
      openWidget(container, bubble);
      if (inputEl) inputEl.focus();
    });

    container.querySelector(".chat-widget__close").addEventListener("click", function () {
      closeWidget(container, bubble);
    });

    document.getElementById("chat-widget-send").addEventListener("click", function () {
      sendMessage(bodyEl, inputEl);
    });

    if (inputEl) {
      inputEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          sendMessage(bodyEl, inputEl);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
