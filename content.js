/**
 * Quick Explain - Content Script
 * Provides instant explanations for selected text on web pages
 */

const loadFontAwesome = () => {
  if (!document.querySelector('#quick-explain-fontawesome')) {
    const link = document.createElement('link');
    link.id = 'quick-explain-fontawesome';
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
};
loadFontAwesome();

// State Management
let popup = null;
let autoHideTimer = null;
let lastSelection = null;
let settingsPanel = null;
let ignoreClickUntil = 0;

// Constants
const SOURCE_KEY = 'quickExplainSource';
const TONE_KEY = 'quickExplainTone';
const THEME_KEY = 'quickExplainTheme';
const AUTO_HIDE_DELAY = 8000;
const CLICK_IGNORE_DELAY = 200;
const SELECTION_CACHE_DURATION = 500;
const MAX_WORDS = 4;
const MAX_CHARS = 60;
const TRUNCATE_LENGTH = 300;

// Theme Management
function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (e) {
    return null;
  }
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
  
  if (theme === 'dark') {
    popup.classList.add('dark');
  } else {
    popup.classList.remove('dark');
  }
}

function updateHeaderLabels() {
  if (!popup) return;
  
  const sourceInfo = SOURCES[getStoredSource()] || SOURCES.auto;
  const toneInfo = TONES[getStoredTone()] || TONES.friendly;
  const sourceLabel = popup.querySelector('.quick-explain-source-label');
  const toneLabel = popup.querySelector('.quick-explain-tone-label');
  
  if (sourceLabel) {
    sourceLabel.innerHTML = `<i class="quick-explain-source-icon ${sourceInfo.icon || 'fa-solid fa-wand-magic-sparkles'}"></i><span class="quick-explain-source-text">${sourceInfo.label || 'Auto (Recommended)'}</span>`;
  }
  
  if (toneLabel) {
    toneLabel.textContent = toneInfo.label || 'More Friendly';
  }
}

// Storage Helpers
function getStoredSource() {
  try {
    return localStorage.getItem(SOURCE_KEY) || 'auto';
  } catch (e) {
    return 'auto';
  }
}

function getStoredTone() {
  try {
    return localStorage.getItem(TONE_KEY) || 'friendly';
  } catch (e) {
    return 'friendly';
  }
}

function setStoredSource(source) {
  try {
    localStorage.setItem(SOURCE_KEY, source);
  } catch (e) {
    console.warn('Failed to save source preference:', e);
  }
}

function setStoredTone(tone) {
  try {
    localStorage.setItem(TONE_KEY, tone);
  } catch (e) {
    console.warn('Failed to save tone preference:', e);
  }
}

// Configuration Data
const SOURCES = {
  auto: { label: 'Auto (Recommended)', description: 'Choose the best source automatically.', icon: 'fa-solid fa-wand-magic-sparkles' },
  wikipedia: { label: 'Wikipedia — Overview', description: 'Concise summaries for general topics.', icon: 'fa-brands fa-wikipedia-w' },
  wikidata: { label: 'Wikidata — Key Facts', description: 'Structured facts and relationships.', icon: 'fa-solid fa-database' },
  dbpedia: { label: 'DBpedia — Context', description: 'Structured abstracts from linked data.', icon: 'fa-solid fa-link' },
  dictionary: { label: 'Dictionary — Meaning', description: 'Definitions and usage.', icon: 'fa-solid fa-book' },
  wiktionary: { label: 'Wiktionary — Language', description: 'Definitions plus etymology.', icon: 'fa-solid fa-language' },
  openlibrary: { label: 'Open Library — Books', description: 'Books and authors context.', icon: 'fa-solid fa-book-open' },
  trivia: { label: 'Numbers & Trivia', description: 'Quick, surprising facts.', icon: 'fa-solid fa-lightbulb' }
};

const TONES = {
  friendly: { label: 'More Friendly', description: 'Conversational and approachable tone.' },
  academic: { label: 'More Academic', description: 'Formal and precise language.' },
  poweruser: { label: 'Power-User / Advanced', description: 'Technical and detailed explanations.' }
};

// Popup Management
function removePopup() {
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }

  if (settingsPanel) {
    settingsPanel.remove();
    settingsPanel = null;
  }

  if (popup) {
    popup.remove();
    popup = null;
  }
}

// Data Fetching
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

