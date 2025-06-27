import React from "react";

type AgentKey = "all" | "chatgpt" | "copilot" | "cursor";

const agents: Array<{ key: AgentKey; name: string; emoji: string }> = [
  { key: "all", name: "All", emoji: "🌐" },
  { key: "chatgpt", name: "ChatGPT", emoji: "🧠" },
  { key: "cursor", name: "Cursor", emoji: "🤖" }, // changed emoji from 🖱️ to 🤖
  { key: "copilot", name: "Copilot", emoji: "🛠️" },
];

interface AgentTabsProps {
  activeAgent: AgentKey;
  onChange: (agent: AgentKey) => void;
}

const AgentTabs: React.FC<AgentTabsProps> = ({ activeAgent, onChange }) => {
  return (
    <div className="flex w-full" style={{ gap: "2px" }}>
      {agents.map((agent) => (
        <button
          key={agent.key}
          onClick={() => onChange(agent.key)}
          className={`flex-1 min-w-0 px-2 py-2 text-xs font-medium rounded transition-all duration-200 ${
            activeAgent === agent.key
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <div className="flex items-center justify-center gap-1">
            <span>{agent.emoji}</span>
            <span className="truncate">{agent.name}</span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default AgentTabs;
