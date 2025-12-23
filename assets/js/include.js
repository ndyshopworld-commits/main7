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

      // robust include loader with fallback for absolute/relative paths
      const tryPaths = [url];
      if (url.startsWith("/")) {
        tryPaths.push(url.slice(1)); // fallback to relative path when served from sub-folders/CDNs
      }

      const loadFragment = async () => {
        let html = "";
        let lastErr;
        for (const path of tryPaths) {
          try {
            const res = await fetch(path, { cache: "no-cache" });
            if (!res.ok) throw new Error("Failed " + res.status + " for " + path);
            html = await res.text();
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (!html) throw lastErr || new Error("Unknown include error for " + url);
        el.innerHTML = html;
      };

      loadFragment()
        .then(() => {
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
        .catch((err) => console.error("[include.js] include failed", url, err));
    });
  } else {
    // если includes нет, всё равно загружаем базовый прелоадер для model-viewer
    ensureModelPreloader();
  }

  // ===== GLOBAL AI WIDGET (Albamen / Albaman) =====
  injectAiWidget();
  ensureAiWidgetPinned();

  function injectAiWidget() {
    const path = window.location.pathname || '/';
    const isEn = path.startsWith('/eng/');

    // Тексты
    const strings = isEn ? {
      placeholder: 'Send a message...',
      listening: 'Listening...',
      connect: 'Connecting...',
      initialStatus: 'How can I help you today?',
      welcomeBack: 'Welcome back, ',
      voiceNotSupported: 'Voice not supported',
      connectionError: 'Connection error.'
    } : {
      placeholder: 'Bir mesaj yazın...',
      listening: 'Dinliyorum...',
      connect: 'Bağlanıyor...',
      initialStatus: 'Bugün sana nasıl yardım edebilirim?',
      welcomeBack: 'Tekrar hoş geldin, ',
      voiceNotSupported: 'Ses desteği yok',
      connectionError: 'Bağlantı hatası.'
    };

    // Память пользователя (локальное хранение)
    const storedName = localStorage.getItem('albamen_user_name');
    const storedAge = localStorage.getItem('albamen_user_age');
    if (storedName) {
      strings.initialStatus = strings.welcomeBack + storedName + '! 🚀';
    }

    // Проверяем, не создан ли виджет ранее
    if (document.getElementById('ai-floating-global')) return;

    // 1. Создаем контейнер для кнопок (Картинка + Кнопка вызова)
    const floating = document.createElement('div');
    floating.className = 'ai-floating';
    floating.id = 'ai-floating-global';
    const avatarSrc = '/assets/images/albamenai.jpg';

    // HTML для кнопок в футере
    floating.innerHTML = `
      <div class="ai-hero-avatar" id="ai-avatar-trigger">
        <img src="${avatarSrc}" alt="Albamen AI">
      </div>
      <button class="ai-call-btn pulse" id="ai-call-trigger" aria-label="Call AI">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
      </button>
    `;

    // Закрепляем плавающий блок в body, чтобы он всегда был на экране
    document.body.appendChild(floating);

    // 2. Создаем Панель Чата (Белую)
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
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    const recognition = SpeechRec ? new SpeechRec() : null;
    let isListening = false;

    // Функции открытия и закрытия панели
    const openPanel  = () => panel.classList.add('ai-open');
    const closePanel = () => {
      panel.classList.remove('ai-open');
      panel.classList.remove('chat-active');
      statusText.style.display = 'block';
    };

    // Открытие по клику на аватар или кнопку звонка
    avatarTrigger.addEventListener('click', openPanel);
    callTrigger.addEventListener('click', openPanel);
    closeBtn.addEventListener('click', closePanel);

    // Отправка сообщений
    function sendMessage() {
      const txt = inputField.value.trim();
      if (!txt) return;

      // Переход в режим активного чата (скрывает большой аватар)
      panel.classList.add('chat-active');
      addMessage(txt, 'user');
      inputField.value = '';

      const loadingId = 'loading-' + Date.now();
      addMessage('...', 'bot', loadingId);
      statusText.textContent = strings.connect;
      statusText.style.display = 'block';

      const workerUrl = 'https://divine-flower-a0ae.nncdecdgc.workers.dev';

      fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: txt,
          savedName: localStorage.getItem('albamen_user_name'),
          savedAge: localStorage.getItem('albamen_user_age')
        })
      })
      .then(res => res.json())
      .then(data => {
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();

        if (data.reply) {
          let finalReply = data.reply;

          const nameMatch = finalReply.match(/<SAVE_NAME:(.*?)>/);
          if (nameMatch) {
            const newName = nameMatch[1].trim();
            localStorage.setItem('albamen_user_name', newName);
            finalReply = finalReply.replace(nameMatch[0], '');
            console.log("Albamen remembered name:", newName);
          }

          const ageMatch = finalReply.match(/<SAVE_AGE:(.*?)>/);
          if (ageMatch) {
            const newAge = ageMatch[1].trim();
            localStorage.setItem('albamen_user_age', newAge);
            finalReply = finalReply.replace(ageMatch[0], '');
          }

          addMessage(finalReply.trim(), 'bot');
        } else {
          addMessage(strings.connectionError, 'bot');
        }
      })
      .catch(err => {
        console.error("AI Error:", err);
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();
        addMessage(strings.connectionError, 'bot');
      });
    }

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

    // Простая логика микрофона (заглушка для UI)
    micBtn.addEventListener('click', () => {
      if (!recognition) {
        statusText.textContent = strings.voiceNotSupported;
        statusText.style.display = 'block';
        return;
      }

      if (isListening) {
        recognition.stop();
        return;
      }

      panel.classList.add('chat-active');
      statusText.textContent = strings.listening;
      statusText.style.display = 'block';
      inputField.focus();
      recognition.lang = isEn ? 'en-US' : 'tr-TR';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      isListening = true;
      recognition.start();
    });

    if (recognition) {
      recognition.addEventListener('result', (event) => {
        const transcript = Array.from(event.results)
          .map(res => res[0].transcript)
          .join(' ')
          .trim();
        if (transcript) {
          inputField.value = transcript;
        }
      });

      recognition.addEventListener('end', () => {
        isListening = false;
        statusText.textContent = strings.initialStatus;
      });

      recognition.addEventListener('error', () => {
        isListening = false;
        statusText.textContent = strings.voiceNotSupported;
      });
    }
  }

  // Убедиться, что виджет остаётся прикреплённым к экрану даже при подмене футера
  function ensureAiWidgetPinned() {
    const floating = document.getElementById('ai-floating-global');
    if (!floating) return;

    const keepInBody = () => {
      if (floating.parentElement !== document.body) {
        document.body.appendChild(floating);
      }
      floating.classList.remove('footer-docked');
    };

    keepInBody();

    // Следим за мутациями (footer может появиться позже), чтобы не сдвинуть кнопку вниз
    const observer = new MutationObserver(() => keepInBody());
    observer.observe(document.body, { childList: true, subtree: true });
  }

}); // END runAfterDomReady