async function fetchWikipediaSummary(query) {
  const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;

  try {
    const response = await fetch(apiUrl, { 
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'QuickExplain-Extension/1.0'
      }
    });
    
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

async function fetchWikidataSummary(query) {
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&origin=*`;
  
  try {
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) {
      return { extract: `No Wikidata entity found for "${query}".`, url: `https://www.wikidata.org/wiki/Special:Search?search=${encodeURIComponent(query)}`, title: query };
    }
    
    const searchData = await searchResponse.json();
    if (!searchData.search || searchData.search.length === 0) {
      return { extract: `No Wikidata entity found for "${query}".`, url: `https://www.wikidata.org/wiki/Special:Search?search=${encodeURIComponent(query)}`, title: query };
    }
    
    const entity = searchData.search[0];
    const description = entity.description || 'No description available.';
    const label = entity.label || query;
    const id = entity.id;
    
    let extract = `${label}: ${description}`;
    if (entity.aliases && entity.aliases.length > 0) {
      extract += ` Also known as: ${entity.aliases.slice(0, 3).join(', ')}.`;
    }
    
    return {
      extract,
      url: `https://www.wikidata.org/wiki/${id}`,
      title: label
    };
  } catch (error) {
    return { extract: `Error fetching Wikidata for "${query}".`, url: `https://www.wikidata.org/wiki/Special:Search?search=${encodeURIComponent(query)}`, title: query };
  }
}

async function fetchDBpediaSummary(query) {
  const resource = query.replace(/\s+/g, '_');
  const apiUrl = `https://dbpedia.org/data/${encodeURIComponent(resource)}.json`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return { extract: `No DBpedia resource found for "${query}".`, url: `https://dbpedia.org/page/${encodeURIComponent(resource)}`, title: query };
    }
    
    const data = await response.json();
    const resourceUri = `http://dbpedia.org/resource/${resource}`;
    const resourceData = data[resourceUri];
    
    if (resourceData) {
      const abstract = resourceData['http://dbpedia.org/ontology/abstract']?.find(item => item.lang === 'en')?.value ||
                      resourceData['http://www.w3.org/2000/01/rdf-schema#comment']?.find(item => item.lang === 'en')?.value;
      
      if (abstract) {
        return {
          extract: abstract,
          url: `https://dbpedia.org/page/${encodeURIComponent(resource)}`,
          title: query
        };
      }
    }
    
    return { extract: `No abstract available for "${query}" in DBpedia.`, url: `https://dbpedia.org/page/${encodeURIComponent(resource)}`, title: query };
  } catch (error) {
    return { extract: `Error fetching DBpedia data for "${query}".`, url: `https://dbpedia.org/page/${encodeURIComponent(resource)}`, title: query };
  }
}

async function fetchDictionarySummary(query) {
  const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return { extract: `No dictionary definition found for "${query}".`, url: `https://www.merriam-webster.com/dictionary/${encodeURIComponent(query)}`, title: query };
    }
    
    const data = await response.json();
    if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
      const meaning = data[0].meanings[0];
      const partOfSpeech = meaning.partOfSpeech || '';
      const definition = meaning.definitions[0]?.definition || 'No definition available.';
      const example = meaning.definitions[0]?.example;
      
      let extract = `${query} (${partOfSpeech}): ${definition}`;
      if (example) extract += ` Example: "${example}"`;
      
      return {
        extract,
        url: `https://www.merriam-webster.com/dictionary/${encodeURIComponent(query)}`,
        title: query
      };
    }
    
    return { extract: `No definition available for "${query}".`, url: `https://www.merriam-webster.com/dictionary/${encodeURIComponent(query)}`, title: query };
  } catch (error) {
    return { extract: `Error fetching dictionary data for "${query}".`, url: `https://www.merriam-webster.com/dictionary/${encodeURIComponent(query)}`, title: query };
  }
}

async function fetchWiktionarySummary(query) {
  const apiUrl = `https://en.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      return { extract: `No Wiktionary entry found for "${query}".`, url: `https://en.wiktionary.org/wiki/${encodeURIComponent(query)}`, title: query };
    }
    
    const data = await response.json();
    return {
      extract: data.extract || `No definition available for "${query}".`,
      url: data.content_urls?.desktop?.page || `https://en.wiktionary.org/wiki/${encodeURIComponent(query)}`,
      title: data.title || query
    };
  } catch (error) {
    return { extract: `Error fetching Wiktionary data for "${query}".`, url: `https://en.wiktionary.org/wiki/${encodeURIComponent(query)}`, title: query };
  }
}

