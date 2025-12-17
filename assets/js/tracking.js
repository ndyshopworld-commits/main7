document.addEventListener('DOMContentLoaded', function () {
  // ---------- 1. КЛИК ПО WHATSAPP В ХЕДЕРЕ ----------
  var waLink = document.querySelector('a[data-track="whatsapp"]');
  if (waLink) {
    waLink.addEventListener('click', function () {
      // GA4
      if (typeof gtag === 'function') {
        gtag('event', 'click_whatsapp', {
          event_category: 'contact',
          event_label: 'header_whatsapp'
        });
      }
      // Yandex.Metrika
      if (typeof ym === 'function') {
        ym(105726731, 'reachGoal', 'click_whatsapp_header');
      }
    });
  }

  // ---------- 2. ОТПРАВКА ФОРМЫ ОБРАТНОЙ СВЯЗИ ----------
  var contactForm = document.querySelector('form[data-track="contact_form"]');
  if (contactForm) {
    contactForm.addEventListener('submit', function () {
      var formName = contactForm.getAttribute('data-form-name') || 'contact_basic';

      // GA4
      if (typeof gtag === 'function') {
        gtag('event', 'submit_contact_form', {
          event_category: 'contact',
          event_label: formName
        });
      }

      // Yandex.Metrika
      if (typeof ym === 'function') {
        ym(105726731, 'reachGoal', 'submit_contact_form');
      }
      // Ничего не мешаем: форма отправится как обычно
    });
  }

  // ---------- 3. ПРОСМОТР 3D-МОДЕЛИ ----------
  var modelViewer = document.querySelector('model-viewer[data-model-name]');
  if (modelViewer) {
    var sent = false;
    var modelName = modelViewer.getAttribute('data-model-name') || 'unknown';

    var send3DViewEvent = function () {
      if (sent) return;
      sent = true;

      // GA4
      if (typeof gtag === 'function') {
        gtag('event', 'view_3d_model', {
          event_category: '3d',
          event_label: modelName
        });
      }

      // Yandex.Metrika
      if (typeof ym === 'function') {
        ym(105726731, 'reachGoal', 'view_3d_model_' + modelName);
      }
    };

    // Когда модель загрузилась
    modelViewer.addEventListener('load', send3DViewEvent);

    // На всякий случай — если событие 'load' не сработало,
    // всё равно отправим через 5 секунд после загрузки страницы
    setTimeout(send3DViewEvent, 5000);
  }
});