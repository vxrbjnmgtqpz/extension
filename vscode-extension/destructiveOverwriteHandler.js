const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

class DestructiveOverwriteHandler {
  constructor(workspaceRoot, fileAccessBridge) {
    this.workspaceRoot = workspaceRoot;
    this.relayDataPath = path.join(workspaceRoot, "relay_data");
    this.fileAccessBridge = fileAccessBridge;
  }

  async applyLatestResponse() {
    try {
      // Check for pending overwrite data
      const overwritePath = path.join(
        this.relayDataPath,
        "PendingOverwrite.json"
      );

      if (!fs.existsSync(overwritePath)) {
        vscode.window.showWarningMessage("No pending code changes to apply");
        return;
      }

      const overwriteData = JSON.parse(fs.readFileSync(overwritePath, "utf8"));

      if (!overwriteData.readyForApplication) {
        vscode.window.showWarningMessage("No ready code changes found");
        return;
      }

      // Find target file from VS Code context or current editor
      const activeEditor = vscode.window.activeTextEditor;
      if (!activeEditor) {
        vscode.window.showErrorMessage("No active editor to apply changes to");
        return;
      }

      const targetFile = activeEditor.document.uri.fsPath;
      const relativePath = path.relative(this.workspaceRoot, targetFile);

      // Apply the overwrite
      await this.applyOverwriteToFile(targetFile, overwriteData);

      // Log the activity
      this.fileAccessBridge.logActivity("destructive_overwrite_applied", {
        file: relativePath,
        source: overwriteData.source,
        codeBlocksApplied: overwriteData.codeBlocks.length,
      });

      // Clean up pending overwrite
      fs.unlinkSync(overwritePath);

      vscode.window.showInformationMessage(
        `✅ Applied ${overwriteData.codeBlocks.length} code changes to ${relativePath}`
      );
    } catch (error) {
      console.error("❌ Error applying latest response:", error);
      vscode.window.showErrorMessage(
        `Error applying changes: ${error.message}`
      );
    }
  }

  async applyOverwriteToFile(targetFile, overwriteData) {
    const content = fs.readFileSync(targetFile, "utf8");
    const lines = content.split("\n");

    // Look for overwrite marker
    const markerIndex = lines.findIndex((line) =>
      line.includes("ERASE_AND_REPLACE_FROM_BELOW_THIS_LINE")
    );

    if (markerIndex !== -1) {
      // Destructive overwrite: replace everything below marker
      await this.applyMarkerBasedOverwrite(
        targetFile,
        lines,
        markerIndex,
        overwriteData
      );
    } else {
      // Smart overwrite: try to replace relevant functions/classes
      await this.applySmartOverwrite(targetFile, content, overwriteData);
    }
  }

  async applyMarkerBasedOverwrite(
    targetFile,
    lines,
    markerIndex,
    overwriteData
  ) {
    // Keep everything above the marker
    const beforeMarker = lines.slice(0, markerIndex + 1);

    // Add the new code from the first code block
    const newCode = overwriteData.codeBlocks[0]?.code || "";
    const newCodeLines = newCode.split("\n");

    // Combine: before marker + blank line + new code
    const newContent = [
      ...beforeMarker,
      "", // blank line after marker
      ...newCodeLines,
    ].join("\n");

    fs.writeFileSync(targetFile, newContent, "utf8");

    const relativePath = path.relative(this.workspaceRoot, targetFile);
    console.log(`🔄 Applied marker-based overwrite to ${relativePath}`);
  }

  async applySmartOverwrite(targetFile, content, overwriteData) {
    let updatedContent = content;

    // Try to replace each code block intelligently
    for (const codeBlock of overwriteData.codeBlocks) {
      updatedContent = await this.replaceCodeBlock(
        updatedContent,
        codeBlock,
        targetFile
      );
    }

    fs.writeFileSync(targetFile, updatedContent, "utf8");

    const relativePath = path.relative(this.workspaceRoot, targetFile);
    console.log(`🔄 Applied smart overwrite to ${relativePath}`);
  }