async function fetchOpenLibrarySummary(query) {
  const apiUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=1`;
  
  try {
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      return { extract: `No Open Library results found for "${query}".`, url: `https://openlibrary.org/search?q=${encodeURIComponent(query)}`, title: query };
    }
    
    const data = await response.json();
    if (!data.docs || data.docs.length === 0) {
      return { extract: `No books or authors found for "${query}" in Open Library.`, url: `https://openlibrary.org/search?q=${encodeURIComponent(query)}`, title: query };
    }
    
    const book = data.docs[0];
    const title = book.title || query;
    const author = book.author_name ? book.author_name.join(', ') : 'Unknown author';
    const year = book.first_publish_year || 'Unknown year';
    const key = book.key;
    
    let extract = `"${title}" by ${author} (${year}).`;
    if (book.publisher && book.publisher[0]) {
      extract += ` Publisher: ${book.publisher[0]}.`;
    }
    if (book.subject && book.subject.length > 0) {
      extract += ` Topics: ${book.subject.slice(0, 3).join(', ')}.`;
    }
    
    return {
      extract,
      url: `https://openlibrary.org${key}`,
      title
    };
  } catch (error) {
    return { extract: `Error fetching Open Library data for "${query}".`, url: `https://openlibrary.org/search?q=${encodeURIComponent(query)}`, title: query };
  }
}

