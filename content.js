let popup = null;
let autoHideTimer = null;
let lastSelection = null;

// Source selection state
const SOURCE_KEY = 'quickExplainSource';
const TONE_KEY = 'quickExplainTone';

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

// Source selection helpers
function getStoredSource() {
  try { return localStorage.getItem(SOURCE_KEY); } catch (e) { return 'auto'; }
}

function getStoredTone() {
  try { return localStorage.getItem(TONE_KEY); } catch (e) { return 'friendly'; }
}

function setStoredSource(source) {
  try { localStorage.setItem(SOURCE_KEY, source); } catch (e) {}
}

function setStoredTone(tone) {
  try { localStorage.setItem(TONE_KEY, tone); } catch (e) {}
}

// Source definitions
const SOURCES = {
  auto: {
    label: 'Auto (Recommended)',
    description: 'We choose the best source based on what you highlight.',
    icon: '🤖'
  },
  wikipedia: {
    label: 'Wikipedia — Overview',
    description: 'General background and concise explanations for people, places, concepts, and events.',
    icon: '📚'
  },
  wikidata: {
    label: 'Wikidata — Key Facts',
    description: 'Structured, factual summaries: dates, roles, categories, and relationships.',
    icon: '📊'
  },
  dbpedia: {
    label: 'DBpedia — Context & Structure',
    description: 'Short abstracts with clean, structured information pulled from linked data.',
    icon: '🔗'
  },
  dictionary: {
    label: 'Dictionary — Meaning',
    description: 'Clear definitions, usage, and examples for words and phrases.',
    icon: '📖'
  },
  wiktionary: {
    label: 'Wiktionary — Language & Origin',
    description: 'Definitions plus etymology, grammar, and historical usage.',
    icon: '🔤'
  },
  openlibrary: {
    label: 'Open Library — Books & Authors',
    description: 'Descriptions, authorship, and publication context for books and literary works.',
    icon: '📘'
  },
  trivia: {
    label: 'Numbers & Trivia — Fun Facts',
    description: 'Quick, surprising facts about numbers, dates, and figures.',
    icon: '✨'
  }
};

const TONES = {
  academic: {
    label: 'More Academic',
    description: 'Select the knowledge source that best matches your inquiry — lexical, encyclopedic, factual, or bibliographic.'
  },
  friendly: {
    label: 'More Friendly',
    description: 'Want a definition? A quick fact? Or a bit of context? Choose the source that fits what you’re curious about.'
  },
  poweruser: {
    label: 'Power-User / Advanced',
    description: 'Control the knowledge pipeline. Choose which dataset your snippet is generated from.'
  }
};

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

