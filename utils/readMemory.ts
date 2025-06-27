import chatgptMemory from "../agent_logs/chatgpt/memory.json";
import claudeMemory from "../agent_logs/claude/memory.json";
import uizardMemory from "../agent_logs/uizard/memory.json";
import geminiMemory from "../agent_logs/gemini/memory.json";
import copilotMemory from "../agent_logs/copilot/memory.json";
import userMemory from "../agent_logs/user/memory.json";

export type AgentMemory = {
  persona: string;
  rules: string[];
  reminders: string[];
};

export function readAgentMemory(
  agent: "chatgpt" | "claude" | "uizard" | "gemini" | "copilot" | "user"
): AgentMemory | null {
  switch (agent) {
    case "chatgpt":
      return chatgptMemory as AgentMemory;
    case "claude":
      return claudeMemory as AgentMemory;
    case "uizard":
      return uizardMemory as AgentMemory;
    case "gemini":
      return geminiMemory as AgentMemory;
    case "copilot":
      return copilotMemory as AgentMemory;
    case "user":
      return userMemory as AgentMemory;
    default:
      return null;
  }
}