// -------------------- HELPER FUNCTIONS --------------------

// Вызывает функцию, когда DOM готов (или сразу, если уже готов)
function runAfterDomReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

// ================= MODEL VIEWER LOADER =================
function injectModelViewerStyles() {
  if (document.getElementById("albaspace-model-viewer-styles")) return;

  const style = document.createElement("style");
  style.id = "albaspace-model-viewer-styles";
  style.textContent = `
    model-viewer {
      width: 100%;
      height: 600px;
      margin-top: 30px;
      background: rgba(0, 0, 0, 0.65);
      border-radius: 12px;
      box-shadow: 0 0 30px rgba(0, 150, 255, 0.5);
      display: block;
    }

    @media (max-width: 768px) {
      model-viewer {
        height: 420px;
        margin-top: 20px;
      }
    }

    /* Ensure model-viewer is visible and interactive */
    model-viewer[ar-status="session-started"] {
      display: block !important;
    }

    /* Loading state */
    model-viewer::part(default-progress-bar) {
      background: linear-gradient(90deg, #00b4ff, #00e5ff);
    }
  `;
  document.head.appendChild(style);
}

function ensureModelViewerLoaded() {
  // Первый вариант: проверяем наличие model-viewer элемента
  const hasModelViewer = !!document.querySelector("model-viewer");

  if (!hasModelViewer) return;

  // Если custom element уже зарегистрирован - ничего не делаем
  if (window.customElements && window.customElements.get("model-viewer")) {
    return;
  }

  // Вариант 1: Пытаемся загрузить из Google CDN (основной)
  const googleSrc = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.0.0/model-viewer.min.js";

  // Вариант 2: Резервный источник
  const fallbackSrc = "https://unpkg.com/@google/model-viewer@3.0.0/dist/model-viewer.min.js";

  // Проверяем, что скрипт еще не загружается
  const existingGoogleScript = document.querySelector(`script[src="${googleSrc}"]`);
  const existingFallbackScript = document.querySelector(`script[src="${fallbackSrc}"]`);

  if (existingGoogleScript || existingFallbackScript) {
    return;
  }

  // Пытаемся загрузить с основного CDN
  const loadModelViewer = () => {
    if (window.customElements && window.customElements.get("model-viewer")) {
      return; // Успешно загружен
    }

    const script = document.createElement("script");
    script.type = "module";

    // Сначала пытаемся основной CDN
    script.src = googleSrc;

    // Если основной CDN не работает, переключаемся на резервный
    script.onerror = () => {
      if (window.customElements && window.customElements.get("model-viewer")) {
        return;
      }

      const fallbackScript = document.createElement("script");
      fallbackScript.type = "module";
      fallbackScript.src = fallbackSrc;
      document.head.appendChild(fallbackScript);
    };

    document.head.appendChild(script);
  };

  // Даем время на загрузку главного скрипта в head
  setTimeout(loadModelViewer, 800);

  // На всякий случай - финальная проверка через 3 секунды
  setTimeout(() => {
    if (!window.customElements || !window.customElements.get("model-viewer")) {
      const fallbackScript = document.createElement("script");
      fallbackScript.type = "module";
      fallbackScript.src = fallbackSrc;
      fallbackScript.async = true;
      document.head.appendChild(fallbackScript);
    }
  }, 3000);
}

