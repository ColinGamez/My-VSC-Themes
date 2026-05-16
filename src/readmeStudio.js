const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { bestScript, packageRepositoryUrl, projectSnapshot, scriptCommand } = require("./project");

const README_STUDIO_VIEW_TYPE = "my-vsc-themes.readmeStudio";
let readmeStudioPanel;

function nonce() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";

  for (let index = 0; index < 32; index += 1) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function scriptData(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

function readTextIfExists(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  } catch {
    return "";
  }
}

function readmeFilePath(snapshot = projectSnapshot()) {
  return snapshot.root ? path.join(snapshot.root, snapshot.readme || "README.md") : "";
}

function extensionId(packageJson) {
  return packageJson?.publisher && packageJson?.name ? `${packageJson.publisher}.${packageJson.name}` : "";
}

function readmeStudioFeatureSeeds(snapshot) {
  const features = [];

  if (snapshot.projectTypes.includes("VS Code Extension")) {
    features.push("Command Palette workflows that stay inside VS Code");
  }

  if (snapshot.scripts.length) {
    features.push("Project scripts for build, test, packaging, and local development");
  }

  if (snapshot.projectTypes.includes("Theme Pack")) {
    features.push("Curated themes, previews, and editor polish for daily coding");
  }

  if (snapshot.projectTypes.includes("React") || snapshot.projectTypes.includes("Vite")) {
    features.push("Fast frontend development with a modern local workflow");
  }

  features.push("Clean documentation, support links, and a project roadmap");
  return [...new Set(features)].slice(0, 5);
}

function readmeStudioInstallCommand(snapshot) {
  if (snapshot.projectTypes.includes("VS Code Extension")) {
    const id = extensionId(snapshot.packageJson);
    return id ? `ext install ${id}` : "code --install-extension ./extension.vsix";
  }

  if (snapshot.packageManager === "pnpm") {
    return "pnpm install";
  }

  if (snapshot.packageManager === "yarn") {
    return "yarn install";
  }

  if (snapshot.packageManager === "bun") {
    return "bun install";
  }

  return snapshot.packageJson ? "npm install" : "";
}

function readmeStudioUsageCommand(snapshot) {
  const scriptName = bestScript(snapshot);
  return scriptName ? scriptCommand(snapshot.packageManager, scriptName) : "";
}

function readmeStudioState() {
  const snapshot = projectSnapshot();
  const readmePath = readmeFilePath(snapshot);
  const repoUrl = snapshot.git?.remoteUrl || packageRepositoryUrl(snapshot.packageJson);
  const id = extensionId(snapshot.packageJson);

  return {
    hasWorkspace: Boolean(snapshot.root),
    projectName: snapshot.name || "My Project",
    projectTypes: snapshot.projectTypes || [],
    packageManager: snapshot.packageManager || "npm",
    repoUrl,
    extensionId: id,
    marketplaceUrl: id ? `https://marketplace.visualstudio.com/items?itemName=${id}` : "",
    existingReadme: readTextIfExists(readmePath),
    readmeExists: Boolean(readmePath && fs.existsSync(readmePath)),
    readmeRelativePath: snapshot.readme || "README.md",
    installCommand: readmeStudioInstallCommand(snapshot),
    usageCommand: readmeStudioUsageCommand(snapshot),
    features: readmeStudioFeatureSeeds(snapshot),
    scripts: snapshot.scripts || [],
    health: snapshot.health || { ok: 0, total: 0, checks: [] }
  };
}

async function saveReadmeFromStudio(markdown) {
  const snapshot = projectSnapshot();

  if (!snapshot.root) {
    vscode.window.showWarningMessage("README Studio needs an open workspace before it can save.");
    return;
  }

  const normalizedMarkdown = String(markdown ?? "").trimEnd();

  if (!normalizedMarkdown) {
    vscode.window.showWarningMessage("README Studio cannot save an empty README.");
    return;
  }

  const filePath = path.join(snapshot.root, "README.md");
  const exists = fs.existsSync(filePath);
  const action = await vscode.window.showWarningMessage(
    `${exists ? "Overwrite" : "Create"} README.md with the README Studio draft?`,
    { modal: false },
    exists ? "Overwrite" : "Create"
  );

  if (!action) {
    return;
  }

  await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(`${normalizedMarkdown}\n`, "utf8"));
  vscode.window.showInformationMessage("README Studio: README.md saved.");
}

