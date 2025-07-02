const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve JSON files from relay_data directory to prevent live reload
app.get('/ChatGPTRelay.json', (req, res) => {
  res.sendFile(PROXY_PATHS.chatgpt);
});

app.get('/CursorRelay.json', (req, res) => {
  res.sendFile(PROXY_PATHS.cursor);
});

app.get('/CopilotRelay.json', (req, res) => {
  res.sendFile(PROXY_PATHS.copilot);
});

app.get('/userProxy.json', (req, res) => {
  res.sendFile(USER_PROXY_PATH);
});

// Oboe.js JSON streaming endpoint
app.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial data immediately
  const sendInitialData = () => {
    const agents = ['chatgpt', 'cursor', 'copilot'];
    agents.forEach(agent => {
      const filePath = PROXY_PATHS[agent];
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          res.write(JSON.stringify({
            type: 'update',
            agent: agent,
            messages: data.messages || []
          }) + '\n');
        } catch (error) {
          console.error(`Error reading ${agent}:`, error);
        }
      }
    });
  };

  sendInitialData();

  const streamUpdate = (agent, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.write(JSON.stringify({
          type: 'update',
          agent: agent,
          messages: data.messages || []
        }) + '\n');
      }
    } catch (error) {
      console.error(`Error streaming ${agent}:`, error);
    }
  };

  // Watch for file changes
  const watchFiles = () => {
    fs.watchFile(PROXY_PATHS.chatgpt, { interval: 1000 }, () => streamUpdate('chatgpt', PROXY_PATHS.chatgpt));
    fs.watchFile(PROXY_PATHS.cursor, { interval: 1000 }, () => streamUpdate('cursor', PROXY_PATHS.cursor));
    fs.watchFile(PROXY_PATHS.copilot, { interval: 1000 }, () => streamUpdate('copilot', PROXY_PATHS.copilot));
  };

  watchFiles();

  // Clean up on disconnect
  req.on('close', () => {
    fs.unwatchFile(PROXY_PATHS.chatgpt);
    fs.unwatchFile(PROXY_PATHS.cursor);
    fs.unwatchFile(PROXY_PATHS.copilot);
  });
});

// Oboe.js JSON streaming endpoint for proxy window (userProxy + FWD files)
app.get('/proxy-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Send initial data immediately
  const sendInitialData = () => {
    // Send userProxy data
    if (fs.existsSync(USER_PROXY_PATH)) {
      try {
        const data = JSON.parse(fs.readFileSync(USER_PROXY_PATH, 'utf8'));
        res.write(JSON.stringify({
          type: 'userProxy',
          messages: data.messages || []
        }) + '\n');
      } catch (error) {
        console.error('Error reading userProxy:', error);
      }
    }

    // Send FWD files data
    const fwdAgents = ['chatgpt', 'cursor', 'copilot'];
    fwdAgents.forEach(agent => {
      const filePath = FWD_PATHS[agent];
      if (fs.existsSync(filePath)) {
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          res.write(JSON.stringify({
            type: 'fwd',
            agent: agent,
            messages: data.messages || []
          }) + '\n');
        } catch (error) {
          console.error(`Error reading FWD-${agent}:`, error);
        }
      }
    });
  };

  sendInitialData();

  const streamUpdate = (type, agent, filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (type === 'userProxy') {
          res.write(JSON.stringify({
            type: 'userProxy',
            messages: data.messages || []
          }) + '\n');
        } else if (type === 'fwd') {
          res.write(JSON.stringify({
            type: 'fwd',
            agent: agent,
            messages: data.messages || []
          }) + '\n');
        }
      }
    } catch (error) {
      console.error(`Error streaming ${type} ${agent || ''}:`, error);
    }
  };

  // Watch for file changes
  const watchFiles = () => {
    // Watch userProxy.json
    fs.watchFile(USER_PROXY_PATH, { interval: 1000 }, () => streamUpdate('userProxy', null, USER_PROXY_PATH));
    
    // Watch FWD files
    fs.watchFile(FWD_PATHS.chatgpt, { interval: 1000 }, () => streamUpdate('fwd', 'chatgpt', FWD_PATHS.chatgpt));
    fs.watchFile(FWD_PATHS.cursor, { interval: 1000 }, () => streamUpdate('fwd', 'cursor', FWD_PATHS.cursor));
    fs.watchFile(FWD_PATHS.copilot, { interval: 1000 }, () => streamUpdate('fwd', 'copilot', FWD_PATHS.copilot));
  };

  watchFiles();

  // Clean up on disconnect
  req.on('close', () => {
    fs.unwatchFile(USER_PROXY_PATH);
    fs.unwatchFile(FWD_PATHS.chatgpt);
    fs.unwatchFile(FWD_PATHS.cursor);
    fs.unwatchFile(FWD_PATHS.copilot);
  });
});