async function fetchTriviaSummary(query) {
  // Try to detect if query is a number
  const numMatch = query.match(/\d+/);
  
  if (numMatch) {
    const num = numMatch[0];
    const apiUrl = `http://numbersapi.com/${num}/trivia`;
    
    try {
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const fact = await response.text();
        return {
          extract: fact,
          url: `http://numbersapi.com/${num}`,
          title: num
        };
      }
    } catch (error) {
      // Fall through to Wikipedia fallback
    }
  }
  
  // Fallback to Wikipedia for non-numbers or if numbersapi fails
  try {
    const wikiResult = await fetchWikipediaSummary(query);
    if (wikiResult.extract && !wikiResult.extract.includes('No Wikipedia article')) {
      return {
        extract: wikiResult.extract,
        url: wikiResult.url,
        title: wikiResult.title
      };
    }
  } catch (error) {
    // Continue to final fallback
  }
  
  return {
    extract: `No trivia available for "${query}". Try a number or notable topic.`,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}+fun+facts`,
    title: query
  };
}

// Utility Functions
function truncate(text, max = TRUNCATE_LENGTH) {
  if (!text) return text;
  return text.length > max ? text.slice(0, max).trim() + '…' : text;
}

// Settings Panel
function showSettingsPanel() {
  if (!popup) return;
  if (settingsPanel) settingsPanel.remove();

  // Pause auto-hide while panel is open
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }

  settingsPanel = document.createElement('div');
  settingsPanel.className = 'quick-explain-settings-panel';

  const title = document.createElement('div');
  title.className = 'quick-explain-settings-title';
  title.textContent = 'Quick Explain Settings';

  const sourceLabel = document.createElement('label');
  sourceLabel.className = 'quick-explain-settings-label';
  sourceLabel.textContent = 'Source';

  const sourceSelect = document.createElement('select');
  sourceSelect.className = 'quick-explain-settings-select';
  Object.entries(SOURCES).forEach(([key, value]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = value.label;
    if (getStoredSource() === key) option.selected = true;
    sourceSelect.appendChild(option);
  });

  sourceSelect.addEventListener('change', () => {
    setStoredSource(sourceSelect.value);
    updateHeaderLabels();
  });

  const toneLabel = document.createElement('label');
  toneLabel.className = 'quick-explain-settings-label';
  toneLabel.textContent = 'Tone';

  const toneSelect = document.createElement('select');
  toneSelect.className = 'quick-explain-settings-select';
  Object.entries(TONES).forEach(([key, value]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = value.label;
    if (getStoredTone() === key) option.selected = true;
    toneSelect.appendChild(option);
  });

  toneSelect.addEventListener('change', () => {
    setStoredTone(toneSelect.value);
    updateHeaderLabels();
  });

  const actions = document.createElement('div');
  actions.className = 'quick-explain-settings-actions';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'quick-explain-settings-close';
  closeBtn.textContent = 'Done';
  closeBtn.addEventListener('click', () => {
    if (settingsPanel) {
      settingsPanel.remove();
      settingsPanel = null;
    }
    autoHideTimer = setTimeout(removePopup, AUTO_HIDE_DELAY);
  });

  actions.appendChild(closeBtn);

  settingsPanel.appendChild(title);
  settingsPanel.appendChild(sourceLabel);
  settingsPanel.appendChild(sourceSelect);
  settingsPanel.appendChild(toneLabel);
  settingsPanel.appendChild(toneSelect);
  settingsPanel.appendChild(actions);

  popup.appendChild(settingsPanel);
}

function showPopup(rect, { text, title, url }) {
  removePopup();

  popup = document.createElement('div');
  popup.className = 'quick-explain-popup';
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-label", title ? `Quick explanation: ${title}` : "Quick explanation");
  popup.setAttribute("tabindex", "0");

  // Source/tone header
  const sourceHeader = document.createElement("div");
  sourceHeader.className = "quick-explain-source-header";

  const sourceInfo = SOURCES[getStoredSource()] || SOURCES.auto;
  const toneInfo = TONES[getStoredTone()] || TONES.friendly;

  const sourceLabel = document.createElement("div");
  sourceLabel.className = "quick-explain-source-label";
  sourceLabel.innerHTML = `<i class="quick-explain-source-icon ${sourceInfo.icon || 'fa-solid fa-wand-magic-sparkles'}"></i><span class="quick-explain-source-text">${sourceInfo.label || 'Auto (Recommended)'}</span>`;

  const toneLabel = document.createElement("div");
  toneLabel.className = "quick-explain-tone-label";
  toneLabel.textContent = toneInfo.label || 'More Friendly';

  sourceHeader.appendChild(sourceLabel);
  sourceHeader.appendChild(toneLabel);

  // summary + read-more link + controls
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

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.innerHTML = "✕";
  closeBtn.setAttribute("aria-label", "Close explanation");
  closeBtn.className = "quick-explain-close";

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
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showSettingsPanel();
  });

  closeBtn.addEventListener("click", removePopup);

  controls.appendChild(readMore);
  controls.appendChild(themeToggle);
  controls.appendChild(settingsBtn);
  controls.appendChild(closeBtn);

  popup.appendChild(sourceHeader);
  popup.appendChild(content);
  popup.appendChild(controls);

  // Append to DOM
  document.body.appendChild(popup);

  // Positioning with viewport clamping
  const padding = 8;
  const popupRect = popup.getBoundingClientRect();

  // Vertical: below selection, else above, then clamp
  let top = rect.bottom + padding;
  if (top + popupRect.height > window.innerHeight - padding) {
    top = rect.top - popupRect.height - padding;
  }
  // Final vertical clamp to viewport
  top = Math.max(padding, Math.min(top, window.innerHeight - popupRect.height - padding));

  // Horizontal: align left to selection, then clamp
  let left = rect.left;
  const maxLeft = window.innerWidth - popupRect.width - padding;
  left = Math.min(left, maxLeft);
  left = Math.max(padding, left);

  // Use viewport coordinates (position: fixed)
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  applyTheme(getEffectiveTheme());

  // Prevent immediate outside-click dismissal from the same interaction
  ignoreClickUntil = Date.now() + CLICK_IGNORE_DELAY;

  // Show with opacity transition
  requestAnimationFrame(() => {
    if (popup && popup.parentNode) {
      popup.style.opacity = '1';
      popup.focus();
    }
  });

  // Auto-hide timer
  autoHideTimer = setTimeout(removePopup, AUTO_HIDE_DELAY);
}

// Selection Handler
async function handleSelection(maxWords = MAX_WORDS, maxChars = MAX_CHARS) {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
    return removePopup();
  }

  const raw = sel.toString().trim().replace(/^[\W_]+|[\W_]+$/g, '');
  const words = raw.split(/\s+/).filter(Boolean);
  
  if (!raw || words.length === 0) {
    return removePopup();
  }
  
  if (words.length > maxWords || raw.length > maxChars) {
    return removePopup();
  }

  // Avoid duplicate requests for same selection
  if (lastSelection && lastSelection.text === raw && Date.now() - lastSelection.time < SELECTION_CACHE_DURATION) {
    return;
  }
  lastSelection = { text: raw, time: Date.now() };

  // Get bounding rectangle safely
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
  
  if (!rect) {
    return removePopup();
  }

  // Show loading placeholder
  showPopup(rect, { text: 'Loading…', title: raw, url: null });

  try {
    const { extract, url, title } = await fetchData(raw);
    const truncated = truncate(extract);
    showPopup(rect, { text: truncated, title, url });
  } catch (error) {
    console.error('Error fetching explanation:', error);
    showPopup(rect, { text: 'Error loading information.', title: raw, url: null });
  }
}

// Event Listeners

// Handle text selection
document.addEventListener('mouseup', (e) => {
  if (popup && popup.contains(e.target)) return;
  handleSelection();
});

document.addEventListener('dblclick', (e) => {
  if (popup && popup.contains(e.target)) return;
  handleSelection();
});

// Close popup on outside click
document.addEventListener('click', (e) => {
  if (Date.now() < ignoreClickUntil) return;
  if (!popup) return;
  if (!popup.contains(e.target)) {
    removePopup();
  }
});

// Close popup on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    removePopup();
  }
});

// Close popup on window resize or scroll
window.addEventListener('resize', removePopup);
window.addEventListener('scroll', removePopup, { passive: true });
