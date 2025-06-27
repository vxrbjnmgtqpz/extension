import fs from 'fs';
import path from 'path';
import chokidar from 'chokidar';

const RELAY_PATH = path.resolve('./agent_logs/cursor/CursorRelay.txt');
const LOG_PATH = path.resolve('./agent_logs/cursor/log.json');

let lastContent = '';

// Ensure directories exist
function ensureDirectories() {
  const dir = path.dirname(RELAY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readRelayFile(): string {
  if (!fs.existsSync(RELAY_PATH)) return '';
  try {
    return fs.readFileSync(RELAY_PATH, 'utf-8');
  } catch (error) {
    console.error('Error reading relay file:', error);
    return '';
  }
}

function parseMessages(content: string) {
  const messages = [];
  const blocks = content.split('---').map(b => b.trim()).filter(Boolean);
  
  for (const block of blocks) {
    const lines = block.split('\n');
    let sender = "System";
    let message = "";
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('_**User**_')) {
        sender = "User";
        message = lines.slice(i + 1).join('\n').trim();
        break;
      } else if (line.includes('_**Assistant**_')) {
        sender = "Assistant";
        message = lines.slice(i + 1).join('\n').trim();
        break;
      }
    }
    
    if (message) {
      messages.push({
        timestamp: new Date().toISOString(),
        sender,
        message
      });
    }
  }
  
  return messages;
}

function writeLog(messages: any[]) {
  try {
    fs.writeFileSync(LOG_PATH, JSON.stringify(messages, null, 2));
    console.log(`[CursorRelay] ✅ Synced ${messages.length} messages`);
  } catch (error) {
    console.error('Error writing log:', error);
  }
}

function scanRelay() {
  const content = readRelayFile();
  if (content === lastContent) return;
  lastContent = content;
  
  const messages = parseMessages(content);
  writeLog(messages);
}

// Initialize
ensureDirectories();

// Start watching
const watcher = chokidar.watch(RELAY_PATH, {
  persistent: true,
  ignoreInitial: false,
  awaitWriteFinish: {
    stabilityThreshold: 300,
    pollInterval: 100
  }
});

watcher
  .on('add', scanRelay)
  .on('change', scanRelay)
  .on('error', error => console.error('Watcher error:', error));

console.log(`[CursorRelay] 👀 Watching ${RELAY_PATH}`); 