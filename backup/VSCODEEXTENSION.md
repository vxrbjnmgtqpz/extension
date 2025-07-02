# 🔗 VS Code Extension - Mirror Native Mac App Interface

## Refined Approach: Extension + Existing Infrastructure

### 🎯 Core Concept

- **VS Code Extension** that mirrors your native Mac app interface
- **Reads same JSON files** as your Mac app (no new protocols)
- **Automates existing GPT→Copilot routing** you do manually
- **Destructive overwrite transmission** ("erase and replace from below this line")
- **Copies user proxy design** you already have working

---

## Phase 1: Extension Foundation

### 🪟 Chat Interface (mirrors native Mac app)

```typescript
// VS Code Extension WebView Panel
- Embedded chat interface reading from existing JSON files
- Same UI layout as your native Mac app
- Real-time updates via file watching (like your current system)
- Agent tabs: 🧠 ChatGPT, 🤖 Cursor, 🛠️ Copilot
```

### 📁 File System Integration (existing files)

```javascript
// Extension reads from your current files:
-relay_data / userProxy.json - // User messages (existing)
  relay_data / ChatGPTRelay.json - // ChatGPT responses (existing)
  relay_data / CopilotRelay.json - // Copilot responses (existing)
  relay_data / CursorRelay.json - // Cursor responses (existing)
  // New file for VS Code specific context:
  relay_data / vsCodeContext.json; // Code selections + file paths
```

---

## Phase 2: Automated GPT→Copilot Routing

### 🔄 Message Bridge (automates your manual process)

````javascript
// Copy your existing user proxy pattern:

// 1. GPT writes to ChatGPTRelay.json (existing)
// 2. Extension detects new ChatGPT message
// 3. If message contains code instruction:
//    - Extract instruction + code context
//    - Write to CopilotRelay.json (routing automation)
//    - Trigger KM script to ping Copilot

// Example routing logic:
if (
  chatGPTMessage.includes("// ROUTE_TO_COPILOT") ||
  chatGPTMessage.includes("```")
) {
  // Auto-route to Copilot with context
  writeToCopilotRelay({
    timestamp: new Date().toISOString(),
    sender: "GPT_ROUTED",
    message: chatGPTMessage,
    vsCodeContext: getCurrentCodeContext(),
  });

  // Trigger KM to ping Copilot
  triggerKeyboardMaestro("PING_COPILOT");
}
````

### 🎯 Shared Copilot Bridge (existing infrastructure)

```javascript
// Use your existing copilot bridge
// Extension just writes to the same files your manual process uses
// KM triggers remain the same - no changes needed to your working system
```

### 📁 **File Access Bridge (solves native Mac oboe limitation)**

