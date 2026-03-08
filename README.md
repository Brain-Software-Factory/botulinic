# Botulinic

Sitio web corporativo estático para **Botulinic**, construido como landing multipágina con HTML, CSS y JavaScript vanilla sobre el template Medinest (BootstrapMade). Diseñado para desplegarse en entornos estáticos (por ejemplo, nginx) sin backend.

---

## Contenido

- [Requisitos](#requisitos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Tecnologías](#tecnologías)
- [Ejecución local](#ejecución-local)
- [Despliegue](#despliegue)
- [Formulario de contacto y webhook](#formulario-de-contacto-y-webhook)
- [Chat widget](#chat-widget)
- [Páginas](#páginas)
- [Personalización](#personalización)
- [Licencia y créditos](#licencia-y-créditos)

---

## Requisitos

- Navegador moderno con soporte para ES5+ y `fetch`.
- Para servir en local: cualquier servidor HTTP estático (por ejemplo, `npx serve`, Python `http.server`, nginx, etc.).

No se requiere Node.js, PHP ni ningún backend para el funcionamiento del sitio en producción.

---

## Estructura del proyecto

```
botulinic/
├── index.html              # Página de inicio
├── about.html              # Nosotros
├── contact.html            # Contacto (formulario → webhook)
├── appointment.html        # Turnos
├── departments.html        # Departamentos
├── department-details.html # Detalle de departamento
├── services.html           # Servicios
├── service-details.html    # Detalle de servicio
├── doctors.html            # Profesionales
├── testimonials.html       # Testimonios
├── faq.html                # Preguntas frecuentes
├── gallery.html            # Galería
├── terms.html              # Términos y condiciones
├── privacy.html            # Política de privacidad
├── 404.html                # Página de error
├── assets/
│   ├── css/
│   │   ├── main.css        # Estilos principales y variables del tema
│   │   └── chat-widget.css # Estilos del widget de chat
│   ├── js/
│   │   ├── main.js         # Navegación, AOS, Isotope, Swiper, FAQ, etc.
│   │   └── chat-widget.js  # Widget de chat (webhook)
│   ├── img/                # Imágenes y favicon
│   └── vendor/             # Bootstrap, iconos, AOS, GLightbox, Swiper, etc.
│       └── php-email-form/
│           └── validate.js # Validación y envío de formularios (webhook/FormData)
└── forms/                  # Scripts PHP (opcionales; contacto usa webhook)
    ├── contact.php
    └── appointment.php
```

---

## Tecnologías

| Capa        | Tecnología |
|------------|------------|
| **Marcado** | HTML5, estructura semántica, `lang="es"` |
| **Estilos** | CSS3, variables CSS (`main.css`), Bootstrap 5.3.7 |
| **Scripts** | JavaScript vanilla (sin frameworks), IIFE, `"use strict"` |
| **Fuentes** | Google Fonts: Roboto, Poppins, Ubuntu |
| **Componentes** | Bootstrap 5, Bootstrap Icons, Font Awesome, AOS, GLightbox, Swiper, PureCounter, Isotope, ImagesLoaded |
| **Formularios** | Envío vía `fetch()`: contacto → webhook JSON; turnos → FormData a `action` (PHP si está disponible) |

Template base: [Medinest](https://bootstrapmade.com/medinest-bootstrap-hospital-template/) (BootstrapMade), adaptado como Botulinic.

---

## Ejecución local

Desde la raíz del repositorio:

```bash
# Con npx (Node.js instalado)
npx serve .

# Con Python 3
python3 -m http.server 8000

# Con PHP
php -S localhost:8000
```

Abrir en el navegador la URL indicada (por ejemplo `http://localhost:3000` o `http://localhost:8000`). El formulario de contacto y el chat funcionan contra los webhooks configurados en el código; no hace falta backend.

---

## Despliegue

El sitio es **100 % estático**. Se puede desplegar en:

- **Nginx**: apuntar `root` (o `alias`) a la carpeta del proyecto y configurar `index index.html` y, si se desea, reglas para SPA/404 (por ejemplo, devolver `404.html` para rutas no encontradas).
- **Apache**: habilitar `mod_rewrite` si se usan URLs amigables; por defecto los enlaces son a `.html`.
- **CDN / hosting estático**: Netlify, Vercel, GitHub Pages, S3 + CloudFront, etc. Subir la carpeta tal cual; no se requiere build.

No es necesario configurar PHP ni otro backend para que el formulario de contacto funcione: el envío se hace por JavaScript al webhook indicado más abajo.

---

## Formulario de contacto y webhook

El formulario de la página **Contacto** (`contact.html`) no utiliza backend propio. El envío se hace desde el navegador con `fetch()` en **JSON** a un webhook externo.

- **URL del webhook:**  
  `https://webhookdev.brain.com.ar/webhook/form-web`
- **Método:** `POST`
- **Cabecera:** `Content-Type: application/json`
- **Campos enviados:** `name`, `email`, `subject`, `message`

Ejemplo de cuerpo:

```json
{
  "name": "Nombre del usuario",
  "email": "usuario@ejemplo.com",
  "subject": "Asunto del mensaje",
  "message": "Texto del mensaje"
}
```

Implementación:

- El `<form>` incluye el atributo `data-webhook` con la URL del webhook.
- El script `assets/vendor/php-email-form/validate.js` detecta formularios con `data-webhook`, serializa los campos en JSON y los envía con `fetch()`. Reutiliza los elementos `.loading`, `.error-message` y `.sent-message` del template para feedback visual.

Para cambiar el webhook, editar en `contact.html` el valor de `data-webhook` en el formulario de contacto.

---

## Chat widget

El sitio incluye un widget de chat integrado (`assets/js/chat-widget.js` y `assets/css/chat-widget.css`) que envía mensajes a un webhook configurable. La configuración por defecto está en el script; se puede sobreescribir definiendo `window.ChatWidgetConfig` antes de cargar el script, con opciones de `webhook` (URL, ruta) y `style` (colores, posición, etc.). El `chatId` se persiste en `sessionStorage`.

---

## Páginas

| Página | Descripción |
|--------|-------------|
| **Inicio** | Hero, estadísticas, llamados a la acción, servicios y departamentos |
| **Nosotros** | Presentación de la organización |
| **Departamentos** | Listado y detalle de departamentos |
| **Servicios** | Listado y detalle de servicios |
| **Profesionales** | Equipo médico o staff |
| **Turnos** | Formulario de solicitud de citas |
| **Contacto** | Formulario de contacto (envío a webhook) |
| **Testimonios** | Opiniones de pacientes o clientes |
| **FAQ** | Preguntas frecuentes |
| **Galería** | Galería de imágenes |
| **Términos** / **Privacidad** | Avisos legales |
| **404** | Página de error no encontrado |

La navegación (header fijo, menú desktop y móvil, dropdowns) y el footer se repiten en todas las páginas; el contenido central y la clase del `body` (por ejemplo `contact-page`) varían por sección.

---

## Personalización

- **Tema y colores:** en `assets/css/main.css` se definen variables CSS en `:root` (por ejemplo `--accent-color`, `--heading-color`, fuentes). Modificarlas actualiza el aspecto global.
- **Contenido:** editar directamente los HTML y, si aplica, los textos e imágenes en `assets/img/`.
- **Formulario de contacto:** cambiar la URL del webhook en el atributo `data-webhook` del formulario en `contact.html`.
- **Chat:** ajustar `window.ChatWidgetConfig` o las variables por defecto en `assets/js/chat-widget.js`.

No se usan procesos de build; los cambios se reflejan al recargar o al volver a desplegar los archivos estáticos.

---

## Licencia y créditos

- **Template:** [Medinest](https://bootstrapmade.com/medinest-bootstrap-hospital-template/) — BootstrapMade  
- **Licencia del template:** [BootstrapMade License](https://bootstrapmade.com/license/)  
- **Sitio / marca:** Botulinic  
- **Desarrollo:** [Brain Software Factory](https://brain.com.ar)

El formulario de contacto utiliza envío a webhook en JSON (implementación propia sobre el flujo del template). El resto de la estructura y estilos del template se mantienen según la licencia de BootstrapMade.
