const fs = require("fs");
const path = require("path");

const agents = [
  {
    name: "copilot",
    usrPxy: path.join(
      __dirname,
      "agent_logs",
      "copilot",
      "UsrPxyCopilotRelay.json"
    ),
    pxy: path.join(__dirname, "agent_logs", "copilot", "PxyCopilotRelay.json"),
    relay: path.join(__dirname, "public", "CopilotRelay.json"),
  },
  {
    name: "cursor",
    usrPxy: path.join(
      __dirname,
      "agent_logs",
      "cursor",
      "UsrPxyCursorRelay.json"
    ),
    pxy: path.join(__dirname, "agent_logs", "cursor", "PxyCursorRelay.json"),
    relay: path.join(__dirname, "public", "CursorRelay.json"),
  },
  {
    name: "chatgpt",
    usrPxy: path.join(
      __dirname,
      "agent_logs",
      "chatgpt",
      "UsrPxyChatGPTRelay.json"
    ),
    pxy: path.join(__dirname, "agent_logs", "chatgpt", "PxyChatGPTRelay.json"),
    relay: path.join(__dirname, "public", "ChatGPTRelay.json"),
  },
];

// Keep track of processed messages to prevent duplicates
const processedMessages = new Map();

function initializeRelayFile(filePath) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ messages: [] }, null, 2));
  }
}

function getMessageKey(message) {
  return `${message.timestamp}-${message.sender}-${message.message}`;
}

function relayMessages(agent) {
  // Initialize relay file if it doesn't exist
  initializeRelayFile(agent.relay);

  // Watch UsrPxy file
  fs.watchFile(agent.usrPxy, { interval: 1000 }, () => {
    processRelayFile(agent, agent.usrPxy);
  });

  // Watch Pxy file
  fs.watchFile(agent.pxy, { interval: 1000 }, () => {
    processRelayFile(agent, agent.pxy);
  });
}

function processRelayFile(agent, sourceFile) {
  let sourceData, relayData;
  try {
    sourceData = JSON.parse(fs.readFileSync(sourceFile, "utf8"));
    try {
      relayData = JSON.parse(fs.readFileSync(agent.relay, "utf8"));
    } catch {
      // If relay file is corrupted or empty, reinitialize it
      relayData = { messages: [] };
    }

    const sourceMessages = sourceData.messages || [];
    const relayMessages = relayData.messages || [];

    // Check if source has messages already in relay to prevent duplicates
    const newMessages = sourceMessages.filter((srcMsg) => {
      const key = getMessageKey(srcMsg);

      // Check if already processed
      if (processedMessages.has(key)) {
        return false;
      }

      // Check if already exists in relay file
      const existsInRelay = relayMessages.some(
        (relayMsg) => getMessageKey(relayMsg) === key
      );

      if (!existsInRelay) {
        processedMessages.set(key, true);
        return true;
      }

      return false;
    });

    // If there are new messages, append them to relay
    if (newMessages.length > 0) {
      relayData.messages = relayMessages.concat(newMessages);
      fs.writeFileSync(agent.relay, JSON.stringify(relayData, null, 2));
      const sourceType = sourceFile.includes("UsrPxy") ? "UsrPxy" : "Pxy";
      console.log(
        `[${agent.name}] Relayed ${newMessages.length} new message(s) from ${sourceType}`
      );
    }
  } catch (error) {
    console.error(
      `[${agent.name}] Error processing messages from ${sourceFile}:`,
      error
    );
  }
}

// Initialize all relay files first
agents.forEach((agent) => initializeRelayFile(agent.relay));

// Start watching for changes
agents.forEach(relayMessages);

// Clean up old message keys periodically (keep last hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  processedMessages.forEach((value, key) => {
    const timestamp = new Date(key.split("-")[0]).getTime();
    if (timestamp < oneHourAgo) {
      processedMessages.delete(key);
    }
  });
}, 60 * 60 * 1000); // Run every hour

console.log("Relay watcher running for all agents...");
