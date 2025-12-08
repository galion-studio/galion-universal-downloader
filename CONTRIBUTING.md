# 🏴‍☠️ Contributing to Galion Universal Downloader

<div align="center">

  **"Your Only Limit Is Your Imagination"**

  *Thank you for your interest in making Galion better!*

</div>

---

## 🎯 Our Mission

We're building the **ultimate universal downloader** - free, open source, and unstoppable. Like The Pirate Bay before us, we believe in information freedom and user empowerment.

**This project belongs to the community. Your contributions make it stronger.**

---

## 🤝 How to Contribute

### 1. Fork & Clone

```bash
# Fork via GitHub UI, then:
git clone https://github.com/YOUR-USERNAME/galion-universal-downloader.git
cd galion-universal-downloader
```

### 2. Set Up Development Environment

```bash
# Frontend (React + Vite)
cd galion-v2
npm install
npm run dev

# Backend (Node.js) - in root directory
npm install
npm start
```

### 3. Create a Feature Branch

```bash
git checkout -b feature/your-amazing-feature
# or
git checkout -b fix/bug-you-found
```

### 4. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Test your changes

### 5. Commit & Push

```bash
git add .
git commit -m "feat: add amazing new feature"
git push origin feature/your-amazing-feature
```

### 6. Open a Pull Request

Go to GitHub and open a PR against `main`. Describe what you did and why.

---

## 📋 What We Need Help With

### 🔥 High Priority
- [ ] Download queue system
- [ ] Pause/resume functionality
- [ ] More platform integrations
- [ ] Mobile-responsive UI improvements
- [ ] Performance optimizations

### 🎨 UI/UX
- [ ] New animation ideas
- [ ] Theme variations
- [ ] Accessibility improvements
- [ ] Mobile design

### 🔧 Backend
- [ ] New platform handlers
- [ ] API improvements
- [ ] Error handling
- [ ] Rate limiting & retry logic

### 📖 Documentation
- [ ] Tutorials and guides
- [ ] Translations
- [ ] Code comments
- [ ] API documentation

### 🧪 Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Bug reports

---

## 🎨 Code Style

### TypeScript/JavaScript
```typescript
// Use meaningful names
const downloadProgress = 0;

// Document complex functions
/**
 * Downloads content from a specific platform
 * @param url - The URL to download from
 * @param options - Download options
 * @returns Promise resolving to download result
 */
async function downloadFromPlatform(url: string, options: DownloadOptions): Promise<DownloadResult> {
  // ...
}

// Prefer const over let
const config = getConfig();

// Use async/await over callbacks
const result = await fetchData();
```

### React Components
```tsx
// Use functional components with hooks
export function MyComponent({ prop }: Props) {
  const [state, setState] = useState<Type>(initialValue);
  
  return (
    <div className="semantic-class-name">
      {/* Content */}
    </div>
  );
}
```

### CSS/Tailwind
```tsx
// Prefer Tailwind utility classes
<div className="flex items-center gap-4 p-6 rounded-lg bg-card">

// Use semantic class names for complex styles in index.css
<div className="card-3d shimmer hover:scale-105">
```

---

## 📝 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new download feature
fix: resolve progress bar issue
docs: update README
style: improve button animations
refactor: simplify platform detection
test: add unit tests for downloader
chore: update dependencies
```

---

## 🐛 Reporting Bugs

1. Check if the bug is already reported in [Issues](https://github.com/galion-studio/galion-universal-downloader/issues)
2. If not, create a new issue with:
   - **Title**: Clear, concise description
   - **Steps to Reproduce**: How to trigger the bug
   - **Expected Behavior**: What should happen
   - **Actual Behavior**: What actually happens
   - **Screenshots**: If applicable
   - **Environment**: OS, browser, Node version

---

## 💡 Feature Requests

We love new ideas! When suggesting features:

1. **Search existing issues** first
2. **Describe the problem** you're trying to solve
3. **Propose a solution** if you have one
4. **Consider alternatives** you've thought about

---

## 🏴‍☠️ The Pirate Code

As contributors to this project, we agree to:

1. **Write code that empowers users**
2. **Keep the project open source forever**
3. **Welcome contributions from everyone**
4. **Respect each other and the community**
5. **Fight for information freedom**
6. **Never add tracking, telemetry, or backdoors**
7. **Maintain user privacy above all**

---

## ⚖️ Legal Notes

By contributing, you agree that:

- Your contributions are your own original work
- You grant the project an MIT license to your contributions
- You understand this is a tool for legitimate content downloading
- You won't add malicious code, backdoors, or tracking firmware

---

## 🎖️ Recognition

Contributors are recognized in:
- The README contributors section
- Release notes
- Our eternal gratitude 🙏

---

## 📞 Getting Help

- 💬 **GitHub Issues** - For bugs and features
- 📖 **Documentation** - Check the docs first
- 🌐 **galion.app** - Talk to Galion AI

---

## 🏴‍☠️ Final Words

> "In a world of closed doors and paywalls, 
> we build bridges and open windows.
> Every line of code is an act of liberation.
> Every contribution makes the tool stronger.
> Together, we are unstoppable."
>
> — The Galion Manifesto

**Thank you for being part of this journey. Your Only Limit Is Your Imagination. 🏴‍☠️**

---

<div align="center">

  Made with ❤️ by contributors worldwide

  [Back to README](README.md) | [View Issues](https://github.com/galion-studio/galion-universal-downloader/issues)

</div>
