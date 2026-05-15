import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../themes/all-orange-color-theme.json", import.meta.url);
const outputPath = new URL("../themes/all-orange-no-italics-color-theme.json", import.meta.url);

function removeItalicStyle(settings) {
  if (!settings || typeof settings.fontStyle !== "string") {
    return;
  }

  const styles = settings.fontStyle
    .split(/\s+/)
    .filter((style) => style && style !== "italic");

  if (styles.length === 0) {
    delete settings.fontStyle;
    return;
  }

  settings.fontStyle = styles.join(" ");
}

const theme = JSON.parse(await readFile(sourcePath, "utf8"));
theme.name = "All Orange No Italics";

for (const rule of theme.tokenColors ?? []) {
  removeItalicStyle(rule.settings);
}

for (const value of Object.values(theme.semanticTokenColors ?? {})) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    removeItalicStyle(value);
  }
}

await writeFile(outputPath, `${JSON.stringify(theme, null, 2)}\n`, "utf8");
