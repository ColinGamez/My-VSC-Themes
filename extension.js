const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const PACKS = {
  "Orange Core": ["All Orange", "All Orange No Italics", "All Orange Soft", "All Orange High Contrast"],
  Seasonal: ["Spring Bloom", "Summer Sunset", "Autumn Ember", "Winter Aurora"],
  Holiday: ["Halloween Midnight", "Candy Cane Code", "Valentine Glow", "New Year Neon", "Birthday Confetti"],
  Gaming: ["Voxel Craft", "Cyber Runner", "Retro Console", "Starfighter HUD", "Quest Tavern"],
  "Color Moods": [
    "Neon Arcade",
    "Matcha Grove",
    "Peach Soda",
    "Blue Raspberry",
    "Cherry Cola",
    "Lavender Static",
    "Ocean Byte",
    "Graphite Pop",
    "Honey Terminal",
    "Pumpkin Hacker",
    "Cyber Grape",
    "Cotton Candy Terminal",
    "XP Dark",
    "Solar Flare"
  ]
};

const ALL_THEMES = [...new Set(Object.values(PACKS).flat())];
const DEFAULT_REACTOR_SCHEDULE = {
  morning: "Spring Bloom",
  day: "Peach Soda",
  evening: "Summer Sunset",
  night: "All Orange"
};
const DEFAULT_REACTOR_FAVORITES = [
  "All Orange",
  "All Orange High Contrast",
  "Summer Sunset",
  "Autumn Ember",
  "Winter Aurora",
  "Starfighter HUD"
];
const REACTOR_INTERVAL_MS = 5 * 60 * 1000;
const SCRIPT_PRIORITY = ["dev", "start", "watch", "serve", "preview", "build", "test", "lint", "format", "package"];
const README_STUDIO_VIEW_TYPE = "my-vsc-themes.readmeStudio";

class CommandCenterNode extends vscode.TreeItem {
  constructor(label, options = {}) {
    super(label, options.collapsibleState ?? vscode.TreeItemCollapsibleState.None);
    this.nodeType = options.nodeType;
    this.description = options.description;
    this.tooltip = options.tooltip;
    this.contextValue = options.contextValue;
    this.command = options.command;

    if (options.icon) {
      this.iconPath = new vscode.ThemeIcon(options.icon);
    }
  }
}

class ProjectCommandCenterProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  async getChildren(element) {
    const snapshot = projectSnapshot();

    if (!snapshot.root) {
      return [
        new CommandCenterNode("Open a folder", {
          description: "Command Center needs a workspace",
          icon: "folder-opened",
          command: {
            command: "workbench.action.files.openFolder",
            title: "Open Folder"
          }
        })
      ];
    }

    if (!element) {
      return commandCenterRootItems(snapshot);
    }

    if (element.nodeType === "quickActions") {
      return commandCenterQuickActions(snapshot);
    }

    if (element.nodeType === "scripts") {
      return commandCenterScriptItems(snapshot);
    }

    if (element.nodeType === "git") {
      return commandCenterGitItems(snapshot);
    }

    if (element.nodeType === "health") {
      return commandCenterHealthItems(snapshot);
    }

    if (element.nodeType === "reactor") {
      return commandCenterReactorItems(snapshot);
    }

    return [];
  }
}

function workspaceRoot() {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function existsAt(root, relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return undefined;
  }
}

function findFirstPath(root, candidates) {
  return candidates.find((candidate) => existsAt(root, candidate));
}

function dependencyNames(packageJson) {
  return new Set([
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {})
  ]);
}

function projectTypes(root, packageJson) {
  const deps = dependencyNames(packageJson);
  const types = [];

  if (packageJson?.contributes || packageJson?.engines?.vscode) {
    types.push("VS Code Extension");
  }

  if (deps.has("next") || existsAt(root, "next.config.js") || existsAt(root, "next.config.mjs")) {
    types.push("Next.js");
  }

  if (deps.has("vite") || existsAt(root, "vite.config.js") || existsAt(root, "vite.config.ts")) {
    types.push("Vite");
  }

  if (deps.has("react")) {
    types.push("React");
  }

  if (packageJson) {
    types.push("Node");
  }

  if (existsAt(root, "pyproject.toml") || existsAt(root, "requirements.txt")) {
    types.push("Python");
  }

  if (existsAt(root, "themes") && existsAt(root, "package.json")) {
    types.push("Theme Pack");
  }

  return [...new Set(types.length ? types : ["Workspace"])];
}

function detectPackageManager(root) {
  if (existsAt(root, "pnpm-lock.yaml")) {
    return "pnpm";
  }

  if (existsAt(root, "yarn.lock")) {
    return "yarn";
  }

  if (existsAt(root, "bun.lockb") || existsAt(root, "bun.lock")) {
    return "bun";
  }

  return "npm";
}

