// Unified include.js for AlbaSpace website (English)
//
// This script handles dynamic loading of header/footer fragments,
// highlights the current page in the navigation, optionally enables
// language switching, and keeps <model-viewer> available via a
// fallback loader when needed. It consolidates logic to prevent
// duplicated event handlers and ensures consistent behavior across
// English pages.

document.addEventListener("DOMContentLoaded", () => {
  const includes = document.querySelectorAll("[data-include], [data-include-html]");

  // Ensure model-viewer registers even if the primary CDN fails to load
  // (otherwise the custom element stays unknown and the model stays hidden).
  const maybeViewer = document.querySelector("model-viewer");
  if (maybeViewer && !window.customElements.get("model-viewer")) {
    const fallbackSrc =
      "https://unpkg.com/@google/model-viewer@3.0.0/dist/model-viewer.min.js";
    const checkAndInject = () => {
      if (window.customElements.get("model-viewer")) return;
      const existing = document.querySelector(
        `script[src=\"${fallbackSrc}\"]`
      );
      if (existing) return;
      const script = document.createElement("script");
      script.type = "module";
      script.src = fallbackSrc;
      document.head.appendChild(script);
    };
    setTimeout(checkAndInject, 1800);
  }

  // Inject mobile navigation override to ensure burger menu functions correctly on pages
  // that define nav.main-nav with higher specificity (e.g. many /eng/ pages). This
  // rule hides nav by default on small screens and displays it only when nav-open is set.
  if (!document.getElementById("albaspace-nav-override-style")) {
    const navStyle = document.createElement("style");
    navStyle.id = "albaspace-nav-override-style";
    navStyle.textContent = `
      @media (max-width: 768px) {
        nav.main-nav {
          display: none !important;
          position: absolute;
          top: calc(100% + 10px);
          right: 12px;
          left: auto;
          width: 33vw;
          max-width: 420px;
          min-width: 220px;
          background: #020617;
          border: 1px solid rgba(15, 23, 42, 0.8);
          border-radius: 10px;
          box-shadow: 0 18px 45px rgba(56, 189, 248, 0.25);
          flex-direction: column;
          gap: 0;
          flex: none;
          justify-content: flex-start;
          margin: 0;
          padding: 8px 0;
          flex-wrap: nowrap;
          z-index: 1001;
          overflow: hidden;
          -webkit-backdrop-filter: blur(6px);
          backdrop-filter: blur(6px);
        }
        nav.main-nav.nav-open {
          display: flex !important;
          box-shadow: 0 12px 34px rgba(56, 189, 248, 0.6),
            0 0 40px rgba(56, 189, 248, 0.18) inset;
          border-color: rgba(56, 189, 248, 0.35);
        }
        nav.main-nav a {
          padding: 12px 18px;
          font-size: 14px;
          display: block;
          border-bottom: 1px solid rgba(15, 23, 42, 0.6);
          color: var(--text-main);
        }
        nav.main-nav a:last-child {
          border-bottom: none;
        }
      }
    `;
    document.head.appendChild(navStyle);
  }
  const loadFragment = (el) => {
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
          markActiveNav();
          // English pages may optionally include a language switcher
          setupLangSwitch();
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };
  if (includes.length) {
    includes.forEach(loadFragment);
  }

  injectAiWidget();
});

function markActiveNav() {
  const path = window.location.pathname || "/";
  const normalized = normalizePath(path);
  const navLinks = document.querySelectorAll(".main-nav a");
  let matched = false;
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    try {
      const linkUrl = new URL(href, window.location.origin);
      const linkPath = normalizePath(linkUrl.pathname);
      if (linkPath === normalized) {
        link.classList.add("active");
        matched = true;
      }
    } catch (e) {
      if (normalized.endsWith(href)) {
        link.classList.add("active");
        matched = true;
      }
    }
  });
  if (!matched) {
    navLinks.forEach((link) => {
      const text = (link.textContent || "").trim().toUpperCase();
      if (text.includes("ATLAS")) {
        link.classList.add("active");
      }
    });
  }
}

function normalizePath(path) {
  if (!path) return "/eng/index.html";
  if (path === "/eng" || path === "/eng/") return "/eng/index.html";
  if (!path.endsWith(".html") && !path.endsWith("/")) {
    return path + "/";
  }
  return path;
}

