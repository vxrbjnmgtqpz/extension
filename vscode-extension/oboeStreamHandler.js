const fs = require("fs");
const path = require("path");

class OboeStreamHandler {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this.relayDataPath = path.join(workspaceRoot, "relay_data");
    this.activeStreams = new Map();
    this.streamWatchers = new Map();
  }

  startChatGPTStream() {
    const chatGPTRelayPath = path.join(this.relayDataPath, "ChatGPTRelay.json");

    if (this.activeStreams.has("chatgpt")) {
      this.stopStream("chatgpt");
    }

    // Since we can't use the actual oboe library in this context,
    // we'll simulate streaming by watching for file changes
    const watcher = fs.watch(chatGPTRelayPath, (eventType) => {
      if (eventType === "change") {
        this.handleChatGPTStreamUpdate();
      }
    });

    this.activeStreams.set("chatgpt", watcher);
    this.streamWatchers.set("chatgpt", watcher);

    console.log("🌊 Started ChatGPT stream monitoring");
    return watcher;
  }

  startCopilotStream() {
    const copilotRelayPath = path.join(this.relayDataPath, "CopilotRelay.json");

    if (this.activeStreams.has("copilot")) {
      this.stopStream("copilot");
    }

    const watcher = fs.watch(copilotRelayPath, (eventType) => {
      if (eventType === "change") {
        this.handleCopilotStreamUpdate();
      }
    });

    this.activeStreams.set("copilot", watcher);
    this.streamWatchers.set("copilot", watcher);

    console.log("🌊 Started Copilot stream monitoring");
    return watcher;
  }

  handleChatGPTStreamUpdate() {
    try {
      const chatGPTRelayPath = path.join(
        this.relayDataPath,
        "ChatGPTRelay.json"
      );

      if (!fs.existsSync(chatGPTRelayPath)) return;

      const data = fs.readFileSync(chatGPTRelayPath, "utf8");
      if (!data.trim()) return;

      const relayData = JSON.parse(data);

      // Get the latest message
      let latestMessage = null;
      if (relayData.messages && Array.isArray(relayData.messages)) {
        latestMessage = relayData.messages[relayData.messages.length - 1];
      } else if (relayData.message) {
        latestMessage = relayData;
      }

      if (latestMessage) {
        this.handleStreamingMessage(
          latestMessage.message || latestMessage.content || "",
          "ChatGPT"
        );
      }
    } catch (error) {
      console.error("❌ Error handling ChatGPT stream update:", error);
    }
  }

  handleCopilotStreamUpdate() {
    try {
      const copilotRelayPath = path.join(
        this.relayDataPath,
        "CopilotRelay.json"
      );

      if (!fs.existsSync(copilotRelayPath)) return;

      const data = fs.readFileSync(copilotRelayPath, "utf8");
      if (!data.trim()) return;

      const relayData = JSON.parse(data);

      // Get the latest message
      let latestMessage = null;
      if (relayData.messages && Array.isArray(relayData.messages)) {
        latestMessage = relayData.messages[relayData.messages.length - 1];
      } else if (relayData.response) {
        latestMessage = { message: relayData.response };
      }

      if (latestMessage) {
        this.handleStreamingMessage(
          latestMessage.message || latestMessage.response || "",
          "Copilot"
        );
      }
    } catch (error) {
      console.error("❌ Error handling Copilot stream update:", error);
    }
  }

  handleStreamingMessage(message, source) {
    try {
      // Process streaming message in real-time
      const streamData = {
        timestamp: new Date().toISOString(),
        source: source,
        message: message,
        isStreaming: true,
      };

      // Write to live stream file for real-time updates
      const liveStreamPath = path.join(
        this.relayDataPath,
        `${source}LiveStream.json`
      );
      fs.writeFileSync(liveStreamPath, JSON.stringify(streamData, null, 2));

      console.log(`🌊 ${source} streaming message processed`);

      // Check for file commands in streaming content
      if (source === "ChatGPT") {
        this.processStreamingFileCommands(message);
      }

      // Check for destructive overwrite patterns
      if (this.isDestructiveOverwriteResponse(message)) {
        this.processDestructiveOverwrite(message, source);
      }
    } catch (error) {
      console.error(
        `❌ Error handling streaming message from ${source}:`,
        error
      );
    }
  }

  processStreamingFileCommands(message) {
    // Process file commands as they stream in real-time
    const lines = message.split("\n");
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (
        trimmedLine.startsWith("/read ") ||
        trimmedLine.startsWith("/list ") ||
        trimmedLine.startsWith("/write ")
      ) {
        console.log("🔧 File command detected in stream:", trimmedLine);
        this.triggerFileCommandProcessing(trimmedLine);
      }
    }
  }

  triggerFileCommandProcessing(command) {
    // Write command to immediate processing queue
    const commandData = {
      timestamp: new Date().toISOString(),
      command: command,
      priority: "immediate",
      source: "stream",
    };

    const commandQueuePath = path.join(
      this.relayDataPath,
      "FileCommandQueue.json"
    );
    fs.writeFileSync(commandQueuePath, JSON.stringify(commandData, null, 2));

    console.log("⚡ Queued immediate file command processing");
  }

  isDestructiveOverwriteResponse(message) {
    // Check if message contains patterns that indicate it should overwrite code
    const overwritePatterns = [
      "ERASE_AND_REPLACE_FROM_BELOW_THIS_LINE",
      "Replace the entire function",
      "Here's the complete updated",
      "```javascript\n",
      "```typescript\n",
      "```python\n",
      "```css\n",
      "```html\n",
    ];

    return overwritePatterns.some((pattern) => message.includes(pattern));
  }

  processDestructiveOverwrite(message, source) {
    try {
      // Extract code from the message
      const codeBlocks = this.extractCodeBlocks(message);

      if (codeBlocks.length > 0) {
        const overwriteData = {
          timestamp: new Date().toISOString(),
          source: source,
          codeBlocks: codeBlocks,
          message: message,
          readyForApplication: true,
        };

        const overwritePath = path.join(
          this.relayDataPath,
          "PendingOverwrite.json"
        );
        fs.writeFileSync(overwritePath, JSON.stringify(overwriteData, null, 2));

        console.log("🔄 Prepared destructive overwrite data");
      }
    } catch (error) {
      console.error("❌ Error processing destructive overwrite:", error);
    }
  }

  extractCodeBlocks(message) {
    const codeBlocks = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(message)) !== null) {
      codeBlocks.push({
        language: match[1] || "text",
        code: match[2].trim(),
      });
    }

    return codeBlocks;
  }

  stopAllStreams() {
    for (const [name, watcher] of this.activeStreams) {
      try {
        watcher.close();
        console.log(`🛑 Stopped ${name} stream`);
      } catch (error) {
        console.error(`❌ Error stopping ${name} stream:`, error);
      }
    }
    this.activeStreams.clear();
    this.streamWatchers.clear();
  }

  stopStream(streamName) {
    if (this.activeStreams.has(streamName)) {
      try {
        const watcher = this.activeStreams.get(streamName);
        watcher.close();
        this.activeStreams.delete(streamName);
        this.streamWatchers.delete(streamName);
        console.log(`🛑 Stopped ${streamName} stream`);
      } catch (error) {
        console.error(`❌ Error stopping ${streamName} stream:`, error);
      }
    }
  }

  getStreamStatus() {
    const status = {};
    for (const [name] of this.activeStreams) {
      status[name] = "active";
    }
    return status;
  }
}

module.exports = { OboeStreamHandler };
