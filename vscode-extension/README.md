# 🔗 ChatGPT Oboe Bridge - VS Code Extension

A VS Code extension that bridges the ChatGPT native Mac app with VS Code file system access, solving the native oboe tool's file access limitations.

## 🚀 Features

### ✅ **File Access Bridge**

- **Solves native Mac oboe limitation** - ChatGPT can now read/write files through VS Code
- Use `/read`, `/list`, `/write` commands in your ChatGPT native Mac app interface
- Files are automatically injected into chat for seamless interaction

### ✅ **Auto-Routing System**

- Automatically detects code-related ChatGPT responses
- Routes to Copilot for implementation (integrates with existing relay system)
- No manual copy/paste between agents

### ✅ **Destructive Overwrite**

- Apply ChatGPT code changes directly to files
- Marker-based replacement with `ERASE_AND_REPLACE_FROM_BELOW_THIS_LINE`
- Smart function/class replacement
- Git backup before changes

### ✅ **Real-time Streaming**

- Monitors relay files for instant command processing
- Live activity logging and debugging
- Integration with existing oboe.js patterns

---

## 📦 Installation

### Prerequisites

- VS Code 1.60.0 or higher
- Node.js (for running the extension)
- Existing ChatGPT native Mac app with relay system

### Install Extension

1. Clone/download this repository
2. Open VS Code in the `vscode-extension` directory
3. Run `npm install` to install dependencies
4. Press `F5` to launch Extension Development Host
5. The extension will activate automatically

---

## 🎯 Quick Start

### 1. **File Commands in ChatGPT**

Use these commands in your ChatGPT native Mac app interface:

```
/read src/components/App.js
```

> Reads file content and injects it into chat

```
/list src/components
```

> Lists directory contents with file sizes

```
/write src/utils/newHelper.js
function newHelper() {
    return "This will be written to file";
}
```

> Writes content to file (extracts from code blocks)

### 2. **VS Code Commands**

Access via Command Palette (`Cmd+Shift+P`):

- **`Oboe: Send Selection to Agent`** (`Cmd+Shift+O`) - Send selected code to ChatGPT
- **`Oboe: Send File to Agent`** - Send entire current file to ChatGPT
- **`Oboe: Apply Latest Response`** - Apply ChatGPT code changes to current file
- **`Oboe: Open Chat Panel`** - View bridge status and commands
- **`Oboe: Enable File Access Bridge`** - Toggle file monitoring on/off

### 3. **Workflow Example**

```bash
# 1. In ChatGPT native Mac app:
User: "/read src/auth.js"
# → Extension reads file and injects content into chat

GPT: "I see the auth function. Here's an improved version with better security..."
# → Extension detects code response and prepares overwrite

# 2. In VS Code:
# → Use "Apply Latest Response" command
# → Review changes in preview
# → Confirm to apply with automatic git backup
```

---

## 🔧 Configuration

### Extension Settings

Configure via VS Code Settings (`Cmd+,`):

```json
{
  "oboe.relayDataPath": "./relay_data",
  "oboe.defaultAgent": "chatgpt",
  "oboe.enableFileAccess": true
}
```

### Relay File Integration

The extension integrates with your existing relay system:

```
relay_data/
├── userProxy.json           # User messages (existing)
├── ChatGPTRelay.json        # ChatGPT responses (existing)
├── CopilotRelay.json        # Copilot responses (existing)
├── vsCodeContext.json       # NEW: Active file context
├── vsCodeActivity.json      # NEW: Activity logging
└── FileCommandResponse.json # NEW: File command results
```

---

## 📋 Usage Patterns

### **Pattern 1: Code Review & Improvement**

```
1. User: "/read src/components/UserProfile.js"
2. GPT: Analyzes code and suggests improvements
3. User: "Apply the security fixes you mentioned"
4. GPT: Provides improved code with fixes
5. Extension: Auto-applies changes to file
```

### **Pattern 2: Multi-file Refactoring**

```
1. User: "/read src/api/auth.js"
2. User: "/read src/components/Login.js"
3. User: "Refactor for better error handling"
4. GPT: Provides updates for both files
5. Extension: Applies changes to multiple files
```

### **Pattern 3: New Feature Development**

```
1. User: "/list src/components"
2. User: "Add dark mode support"
3. User: "/read src/styles/theme.js"
4. GPT: Provides theme updates + new components
5. Extension: Creates new files + updates existing ones
```

---

## 🔄 Destructive Overwrite Modes

### **Marker-Based Replacement**

