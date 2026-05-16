const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { projectSnapshot, scriptCommand, workspaceRoot } = require("./project");

const LAUNCH_PAD_VIEW_TYPE = "my-vsc-themes.launchPad";
const LAUNCH_PAD_FILE = ".vscode/colins-launch-pad.json";
let launchPadPanel;

function nonce() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let value = "";

  for (let index = 0; index < 32; index += 1) {
    value += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return value;
}

function scriptData(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function launchPadFilePath(root = workspaceRoot()) {
  return root ? path.join(root, LAUNCH_PAD_FILE) : undefined;
}

function safeSlug(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "item";
}

function defaultLaunchPadConfig() {
  return {
    pinned: [],
    custom: []
  };
}

function normalizeCustomItem(item) {
  if (!item || typeof item !== "object") {
    return undefined;
  }

  const label = String(item.label ?? "").trim();
  const type = String(item.type ?? "").trim();
  const target = String(item.target ?? "").trim();

  if (!label || !target || !["url", "terminal", "file", "command"].includes(type)) {
    return undefined;
  }

  return {
    id: String(item.id || `custom:${type}:${safeSlug(label)}:${Date.now().toString(36)}`),
    label,
    type,
    target,
    detail: String(item.detail ?? "").trim(),
    group: "Custom",
    custom: true
  };
}

function normalizeLaunchPadConfig(raw) {
  const pinned = Array.isArray(raw?.pinned)
    ? raw.pinned.filter((id) => typeof id === "string" && id.trim())
    : [];
  const custom = Array.isArray(raw?.custom)
    ? raw.custom.map(normalizeCustomItem).filter(Boolean)
    : [];

  return {
    pinned: [...new Set(pinned)],
    custom
  };
}

function readLaunchPadConfig(root = workspaceRoot()) {
  const filePath = launchPadFilePath(root);

  if (!filePath || !fs.existsSync(filePath)) {
    return defaultLaunchPadConfig();
  }

  try {
    return normalizeLaunchPadConfig(JSON.parse(fs.readFileSync(filePath, "utf8")));
  } catch {
    return defaultLaunchPadConfig();
  }
}

async function writeLaunchPadConfig(config, root = workspaceRoot()) {
  const filePath = launchPadFilePath(root);

  if (!filePath) {
    vscode.window.showWarningMessage("Launch Pad needs an open workspace before it can save favorites.");
    return false;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const normalized = normalizeLaunchPadConfig(config);
  await vscode.workspace.fs.writeFile(
    vscode.Uri.file(filePath),
    Buffer.from(`${JSON.stringify(normalized, null, 2)}\n`, "utf8")
  );
  return true;
}

function launchPadItem({ id, label, type, target, detail, group, badge, custom = false }) {
  return {
    id,
    label,
    type,
    target,
    detail: detail || "",
    group,
    badge: badge || type,
    custom
  };
}

function builtInLaunchPadItems(snapshot) {
  const items = [];

  items.push(
    launchPadItem({
      id: "command:my-vsc-themes.readmeStudio.open",
      label: "README Studio",
      type: "command",
      target: "my-vsc-themes.readmeStudio.open",
      detail: "Build or polish README.md",
      group: "Suite",
      badge: "docs"
    }),
    launchPadItem({
      id: "command:my-vsc-themes.snippetForge.createFromSelection",
      label: "Snippet Forge",
      type: "command",
      target: "my-vsc-themes.snippetForge.createFromSelection",
      detail: "Turn selected code into a snippet",
      group: "Suite",
      badge: "snippet"
    }),
    launchPadItem({
      id: "command:my-vsc-themes.commandCenter.open",
      label: "Project Command Center",
      type: "command",
      target: "my-vsc-themes.commandCenter.open",
      detail: "Open the sidebar dashboard",
      group: "Suite",
      badge: "suite"
    }),
    launchPadItem({
      id: "command:my-vsc-themes.applyThemeReactorNow",
      label: "Apply Theme Reactor",
      type: "command",
      target: "my-vsc-themes.applyThemeReactorNow",
      detail: "Switch to the current reactor pick",
      group: "Suite",
      badge: "theme"
    })
  );

  if (!snapshot.root) {
    items.push(
      launchPadItem({
        id: "command:workbench.action.files.openFolder",
        label: "Open Folder",
        type: "command",
        target: "workbench.action.files.openFolder",
        detail: "Choose a workspace",
        group: "Workspace",
        badge: "folder"
      })
    );
    return items;
  }

  items.push(
    launchPadItem({
      id: "terminal:workspace",
      label: "Terminal Here",
      type: "terminal",
      target: "",
      detail: path.basename(snapshot.root),
      group: "Workspace",
      badge: "terminal"
    }),
    launchPadItem({
      id: "file:launch-pad-config",
      label: "Launch Pad Config",
      type: "file",
      target: LAUNCH_PAD_FILE,
      detail: LAUNCH_PAD_FILE,
      group: "Workspace",
      badge: "json"
    }),
    launchPadItem({
      id: "command:my-vsc-themes.commandCenter.createMissingBasics",
      label: "Create Missing Basics",
      type: "command",
      target: "my-vsc-themes.commandCenter.createMissingBasics",
      detail: "README.md and .gitignore starter files",
      group: "Workspace",
      badge: "fix"
    })
  );

  if (snapshot.readme) {
    items.push(
      launchPadItem({
        id: `file:${snapshot.readme}`,
        label: "README",
        type: "file",
        target: snapshot.readme,
        detail: snapshot.readme,
        group: "Workspace",
        badge: "md"
      })
    );
  }

  if (snapshot.git?.remoteUrl) {
    items.push(
      launchPadItem({
        id: "url:repository",
        label: "Repository",
        type: "url",
        target: snapshot.git.remoteUrl,
        detail: snapshot.git.branch || "remote",
        group: "Workspace",
        badge: "git"
      })
    );
  }

  for (const scriptName of snapshot.scripts || []) {
    items.push(
      launchPadItem({
        id: `script:${scriptName}`,
        label: scriptName,
        type: "script",
        target: scriptName,
        detail: scriptCommand(snapshot.packageManager, scriptName),
        group: "Scripts",
        badge: snapshot.packageManager
      })
    );
  }

  return items;
}

function launchPadState() {
  const snapshot = projectSnapshot();
  const config = readLaunchPadConfig(snapshot.root);
  const pinned = new Set(config.pinned);
  const items = [...builtInLaunchPadItems(snapshot), ...config.custom].map((item) => ({
    ...item,
    pinned: pinned.has(item.id)
  }));

  return {
    hasWorkspace: Boolean(snapshot.root),
    projectName: snapshot.name || "No Workspace",
    projectTypes: snapshot.projectTypes || [],
    rootName: snapshot.root ? path.basename(snapshot.root) : "",
    scriptCount: snapshot.scripts?.length || 0,
    pinnedCount: items.filter((item) => item.pinned).length,
    customCount: config.custom.length,
    items
  };
}

function postLaunchPadState() {
  if (launchPadPanel) {
    launchPadPanel.webview.postMessage({ type: "state", state: launchPadState() });
  }
}

async function togglePinned(itemId) {
  const snapshot = projectSnapshot();
  const config = readLaunchPadConfig(snapshot.root);
  const pinned = new Set(config.pinned);

  if (pinned.has(itemId)) {
    pinned.delete(itemId);
  } else {
    pinned.add(itemId);
  }

  const saved = await writeLaunchPadConfig({ ...config, pinned: [...pinned] }, snapshot.root);

  if (saved) {
    postLaunchPadState();
  }
}

async function openLaunchPadConfig() {
  const root = workspaceRoot();
  const filePath = launchPadFilePath(root);

  if (!root || !filePath) {
    vscode.window.showWarningMessage("Launch Pad needs an open workspace before it can open its config.");
    return;
  }

  if (!fs.existsSync(filePath)) {
    await writeLaunchPadConfig(defaultLaunchPadConfig(), root);
  }

  await vscode.window.showTextDocument(vscode.Uri.file(filePath));
}

async function addCustomLaunchPadItem(type) {
  const root = workspaceRoot();

  if (!root) {
    vscode.window.showWarningMessage("Launch Pad needs an open workspace before it can save custom items.");
    return;
  }

  const label = await vscode.window.showInputBox({
    title: "Launch Pad",
    prompt: type === "url" ? "Link label" : "Terminal action label",
    validateInput: (value) => (value.trim() ? undefined : "A label is required.")
  });

  if (!label) {
    return;
  }

  const target = await vscode.window.showInputBox({
    title: "Launch Pad",
    prompt: type === "url" ? "URL" : "Terminal command",
    validateInput: (value) => {
      const next = value.trim();

      if (!next) {
        return "A target is required.";
      }

      if (type === "url" && !/^https?:\/\//i.test(next)) {
        return "Use an http:// or https:// URL.";
      }

      return undefined;
    }
  });

  if (!target) {
    return;
  }

  const config = readLaunchPadConfig(root);
  const id = `custom:${type}:${safeSlug(label)}:${Date.now().toString(36)}`;
  const customItem = {
    id,
    type,
    label: label.trim(),
    target: target.trim(),
    detail: type === "url" ? target.trim() : "terminal command"
  };
  const saved = await writeLaunchPadConfig(
    {
      pinned: [...new Set([...config.pinned, id])],
      custom: [...config.custom, customItem]
    },
    root
  );

  if (saved) {
    vscode.window.showInformationMessage(`Launch Pad: added ${customItem.label}.`);
    postLaunchPadState();
  }
}

async function removeCustomLaunchPadItem(itemId) {
  const root = workspaceRoot();
  const config = readLaunchPadConfig(root);
  const item = config.custom.find((customItem) => customItem.id === itemId);

  if (!item) {
    return;
  }

  const answer = await vscode.window.showWarningMessage(`Remove ${item.label} from Launch Pad?`, { modal: false }, "Remove");

  if (answer !== "Remove") {
    return;
  }

  const saved = await writeLaunchPadConfig(
    {
      pinned: config.pinned.filter((id) => id !== itemId),
      custom: config.custom.filter((customItem) => customItem.id !== itemId)
    },
    root
  );

  if (saved) {
    postLaunchPadState();
  }
}

async function runLaunchPadItem(itemId) {
  const state = launchPadState();
  const item = state.items.find((candidate) => candidate.id === itemId);
  const snapshot = projectSnapshot();

  if (!item) {
    vscode.window.showWarningMessage("Launch Pad: item was not found.");
    return;
  }

  if (item.type === "script") {
    await vscode.commands.executeCommand("my-vsc-themes.commandCenter.runScript", item.target);
    return;
  }

  if (item.type === "command") {
    await vscode.commands.executeCommand(item.target);
    return;
  }

  if (item.type === "url") {
    await vscode.env.openExternal(vscode.Uri.parse(item.target));
    return;
  }

  if (item.type === "file") {
    if (!snapshot.root) {
      vscode.window.showWarningMessage("Launch Pad: open a workspace before opening files.");
      return;
    }

    const filePath = path.isAbsolute(item.target) ? item.target : path.join(snapshot.root, item.target);

    if (!fs.existsSync(filePath) && item.target === LAUNCH_PAD_FILE) {
      await writeLaunchPadConfig(defaultLaunchPadConfig(), snapshot.root);
    }

    await vscode.window.showTextDocument(vscode.Uri.file(filePath));
    return;
  }

  if (item.type === "terminal") {
    const terminal = vscode.window.createTerminal({
      name: item.label || "Launch Pad",
      cwd: snapshot.root
    });
    terminal.show();

    if (item.target) {
      terminal.sendText(item.target);
    }
  }
}

async function openLaunchPad() {
  const state = launchPadState();

  if (launchPadPanel) {
    launchPadPanel.reveal(vscode.ViewColumn.One);
    postLaunchPadState();
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    LAUNCH_PAD_VIEW_TYPE,
    "Launch Pad",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true
    }
  );
  launchPadPanel = panel;
  panel.onDidDispose(() => {
    launchPadPanel = undefined;
  });

  const token = nonce();
  panel.webview.html = launchPadHtml(panel.webview, token, state);
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message?.type === "runItem") {
      await runLaunchPadItem(String(message.id ?? ""));
      return;
    }

    if (message?.type === "togglePinned") {
      await togglePinned(String(message.id ?? ""));
      return;
    }

    if (message?.type === "addLink") {
      await addCustomLaunchPadItem("url");
      return;
    }

    if (message?.type === "addTerminal") {
      await addCustomLaunchPadItem("terminal");
      return;
    }

    if (message?.type === "removeCustom") {
      await removeCustomLaunchPadItem(String(message.id ?? ""));
      return;
    }

    if (message?.type === "openConfig") {
      await openLaunchPadConfig();
      return;
    }

    if (message?.type === "refresh") {
      postLaunchPadState();
    }
  });
}