function scriptCommand(packageManager, scriptName) {
  if (packageManager === "pnpm") {
    return `pnpm run ${scriptName}`;
  }

  if (packageManager === "yarn") {
    return `yarn ${scriptName}`;
  }

  if (packageManager === "bun") {
    return `bun run ${scriptName}`;
  }

  return `npm run ${scriptName}`;
}

function sortedScripts(scripts = {}) {
  return Object.keys(scripts).sort((a, b) => {
    const aPriority = SCRIPT_PRIORITY.indexOf(a);
    const bPriority = SCRIPT_PRIORITY.indexOf(b);
    const normalizedA = aPriority === -1 ? Number.MAX_SAFE_INTEGER : aPriority;
    const normalizedB = bPriority === -1 ? Number.MAX_SAFE_INTEGER : bPriority;

    if (normalizedA !== normalizedB) {
      return normalizedA - normalizedB;
    }

    return a.localeCompare(b);
  });
}

function runGit(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 1500
    }).trim();
  } catch {
    return "";
  }
}

function normalizeRemoteUrl(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  let url = value.trim().replace(/^git\+/, "");

  if (url.startsWith("git@github.com:")) {
    url = `https://github.com/${url.slice("git@github.com:".length)}`;
  }

  if (url.startsWith("ssh://git@github.com/")) {
    url = `https://github.com/${url.slice("ssh://git@github.com/".length)}`;
  }

  if (url.endsWith(".git")) {
    url = url.slice(0, -4);
  }

  return url.startsWith("http://") || url.startsWith("https://") ? url : "";
}

function packageRepositoryUrl(packageJson) {
  const repository = packageJson?.repository;

  if (typeof repository === "string") {
    return normalizeRemoteUrl(repository);
  }

  return normalizeRemoteUrl(repository?.url);
}

function gitInfo(root, packageJson) {
  const branch = runGit(root, ["branch", "--show-current"]) || runGit(root, ["rev-parse", "--short", "HEAD"]);
  const status = runGit(root, ["status", "--short"]);
  const remote = runGit(root, ["config", "--get", "remote.origin.url"]);

  return {
    branch,
    changes: status ? status.split(/\r?\n/).filter(Boolean).length : 0,
    remoteUrl: packageRepositoryUrl(packageJson) || normalizeRemoteUrl(remote),
    isRepo: Boolean(branch || remote)
  };
}

function projectHealth(root, packageJson) {
  const scripts = packageJson?.scripts ?? {};
  const checks = [
    {
      label: "README",
      ok: Boolean(findFirstPath(root, ["README.md", "readme.md"])),
      missing: "Missing README",
      create: "README.md"
    },
    {
      label: ".gitignore",
      ok: existsAt(root, ".gitignore"),
      missing: "Missing .gitignore",
      create: ".gitignore"
    },
    {
      label: "License",
      ok: Boolean(findFirstPath(root, ["LICENSE", "LICENSE.md", "license.md"])),
      missing: "Missing license"
    },
    {
      label: "CI workflow",
      ok: existsAt(root, ".github/workflows"),
      missing: "No GitHub Actions workflow"
    }
  ];

  if (packageJson) {
    checks.push(
      {
        label: "Build script",
        ok: Boolean(scripts.build),
        missing: "No build script"
      },
      {
        label: "Test script",
        ok: Boolean(scripts.test),
        missing: "No test script"
      },
      {
        label: "Lint script",
        ok: Boolean(scripts.lint),
        missing: "No lint script"
      }
    );
  }

  const ok = checks.filter((check) => check.ok).length;

  return {
    checks,
    ok,
    total: checks.length
  };
}

function projectSnapshot() {
  const root = workspaceRoot();

  if (!root) {
    return { root: undefined };
  }

  const packageJson = readJsonFile(path.join(root, "package.json"));
  const scripts = sortedScripts(packageJson?.scripts);
  const packageManager = detectPackageManager(root);
  const readme = findFirstPath(root, ["README.md", "readme.md"]);
  const health = projectHealth(root, packageJson);

  return {
    root,
    name: packageJson?.displayName || packageJson?.name || path.basename(root),
    packageJson,
    packageManager,
    projectTypes: projectTypes(root, packageJson),
    scripts,
    readme,
    git: gitInfo(root, packageJson),
    health
  };
}

