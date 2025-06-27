import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

interface ProxyMessage {
  timestamp: string;
  sender: "Assistant";
  message: string;
}

const ProxyInterface = () => {
  const [messages, setMessages] = useState({
    chatgpt: '',
    cursor: '',
    copilot: ''
  });

  const handleSubmit = async (agent: string, message: string) => {
    if (!message.trim()) return;

    const proxyMessage: ProxyMessage = {
      timestamp: new Date().toISOString(),
      sender: "Assistant",
      message: message.trim()
    };

    try {
      const response = await fetch('http://localhost:3001/write-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent,
          message: proxyMessage
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to write message: ${response.status}`);
      }

      // Clear the text area after successful submission
      setMessages(prev => ({
        ...prev,
        [agent]: ''
      }));
    } catch (error) {
      console.error("Error writing to file:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, agent: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(agent, messages[agent as keyof typeof messages]);
    }
  };

  return (
    <div style={{
      display: 'flex',
      padding: '20px',
      gap: '20px',
      height: '100vh',
      backgroundColor: '#1E1E1E',
      color: '#E2E8F0'
    }}>
      {['chatgpt', 'cursor', 'copilot'].map(agent => (
        <div key={agent} style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <h2 style={{
            margin: 0,
            textTransform: 'capitalize',
            color: agent === 'chatgpt' ? '#E9D8FD' : 
                   agent === 'cursor' ? '#E2E8F0' : '#CBD5E1'
          }}>{agent}</h2>
          <textarea
            value={messages[agent as keyof typeof messages]}
            onChange={e => setMessages(prev => ({
              ...prev,
              [agent]: e.target.value
            }))}
            onKeyDown={e => handleKeyDown(e, agent)}
            placeholder={`Type ${agent} response...`}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: '#2A2A2A',
              border: '1px solid #3A3A3A',
              borderRadius: '4px',
              color: '#E2E8F0',
              fontSize: '14px',
              resize: 'none',
              fontFamily: 'monospace'
            }}
          />
        </div>
      ))}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('proxy-root')!).render(
  <React.StrictMode>
    <ProxyInterface />
  </React.StrictMode>
); 