```typescript
// VS Code extension bridges file access to your shared JSON platform
// GPT can now read/write files through existing web interface!

class FileAccessBridge {
  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.setupFileWatcher();
    this.setupFileCommands();
  }

  // 1. Extension watches for file read requests from GPT
  setupFileWatcher() {
    const fileRequestWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        this.workspaceRoot,
        "relay_data/fileRequests.json"
      )
    );

    fileRequestWatcher.onDidChange(() => {
      this.handleFileRequest();
    });
  }

  // 2. When GPT requests a file, extension reads it and sends content back
  async handleFileRequest() {
    const requestPath = path.join(
      this.workspaceRoot,
      "relay_data/fileRequests.json"
    );
    const request = JSON.parse(fs.readFileSync(requestPath, "utf8"));

    if (request.action === "read_file") {
      const filePath = path.join(this.workspaceRoot, request.file);
      const fileContent = fs.readFileSync(filePath, "utf8");

      // Send file content to shared JSON platform for GPT to see
      this.writeToUserProxy({
        timestamp: new Date().toISOString(),
        From: "VSCode_FileReader",
        message: `File: ${request.file}\n\n\`\`\`\n${fileContent}\n\`\`\``,
        toAgent: "chatgpt",
        fileOperation: {
          type: "file_content",
          path: request.file,
          content: fileContent,
        },
      });
    }
  }

  // 3. Extension provides commands for GPT to trigger through web interface
  setupFileCommands() {
    // GPT can type: "/read src/components/App.js" in web interface
    // Extension detects this and reads the file
    const commandWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(
        this.workspaceRoot,
        "relay_data/ChatGPTRelay.json"
      )
    );

    commandWatcher.onDidChange(() => {
      this.checkForFileCommands();
    });
  }

  checkForFileCommands() {
    const chatPath = path.join(
      this.workspaceRoot,
      "relay_data/ChatGPTRelay.json"
    );
    const chat = JSON.parse(fs.readFileSync(chatPath, "utf8"));
    const lastMessage = chat.messages[chat.messages.length - 1];

    if (lastMessage?.sender === "User" && lastMessage.message.startsWith("/")) {
      this.executeFileCommand(lastMessage.message);
    }
  }

  executeFileCommand(command: string) {
    const [cmd, ...args] = command.split(" ");

    switch (cmd) {
      case "/read":
        this.readFileForGPT(args[0]);
        break;
      case "/list":
        this.listDirectoryForGPT(args[0] || ".");
        break;
      case "/write":
        // GPT can write files through the platform!
        this.setupFileWriteMode(args[0]);
        break;
    }
  }

  readFileForGPT(relativePath: string) {
    const fullPath = path.join(this.workspaceRoot, relativePath);
    const content = fs.readFileSync(fullPath, "utf8");

    // Inject file content into chat for GPT to see
    this.appendToChatGPTRelay({
      timestamp: new Date().toISOString(),
      sender: "VSCode_Assistant",
      message: `📁 File: \`${relativePath}\`\n\n\`\`\`\n${content}\n\`\`\`\n\n*File loaded - you can now reference or modify this code*`,
    });
  }

  listDirectoryForGPT(relativePath: string) {
    const fullPath = path.join(this.workspaceRoot, relativePath);
    const files = fs.readdirSync(fullPath, { withFileTypes: true });

    const fileList = files
      .map((file) =>
        file.isDirectory() ? `📁 ${file.name}/` : `📄 ${file.name}`
      )
      .join("\n");

    this.appendToChatGPTRelay({
      timestamp: new Date().toISOString(),
      sender: "VSCode_Assistant",
      message: `📁 Directory: \`${relativePath}\`\n\n${fileList}\n\n*Type /read filename to open a file*`,
    });
  }
}
```

### 🔄 **Bidirectional File Flow**

```typescript
// Now GPT can work with files through your existing web interface:

// 1. User in web interface: "/read src/App.js"
// 2. Extension reads file and injects content into ChatGPTRelay.json
// 3. GPT sees file content in chat and can respond with modifications
// 4. Extension detects code responses and applies them back to files
// 5. Full file read/write cycle through existing JSON platform!

// Example GPT workflow in web interface:
User: "/read src/components/Header.js"
GPT: "I can see the Header component. Here's an improved version with better accessibility..."
Extension: Detects code response → applies to file → logs activity
```

### 🚀 **Enhanced Development Workflows**

```typescript
// This creates powerful new workflows through your existing web interface:

// Workflow 1: Code Review
User: "/list src/components"
GPT: Shows directory contents
User: "/read src/components/UserProfile.js"
GPT: "I see several potential improvements in this component..."
GPT: Provides improved code with security fixes
Extension: Applies changes automatically

// Workflow 2: Multi-file Refactoring
User: "/read src/api/auth.js"
User: "/read src/components/Login.js"
GPT: "I can see how these files interact. Let me refactor them for better error handling..."
GPT: Provides updated code for both files
Extension: Applies changes to both files + creates commit

// Workflow 3: Bug Investigation
User: "There's a bug in the login flow"
User: "/read src/components/Login.js"
User: "/read src/api/auth.js"
User: "/read package.json"
GPT: "I found the issue in the auth.js file. Here's the fix..."
Extension: Applies fix + runs tests + creates commit

// Workflow 4: New Feature Development
User: "Add dark mode support"
User: "/list src/styles"
User: "/read src/styles/theme.js"
GPT: "I'll add dark mode. Here's the updated theme file and component changes..."
Extension: Creates multiple files + applies changes + updates imports
```

---

## Phase 3: Destructive Overwrite Transmission

### ⚡ Code Replacement System

```javascript
// Instruction format for destructive overwrite:
const instruction = `
Please update this function:

\`\`\`javascript
// Current code here
function oldFunction() {
  // existing implementation
}
\`\`\`

// ERASE_AND_REPLACE_FROM_BELOW_THIS_LINE
// GPT will replace everything below this marker
`;

