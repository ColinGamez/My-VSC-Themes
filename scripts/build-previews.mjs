import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const previewDir = new URL("assets/previews/", root);
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function themeColor(theme, key, fallback) {
  return theme.colors?.[key] ?? fallback;
}

function tokenColor(theme, scope, fallback) {
  for (const rule of theme.tokenColors ?? []) {
    const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
    if (scopes.includes(scope)) {
      return rule.settings?.foreground ?? fallback;
    }
  }

  return fallback;
}

function line(y, parts) {
  let x = 104;
  const spans = parts
    .map(([text, fill]) => {
      const escaped = escapeXml(text);
      const span = `<tspan x="${x}" y="${y}" fill="${fill}">${escaped}</tspan>`;
      x += text.length * 9.6;
      return span;
    })
    .join("");

  return `<text font-family="'Cascadia Code', Consolas, monospace" font-size="18">${spans}</text>`;
}

function swatch(x, color, label, textColor) {
  return `
    <rect x="${x}" y="412" width="84" height="44" rx="10" fill="${color}" />
    <text x="${x + 42}" y="440" text-anchor="middle" font-family="'Cascadia Code', Consolas, monospace" font-size="13" fill="${textColor}">${escapeXml(label)}</text>
  `;
}

function previewSvg(item, theme) {
  const bg = themeColor(theme, "editor.background", "#101114");
  const panel = themeColor(theme, "sideBar.background", bg);
  const tab = themeColor(theme, "tab.activeBackground", panel);
  const lineColor = themeColor(theme, "editorGroup.border", "#333333");
  const fg = themeColor(theme, "editor.foreground", "#f1f3f5");
  const muted = themeColor(theme, "editorLineNumber.foreground", "#8d96a3");
  const accent = themeColor(theme, "focusBorder", "#7dd3fc");
  const accent2 = theme.semanticTokenColors?.decorator ?? tokenColor(theme, "entity.name.tag", accent);
  const string = tokenColor(theme, "string", fg);
  const keyword = tokenColor(theme, "keyword", accent);
  const func = tokenColor(theme, "entity.name.function", accent);
  const type = tokenColor(theme, "entity.name.type", accent);
  const property = tokenColor(theme, "property", fg);
  const comment = tokenColor(theme, "comment", muted);
  const number = tokenColor(theme, "constant.numeric", accent);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540" role="img" aria-label="${escapeXml(item.label)} theme preview">
  <rect width="960" height="540" fill="${bg}" />
  <rect x="0" y="0" width="960" height="58" fill="${tab}" />
  <rect x="0" y="58" width="78" height="482" fill="${panel}" />
  <rect x="78" y="58" width="236" height="482" fill="${panel}" opacity="0.96" />
  <rect x="314" y="58" width="646" height="482" fill="${bg}" />
  <rect x="0" y="58" width="960" height="1" fill="${lineColor}" />
  <rect x="313" y="58" width="1" height="482" fill="${lineColor}" />
  <circle cx="32" cy="28" r="7" fill="${accent}" />
  <circle cx="58" cy="28" r="7" fill="${accent2}" />
  <circle cx="84" cy="28" r="7" fill="${string}" />
  <text x="120" y="35" font-family="Inter, Segoe UI, sans-serif" font-size="19" font-weight="700" fill="${fg}">${escapeXml(item.label)}</text>
  <text x="42" y="110" text-anchor="middle" font-family="'Cascadia Code', Consolas, monospace" font-size="24" fill="${accent}">{}</text>
  <text x="42" y="164" text-anchor="middle" font-family="'Cascadia Code', Consolas, monospace" font-size="24" fill="${muted}">git</text>
  <text x="42" y="218" text-anchor="middle" font-family="'Cascadia Code', Consolas, monospace" font-size="24" fill="${accent2}">run</text>
  <text x="108" y="104" font-family="Inter, Segoe UI, sans-serif" font-size="15" font-weight="700" fill="${fg}">THEMES</text>
  <text x="108" y="138" font-family="Inter, Segoe UI, sans-serif" font-size="15" fill="${accent}">src</text>
  <text x="132" y="170" font-family="Inter, Segoe UI, sans-serif" font-size="15" fill="${fg}">palette.ts</text>
  <text x="132" y="202" font-family="Inter, Segoe UI, sans-serif" font-size="15" fill="${fg}">preview.vue</text>
  <text x="132" y="234" font-family="Inter, Segoe UI, sans-serif" font-size="15" fill="${muted}">README.md</text>
  <text x="360" y="102" font-family="'Cascadia Code', Consolas, monospace" font-size="14" fill="${muted}">1</text>
  <text x="360" y="136" font-family="'Cascadia Code', Consolas, monospace" font-size="14" fill="${muted}">2</text>
  <text x="360" y="170" font-family="'Cascadia Code', Consolas, monospace" font-size="14" fill="${muted}">3</text>
  <text x="360" y="204" font-family="'Cascadia Code', Consolas, monospace" font-size="14" fill="${muted}">4</text>
  <text x="360" y="238" font-family="'Cascadia Code', Consolas, monospace" font-size="14" fill="${muted}">5</text>
  <text x="360" y="272" font-family="'Cascadia Code', Consolas, monospace" font-size="14" fill="${muted}">6</text>
  <text x="360" y="306" font-family="'Cascadia Code', Consolas, monospace" font-size="14" fill="${muted}">7</text>
  ${line(102, [["const ", keyword], ["theme", fg], [" = ", fg], ["createTheme", func], ["({", fg]])}
  ${line(136, [["  ", fg], ["name", property], [": ", fg], [`"${item.label}"`, string], [",", fg]])}
  ${line(170, [["  ", fg], ["type", property], [": ", fg], [`"${theme.type}"`, string], [",", fg]])}
  ${line(204, [["  ", fg], ["accent", property], [": ", fg], [`"${accent}"`, string], [",", fg]])}
  ${line(238, [["  ", fg], ["tokens", property], [": ", fg], [String(theme.tokenColors?.length ?? 0), number], [",", fg]])}
  ${line(272, [["  ", fg], ["variant", property], [": ", fg], ["new ", keyword], ["Palette", type], ["()", fg]])}
  ${line(306, [["});", fg], [" // ready for late-night code", comment]])}
  ${swatch(392, bg, "bg", fg)}
  ${swatch(492, accent, "accent", themeColor(theme, "button.foreground", bg))}
  ${swatch(592, string, "string", bg)}
  ${swatch(692, keyword, "keyword", bg)}
  ${swatch(792, func, "func", bg)}
  <rect x="314" y="516" width="646" height="24" fill="${themeColor(theme, "statusBar.background", panel)}" />
  <text x="336" y="532" font-family="Inter, Segoe UI, sans-serif" font-size="12" fill="${themeColor(theme, "statusBar.foreground", fg)}">Colin's VS Code Themes</text>
</svg>
`;
}

await mkdir(previewDir, { recursive: true });

for (const item of packageJson.contributes.themes) {
  const themePath = new URL(item.path.replace("./", ""), root);
  const theme = JSON.parse(await readFile(themePath, "utf8"));
  const svg = previewSvg(item, theme);
  const outputPath = new URL(`${slugify(item.label)}.png`, previewDir);

  await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(outputPath));
}
