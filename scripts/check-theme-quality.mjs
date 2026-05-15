import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

const coreChecks = [
  ["editor.foreground", "editor.background", 4.5],
  ["sideBar.foreground", "sideBar.background", 4.5],
  ["statusBar.foreground", "statusBar.background", 4.5],
  ["terminal.foreground", "terminal.background", 4.5],
  ["editorLineNumber.activeForeground", "editor.background", 3],
  ["editorCursor.foreground", "editor.background", 3]
];

function parseHex(value) {
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value ?? "")) {
    return null;
  }

  return [1, 3, 5].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
}

function channel(value) {
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  const [red, green, blue] = rgb.map(channel);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(foreground, background) {
  const fg = parseHex(foreground);
  const bg = parseHex(background);

  if (!fg || !bg) {
    return null;
  }

  const lighter = Math.max(luminance(fg), luminance(bg));
  const darker = Math.min(luminance(fg), luminance(bg));
  return (lighter + 0.05) / (darker + 0.05);
}

function tokenForegrounds(theme) {
  const colors = [];

  for (const token of theme.tokenColors ?? []) {
    const foreground = token.settings?.foreground;

    if (foreground && !token.settings?.background) {
      colors.push({ label: Array.isArray(token.scope) ? token.scope[0] : token.scope, foreground });
    }
  }

  for (const [label, value] of Object.entries(theme.semanticTokenColors ?? {})) {
    const foreground = typeof value === "string" ? value : value?.foreground;

    if (foreground) {
      colors.push({ label: `semantic:${label}`, foreground });
    }
  }

  return colors;
}

const failures = [];

for (const item of packageJson.contributes.themes) {
  const theme = JSON.parse(await readFile(new URL(item.path.replace("./", ""), root), "utf8"));
  const colors = theme.colors ?? {};
  const editorBackground = colors["editor.background"];

  for (const [foregroundKey, backgroundKey, minimum] of coreChecks) {
    const ratio = contrast(colors[foregroundKey], colors[backgroundKey]);

    if (ratio === null || ratio < minimum) {
      failures.push(`${item.label}: ${foregroundKey} on ${backgroundKey} is ${ratio?.toFixed(2) ?? "invalid"}; expected ${minimum}+`);
    }
  }

  for (const token of tokenForegrounds(theme)) {
    const ratio = contrast(token.foreground, editorBackground);
    const minimum = token.label.includes("comment") ? 2.7 : 3;

    if (ratio === null || ratio < minimum) {
      failures.push(`${item.label}: ${token.label} token is ${ratio?.toFixed(2) ?? "invalid"}; expected ${minimum}+`);
    }
  }
}

if (failures.length > 0) {
  console.error(`Theme quality check found ${failures.length} contrast issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Theme quality check passed for ${packageJson.contributes.themes.length} themes.`);
}
