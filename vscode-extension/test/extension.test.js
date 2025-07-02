const assert = require("assert");
const vscode = require("vscode");
const path = require("path");
const fs = require("fs");

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Extension should be present", () => {
    assert.ok(vscode.extensions.getExtension("oboe-relay-extension"));
  });

  test("Extension should activate", async () => {
    const extension = vscode.extensions.getExtension("oboe-relay-extension");
    await extension.activate();
    assert.strictEqual(extension.isActive, true);
  });

  test("Commands should be registered", async () => {
    const commands = await vscode.commands.getCommands();
    const oboeCommands = commands.filter((cmd) => cmd.startsWith("oboe."));

    assert.ok(oboeCommands.includes("oboe.sendSelectionToAgent"));
    assert.ok(oboeCommands.includes("oboe.sendFileToAgent"));
    assert.ok(oboeCommands.includes("oboe.openChatPanel"));
    assert.ok(oboeCommands.includes("oboe.applyLatestResponse"));
    assert.ok(oboeCommands.includes("oboe.enableFileBridge"));
  });
});

suite("FileAccessBridge Test Suite", () => {
  const { FileAccessBridge } = require("../fileAccessBridge");
  let testWorkspace;
  let bridge;

  setup(() => {
    testWorkspace = path.join(__dirname, "test-workspace");
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }
    bridge = new FileAccessBridge(testWorkspace);
  });

  teardown(() => {
    // Clean up test files
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  test("Should create relay data directory", () => {
    assert.ok(fs.existsSync(path.join(testWorkspace, "relay_data")));
  });

  test("Should read file with /read command", async () => {
    const testFile = path.join(testWorkspace, "test.js");
    const testContent = 'console.log("Hello World");';
    fs.writeFileSync(testFile, testContent);

    const result = await bridge.processFileCommand("/read", ["test.js"]);

    assert.ok(result.includes(testContent));
    assert.ok(result.includes("📁 **test.js**"));
  });

  test("Should list directory with /list command", async () => {
    const testFile = path.join(testWorkspace, "sample.js");
    fs.writeFileSync(testFile, "test content");

    const result = await bridge.processFileCommand("/list", ["."]);

    assert.ok(result.includes("📂 **root**/"));
    assert.ok(result.includes("📄 sample.js"));
  });

  test("Should write file with /write command", async () => {
    const testContent = 'function newFunction() { return "test"; }';
    const result = await bridge.processFileCommand("/write", [
      "newfile.js",
      testContent,
    ]);

    assert.ok(result.includes("✅ **File written:** newfile.js"));

    const writtenContent = fs.readFileSync(
      path.join(testWorkspace, "newfile.js"),
      "utf8"
    );
    assert.strictEqual(writtenContent, testContent);
  });

  test("Should handle file not found error", async () => {
    const result = await bridge.processFileCommand("/read", ["nonexistent.js"]);
    assert.ok(result.includes("❌ Error executing /read"));
    assert.ok(result.includes("File not found"));
  });

  test("Should prevent access outside workspace", async () => {
    const result = await bridge.processFileCommand("/read", [
      "../../../etc/passwd",
    ]);
    assert.ok(result.includes("❌ Error executing /read"));
    assert.ok(result.includes("Access denied"));
  });
});

suite("ChatGPTRelayMonitor Test Suite", () => {
  const { ChatGPTRelayMonitor } = require("../chatgptRelayMonitor");
  const { FileAccessBridge } = require("../fileAccessBridge");
  let testWorkspace;
  let bridge;
  let monitor;

  setup(() => {
    testWorkspace = path.join(__dirname, "test-workspace-monitor");
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }
    bridge = new FileAccessBridge(testWorkspace);
    monitor = new ChatGPTRelayMonitor(testWorkspace, bridge);
  });

  teardown(() => {
    monitor.stop();
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  test("Should extract file commands from messages", () => {
    const message = "Please /read src/app.js and then /list components/";
    const commands = monitor.extractFileCommands(message);

    assert.strictEqual(commands.length, 2);
    assert.strictEqual(commands[0].command, "/read");
    assert.deepStrictEqual(commands[0].args, ["src/app.js"]);
    assert.strictEqual(commands[1].command, "/list");
    assert.deepStrictEqual(commands[1].args, ["components/"]);
  });

  test("Should detect code responses for routing to Copilot", () => {
    const codeMessage =
      "Here's the updated function:\n```javascript\nfunction test() {}\n```";
    const textMessage = "This is just a regular message";

    assert.strictEqual(monitor.shouldRouteToCopilot(codeMessage), true);
    assert.strictEqual(monitor.shouldRouteToCopilot(textMessage), false);
  });
});

suite("DestructiveOverwriteHandler Test Suite", () => {
  const {
    DestructiveOverwriteHandler,
  } = require("../destructiveOverwriteHandler");
  const { FileAccessBridge } = require("../fileAccessBridge");
  let testWorkspace;
  let bridge;
  let handler;

  setup(() => {
    testWorkspace = path.join(__dirname, "test-workspace-overwrite");
    if (!fs.existsSync(testWorkspace)) {
      fs.mkdirSync(testWorkspace, { recursive: true });
    }
    bridge = new FileAccessBridge(testWorkspace);
    handler = new DestructiveOverwriteHandler(testWorkspace, bridge);
  });

  teardown(() => {
    if (fs.existsSync(testWorkspace)) {
      fs.rmSync(testWorkspace, { recursive: true, force: true });
    }
  });

  test("Should generate preview content for overwrite data", () => {
    const overwriteData = {
      source: "ChatGPT",
      timestamp: "2023-01-01T00:00:00Z",
      codeBlocks: [
        { language: "javascript", code: 'function test() { return "hello"; }' },
      ],
    };

    const preview = handler.generatePreviewContent(overwriteData);

    assert.ok(preview.includes("# Code Changes Preview"));
    assert.ok(preview.includes("Source: ChatGPT"));
    assert.ok(preview.includes("```javascript"));
    assert.ok(preview.includes("function test()"));
  });

  test("Should replace function in code block", async () => {
    const originalContent =
      'function oldFunction() { return "old"; }\nother code here';
    const codeBlock = {
      language: "javascript",
      code: 'function oldFunction() { return "new"; }',
    };

    const result = await handler.replaceCodeBlock(
      originalContent,
      codeBlock,
      "test.js"
    );

    assert.ok(result.includes('return "new"'));
    assert.ok(result.includes("other code here"));
  });
});

// Integration test for the complete workflow
suite("Complete Workflow Integration Test", () => {
  test("File command workflow", async () => {
    // This would test the complete workflow:
    // 1. User types /read command in ChatGPT interface
    // 2. Extension detects command and processes it
    // 3. File content is injected back into ChatGPT relay
    // 4. GPT responds with code changes
    // 5. Extension detects code response and prepares overwrite
    // 6. User applies changes through VS Code command

    // This test would require mock VS Code environment and file system
    console.log("Complete workflow integration test would be implemented here");
    assert.ok(true, "Placeholder for complete workflow test");
  });
});
