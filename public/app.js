let currentAgent = null;
let messages = {};

// Save and restore last selected tab
function saveLastTab(agent) {
  localStorage.setItem('lastSelectedAgent', agent);
}

function getLastTab() {
  return localStorage.getItem('lastSelectedAgent');
}

// Initialize oboe.js streaming - handles both initial load and real-time updates
function initializeStreaming() {
  console.log('� Starting oboe.js message streaming...');
  
  try {
    oboe('/stream')
      .node('*', function(data) {
        try {
          if (data.type === 'update') {
            console.log(`� Oboe update for ${data.agent}: ${data.messages.length} messages`);
            const previousMessageCount = messages[data.agent]?.length || 0;
            messages[data.agent] = data.messages;
            
            // Show preview of first message for debugging (only on initial load)
            if (previousMessageCount === 0 && data.messages.length > 0) {
              const firstMsg = data.messages[0];
              console.log(`� First ${data.agent} message: "${firstMsg.message.substring(0, 50)}..." by ${firstMsg.sender}`);
            }
            
            // Only update display if we're currently viewing this agent or all agents
            if (currentAgent === data.agent || currentAgent === 'all') {
              displayMessages();
              
              // If new messages were added, ensure smooth scroll
              if (data.messages.length > previousMessageCount) {
                setTimeout(() => {
                  const container = document.getElementById('chat-container');
                  scrollToBottom(container, true);
                }, 100);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing oboe data:', error);
        }
      })
      .done(function() {
        console.log('✅ Oboe stream completed');
      })
      .fail(function(error) {
        console.warn('Oboe stream error, continuing without real-time updates:', error);
      });
  } catch (error) {
    console.warn('Oboe streaming not available, using initial load only:', error);
  }
}

// Display messages for current agent
function displayMessages() {
  console.log('🎬 displayMessages() called for agent:', currentAgent);
  
  const container = document.getElementById('chat-container');
  let agentMessages = [];
  
  if (currentAgent === null) {
    // No agent selected - show instructions
    console.log('📝 No agent selected, showing instructions');
    container.innerHTML = '<div class="text-center text-gray-400 mt-8">Select an agent tab to view messages</div>';
    return;
  } else if (currentAgent === 'all') {
    // Combine all messages and sort by timestamp
    console.log('🌐 Displaying ALL messages');
    agentMessages = [];
    Object.entries(messages).forEach(([agent, msgs]) => {
      console.log(`📊 Agent ${agent}: ${msgs.length} messages`);
      msgs.forEach(msg => {
        agentMessages.push({...msg, agent: agent});
      });
    });
    agentMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } else {
    agentMessages = messages[currentAgent] || [];
    console.log(`📊 Agent ${currentAgent}: ${agentMessages.length} messages`);
  }
  
  container.innerHTML = '';
  
  if (agentMessages.length === 0) {
    console.log('🔍 No messages found, showing placeholder');
    container.innerHTML = '<div class="text-center text-gray-400 mt-8">No messages yet</div>';
    return;
  }
  
  console.log(`🎨 Rendering ${agentMessages.length} messages...`);
  
  agentMessages.forEach((msg, index) => {
    const messageDiv = document.createElement('div');
    const isUser = msg.sender === 'User';
    const time = new Date(msg.timestamp).toLocaleTimeString();
    
    // Set alignment: user messages right, agent messages left
    messageDiv.className = `mb-4 flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`;
    
    // Get agent-specific icon and info
    const getAgentInfo = (sender, agent, currentTab) => {
      if (sender === 'User') return { icon: '👤', name: 'User', color: 'bg-gray-100 text-gray-800' };
      
      // Map agent names to their specific icons and colors
      const agentMap = {
        'ChatGPT': { icon: '🧠', name: 'ChatGPT', color: 'bg-purple-100 text-purple-800' },
        'Cursor': { icon: '🤖', name: 'Cursor', color: 'bg-blue-100 text-blue-800' },
        'Copilot': { icon: '🛠️', name: 'Copilot', color: 'bg-green-100 text-green-800' }
      };
      
      // If sender is "Assistant", use the agent field or current tab to determine the agent
      if (sender === 'Assistant') {
        let agentName = null;
        
        // First try to use the agent field (for "All" tab)
        if (agent) {
          const tabAgentMap = {
            'chatgpt': 'ChatGPT',
            'cursor': 'Cursor', 
            'copilot': 'Copilot'
          };
          agentName = tabAgentMap[agent];
        }
        
        // Fallback to current tab (for individual tabs)
        if (!agentName && currentTab && currentTab !== 'all') {
          const tabAgentMap = {
            'chatgpt': 'ChatGPT',
            'cursor': 'Cursor', 
            'copilot': 'Copilot'
          };
          agentName = tabAgentMap[currentTab];
        }
        
        return agentMap[agentName] || { icon: '🤖', name: 'Assistant', color: 'bg-gray-100 text-gray-800' };
      }
      
      // Try to match by sender name first
      return agentMap[sender] || { icon: '🤖', name: sender, color: 'bg-gray-100 text-gray-800' };
    };
    
    const agentInfo = getAgentInfo(msg.sender, msg.agent, currentAgent);
    
    let agentBadge = '';
    if (currentAgent === 'all' && msg.agent) {
      agentBadge = `<span class="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">${msg.agent}</span>`;
    }
    
    messageDiv.innerHTML = `
      <div class="flex-shrink-0">
        <div class="w-8 h-8 rounded-full ${agentInfo.color} flex items-center justify-center text-sm">
          ${agentInfo.icon}
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}">
          <span class="text-sm font-medium text-gray-300">${agentInfo.name}</span>
          ${agentBadge}
          <span class="text-xs text-gray-500">${time}</span>
        </div>
        <div class="message-content ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'} p-3 rounded-lg max-w-md ${isUser ? 'ml-auto' : ''}">
          <div class="markdown-content">${marked.parse(msg.message)}</div>
        </div>
      </div>
    `;
    
    container.appendChild(messageDiv);
    
    // Log first few messages for debugging
    if (index < 3) {
      console.log(`Message ${index + 1}: "${msg.message.substring(0, 50)}..." at ${time}`);
    }
  });
  
  // Scroll to bottom with smooth animation
  scrollToBottom(container);
  console.log(`✅ Messages rendered! Container height: ${container.scrollHeight}px`);
}

// Enhanced scroll to bottom function
function scrollToBottom(container, smooth = true) {
  if (!container) return;
  
  const scrollOptions = {
    top: container.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto'
  };
  
  // Use scrollTo if available, fallback to scrollTop
  if (container.scrollTo) {
    container.scrollTo(scrollOptions);
  } else {
    container.scrollTop = container.scrollHeight;
  }
  
  // Also ensure the main chat area is scrolled to bottom
  const chatArea = document.querySelector('.w-full.h-full.overflow-auto');
  if (chatArea && chatArea !== container) {
    if (chatArea.scrollTo) {
      chatArea.scrollTo(scrollOptions);
    } else {
      chatArea.scrollTop = chatArea.scrollHeight;
    }
  }
  
  console.log(`📜 Scrolled to bottom: ${container.scrollTop}/${container.scrollHeight}`);
}

// Send message
async function sendMessage() {
  const input = document.getElementById('message-input');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Prevent sending if no agent is selected
  if (currentAgent === null) {
    alert('Please select an agent tab first');
    return;
  }
  
  const sendButton = document.getElementById('send-button');
  const originalText = sendButton.textContent;
  sendButton.textContent = 'Sending...';
  sendButton.disabled = true;
  
  try {
    const targetAgent = currentAgent === 'all' ? 'chatgpt' : currentAgent;
    
    const response = await fetch('http://localhost:3001/write-user-only', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agent: targetAgent,
        message: {
          timestamp: new Date().toISOString(),
          sender: 'User',
          message: message,
          toAgent: targetAgent
        }
      })
    });
    
    if (response.ok) {
      input.value = '';
      input.style.height = '40px';
      // Scroll to bottom after sending to show the new message
      setTimeout(() => {
        const container = document.getElementById('chat-container');
        scrollToBottom(container, true);
      }, 500);
    } else {
      alert('Failed to send message');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Error sending message');
  } finally {
    sendButton.textContent = originalText;
    sendButton.disabled = false;
  }
}

// Switch agent
function switchAgent(agent) {
  console.log(`🔀 Switching to agent: ${agent} (was: ${currentAgent})`);
  currentAgent = agent;
  
  // Save the last selected tab
  saveLastTab(agent);
  console.log(`💾 Saved last tab: ${agent}`);
  
  // Update placeholder text
  const input = document.getElementById('message-input');
  const agentName = agent === 'all' ? 'any agent' : agent;
  input.placeholder = `Type a message to ${agentName}...`;
  
  // Update tab styles
  document.querySelectorAll('.agent-tab').forEach(tab => {
    if (tab.dataset.agent === agent) {
      tab.className = 'agent-tab flex-1 px-2 py-2 text-xs font-medium rounded bg-blue-600 text-white';
      console.log(`🎨 Set active style for tab: ${agent}`);
    } else {
      tab.className = 'agent-tab flex-1 px-2 py-2 text-xs font-medium rounded bg-gray-100 text-gray-700';
    }
  });
  
  console.log(`📋 About to display messages for ${agent}...`);
  displayMessages();
  
  // Ensure scroll to bottom after switching agents
  setTimeout(() => {
    const container = document.getElementById('chat-container');
    scrollToBottom(container, false); // No animation for tab switch
  }, 100);
}

// Auto-resize textarea
function autoResize() {
  const textarea = document.getElementById('message-input');
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 WorkStation app starting...');
  
  // Add debugging info
  console.log('🔍 Page URL:', window.location.href);
  console.log('🔍 User Agent:', navigator.userAgent);
  
  // Event listeners first
  document.getElementById('send-button').addEventListener('click', sendMessage);
  
  document.getElementById('message-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  document.getElementById('message-input').addEventListener('input', autoResize);
  
  document.querySelectorAll('.agent-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      console.log('🎯 Tab clicked:', tab.dataset.agent);
      switchAgent(tab.dataset.agent);
    });
  });
  
  // Debug buttons
  document.getElementById('debug-reload').addEventListener('click', async () => {
    console.log('🔄 Manual reload triggered - restarting oboe stream');
    // Clear existing messages
    messages = { chatgpt: [], cursor: [], copilot: [] };
    // Restart streaming
    initializeStreaming();
    // Refresh display if agent is selected
    if (currentAgent) {
      setTimeout(() => displayMessages(), 1000);
    }
  });
  
  document.getElementById('debug-info').addEventListener('click', () => {
    console.log('🔍 Debug Info:');
    console.log('Current agent:', currentAgent);
    console.log('Message counts:', {
      chatgpt: messages.chatgpt?.length || 0,
      cursor: messages.cursor?.length || 0,
      copilot: messages.copilot?.length || 0
    });
    console.log('Last tab from storage:', getLastTab());
    console.log('Container element:', document.getElementById('chat-container'));
    const container = document.getElementById('chat-container');
    console.log('Container innerHTML length:', container.innerHTML.length);
    console.log('Container height:', container.scrollHeight);
    console.log('Message elements in DOM:', document.querySelectorAll('.mb-4.flex.gap-3').length);
  });
  
  document.getElementById('clear-storage').addEventListener('click', () => {
    localStorage.clear();
    console.log('🗑️ LocalStorage cleared');
    location.reload();
  });
  
  document.getElementById('scroll-bottom').addEventListener('click', () => {
    const container = document.getElementById('chat-container');
    scrollToBottom(container, true);
    console.log('📜 Manual scroll to bottom triggered');
  });
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + End = Scroll to bottom
    if ((e.ctrlKey || e.metaKey) && e.key === 'End') {
      e.preventDefault();
      const container = document.getElementById('chat-container');
      scrollToBottom(container, true);
      console.log('📜 Keyboard shortcut: Scroll to bottom');
    }
    
    // Ctrl/Cmd + Home = Scroll to top
    if ((e.ctrlKey || e.metaKey) && e.key === 'Home') {
      e.preventDefault();
      const container = document.getElementById('chat-container');
      if (container.scrollTo) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        container.scrollTop = 0;
      }
      console.log('📜 Keyboard shortcut: Scroll to top');
    }
  });
  
  console.log('✅ Event listeners set up');
  
  // Start oboe.js streaming immediately - it handles both initial load and real-time updates
  console.log('🌊 Starting oboe.js streaming...');
  initializeStreaming();
  
  // Restore last selected tab after a short delay to allow initial data to load
  setTimeout(() => {
    const lastTab = getLastTab();
    if (lastTab) {
      console.log(`🔄 Restoring last selected tab: ${lastTab}`);
      switchAgent(lastTab);
    } else {
      console.log('🆕 No previous tab, showing instruction message');
      // Set initial placeholder text if no tab was previously selected
      const input = document.getElementById('message-input');
      input.placeholder = 'Select an agent tab to start messaging...';
    }
  }, 1000);
  
  // Safety mechanism to ensure messages display
  setTimeout(() => {
    console.log('🛡️ Safety check: ensuring messages are displayed...');
    if (currentAgent && currentAgent !== 'all') {
      const messageCount = messages[currentAgent]?.length || 0;
      const domMessageCount = document.querySelectorAll('.mb-4.flex.gap-3').length;
      console.log(`Safety check: ${messageCount} messages loaded, ${domMessageCount} in DOM`);
      
      if (messageCount > 0 && domMessageCount === 0) {
        console.log('🚨 Messages loaded but not displayed - forcing display!');
        displayMessages();
      }
    }
  }, 3000);
  
  console.log('✅ WorkStation app initialization complete');
});