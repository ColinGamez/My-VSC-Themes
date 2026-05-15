import { readFile, writeFile } from "node:fs/promises";

const sourcePath = new URL("../themes/all-orange-color-theme.json", import.meta.url);

function replaceColors(value, palette) {
  if (typeof value === "string") {
    return palette[value.toLowerCase()] ?? value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceColors(item, palette));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, replaceColors(item, palette)])
    );
  }

  return value;
}

async function writeVariant({ name, file, palette, tweaks }) {
  const base = JSON.parse(await readFile(sourcePath, "utf8"));
  const theme = replaceColors(base, palette);
  theme.name = name;

  tweaks?.(theme);

  await writeFile(new URL(`../themes/${file}`, import.meta.url), `${JSON.stringify(theme, null, 2)}\n`, "utf8");
}

await writeVariant({
  name: "All Orange Soft",
  file: "all-orange-soft-color-theme.json",
  palette: {
    "#180602": "#1a0d08",
    "#210803": "#25110a",
    "#2b0d04": "#2f160d",
    "#381206": "#3a1d12",
    "#4a1808": "#4d2818",
    "#6b260f": "#6f3a22",
    "#793016": "#7f472c",
    "#823014": "#8b4b2b",
    "#8f2d13": "#9a4325",
    "#a65b35": "#b07a58",
    "#a84a22": "#b76b42",
    "#c87548": "#d89a73",
    "#fa824c": "#ff9f68",
    "#ffb86b": "#ffc58d",
    "#ffbf69": "#ffd59a",
    "#ffd7a1": "#ffe0b8",
    "#ffedcf": "#fff0d9",
    "#fff4df": "#fff3e2",
    "#ff5d38": "#ff7558"
  },
  tweaks(theme) {
    theme.colors["editor.lineHighlightBackground"] = "#25110a";
    theme.colors["editor.selectionBackground"] = "#ff9f6840";
  }
});

await writeVariant({
  name: "All Orange High Contrast",
  file: "all-orange-high-contrast-color-theme.json",
  palette: {
    "#180602": "#080201",
    "#210803": "#100401",
    "#2b0d04": "#160501",
    "#381206": "#1e0702",
    "#4a1808": "#2b0a02",
    "#6b260f": "#4f1605",
    "#793016": "#77280e",
    "#823014": "#8c2f12",
    "#8f2d13": "#b83414",
    "#a65b35": "#c86b3a",
    "#a84a22": "#d95822",
    "#c87548": "#f08b57",
    "#fa824c": "#ff8a3d",
    "#ffb86b": "#ffd08a",
    "#ffbf69": "#ffdc8a",
    "#ffd7a1": "#ffe4ad",
    "#ffedcf": "#fff8e8",
    "#fff4df": "#fff8e8",
    "#ff5d38": "#ff3b1f"
  },
  tweaks(theme) {
    theme.colors["editor.foreground"] = "#fff8e8";
    theme.colors["sideBar.foreground"] = "#fff8e8";
    theme.colors["statusBar.foreground"] = "#fff8e8";
    theme.colors["terminal.foreground"] = "#fff8e8";
    theme.colors["editor.lineHighlightBorder"] = "#d95822";
    theme.colors["editor.selectionBackground"] = "#ff8a3d55";
  }
});
