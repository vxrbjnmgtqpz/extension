import { readAgentLog } from "./readLog";
import type { LogMessage } from "./readLog";
import { simulateAgentReply } from "./simulateReply";

export async function writeAgentLog(agent: string, newMsg: LogMessage) {
  // Write to server first (which writes to UsrPxy files)
  try {
    const response = await fetch('http://localhost:3001/write-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agent,
        message: newMsg
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to write message: ${response.status}`);
    }
  } catch (error) {
    console.error("Error writing to server:", error);
  }

  // Also keep in localStorage for immediate UI updates
  const logKey = `log_${agent}`;
  const existing = await readAgentLog(agent);
  const updated = [...existing, newMsg];
  localStorage.setItem(logKey, JSON.stringify(updated));

  // Simulate agent response
  if (newMsg.sender === "User") {
    setTimeout(async () => {
      const simulatedResponse = {
        timestamp: new Date().toISOString(),
        sender:
          agent === "chatgpt"
            ? "ChatGPT"
            : agent === "claude"
            ? "Claude"
            : agent === "uizard"
            ? "Uizard"
            : agent === "gemini"
            ? "Gemini"
            : agent === "user"
            ? "User"
            : "Copilot",
        message: simulateAgentReply(newMsg.message, agent),
      };
      const currentLog = await readAgentLog(agent);
      const updatedAgain = [...currentLog, simulatedResponse];
      localStorage.setItem(logKey, JSON.stringify(updatedAgain));
    }, 800);
  }
}

export function getAgentLog(agent: string): Promise<LogMessage[]> {
  return readAgentLog(agent);
}
