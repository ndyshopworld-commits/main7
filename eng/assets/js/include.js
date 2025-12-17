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

/* ----------------------------------------------------------------------
   Atlas Next/Previous Navigation

   On index pages for Atlas objects (e.g. /mars/, /eng/mars/), add a pair
   of arrow buttons at the bottom linking to the previous and next pages
   in the Atlas order. This runs on both English and Turkish pages; the
   only difference is the path prefix (/eng/ for English). Text inside
   the buttons remains the same across languages (arrows only).
---------------------------------------------------------------------- */
(function() {
  document.addEventListener("DOMContentLoaded", () => {
    const slug = (function() {
      let path = window.location.pathname || "/";
      // Normalize to remove index.html
      path = path.replace(/\/index\.html$/, "/");
      // Remove language prefix
      if (path.startsWith("/eng/")) {
        path = path.substring(5); // strip '/eng/'
      }
      // Remove leading/trailing slashes
      const segments = path.split("/").filter(Boolean);
      return segments.length > 0 ? segments[0] : null;
    })();
    if (!slug) return;
    // List of Atlas pages in order (slugs). Keep in sync with atlas.html
    const pagesOrder = [
      "gokturk-1", "gokturk-2", "rasat", "imece",
      "turksat-1A", "turksat-1B", "turksat-1C", "turksat-2A",
      "turksat-3A", "turksat-3B", "turksat-4A", "turksat-5A",
      "turksat-5B", "turksat-6A", "lagari",
      "iss",
      "mercury", "venus", "earth", "mars", "jupiter",
      "saturn", "uranus", "neptune",
      "sputnik", "voyager1", "voyager2", "hubble", "jameswebb",
      "kepler", "exomars", "marsodyssey", "marsreconnaissance",
      "perseverance", "curiosity", "ingenuity", "opportunity",
      "sojourner", "spirit", "zhurong"
    ];
    const idx = pagesOrder.indexOf(slug);
    if (idx === -1) return;
    // Determine previous and next indices cyclically
    const prevSlug = pagesOrder[(idx - 1 + pagesOrder.length) % pagesOrder.length];
    const nextSlug = pagesOrder[(idx + 1) % pagesOrder.length];
    // Determine language prefix based on current path
    const isEnglish = window.location.pathname.startsWith("/eng/");
    const prefix = isEnglish ? "/eng/" : "/";
    const prevLink = prefix + prevSlug + "/";
    const nextLink = prefix + nextSlug + "/";
    // Create nav container
    const navDiv = document.createElement("div");
    navDiv.id = "atlas-page-nav";
    navDiv.style.display = "flex";
    navDiv.style.justifyContent = "space-between";
    navDiv.style.alignItems = "center";
    navDiv.style.maxWidth = "640px";
    navDiv.style.margin = "40px auto";
    navDiv.style.padding = "0 16px";
    // Create previous button
    const prevA = document.createElement("a");
    prevA.href = prevLink;
    prevA.className = "atlas-nav-button atlas-nav-prev";
    prevA.textContent = "←";
    prevA.style.textDecoration = "none";
    prevA.style.fontSize = "22px";
    prevA.style.lineHeight = "1";
    // Create next button
    const nextA = document.createElement("a");
    nextA.href = nextLink;
    nextA.className = "atlas-nav-button atlas-nav-next";
    nextA.textContent = "→";
    nextA.style.textDecoration = "none";
    nextA.style.fontSize = "22px";
    nextA.style.lineHeight = "1";
    // Styling for buttons
    [prevA, nextA].forEach((btn) => {
      btn.style.display = "flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.width = "48px";
      btn.style.height = "48px";
      btn.style.borderRadius = "999px";
      btn.style.background = "rgba(15, 23, 42, 0.9)";
      btn.style.border = "1px solid rgba(148, 163, 184, 0.4)";
      btn.style.color = "#e5e7eb";
      btn.style.transition = "transform 0.15s, box-shadow 0.15s";
      btn.addEventListener("mouseover", () => {
        btn.style.transform = "translateY(-2px)";
        btn.style.boxShadow = "0 4px 12px rgba(56, 189, 248, 0.3)";
      });
      btn.addEventListener("mouseout", () => {
        btn.style.transform = "none";
        btn.style.boxShadow = "none";
      });
    });
    navDiv.appendChild(prevA);
    navDiv.appendChild(nextA);
    // Insert nav before the global footer include if possible, else append to body
    const footerInclude = document.querySelector('div[data-include$="footer-en.html"], div[data-include$="footer-tr.html"]');
    if (footerInclude && footerInclude.parentNode) {
      footerInclude.parentNode.insertBefore(navDiv, footerInclude);
    } else {
      document.body.appendChild(navDiv);
    }
  });
})();