function launchPadHtml(webview, token, state) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${token}';">
  <title>Launch Pad</title>
  <style>
    :root {
      --bg: #120805;
      --panel: #1d100b;
      --panel-strong: #28160e;
      --line: #5b321e;
      --text: #ffe9da;
      --muted: #c99678;
      --orange: #ff8a3d;
      --orange-soft: #ffb36f;
      --cyan: #5eead4;
      --green: #95d66b;
      --pink: #ff6b9d;
      --shadow: rgba(0, 0, 0, 0.34);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        linear-gradient(145deg, rgba(255, 138, 61, 0.12), transparent 34%),
        linear-gradient(315deg, rgba(94, 234, 212, 0.08), transparent 42%),
        var(--bg);
      font-family: var(--vscode-font-family);
    }

    button,
    input {
      font: inherit;
    }

    .shell {
      width: min(1180px, calc(100vw - 48px));
      margin: 0 auto;
      padding: 28px 0 36px;
    }

    header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 24px;
      margin-bottom: 18px;
    }

    h1 {
      margin: 0;
      font-size: 32px;
      line-height: 1;
      letter-spacing: 0;
    }

    .eyebrow,
    .context {
      margin: 0;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
    }

    .context {
      margin-top: 8px;
      text-transform: none;
    }

    .actions,
    .toolbar,
    .stats {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .button {
      border: 1px solid var(--line);
      color: var(--text);
      background: rgba(255, 138, 61, 0.1);
      min-height: 34px;
      padding: 7px 11px;
      border-radius: 6px;
      cursor: pointer;
    }

    .button:hover,
    .button:focus-visible {
      border-color: var(--orange);
      background: rgba(255, 138, 61, 0.18);
      outline: none;
    }

    .toolbar {
      margin-bottom: 14px;
    }

    .search {
      flex: 1 1 320px;
      min-width: 0;
      min-height: 40px;
      border: 1px solid var(--line);
      color: var(--text);
      background: rgba(0, 0, 0, 0.22);
      border-radius: 6px;
      padding: 0 12px;
    }

    .search:focus {
      border-color: var(--cyan);
      outline: none;
    }

    .stats {
      margin-bottom: 18px;
    }

    .stat {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      min-height: 28px;
      padding: 4px 9px;
      border: 1px solid rgba(255, 138, 61, 0.28);
      border-radius: 999px;
      color: var(--orange-soft);
      background: rgba(255, 138, 61, 0.08);
      font-size: 12px;
    }

    .sections {
      display: grid;
      gap: 18px;
    }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      color: var(--orange-soft);
      font-weight: 700;
      letter-spacing: 0;
    }

    .section-count {
      color: var(--muted);
      font-size: 12px;
      font-weight: 500;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }

    .card {
      position: relative;
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: start;
      min-height: 112px;
      border: 1px solid rgba(255, 138, 61, 0.2);
      border-radius: 8px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent), var(--panel);
      box-shadow: 0 14px 34px var(--shadow);
      padding: 13px;
    }

    .card:hover {
      border-color: rgba(255, 138, 61, 0.58);
      background: var(--panel-strong);
    }

    .label {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .detail {
      margin: 7px 0 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 42px;
      height: 24px;
      border-radius: 999px;
      color: #160904;
      background: var(--cyan);
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .card[data-type="script"] .badge {
      background: var(--orange);
    }

    .card[data-type="command"] .badge {
      background: var(--green);
    }

    .card[data-type="url"] .badge {
      background: var(--pink);
    }

    .card-actions {
      grid-column: 1 / -1;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 6px;
    }

    .mini {
      min-height: 28px;
      padding: 4px 9px;
      color: var(--text);
      background: rgba(0, 0, 0, 0.18);
      border: 1px solid rgba(255, 138, 61, 0.25);
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
    }

    .mini:hover,
    .mini:focus-visible {
      border-color: var(--orange);
      outline: none;
    }

    .pin[data-pinned="true"] {
      color: #160904;
      background: var(--orange);
      border-color: var(--orange);
      font-weight: 800;
    }

    .empty {
      border: 1px dashed rgba(255, 138, 61, 0.38);
      border-radius: 8px;
      color: var(--muted);
      padding: 24px;
      text-align: center;
    }

    @media (max-width: 720px) {
      .shell {
        width: min(100vw - 24px, 1180px);
        padding-top: 20px;
      }

      header {
        align-items: flex-start;
        flex-direction: column;
      }

      h1 {
        font-size: 26px;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header>
      <div>
        <p class="eyebrow">Colin's Suite</p>
        <h1>Launch Pad</h1>
        <p class="context" id="contextLine"></p>
      </div>
      <div class="actions">
        <button class="button" id="addLink" type="button">+ Link</button>
        <button class="button" id="addTerminal" type="button">+ Terminal</button>
        <button class="button" id="openConfig" type="button">Config</button>
        <button class="button" id="refresh" type="button">Refresh</button>
      </div>
    </header>

    <div class="toolbar">
      <input class="search" id="search" type="search" placeholder="Search scripts, files, links, commands">
    </div>

    <div class="stats" id="stats"></div>
    <main class="sections" id="sections"></main>
  </div>

  <script nonce="${token}">
    const vscode = acquireVsCodeApi();
    let state = ${scriptData(state)};
    const groupOrder = ["Pinned", "Scripts", "Workspace", "Suite", "Custom"];

    function el(id) {
      return document.getElementById(id);
    }

    function safe(value) {
      return String(value ?? "").replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]);
    }

    function matchesQuery(item, query) {
      if (!query) {
        return true;
      }

      return [item.label, item.detail, item.group, item.badge, item.target]
        .join(" ")
        .toLowerCase()
        .includes(query);
    }

    function itemCard(item) {
      const actionLabel = item.type === "terminal" && !item.target ? "Open" : "Run";
      const removeButton = item.custom
        ? '<button class="mini remove" data-id="' + safe(item.id) + '" type="button">Remove</button>'
        : "";

      return '<article class="card" data-type="' + safe(item.type) + '">' +
        '<div>' +
          '<p class="label">' + safe(item.label) + '</p>' +
          '<p class="detail">' + safe(item.detail || item.target) + '</p>' +
        '</div>' +
        '<span class="badge">' + safe(item.badge) + '</span>' +
        '<div class="card-actions">' +
          '<button class="mini run" data-id="' + safe(item.id) + '" type="button">' + actionLabel + '</button>' +
          '<button class="mini pin" data-id="' + safe(item.id) + '" data-pinned="' + String(Boolean(item.pinned)) + '" type="button">' + (item.pinned ? "Pinned" : "Pin") + '</button>' +
          removeButton +
        '</div>' +
      '</article>';
    }

    function sectionHtml(title, items) {
      if (!items.length) {
        return "";
      }

      return '<section>' +
        '<div class="section-title">' +
          '<span>' + safe(title) + '</span>' +
          '<span class="section-count">' + items.length + '</span>' +
        '</div>' +
        '<div class="grid">' + items.map(itemCard).join("") + '</div>' +
      '</section>';
    }

    function render() {
      const query = el("search").value.trim().toLowerCase();
      const items = (state.items || []).filter((item) => matchesQuery(item, query));
      const pinnedItems = items.filter((item) => item.pinned);
      const sections = [];

      sections.push(sectionHtml("Pinned", pinnedItems));

      for (const group of groupOrder.filter((name) => name !== "Pinned")) {
        sections.push(sectionHtml(group, items.filter((item) => item.group === group && !item.pinned)));
      }

      el("contextLine").textContent = state.projectName + (state.rootName ? " / " + state.rootName : "");
      el("stats").innerHTML = [
        ["Workspace", state.hasWorkspace ? "open" : "none"],
        ["Scripts", state.scriptCount],
        ["Pinned", state.pinnedCount],
        ["Custom", state.customCount]
      ].map(([label, value]) => '<span class="stat">' + safe(label) + ': ' + safe(value) + '</span>').join("");
      el("sections").innerHTML = sections.join("") || '<div class="empty">No matching launch items.</div>';

      document.querySelectorAll(".run").forEach((button) => {
        button.addEventListener("click", () => vscode.postMessage({ type: "runItem", id: button.dataset.id }));
      });
      document.querySelectorAll(".pin").forEach((button) => {
        button.addEventListener("click", () => vscode.postMessage({ type: "togglePinned", id: button.dataset.id }));
      });
      document.querySelectorAll(".remove").forEach((button) => {
        button.addEventListener("click", () => vscode.postMessage({ type: "removeCustom", id: button.dataset.id }));
      });
    }

    el("search").addEventListener("input", render);
    el("addLink").addEventListener("click", () => vscode.postMessage({ type: "addLink" }));
    el("addTerminal").addEventListener("click", () => vscode.postMessage({ type: "addTerminal" }));
    el("openConfig").addEventListener("click", () => vscode.postMessage({ type: "openConfig" }));
    el("refresh").addEventListener("click", () => vscode.postMessage({ type: "refresh" }));
    window.addEventListener("message", (event) => {
      if (event.data?.type === "state") {
        state = event.data.state;
        render();
      }
    });

    render();
  </script>
</body>
</html>`;
}

function registerLaunchPad(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("my-vsc-themes.launchPad.open", openLaunchPad),
    vscode.workspace.onDidChangeWorkspaceFolders(() => postLaunchPadState()),
    vscode.workspace.onDidSaveTextDocument((document) => {
      const root = workspaceRoot();
      const filePath = launchPadFilePath(root);

      if (filePath && path.normalize(document.uri.fsPath) === path.normalize(filePath)) {
        postLaunchPadState();
      }
    })
  );
}

module.exports = { registerLaunchPad };
