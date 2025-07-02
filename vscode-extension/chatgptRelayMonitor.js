const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

class ChatGPTRelayMonitor {
  constructor(workspaceRoot, fileAccessBridge) {
    this.workspaceRoot = workspaceRoot;
    this.relayDataPath = path.join(workspaceRoot, "relay_data");
    this.fileAccessBridge = fileAccessBridge;
    this.watcher = null;
    this.isActive = false;
    this.lastProcessedTimestamp = null;
  }

  start() {
    if (this.isActive) return;

    this.isActive = true;
    console.log("🔍 Starting ChatGPT Relay Monitor...");

    const chatGPTRelayPath = path.join(this.relayDataPath, "ChatGPTRelay.json");

    // Use VS Code's file watcher for better integration
    this.watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        this.workspaceRoot,
        "relay_data/ChatGPTRelay.json"
      )
    );

    this.watcher.onDidChange(() => {
      this.processChatGPTMessage();
    });

    this.watcher.onDidCreate(() => {
      this.processChatGPTMessage();
    });

    // Also process initial file if it exists
    if (fs.existsSync(chatGPTRelayPath)) {
      this.processChatGPTMessage();
    }
  }

  stop() {
    if (!this.isActive) return;

    this.isActive = false;
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = null;
    }
    console.log("🛑 Stopped ChatGPT Relay Monitor");
  }

  toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      this.start();
    }
  }

  async processChatGPTMessage() {
    try {
      const chatGPTRelayPath = path.join(
        this.relayDataPath,
        "ChatGPTRelay.json"
      );

      if (!fs.existsSync(chatGPTRelayPath)) {
        return;
      }

      const data = fs.readFileSync(chatGPTRelayPath, "utf8");
      if (!data.trim()) return;

      const relayData = JSON.parse(data);

      // Handle different relay data formats
      let messages = [];
      if (relayData.messages && Array.isArray(relayData.messages)) {
        messages = relayData.messages;
      } else if (relayData.message) {
        messages = [relayData];
      } else {
        return;
      }

      // Process only new messages
      const newMessages = messages.filter((msg) => {
        return (
          !this.lastProcessedTimestamp ||
          new Date(msg.timestamp) > new Date(this.lastProcessedTimestamp)
        );
      });

      for (const message of newMessages) {
        await this.processMessage(message);
        this.lastProcessedTimestamp = message.timestamp;
      }
    } catch (error) {
      console.error("❌ Error processing ChatGPT message:", error);
    }
  }

  async processMessage(message) {
    const content = message.message || message.content || "";

    // Check for file commands
    const fileCommands = this.extractFileCommands(content);
    if (fileCommands.length > 0) {
      console.log("🔧 Found file commands:", fileCommands);
      await this.executeFileCommands(fileCommands);
    }

    // Check if message should be routed to Copilot
    if (this.shouldRouteToCopilot(content)) {
      await this.routeToCopilot(message);
    }

    // Update VS Code context
    this.fileAccessBridge.updateVSCodeContext();
  }

  extractFileCommands(message) {
    const commands = [];
    const lines = message.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("/read ")) {
        const args = trimmedLine.substring(6).trim().split(/\s+/);
        commands.push({ command: "/read", args });
      } else if (trimmedLine.startsWith("/list ")) {
        const args = trimmedLine.substring(6).trim().split(/\s+/);
        commands.push({ command: "/list", args });
      } else if (trimmedLine.startsWith("/write ")) {
        // For write commands, capture the rest of the message as content
        const argsStart = trimmedLine.substring(7).trim();
        const firstArg = argsStart.split(/\s+/)[0];
        const remainingContent = message.substring(
          message.indexOf(trimmedLine) + trimmedLine.length
        );
        commands.push({
          command: "/write",
          args: [firstArg, remainingContent],
        });
      }
    }

    return commands;
  }

  async executeFileCommands(commands) {
    const results = [];

    for (const { command, args } of commands) {
      try {
        const result = await this.fileAccessBridge.processFileCommand(
          command,
          args
        );
        results.push(result);

        // For read/list commands, inject the result back into ChatGPT relay
        if (command === "/read" || command === "/list") {
          this.fileAccessBridge.injectIntoChatGPTRelay(result);
        }
      } catch (error) {
        const errorResult = `❌ Error executing ${command}: ${error.message}`;
        results.push(errorResult);
        this.fileAccessBridge.injectIntoChatGPTRelay(errorResult);
      }
    }

    // Write results to response file
    const responsePath = path.join(
      this.relayDataPath,
      "FileCommandResponse.json"
    );
    const responseData = {
      timestamp: new Date().toISOString(),
      results: results,
      commands: commands,
    };

    fs.writeFileSync(responsePath, JSON.stringify(responseData, null, 2));
  }

  shouldRouteToCopilot(message) {
    // Detect code-related responses that should be routed to Copilot
    const codeIndicators = [
      "```",
      "ROUTE_TO_COPILOT",
      "COPILOT:",
      "Apply this code",
      "Modify the file",
      "Replace the function",
      "Update the component",
      "Here's the updated",
      "Here's the improved",
      "function ",
      "class ",
      "const ",
      "let ",
      "var ",
      "import ",
      "export ",
    ];

    return codeIndicators.some((indicator) =>
      message.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  async routeToCopilot(relayData) {
    try {
      // Extract code and instructions for Copilot
      const copilotData = {
        timestamp: new Date().toISOString(),
        instruction: relayData.message || relayData.content,
        sourceAgent: "ChatGPT",
        autoRouted: true,
        vsCodeContext: relayData.vsCodeContext || {},
      };

      const copilotRelayPath = path.join(
        this.relayDataPath,
        "CopilotRelay.json"
      );

      // Read existing Copilot relay
      let copilotRelay = { messages: [] };
      if (fs.existsSync(copilotRelayPath)) {
        const existing = fs.readFileSync(copilotRelayPath, "utf8");
        if (existing.trim()) {
          copilotRelay = JSON.parse(existing);
        }
      }

      if (!copilotRelay.messages) {
        copilotRelay.messages = [];
      }

      copilotRelay.messages.push(copilotData);

      fs.writeFileSync(copilotRelayPath, JSON.stringify(copilotRelay, null, 2));

      console.log("🔄 Routed message to Copilot");

      // Log the routing activity
      this.fileAccessBridge.logActivity("auto_route_to_copilot", {
        sourceAgent: "ChatGPT",
        targetAgent: "Copilot",
        contentPreview: (relayData.message || "").substring(0, 100) + "...",
      });

      // Show notification in VS Code
      vscode.window.showInformationMessage(
        "🔄 Code response auto-routed to Copilot"
      );

      // TODO: Trigger Keyboard Maestro script to ping Copilot
      // This would depend on your existing KM setup
    } catch (error) {
      console.error("❌ Error routing to Copilot:", error);
    }
  }
}

module.exports = { ChatGPTRelayMonitor };
