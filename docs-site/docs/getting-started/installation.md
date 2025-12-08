---
sidebar_position: 1
---

# Installation

Get Galion Universal Downloader running on your machine in minutes.

## Prerequisites

Before installing, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

## Quick Installation

### 1. Clone the Repository

```bash
git clone https://github.com/galion-studio/galion-universal-downloader.git
cd galion-universal-downloader
```

### 2. Install Dependencies

```bash
# Navigate to the frontend
cd galion-v2

# Install with npm
npm install

# Or with yarn
yarn install
```

### 3. Start the Development Server

```bash
npm run dev
```

### 4. Open in Browser

Navigate to [http://localhost:5173](http://localhost:5173) 🎉

## Alternative: Direct Download

You can also download the latest release directly:

1. Go to [Releases](https://github.com/galion-studio/galion-universal-downloader/releases)
2. Download the latest `.zip` file
3. Extract and run

## Docker (Coming Soon)

```bash
docker pull galion/universal-downloader
docker run -p 3000:3000 galion/universal-downloader
```

## Verify Installation

If everything is working correctly, you should see:

- The Galion UI loading in your browser
- "Galion Universal Downloader" title at the top
- A URL input field ready for pasting links

## Troubleshooting

### Port Already in Use

If port 5173 is busy:

```bash
npm run dev -- --port 3001
```

### Node Version Too Old

```bash
# Check your version
node --version

# Should be 18.0.0 or higher
```

### Dependencies Failed to Install

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- [Usage Guide](./usage) - Learn how to use Galion
- [Configuration](./configuration) - Customize your setup
- [API Keys](./api-keys) - Set up optional API keys
