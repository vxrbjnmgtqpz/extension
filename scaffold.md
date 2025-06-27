# Project Scaffold: WorkStation Chat System

## Directory Structure

```
/ (root)
├── server.js                 # Express backend server (port 3001)
├── proxy-launcher.js         # Electron app for launching proxy windows (port 8080)
├── package.json              # Project dependencies and scripts
├── vite.config.ts            # Vite configuration for frontend
├── tailwind.config.js        # Tailwind CSS configuration
├── index.html                # Main HTML entry for Vite React app
├── public/
│   ├── userProxy.json        # Central user message store (live state)
│   ├── ChatGPTRelay.json     # ChatGPT agent relay log
│   ├── CursorRelay.json      # Cursor agent relay log
│   ├── CopilotRelay.json     # Copilot agent relay log
│   ├── proxy-window.html     # Standalone proxy window UI
│   ├── ...other proxy HTMLs  # (e.g. proxy-user.html, proxy-ChatGPT.html, etc.)
├── src/
│   ├── App.tsx               # Main React app component
│   ├── main.tsx              # React/Vite entry point
│   ├── proxy.tsx             # Proxy window React logic (if used)
│   ├── proxy.html            # Proxy window HTML (if used by Vite)
│   ├── index.css             # Global styles
│   ├── assets/               # Static assets (e.g. SVGs)
├── components/
│   ├── AgentTabs/            # Tab UI for agent selection
│   ├── ChatRouter/           # Main chat router logic
│   ├── MessageComposer/      # User message input component
│   ├── TestingInterface/     # Testing UI for SmartRelay
├── utils/
│   ├── liveMessageServer.ts  # Live message polling/serving logic
│   ├── parseMarkdownChat.ts  # Markdown parsing for chat
│   ├── readLog.ts            # Log file reading utilities
│   ├── readMemory.ts         # Memory file reading utilities
│   ├── simulateReply.ts      # Simulated agent reply logic
│   ├── specstoryWatcher.ts   # SpecStory watcher integration
│   ├── timestamp.ts          # Timestamp formatting utility
│   ├── writeLog.ts           # Log writing utility
├── agent_logs/
│   ├── chatgpt/              # ChatGPT agent logs
│   ├── copilot/              # Copilot agent logs
│   ├── cursor/               # Cursor agent logs
│   ├── meta/                 # Meta logs and scaffolds
├── specstoryold/             # Historical SpecStory logs and scaffolds
├── .specstory/               # SpecStory AI chat/code session artifacts
├── README.md                 # Technical documentation
├── NOTES.TXT                 # Developer notes
```

## File/Directory Details & Functions

- **server.js**: Express server. Handles REST endpoints for writing/relaying messages to JSON files in `public/`. Enables CORS for frontend access. Main endpoints: `/write-message`, `/write-proxy-message`, `/write-user-proxy-message`.
- **proxy-launcher.js**: Electron app. Launches always-on-top proxy windows for each agent. Hosts a file server on port 8080 for JSON file access by proxy windows.
- **public/**: Contains all live JSON state files and standalone HTML proxy UIs. `userProxy.json` is the central user message store; each `*Relay.json` is an agent-specific message log.
- **src/**: Main React app source. `App.tsx` is the root component. `main.tsx` is the entry point. `proxy.tsx`/`proxy.html` are for the proxy window UI if served via Vite.
- **components/**: Modular React components. Includes agent tab UI, chat router, message composer, and a testing interface for SmartRelay.
- **utils/**: Utility scripts for log reading/writing, markdown parsing, timestamp formatting, simulated replies, and SpecStory integration.
- **agent_logs/**: Stores historical and current logs for each agent (ChatGPT, Copilot, Cursor, etc.).
- **specstoryold/**, **.specstory/**: SpecStory session logs, scaffolds, and AI chat/code artifacts for project history and reproducibility.
- **README.md**: Main technical documentation, including architecture, data flow, and usage instructions.
- **NOTES.TXT**: Developer notes and setup instructions.

## Main Functions

- **Backend (server.js)**: Accepts chat messages from proxy windows and frontend, writes to appropriate JSON files, and relays messages to agents.
- **Frontend (src/, components/)**: React app displays chat history, agent tabs, and message composer. Polls JSON files for real-time updates.
- **Proxy Windows (public/proxy-window.html, etc.)**: Standalone HTML UIs for user/agent message input, reading/writing to JSON files via backend or file server.
- **Testing Interface (components/TestingInterface/)**: UI for running and viewing test results, integrated with SmartRelay.
- **Utilities (utils/)**: Support log reading/writing, markdown parsing, timestamp formatting, and simulated agent replies.

---

This scaffold provides a high-level map of the project structure, file purposes, and main functions. See `README.md` for more technical and usage details.
