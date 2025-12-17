// Unified include. js for AlbaSpace website (Turkish)
//
// This script dynamically loads header and footer fragments, highlights the
// current navigation item, provides a language switcher, keeps model-viewer
// available with a fallback, and enhances the footer with neatly styled address
// buttons and a call shortcut. 

document.addEventListener("DOMContentLoaded", () => {
  const includes = document.querySelectorAll("[data-include]");
  if (! includes.length) return;

  // УЛУЧШЕНИЕ 1: Загружаем CSS стили для model-viewer ДО всего остального
  injectModelViewerStyles();

  // УЛУЧШЕНИЕ 2: Гарантируем загрузку model-viewer скрипта
  ensureModelViewerLoaded();

  // We need the preloader script to run even when the header is injected via
  // include.js (since scripts inside innerHTML are not executed by default).
  const ensurePreloaderScript = createPreloaderLoader();

  // ---------------- Mobile nav override ----------------
  if (! document.getElementById("albaspace-nav-override-style")) {
    const navStyle = document.createElement("style");
    navStyle.id = "albaspace-nav-override-style";
    navStyle.textContent = `
      @media (max-width: 768px) {
        nav. main-nav {
          display: none ! important;
          position: absolute;
          top: calc(100% + 10px);
          right: 12px;
          width: 33vw;
          max-width: 420px;
          min-width: 220px;
          background: #020617;
          border:  1px solid rgba(15, 23, 42, 0.8);
          border-radius: 10px;
          box-shadow: 0 18px 45px rgba(56,189,248,. 25);
          flex-direction: column;
          padding: 8px 0;
          z-index: 1001;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        nav.main-nav.nav-open { display: flex ! important; }
        nav.main-nav a {
          padding: 12px 18px;
          font-size: 14px;
          border-bottom: 1px solid rgba(15,23,42,. 6);
          color: var(--text-main);
          display: block;
        }
        nav.main-nav a:last-child { border-bottom: none; }
      }
    `;
    document.head.appendChild(navStyle);
  }

  // ---------------- Load includes ----------------
  includes.forEach((el) => {
    const url = el.getAttribute("data-include");
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
          setupLangSwitch();
          ensurePreloaderScript();
        }

        if (url.includes("footer-")) {
          enhanceFooter(el);
        }
      })
      .catch(console.error);
  });
});

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
      box-shadow:  0 0 30px rgba(0, 150, 255, 0.5);
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
      display: block ! important;
    }

    /* Loading state */
    model-viewer:: part(default-progress-bar) {
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
      fallbackScript. type = "module";
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
      fallbackScript. type = "module";
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

// ================= NAV =================
function markActiveNav() {
  const path = normalizePath(window.location.pathname || "/");
  const navLinks = document.querySelectorAll(". main-nav a");
  let matched = false;

  navLinks. forEach((a) => {
    const href = a.getAttribute("href");
    if (! href) return;

    try {
      const linkPath = normalizePath(new URL(href, window.location. origin).pathname);
      if (linkPath === path) {
        a.classList.add("active");
        matched = true;
      }
    } catch {
      if (path.endsWith(href)) {
        a.classList. add("active");
        matched = true;
      }
    }
  });

  if (!matched) {
    navLinks.forEach((a) => {
      const text = (a.textContent || "").trim().toUpperCase();
      if (text. includes("ATLAS")) a.classList.add("active");
    });
  }
}

function normalizePath(p) {
  if (! p || p === "/") return "/index.html";
  if (! p.endsWith(". html") && !p.endsWith("/")) return p + "/";
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

  const allowCallSquare = /\/hizmetler(\. html)?\/?$/i. test(
    window.location.pathname || ""
  );
  if (! allowCallSquare) {
    footer.querySelectorAll(". alba-call-square").forEach((el) => el.remove());
  }

  const socials =
    footer.querySelector(". social-icons") ||
    footer.querySelector(".footer-socials") ||
    footer.querySelector("[data-socials]");
  if (socials) socials.classList.add("alba-footer-socials");

  const addressContainer =
    footer.querySelector(".footer-right") ||
    footer.querySelector(". footer-address") ||
    footer.querySelector(". footer-contact") ||
    footer.querySelector("[data-footer-address]");

  if (! addressContainer) return;

  const rawAddrText = (addressContainer.innerText || "").trim();
  if (! rawAddrText) return;

  const merkezBlock = extractSection(rawAddrText, /Merkez Ofis/i, /Adana Şube/i);
  const adanaBlock = extractSection(rawAddrText, /Adana Şube/i, null);

  const phoneRaw = findPhone(rawAddrText) || findPhone(footer.innerText || "");
  const phoneTel = phoneRaw ?  phoneRaw.replace(/[^\d+]/g, "") : "";

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
  emailBtn.href = 'mailto:hello@albaspace.com. tr';
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
  addressContainer. style.alignItems = 'center';
  addressContainer.style.justifyContent = 'center';
  addressContainer.style.width = '100%';
  addressContainer.style.margin = '0 auto';
  addressContainer.appendChild(contactPanel);
}

function buildMapButton(blockText) {
  if (! blockText) return null;
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
  a. rel = 'noopener';
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
  if (! beforeRegex) return sliced.trim();

  const end = sliced.search(beforeRegex);
  if (end === -1) return sliced.trim();

  return sliced.slice(0, end).trim();
}

function findPhone(text) {
  if (!text) return "";
  const m = text.match(/(\+?\s*\d[\d\s()-]{7,}\d)/);
  return m ? m[1]. trim() : "";
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
    . alba-footer-contact-panel {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
    }
    . alba-footer-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 14px 20px;
      border-radius: 16px;
      background:  rgba(15,23,42,. 55);
      border: 1px solid rgba(148,163,184,.28);
      box-shadow: 0 14px 38px rgba(0,0,0,. 35);
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
      text-decoration: none;
      width: 220px;
      transition: transform . 2s ease, box-shadow . 25s ease, border-color .25s ease;
    }
    .alba-footer-action:hover {
      transform: translateY(-2px);
      border-color: rgba(56,189,248,.7);
      box-shadow: 0 18px 52px rgba(56,189,248,.12), 0 14px 38px rgba(0,0,0,.45);
    }
    .alba-footer-action . action-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    . alba-footer-action .action-icon {
      font-size: 18px;
      color: #38bdf8;
    }
    .alba-footer-action . action-text {
      font-weight: 900;
      color: #a7f3d0;
      font-size: 14px;
      letter-spacing: . 04em;
    }
    . alba-footer-action .action-hint {
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
        margin:  12px auto 0;
      }
    }
  `;
  document.head.appendChild(s);
}

/* Atlas Next/Previous Navigation */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const slug = (() => {
      let path = window.location.pathname || "/";
      path = path.replace(/\/index\. html$/, "/");
      if (path.startsWith("/eng/")) path = path.substring(5);
      const segments = path.split("/").filter(Boolean);
      return segments.length > 0 ? segments[0] : null;
    })();
    if (! slug) return;

    const pagesOrder = [
      "gokturk-1","gokturk-2","rasat","imece",
      "turksat-1A","turksat-1B","turksat-1C","turksat-2A",
      "turksat-3A","turksat-3B","turksat-4A","turksat-5A",
      "turksat-5B","turksat-6A","lagari",
      "iss",
      "mercury","venus","earth","mars","jupiter",
      "saturn","uranus","neptune",
      "sputnik","voyager1","voyager2","hubble","jameswebb",
      "kepler","exomars","marsodyssey","marsreconnaissance",
      "perseverance","curiosity","ingenuity","opportunity",
      "sojourner","spirit","zhurong"
    ];

    const idx = pagesOrder.indexOf(slug);
    if (idx === -1) return;

    const prevSlug = pagesOrder[(idx - 1 + pagesOrder.length) % pagesOrder.length];
    const nextSlug = pagesOrder[(idx + 1) % pagesOrder.length];

    const isEnglish = window.location.pathname.startsWith("/eng/");
    const prefix = isEnglish ? "/eng/" : "/";
    const prevLink = prefix + prevSlug + "/";
    const nextLink = prefix + nextSlug + "/";

    const navDiv = document.createElement("div");
    navDiv.id = "atlas-page-nav";
    navDiv. style.display = "flex";
    navDiv.style.justifyContent = "space-between";
    navDiv.style.alignItems = "center";
    navDiv.style.maxWidth = "640px";
    navDiv.style.margin = "40px auto";
    navDiv. style.padding = "0 16px";

    const prevA = document.createElement("a");
    prevA.href = prevLink;
    prevA.textContent = "←";
    prevA.style. cssText = baseAtlasBtnCss();

    const nextA = document. createElement("a");
    nextA.href = nextLink;
    nextA.textContent = "→";
    nextA.style. cssText = baseAtlasBtnCss();

    navDiv.appendChild(prevA);
    navDiv.appendChild(nextA);

    const footerInclude = document.querySelector(
      'div[data-include$="footer-en. html"], div[data-include$="footer-tr.html"]'
    );
    if (footerInclude?. parentNode) footerInclude.parentNode.insertBefore(navDiv, footerInclude);
    else document.body.appendChild(navDiv);

    function baseAtlasBtnCss() {
      return `
        text-decoration: none;
        display:flex;
        align-items:center;
        justify-content:center;
        width:48px;
        height:48px;
        border-radius:999px;
        background:rgba(15,23,42,.9);
        border:1px solid rgba(148,163,184,.4);
        color:#e5e7eb;
        font-size:22px;
        transition:transform .15s, box-shadow .15s;
      `;
    }
  });
})();