async function openReadmeStudio() {
  const state = readmeStudioState();

  if (!state.hasWorkspace) {
    vscode.window.showWarningMessage("Open a folder first, then launch README Studio.");
    return;
  }

  if (readmeStudioPanel) {
    readmeStudioPanel.reveal(vscode.ViewColumn.One);
    readmeStudioPanel.webview.postMessage({ type: "context", state });
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    README_STUDIO_VIEW_TYPE,
    "README Studio",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );
  readmeStudioPanel = panel;
  panel.onDidDispose(() => {
    readmeStudioPanel = undefined;
  });
  const token = nonce();
  panel.webview.html = readmeStudioHtml(panel.webview, token, state);

  panel.webview.onDidReceiveMessage(async (message) => {
    if (message?.type === "saveReadme") {
      await saveReadmeFromStudio(String(message.markdown ?? ""));
      panel.webview.postMessage({ type: "context", state: readmeStudioState() });
      return;
    }

    if (message?.type === "copyMarkdown") {
      await vscode.env.clipboard.writeText(String(message.markdown ?? ""));
      vscode.window.showInformationMessage("README Studio: Markdown copied.");
      return;
    }

    if (message?.type === "openReadme") {
      const snapshot = projectSnapshot();
      const filePath = readmeFilePath(snapshot);

      if (filePath && fs.existsSync(filePath)) {
        await vscode.window.showTextDocument(vscode.Uri.file(filePath));
      } else {
        vscode.window.showInformationMessage("README Studio: README.md does not exist yet.");
      }
      return;
    }

    if (message?.type === "refreshContext") {
      panel.webview.postMessage({ type: "context", state: readmeStudioState() });
    }
  });
}

