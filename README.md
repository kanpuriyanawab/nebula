# Agentic Browser++

A modern, open source, agentic browser built with Electron from scratch.  
It combines classic tabbed browsing with an AI agent that can generate fully functional web apps (like games, tools, and dashboards) on demand, directly in a new tab.

---

## ✨ Features

- **Tabbed Browsing:**  
  Multiple tabs, each with independent navigation and controls.

- **Omnibar:**  
  Type a URL, a search query, or an agent command in a single input.

- **AI Agent Integration:**  
  - Use `/agent <your prompt>` or click "Ask Agent" to instruct the AI to generate a custom web app (e.g., "create tic tac toe app", "make a drawing tool", "build a stock portfolio tracker").
  - The agent returns a complete, self-contained HTML app, loaded instantly in a new tab.

- **Search Mode:**  
  Type `/search <query>` to search Google directly.

- **Modern UI:**  
  Clean, responsive interface with tab management, navigation buttons, and status display.

---

## 🚀 Getting Started

### 1. **Clone the repository**

```bash
git clone https://github.com/yourusername/text-to-tab.git
cd text-to-tab
```

### 2. **Install dependencies**

```bash
npm install
```

### 3. **Set up OpenAI API Key**

Create a `.env` file in the project root with your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

### 4. **Run the app**

```bash
npm start
```

---

## 🕹️ Usage

- **Browse the web:**  
  Enter a URL (e.g., `https://wikipedia.org`) and hit "Go".

- **Search:**  
  Type `/search your query` or just enter a search term (the browser will auto-detect and search Google).

- **Generate an app with the agent:**  
  - Type `/agent create tic tac toe app`  
  - Or type your prompt and click "Ask Agent"  
  - The agent will generate a new tab with your requested app.

- **Tab Management:**  
  - Click "+" to open a new tab.
  - Click "×" on a tab to close it.

---

## 🛠️ Development

- Main Electron process: `src/index.js`
- Renderer/UI logic: `src/renderer.js`
- Agent logic (OpenAI integration): `src/mastraAgent.js`
- HTML UI: `src/index.html`
- Preload (secure API bridge): `src/preload.js`

---

## 📦 Packaging

To build a distributable app, use:

```bash
npm run make
```

(Requires [Electron Forge](https://www.electronforge.io/) or similar setup.)

---

## 📝 License

MIT

---

## 🙏 Credits

- Built with [Electron](https://electronjs.org/)
- Powered by [OpenAI](https://openai.com/)
- Created by [Anshuman](https://heyyanshuman.com)

---
