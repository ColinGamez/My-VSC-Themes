import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const docsDir = new URL("docs/", root);
const docsAssetsDir = new URL("assets/", docsDir);
const docsPreviewDir = new URL("previews/", docsAssetsDir);
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const marketplaceUrl = "https://marketplace.visualstudio.com/items?itemName=ColinGamez.my-vsc-themes";
const releaseUrl = "https://github.com/ColinGamez/My-VSC-Themes/releases/latest";
const repoUrl = "https://github.com/ColinGamez/My-VSC-Themes";

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function themeTone(theme) {
  return theme.type === "light" ? "Light" : "Dark";
}

function themeDescription(label) {
  const descriptions = {
    "All Orange": "Newton orange everywhere, tuned for late-night readability.",
    "All Orange No Italics": "The orange flagship without italic token styling.",
    "Neon Arcade": "Electric blue and hot pink on a midnight shell.",
    "Matcha Grove": "Deep green surfaces with mint and tea-gold syntax.",
    "Peach Soda": "Soft peach daylight with coral accents.",
    "Blue Raspberry": "Cold blue surfaces with raspberry-bright syntax.",
    "Cherry Cola": "Dark cola surfaces with cherry highlights.",
    "Lavender Static": "Violet chrome with cyan signal colors.",
    "Ocean Byte": "Teal-black surfaces with seafoam highlights.",
    "Graphite Pop": "Neutral graphite with bright coding accents.",
    "Honey Terminal": "Warm honey-gold light mode for daytime coding.",
    "Pumpkin Hacker": "Spiced terminal orange with green hacker glow.",
    "Cyber Grape": "Purple cyberpunk surfaces with lime sparks.",
    "Cotton Candy Terminal": "Soft dark candy tones with pink and baby-blue syntax.",
    "XP Dark": "A nostalgic blue-gray dark theme with classic green accents.",
    "Solar Flare": "High-energy solar golds and reds on dark ember UI."
  };

  return descriptions[label] ?? "A handcrafted palette from Colin's theme hub.";
}

function card(item, theme) {
  const slug = slugify(item.label);
  const colors = theme.colors;
  const accent = colors.focusBorder ?? colors["editorCursor.foreground"] ?? "#fa824c";
  const background = colors["editor.background"] ?? "#101114";
  const foreground = colors["editor.foreground"] ?? "#f1f3f5";

  return `<article class="theme-card" data-tone="${theme.type}" style="--card-accent:${accent};--card-bg:${background};--card-fg:${foreground}">
    <a class="preview-link" href="assets/previews/${slug}.png" aria-label="Open ${escapeHtml(item.label)} preview">
      <img src="assets/previews/${slug}.png" alt="${escapeHtml(item.label)} theme preview" loading="lazy">
    </a>
    <div class="theme-card-body">
      <div>
        <h3>${escapeHtml(item.label)}</h3>
        <p>${escapeHtml(themeDescription(item.label))}</p>
      </div>
      <div class="theme-meta">
        <span>${themeTone(theme)}</span>
        <span>${escapeHtml(accent)}</span>
      </div>
    </div>
  </article>`;
}

await mkdir(docsPreviewDir, { recursive: true });
await copyFile(new URL("assets/icon.png", root), new URL("icon.png", docsAssetsDir));

const cards = [];
const themes = [];