const AGENT_PATHS = {
  chatgpt: path.join(
    __dirname,
    "agent_logs",
    "chatgpt",
    "UsrPxyChatGPTRelay.json"
  ),
  cursor: path.join(
    __dirname,
    "agent_logs",
    "cursor",
    "UsrPxyCursorRelay.json"
  ),
  copilot: path.join(
    __dirname,
    "agent_logs",
    "copilot",
    "UsrPxyCopilotRelay.json"
  ),
};

const PROXY_PATHS = {
  chatgpt: path.join(__dirname, "relay_data", "ChatGPTRelay.json"),
  cursor: path.join(__dirname, "relay_data", "CursorRelay.json"),
  copilot: path.join(__dirname, "relay_data", "CopilotRelay.json"),
};

const USER_PROXY_PATH = path.join(__dirname, "relay_data", "userProxy.json");

const FWD_PATHS = {
  chatgpt: path.join(__dirname, "public", "FWD-ChatGPT.json"),
  cursor: path.join(__dirname, "public", "FWD-Cursor.json"),
  copilot: path.join(__dirname, "public", "FWD-Copilot.json"),
};

// Ensure agent directories exist
[
  ...Object.values(AGENT_PATHS),
  ...Object.values(PROXY_PATHS),
  ...Object.values(FWD_PATHS),
  USER_PROXY_PATH,
].forEach((filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ messages: [] }, null, 2));
  }
});

app.post("/write-message", (req, res) => {
  const { agent, message } = req.body;

  if (!agent || !message || !AGENT_PATHS[agent]) {
    return res.status(400).json({ error: "Invalid agent or message" });
  }

  const filePath = AGENT_PATHS[agent];

  try {
    // Destructively overwrite with just the new message
    const data = { messages: [message] };

    // Write to file (destructive overwrite)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error(`Error writing to ${agent} file:`, error);
    res.status(500).json({ error: "Failed to write message" });
  }
});

app.post("/write-proxy-message", (req, res) => {
  const { agent, message } = req.body;

  if (!agent || !message || !PROXY_PATHS[agent]) {
    return res.status(400).json({ error: "Invalid agent or message" });
  }

  const filePath = PROXY_PATHS[agent];

  try {
    // Read existing data
    let existingData = { messages: [] };
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      try {
        existingData = JSON.parse(fileContent);
      } catch (parseError) {
        console.warn(
          `Error parsing existing file ${filePath}, starting fresh:`,
          parseError
        );
        existingData = { messages: [] };
      }
    }

    // Append the new message
    existingData.messages.push(message);

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error(`Error writing to ${agent} proxy file:`, error);
    res.status(500).json({ error: "Failed to write proxy message" });
  }
});

