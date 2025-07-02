const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { FileAccessBridge } = require("./fileAccessBridge");
const { ChatGPTRelayMonitor } = require("./chatgptRelayMonitor");
const { OboeStreamHandler } = require("./oboeStreamHandler");
const {
  DestructiveOverwriteHandler,
} = require("./destructiveOverwriteHandler");

let fileAccessBridge;
let relayMonitor;
let oboeHandler;
let overwriteHandler;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log("🔗 ChatGPT Oboe Bridge extension is now active!");

  // Get workspace root
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage("No workspace folder found for Oboe Bridge");
    return;
  }

  // Initialize bridge components
  fileAccessBridge = new FileAccessBridge(workspaceRoot);
  relayMonitor = new ChatGPTRelayMonitor(workspaceRoot, fileAccessBridge);
  oboeHandler = new OboeStreamHandler(workspaceRoot);
  overwriteHandler = new DestructiveOverwriteHandler(
    workspaceRoot,
    fileAccessBridge
  );

  // Register commands
  const sendSelectionCommand = vscode.commands.registerCommand(
    "oboe.sendSelectionToAgent",
    () => {
      sendSelectionToAgent();
    }
  );

  const sendFileCommand = vscode.commands.registerCommand(
    "oboe.sendFileToAgent",
    () => {
      sendCurrentFileToAgent();
    }
  );

  const openChatCommand = vscode.commands.registerCommand(
    "oboe.openChatPanel",
    () => {
      ChatGPTWebviewPanel.createOrShow(context.extensionUri, fileAccessBridge);
    }
  );

  const applyResponseCommand = vscode.commands.registerCommand(
    "oboe.applyLatestResponse",
    () => {
      applyLatestResponse();
    }
  );

  const enableBridgeCommand = vscode.commands.registerCommand(
    "oboe.enableFileBridge",
    () => {
      toggleFileBridge();
    }
  );

  context.subscriptions.push(
    sendSelectionCommand,
    sendFileCommand,
    openChatCommand,
    applyResponseCommand,
    enableBridgeCommand
  );

  // Start monitoring relay files
  relayMonitor.start();
  oboeHandler.startChatGPTStream();

  // Set context for when extension is enabled
  vscode.commands.executeCommand("setContext", "oboe.enabled", true);

  vscode.window.showInformationMessage(
    "🔗 ChatGPT Oboe Bridge ready! Use /read, /list, /write commands in ChatGPT."
  );
}

function sendSelectionToAgent() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor");
    return;
  }

  const selection = editor.selection;
  const selectedText = editor.document.getText(selection);

  if (!selectedText.trim()) {
    vscode.window.showErrorMessage("No text selected");
    return;
  }

  const filePath = vscode.workspace.asRelativePath(editor.document.uri);

  // Send to user proxy (existing pattern)
  fileAccessBridge.sendToUserProxy({
    timestamp: new Date().toISOString(),
    From: "VSCode",
    message: `Code from ${filePath}:\n\n\`\`\`\n${selectedText}\n\`\`\``,
    toAgent: "chatgpt",
    vsCodeContext: {
      file: filePath,
      selection: {
        start: {
          line: selection.start.line,
          character: selection.start.character,
        },
        end: { line: selection.end.line, character: selection.end.character },
      },
    },
  });

  vscode.window.showInformationMessage("📤 Selection sent to ChatGPT");
}

function sendCurrentFileToAgent() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor");
    return;
  }

  const filePath = vscode.workspace.asRelativePath(editor.document.uri);
  const content = editor.document.getText();

  fileAccessBridge.sendToUserProxy({
    timestamp: new Date().toISOString(),
    From: "VSCode",
    message: `Full file: ${filePath}\n\n\`\`\`\n${content}\n\`\`\``,
    toAgent: "chatgpt",
    vsCodeContext: {
      file: filePath,
      fullFile: true,
    },
  });

  vscode.window.showInformationMessage(`📁 File ${filePath} sent to ChatGPT`);
}

function applyLatestResponse() {
  overwriteHandler.applyWithConfirmation();
}

function toggleFileBridge() {
  if (relayMonitor.isActive) {
    relayMonitor.stop();
    vscode.window.showInformationMessage("🔴 File bridge disabled");
  } else {
    relayMonitor.start();
    vscode.window.showInformationMessage("🟢 File bridge enabled");
  }
}

class ChatGPTWebviewPanel {
  static currentPanel;

  static createOrShow(extensionUri, bridge) {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (ChatGPTWebviewPanel.currentPanel) {
      ChatGPTWebviewPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "chatgptOboeBridge",
      "ChatGPT Bridge",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [extensionUri],
      }
    );

    ChatGPTWebviewPanel.currentPanel = new ChatGPTWebviewPanel(
      panel,
      extensionUri,
      bridge
    );
  }

  constructor(panel, extensionUri, bridge) {
    this._panel = panel;
    this._disposables = [];
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._update(extensionUri, bridge);
  }

  _update(extensionUri, bridge) {
    this._panel.webview.html = this._getHtmlForWebview(extensionUri);
  }

  _getHtmlForWebview(extensionUri) {
    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ChatGPT Bridge</title>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                    padding: 20px;
                    background: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                }
                .container { max-width: 800px; margin: 0 auto; }
                .status { 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin-bottom: 20px; 
                    border: 1px solid var(--vscode-panel-border);
                }
                .status.active { 
                    background-color: var(--vscode-testing-iconPassed); 
                    color: var(--vscode-editor-background);
                }
                .commands { 
                    background: var(--vscode-editor-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 8px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .command { 
                    font-family: 'Monaco', 'Courier New', monospace;
                    background: var(--vscode-textCodeBlock-background);
                    padding: 8px 12px;
                    border-radius: 4px;
                    margin: 8px 0;
                }
                h1 { color: var(--vscode-titleBar-activeForeground); }
                h2 { color: var(--vscode-titleBar-activeForeground); }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🔗 ChatGPT Oboe Bridge</h1>
                <div class="status active">
                    ✅ Bridge Active - Monitoring relay files for file commands
                </div>
                
                <div class="commands">
                    <h2>Available File Commands:</h2>
                    <p>Use these commands in your ChatGPT native Mac app interface:</p>
                    <div class="command">/read &lt;file&gt;</div>
                    <p>Read file content and inject into chat</p>
                    
                    <div class="command">/list &lt;directory&gt;</div>
                    <p>List directory contents</p>
                    
                    <div class="command">/write &lt;file&gt;</div>
                    <p>Write content to file (followed by code block)</p>
                </div>

                <div class="commands">
                    <h2>VS Code Commands:</h2>
                    <p>Available in Command Palette (Cmd+Shift+P):</p>
                    <div class="command">Oboe: Send Selection to Agent</div>
                    <div class="command">Oboe: Send File to Agent</div>
                    <div class="command">Oboe: Apply Latest Response</div>
                </div>

                <p><strong>Status:</strong> File access bridge is running and will process commands automatically.</p>
            </div>
        </body>
        </html>`;
  }

  dispose() {
    ChatGPTWebviewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}

function deactivate() {
  if (relayMonitor) {
    relayMonitor.stop();
  }
  if (oboeHandler) {
    oboeHandler.stopAllStreams();
  }
}

module.exports = {
  activate,
  deactivate,
};