  async replaceCodeBlock(content, codeBlock, targetFile) {
    const code = codeBlock.code;
    const language = codeBlock.language;

    // Extract function/class names to find what to replace
    const functionMatch = code.match(/function\s+(\w+)/);
    const classMatch = code.match(/class\s+(\w+)/);
    const constMatch = code.match(/const\s+(\w+)/);
    const letMatch = code.match(/let\s+(\w+)/);

    let targetName = null;
    let targetPattern = null;

    if (functionMatch) {
      targetName = functionMatch[1];
      targetPattern = new RegExp(
        `function\\s+${targetName}\\s*\\([^}]*\\}`,
        "gs"
      );
    } else if (classMatch) {
      targetName = classMatch[1];
      targetPattern = new RegExp(`class\\s+${targetName}\\s*\\{[^}]*\\}`, "gs");
    } else if (constMatch) {
      targetName = constMatch[1];
      targetPattern = new RegExp(`const\\s+${targetName}\\s*=[^;]*;`, "gs");
    } else if (letMatch) {
      targetName = letMatch[1];
      targetPattern = new RegExp(`let\\s+${targetName}\\s*=[^;]*;`, "gs");
    }

    if (targetPattern && content.match(targetPattern)) {
      // Replace the existing declaration
      const updatedContent = content.replace(targetPattern, code);
      console.log(`🔄 Replaced ${targetName} in file`);
      return updatedContent;
    } else {
      // Append the new code at the end
      console.log(`➕ Appended new code block to file`);
      return content + "\n\n" + code;
    }
  }

  async createGitBackup(
    message = "VS Code extension auto-backup before code changes"
  ) {
    try {
      // Stage all changes
      const { execSync } = require("child_process");
      execSync("git add .", { cwd: this.workspaceRoot });

      // Create commit
      execSync(`git commit -m "${message}"`, { cwd: this.workspaceRoot });

      console.log("💾 Created git backup before applying changes");
      return true;
    } catch (error) {
      console.log("📝 No git backup created (no changes or git not available)");
      return false;
    }
  }

  async showChangePreview(overwriteData) {
    // Create a diff preview in a new document
    const previewContent = this.generatePreviewContent(overwriteData);

    const doc = await vscode.workspace.openTextDocument({
      content: previewContent,
      language: "diff",
    });

    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
  }

  generatePreviewContent(overwriteData) {
    let preview = `# Code Changes Preview\n\n`;
    preview += `Source: ${overwriteData.source}\n`;
    preview += `Timestamp: ${overwriteData.timestamp}\n\n`;

    overwriteData.codeBlocks.forEach((block, index) => {
      preview += `## Code Block ${index + 1} (${block.language})\n\n`;
      preview += "```" + block.language + "\n";
      preview += block.code + "\n";
      preview += "```\n\n";
    });

    return preview;
  }

  async promptForConfirmation(overwriteData) {
    const message = `Apply ${overwriteData.codeBlocks.length} code changes from ${overwriteData.source}?`;
    const options = ["Apply Changes", "Preview First", "Cancel"];

    const choice = await vscode.window.showWarningMessage(message, ...options);

    if (choice === "Preview First") {
      await this.showChangePreview(overwriteData);
      return (
        (await vscode.window.showWarningMessage(
          "Apply changes after preview?",
          "Apply",
          "Cancel"
        )) === "Apply"
      );
    }

    return choice === "Apply Changes";
  }

  async applyWithConfirmation() {
    try {
      const overwritePath = path.join(
        this.relayDataPath,
        "PendingOverwrite.json"
      );

      if (!fs.existsSync(overwritePath)) {
        vscode.window.showWarningMessage("No pending code changes to apply");
        return;
      }

      const overwriteData = JSON.parse(fs.readFileSync(overwritePath, "utf8"));

      // Show confirmation dialog
      const confirmed = await this.promptForConfirmation(overwriteData);
      if (!confirmed) {
        vscode.window.showInformationMessage("Code changes cancelled by user");
        return;
      }

      // Create git backup before applying
      await this.createGitBackup(
        "Auto-backup before VS Code extension code changes"
      );

      // Apply the changes
      await this.applyLatestResponse();
    } catch (error) {
      console.error("❌ Error in applyWithConfirmation:", error);
      vscode.window.showErrorMessage(`Error: ${error.message}`);
    }
  }
}

module.exports = { DestructiveOverwriteHandler };