function commandCenterRootItems(snapshot) {
  return [
    new CommandCenterNode(snapshot.name, {
      description: snapshot.projectTypes.join(" / "),
      tooltip: snapshot.root,
      icon: "rocket"
    }),
    new CommandCenterNode("Quick Actions", {
      nodeType: "quickActions",
      description: "Run + open",
      icon: "zap",
      collapsibleState: vscode.TreeItemCollapsibleState.Expanded
    }),
    new CommandCenterNode(`Scripts (${snapshot.scripts.length})`, {
      nodeType: "scripts",
      description: snapshot.packageManager,
      icon: "terminal",
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
    }),
    new CommandCenterNode(snapshot.git.isRepo ? `Git: ${snapshot.git.branch || "repo"}` : "Git", {
      nodeType: "git",
      description: snapshot.git.isRepo ? `${snapshot.git.changes} changes` : "not detected",
      icon: "git-branch",
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
    }),
    new CommandCenterNode(`Health ${snapshot.health.ok}/${snapshot.health.total}`, {
      nodeType: "health",
      description: snapshot.health.ok === snapshot.health.total ? "solid" : "needs polish",
      icon: snapshot.health.ok === snapshot.health.total ? "pass" : "warning",
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
    }),
    new CommandCenterNode("Theme Reactor", {
      nodeType: "reactor",
      description: vscode.workspace.getConfiguration("myVscThemes").get("reactor.enabled") ? "on" : "off",
      icon: "sparkle",
      collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
    })
  ];
}

function commandCenterQuickActions(snapshot) {
  const items = [
    new CommandCenterNode("Open README Studio", {
      description: "Build project docs",
      icon: "preview",
      command: {
        command: "my-vsc-themes.readmeStudio.open",
        title: "Open README Studio"
      }
    }),
    new CommandCenterNode("Run Best Script", {
      description: bestScript(snapshot) || "no scripts",
      icon: "play",
      command: {
        command: "my-vsc-themes.commandCenter.runBestScript",
        title: "Run Best Script"
      }
    }),
    new CommandCenterNode("Open Terminal Here", {
      description: path.basename(snapshot.root),
      icon: "terminal",
      command: {
        command: "my-vsc-themes.commandCenter.openTerminal",
        title: "Open Terminal Here"
      }
    })
  ];

  if (snapshot.readme) {
    items.push(
      new CommandCenterNode("Open README", {
        description: snapshot.readme,
        icon: "book",
        command: {
          command: "my-vsc-themes.commandCenter.openFile",
          title: "Open README",
          arguments: [snapshot.readme]
        }
      })
    );
  }

  if (snapshot.git.remoteUrl) {
    items.push(
      new CommandCenterNode("Open Repository", {
        description: "GitHub",
        icon: "repo",
        command: {
          command: "my-vsc-themes.commandCenter.openRepository",
          title: "Open Repository"
        }
      })
    );
  }

  items.push(
    new CommandCenterNode("Create Missing Basics", {
      description: "README + .gitignore",
      icon: "wand",
      command: {
        command: "my-vsc-themes.commandCenter.createMissingBasics",
        title: "Create Missing Basics"
      }
    })
  );

  return items;
}

function commandCenterScriptItems(snapshot) {
  if (!snapshot.scripts.length) {
    return [
      new CommandCenterNode("No package scripts found", {
        description: "Add scripts to package.json",
        icon: "info"
      })
    ];
  }

  return snapshot.scripts.map(
    (scriptName) =>
      new CommandCenterNode(scriptName, {
        description: scriptCommand(snapshot.packageManager, scriptName),
        tooltip: snapshot.packageJson?.scripts?.[scriptName],
        icon: SCRIPT_PRIORITY.includes(scriptName) ? "play" : "symbol-method",
        command: {
          command: "my-vsc-themes.commandCenter.runScript",
          title: `Run ${scriptName}`,
          arguments: [scriptName]
        }
      })
  );
}

function commandCenterGitItems(snapshot) {
  if (!snapshot.git.isRepo) {
    return [
      new CommandCenterNode("Git repo not detected", {
        description: "No branch or remote",
        icon: "info"
      })
    ];
  }

  const items = [
    new CommandCenterNode("Branch", {
      description: snapshot.git.branch || "detached",
      icon: "git-branch"
    }),
    new CommandCenterNode("Working Tree", {
      description: snapshot.git.changes ? `${snapshot.git.changes} changed files` : "clean",
      icon: snapshot.git.changes ? "diff" : "pass"
    })
  ];

  if (snapshot.git.remoteUrl) {
    items.push(
      new CommandCenterNode("Open Remote", {
        description: "browser",
        tooltip: snapshot.git.remoteUrl,
        icon: "link-external",
        command: {
          command: "my-vsc-themes.commandCenter.openRepository",
          title: "Open Remote"
        }
      })
    );
  }

  return items;
}

function commandCenterHealthItems(snapshot) {
  return snapshot.health.checks.map(
    (check) =>
      new CommandCenterNode(check.ok ? check.label : check.missing, {
        description: check.ok ? "ok" : "missing",
        icon: check.ok ? "pass" : "warning",
        command: check.create
          ? {
              command: "my-vsc-themes.commandCenter.openOrCreateFile",
              title: `Open ${check.create}`,
              arguments: [check.create]
            }
          : undefined
      })
  );
}