// Fetch data based on selected source
async function fetchData(query) {
  const source = getStoredSource();
  
  switch (source) {
    case 'wikipedia':
      return fetchWikipediaSummary(query);
    case 'wikidata':
      return fetchWikidataSummary(query);
    case 'dbpedia':
      return fetchDBpediaSummary(query);
    case 'dictionary':
      return fetchDictionarySummary(query);
    case 'wiktionary':
      return fetchWiktionarySummary(query);
    case 'openlibrary':
      return fetchOpenLibrarySummary(query);
    case 'trivia':
      return fetchTriviaSummary(query);
    case 'auto':
    default:
      return fetchWikipediaSummary(query);
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

// Placeholder functions for other data sources
async function fetchWikidataSummary(query) {
  return {
    extract: `Wikidata summary for "${query}": Structured data about this entity.`,
    url: `https://www.wikidata.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
    title: query
  };
}

async function fetchDBpediaSummary(query) {
  return {
    extract: `DBpedia summary for "${query}": Structured information from Wikipedia.`,
    url: `http://dbpedia.org/page/${encodeURIComponent(query)}`,
    title: query
  };
}

async function fetchDictionarySummary(query) {
  return {
    extract: `"${query}": A word with multiple meanings and uses.`,
    url: `https://www.merriam-webster.com/dictionary/${encodeURIComponent(query)}`,
    title: query
  };
}

async function fetchWiktionarySummary(query) {
  return {
    extract: `"${query}": Etymology and linguistic information available.`,
    url: `https://en.wiktionary.org/wiki/${encodeURIComponent(query)}`,
    title: query
  };
}

async function fetchOpenLibrarySummary(query) {
  return {
    extract: `Open Library information for "${query}": Book and author details.`,
    url: `https://openlibrary.org/search?q=${encodeURIComponent(query)}`,
    title: query
  };
}

async function fetchTriviaSummary(query) {
  return {
    extract: `Fun fact about "${query}": Did you know this interesting detail?`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}+fun+facts`,
    title: query
  };
}

function truncate(text, max = 300) {
  if (!text) return text;
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

// Create and show popup with viewport clamping
function showPopup(rect, { text, title, url }) {
  removePopup();

  popup = document.createElement("div");
  popup.className = "quick-explain-popup";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", title ? `Quick explanation: ${title}` : "Quick explanation");
  popup.setAttribute("tabindex", "0");

  // Source selection header
  const sourceHeader = document.createElement("div");
  sourceHeader.className = "quick-explain-source-header";

  const currentSource = getStoredSource();
  const currentTone = getStoredTone();
  const sourceInfo = SOURCES[currentSource] || SOURCES.auto;
  const toneInfo = TONES[currentTone] || TONES.friendly;

  const sourceLabel = document.createElement("div");
  sourceLabel.className = "quick-explain-source-label";
  sourceLabel.innerHTML = `<span class="quick-explain-source-icon">${sourceInfo.icon || '🤖'}</span><span class="quick-explain-source-text">${sourceInfo.label || 'Auto (Recommended)'}</span>`;

  const toneLabel = document.createElement("div");
  toneLabel.className = "quick-explain-tone-label";
  toneLabel.textContent = toneInfo.label || 'More Friendly';

  sourceHeader.appendChild(sourceLabel);
  sourceHeader.appendChild(toneLabel);

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

  const settingsBtn = document.createElement("button");
  settingsBtn.type = "button";
  settingsBtn.innerHTML = "⚙️";
  settingsBtn.setAttribute("aria-label", "Change source and tone settings");
  settingsBtn.className = "quick-explain-settings";
  settingsBtn.title = "Change source and tone settings";

  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showSettingsPanel();
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.innerHTML = "✕";
  closeBtn.setAttribute("aria-label", "Close explanation");
  closeBtn.className = "quick-explain-close";

  closeBtn.addEventListener("click", removePopup);

  controls.appendChild(readMore);
  controls.appendChild(themeToggle);
  controls.appendChild(settingsBtn);
  controls.appendChild(closeBtn);

  popup.appendChild(sourceHeader);
  popup.appendChild(content);
  popup.appendChild(controls);

  // Append hidden. Measure and then position
  document.body.appendChild(popup);

  // Apply theme depending on preference or system
  applyTheme(getEffectiveTheme());

  // Positioning with viewport clamping
  const padding = 8;
  const popupRect = popup.getBoundingClientRect();
  let top = rect.bottom + padding;
  let left = rect.left;

  // Not enough space below, show above selection
  if (top + popupRect.height > window.innerHeight) {
    top = rect.top - popupRect.height - padding;
  }

  // Clamp horizontally
  if (left + popupRect.width > window.innerWidth - padding) {
    left = window.innerWidth - popupRect.width - padding;
  }
  if (left < padding) left = padding;

  // Ensure top doesn't go above viewport
  if (top < padding) top = padding;

  popup.style.top = `${top + window.scrollY}px`;
  popup.style.left = `${left + window.scrollX}px`;

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

  // Debug logging
  console.log('Selection detected:', raw);
  console.log('Selection rect:', rect);

  // loading placeholder
  showPopup(rect, { text: "Loading…", title: raw, url: null });

  try {
    const { extract, url, title } = await fetchData(raw);
    const truncated = truncate(extract, 300);
    showPopup(rect, { text: truncated, title, url });
  } catch (error) {
    console.error('Error fetching data:', error);
    showPopup(rect, { text: "Error loading information.", title: raw, url: null });
  }
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

// Settings panel functionality
function showSettingsPanel() {
  const settingsPanel = document.createElement("div");
  settingsPanel.className = "quick-explain-settings-panel";
  settingsPanel.setAttribute("role", "dialog");
  settingsPanel.setAttribute("aria-label", "Source and tone settings");

  const currentSource = getStoredSource() || 'auto';
  const currentTone = getStoredTone() || 'friendly';

  // Build source selection
  const sourceSection = document.createElement("div");
  sourceSection.className = "quick-explain-settings-section";
  
  const sourceTitle = document.createElement("h3");
  sourceTitle.textContent = "Choose your source";
  sourceTitle.className = "quick-explain-settings-title";
  
  const sourceSubtitle = document.createElement("p");
  sourceSubtitle.textContent = "Different questions need different kinds of answers.";
  sourceSubtitle.className = "quick-explain-settings-subtitle";

  const sourceList = document.createElement("div");
  sourceList.className = "quick-explain-source-list";

  Object.entries(SOURCES).forEach(([key, info]) => {
    const sourceItem = document.createElement("label");
    sourceItem.className = "quick-explain-source-item";
    
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "source";
    radio.value = key;
    radio.checked = key === currentSource;
    
    const sourceContent = document.createElement("div");
    sourceContent.className = "quick-explain-source-content";
    
    const sourceHeader = document.createElement("div");
    sourceHeader.className = "quick-explain-source-header-row";
    
    const sourceName = document.createElement("span");
    sourceName.className = "quick-explain-source-name";
    sourceName.textContent = info.label;
    
    const sourceIcon = document.createElement("span");
    sourceIcon.className = "quick-explain-source-icon";
    sourceIcon.textContent = info.icon;
    
    sourceHeader.appendChild(sourceName);
    sourceHeader.appendChild(sourceIcon);
    
    const sourceDesc = document.createElement("div");
    sourceDesc.className = "quick-explain-source-desc";
    sourceDesc.textContent = info.description;
    
    sourceContent.appendChild(sourceHeader);
    sourceContent.appendChild(sourceDesc);
    
    sourceItem.appendChild(radio);
    sourceItem.appendChild(sourceContent);
    
    sourceList.appendChild(sourceItem);
  });

  sourceSection.appendChild(sourceTitle);
  sourceSection.appendChild(sourceSubtitle);
  sourceSection.appendChild(sourceList);

  // Build tone selection
  const toneSection = document.createElement("div");
  toneSection.className = "quick-explain-settings-section";
  
  const toneTitle = document.createElement("h3");
  toneTitle.textContent = "Alternative Tones";
  toneTitle.className = "quick-explain-settings-title";
  
  const toneList = document.createElement("div");
  toneList.className = "quick-explain-tone-list";

  Object.entries(TONES).forEach(([key, info]) => {
    const toneItem = document.createElement("label");
    toneItem.className = "quick-explain-tone-item";
    
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "tone";
    radio.value = key;
    radio.checked = key === currentTone;
    
    const toneContent = document.createElement("div");
    toneContent.className = "quick-explain-tone-content";
    
    const toneName = document.createElement("span");
    toneName.className = "quick-explain-tone-name";
    toneName.textContent = info.label;
    
    const toneDesc = document.createElement("div");
    toneDesc.className = "quick-explain-tone-desc";
    toneDesc.textContent = info.description;
    
    toneContent.appendChild(toneName);
    toneContent.appendChild(toneDesc);
    
    toneItem.appendChild(radio);
    toneItem.appendChild(toneContent);
    
    toneList.appendChild(toneItem);
  });

  toneSection.appendChild(toneTitle);
  toneSection.appendChild(toneList);

  // Controls
  const controls = document.createElement("div");
  controls.className = "quick-explain-settings-controls";
  
  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.textContent = "Save";
  saveBtn.className = "quick-explain-settings-save";
  
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancel";
  cancelBtn.className = "quick-explain-settings-cancel";

  controls.appendChild(saveBtn);
  controls.appendChild(cancelBtn);

  settingsPanel.appendChild(sourceSection);
  settingsPanel.appendChild(toneSection);
  settingsPanel.appendChild(controls);

  // Event listeners
  saveBtn.addEventListener("click", () => {
    const selectedSource = settingsPanel.querySelector('input[name="source"]:checked').value;
    const selectedTone = settingsPanel.querySelector('input[name="tone"]:checked').value;
    
    setStoredSource(selectedSource);
    setStoredTone(selectedTone);
    
    settingsPanel.remove();
    // Refresh the main popup to show new settings
    if (popup) {
      const rect = popup.getBoundingClientRect();
      const content = popup.querySelector('.quick-explain-content').textContent;
      const title = popup.querySelector('.quick-explain-source-text').textContent;
      showPopup(rect, { text: content, title, url: null });
    }
  });

  cancelBtn.addEventListener("click", () => {
    settingsPanel.remove();
  });

  // Close on outside click
  settingsPanel.addEventListener("click", (e) => {
    if (e.target === settingsPanel) {
      settingsPanel.remove();
    }
  });

  document.body.appendChild(settingsPanel);
  applyTheme(getEffectiveTheme());
}
