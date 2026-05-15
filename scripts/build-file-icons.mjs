import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const iconDir = new URL("../fileicons/", import.meta.url);
const imageDir = new URL("images/", iconDir);

const icons = {
  file: ["#ffbf69", "#fa824c", "doc"],
  folder: ["#fa824c", "#ffbf69", "dir"],
  folderOpen: ["#ff9f68", "#ffdc8a", "open"],
  js: ["#f7df1e", "#1f1600", "JS"],
  ts: ["#3178c6", "#d9f2ff", "TS"],
  json: ["#ffbf69", "#180602", "{}"],
  html: ["#e34c26", "#fff0d9", "<>"],
  css: ["#2f80ed", "#e6f7ff", "#"],
  vue: ["#42b883", "#10291f", "V"],
  py: ["#3776ab", "#ffe873", "PY"],
  rb: ["#cc342d", "#ffe6e3", "RB"],
  md: ["#8ea7ff", "#0d1024", "MD"],
  image: ["#ff5fa2", "#fffafc", "img"],
  lock: ["#c87548", "#180602", "key"],
  npm: ["#cb3837", "#fffafa", "npm"],
  git: ["#f05032", "#fff1e6", "git"],
  config: ["#7dd3fc", "#06111f", "cfg"]
};

function fileSvg([fill, foreground, label]) {
  const escapedLabel = escapeXml(label);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="#180602"/>
    <path d="M18 8h20l12 12v36H18z" fill="${fill}"/>
    <path d="M38 8v13h12" fill="#ffffff" opacity=".35"/>
    <rect x="14" y="35" width="36" height="17" rx="5" fill="${foreground}" opacity=".95"/>
    <text x="32" y="47" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="800" fill="${fill}">${escapedLabel}</text>
  </svg>`;
}

function folderSvg([fill, foreground, label], open = false) {
  const body = open ? "M7 22h50l-6 32H13z" : "M7 18h19l6 7h25v29H7z";
  const escapedLabel = escapeXml(label);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="#180602"/>
    <path d="M7 18h19l6 7h25v8H7z" fill="${foreground}" opacity=".75"/>
    <path d="${body}" fill="${fill}"/>
    <text x="32" y="46" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="800" fill="#180602">${escapedLabel}</text>
  </svg>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function writePng(name, svg) {
  await sharp(Buffer.from(svg)).png().toFile(fileURLToPath(new URL(`images/${name}.png`, iconDir)));
}

await mkdir(imageDir, { recursive: true });

for (const [name, icon] of Object.entries(icons)) {
  const svg = name === "folder" || name === "folderOpen" ? folderSvg(icon, name === "folderOpen") : fileSvg(icon);
  await writePng(name, svg);
}

const definition = (name) => ({ iconPath: `./images/${name}.png` });

const theme = {
  iconDefinitions: Object.fromEntries(Object.keys(icons).map((name) => [`_${name}`, definition(name)])),
  file: "_file",
  folder: "_folder",
  folderExpanded: "_folderOpen",
  rootFolder: "_folder",
  rootFolderExpanded: "_folderOpen",
  folderNames: {
    ".git": "_git",
    ".github": "_git",
    ".vscode": "_config",
    "node_modules": "_npm",
    "assets": "_image",
    "docs": "_md",
    "themes": "_folder",
    "scripts": "_config"
  },
  fileExtensions: {
    js: "_js",
    jsx: "_js",
    mjs: "_js",
    cjs: "_js",
    ts: "_ts",
    tsx: "_ts",
    json: "_json",
    html: "_html",
    css: "_css",
    vue: "_vue",
    py: "_py",
    rb: "_rb",
    md: "_md",
    png: "_image",
    jpg: "_image",
    jpeg: "_image",
    gif: "_image",
    webp: "_image",
    lock: "_lock",
    yml: "_config",
    yaml: "_config"
  },
  fileNames: {
    "package.json": "_npm",
    "package-lock.json": "_lock",
    ".gitignore": "_git",
    ".vscodeignore": "_config",
    "README.md": "_md",
    "CHANGELOG.md": "_md",
    "SUPPORT.md": "_md"
  },
  languageIds: {
    javascript: "_js",
    typescript: "_ts",
    json: "_json",
    html: "_html",
    css: "_css",
    vue: "_vue",
    python: "_py",
    ruby: "_rb",
    markdown: "_md"
  }
};

await writeFile(new URL("colins-color-icons-icon-theme.json", iconDir), `${JSON.stringify(theme, null, 2)}\n`, "utf8");
