import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const docsDir = new URL("docs/", root);
const docsAssetsDir = new URL("assets/", docsDir);
const docsPreviewDir = new URL("previews/", docsAssetsDir);
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const marketplaceUrl = "https://marketplace.visualstudio.com/items?itemName=ColinGamez.my-vsc-themes";
const releaseUrl = "https://github.com/ColinGamez/My-VSC-Themes/releases/latest";
const repoUrl = "https://github.com/ColinGamez/My-VSC-Themes";
const packDisplay = {
  orange: "Orange Core",
  core: "Color Moods",
  seasonal: "Seasonal",
  holiday: "Holiday",
  gaming: "Gaming"
};
const packDescriptions = {
  orange: "The orange-first flagship themes and readability variants.",
  core: "Colorful dark and light moods for everyday coding.",
  seasonal: "Spring, summer, autumn, and winter rotations.",
  holiday: "Event-ready palettes for October, December, New Year, Valentine's, and birthdays.",
  gaming: "Arcade, cyber, fantasy, and cockpit-inspired coding palettes."
};

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

function themePack(label) {
  const orange = new Set(["All Orange", "All Orange No Italics", "All Orange Soft", "All Orange High Contrast"]);
  const seasonal = new Set(["Spring Bloom", "Summer Sunset", "Autumn Ember", "Winter Aurora"]);
  const holiday = new Set(["Halloween Midnight", "Candy Cane Code", "Valentine Glow", "New Year Neon", "Birthday Confetti"]);
  const gaming = new Set(["Voxel Craft", "Cyber Runner", "Retro Console", "Starfighter HUD", "Quest Tavern"]);

  if (orange.has(label)) {
    return "orange";
  }

  if (seasonal.has(label)) {
    return "seasonal";
  }

  if (holiday.has(label)) {
    return "holiday";
  }

  if (gaming.has(label)) {
    return "gaming";
  }

  return "core";
}

function themeDescription(label) {
  const descriptions = {
    "All Orange": "Newton orange everywhere, tuned for late-night readability.",
    "All Orange No Italics": "The orange flagship without italic token styling.",
    "All Orange Soft": "A gentler orange variant with warmer contrast and softer edges.",
    "All Orange High Contrast": "The orange flagship pushed darker and brighter for extra punch.",
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
    "Solar Flare": "High-energy solar golds and reds on dark ember UI.",
    "Spring Bloom": "Fresh light mode with green growth and pink accents.",
    "Summer Sunset": "Warm sunset chrome with coral heat and cool blue functions.",
    "Autumn Ember": "Dark harvest tones with ember orange and mellow gold syntax.",
    "Winter Aurora": "Icy blue surfaces with aurora violet and mint highlights.",
    "Halloween Midnight": "Purple midnight surfaces with orange syntax and sharp green highlights.",
    "Candy Cane Code": "Crisp light mode with red, green, and gold holiday syntax.",
    "Valentine Glow": "Deep pink surfaces with soft rose syntax and warm highlights.",
    "New Year Neon": "Midnight celebration colors with gold, cyan, and pink accents.",
    "Birthday Confetti": "Bright light mode with playful color bursts.",
    "Voxel Craft": "Blocky green-and-earth coding colors with teal functions.",
    "Cyber Runner": "High-speed cyber color with cyan, magenta, and acid yellow.",
    "Retro Console": "Green-screen arcade tone with electric syntax.",
    "Starfighter HUD": "Space cockpit blues with orange alerts and bright HUD syntax.",
    "Quest Tavern": "Warm RPG palette with wood tones, gold syntax, and green strings."
  };

  return descriptions[label] ?? "A handcrafted palette from Colin's theme hub.";
}

function card(item, theme) {
  const slug = slugify(item.label);
  const colors = theme.colors;
  const accent = colors.focusBorder ?? colors["editorCursor.foreground"] ?? "#fa824c";
  const background = colors["editor.background"] ?? "#101114";
  const foreground = colors["editor.foreground"] ?? "#f1f3f5";

  const pack = themePack(item.label);
  const description = themeDescription(item.label);
  const search = `${item.label} ${themeTone(theme)} ${packDisplay[pack]} ${description}`.toLowerCase();

  return `<article class="theme-card" data-tone="${theme.type}" data-pack="${pack}" data-search="${escapeHtml(search)}" style="--card-accent:${accent};--card-bg:${background};--card-fg:${foreground}">
    <a class="preview-link" href="assets/previews/${slug}.png" aria-label="Open ${escapeHtml(item.label)} preview">
      <img src="assets/previews/${slug}.png" alt="${escapeHtml(item.label)} theme preview" loading="lazy">
    </a>
    <div class="theme-card-body">
      <div>
        <h3>${escapeHtml(item.label)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
      <div class="theme-meta">
        <span>${themeTone(theme)}</span>
        <span>${packDisplay[pack]}</span>
        <span>${escapeHtml(accent)}</span>
      </div>
    </div>
    <div class="theme-card-actions">
      <a class="mini-action" href="assets/previews/${slug}.png">Open preview</a>
      <button type="button" class="mini-action copy-theme" data-theme="${escapeHtml(item.label)}">Copy name</button>
    </div>
  </article>`;
}

