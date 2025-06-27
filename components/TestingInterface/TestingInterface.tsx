import React, { useState, useRef, useEffect } from "react";

// Extend the Message type to include test-specific data
type TestMessage = {
  id: string;
  timestamp: string;
  sender: string;
  message: string;
  type?: "log" | "error" | "progress" | "result";
  level?: "info" | "warn" | "error";
};

interface TestingInterfaceProps {
  isVisible: boolean;
  onToggle: () => void;
}

const TestingInterface: React.FC<TestingInterfaceProps> = ({
  isVisible,
  onToggle,
}) => {
  const [testLog, setTestLog] = useState<TestMessage[]>([]);
  const [progress, setProgress] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [testResults, setTestResults] = useState({ passed: 0, failed: 0 });
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [selectedTestFile, setSelectedTestFile] = useState("");
  const [isLogFullscreen, setIsLogFullscreen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (logRef.current) {
      const container = logRef.current;
      requestAnimationFrame(() => {
        container.scrollTo({ top: container.scrollHeight, behavior });
      });
    }
  };

  // Handle scroll events to track if user is at bottom
  const handleScroll = () => {
    if (logRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logRef.current;
      const atBottom = scrollHeight - scrollTop <= clientHeight + 20;
      setIsAtBottom(atBottom);
    }
  };

  // Auto-scroll when new messages arrive if user is at bottom
  useEffect(() => {
    if (isAtBottom && testLog.length > 0) {
      scrollToBottom();
    }
  }, [testLog, isAtBottom]);

  // Add a new test message
  const addTestMessage = (message: Omit<TestMessage, "id" | "timestamp">) => {
    const newMessage: TestMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    setTestLog((prev) => [...prev, newMessage]);
  };

  // Clean and format log messages (from buildbot-ui)
  function cleanLogMessage(message: string): string {
    if (!message || typeof message !== "string") return "";

    // Remove ANSI color codes and control sequences
    let cleaned = message.replace(/\[[\d;]*[a-zA-Z]/g, "");

    // Remove excessive spacing and line breaks
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    // Truncate very long lines
    if (cleaned.length > 150) {
      const breakPoint = cleaned.lastIndexOf(" ", 150);
      if (breakPoint > 100) {
        cleaned = cleaned.substring(0, breakPoint) + "...";
      } else {
        cleaned = cleaned.substring(0, 150) + "...";
      }
    }

    return cleaned;
  }

  // Simulate test execution (replace with actual implementation)
  const startTesting = () => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(0);
    setTestLog([]);
    setCurrentStep("Initializing tests...");
    setTestResults({ passed: 0, failed: 0 });
    setCurrentAttempt(0);

    addTestMessage({
      sender: "System",
      message: "🚀 Starting SmartRelay test suite...",
      type: "log",
      level: "info",
    });

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + Math.random() * 10, 100);
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setIsRunning(false);
          setCurrentStep("Tests completed");
          addTestMessage({
            sender: "System",
            message: "✅ All tests completed successfully!",
            type: "result",
            level: "info",
          });
        }
        return newProgress;
      });
    }, 500);

    // Simulate test messages
    setTimeout(() => {
      addTestMessage({
        sender: "Playwright",
        message: "🎭 Running UI component tests...",
        type: "log",
        level: "info",
      });
    }, 1000);

    setTimeout(() => {
      addTestMessage({
        sender: "ChatRouter",
        message: "✅ Grid layout test passed",
        type: "result",
        level: "info",
      });
      setTestResults((prev) => ({ ...prev, passed: prev.passed + 1 }));
    }, 2000);

    setTimeout(() => {
      addTestMessage({
        sender: "SpecStory Watcher",
        message: "✅ Message parsing test passed",
        type: "result",
        level: "info",
      });
      setTestResults((prev) => ({ ...prev, passed: prev.passed + 1 }));
    }, 3000);
  };

  const stopTesting = () => {
    setIsRunning(false);
    setCurrentStep("Tests stopped");
    addTestMessage({
      sender: "System",
      message: "⏹️ Testing stopped by user",
      type: "log",
      level: "warn",
    });
  };

  const clearLog = () => {
    setTestLog([]);
    setProgress(0);
    setCurrentStep("");
    setTestResults({ passed: 0, failed: 0 });
    setCurrentAttempt(0);
  };

  const chooseTestFile = () => {
    // Simulate file selection (replace with actual file picker)
    const mockFiles = [
      "tests/chatrouter.spec.ts",
      "tests/watcher.spec.ts",
      "tests/integration.spec.ts",
    ];
    const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setSelectedTestFile(randomFile);

    addTestMessage({
      sender: "System",
      message: `📁 Selected test file: ${randomFile}`,
      type: "log",
      level: "info",
    });
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50"
        title="Open Testing Interface"
      >
        🧪
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 text-white flex flex-col z-40">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div>
          <h1 className="text-xl font-bold">SmartRelay Testing Interface</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isRunning ? "bg-green-500" : "bg-gray-500"
                }`}
              />
              <span className="text-sm">
                Status: {isRunning ? "Running" : "Ready"}
              </span>
            </div>
            {selectedTestFile && (
              <span className="text-sm text-gray-300">
                📁 {selectedTestFile}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onToggle}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
        >
          ✕ Close
        </button>
      </div>

      {/* Current Step */}
      {currentStep && (
        <div className="bg-gray-800 border-l-4 border-blue-500 p-4 mx-4 mt-4 rounded">
          <div className="font-semibold text-blue-200">Current Step:</div>
          <div className="text-white">{currentStep}</div>
          {(testResults.passed > 0 || testResults.failed > 0) && (
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-green-400">
                ✅ Passed: {testResults.passed}
              </span>
              <span className="text-red-400">
                ❌ Failed: {testResults.failed}
              </span>
              {currentAttempt > 0 && (
                <span className="text-yellow-400">
                  🔄 Attempt: {currentAttempt}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-gray-800 p-4 mx-4 mt-2 rounded">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm">Progress</span>
          <span className="text-sm">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 p-4">
        <button
          onClick={chooseTestFile}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
        >
          Choose Test File
        </button>
        <button
          onClick={isRunning ? stopTesting : startTesting}
          className={`px-4 py-2 rounded text-sm font-medium ${
            isRunning
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isRunning ? "⏹️ Stop Testing" : "▶️ Start Testing"}
        </button>
        <button
          onClick={clearLog}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium"
        >
          🗑️ Clear Log
        </button>
        <button
          onClick={() => setIsLogFullscreen(!isLogFullscreen)}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm font-medium"
        >
          {isLogFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      {/* Log Output - Grid Layout with Auto-scroll */}
      <div className="flex-1 flex flex-col p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Test Log</h2>
          {!isAtBottom && (
            <button
              onClick={() => scrollToBottom("smooth")}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              ↓ Scroll to Bottom
            </button>
          )}
        </div>

        <div
          ref={logRef}
          onScroll={handleScroll}
          className="flex-1 bg-gray-800 rounded border border-gray-700 overflow-y-auto overflow-x-hidden"
          style={{
            display: "grid",
            gridTemplateRows: `repeat(${testLog.length || 1}, auto)`,
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: "1px",
            padding: "1px",
          }}
        >
          {testLog.length === 0 ? (
            <div className="bg-gray-700 border border-white p-8 text-center">
              <div className="text-gray-400">No test output yet...</div>
            </div>
          ) : (
            testLog.map((msg, idx) => {
              const isUser = msg.sender === "User" || msg.sender === "You";
              const isError = msg.level === "error" || msg.type === "error";
              const isResult = msg.type === "result";

              return (
                <div
                  key={msg.id}
                  className={`bg-gray-700 border border-white p-3 ${
                    isUser ? "text-right" : "text-left"
                  }`}
                  style={{
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    maxWidth: "100%",
                  }}
                >
                  <div
                    className={`inline-block max-w-[95%] ${
                      isUser
                        ? "bg-blue-600 text-white rounded-lg rounded-br-md"
                        : isError
                        ? "bg-red-600 text-white rounded-lg rounded-bl-md"
                        : isResult
                        ? "bg-green-600 text-white rounded-lg rounded-bl-md"
                        : "bg-gray-600 text-gray-100 rounded-lg rounded-bl-md"
                    } px-3 py-2`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center gap-2 mb-1 text-xs opacity-75">
                      <span className="font-medium">{msg.sender}</span>
                      <span>•</span>
                      <span>{formatTime(msg.timestamp)}</span>
                      {msg.type && (
                        <>
                          <span>•</span>
                          <span className="uppercase">{msg.type}</span>
                        </>
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="text-sm whitespace-pre-wrap break-words">
                      {cleanLogMessage(msg.message)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TestingInterface;