function commandCenterReactorItems() {
  const config = vscode.workspace.getConfiguration("myVscThemes");
  const enabled = config.get("reactor.enabled", false);
  const mode = config.get("reactor.mode", "hybrid");

  return [
    new CommandCenterNode(enabled ? "Theme Reactor On" : "Theme Reactor Off", {
      description: mode,
      icon: enabled ? "radio-tower" : "circle-slash"
    }),
    new CommandCenterNode("Apply Reactor Now", {
      icon: "sync",
      command: {
        command: "my-vsc-themes.applyThemeReactorNow",
        title: "Apply Reactor Now"
      }
    }),
    new CommandCenterNode("Random Favorite", {
      icon: "symbol-color",
      command: {
        command: "my-vsc-themes.randomReactorFavorite",
        title: "Random Favorite"
      }
    }),
    new CommandCenterNode("Set Workspace Theme", {
      icon: "settings-gear",
      command: {
        command: "my-vsc-themes.setReactorWorkspaceTheme",
        title: "Set Workspace Theme"
      }
    })
  ];
}

function bestScript(snapshot) {
  return ["dev", "start", "serve", "preview", "build", "test"].find((scriptName) =>
    snapshot.scripts.includes(scriptName)
  );
}

function commandCenterTerminal(snapshot = projectSnapshot()) {
  return vscode.window.createTerminal({
    name: "Colin's Command Center",
    cwd: snapshot.root
  });
}

async function runProjectScript(scriptName) {
  const snapshot = projectSnapshot();

  if (!snapshot.root || !snapshot.scripts.includes(scriptName)) {
    vscode.window.showWarningMessage(`Colin's Command Center: script "${scriptName}" was not found.`);
    return;
  }

  const terminal = commandCenterTerminal(snapshot);
  terminal.show();
  terminal.sendText(scriptCommand(snapshot.packageManager, scriptName));
}

async function runBestProjectScript() {
  const snapshot = projectSnapshot();
  const scriptName = bestScript(snapshot);

  if (!scriptName) {
    vscode.window.showInformationMessage("Colin's Command Center: no runnable package scripts found.");
    return;
  }

  await runProjectScript(scriptName);
}

async function openProjectTerminal() {
  const snapshot = projectSnapshot();

  if (!snapshot.root) {
    vscode.window.showWarningMessage("Colin's Command Center: open a folder first.");
    return;
  }

  const terminal = commandCenterTerminal(snapshot);
  terminal.show();
}

async function openWorkspaceFile(relativePath) {
  const snapshot = projectSnapshot();

  if (!snapshot.root || !relativePath) {
    return;
  }

  const fileUri = vscode.Uri.file(path.join(snapshot.root, relativePath));
  await vscode.window.showTextDocument(fileUri);
}

async function openProjectRepository() {
  const snapshot = projectSnapshot();

  if (!snapshot.git?.remoteUrl) {
    vscode.window.showInformationMessage("Colin's Command Center: no repository URL found.");
    return;
  }

  await vscode.env.openExternal(vscode.Uri.parse(snapshot.git.remoteUrl));
}

function starterFileContents(fileName, snapshot) {
  if (fileName === "README.md") {
    return `# ${snapshot.name}\n\n## Getting Started\n\nAdd setup and usage notes here.\n\n## Scripts\n\nDocument the main commands for this project.\n`;
  }

  if (fileName === ".gitignore") {
    return "node_modules/\n.vscode/\n.env\n.env.local\n*.log\n.DS_Store\ndist/\nbuild/\n";
  }

  return "";
}

async function openOrCreateWorkspaceFile(relativePath) {
  const snapshot = projectSnapshot();

  if (!snapshot.root || !relativePath) {
    return;
  }

  const filePath = path.join(snapshot.root, relativePath);

  if (!fs.existsSync(filePath)) {
    const answer = await vscode.window.showWarningMessage(
      `Create ${relativePath} in this workspace?`,
      { modal: false },
      "Create"
    );

    if (answer !== "Create") {
      return;
    }

    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(filePath),
      Buffer.from(starterFileContents(relativePath, snapshot), "utf8")
    );
  }

  await openWorkspaceFile(relativePath);
}

async function createMissingBasics() {
  const snapshot = projectSnapshot();

  if (!snapshot.root) {
    vscode.window.showWarningMessage("Colin's Command Center: open a folder first.");
    return;
  }

  const basics = ["README.md", ".gitignore"].filter((fileName) => !fs.existsSync(path.join(snapshot.root, fileName)));

  if (!basics.length) {
    vscode.window.showInformationMessage("Colin's Command Center: README and .gitignore already exist.");
    return;
  }

  const answer = await vscode.window.showWarningMessage(
    `Create ${basics.join(" and ")}?`,
    { modal: false },
    "Create"
  );

  if (answer !== "Create") {
    return;
  }

  for (const fileName of basics) {
    await vscode.workspace.fs.writeFile(
      vscode.Uri.file(path.join(snapshot.root, fileName)),
      Buffer.from(starterFileContents(fileName, snapshot), "utf8")
    );
  }

  vscode.window.showInformationMessage(`Colin's Command Center: created ${basics.join(" and ")}.`);
}

