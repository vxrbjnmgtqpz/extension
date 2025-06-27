import React, { useRef, useState } from "react";
import { writeAgentLog } from "../../utils/writeLog";
import { getTimestamp } from "../../utils/timestamp";

const AGENT_META = {
  chatgpt: { name: "ChatGPT", emoji: "🧠" },
  cursor: { name: "Cursor", emoji: "🖱️" },
  copilot: { name: "Copilot", emoji: "🛠️" },
  user: { name: "User", emoji: "👤" },
};

type AgentKey = keyof typeof AGENT_META;

interface MessageComposerProps {
  activeAgent: AgentKey;
  onMessageSent?: () => void; // Callback to trigger chat refresh
}

const MAX_ROWS = 5;

const MessageComposer: React.FC<MessageComposerProps> = ({
  activeAgent,
  onMessageSent,
}) => {
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea
  const handleInput = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 160) + "px";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!inputText.trim() || isSending) return;

    setIsSending(true);

    try {
      const logEntry = {
        timestamp: getTimestamp(),
        sender: "User",
        message: inputText.trim(),
      };

      await writeAgentLog(activeAgent, logEntry);
      setInputText("");

      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }

      // Trigger immediate chat refresh
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const meta = AGENT_META[activeAgent];

  return (
    <div className="w-full bg-gray-900 p-4">
      <div className="message-composer-row">
        <textarea
          ref={textareaRef}
          className="flex-1 border border-gray-600 rounded-lg p-3 text-gray-100 bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none placeholder-gray-400"
          maxLength={2000}
          placeholder={`Type a message to ${meta.name}...`}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            handleInput();
          }}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          style={{ height: "40px", lineHeight: "20px", resize: "none" }}
          disabled={isSending}
        />
        <button
          className={`bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700 transition flex items-center justify-center ${
            isSending ? "cursor-not-allowed" : "hover:scale-105"
          }`}
          onClick={handleSubmit}
          disabled={!inputText.trim() || isSending}
          style={{ width: "40px", height: "40px" }}
        >
          {isSending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "⬆"
          )}
        </button>
      </div>
    </div>
  );
};

export default MessageComposer;