function setupLangSwitch() {
  const path = window.location.pathname || "/";
  // Determine if current page is English; for English pages, we highlight EN flag
  const isEn = path.startsWith("/eng/");
  const currentLang = isEn ? "en" : "tr";
  const container = document.querySelector(".top-lang-switch");
  if (!container) return;
  const buttons = container.querySelectorAll("[data-lang]");
  buttons.forEach((btn) => {
    const lang = btn.getAttribute("data-lang");
    if (lang === currentLang) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
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
  const tr = path.replace(/^\/eng/, "") || "/index.html";
  return tr;
}

function injectAiWidget(){
  const path = window.location.pathname || '/';
  const isEn = path.startsWith('/eng/');
  const name = isEn ? 'Albaman' : 'Albamen';

  if (document.getElementById('ai-launcher-btn-global')) return;

  // Launcher button
  const btn = document.createElement('button');
  btn.id = 'ai-launcher-btn-global';
  btn.className = 'ai-launcher-btn';
  btn.type = 'button';
  btn.setAttribute('aria-haspopup','dialog');
  btn.setAttribute('aria-label', isEn ? 'Open Albaman chat' : 'Albamen sohbetini aç');
  btn.innerHTML = `<span class="ai-dot" aria-hidden="true"></span>${name}`;
  document.body.appendChild(btn);

  // Panel
  const panel = document.createElement('div');
  panel.className = 'ai-panel-global';
  panel.id = 'ai-panel-global';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-hidden','true');
  panel.innerHTML = `
    <div class="ai-panel-header">
      <div class="title">${name}</div>
      <button class="ai-close" aria-label="Close">×</button>
    </div>
    <div class="ai-panel-body">
      <div class="ai-messages" id="ai-messages-global">
        <div class="ai-msg bot">${isEn ? 'Hi — I am Albaman. Ask me about space!' : 'Merhaba — ben Albamen. Bana uzay hakkında sorular sor!'}</div>
      </div>
      <div class="ai-input-row">
        <input class="ai-input" id="ai-input-global" placeholder="${isEn ? 'Type a message...' : 'Mesaj yazın...'}" />
        <button class="ai-mic-btn" id="ai-mic-btn" aria-label="${isEn ? 'Click to speak with Albaman' : 'Albamen ile konuşmak için basın'}">🎤</button>
        <button class="ai-btn" id="ai-send-btn">${isEn ? 'Send' : 'Gönder'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);

  const openPanel = () => { panel.setAttribute('aria-hidden','false'); panel.style.display='flex'; setTimeout(()=>messages.scrollTop = messages.scrollHeight, 50); };
  const closePanel = () => { panel.setAttribute('aria-hidden','true'); panel.style.display='none'; };

  const closeBtn = panel.querySelector('.ai-close');
  const messages = panel.querySelector('#ai-messages-global');
  const input = panel.querySelector('#ai-input-global');
  const micBtn = panel.querySelector('#ai-mic-btn');
  const sendBtn = panel.querySelector('#ai-send-btn');

  btn.addEventListener('click', () => openPanel());
  closeBtn.addEventListener('click', () => closePanel());

  function appendMessage(text, who){
    const d = document.createElement('div');
    d.className = 'ai-msg ' + (who === 'user' ? 'user' : 'bot');
    d.textContent = text;
    messages.appendChild(d);
    messages.scrollTop = messages.scrollHeight;
  }

  function simulateBotReply(userText){
    setTimeout(()=>{
      appendMessage(isEn ? `Albaman: I heard "${userText}"` : `Albamen: Duydum "${userText}"`,'bot');
    }, 700);
  }

  sendBtn.addEventListener('click', ()=>{
    const v = input.value.trim();
    if(!v) return;
    appendMessage(v,'user');
    input.value='';
    simulateBotReply(v);
  });

  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ sendBtn.click(); } });

  let recognition = null;
  let listening = false;

  function initRecognition(){
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if(!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.lang = isEn ? 'en-US' : 'tr-TR';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (ev) => {
      const text = (ev.results && ev.results[0] && ev.results[0][0].transcript) || '';
      appendMessage(text,'user');
      simulateBotReply(text);
    };
    r.onend = () => { listening = false; micBtn.textContent = '🎤'; micBtn.classList.remove('listening'); };
    r.onerror = () => { listening = false; micBtn.textContent = '🎤'; micBtn.classList.remove('listening'); };
    return r;
  }

  micBtn.addEventListener('click', ()=>{
    if(!recognition) recognition = initRecognition();
    if(!recognition){
      appendMessage(isEn ? 'Voice not supported on this device.' : 'Ses desteği bu cihazda bulunmuyor.','bot');
      return;
    }
    if(listening){ recognition.stop(); listening = false; micBtn.textContent='🎤'; micBtn.classList.remove('listening'); }
    else { recognition.start(); listening = true; micBtn.textContent='◼️'; micBtn.classList.add('listening'); }
  });

  document.addEventListener('click', (e)=>{
    if (!panel.contains(e.target) && e.target !== btn) closePanel();
  });

  closePanel();
}
