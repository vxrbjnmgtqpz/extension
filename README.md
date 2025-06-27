# WorkStation Chat System - Technical Documentation

## System Overview

This is a multi-agent chat system with real-time message relay capabilities, featuring separate proxy windows for each AI agent and a unified chat interface. The system uses file-based state management with JSON files as the primary data storage mechanism.

## Architecture Components

### 1. Backend Server (`server.js`)

- **Port**: 3001
- **Framework**: Express.js with CORS enabled
- **Endpoints**:
  - `/write-message`: Writes messages to agent-specific relay files
  - `/write-proxy-message`: Writes messages from proxy windows to relay files
  - `/write-user-proxy-message`: Writes user messages to userProxy.json
- **File Management**: Handles reading/writing to all JSON files in the `public/` directory

### 2. Frontend Chat Interface (`npm run vite`)

- **Port**: 5173
- **Framework**: React + TypeScript + Vite
- **Main Component**: `components/ChatRouter/ChatRouter.tsx`
- **Features**:
  - Multi-tab interface: 📝 All, 🧠 ChatGPT, 🤖 Cursor, 🛠️ Copilot
  - Real-time message polling (every 2 seconds)
  - Colored user message borders in "All" tab indicating target agent
  - Message forwarding capabilities
  - Auto-scroll and manual scroll controls

### 3. Electron Proxy Launcher (`npm run proxy-launcher`)

- **File**: `proxy-launcher.js`
- **Features**:
  - Creates 4 always-on-top floating windows
  - Built-in file server on port 8080 for JSON access
  - 2x2 grid layout positioning
  - Individual windows for each agent proxy

### 4. Proxy Windows (HTML Files)

- `proxy-user.html`: User message input with live userProxy.json monitoring
- `proxy-ChatGPT.html`: ChatGPT-specific message input
- `proxy-Cursor.html`: Cursor-specific message input
- `proxy-Copilot.html`: Copilot-specific message input

## Data Flow Architecture

### Core Data Files

#### `public/userProxy.json`

```json
{
  "messages": [
    {
      "timestamp": "2025-05-28T11:19:51.013Z",
      "From": "User",
      "message": "User message content",
      "toAgent": "chatgpt"
    }
  ]
}
```

#### Agent Relay Files

- `public/ChatGPTRelay.json`
- `public/CursorRelay.json`
- `public/CopilotRelay.json`

```json
{
  "messages": [
    {
      "timestamp": "2025-05-28T11:19:51.013Z",
      "sender": "User|Assistant|System",
      "message": "Message content"
    }
  ]
}
```

### Message Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│ User Input      │───▶│ userProxy.json   │───▶│ Agent Relay Files   │
│ (Proxy Windows) │    │ (Central Store)  │    │ (ChatGPT/Cursor/   │
└─────────────────┘    └──────────────────┘    │  Copilot Relay)     │
                                │               └─────────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────────┐
                       │ proxy-user.html  │    │ Chat Interface      │
                       │ (Live Display)   │    │ (React Frontend)    │
                       └──────────────────┘    └─────────────────────┘
```

## Detailed Component Breakdown

### User Message Processing

1. **Input Source**: User types in any proxy window (ChatGPT, Cursor, Copilot)
2. **Primary Storage**: Message written to `userProxy.json` with `toAgent` field
3. **Relay Distribution**: Backend copies message to appropriate `AgentRelay.json` file
4. **Live Monitoring**: `proxy-user.html` polls `userProxy.json` and displays latest message
5. **Interface Display**: React chat interface reads relay files and displays with colored borders

### Message Display Logic

#### Individual Agent Tabs (🧠 ChatGPT, 🤖 Cursor, 🛠️ Copilot)

- **Content**: ONLY agent responses from respective relay files
- **No User Messages**: Prevents message duplication
- **Purpose**: Clean view of agent-specific conversations

#### All Tab (📝 All)

- **Content**: Combined messages from all agents + user messages
- **User Message Borders**: Color-coded based on `toAgent` field
  - 🤖 Cursor: Cyan border (`#2D5A4E`)
  - 🧠 ChatGPT: Purple border (`#4C3670`)
  - 🛠️ Copilot: Slate border (`#4A5568`)
- **Border Logic**: `selectedTab === "all" && line.sender === "User"`

### File Server Architecture

#### Electron File Server (Port 8080)

- **Purpose**: Serves JSON files to proxy windows
- **Access**: `http://localhost:8080/userProxy.json`
- **Security**: Local-only access, no external exposure

#### Backend API Server (Port 3001)

- **Purpose**: Handles write operations to JSON files
- **Endpoints**: RESTful API for message management
- **CORS**: Enabled for cross-origin requests

## Critical Implementation Notes

### ⚠️ Message Duplication Prevention

**NEVER add user messages to individual agent tabs** - this causes message duplication. User messages should ONLY appear in the "All" tab with colored borders.

### Border Color System

- Colors are defined in `AGENT_THEMES` object
- Applied only when: `selectedTab === "all" && line.sender === "User"`
- Fallback logic: `line.targetAgent || line.agent || "cursor"`

### Polling Strategy

- **Frontend**: Polls relay files every 2 seconds
- **Proxy Windows**: Monitor userProxy.json for live updates
- **No WebSocket**: System uses HTTP polling for simplicity

## File Structure

```
/
├── server.js                 # Backend Express server
├── proxy-launcher.js         # Electron app launcher
├── package.json              # Dependencies and scripts
├── components/
│   └── ChatRouter/
│       └── ChatRouter.tsx    # Main chat interface
└── public/
    ├── userProxy.json        # Central user message store
    ├── ChatGPTRelay.json     # ChatGPT messages
    ├── CursorRelay.json      # Cursor messages
    ├── CopilotRelay.json     # Copilot messages
    ├── proxy-user.html       # User proxy window
    ├── proxy-ChatGPT.html    # ChatGPT proxy window
    ├── proxy-Cursor.html     # Cursor proxy window
    └── proxy-Copilot.html    # Copilot proxy window
```

## Running the System

1. **Backend**: `npm run dev` (port 3001)
2. **Frontend**: `npm run vite` (port 5173)
3. **Proxy Windows**: `npm run proxy-launcher` (Electron app)

All three components must be running simultaneously for full functionality.

## Data Persistence

- **No Browser Storage**: System explicitly avoids WebSockets, LocalStorage, SessionStorage
- **File-Based State**: All state persisted in local JSON files
- **Destructive Records**: userProxy.json maintains latest user message state
- **Relay Accumulation**: Agent relay files accumulate conversation history
