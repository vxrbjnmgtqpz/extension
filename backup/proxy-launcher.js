const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const express = require("express");
const cors = require("cors");

// Keep references to prevent garbage collection
let windows = {};
let fileServer;

function createProxyWindow(name, htmlFile, width = 600, height = 800) {
  const window = new BrowserWindow({
    width: width,
    height: height,
    alwaysOnTop: true,
    frame: true,
    resizable: true,
    minimizable: true,
    maximizable: false,
    skipTaskbar: false,
    title: `${name} Proxy`,
    icon: null,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
    },
  });

  // Load the HTML file
  window.loadFile(path.join(__dirname, "public", htmlFile));

  // Keep window always on top with highest z-order
  window.setAlwaysOnTop(true, "floating", 1);

  // Show dev tools in development to help debug
  window.webContents.openDevTools();

  // Add error handling
  window.webContents.on(
    "did-fail-load",
    (event, errorCode, errorDescription) => {
      console.log(
        `Failed to load ${htmlFile}: ${errorCode} - ${errorDescription}`
      );
    }
  );

  window.webContents.on("console-message", (event, level, message) => {
    console.log(`[${name}] ${message}`);
  });

  return window;
}

function createAllProxyWindows() {
  // Create each proxy window with specific positioning
  windows.chatgpt = createProxyWindow(
    "ChatGPT",
    "proxy-ChatGPT.html",
    500,
    700
  );
  windows.cursor = createProxyWindow("Cursor", "proxy-Cursor.html", 500, 700);
  windows.copilot = createProxyWindow(
    "Copilot",
    "proxy-Copilot.html",
    500,
    700
  );
  windows.user = createProxyWindow("User", "proxy-user.html", 500, 700);

  // Position windows in a grid
  const screenBounds = require("electron").screen.getPrimaryDisplay().bounds;
  const windowWidth = 500;
  const windowHeight = 700;

  // Calculate positions for 2x2 grid
  const startX = Math.max(0, screenBounds.width - windowWidth * 2 - 40);
  const startY = Math.max(0, (screenBounds.height - windowHeight * 2) / 2);

  windows.chatgpt.setPosition(startX, startY);
  windows.cursor.setPosition(startX + windowWidth + 20, startY);
  windows.copilot.setPosition(startX, startY + windowHeight + 20);
  windows.user.setPosition(
    startX + windowWidth + 20,
    startY + windowHeight + 20
  );

  // Handle window close events
  Object.values(windows).forEach((window) => {
    window.on("closed", () => {
      // Don't quit app when individual windows close
      // User can quit via menu or CMD+Q
    });
  });
}

function createMenuBar() {
  const template = [
    {
      label: "Proxy Launcher",
      submenu: [
        {
          label: "Restart All Windows",
          click: () => {
            // Close all existing windows
            Object.values(windows).forEach((window) => {
              if (window && !window.isDestroyed()) {
                window.close();
              }
            });
            // Create new windows
            setTimeout(createAllProxyWindows, 100);
          },
        },
        { type: "separator" },
        {
          label: "Quit",
          accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: "Window",
      submenu: [
        {
          label: "Show ChatGPT",
          click: () => {
            if (windows.chatgpt && !windows.chatgpt.isDestroyed()) {
              windows.chatgpt.show();
              windows.chatgpt.focus();
            }
          },
        },
        {
          label: "Show Cursor",
          click: () => {
            if (windows.cursor && !windows.cursor.isDestroyed()) {
              windows.cursor.show();
              windows.cursor.focus();
            }
          },
        },
        {
          label: "Show Copilot",
          click: () => {
            if (windows.copilot && !windows.copilot.isDestroyed()) {
              windows.copilot.show();
              windows.copilot.focus();
            }
          },
        },
        {
          label: "Show User",
          click: () => {
            if (windows.user && !windows.user.isDestroyed()) {
              windows.user.show();
              windows.user.focus();
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
  createFileServer(); // Start file server first
  createMenuBar();
  createAllProxyWindows();

  app.on("activate", () => {
    // On macOS, re-create windows when dock icon is clicked
    if (Object.keys(windows).length === 0) {
      createAllProxyWindows();
    }
  });
});

app.on("window-all-closed", () => {
  // Don't quit the app when all windows are closed
  // Keep it running so user can reopen via menu
  if (process.platform !== "darwin") {
    // On Windows/Linux, quit when all windows closed
    app.quit();
  }
});

app.on("before-quit", () => {
  // Clean up file server
  if (fileServer) {
    fileServer.close();
  }

  // Clean up windows
  Object.values(windows).forEach((window) => {
    if (window && !window.isDestroyed()) {
      window.removeAllListeners("closed");
    }
  });
});

console.log("Proxy Launcher starting...");
console.log("This will launch 4 always-on-top proxy windows:");
console.log("- ChatGPT Proxy");
console.log("- Cursor Proxy");
console.log("- Copilot Proxy");
console.log("- User Proxy");
console.log(
  "Windows will be positioned in a 2x2 grid on the right side of your screen."
);

// Create a simple file server for serving JSON files to proxy windows
function createFileServer() {
  const serverApp = express();
  serverApp.use(cors());
  serverApp.use(express.static(path.join(__dirname, "public")));

  fileServer = serverApp.listen(8080, () => {
    console.log("File server running on http://localhost:8080");
  });
}