```javascript
function oldFunction() {
  // existing code
}

// ERASE_AND_REPLACE_FROM_BELOW_THIS_LINE
// Everything below this marker gets replaced
```

### **Smart Function Replacement**

The extension intelligently replaces:

- Functions by name: `function myFunction()`
- Classes by name: `class MyClass`
- Constants: `const MY_CONSTANT = `
- Variables: `let myVariable = `

### **Safety Features**

- ✅ Git backup before changes
- ✅ User confirmation dialogs
- ✅ Change preview option
- ✅ Workspace sandboxing (files outside workspace are blocked)

---

## 🐛 Debugging & Logging

### **VS Code Output Channels**

View detailed logs in VS Code Output panel:

- **"Oboe Main"** - General extension activity
- **"Oboe File Ops"** - File read/write operations
- **"Oboe Routing"** - ChatGPT→Copilot routing
- **"Oboe Tests"** - Test execution results

### **Activity Logging**

All actions are logged to `relay_data/vsCodeActivity.json`:

```json
{
  "messages": [
    {
      "timestamp": "2025-01-28T12:00:00.000Z",
      "action": "file_read",
      "file": "src/auth.js",
      "size": 2048,
      "lines": 85
    }
  ]
}
```

### **Real-time Monitoring**

```bash
# Monitor file commands in real-time:
tail -f relay_data/FileCommandResponse.json

# Monitor activity:
tail -f relay_data/vsCodeActivity.json
```

---

## 🧪 Testing

### **Run Tests**

```bash
npm test
```

### **Test Coverage**

- File access bridge operations
- Command detection and routing
- Destructive overwrite logic
- Security sandboxing
- Error handling

### **Manual Testing**

1. Activate extension in Development Host
2. Use file commands in ChatGPT interface
3. Verify file operations in VS Code
4. Test auto-routing to Copilot
5. Test destructive overwrite with git backup

---

## 🔗 Integration with Existing System

### **Preserves Your Working Setup**

- ✅ Uses existing `relay_data/` JSON files
- ✅ Compatible with current Keyboard Maestro scripts
- ✅ Leverages proven userProxy pattern
- ✅ No changes to ChatGPT native Mac app needed

### **Enhanced Workflows**

- ✅ **Before**: Copy code → Paste in oboe tool → Copy response → Paste back
- ✅ **After**: `/read filename` → GPT responds → Auto-apply to file

---

## 🆚 **Native Mac Oboe vs Extension Bridge**

| Feature                   | Native Mac Oboe              | Extension Bridge                      |
| ------------------------- | ---------------------------- | ------------------------------------- |
| **File Reading**          | ❌ Limited/Manual            | ✅ `/read filename` command           |
| **File Writing**          | ❌ Copy/paste only           | ✅ Automatic destructive overwrite    |
| **Directory Browsing**    | ❌ Not available             | ✅ `/list directory` command          |
| **Multi-file Operations** | ❌ One at a time             | ✅ Multiple files in one conversation |
| **Code Context**          | ❌ Lost between interactions | ✅ Persistent in chat history         |
| **Auto-apply Changes**    | ❌ Manual copy/paste         | ✅ Automatic file updates             |
| **Integration**           | ❌ Separate tool             | ✅ Integrated with VS Code            |

---

## 📈 **What This Enables**

### **🔥 Game-Changing Capabilities**

- **File Access Through Web Interface**: ChatGPT can now read AND write files
- **Persistent Code Context**: Files remain accessible throughout conversation
- **Multi-file Workflows**: Read multiple files, get comprehensive refactoring
- **Zero Copy/Paste**: Complete automation from command to file changes
- **Git Integration**: Automatic backups and change tracking

### **🚀 **Real Workflow Impact\*\*

```typescript
// Before (10+ manual steps):
1. Copy code from VS Code
2. Open oboe tool
3. Paste code
4. Get response
5. Copy response
6. Return to VS Code
7. Paste and format
8. Repeat for each file...

// After (1 step):
User: "/read auth.js and login.js, then refactor for better security"
// → GPT sees both files, provides improvements, automatically applied
```

---

## 🎯 Status: ✅ **Production Ready**

The ChatGPT Oboe Bridge transforms your manual workflow into a fully automated VS Code extension while preserving everything that already works perfectly in your existing system.

### **Ready for Use:**

- ✅ Core file operations (`/read`, `/list`, `/write`)
- ✅ Auto-routing to Copilot
- ✅ Destructive overwrite with safety
- ✅ Real-time streaming integration
- ✅ Activity logging and debugging
- ✅ Integration testing suite

**Start using ChatGPT file commands immediately!** 🚀
