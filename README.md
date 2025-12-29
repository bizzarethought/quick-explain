<<<<<<< HEAD
# QuickExplain Browser Extension

A browser extension that provides quick explanations for highlighted text with customizable source selection and tone options.

## Features

### Source Selection
Choose from different knowledge sources based on your needs:

- **Auto (Recommended)** 🤖 - Automatically selects the best source based on the highlighted text
- **Wikipedia** 📚 - General background and concise explanations for people, places, concepts, and events
- **Wikidata** 📊 - Structured, factual summaries: dates, roles, categories, and relationships
- **DBpedia** 🔗 - Short abstracts with clean, structured information pulled from linked data
- **Dictionary** 📖 - Clear definitions, usage, and examples for words and phrases
- **Wiktionary** 🔤 - Definitions plus etymology, grammar, and historical usage
- **Open Library** 📘 - Descriptions, authorship, and publication context for books and literary works
- **Numbers & Trivia** ✨ - Quick, surprising facts about numbers, dates, and figures

### Tone Options
Customize how the information is presented:

- **More Friendly** - Conversational and approachable tone
- **More Academic** - Formal and precise language
- **Power-User / Advanced** - Technical and detailed explanations

### Additional Features
- Dark/light theme support with system preference detection
- Settings panel for easy customization
- Auto-hide functionality (8 seconds)
- Responsive design that works on different screen sizes
- Smart selection limits (4 words, 60 characters max for optimal UX)

## Installation

1. Open your browser's extension management page
2. Enable developer mode
3. Click "Load unpacked" and select the QuickExplain extension folder
4. The extension is now active on all websites

## Usage

1. Highlight any text (up to 4 words, 60 characters)
2. A popup will appear with information about the selected text
3. Click the ⚙️ settings button to change your source and tone preferences
4. Use the theme toggle (☀️/🌙) to switch between light and dark modes

## Technical Implementation

### Files Structure
- `manifest.json` - Extension manifest configuration
- `content.js` - Main extension logic and popup functionality
- `styles.css` - Styling for the popup and settings panel
- `test.html` - Test page for demonstrating functionality

### Key Components

#### Source Management
```javascript
const SOURCES = {
  auto: { label: 'Auto (Recommended)', description: '...', icon: '🤖' },
  wikipedia: { label: 'Wikipedia — Overview', description: '...', icon: '📚' },
  // ... others
};

const TONES = {
  friendly: { label: 'More Friendly', description: '...' },
  academic: { label: 'More Academic', description: '...' },
  poweruser: { label: 'Power-User / Advanced', description: '...' }
};
```

#### Data Fetching
The extension uses a modular approach to fetch data from different sources:
- `fetchData()` - Routes requests based on selected source
- Individual fetch functions for each data source
- Placeholder implementations that can be extended with real APIs

#### Settings Persistence
User preferences are stored locally using localStorage:
- `quickExplainSource` - Selected knowledge source
- `quickExplainTone` - Selected tone preference
- `quickExplainTheme` - Theme preference (light/dark)

## Customization

### Adding New Sources
1. Add the source to the `SOURCES` object in `content.js`
2. Create a corresponding fetch function
3. Update the `fetchData()` switch statement

### Adding New Tones
1. Add the tone to the `TONES` object in `content.js`
2. Update tone-based response formatting as needed

### Styling
The CSS uses CSS custom properties for easy theming:
```css
:root {
  --qe-bg: #fff;
  --qe-color: #111;
  --qe-border: rgba(0,0,0,0.12);
}
```

## Browser Compatibility

This extension is built with Manifest V3 and should work in:
- Chrome 88+
- Firefox 60+
- Edge 79+
- Other Chromium-based browsers

## Future Enhancements

Potential improvements that could be added:
- Search history and favorites
- Keyboard shortcuts for quick access
- Integration with external knowledge bases
=======
# QuickExplain

A Chrome extension that shows instant Wikipedia summaries for highlighted text.

## Features
- Highlight text to get a Wikipedia summary
- Double-click a word to see a popup
- Lightweight and non-intrusive UI

## Tech Stack
- JavaScript
- Chrome Extensions API (Manifest V3)
- Wikipedia REST API

## Roadmap
- Click outside to close popup
- Improve popup positioning near screen edges
- Add AI-powered summaries
>>>>>>> 8eb9c941ebd72cc7c193f31ffc34c7f76db3d408
