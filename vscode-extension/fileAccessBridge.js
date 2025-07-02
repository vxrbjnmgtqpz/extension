const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

class FileAccessBridge {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.relayDataPath = path.join(workspaceRoot, "relay_data");
    this.ensureRelayDataDirectory();
  }

  ensureRelayDataDirectory() {
    if (!fs.existsSync(this.relayDataPath)) {
      fs.mkdirSync(this.relayDataPath, { recursive: true });
    }
  }

  async processFileCommand(command, args) {
    try {
      console.log(`🔧 Processing file command: ${command} ${args.join(" ")}`);

      switch (command) {
        case "/read":
          return await this.readFile(args[0]);
        case "/list":
          return await this.listDirectory(args[0] || ".");
        case "/write":
          return await this.writeFile(args[0], args.slice(1).join(" "));
        default:
          return `❌ Unknown command: ${command}`;
      }
    } catch (error) {
      const errorMsg = `❌ Error executing ${command}: ${error.message}`;
      console.error(errorMsg);
      return errorMsg;
    }
  }

  async readFile(filePath) {
    const fullPath = path.resolve(this.workspaceRoot, filePath);

    // Security check - ensure file is within workspace
    if (!fullPath.startsWith(this.workspaceRoot)) {
      throw new Error("Access denied: File outside workspace");
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(fullPath, "utf8");
    const relativePath = path.relative(this.workspaceRoot, fullPath);
    const stats = fs.statSync(fullPath);

    // Log activity
    this.logActivity("file_read", {
      file: relativePath,
      size: stats.size,
      lines: content.split("\n").length,
    });

    return `📁 **${relativePath}** (${stats.size} bytes, ${
      content.split("\n").length
    } lines)\n\n\`\`\`\n${content}\n\`\`\``;
  }

  async listDirectory(dirPath) {
    const fullPath = path.resolve(this.workspaceRoot, dirPath);

    // Security check
    if (!fullPath.startsWith(this.workspaceRoot)) {
      throw new Error("Access denied: Directory outside workspace");
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }

    const items = fs.readdirSync(fullPath, { withFileTypes: true });
    const relativePath = path.relative(this.workspaceRoot, fullPath);

    let result = `📂 **${relativePath || "root"}/**\n\n`;

    // Sort: directories first, then files
    const directories = items
      .filter((item) => item.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));
    const files = items
      .filter((item) => !item.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    directories.forEach((item) => {
      result += `📁 ${item.name}/\n`;
    });

    files.forEach((item) => {
      const filePath = path.join(fullPath, item.name);
      const stats = fs.statSync(filePath);
      const size =
        stats.size < 1024
          ? `${stats.size}B`
          : stats.size < 1024 * 1024
          ? `${Math.round(stats.size / 1024)}KB`
          : `${Math.round(stats.size / (1024 * 1024))}MB`;
      result += `📄 ${item.name} (${size})\n`;
    });

    this.logActivity("directory_list", {
      directory: relativePath,
      itemCount: items.length,
    });

    return result;
  }

  async writeFile(filePath, content) {
    const fullPath = path.resolve(this.workspaceRoot, filePath);

    // Security check
    if (!fullPath.startsWith(this.workspaceRoot)) {
      throw new Error("Access denied: File outside workspace");
    }

    // Ensure directory exists
    const dirPath = path.dirname(fullPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Handle different content formats
    let processedContent = content;

    // If content looks like it came from a code block, clean it up
    if (content.includes("```")) {
      const codeBlockMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        processedContent = codeBlockMatch[1];
      }
    }

    fs.writeFileSync(fullPath, processedContent, "utf8");

    const relativePath = path.relative(this.workspaceRoot, fullPath);

    this.logActivity("file_write", {
      file: relativePath,
      size: processedContent.length,
      lines: processedContent.split("\n").length,
    });

    return `✅ **File written:** ${relativePath} (${processedContent.length} bytes)`;
  }

  sendToUserProxy(data) {
    try {
      const userProxyPath = path.join(this.relayDataPath, "userProxy.json");
      let userProxy = { messages: [] };

      if (fs.existsSync(userProxyPath)) {
        const existing = fs.readFileSync(userProxyPath, "utf8");
        if (existing.trim()) {
          userProxy = JSON.parse(existing);
        }
      }

      if (!userProxy.messages) {
        userProxy.messages = [];
      }

      userProxy.messages.push(data);

      fs.writeFileSync(userProxyPath, JSON.stringify(userProxy, null, 2));
      console.log("📤 Sent to userProxy.json");
    } catch (error) {
      console.error("❌ Error writing to userProxy.json:", error);
    }
  }

  injectIntoChatGPTRelay(message) {
    try {
      const chatGPTRelayPath = path.join(
        this.relayDataPath,
        "ChatGPTRelay.json"
      );
      let relay = { messages: [] };

      if (fs.existsSync(chatGPTRelayPath)) {
        const existing = fs.readFileSync(chatGPTRelayPath, "utf8");
        if (existing.trim()) {
          relay = JSON.parse(existing);
        }
      }

      if (!relay.messages) {
        relay.messages = [];
      }

      const injectionMessage = {
        timestamp: new Date().toISOString(),
        sender: "VSCode_Assistant",
        message: message,
        injected: true,
      };

      relay.messages.push(injectionMessage);

      fs.writeFileSync(chatGPTRelayPath, JSON.stringify(relay, null, 2));
      console.log("💉 Injected into ChatGPTRelay.json");
    } catch (error) {
      console.error("❌ Error injecting into ChatGPTRelay.json:", error);
    }
  }

  updateVSCodeContext() {
    try {
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) return;

      const document = activeEditor.document;
      const selection = activeEditor.selection;

      const contextData = {
        timestamp: new Date().toISOString(),
        activeFile: vscode.workspace.asRelativePath(document.uri),
        selectedText: document.getText(selection),
        cursorPosition: {
          line: selection.start.line,
          character: selection.start.character,
        },
        workspaceRoot: this.workspaceRoot,
      };

      const contextPath = path.join(this.relayDataPath, "vsCodeContext.json");
      fs.writeFileSync(contextPath, JSON.stringify(contextData, null, 2));
    } catch (error) {
      console.error("❌ Error updating VS Code context:", error);
    }
  }

  logActivity(action, details) {
    try {
      const activityPath = path.join(this.relayDataPath, "vsCodeActivity.json");
      let activity = { messages: [] };

      if (fs.existsSync(activityPath)) {
        const existing = fs.readFileSync(activityPath, "utf8");
        if (existing.trim()) {
          activity = JSON.parse(existing);
        }
      }

      if (!activity.messages) {
        activity.messages = [];
      }

      const logEntry = {
        timestamp: new Date().toISOString(),
        action: action,
        ...details,
      };

      activity.messages.push(logEntry);

      // Keep only last 100 entries to prevent file from growing too large
      if (activity.messages.length > 100) {
        activity.messages = activity.messages.slice(-100);
      }

      fs.writeFileSync(activityPath, JSON.stringify(activity, null, 2));
    } catch (error) {
      console.error("❌ Error logging activity:", error);
    }
  }
}

module.exports = { FileAccessBridge };
