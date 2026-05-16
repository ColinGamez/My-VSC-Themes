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
