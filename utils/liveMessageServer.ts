import express from "express";
import cors from "cors";
import * as fs from "fs";
import * as path from "path";

interface LiveMessage {
  timestamp: string;
  sender: string;
  message: string;
  agent: string;
}

function writeAgentLog(agent: string, newMessage: LiveMessage) {
  const logPath = path.resolve(`./agent_logs/${agent}/log.json`);

  // Ensure agent directory exists
  const agentDir = path.dirname(logPath);
  if (!fs.existsSync(agentDir)) {
    fs.mkdirSync(agentDir, { recursive: true });
  }

  // Read existing log
  let current: LiveMessage[] = [];
  if (fs.existsSync(logPath)) {
    try {
      const raw = fs.readFileSync(logPath, "utf-8");
      current = JSON.parse(raw);
    } catch (error) {
      console.error(`Error reading ${agent} log:`, error);
      current = [];
    }
  }

  // Add new message
  current.push(newMessage);

  // Write back
  try {
    fs.writeFileSync(logPath, JSON.stringify(current, null, 2));
    console.log(
      `[Live Relay] ✅ Added message to ${agent}: ${newMessage.sender}`
    );
  } catch (error) {
    console.error(`Error writing to ${agent} log:`, error);
  }
}

export function startLiveMessageServer(port: number = 8080) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.post("/api/live-message", (req, res) => {
    try {
      const message: LiveMessage = req.body;

      // Validate message
      if (
        !message.timestamp ||
        !message.sender ||
        !message.message ||
        !message.agent
      ) {
        res.status(400).json({ error: "Invalid message format" });
        return;
      }

      // Write to agent log
      writeAgentLog(message.agent, message);

      res.status(200).json({
        success: true,
        message: `Message added to ${message.agent} log`,
      });
    } catch (error) {
      console.error("Error processing live message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(port, () => {
    console.log(`🚀 [Live Relay Server] Running on http://localhost:${port}`);
    console.log(
      `📡 [Live Relay Server] Ready to receive messages from Cursor extension`
    );
  });
}

// Auto-start if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startLiveMessageServer();
}
