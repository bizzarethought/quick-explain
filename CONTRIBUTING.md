# Contributing to QuickExplain

Thank you for your interest in contributing to QuickExplain.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/bizzarethought/quick-explain
   cd quick-explain
   ```
3. **Load the extension** in your browser:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the project folder

## Development Workflow

### Making Changes

1. **Create a branch** for your feature/fix:
   ```bash
   git checkout -b feature/descriptive-name
   ```

2. **Make your changes** to the relevant files:
   - `content.js` - Core logic and API integrations
   - `styles.css` - UI styling and themes
   - `background.js` - Extension lifecycle
   - `manifest.json` - Extension configuration

3. **Test your changes**:
   - Reload the extension in `chrome://extensions/`
   - Test on various websites
   - Verify both light and dark themes
   - Check all source options
   - Test edge cases (long selections, special characters, etc.)

4. **Check for errors**:
   - Open DevTools Console
   - Look for any JavaScript errors
   - Verify API calls are successful

### Code Style

- Use **consistent indentation** (2 spaces)
- Add **comments** for complex logic
- Use **meaningful variable names**
- Keep functions **small and focused**
- Follow existing **code organization patterns**
- Use **ES6+ features** where appropriate

### Commit Guidelines

Write clear commit messages:
```
<type>: <subject>

<optional body>
```

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Example:
```
feat: Add Google Scholar as new knowledge source

- Integrate Google Scholar API
- Add scholar icon and label
- Update settings panel with new option
```

### Pull Request Process

1. **Update documentation** if needed (README.md, CHANGELOG.md)
2. **Ensure code is clean** and tested
3. **Create a Pull Request** with:
   - Clear title describing the change
   - Detailed description of what and why
   - Screenshots/GIFs for UI changes
   - Reference any related issues

4. **Respond to feedback** from reviewers
5. **Wait for approval** before merging

## Adding New Features

### Adding a New Knowledge Source

1. **Add source definition** in `content.js`:
   ```javascript
   const SOURCES = {
     // ... existing sources
     newsource: {
       label: 'Source Name',
       description: 'Brief description',
     }
   };
   ```

2. **Create fetch function**:
   ```javascript
   async function fetchNewSourceSummary(query) {
     const apiUrl = `https://api.example.com/search?q=${encodeURIComponent(query)}`;
     
     try {
       const response = await fetch(apiUrl);
       if (!response.ok) {
         return { extract: "No data found.", url: null, title: query };
       }
       
       const data = await response.json();
       return {
         extract: data.summary || "No summary available.",
         url: data.link || null,
         title: data.title || query
       };
     } catch (error) {
       return { extract: "Error fetching data.", url: null, title: query };
     }
   }
   ```

3. **Add case to fetchData switch**:
   ```javascript
   case 'newsource':
     return fetchNewSourceSummary(query);
   ```

4. **Test thoroughly** with various queries

### Adding UI Improvements

1. Update `styles.css` with new styles
2. Ensure both light and dark themes work
3. Test on different screen sizes
4. Verify accessibility (keyboard navigation, ARIA labels)

## Bug Reports

When reporting bugs, include:
- Browser version
- Extension version
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)
- Screenshots/recordings

## Feature Requests

When requesting features:
- Describe the use case
- Explain the expected behavior
- Provide examples or mockups
- Consider implementation complexity

## Questions

Open an issue for:
- Questions about the code
- Clarification on features
- General discussions

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Keep discussions on-topic

Thank you for contributing.