function createPreloaderLoader() {
  let loaded = false;

  return function ensurePreloaderScript() {
    if (loaded) return;

    const preloader = document.getElementById("preloader");
    if (!preloader) return;

    const existing = document.querySelector("script[data-preloader-loader]");
    if (existing) {
      loaded = true;
      return;
    }

    const script = document.createElement("script");
    script.src = "/assets/js/preloader.js";
    script.defer = true;
    script.dataset.preloaderLoader = "true";
    document.head.appendChild(script);
    loaded = true;
  };
}

function createModelPreloaderLoader() {
  let loaded = false;

  return function ensureModelPreloader() {
    if (loaded) return;
    const hasViewer = !!document.querySelector('model-viewer');
    if (!hasViewer) return;

    const existing = document.querySelector('script[data-model-preloader]');
    if (existing) {
      loaded = true;
      return;
    }

    const script = document.createElement('script');
    script.src = '/assets/js/model-preloader.js';
    script.defer = true;
    script.dataset.modelPreloader = 'true';
    document.head.appendChild(script);
    loaded = true;
  };
}

function createModelNavLoader() {
  let loaded = false;

  return function ensureModelNavLoader() {
    if (loaded) return;

    const existing = document.querySelector('script[data-model-nav-loader]');
    if (existing) { loaded = true; return; }

    const script = document.createElement('script');
    script.src = '/assets/js/model-nav-loader.js';
    script.defer = true;
    script.dataset.modelNavLoader = 'true';
    document.head.appendChild(script);
    loaded = true;
  };
}