async function openCommandCenter() {
  await vscode.commands.executeCommand("my-vsc-themes.commandCenter.focus");
}

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

  await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), Buffer.from(markdown, "utf8"));
  vscode.window.showInformationMessage("README Studio: README.md saved.");
}

async function openReadmeStudio() {
  const state = readmeStudioState();

  if (!state.hasWorkspace) {
    vscode.window.showWarningMessage("Open a folder first, then launch README Studio.");
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
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${token}';">
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
      const escaped = escapeHtml(markdown);
      const blocks = escaped.split(/\\n{2,}/).map((block) => {
        if (block.startsWith("# ")) return "<h1>" + block.slice(2) + "</h1>";
        if (block.startsWith("## ")) return "<h2>" + block.slice(3) + "</h2>";
        if (block.startsWith("### ")) return "<h3>" + block.slice(4) + "</h3>";
        if (block.startsWith("\`\`\`")) {
          return "<pre><code>" + block.replace(/^\`\`\`\\w*\\n?/, "").replace(/\`\`\`$/, "") + "</code></pre>";
        }
        if (block.includes("\\n- ")) {
          const items = block.split("\\n").filter((line) => line.startsWith("- ")).map((line) => "<li>" + line.slice(2) + "</li>");
          return "<ul>" + items.join("") + "</ul>";
        }
        if (block.startsWith("|")) {
          const rows = block.split("\\n").filter((line) => !/^\\|\\s*-/.test(line)).map((line) => {
            const cells = line.split("|").slice(1, -1).map((cell) => "<td>" + cell.trim() + "</td>");
            return "<tr>" + cells.join("") + "</tr>";
          });
          return "<table>" + rows.join("") + "</table>";
        }
        return "<p>" + block.replace(/\\n/g, "<br>") + "</p>";
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

function monthTheme(date = new Date()) {
  const month = date.getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return { label: "Spring Bloom", detail: "Spring rotation" };
  }

  if (month >= 6 && month <= 8) {
    return { label: "Summer Sunset", detail: "Summer rotation" };
  }

  if (month >= 9 && month <= 11) {
    return { label: "Autumn Ember", detail: "Autumn rotation" };
  }

  return { label: "Winter Aurora", detail: "Winter rotation" };
}

function holidayTheme(date = new Date()) {
  const month = date.getMonth() + 1;

  if (month === 10) {
    return { label: "Halloween Midnight", detail: "October holiday rotation" };
  }

  if (month === 12) {
    return { label: "Candy Cane Code", detail: "December holiday rotation" };
  }

  if (month === 2) {
    return { label: "Valentine Glow", detail: "February holiday rotation" };
  }

  if (month === 1) {
    return { label: "New Year Neon", detail: "January holiday rotation" };
  }

  return monthTheme(date);
}

function timeBucket(date = new Date()) {
  const hour = date.getHours();

  if (hour >= 5 && hour < 11) {
    return { key: "morning", detail: "morning" };
  }

  if (hour >= 11 && hour < 17) {
    return { key: "day", detail: "day" };
  }

  if (hour >= 17 && hour < 21) {
    return { key: "evening", detail: "evening" };
  }

  return { key: "night", detail: "night" };
}

function isHolidayMonth(date = new Date()) {
  const month = date.getMonth() + 1;
  return month === 1 || month === 2 || month === 10 || month === 12;
}

function safeThemeList(themes, fallback = ALL_THEMES) {
  if (!Array.isArray(themes)) {
    return fallback;
  }

  const normalized = themes.filter((theme) => typeof theme === "string" && theme.trim());
  return normalized.length > 0 ? [...new Set(normalized)] : fallback;
}

function reactorSchedule(config) {
  const schedule = config.get("reactor.schedule", {});

  if (!schedule || typeof schedule !== "object" || Array.isArray(schedule)) {
    return DEFAULT_REACTOR_SCHEDULE;
  }

  return { ...DEFAULT_REACTOR_SCHEDULE, ...schedule };
}

function reactorFavorites(config) {
  return safeThemeList(config.get("reactor.favorites", DEFAULT_REACTOR_FAVORITES), DEFAULT_REACTOR_FAVORITES);
}

function reactorTimeTheme(date = new Date()) {
  const config = vscode.workspace.getConfiguration("myVscThemes");
  const schedule = reactorSchedule(config);
  const bucket = timeBucket(date);

  return {
    label: schedule[bucket.key] || DEFAULT_REACTOR_SCHEDULE[bucket.key],
    detail: `${bucket.detail} schedule`
  };
}

function reactorThemeForDate(date = new Date()) {
  const config = vscode.workspace.getConfiguration("myVscThemes");
  const rawWorkspaceTheme = config.get("reactor.workspaceTheme", "");
  const workspaceTheme = typeof rawWorkspaceTheme === "string" ? rawWorkspaceTheme.trim() : "";

  if (workspaceTheme) {
    return {
      label: workspaceTheme,
      detail: "workspace theme",
      target: vscode.ConfigurationTarget.Workspace
    };
  }

  const mode = config.get("reactor.mode", "hybrid");

  if (mode === "seasonal") {
    return monthTheme(date);
  }

  if (mode === "holiday") {
    return holidayTheme(date);
  }

  if (mode === "timeOfDay") {
    return reactorTimeTheme(date);
  }

  return isHolidayMonth(date) ? holidayTheme(date) : reactorTimeTheme(date);
}

async function setTheme(label, detail, options = {}) {
  const currentTheme = vscode.workspace.getConfiguration("workbench").get("colorTheme");
  const target = options.target ?? vscode.ConfigurationTarget.Global;

  if (currentTheme === label && !options.force) {
    if (!options.silent) {
      vscode.window.showInformationMessage(`Colin's Themes: ${label} is already active.`);
    }

    return false;
  }

  await vscode.workspace
    .getConfiguration("workbench")
    .update("colorTheme", label, target);

  if (!options.silent) {
    vscode.window.showInformationMessage(`Colin's Themes: switched to ${label}${detail ? ` (${detail})` : ""}.`);
  }

  return true;
}

async function updateGlobal(section, key, value) {
  await vscode.workspace
    .getConfiguration(section)
    .update(key, value, vscode.ConfigurationTarget.Global);
}

async function applySettingsPreset({ name, theme, minimap, renderWhitespace }) {
  await updateGlobal("workbench", "colorTheme", theme);
  await updateGlobal("workbench", "iconTheme", "colins-color-icons");
  await updateGlobal("editor", "fontLigatures", true);
  await updateGlobal("editor", "minimap.enabled", minimap);
  await updateGlobal("editor", "bracketPairColorization.enabled", true);
  await updateGlobal("editor", "guides.bracketPairs", "active");
  await updateGlobal("editor", "smoothScrolling", true);
  await updateGlobal("editor", "renderWhitespace", renderWhitespace);
  vscode.window.showInformationMessage(`Colin's Themes: applied ${name}.`);
}

async function applyOrangePreset() {
  await applySettingsPreset({
    name: "Orange Coding Preset",
    theme: "All Orange",
    minimap: true,
    renderWhitespace: "selection"
  });
}

async function applyFocusPreset() {
  await applySettingsPreset({
    name: "Focus Preset",
    theme: "All Orange High Contrast",
    minimap: false,
    renderWhitespace: "boundary"
  });
}

async function applyLightPreset() {
  await applySettingsPreset({
    name: "Light Coding Preset",
    theme: "Spring Bloom",
    minimap: false,
    renderWhitespace: "selection"
  });
}

async function applyGamingPreset() {
  await applySettingsPreset({
    name: "Gaming Preset",
    theme: "Starfighter HUD",
    minimap: true,
    renderWhitespace: "none"
  });
}

async function applySeasonalTheme() {
  const theme = monthTheme();
  await setTheme(theme.label, theme.detail);
}

async function applyHolidayTheme() {
  const theme = holidayTheme();
  await setTheme(theme.label, theme.detail);
}

async function pickThemeFromPack(packName) {
  const themes = PACKS[packName] ?? [];
  const choice = await vscode.window.showQuickPick(
    themes.map((label) => ({ label, description: packName })),
    { title: `Pick a ${packName} theme`, placeHolder: "Choose a theme" }
  );

  if (choice) {
    await setTheme(choice.label);
  }
}

async function pickThemeByPack() {
  const pack = await vscode.window.showQuickPick(Object.keys(PACKS), {
    title: "Pick a Colin's Themes pack",
    placeHolder: "Choose a pack"
  });

  if (pack) {
    await pickThemeFromPack(pack);
  }
}

async function enableLightDarkAutoSwitch() {
  await vscode.workspace
    .getConfiguration("window")
    .update("autoDetectColorScheme", true, vscode.ConfigurationTarget.Global);
  await vscode.workspace
    .getConfiguration("workbench")
    .update("preferredLightColorTheme", "Spring Bloom", vscode.ConfigurationTarget.Global);
  await vscode.workspace
    .getConfiguration("workbench")
    .update("preferredDarkColorTheme", "All Orange", vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage("Colin's Themes: enabled VS Code light/dark auto switching.");
}

async function enableMonthlyAutoTheme() {
  await vscode.workspace
    .getConfiguration("myVscThemes")
    .update("autoApplyOnStartup", true, vscode.ConfigurationTarget.Global);
  await vscode.workspace
    .getConfiguration("myVscThemes")
    .update("autoMode", "seasonal", vscode.ConfigurationTarget.Global);
  await applySeasonalTheme();
}

async function disableMonthlyAutoTheme() {
  await vscode.workspace
    .getConfiguration("myVscThemes")
    .update("autoApplyOnStartup", false, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage("Colin's Themes: startup auto theme is off.");
}

async function applyThemeReactor(options = {}) {
  const theme = reactorThemeForDate();
  return setTheme(theme.label, `Theme Reactor ${theme.detail}`, {
    ...options,
    target: theme.target ?? options.target
  });
}

async function applyThemeReactorIfEnabled(options = {}) {
  const config = vscode.workspace.getConfiguration("myVscThemes");

  if (!config.get("reactor.enabled", false)) {
    return false;
  }

  return applyThemeReactor(options);
}

async function enableThemeReactor() {
  const config = vscode.workspace.getConfiguration("myVscThemes");
  await config.update("reactor.enabled", true, vscode.ConfigurationTarget.Global);

  if (!config.get("reactor.mode")) {
    await config.update("reactor.mode", "hybrid", vscode.ConfigurationTarget.Global);
  }

  const changed = await applyThemeReactor({ silent: true });
  const theme = reactorThemeForDate();
  vscode.window.showInformationMessage(
    `Colin's Theme Reactor is on: ${theme.label}${changed ? "" : " was already active"}.`
  );
}

async function disableThemeReactor() {
  await vscode.workspace
    .getConfiguration("myVscThemes")
    .update("reactor.enabled", false, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage("Colin's Theme Reactor is off.");
}

async function applyThemeReactorNow() {
  await applyThemeReactor();
}

async function pickReactorFavorite() {
  const config = vscode.workspace.getConfiguration("myVscThemes");
  const themes = reactorFavorites(config);
  const choice = await vscode.window.showQuickPick(
    themes.map((label) => ({ label, description: "Theme Reactor favorite" })),
    { title: "Pick a Theme Reactor favorite", placeHolder: "Choose a favorite theme" }
  );

  if (choice) {
    await setTheme(choice.label, "Theme Reactor favorite");
  }
}

async function randomReactorFavorite() {
  const config = vscode.workspace.getConfiguration("myVscThemes");
  const themes = reactorFavorites(config);
  const label = themes[Math.floor(Math.random() * themes.length)];
  await setTheme(label, "Theme Reactor random favorite");
}

async function configureReactorFavorites() {
  const config = vscode.workspace.getConfiguration("myVscThemes");
  const favorites = new Set(reactorFavorites(config));
  const choices = await vscode.window.showQuickPick(
    ALL_THEMES.map((label) => ({
      label,
      picked: favorites.has(label)
    })),
    {
      canPickMany: true,
      title: "Configure Theme Reactor favorites",
      placeHolder: "Pick themes for random/favorite commands"
    }
  );

  if (!choices) {
    return;
  }

  await config.update(
    "reactor.favorites",
    choices.map((choice) => choice.label),
    vscode.ConfigurationTarget.Global
  );
  vscode.window.showInformationMessage(`Colin's Theme Reactor: saved ${choices.length} favorites.`);
}

async function setReactorWorkspaceTheme() {
  if (!vscode.workspace.workspaceFolders?.length) {
    vscode.window.showWarningMessage("Open a workspace or folder before setting a Theme Reactor workspace theme.");
    return;
  }

  const choices = [
    { label: "Clear workspace theme", description: "Use the normal Theme Reactor mode", theme: "" },
    ...ALL_THEMES.map((label) => ({ label, description: "Use in this workspace", theme: label }))
  ];
  const choice = await vscode.window.showQuickPick(choices, {
    title: "Set Theme Reactor workspace theme",
    placeHolder: "Choose the theme this workspace should use"
  });

  if (!choice) {
    return;
  }

  await vscode.workspace
    .getConfiguration("myVscThemes")
    .update("reactor.workspaceTheme", choice.theme, vscode.ConfigurationTarget.Workspace);

  if (!choice.theme) {
    vscode.window.showInformationMessage("Colin's Theme Reactor: cleared this workspace theme.");
    return;
  }

  await setTheme(choice.theme, "Theme Reactor workspace theme", {
    force: true,
    target: vscode.ConfigurationTarget.Workspace
  });
}

async function applyConfiguredStartupTheme() {
  const config = vscode.workspace.getConfiguration("myVscThemes");

  if (config.get("reactor.enabled", false)) {
    await applyThemeReactor({ silent: true });
    return;
  }

  if (!config.get("autoApplyOnStartup")) {
    return;
  }

  if (config.get("autoMode") === "holiday") {
    await applyHolidayTheme();
    return;
  }

  await applySeasonalTheme();
}

function watchThemeReactor(context) {
  const timer = setInterval(() => {
    applyThemeReactorIfEnabled({ silent: true });
  }, REACTOR_INTERVAL_MS);

  context.subscriptions.push({ dispose: () => clearInterval(timer) });
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("myVscThemes.reactor")) {
        applyThemeReactorIfEnabled({ silent: true });
      }
    })
  );
}

function activate(context) {
  const commandCenterProvider = new ProjectCommandCenterProvider();

  context.subscriptions.push(
    vscode.window.createTreeView("my-vsc-themes.commandCenter", {
      treeDataProvider: commandCenterProvider,
      showCollapseAll: true
    }),
    vscode.commands.registerCommand("my-vsc-themes.readmeStudio.open", openReadmeStudio),
    vscode.commands.registerCommand("my-vsc-themes.commandCenter.open", openCommandCenter),
    vscode.commands.registerCommand("my-vsc-themes.commandCenter.refresh", () => commandCenterProvider.refresh()),
    vscode.commands.registerCommand("my-vsc-themes.commandCenter.runScript", runProjectScript),
    vscode.commands.registerCommand("my-vsc-themes.commandCenter.runBestScript", runBestProjectScript),
    vscode.commands.registerCommand("my-vsc-themes.commandCenter.openTerminal", openProjectTerminal),
    vscode.commands.registerCommand("my-vsc-themes.commandCenter.openFile", openWorkspaceFile),
    vscode.commands.registerCommand("my-vsc-themes.commandCenter.openOrCreateFile", openOrCreateWorkspaceFile),
    vscode.commands.registerCommand("my-vsc-themes.commandCenter.openRepository", openProjectRepository),
    vscode.commands.registerCommand("my-vsc-themes.commandCenter.createMissingBasics", createMissingBasics),
    vscode.commands.registerCommand("my-vsc-themes.applySeasonalTheme", applySeasonalTheme),
    vscode.commands.registerCommand("my-vsc-themes.applyHolidayTheme", applyHolidayTheme),
    vscode.commands.registerCommand("my-vsc-themes.pickGamingTheme", () => pickThemeFromPack("Gaming")),
    vscode.commands.registerCommand("my-vsc-themes.pickThemeByPack", pickThemeByPack),
    vscode.commands.registerCommand("my-vsc-themes.enableLightDarkAutoSwitch", enableLightDarkAutoSwitch),
    vscode.commands.registerCommand("my-vsc-themes.enableMonthlyAutoTheme", enableMonthlyAutoTheme),
    vscode.commands.registerCommand("my-vsc-themes.disableMonthlyAutoTheme", disableMonthlyAutoTheme),
    vscode.commands.registerCommand("my-vsc-themes.applyOrangePreset", applyOrangePreset),
    vscode.commands.registerCommand("my-vsc-themes.applyFocusPreset", applyFocusPreset),
    vscode.commands.registerCommand("my-vsc-themes.applyLightPreset", applyLightPreset),
    vscode.commands.registerCommand("my-vsc-themes.applyGamingPreset", applyGamingPreset),
    vscode.commands.registerCommand("my-vsc-themes.enableThemeReactor", enableThemeReactor),
    vscode.commands.registerCommand("my-vsc-themes.disableThemeReactor", disableThemeReactor),
    vscode.commands.registerCommand("my-vsc-themes.applyThemeReactorNow", applyThemeReactorNow),
    vscode.commands.registerCommand("my-vsc-themes.pickReactorFavorite", pickReactorFavorite),
    vscode.commands.registerCommand("my-vsc-themes.randomReactorFavorite", randomReactorFavorite),
    vscode.commands.registerCommand("my-vsc-themes.configureReactorFavorites", configureReactorFavorites),
    vscode.commands.registerCommand("my-vsc-themes.setReactorWorkspaceTheme", setReactorWorkspaceTheme)
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(() => commandCenterProvider.refresh()),
    vscode.workspace.onDidSaveTextDocument((document) => {
      const fileName = path.basename(document.uri.fsPath).toLowerCase();

      if (["package.json", "readme.md", ".gitignore", "license", "license.md"].includes(fileName)) {
        commandCenterProvider.refresh();
      }
    }),
    vscode.workspace.onDidCreateFiles(() => commandCenterProvider.refresh()),
    vscode.workspace.onDidDeleteFiles(() => commandCenterProvider.refresh())
  );

  watchThemeReactor(context);

  setTimeout(() => {
    applyConfiguredStartupTheme();
  }, 1200);
}

function deactivate() {}

module.exports = { activate, deactivate };