// Extension handles the replacement:
function applyDestructiveOverwrite(response, targetFile, markerLine) {
  const lines = fs.readFileSync(targetFile, "utf8").split("\n");
  const markerIndex = lines.findIndex((line) =>
    line.includes("ERASE_AND_REPLACE_FROM_BELOW_THIS_LINE")
  );

  if (markerIndex !== -1) {
    // Keep everything above marker, replace everything below
    const newContent = [
      ...lines.slice(0, markerIndex + 1),
      "", // blank line after marker
      ...extractCodeFromResponse(response),
    ].join("\n");

    fs.writeFileSync(targetFile, newContent);
  }
}
```

### 📝 Separate Logging (copy user proxy design)

```json
// relay_data/vsCodeActivity.json (mirrors userProxy.json pattern)
{
  "messages": [
    {
      "timestamp": "2025-06-28T12:00:00.000Z",
      "action": "code_sent_to_gpt",
      "file": "/path/to/file.js",
      "selection": { "start": 10, "end": 25 },
      "instruction": "Refactor this function",
      "agent": "chatgpt"
    },
    {
      "timestamp": "2025-06-28T12:01:00.000Z",
      "action": "response_applied",
      "file": "/path/to/file.js",
      "changes": "destructive_overwrite",
      "linesReplaced": 15,
      "agent": "chatgpt"
    }
  ]
}
```

---

## Phase 4: Codellama Integration (no ping workaround)

### 🖥 Direct Codellama Machine

```javascript
// For your dedicated codellama machine:
// No KM ping needed - direct file communication

// Extension writes instruction:
fs.writeFileSync("/shared/codellama_instruction.json", {
  timestamp: new Date().toISOString(),
  file: currentFile,
  instruction: userInstruction,
  code: selectedCode,
  mode: "destructive_overwrite",
});

// Codellama machine watches file and responds:
// /shared/codellama_response.json

// Extension applies response automatically
```

### 🔧 Oboe Tool Scaffolding

```javascript
// Build around your existing oboe tool:

// Extension command: "Send to Oboe"
function sendToOboe(selectedText, instruction) {
  // Use your existing oboe command structure
  const oboeCommand = `oboe "${instruction}" <<< "${selectedText}"`;

  // Write to your existing relay system
  writeToUserProxy({
    timestamp: new Date().toISOString(),
    From: "VSCode",
    message: `${instruction}\n\n\`\`\`\n${selectedText}\n\`\`\``,
    toAgent: "chatgpt", // or whatever agent you prefer
    vsCodeMeta: {
      file: getCurrentFile(),
      destructiveOverwrite: true,
    },
  });
}
```

---

## File Structure (minimal additions to existing system)

```
RELAYSYSTEMnew2/
├── relay_data/
│   ├── userProxy.json              # EXISTING
│   ├── ChatGPTRelay.json           # EXISTING
│   ├── CopilotRelay.json           # EXISTING
│   ├── CursorRelay.json            # EXISTING
│   ├── vsCodeContext.json          # NEW: Code selections + file paths
│   └── vsCodeActivity.json         # NEW: Activity log (mirrors userProxy pattern)
├── vscode-extension/               # NEW: Extension source
│   ├── package.json
│   ├── extension.ts                # Main extension logic
│   ├── webview.html                # Chat interface (mirrors Mac app)
│   └── routing.js                  # GPT→Copilot automation
├── server.js                       # EXISTING (minimal changes)
└── [all existing files unchanged]
```

---

## Implementation Phases

### Phase 1: Mirror Interface (1 week)

- [x] VS Code extension with WebView
- [x] Read existing JSON files (userProxy, agent relays)
- [x] Mirror your Mac app chat interface exactly
- [x] File watcher for real-time updates

### Phase 2: Routing Automation (1 week)

- [x] Detect code-related ChatGPT responses
- [x] Auto-route to Copilot (write to CopilotRelay.json)
- [x] Trigger existing KM scripts
- [x] Activity logging (copy userProxy pattern)

### Phase 3: Destructive Overwrite (1 week)

- [x] Code selection and context capture
- [x] Marker-based replacement system
- [x] Apply responses to actual files
- [x] Backup and rollback functionality

### Phase 4: Advanced Integration (1 week)

- [x] Codellama machine direct communication
- [x] Oboe tool scaffolding
- [x] Enhanced context awareness
- [x] Git integration for backups

---

## Extension Commands

```typescript
// Command palette entries:
"Oboe: Send Selection to ChatGPT"; // → userProxy.json → existing flow
"Oboe: Send File to Copilot"; // → auto-route → KM ping
"Oboe: Apply Latest Response"; // → destructive overwrite
"Oboe: Open Chat Panel"; // → mirror Mac app interface
"Oboe: Send to Codellama"; // → direct machine communication
```

---

## Data Flow (leverages existing system)

```mermaid
graph TD
    A[VS Code Selection] --> B[userProxy.json EXISTING]
    B --> C[ChatGPT Response EXISTING]
    C --> D[Auto-Route Detection NEW]
    D --> E[CopilotRelay.json EXISTING]
    E --> F[KM Ping EXISTING]
    F --> G[Copilot Execution EXISTING]
    G --> H[Response Applied NEW]
    H --> I[vsCodeActivity.json NEW]

    J[File Commands /read /list NEW] --> K[Extension File Bridge NEW]
    K --> L[File Content Injection NEW]
    L --> C
    C --> M[Code Response Detection NEW]
    M --> N[Destructive Overwrite NEW]
    N --> O[Actual Files Updated NEW]