app.post("/write-user-proxy-message", (req, res) => {
  const { agent, message } = req.body;

  if (!agent || !message) {
    return res.status(400).json({ error: "Invalid agent or message" });
  }

  try {
    // Handle both regular messages and forwarded messages with FROM field
    const messageWithTag = {
      timestamp: message.timestamp,
      From: message.From || message.sender || "User", // Use FROM if available, otherwise sender, otherwise default to User
      message: message.message,
      toAgent: message.toAgent || agent, // Use toAgent if provided, otherwise use agent parameter
    };

    // 1. Write to userProxy.json (destructive overwrite)
    const userProxyData = { messages: [messageWithTag] };
    fs.writeFileSync(USER_PROXY_PATH, JSON.stringify(userProxyData, null, 2));

    // 2. Write to FWD-{Agent}.json file (destructive overwrite)
    const targetAgent = message.toAgent || agent;
    if (FWD_PATHS[targetAgent]) {
      const fwdFilePath = FWD_PATHS[targetAgent];
      const fwdData = { messages: [messageWithTag] };
      fs.writeFileSync(fwdFilePath, JSON.stringify(fwdData, null, 2));
    }

    // 3. Also append to the appropriate agent relay file
    if (PROXY_PATHS[targetAgent]) {
      const agentFilePath = PROXY_PATHS[targetAgent];

      // Read existing data from agent relay file
      let existingData = { messages: [] };
      if (fs.existsSync(agentFilePath)) {
        const fileContent = fs.readFileSync(agentFilePath, "utf8");
        try {
          existingData = JSON.parse(fileContent);
        } catch (parseError) {
          console.warn(
            `Error parsing existing file ${agentFilePath}, starting fresh:`,
            parseError
          );
          existingData = { messages: [] };
        }
      }

      // Create user message for agent relay file (standard format)
      const userMessageForAgent = {
        timestamp: message.timestamp,
        sender: "User", // Always use "User" for the sender in relay files
        message: message.message,
      };

      // Append the user message to agent relay file
      existingData.messages.push(userMessageForAgent);

      // Write back to agent relay file
      fs.writeFileSync(agentFilePath, JSON.stringify(existingData, null, 2));
    }

    res.json({ success: true });
  } catch (error) {
    console.error(`Error writing to user proxy file:`, error);
    res.status(500).json({ error: "Failed to write user proxy message" });
  }
});

app.post("/write-fwd-only", (req, res) => {
  const { agent, message } = req.body;

  if (!agent || !message) {
    return res.status(400).json({ error: "Invalid agent or message" });
  }

  try {
    // Handle forwarded messages - ONLY write to FWD files, not userProxy or relay files
    const messageWithTag = {
      timestamp: message.timestamp,
      From: message.From || message.sender || "User",
      message: message.message,
      toAgent: message.toAgent || agent,
    };

    // Write ONLY to FWD-{Agent}.json file (destructive overwrite)
    const targetAgent = message.toAgent || agent;
    if (FWD_PATHS[targetAgent]) {
      const fwdFilePath = FWD_PATHS[targetAgent];
      const fwdData = { messages: [messageWithTag] };
      fs.writeFileSync(fwdFilePath, JSON.stringify(fwdData, null, 2));
      console.log(`Forwarded message to ${targetAgent} FWD file only`);
    } else {
      return res
        .status(400)
        .json({ error: "Invalid target agent for forwarding" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(`Error writing to FWD file:`, error);
    res.status(500).json({ error: "Failed to write FWD message" });
  }
});

app.post("/write-user-only", (req, res) => {
  const { agent, message } = req.body;

  if (!agent || !message) {
    return res.status(400).json({ error: "Invalid agent or message" });
  }

  try {
    // Handle normal user messages - write to userProxy and agent relay files, but NOT FWD files
    const messageWithTag = {
      timestamp: message.timestamp,
      From: message.From || message.sender || "User",
      message: message.message,
      toAgent: message.toAgent || agent,
    };

    // 1. Write to userProxy.json (destructive overwrite)
    const userProxyData = { messages: [messageWithTag] };
    fs.writeFileSync(USER_PROXY_PATH, JSON.stringify(userProxyData, null, 2));

    // 2. Also append to the appropriate agent relay file
    if (PROXY_PATHS[agent]) {
      const agentFilePath = PROXY_PATHS[agent];

      // Read existing data from agent relay file
      let existingData = { messages: [] };
      if (fs.existsSync(agentFilePath)) {
        const fileContent = fs.readFileSync(agentFilePath, "utf8");
        try {
          existingData = JSON.parse(fileContent);
        } catch (parseError) {
          console.warn(
            `Error parsing existing file ${agentFilePath}, starting fresh:`,
            parseError
          );
          existingData = { messages: [] };
        }
      }

      // Create user message for agent relay file (standard format)
      const userMessageForAgent = {
        timestamp: message.timestamp,
        sender: "User", // Always use "User" for the sender in relay files
        message: message.message,
      };

      // Append the user message to agent relay file
      existingData.messages.push(userMessageForAgent);

      // Write back to agent relay file
      fs.writeFileSync(agentFilePath, JSON.stringify(existingData, null, 2));
    }

    console.log(`Normal message written to userProxy and ${agent} relay file`);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error writing normal user message:`, error);
    res.status(500).json({ error: "Failed to write normal user message" });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