// ================= NAV =================
function markActiveNav() {
  const path = normalizePath(window.location.pathname || "/");
  const navLinks = document.querySelectorAll(".main-nav a");
  let matched = false;

  navLinks.forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;

    try {
      const linkPath = normalizePath(new URL(href, window.location.origin).pathname);
      if (linkPath === path) {
        a.classList.add("active");
        matched = true;
      }
    } catch (e) {
      if (href && path.endsWith(href)) {
        a.classList.add("active");
        matched = true;
      }
    }
  });

  if (!matched) {
    navLinks.forEach((a) => {
      const text = (a.textContent || "").trim().toUpperCase();
      if (text.includes("ATLAS")) a.classList.add("active");
    });
  }
}

function normalizePath(p) {
  if (!p || p === "/") return "/index.html";
  if (!p.endsWith(".html") && !p.endsWith("/")) return p + "/";
  return p;
}

// ================= LANG =================
function setupLangSwitch() {
  const path = window.location.pathname || "/";
  const isEn = path.startsWith("/eng/");
  const currentLang = isEn ? "en" : "tr";

  const container = document.querySelector(".top-lang-switch");
  if (!container) return;

  container.querySelectorAll("[data-lang]").forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    btn.classList.toggle("active", lang === currentLang);

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (lang === currentLang) return;

      const targetPath = lang === "en" ? toEnPath(path) : toTrPath(path);
      window.location.href = targetPath;
    });
  });
}

function toEnPath(path) {
  path = normalizePath(path);
  if (path.startsWith("/eng/")) return path;
  if (path === "/index.html") return "/eng/index.html";
  return "/eng" + (path.startsWith("/") ? path : "/" + path);
}

function toTrPath(path) {
  path = normalizePath(path);
  if (!path.startsWith("/eng/")) return path;
  return path.replace(/^\/eng/, "") || "/index.html";
}

// ================= FOOTER ENHANCER =================
function enhanceFooter(root) {
  injectFooterStyles();

  const footer = root.querySelector("footer");
  if (!footer || footer.classList.contains("alba-footer-v5")) return;
  footer.classList.add("alba-footer-v5");

  const allowCallSquare = /\/hizmetler(\.html)?\/?$/i.test(
    window.location.pathname || ""
  );
  if (!allowCallSquare) {
    footer.querySelectorAll(".alba-call-square").forEach((el) => el.remove());
  }

  const socials =
    footer.querySelector(".social-icons") ||
    footer.querySelector(".footer-socials") ||
    footer.querySelector("[data-socials]");
  if (socials) socials.classList.add("alba-footer-socials");

  const addressContainer =
    footer.querySelector(".footer-right") ||
    footer.querySelector(".footer-address") ||
    footer.querySelector(".footer-contact") ||
    footer.querySelector("[data-footer-address]");

  if (!addressContainer) return;

  const rawAddrText = (addressContainer.innerText || "").trim();
  if (!rawAddrText) return;

  const merkezBlock = extractSection(rawAddrText, /Merkez Ofis/i, /Adana Şube/i);
  const adanaBlock = extractSection(rawAddrText, /Adana Şube/i, null);

  const phoneRaw = findPhone(rawAddrText) || findPhone(footer.innerText || "");
  const phoneTel = phoneRaw ? phoneRaw.replace(/[^\d+]/g, "") : "";

  const mailAnchors = footer.querySelectorAll('a[href^="mailto:"]');
  mailAnchors.forEach((el) => el.remove());

  const contactPanel = document.createElement('div');
  contactPanel.className = 'alba-footer-contact-panel';

  const phoneBtn = document.createElement('a');
  phoneBtn.className = 'alba-footer-action';
  phoneBtn.href = 'tel:+9053877818';
  phoneBtn.innerHTML = `
    <div class="action-row">
      <span class="action-icon">☎</span>
      <span class="action-text">+90 538 778 18</span>
    </div>
    <div class="action-hint alba-blink">Aramak için dokunun</div>
  `;
  contactPanel.appendChild(phoneBtn);

  const emailBtn = document.createElement('a');
  emailBtn.className = 'alba-footer-action';
  emailBtn.href = 'mailto:hello@albaspace.com.tr';
  emailBtn.innerHTML = `
    <div class="action-row">
      <span class="action-icon">✉</span>
      <span class="action-text">hello@albaspace.com.tr</span>
    </div>
    <div class="action-hint alba-blink">Bize yazın</div>
  `;
  contactPanel.appendChild(emailBtn);

  const map1 = buildMapButton(merkezBlock);
  const map2 = buildMapButton(adanaBlock);
  if (map1) contactPanel.appendChild(map1);
  if (map2) contactPanel.appendChild(map2);

  addressContainer.innerHTML = '';
  addressContainer.style.display = 'flex';
  addressContainer.style.flexDirection = 'column';
  addressContainer.style.alignItems = 'center';
  addressContainer.style.justifyContent = 'center';
  addressContainer.style.width = '100%';
  addressContainer.style.margin = '0 auto';
  addressContainer.appendChild(contactPanel);
}