for (const item of packageJson.contributes.themes) {
  const slug = slugify(item.label);
  const theme = JSON.parse(await readFile(new URL(item.path.replace("./", ""), root), "utf8"));
  await copyFile(new URL(`assets/previews/${slug}.png`, root), new URL(`${slug}.png`, docsPreviewDir));
  cards.push(card(item, theme));
  themes.push({ label: item.label, tone: theme.type });
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Colin's VS Code Themes</title>
    <meta name="description" content="A colorful VS Code theme hub by ColinGamez.">
    <link rel="icon" href="assets/icon.png">
    <link rel="stylesheet" href="styles.css">
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="#">
        <img src="assets/icon.png" alt="" width="44" height="44">
        <span>Colin's VS Code Themes</span>
      </a>
      <nav aria-label="Primary">
        <a href="#themes">Themes</a>
        <a href="#install">Install</a>
        <a href="${repoUrl}">GitHub</a>
      </nav>
    </header>

    <main>
      <section class="hero">
        <div class="hero-copy">
          <h1>Colorful VS Code themes for switching coding moods fast.</h1>
          <p>Orange-first, neon-ready, and packed with dark and light palettes you can install from the VS Code Marketplace.</p>
          <div class="hero-actions">
            <a class="button primary" href="${marketplaceUrl}">Install from Marketplace</a>
            <a class="button secondary" href="#themes">Browse themes</a>
          </div>
        </div>
        <div class="hero-preview" aria-label="Theme preview collage">
          <img src="assets/previews/all-orange.png" alt="All Orange preview">
          <img src="assets/previews/neon-arcade.png" alt="Neon Arcade preview">
          <img src="assets/previews/blue-raspberry.png" alt="Blue Raspberry preview">
        </div>
      </section>

      <section class="toolbar" aria-label="Theme filters">
        <button type="button" class="filter active" data-filter="all">All</button>
        <button type="button" class="filter" data-filter="dark">Dark</button>
        <button type="button" class="filter" data-filter="light">Light</button>
      </section>

      <section id="themes" class="theme-grid" aria-label="Theme gallery">
        ${cards.join("\n        ")}
      </section>

      <section id="install" class="install">
        <h2>Install from Marketplace</h2>
        <ol>
          <li>Open the Marketplace page or search for <strong>Colin's VS Code Themes</strong> in VS Code Extensions.</li>
          <li>Click <strong>Install</strong>.</li>
          <li>Run <strong>Preferences: Color Theme</strong> and pick a palette.</li>
        </ol>
        <div class="install-actions">
          <a class="button primary" href="${marketplaceUrl}">Marketplace</a>
          <a class="button secondary" href="${releaseUrl}">Manual VSIX</a>
        </div>
      </section>
    </main>

    <footer>
      <span>${themes.length} themes</span>
      <span>Built by ColinGamez</span>
    </footer>
    <script src="script.js"></script>
  </body>
</html>
`;

const css = `:root {
  color-scheme: dark;
  --bg: #090705;
  --surface: #160804;
  --surface-2: #241008;
  --line: #4b1f0e;
  --text: #ffedcf;
  --muted: #c87548;
  --orange: #fa824c;
  --gold: #ffbf69;
  --blue: #00d7ff;
  --pink: #ff4fd8;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-width: 320px;
  background:
    radial-gradient(circle at top left, rgba(250, 130, 76, 0.24), transparent 34rem),
    radial-gradient(circle at 80% 20%, rgba(0, 215, 255, 0.15), transparent 30rem),
    linear-gradient(180deg, #120602 0%, #080504 58%, #050404 100%);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

a {
  color: inherit;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem clamp(1rem, 4vw, 4rem);
  background: rgba(9, 7, 5, 0.82);
  border-bottom: 1px solid rgba(250, 130, 76, 0.24);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--gold);
  font-weight: 800;
  text-decoration: none;
}

.brand img {
  border-radius: 12px;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(0.75rem, 2vw, 1.5rem);
  color: var(--muted);
  font-size: 0.94rem;
  font-weight: 650;
}

nav a {
  text-decoration: none;
}

nav a:hover {
  color: var(--gold);
}

main {
  width: min(1180px, calc(100% - 2rem));
  margin: 0 auto;
}

.hero {
  min-height: 74vh;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(320px, 1.1fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  padding: clamp(4rem, 8vw, 7rem) 0 4rem;
}

.hero h1 {
  margin: 0;
  max-width: 12ch;
  color: #fff4df;
  font-size: clamp(3.1rem, 8vw, 6.8rem);
  line-height: 0.9;
  letter-spacing: 0;
}

.hero p {
  max-width: 38rem;
  margin: 1.5rem 0 0;
  color: var(--gold);
  font-size: clamp(1.05rem, 2vw, 1.35rem);
  line-height: 1.6;
}

.hero-actions,
.install-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.hero-actions {
  margin-top: 2rem;
}

.install-actions {
  margin-top: 1.25rem;
}

.button {
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0 1.05rem;
  border: 1px solid transparent;
  font-weight: 800;
  text-decoration: none;
}

.button.primary {
  background: var(--orange);
  color: #180602;
}

.button.secondary {
  border-color: rgba(255, 191, 105, 0.34);
  color: var(--gold);
  background: rgba(255, 191, 105, 0.08);
}

.hero-preview {
  position: relative;
  min-height: 540px;
  overflow: hidden;
}

.hero-preview img {
  position: absolute;
  width: min(82%, 620px);
  border: 1px solid rgba(255, 191, 105, 0.2);
  border-radius: 14px;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.42);
}

.hero-preview img:nth-child(1) {
  top: 6%;
  right: 0;
}

.hero-preview img:nth-child(2) {
  top: 32%;
  left: 0;
}

.hero-preview img:nth-child(3) {
  right: 8%;
  bottom: 0;
}

.toolbar {
  display: flex;
  gap: 0.65rem;
  margin: 1rem 0 1.5rem;
}

.filter {
  min-height: 38px;
  border: 1px solid rgba(255, 191, 105, 0.26);
  border-radius: 999px;
  padding: 0 1rem;
  background: rgba(255, 191, 105, 0.07);
  color: var(--gold);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
}

.filter.active {
  background: var(--gold);
  color: #180602;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding-bottom: 4rem;
}

.theme-card {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--card-accent), transparent 62%);
  border-radius: 14px;
  background: color-mix(in srgb, var(--card-bg), #000 12%);
}

.preview-link {
  display: block;
  background: var(--card-bg);
}

.theme-card img {
  display: block;
  width: 100%;
  height: auto;
}

.theme-card-body {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  color: var(--card-fg);
}

.theme-card h3 {
  margin: 0;
  font-size: 1.05rem;
}

.theme-card p {
  margin: 0.35rem 0 0;
  color: color-mix(in srgb, var(--card-fg), transparent 28%);
  line-height: 1.45;
}

.theme-meta {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: flex-end;
  color: var(--card-accent);
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 0.78rem;
  white-space: nowrap;
}

.install {
  margin: 0 0 4rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  border: 1px solid rgba(250, 130, 76, 0.28);
  border-radius: 16px;
  background: rgba(22, 8, 4, 0.76);
}

.install h2 {
  margin: 0 0 1rem;
  font-size: clamp(2rem, 4vw, 3.4rem);
}

.install li {
  margin: 0.55rem 0;
  color: var(--gold);
  line-height: 1.55;
}

code {
  color: #fff4df;
}

footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 2rem clamp(1rem, 4vw, 4rem);
  border-top: 1px solid rgba(250, 130, 76, 0.22);
  color: var(--muted);
}

