# Contributing to Galion Universal Downloader

First off, thank you for considering contributing to Galion! 🎉

It's people like you that make Galion such a great tool. We welcome contributions from everyone, whether you're a seasoned developer or just getting started.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and inclusive environment. By participating, you are expected to:

- **Be respectful** - Treat everyone with respect and consideration
- **Be constructive** - Focus on what is best for the community
- **Be patient** - Remember that everyone has different experience levels
- **Be kind** - A little kindness goes a long way

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR-USERNAME/universal-downloader.git
cd universal-downloader
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/galion-studio/galion-universal-downloader.git
```

---

## 💡 How Can I Contribute?

### 🐛 Reporting Bugs

Found a bug? We'd love to know about it!

1. **Search existing issues** - Check if someone else already reported it
2. **Create a new issue** - If not, create a detailed bug report with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, Node version, browser)

### ✨ Suggesting Features

Have an idea? We want to hear it!

1. **Search existing issues** - Maybe someone already suggested it
2. **Create a feature request** with:
   - Clear description of the feature
   - Why it would be useful
   - Possible implementation ideas (optional)

### 💻 Code Contributions

Ready to write some code? Here's how:

1. **Find an issue** - Look for issues labeled `good first issue` or `help wanted`
2. **Comment** - Let us know you're working on it
3. **Fork & Branch** - Create a feature branch
4. **Code** - Write your amazing code
5. **Test** - Make sure it works
6. **PR** - Submit a pull request

### 📖 Documentation

Documentation is just as important as code!

- Fix typos
- Clarify confusing sections
- Add examples
- Translate to other languages

### 🌍 Adding New Platforms

Want to add support for a new platform? Here's the pattern:

```typescript
// src/platforms/NewPlatform.js

export class NewPlatformHandler {
  static canHandle(url: string): boolean {
    return url.includes('newplatform.com')
  }

  static async download(url: string, options: DownloadOptions): Promise<DownloadResult> {
    // Your download logic here
  }
}
```

---

## 🛠️ Development Setup

### Install Dependencies

```bash
# Root project
npm install

# Frontend (galion-v2)
cd galion-v2
npm install
```

### Start Development Server

```bash
# Frontend
cd galion-v2
npm run dev
```

### Build for Production

```bash
cd galion-v2
npm run build
```

---

## 📝 Pull Request Process

### Before Submitting

1. **Update your fork** with the latest upstream changes:

```bash
git fetch upstream
git rebase upstream/main
```

2. **Test your changes** - Make sure everything works
3. **Lint your code** - Follow our style guidelines
4. **Write meaningful commits** - Clear, concise commit messages

### PR Template

When you submit a PR, please include:

```markdown
## Description
Brief description of your changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Other (please describe)

## Testing
How did you test these changes?

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have tested my changes
- [ ] I have updated the documentation if needed
```

### Review Process

1. A maintainer will review your PR
2. They may request changes - that's normal!
3. Once approved, your PR will be merged
4. Celebrate! 🎉

---

## 🎨 Style Guidelines

### Code Style

- **TypeScript** - Use TypeScript for type safety
- **Formatting** - We use Prettier for consistent formatting
- **Naming** - Use clear, descriptive names
- **Comments** - Write comments for complex logic

### Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

### File Organization

- **Components** - One component per file
- **Hooks** - Custom hooks in `src/hooks/`
- **Utils** - Helper functions in `src/lib/`
- **Types** - TypeScript types in appropriate files

---

## 🌐 Community

### Get Help

- **GitHub Issues** - For bugs and features
- **Discussions** - For questions and ideas

### Stay Updated

- ⭐ Star the repository
- 👀 Watch for updates
- 🍴 Fork to experiment

---

## 🙏 Thank You!

Every contribution, no matter how small, helps make Galion better. Whether you're fixing a typo, reporting a bug, or building a new feature – you're making a difference.

**Happy coding!** 💻✨

---

<p align="center">
  <strong>Made with ❤️ by the Galion community</strong>
</p>
