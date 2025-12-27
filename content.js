let popup = null;
let autoHideTimer = null;
let lastSelection = null;

// Theme helpers
const THEME_KEY = 'quickExplainTheme';
function getStoredTheme() {
  try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
}

function systemPrefersDark() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getEffectiveTheme() {
  const s = getStoredTheme();
  return s === 'light' || s === 'dark' ? s : (systemPrefersDark() ? 'dark' : 'light');
}

function applyTheme(theme) {
  if (!popup) return;
  if (theme === 'dark') popup.classList.add('dark');
  else popup.classList.remove('dark');
}

// Listen for system changes when user hasn't chosen a preference
const _prefMedia = window.matchMedia('(prefers-color-scheme: dark)');
if (_prefMedia.addEventListener) {
  _prefMedia.addEventListener('change', (e) => { if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light'); });
} else if (_prefMedia.addListener) {
  _prefMedia.addListener((e) => { if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light'); });
}

// Remove existing popup and any timers
function removePopup() {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }

  if (popup) {
    popup.remove();
    popup = null;
  }
}

// Fetch Wikipedia summary
async function fetchWikipediaSummary(query) {
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      return { extract: "No Wikipedia article found.", url: null, title: query };
    }

    const data = await response.json();
    const title = data.title || query;
    const url = (data.content_urls && data.content_urls.desktop && data.content_urls.desktop.page) || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    return { extract: data.extract || "No summary available.", url, title };
  } catch (error) {
    return { extract: "Error fetching Wikipedia data.", url: null, title: query };
  }
}

function truncate(text, max = 300) {
  if (!text) return text;
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

// Create and show popup withviewport clamping
function showPopup(rect, { text, title, url }) {
  removePopup();

  popup = document.createElement("div");
  popup.className = "quick-explain-popup";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", title ? `Quick explanation: ${title}` : "Quick explanation");
  popup.setAttribute("tabindex", "0");

  // summary + read-more link + close button
  const content = document.createElement("div");
  content.className = "quick-explain-content";
  content.textContent = text;

  const controls = document.createElement("div");
  controls.className = "quick-explain-controls";

  const readMore = document.createElement("a");
  readMore.textContent = "Read more";
  readMore.href = url || "#";
  readMore.target = "_blank";
  readMore.rel = "noopener noreferrer";
  readMore.className = "quick-explain-readmore";

  const themeToggle = document.createElement("button");
  themeToggle.type = "button";
  themeToggle.className = "quick-explain-theme-toggle";
  themeToggle.setAttribute('aria-label', 'Toggle color theme');

  function updateToggleLabel() {
    const current = getStoredTheme() || (systemPrefersDark() ? 'dark' : 'light');
    themeToggle.textContent = current === 'dark' ? '☀️ Light' : '🌙 Dark';
  }
  updateToggleLabel();

  themeToggle.addEventListener('click', () => {
    const cur = getStoredTheme() || (systemPrefersDark() ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    applyTheme(next);
    updateToggleLabel();
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.innerHTML = "✕";
  closeBtn.setAttribute("aria-label", "Close explanation");
  closeBtn.className = "quick-explain-close";

  closeBtn.addEventListener("click", removePopup);

  controls.appendChild(readMore);
  controls.appendChild(themeToggle);
  controls.appendChild(closeBtn);

  popup.appendChild(content);
  popup.appendChild(controls);

  // Append hidden. Measure and then position
  document.body.appendChild(popup);

  // Apply theme depending on preference or system
  applyTheme(getEffectiveTheme());

  // Positioning with viewport clamping
  const padding = 8;
  const popupRect = popup.getBoundingClientRect();
  let top = window.scrollY + rect.bottom + padding;
  let left = window.scrollX + rect.left;

  // Not enough space below, show above selection
  if (top + popupRect.height > window.scrollY + window.innerHeight) {
    top = window.scrollY + rect.top - popupRect.height - padding;
  }

  // Clamp horizontally
  if (left + popupRect.width > window.scrollX + window.innerWidth - padding) {
    left = window.scrollX + window.innerWidth - popupRect.width - padding;
  }
  if (left < window.scrollX + padding) left = window.scrollX + padding;

  popup.style.top = `${Math.max(top, window.scrollY + padding)}px`;
  popup.style.left = `${left}px`;

  // show
  requestAnimationFrame(() => {
    popup.style.opacity = 1;
    popup.focus();
  });

  // Auto-hide
  autoHideTimer = setTimeout(removePopup, 8000);
}

// Selection handler
async function handleSelection(maxWords = 4, maxChars = 60) {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return removePopup();

  const raw = sel.toString().trim().replace(/^[\W_]+|[\W_]+$/g, "");
  const words = raw.split(/\s+/).filter(Boolean);
  if (!raw || words.length === 0) return removePopup();
  if (words.length > maxWords || raw.length > maxChars) return removePopup();

  // avoid duplicates for same selection
  if (lastSelection && lastSelection.text === raw) return;
  lastSelection = { text: raw };

  // bounding rect safely
  let rect = null;
  try {
    rect = sel.getRangeAt(0).getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      const r = sel.getRangeAt(0).getClientRects()[0];
      if (r) rect = r;
    }
  } catch (e) {
    return removePopup();
  }
  if (!rect) return removePopup();

  // loading placeholder
  showPopup(rect, { text: "Loading…", title: raw, url: null });

  const { extract, url, title } = await fetchWikipediaSummary(raw);
  const truncated = truncate(extract, 300);
  showPopup(rect, { text: truncated, title, url });
}

// Event listeners
document.addEventListener("mouseup", () => handleSelection(4, 60));
document.addEventListener("dblclick", () => handleSelection(4, 60));

// close on outside click, Escape, resize/scroll
document.addEventListener("click", (e) => {
  if (!popup) return;
  if (!popup.contains(e.target)) removePopup();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") removePopup();
});

window.addEventListener("resize", removePopup);
window.addEventListener("scroll", removePopup, { passive: true });