.is-hidden {
  display: none;
}

@media (max-width: 860px) {
  .site-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .hero h1 {
    max-width: 10ch;
  }

  .hero-preview {
    min-height: 390px;
  }

  .hero-preview img {
    width: 78%;
  }

  .theme-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  main {
    width: min(100% - 1rem, 1180px);
  }

  nav {
    width: 100%;
    justify-content: flex-start;
    gap: 1.1rem;
  }

  .hero {
    padding-top: 3rem;
  }

  .hero-preview {
    min-height: 290px;
  }

  .theme-card-body,
  footer {
    flex-direction: column;
  }

  .theme-meta {
    align-items: flex-start;
  }
}
`;

const js = `const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".theme-card");

for (const filter of filters) {
  filter.addEventListener("click", () => {
    const value = filter.dataset.filter;

    for (const item of filters) {
      item.classList.toggle("active", item === filter);
    }

    for (const card of cards) {
      card.classList.toggle("is-hidden", value !== "all" && card.dataset.tone !== value);
    }
  });
}
`;

await writeFile(new URL("index.html", docsDir), html, "utf8");
await writeFile(new URL("styles.css", docsDir), css, "utf8");
await writeFile(new URL("script.js", docsDir), js, "utf8");
await writeFile(new URL(".nojekyll", docsDir), "", "utf8");
