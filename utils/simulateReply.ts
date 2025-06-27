export function simulateAgentReply(prompt: string, agent: string): string {
  if (agent === "chatgpt") {
    return `Let me plan this out: "${prompt}". Breaking down into agent tasks...`;
  } else if (agent === "claude") {
    return `I'll handle that. Claude will now execute: "${prompt}".`;
  } else if (agent === "uizard") {
    return `Uizard designing: "${prompt}". Creating UI/UX solution.`;
  } else if (agent === "gemini") {
    return `Gemini analyzed: "${prompt}". Providing comprehensive assistance.`;
  } else if (agent === "user") {
    return `User noted: "${prompt}". Message logged.`;
  } else if (agent === "copilot") {
    return `Code cleaned up and refactored as requested: "${prompt}".`;
  } else {
    return `Processing: "${prompt}".`;
  }
}