function buildMapButton(blockText) {
  if (!blockText) return null;
  const lines = blockText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const title = lines[0];
  const addressLines = lines.slice(1).filter((l) => !/(\+?\s*\d[\d\s()\-]{7,}\d)/.test(l));
  const address = addressLines.join(', ').replace(/\s+/g, ' ').trim();
  if (!address) return null;
  const a = document.createElement('a');
  a.className = 'alba-footer-action';
  a.href =
    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(address);
  a.target = '_blank';
  a.rel = 'noopener';
  const hintTr = 'Haritayı açmak için dokunun';
  a.innerHTML = `
    <div class="action-row">
      <span class="action-icon">📍</span>
      <span class="action-text">${escapeHtml(title)}</span>
    </div>
    <div class="map-address">${escapeHtml(address)}</div>
    <div class="action-hint alba-blink">${hintTr}</div>
  `;
  return a;
}

function extractSection(text, startRegex, beforeRegex) {
  if (!text) return "";
  const start = text.search(startRegex);
  if (start === -1) return "";

  const sliced = text.slice(start);
  if (!beforeRegex) return sliced.trim();

  const end = sliced.search(beforeRegex);
  if (end === -1) return sliced.trim();

  return sliced.slice(0, end).trim();
}

function findPhone(text) {
  if (!text) return "";
  const m = text.match(/(\+?\s*\d[\d\s()-]{7,}\d)/);
  return m ? m[1].trim() : "";
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function injectFooterStyles() {
  if (document.getElementById("alba-footer-style-v5")) return;

  const s = document.createElement("style");
  s.id = "alba-footer-style-v5";
  s.textContent = `
    .alba-footer-contact-panel {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
    }
    .alba-footer-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px 20px;
      border-radius: 16px;
      background: rgba(15,23,42,0.55);
      border: 1px solid rgba(148,163,184,0.28);
      box-shadow: 0 14px 38px rgba(0,0,0,0.35);
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      text-decoration: none;
      width: 220px;
      transition: transform .2s ease, box-shadow .25s ease, border-color .25s ease;
    }
    .alba-footer-action:hover {
      transform: translateY(-2px);
      border-color: rgba(56,189,248,0.7);
      box-shadow: 0 18px 52px rgba(56,189,248,0.12), 0 14px 38px rgba(0,0,0,0.45);
    }
    .alba-footer-action .action-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .alba-footer-action .action-icon {
      font-size: 18px;
      color: #38bdf8;
    }
    .alba-footer-action .action-text {
      font-weight: 900;
      color: #a7f3d0;
      font-size: 14px;
      letter-spacing: .04em;
    }
    .alba-footer-action .action-hint {
      font-size: 11px;
      color: #cbd5f5;
      opacity: .75;
      line-height: 1;
    }
    .alba-footer-action .map-address {
      color: #cbd5f5;
      font-size: 12px;
      line-height: 1.4;
      opacity: 0.9;
      text-align: center;
      margin-bottom: 6px;
    }
    .alba-blink {
      animation: alba-blink 1.5s ease-in-out infinite;
    }
    @keyframes alba-blink {
      0%, 100% { opacity: 0.8; }
      50%      { opacity: 0.3; }
    }
    @media (max-width: 768px) {
      .alba-footer-contact-panel {
        margin: 12px auto 0;
      }
    }
  `;
  document.head.appendChild(s);
}

