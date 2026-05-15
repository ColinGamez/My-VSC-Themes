const vscode = require("vscode");

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

async function setTheme(label, detail) {
  await vscode.workspace
    .getConfiguration("workbench")
    .update("colorTheme", label, vscode.ConfigurationTarget.Global);
  vscode.window.showInformationMessage(`Colin's Themes: switched to ${label}${detail ? ` (${detail})` : ""}.`);
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

async function applyConfiguredStartupTheme() {
  const config = vscode.workspace.getConfiguration("myVscThemes");

  if (!config.get("autoApplyOnStartup")) {
    return;
  }

  if (config.get("autoMode") === "holiday") {
    await applyHolidayTheme();
    return;
  }

  await applySeasonalTheme();
}

function activate(context) {
  context.subscriptions.push(
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
    vscode.commands.registerCommand("my-vsc-themes.applyGamingPreset", applyGamingPreset)
  );

  setTimeout(() => {
    applyConfiguredStartupTheme();
  }, 1200);
}

function deactivate() {}

module.exports = { activate, deactivate };