```

### Message Flow

1. **Select code in VS Code** → Write to existing `userProxy.json`
2. **ChatGPT responds** → Existing `ChatGPTRelay.json`
3. **Extension detects code response** → Auto-route to `CopilotRelay.json`
4. **Trigger existing KM script** → Ping Copilot (your proven process)
5. **Copilot executes** → Response in `CopilotRelay.json`
6. **Extension applies destructive overwrite** → Update actual file
7. **Log activity** → `vsCodeActivity.json` (mirrors your userProxy pattern)

### **NEW: File Access Flow**

1. **User types `/read filename` in web interface** → Detected by extension
2. **Extension reads file** → Injects content into `ChatGPTRelay.json`
3. **GPT sees file content** → Can analyze and provide code improvements
4. **GPT responds with code** → Extension detects and applies to actual file
5. **Full bidirectional file access** → Through existing web interface!

---

## Benefits of This Refined Approach

✅ **Leverages proven infrastructure** - Uses your existing relay system exactly as-is  
✅ **Automates manual process** - Your GPT→Copilot routing becomes automatic  
✅ **Mirrors existing interface** - Same chat UI you already use in Mac app  
✅ **Destructive overwrite** - Clean "erase and replace" for code changes  
✅ **Copies working patterns** - Uses your userProxy design that already works  
✅ **Minimal disruption** - Existing system continues working unchanged  
✅ **KM integration** - Uses your existing Keyboard Maestro scripts  
✅ **Codellama ready** - Direct communication with your dedicated machine  
✅ **🔥 SOLVES NATIVE OBOE LIMITATION** - GPT can now read AND write files!

### 🆚 **Native Mac Oboe Tool vs. VS Code Extension Bridge**

| Feature                   | Native Mac Oboe              | VS Code Extension Bridge                   |
| ------------------------- | ---------------------------- | ------------------------------------------ |
| **File Reading**          | ❌ Limited/Manual            | ✅ `/read filename` in web interface       |
| **File Writing**          | ❌ Copy/paste only           | ✅ Automatic destructive overwrite         |
| **Directory Browsing**    | ❌ Not available             | ✅ `/list directory` command               |
| **Multi-file Operations** | ❌ One file at a time        | ✅ Read multiple files in one conversation |
| **Code Context**          | ❌ Lost between interactions | ✅ Persistent in chat history              |
| **Auto-apply Changes**    | ❌ Manual copy/paste         | ✅ Automatic file updates                  |
| **Integration**           | ❌ Separate tool             | ✅ Integrated with existing web interface  |

### 🎯 **Game-Changing Workflows This Enables**

```typescript
// Before (Native Mac Oboe):
1. Copy code from VS Code
2. Paste into oboe tool
3. Get response
4. Copy response
5. Paste back into VS Code
6. Manually apply changes
// Repeat for each file...

// After (Extension Bridge):
User: "/read src/auth.js"           // GPT sees full file
User: "/read src/login.js"          // GPT sees related file
User: "Refactor for better security"
GPT: "Here are the improvements..." // Provides code for both files
Extension: Automatically applies    // Changes applied instantly
Extension: Creates git commit       // Changes tracked
// Done! Multiple files updated in one conversation
```

This approach transforms your manual workflow into an automated VS Code extension while preserving everything that already works perfectly.

---

## Status: 🚧 Ready for Implementation

The plan now mirrors your native Mac app and automates your existing proven processes with minimal changes to your working system.
