// Unified include.js for AlbaSpace website (Turkish)
//
// This script dynamically loads header and footer fragments, highlights the
// current navigation item, provides a language switcher, keeps model-viewer
// available with a fallback, and enhances the footer with neatly styled address
// buttons and a call shortcut.

runAfterDomReady(() => {
  // Ensure a valid favicon is present
  (function ensureFavicon() {
    try {
      const existing = document.querySelector('link[rel~="icon"]');
      if (existing) {
        if (existing.getAttribute('href') === '/favicon.png') {
          existing.setAttribute('href', '/assets/images/albalogo.png');
        }
        return;
      }
      const l = document.createElement('link');
      l.rel = 'icon';
      l.type = 'image/png';
      l.href = '/assets/images/albalogo.png';
      document.head.appendChild(l);
    } catch (e) {
      /* silently ignore DOM issues */
    }
  })();

  // Загружаем CSS и скрипт для model-viewer без проверки includes
  injectModelViewerStyles();
  ensureModelViewerLoaded();

  // Создаём лоадеры для прелоадера и навигации 3D моделей
  const ensurePreloaderScript  = createPreloaderLoader();
  const ensureModelPreloader  = createModelPreloaderLoader();
  const ensureModelNavLoader  = createModelNavLoader();

  // ---------------- Mobile nav override ----------------
  if (!document.getElementById("albaspace-nav-override-style")) {
    const navStyle = document.createElement("style");
    navStyle.id = "albaspace-nav-override-style";
    navStyle.textContent = `
      @media (max-width: 768px) {
        nav.main-nav {
          position: absolute;
          top: calc(100% + 10px);
          right: 12px;
          width: 33vw;
          max-width: 420px;
          min-width: 220px;
          background: #020617;
          border: 1px solid rgba(15, 23, 42, 0.8);
          border-radius: 10px;
          box-shadow: 0 18px 45px rgba(56,189,248,0.25);
          flex-direction: column;
          padding: 8px 0;
          z-index: 1001;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          opacity: 0;
          transform: translateY(-8px);
          transform-origin: top center;
          transition: opacity .28s ease, transform .28s ease;
          pointer-events: none;
          overflow: hidden;
          will-change: opacity, transform;
        }
        nav.main-nav.nav-open {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        nav.main-nav a {
          padding: 12px 18px;
          font-size: 14px;
          border-bottom: 1px solid rgba(15,23,42,0.6);
          color: var(--text-main);
          display: block;
        }
        nav.main-nav a:last-child { border-bottom: none; }
      }
    `;
    document.head.appendChild(navStyle);
  }

  // ---------------- Load includes ----------------
  // Поддерживаем атрибуты data-include и data-include-html
  const includes = document.querySelectorAll("[data-include], [data-include-html]");
  if (includes.length) {
    includes.forEach((el) => {
      const url = el.getAttribute("data-include") || el.getAttribute("data-include-html");
      if (!url) return;
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load " + url + " (" + res.status + ")");
          return res.text();
        })
        .then((html) => {
          el.innerHTML = html;
          if (url.includes("header-")) {
            // выполняем навигацию, переключатель языка и лоадеры
            markActiveNav();
            setupLangSwitch();
            ensurePreloaderScript();
            ensureModelPreloader();
            ensureModelNavLoader();
          }
          if (url.includes("footer-")) {
            enhanceFooter(el);
            ensureModelPreloader();
          }
        })
        .catch(console.error);
    });
  } else {
    // если includes нет, всё равно загружаем базовый прелоадер для model-viewer
    ensureModelPreloader();
  }

  // ===== GLOBAL AI WIDGET (Albamen / Albaman) =====
  injectAiWidget();
  function injectAiWidget() {
    const path = window.location.pathname || '/';
    const isEn = path.startsWith('/eng/');

    // Локализованные строки
    const strings = isEn ? {
      placeholder      : 'Send a message...',
      listening        : 'Listening...',
      initialStatus    : 'How can I help you today?',
      welcomeBack      : 'Welcome back, ',
      voiceNotSupported: 'Voice not supported'
    } : {
      placeholder      : 'Bir mesaj yazın...',
      listening        : 'Dinliyorum...',
      initialStatus    : 'Bugün sana nasıl yardım edebilirim?',
      welcomeBack      : 'Tekrar hoş geldin, ',
      voiceNotSupported: 'Ses desteği yok'
    };

    // Проверяем, не создан ли виджет ранее
    if (document.getElementById('ai-floating-global')) return;

    // Попытка получить сохранённое имя/возраст (для приветствия)
    const storedName = localStorage.getItem('albamen_user_name');
    const storedAge  = localStorage.getItem('albamen_user_age');
    if (storedName) {
      strings.initialStatus = strings.welcomeBack + storedName + "! 🚀";
    }

    // Создаём блок с аватаром и кнопкой вызова
    const floating = document.createElement('div');
    floating.className = 'ai-floating';
    floating.id = 'ai-floating-global';
    const avatarSrc = '/assets/images/albamenai.jpg';
    floating.innerHTML = `
      <div class="ai-hero-avatar" id="ai-avatar-trigger">
        <img src="${avatarSrc}" alt="Albamen AI">
      </div>
      <button class="ai-call-btn pulse" id="ai-call-trigger" aria-label="Call AI">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
      </button>
    `;

    // Закрепляем плавающий блок либо у футера, либо в body
    const footerHost = document.querySelector('footer');
    if (footerHost && getComputedStyle(footerHost).position !== 'fixed') {
       if (getComputedStyle(footerHost).position === 'static') footerHost.style.position = 'relative';
       floating.classList.add('footer-docked');
       footerHost.appendChild(floating);
    } else {
       document.body.appendChild(floating);
    }

    // Создаём панель чата
    const panel = document.createElement('div');
    panel.className = 'ai-panel-global';
    panel.innerHTML = `
      <div class="ai-panel-header">
        <button class="ai-close-icon" id="ai-close-btn">×</button>
      </div>
      <div class="ai-panel-body">
        <div class="ai-messages-list" id="ai-messages-list"></div>
        <div class="ai-chat-avatar-large"><img src="${avatarSrc}" alt="Albamen"></div>
        <div class="ai-status-text" id="ai-status-text">${strings.initialStatus}</div>
        <div class="ai-input-area">
          <button class="ai-action-btn ai-mic-btn-panel" id="ai-mic-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </button>
          <input type="text" class="ai-input" id="ai-input-field" placeholder="${strings.placeholder}">
          <button class="ai-action-btn ai-send-btn-panel" id="ai-send-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Получаем ссылки на элементы
    const avatarTrigger  = document.getElementById('ai-avatar-trigger');
    const callTrigger    = document.getElementById('ai-call-trigger');
    const closeBtn       = document.getElementById('ai-close-btn');
    const sendBtn        = document.getElementById('ai-send-btn');
    const micBtn         = document.getElementById('ai-mic-btn');
    const inputField     = document.getElementById('ai-input-field');
    const msgList        = document.getElementById('ai-messages-list');
    const statusText     = document.getElementById('ai-status-text');

    // Функции открытия и закрытия панели
    const openPanel  = () => panel.classList.add('ai-open');
    const closePanel = () => {
      panel.classList.remove('ai-open');
      panel.classList.remove('chat-active');
      statusText.style.display = 'block';
    };

    // Навешиваем обработчики
    avatarTrigger.addEventListener('click', openPanel);
    callTrigger.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);

    // === Отправка сообщения с обработкой тегов <SAVE_NAME:...> и <SAVE_AGE:...> ===
    function sendMessage() {
      const txt = inputField.value.trim();
      if (!txt) return;
      panel.classList.add('chat-active');
      addMessage(txt, 'user');
      inputField.value = '';
      const loadingId = 'loading-' + Date.now();
      addMessage("...", 'bot', loadingId);

      // Считываем актуальные сохранённые значения
      const currentName = localStorage.getItem('albamen_user_name');
      const currentAge  = localStorage.getItem('albamen_user_age');

      const workerUrl = 'https://divine-flower-a0ae.nncdecdgc.workers.dev';
      fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message  : txt,
          savedName: currentName,
          savedAge : currentAge
        })
      })
      .then(res => res.json())
      .then(data => {
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();
        if (data.reply) {
          let finalReply = data.reply;

          // Обработка тега <SAVE_NAME:...>
          const nameMatch = finalReply.match(/<SAVE_NAME:(.*?)>/);
          if (nameMatch) {
            const newName = nameMatch[1].trim();
            localStorage.setItem('albamen_user_name', newName);
            finalReply = finalReply.replace(nameMatch[0], '');
          }

          // Обработка тега <SAVE_AGE:...>
          const ageMatch = finalReply.match(/<SAVE_AGE:(.*?)>/);
          if (ageMatch) {
            const newAge = ageMatch[1].trim();
            localStorage.setItem('albamen_user_age', newAge);
            finalReply = finalReply.replace(ageMatch[0], '');
          }
          addMessage(finalReply.trim(), 'bot');
        } else {
          addMessage("Error: AI silent.", 'bot');
        }
      })
      .catch(err => {
        console.error("AI Error:", err);
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();
        addMessage("Connection error.", 'bot');
      });
    }

    // Функция добавления сообщения в список
    function addMessage(text, type, id = null) {
      const div = document.createElement('div');
      div.className = `ai-msg ${type}`;
      div.textContent = text;
      if (id) div.id = id;
      msgList.appendChild(div);
      msgList.scrollTop = msgList.scrollHeight;
    }

    // Обработчики ввода
    sendBtn.addEventListener('click', sendMessage);
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
    micBtn.addEventListener('click', () => {
      panel.classList.add('chat-active');
      statusText.textContent = strings.listening;
      inputField.focus();
    });
  }

  // Вызов прелоадера ещё раз, если есть model-viewer прямо на странице
  ensureModelPreloader();
});

// -------------------- HELPER FUNCTIONS --------------------

// Вызывает функцию, когда DOM готов (или сразу, если уже готов)
function runAfterDomReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

// ... Далее идут функции injectModelViewerStyles, ensureModelViewerLoaded,
// createPreloaderLoader, createModelPreloaderLoader, createModelNavLoader,
// markActiveNav, normalizePath, setupLangSwitch, toEnPath, toTrPath,
// enhanceFooter, buildMapButton, extractSection, findPhone,
// escapeHtml, injectFooterStyles – они остались без изменений.
