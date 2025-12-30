# QuickExplain

Browser extension that shows instant explanations for selected text with multiple knowledge sources.

## Features

**Multiple Sources**
- 🤖 Auto (Recommended) - Wikipedia by default
- 📚 Wikipedia - General summaries
- 📊 Wikidata - Structured facts
- 🔗 DBpedia - Linked data abstracts
- 📖 Dictionary - Definitions and usage
- 🔤 Wiktionary - Etymology and language details
- 📘 Open Library - Book information
- ✨ Numbers & Trivia - Fun facts

**Customization**
- Three tone options: Friendly, Academic, Power-User
- Dark/light theme with system detection
- Settings panel accessible from popup

**Smart Behavior**
- Auto-hide after 8 seconds
- Selection limit: 4 words, 60 characters
- Responsive positioning

## Installation

1. Open browser extensions page
2. Enable developer mode
3. Load unpacked extension folder

## Usage

Select text (≤4 words) → popup appears → click ⚙️ for settings or ☀️/🌙 for theme

## Browser Compatibility

- Chrome/Edge (Manifest V3)
- Firefox (with minor adjustments)
- Other Chromium-based browsers

## Project Structure

```
quick-explain/
├── manifest.json    # Extension configuration
├── content.js       # Core logic and API integrations
├── styles.css       # Popup and UI styling
└── README.md        # Documentation
```

## Technologies

- Vanilla JavaScript (no dependencies)
- Chrome Extension Manifest V3
- REST APIs: Wikipedia, Wikidata, DBpedia, Dictionary, Wiktionary, Open Library, Numbers API
- CSS Custom Properties for theming
- LocalStorage for preferences

## Development

1. Clone or download the repository
2. Make changes to `content.js`, `styles.css`, or `manifest.json`
3. Reload extension in browser to test changes
4. Use browser DevTools console for debugging

## Troubleshooting

**Popup not appearing:**
- Check if text selection is within limits (≤4 words, ≤60 chars)
- Verify extension is enabled in browser
- Check browser console for errors

**No data loading:**
- Verify internet connection
- Check if APIs are accessible (some may require CORS)
- Try switching to Wikipedia source in settings

**Settings not saving:**
- Check browser localStorage permissions
- Try in normal browsing mode (not incognito)

## License

MIT License - feel free to modify and distribute