function readmeStudioHtml(webview, token, state) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${token}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>README Studio</title>
  <style>
    :root {
      --bg: #130604;
      --panel: #20100b;
      --panel-2: #2b140c;
      --line: #5a2b16;
      --text: #ffe8cf;
      --muted: #c79269;
      --accent: #ff8a2a;
      --accent-2: #ffd166;
      --good: #7ee787;
      --shadow: rgba(0, 0, 0, 0.34);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background: var(--bg);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
    }

    button, input, textarea, select {
      font: inherit;
    }

    .shell {
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 18px;
      border-bottom: 1px solid var(--line);
      background: #180804;
    }

    .brand {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .brand h1 {
      margin: 0;
      font-size: 20px;
      line-height: 1.1;
      font-weight: 800;
      color: var(--accent-2);
    }

    .brand span {
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    button {
      border: 1px solid var(--line);
      color: var(--text);
      background: var(--panel);
      min-height: 32px;
      padding: 0 11px;
      border-radius: 6px;
      cursor: pointer;
    }

    button.primary {
      border-color: #ff9d44;
      background: #b64d12;
      color: #fff9ef;
      font-weight: 700;
    }

    button:hover {
      border-color: var(--accent);
      background: #35170d;
    }

    .workspace {
      display: grid;
      grid-template-columns: minmax(300px, 360px) minmax(0, 1fr) minmax(320px, 45%);
      min-height: 0;
    }

    .builder,
    .markdown,
    .preview-wrap {
      min-height: 0;
      padding: 16px;
      overflow: auto;
    }

    .builder {
      border-right: 1px solid var(--line);
      background: #170805;
    }

    .markdown {
      border-right: 1px solid var(--line);
      background: #100403;
    }

    .preview-wrap {
      background: #1a0804;
    }

    .section {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 138, 42, 0.18);
    }

    .section h2 {
      margin: 0 0 10px;
      font-size: 12px;
      line-height: 1.2;
      color: var(--accent-2);
      text-transform: uppercase;
    }

    label {
      display: grid;
      gap: 6px;
      margin-bottom: 10px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.25;
    }

    input,
    textarea,
    select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      color: var(--text);
      background: var(--panel);
      padding: 8px 9px;
      outline: none;
    }

    textarea {
      resize: vertical;
      min-height: 74px;
      line-height: 1.45;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 1px rgba(255, 138, 42, 0.25);
    }

    .check-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      color: var(--text);
    }

    .check-row input {
      width: auto;
    }

    .mini-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .stat {
      border: 1px solid var(--line);
      background: var(--panel);
      border-radius: 6px;
      padding: 9px;
    }

    .stat strong {
      display: block;
      color: var(--accent-2);
      margin-bottom: 3px;
    }

    #markdown {
      width: 100%;
      min-height: calc(100vh - 108px);
      resize: none;
      color: #ffe8cf;
      background: #0d0302;
      border-color: #3e1c0e;
      font-family: var(--vscode-editor-font-family);
      line-height: 1.5;
    }

    .preview {
      max-width: 850px;
      margin: 0 auto;
      padding: 20px;
      color: #f7e8d7;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 14px 32px var(--shadow);
    }

    .preview h1,
    .preview h2,
    .preview h3 {
      color: #ffd166;
      line-height: 1.15;
    }

    .preview h1 {
      font-size: 30px;
      margin-top: 0;
    }

    .preview h2 {
      margin-top: 26px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 138, 42, 0.22);
    }

    .preview p,
    .preview li {
      line-height: 1.58;
    }

    .preview strong {
      color: #fff6e8;
    }

    .preview code {
      color: #ffd166;
      background: #120503;
      border: 1px solid rgba(255, 138, 42, 0.18);
      border-radius: 4px;
      padding: 2px 4px;
    }

    .preview pre {
      overflow: auto;
      padding: 12px;
      background: #0e0302;
      border: 1px solid rgba(255, 138, 42, 0.2);
      border-radius: 6px;
    }

    .preview img {
      max-width: 100%;
      height: auto;
      vertical-align: middle;
      border-radius: 6px;
    }

    .preview table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      overflow: hidden;
      border: 1px solid rgba(255, 138, 42, 0.24);
      border-radius: 6px;
    }

    .preview th,
    .preview td {
      padding: 8px 10px;
      border-bottom: 1px solid rgba(255, 138, 42, 0.16);
      text-align: left;
      vertical-align: top;
    }

    .preview th {
      color: #ffd166;
      background: #170805;
    }

    .preview blockquote {
      margin: 14px 0;
      padding: 8px 12px;
      border-left: 3px solid var(--accent);
      color: var(--muted);
      background: #180804;
    }

    .preview a {
      color: #ffb86b;
    }

    .empty {
      color: var(--muted);
      padding: 20px;
      border: 1px dashed var(--line);
      border-radius: 6px;
    }

    @media (max-width: 980px) {
      .workspace {
        grid-template-columns: 1fr;
      }

      .builder,
      .markdown {
        border-right: 0;
        border-bottom: 1px solid var(--line);
      }

      #markdown {
        min-height: 420px;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <h1>README Studio</h1>
        <span id="contextLine">${escapeHtml(state.projectName)} · ${escapeHtml(state.projectTypes.join(" / "))}</span>
      </div>
      <div class="actions">
        <button id="useExisting">Use Existing</button>
        <button id="copyMarkdown">Copy</button>
        <button id="openReadme">Open README</button>
        <button id="saveReadme" class="primary">Save README</button>
      </div>
    </header>

    <main class="workspace">
      <aside class="builder">
        <section class="section">
          <h2>Project</h2>
          <label>Title<input id="title" /></label>
          <label>Tagline<input id="tagline" /></label>
          <label>Description<textarea id="description"></textarea></label>
        </section>

        <section class="section">
          <h2>Badges</h2>
          <div class="check-row"><input id="badgeMarketplace" type="checkbox" /><span>Marketplace version and installs</span></div>
          <div class="check-row"><input id="badgeRelease" type="checkbox" /><span>GitHub release</span></div>
          <div class="check-row"><input id="badgeLicense" type="checkbox" checked /><span>License</span></div>
        </section>

        <section class="section">
          <h2>Content</h2>
          <label>Features<textarea id="features"></textarea></label>
          <label>Install command<input id="installCommand" /></label>
          <label>Usage command<input id="usageCommand" /></label>
          <label>Screenshot path<input id="screenshotPath" /></label>
        </section>

        <section class="section">
          <h2>Sections</h2>
          <div class="check-row"><input id="includeCommands" type="checkbox" checked /><span>Commands or scripts</span></div>
          <div class="check-row"><input id="includeSupport" type="checkbox" checked /><span>Support links</span></div>
          <div class="check-row"><input id="includeRoadmap" type="checkbox" checked /><span>Roadmap</span></div>
        </section>

        <section class="section">
          <h2>Workspace</h2>
          <div class="mini-grid">
            <div class="stat"><strong id="scriptCount">0</strong><span>scripts</span></div>
            <div class="stat"><strong id="healthScore">0/0</strong><span>health</span></div>
          </div>
        </section>
      </aside>

      <section class="markdown">
        <textarea id="markdown" spellcheck="false"></textarea>
      </section>

      <section class="preview-wrap">
        <article id="preview" class="preview"></article>
      </section>
    </main>
  </div>

  <script nonce="${token}">
    const vscode = acquireVsCodeApi();
    let context = ${scriptData(state)};

    const fields = [
      "title",
      "tagline",
      "description",
      "features",
      "installCommand",
      "usageCommand",
      "screenshotPath",
      "badgeMarketplace",
      "badgeRelease",
      "badgeLicense",
      "includeCommands",
      "includeSupport",
      "includeRoadmap"
    ];
    const el = (id) => document.getElementById(id);

    function escapeHtml(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function lines(value) {
      return String(value || "")
        .split(/\\r?\\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }

    function safeUrl(value) {
      const url = String(value || "").trim();

      if (/^(https?:|data:image\\/|\\.\\/|\\.\\.\\/|\\/|assets\\/|docs\\/|[A-Za-z0-9_./#?=&%-]+$)/.test(url)) {
        return escapeHtml(url);
      }

      return "#";
    }

    function inlineMarkdown(value) {
      let html = escapeHtml(value);
      html = html.replace(/\\[!\\[([^\\]]*)\\]\\(([^)]+)\\)\\]\\(([^)]+)\\)/g, (_match, alt, src, href) => {
        return '<a href="' + safeUrl(href) + '"><img alt="' + alt + '" src="' + safeUrl(src) + '"></a>';
      });
      html = html.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, (_match, alt, src) => {
        return '<img alt="' + alt + '" src="' + safeUrl(src) + '">';
      });
      html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, (_match, text, href) => {
        return '<a href="' + safeUrl(href) + '">' + text + '</a>';
      });
      html = html.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
      html = html.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
      return html;
    }

    function badgeLines() {
      const badges = [];

      if (el("badgeMarketplace").checked && context.extensionId) {
        badges.push("[![Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/" + context.extensionId + "?color=ff8a2a)](" + context.marketplaceUrl + ")");
        badges.push("[![Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/" + context.extensionId + "?color=ffd166)](" + context.marketplaceUrl + ")");
      }

      if (el("badgeRelease").checked && context.repoUrl) {
        const repo = context.repoUrl.replace("https://github.com/", "");
        badges.push("[![GitHub Release](https://img.shields.io/github/v/release/" + repo + "?color=ff8a2a)](" + context.repoUrl + "/releases)");
      }

      if (el("badgeLicense").checked) {
        badges.push("[![License: MIT](https://img.shields.io/badge/license-MIT-ff8a2a.svg)](LICENSE)");
      }

      return badges.length ? badges.join(" ") + "\\n\\n" : "";
    }

    function projectScriptCommand(script) {
      if (context.packageManager === "pnpm") return "pnpm run " + script;
      if (context.packageManager === "yarn") return "yarn " + script;
      if (context.packageManager === "bun") return "bun run " + script;
      return "npm run " + script;
    }

    function commandLines() {
      if (!el("includeCommands").checked || !context.scripts.length) {
        return "";
      }

      const rows = context.scripts.slice(0, 8).map((script) => "| \`" + script + "\` | \`" + projectScriptCommand(script) + "\` |");
      return "## Commands\\n\\n| Script | Command |\\n| --- | --- |\\n" + rows.join("\\n") + "\\n\\n";
    }

    function generateMarkdown() {
      const title = el("title").value.trim() || context.projectName || "My Project";
      const tagline = el("tagline").value.trim();
      const description = el("description").value.trim();
      const featureList = lines(el("features").value);
      const install = el("installCommand").value.trim();
      const usage = el("usageCommand").value.trim();
      const screenshot = el("screenshotPath").value.trim();
      let markdown = "# " + title + "\\n\\n";

      markdown += badgeLines();

      if (tagline) {
        markdown += "**" + tagline + "**\\n\\n";
      }

      if (description) {
        markdown += description + "\\n\\n";
      }

      if (screenshot) {
        markdown += "![Project screenshot](" + screenshot + ")\\n\\n";
      }

      if (featureList.length) {
        markdown += "## Features\\n\\n" + featureList.map((item) => "- " + item).join("\\n") + "\\n\\n";
      }

      if (install) {
        markdown += "## Install\\n\\n\`\`\`sh\\n" + install + "\\n\`\`\`\\n\\n";
      }

      if (usage) {
        markdown += "## Usage\\n\\n\`\`\`sh\\n" + usage + "\\n\`\`\`\\n\\n";
      }

      markdown += commandLines();

      if (el("includeSupport").checked) {
        markdown += "## Support\\n\\n";
        if (context.repoUrl) {
          markdown += "- Open an issue: " + context.repoUrl + "/issues\\n";
        }
        if (context.marketplaceUrl) {
          markdown += "- Marketplace: " + context.marketplaceUrl + "\\n";
        }
        markdown += "\\n";
      }

      if (el("includeRoadmap").checked) {
        markdown += "## Roadmap\\n\\n- Improve the core workflow.\\n- Polish docs and screenshots.\\n- Ship focused releases based on real usage.\\n";
      }

      return markdown.trim() + "\\n";
    }

    function markdownToHtml(markdown) {
      const blocks = String(markdown || "").split(/\\n{2,}/).map((rawBlock) => {
        const block = rawBlock.trim();
        const blockLines = block.split("\\n");

        if (!block) return "";
        if (block.startsWith("# ")) return "<h1>" + inlineMarkdown(block.slice(2)) + "</h1>";
        if (block.startsWith("## ")) return "<h2>" + inlineMarkdown(block.slice(3)) + "</h2>";
        if (block.startsWith("### ")) return "<h3>" + inlineMarkdown(block.slice(4)) + "</h3>";
        if (block.startsWith("\`\`\`")) {
          return "<pre><code>" + escapeHtml(block.replace(/^\`\`\`\\w*\\n?/, "").replace(/\`\`\`$/, "")) + "</code></pre>";
        }
        if (blockLines.every((line) => line.startsWith("- "))) {
          const items = blockLines.map((line) => "<li>" + inlineMarkdown(line.slice(2)) + "</li>");
          return "<ul>" + items.join("") + "</ul>";
        }
        if (block.startsWith("|")) {
          const rows = blockLines.filter((line) => !/^\\|\\s*-/.test(line)).map((line, index) => {
            const tag = index === 0 ? "th" : "td";
            const cells = line.split("|").slice(1, -1).map((cell) => "<" + tag + ">" + inlineMarkdown(cell.trim()) + "</" + tag + ">");
            return "<tr>" + cells.join("") + "</tr>";
          });
          return "<table>" + rows.join("") + "</table>";
        }
        if (block.startsWith("> ")) {
          return "<blockquote>" + inlineMarkdown(block.replace(/^>\\s?/gm, "")) + "</blockquote>";
        }

        return "<p>" + inlineMarkdown(block).replace(/\\n/g, "<br>") + "</p>";
      });

      return blocks.join("");
    }

    function refreshPreview() {
      el("preview").innerHTML = markdownToHtml(el("markdown").value) || '<div class="empty">Start building your README.</div>';
    }

    function syncGenerated() {
      el("markdown").value = generateMarkdown();
      refreshPreview();
    }

    function hydrate(nextContext) {
      context = nextContext;
      el("contextLine").textContent = context.projectName + " · " + (context.projectTypes || []).join(" / ");
      el("title").value = context.projectName || "My Project";
      el("tagline").value = context.projectTypes.includes("VS Code Extension") ? "A polished VS Code extension built for fast daily workflows." : "A polished project built for fast daily workflows.";
      el("description").value = context.existingReadme ? "" : "Describe what this project does, who it helps, and why it is worth using.";
      el("features").value = (context.features || []).join("\\n");
      el("installCommand").value = context.installCommand || "";
      el("usageCommand").value = context.usageCommand || "";
      el("screenshotPath").value = context.projectTypes.includes("VS Code Extension") ? "assets/screenshots/example.png" : "";
      el("badgeMarketplace").checked = Boolean(context.extensionId);
      el("badgeRelease").checked = Boolean(context.repoUrl);
      el("scriptCount").textContent = String((context.scripts || []).length);
      el("healthScore").textContent = (context.health?.ok || 0) + "/" + (context.health?.total || 0);
      syncGenerated();
    }

    fields.forEach((id) => {
      el(id).addEventListener("input", syncGenerated);
      el(id).addEventListener("change", syncGenerated);
    });
    el("markdown").addEventListener("input", refreshPreview);
    el("useExisting").addEventListener("click", () => {
      if (context.existingReadme) {
        el("markdown").value = context.existingReadme;
        refreshPreview();
      }
    });
    el("copyMarkdown").addEventListener("click", () => vscode.postMessage({ type: "copyMarkdown", markdown: el("markdown").value }));
    el("openReadme").addEventListener("click", () => vscode.postMessage({ type: "openReadme" }));
    el("saveReadme").addEventListener("click", () => vscode.postMessage({ type: "saveReadme", markdown: el("markdown").value }));
    window.addEventListener("message", (event) => {
      if (event.data?.type === "context") {
        hydrate(event.data.state);
      }
    });

    hydrate(context);
  </script>
</body>
</html>`;
}

function registerReadmeStudio(context) {
  context.subscriptions.push(vscode.commands.registerCommand("my-vsc-themes.readmeStudio.open", openReadmeStudio));
}

module.exports = { registerReadmeStudio };