await mkdir(docsPreviewDir, { recursive: true });
await copyFile(new URL("assets/icon.png", root), new URL("icon.png", docsAssetsDir));
await copyFile(new URL("assets/brand-banner.png", root), new URL("brand-banner.png", docsAssetsDir));
await copyFile(new URL("assets/social-preview.png", root), new URL("social-preview.png", docsAssetsDir));

const cardsByPack = new Map();
const themes = [];
const packOrder = ["orange", "core", "seasonal", "holiday", "gaming"];

for (const item of packageJson.contributes.themes) {
  const slug = slugify(item.label);
  const theme = JSON.parse(await readFile(new URL(item.path.replace("./", ""), root), "utf8"));
  await copyFile(new URL(`assets/previews/${slug}.png`, root), new URL(`${slug}.png`, docsPreviewDir));
  const pack = themePack(item.label);
  const packCards = cardsByPack.get(pack) ?? [];
  packCards.push(card(item, theme));
  cardsByPack.set(pack, packCards);
  themes.push({ label: item.label, tone: theme.type });
}

const themeSections = packOrder
  .filter((pack) => cardsByPack.has(pack))
  .map((pack) => `<section class="pack-section" data-pack-section="${pack}">
        <div class="pack-heading">
          <h2>${packDisplay[pack]}</h2>
          <p>${packDescriptions[pack]}</p>
        </div>
        <div class="theme-grid" aria-label="${packDisplay[pack]} themes">
          ${cardsByPack.get(pack).join("\n          ")}
        </div>
      </section>`)
  .join("\n\n      ");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Colin's VS Code Themes</title>
    <meta name="description" content="A colorful VS Code theme hub by ColinGamez.">
    <meta property="og:image" content="assets/social-preview.png">
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
        <a href="#commands">Commands</a>
        <a href="#install">Install</a>
        <a href="#auto-switch">Auto Switch</a>
        <a href="${repoUrl}">GitHub</a>
      </nav>
    </header>

    <main>
      <section class="hero">
        <div class="hero-copy">
          <h1>Colorful VS Code themes for switching coding moods fast.</h1>
          <p>${themes.length} themes across orange classics, seasonal palettes, holiday looks, gaming-inspired code moods, file icons, and settings presets.</p>
          <div class="hero-actions">
            <a class="button primary" href="${marketplaceUrl}">Install from Marketplace</a>
            <a class="button secondary" href="#themes">Browse themes</a>
          </div>
        </div>
        <div class="hero-preview" aria-label="Theme preview collage">
          <img src="assets/previews/all-orange.png" alt="All Orange preview">
          <img src="assets/previews/halloween-midnight.png" alt="Halloween Midnight preview">
          <img src="assets/previews/starfighter-hud.png" alt="Starfighter HUD preview">
        </div>
      </section>

      <section class="toolbar" aria-label="Theme filters">
        <button type="button" class="filter active" data-filter="all">All</button>
        <button type="button" class="filter" data-filter="dark">Dark</button>
        <button type="button" class="filter" data-filter="light">Light</button>
        <button type="button" class="filter" data-filter="orange">Orange</button>
        <button type="button" class="filter" data-filter="core">Color</button>
        <button type="button" class="filter" data-filter="seasonal">Seasonal</button>
        <button type="button" class="filter" data-filter="holiday">Holiday</button>
        <button type="button" class="filter" data-filter="gaming">Gaming</button>
      </section>

      <section class="control-panel" aria-label="Theme search">
        <label class="search-box">
          <span>Search themes</span>
          <input id="theme-search" type="search" placeholder="orange, winter, gaming, light..." autocomplete="off">
        </label>
        <span id="theme-count">${themes.length} themes</span>
      </section>

      <section id="themes" class="theme-gallery" aria-label="Theme gallery">
        ${themeSections}
      </section>

      <section id="commands" class="install">
        <h2>Command Palette helpers</h2>
        <p>Run these from <strong>Command Palette</strong> after installing the extension.</p>
        <ul class="command-list">
          <li><code>Colin's Themes: Apply Current Seasonal Theme</code></li>
          <li><code>Colin's Themes: Apply Current Holiday Theme</code></li>
          <li><code>Colin's Themes: Pick Gaming Theme</code></li>
          <li><code>Colin's Themes: Pick Theme By Pack</code></li>
          <li><code>Colin's Themes: Enable Light/Dark Auto Switch</code></li>
          <li><code>Colin's Themes: Apply Orange Coding Preset</code></li>
          <li><code>Colin's Themes: Apply Focus Preset</code></li>
          <li><code>Colin's Themes: Apply Light Coding Preset</code></li>
          <li><code>Colin's Themes: Apply Gaming Preset</code></li>
        </ul>
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

      <section id="auto-switch" class="install">
        <h2>Auto-switching setup</h2>
        <p>Use VS Code's built-in color scheme detection to pair one light theme with one dark theme.</p>
        <pre><code>{
  "window.autoDetectColorScheme": true,
  "workbench.preferredLightColorTheme": "Spring Bloom",
  "workbench.preferredDarkColorTheme": "All Orange"
}</code></pre>
        <a class="button secondary" href="auto-switching.md">More theme rotation ideas</a>
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
  flex-wrap: wrap;
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

