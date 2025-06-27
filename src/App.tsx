import React, { useState } from "react";
import AgentTabs from "../components/AgentTabs";
import ChatRouter from "../components/ChatRouter";
import MessageComposer from "../components/MessageComposer";
import "./index.css";

type AgentKey = "all" | "chatgpt" | "cursor" | "copilot";

type MessageComposerAgentKey = "chatgpt" | "cursor" | "copilot";

const App: React.FC = () => {
  const [activeAgent, setActiveAgent] = useState<AgentKey>("chatgpt");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force ChatRouter to refresh
  const triggerChatRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-screen">
      {/* Scrollable chat area with bottom padding to account for fixed elements */}
      <div className="w-full h-full overflow-auto pb-32 bg-gray-800">
        <ChatRouter key={refreshTrigger} activeAgent={activeAgent} />
      </div>

      {/* Fixed bottom section */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700">
        <MessageComposer
          activeAgent={
            activeAgent === "all"
              ? "chatgpt"
              : (activeAgent as MessageComposerAgentKey)
          }
          onMessageSent={triggerChatRefresh}
        />
        <div className="p-2">
          <AgentTabs activeAgent={activeAgent} onChange={setActiveAgent} />
        </div>
      </div>
    </div>
  );
};

export default App;
