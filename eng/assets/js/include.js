// Unified include.js for AlbaSpace website (English)
//
// This script handles dynamic loading of header/footer fragments,
// highlights the current page in the navigation, optionally enables
// language switching, and keeps <model-viewer> available via a
// fallback loader when needed. It consolidates logic to prevent
// duplicated event handlers and ensures consistent behavior across
// English pages.

document.addEventListener("DOMContentLoaded", () => {
  const includes = document.querySelectorAll("[data-include]");
  if (!includes.length) return;

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
          // English pages may optionally include a language switcher
          setupLangSwitch();
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };
  includes.forEach(loadFragment);
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