.control-panel {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 0 2rem;
  padding: 1rem;
  border: 1px solid rgba(250, 130, 76, 0.24);
  border-radius: 14px;
  background: rgba(22, 8, 4, 0.64);
}

.search-box {
  display: grid;
  gap: 0.45rem;
  width: min(100%, 34rem);
  color: var(--gold);
  font-weight: 800;
}

.search-box input {
  width: 100%;
  min-height: 46px;
  border: 1px solid rgba(255, 191, 105, 0.26);
  border-radius: 8px;
  padding: 0 0.95rem;
  background: rgba(8, 5, 4, 0.78);
  color: var(--text);
  font: inherit;
}

#theme-count {
  color: var(--muted);
  font-family: "Cascadia Code", Consolas, monospace;
}

.theme-gallery {
  padding-bottom: 2rem;
}

.pack-section {
  scroll-margin-top: 6rem;
  margin: 0 0 3rem;
}

.pack-heading {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
  margin: 0 0 1rem;
}

.pack-heading h2 {
  margin: 0;
  color: #fff4df;
  font-size: clamp(1.8rem, 4vw, 3rem);
}

.pack-heading p {
  max-width: 32rem;
  margin: 0;
  color: var(--gold);
  line-height: 1.5;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr));
  gap: 1rem;
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

.theme-card-actions {
  display: flex;
  gap: 0.6rem;
  padding: 0 1rem 1rem;
}

.mini-action {
  min-height: 34px;
  border: 1px solid color-mix(in srgb, var(--card-accent), transparent 55%);
  border-radius: 8px;
  padding: 0.45rem 0.7rem;
  background: color-mix(in srgb, var(--card-bg), #ffffff 5%);
  color: var(--card-accent);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
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

.command-list {
  padding-left: 1.25rem;
}

code {
  color: #fff4df;
}

pre {
  overflow-x: auto;
  border: 1px solid rgba(255, 191, 105, 0.24);
  border-radius: 8px;
  padding: 1rem;
  background: rgba(8, 5, 4, 0.7);
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

  .control-panel,
  .pack-heading {
    align-items: flex-start;
    flex-direction: column;
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
const sections = document.querySelectorAll(".pack-section");
const search = document.querySelector("#theme-search");
const count = document.querySelector("#theme-count");
const copyButtons = document.querySelectorAll(".copy-theme");
let activeFilter = "all";

function applyFilters() {
  const query = search.value.trim().toLowerCase();
  let visibleCount = 0;

  for (const card of cards) {
    const isTone = activeFilter === "dark" || activeFilter === "light";
    const matchesFilter = activeFilter === "all" || (isTone ? card.dataset.tone === activeFilter : card.dataset.pack === activeFilter);
    const matchesSearch = query.length === 0 || card.dataset.search.includes(query);
    const isVisible = matchesFilter && matchesSearch;
    card.classList.toggle("is-hidden", !isVisible);

    if (isVisible) {
      visibleCount += 1;
    }
  }

  for (const section of sections) {
    const hasVisibleCard = [...section.querySelectorAll(".theme-card")].some((card) => !card.classList.contains("is-hidden"));
    section.classList.toggle("is-hidden", !hasVisibleCard);
  }

  count.textContent = visibleCount === 1 ? "1 theme" : \`\${visibleCount} themes\`;
}

for (const filter of filters) {
  filter.addEventListener("click", () => {
    activeFilter = filter.dataset.filter;

    for (const item of filters) {
      item.classList.toggle("active", item === filter);
    }

    applyFilters();
  });
}

search.addEventListener("input", applyFilters);

for (const button of copyButtons) {
  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(button.dataset.theme);
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = "Copy name";
    }, 1200);
  });
}
`;

await writeFile(new URL("index.html", docsDir), html, "utf8");
await writeFile(new URL("styles.css", docsDir), css, "utf8");
await writeFile(new URL("script.js", docsDir), js, "utf8");
await writeFile(new URL(".nojekyll", docsDir), "", "utf8");
