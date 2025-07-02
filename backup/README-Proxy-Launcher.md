# Proxy Launcher App

An Electron-based application that launches 4 always-on-top proxy windows for seamless agent communication.

## Features

✅ **Always-on-top windows** - All proxy windows float above other applications  
✅ **Topmost z-order priority** - Highest window priority level  
✅ **Individual proxy windows** for each agent:

- 🧠 **ChatGPT Proxy** (`proxy-ChatGPT.html`)
- 🤖 **Cursor Proxy** (`proxy-Cursor.html`)
- 🛠️ **Copilot Proxy** (`proxy-Copilot.html`)
- 👤 **User Proxy** (`proxy-user.html`)

## Quick Start

### 1. Start the Backend Server

```bash
npm run dev
```

This starts the relay server on port 3001.

### 2. Start the Main Chat App

```bash
npm run vite
```

This starts the React chat interface on port 5173.

### 3. Launch Proxy Windows

```bash
npm run proxy-launcher
```

This launches all 4 proxy windows as always-on-top floating windows.

## Window Layout

The proxy windows are automatically positioned in a **2x2 grid** on the right side of your screen:

```
[ChatGPT] [Cursor ]
[Copilot] [User   ]
```

## Window Controls

### Menu Bar Options:

- **Proxy Launcher** → **Restart All Windows** - Recreates all proxy windows
- **Proxy Launcher** → **Quit** (Cmd+Q) - Closes the entire app
- **Window** → Individual window controls to show/focus specific proxies

### Window Behavior:

- **Resizable**: Yes, you can resize each window
- **Minimizable**: Yes, you can minimize individual windows
- **Always-on-top**: Yes, they float above all other apps
- **Frame**: Yes, each window has a title bar for easy dragging

## Usage Workflow

1. **Backend Running**: `npm run dev` (port 3001)
2. **Frontend Running**: `npm run vite` (port 5173)
3. **Proxy Windows**: `npm run proxy-launcher` (floating windows)

### Typical Flow:

1. Type messages in the React chat app (localhost:5173)
2. Messages appear in the **User Proxy** window with agent stamp
3. Copy user messages by clicking the agent stamp
4. Paste agent responses into respective proxy windows
5. Responses automatically relay to the chat interface

## File Structure

```
public/
├── proxy-ChatGPT.html    # ChatGPT proxy window
├── proxy-Cursor.html     # Cursor proxy window
├── proxy-Copilot.html    # Copilot proxy window
├── proxy-user.html       # User proxy window
├── ChatGPTRelay.json     # ChatGPT message relay
├── CursorRelay.json      # Cursor message relay
├── CopilotRelay.json     # Copilot message relay
└── userProxy.json        # User message relay

proxy-launcher.js         # Electron main process
```

## Technical Details

- **Framework**: Electron (cross-platform desktop app)
- **Window Properties**:
  - `alwaysOnTop: true`
  - `setAlwaysOnTop(true, 'floating', 1)` for highest z-order
- **Security**: Context isolation enabled, node integration disabled
- **Communication**: Proxy windows communicate with backend via HTTP (port 3001)

## Troubleshooting

### Windows Don't Stay On Top

- The app uses `alwaysOnTop: true` with `'floating'` level and priority `1`
- This is the highest z-order available in Electron

### Windows Don't Position Correctly

- Window positioning is calculated based on screen bounds
- On multi-monitor setups, windows appear on the primary display

### Backend Connection Issues

- Ensure `npm run dev` is running on port 3001
- Check console logs in proxy windows (View → Developer → Toggle Developer Tools)

### Permission Issues (macOS)

- macOS may ask for Accessibility permissions for always-on-top behavior
- Go to System Preferences → Security & Privacy → Privacy → Accessibility
- Add the Electron app if prompted

## Development

To modify window behavior, edit `proxy-launcher.js`:

- **Window size**: Change `width` and `height` in `createProxyWindow()`
- **Positioning**: Modify the grid calculation in `createAllProxyWindows()`
- **Always-on-top**: Adjust `alwaysOnTop` and `setAlwaysOnTop()` settings

---

**Note**: This replaces the need to manually open HTML files in browsers. The Electron app provides true always-on-top functionality that browsers cannot achieve.
