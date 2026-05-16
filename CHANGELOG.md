# Changelog

## 1.9.1

- Split the extension internals into focused modules for Command Center, README Studio, Snippet Forge, Theme Reactor, theme data, and shared project utilities.
- Slimmed the extension entry point down to registration only so the suite is easier to maintain and expand.
- Kept the public command surface and theme behavior unchanged while polishing the codebase for future tools.

## 1.9.0

- Added Snippet Forge for turning selected editor code into reusable VS Code snippets.
- Added repeated identifier detection so selected identifiers can become snippet tab-stop placeholders.
- Added generated snippet preview, copy-to-clipboard, workspace snippet save, and workspace snippet open flows.
- Added a right-click editor menu entry for forging snippets from selected code.

## 1.8.1

- Polished README Studio preview rendering for badges, images, links, tables, inline code, strong text, and blockquotes.
- Kept README Studio to a single reusable panel and added an empty README save guard.
- Hardened Theme Reactor background updates so startup or timer errors are logged instead of surfacing as unhandled failures.
- Tightened Marketplace metadata and README wording for the suite tools.

## 1.8.0

- Added README Studio alpha as a full VS Code webview for generating and previewing project README files.
- Added README Studio project detection for package scripts, repository links, Marketplace extension badges, install commands, usage commands, and project health.
- Added actions to reuse an existing README, copy generated Markdown, open README.md, and save the generated README.
- Added README Studio entry points from the Command Palette and Project Command Center.

## 1.7.0

- Added Project Command Center alpha in a new Colin's Suite activity bar view.
- Added workspace detection for project type, package scripts, Git branch/status, repository links, and project health basics.
- Added one-click actions for best script, terminal, README, repository, missing starter files, and Theme Reactor shortcuts.
- Added Command Palette commands for opening and refreshing Command Center, running project scripts, opening the terminal/repository, and creating missing basics.

## 1.6.0

- Added Theme Reactor alpha with hybrid, time-of-day, seasonal, holiday, random favorite, and workspace theme switching.
- Added Theme Reactor settings for schedules, favorites, mode, workspace overrides, and automatic switching.
- Added Theme Reactor command palette actions for enable, disable, apply now, favorites, random favorites, and workspace themes.
- Updated auto-switching docs with Theme Reactor setup examples.

## 1.5.0

- Added brand banner, logo mark, and social preview image generation.
- Added real VS Code screenshots captured from an isolated local VS Code profile.
- Added CI workflow for build, contrast checks, packaging, and VSIX artifact upload.
- Added manual release workflow for GitHub releases and optional Marketplace publishing.
- Added settings preset commands for orange, focus, light, and gaming coding setups.
- Added reusable screenshot capture script.

## 1.4.0

- Added VS Code commands for seasonal, holiday, gaming, and pack-based theme switching.
- Added startup seasonal auto-apply settings.
- Added the Colin's Color Icons file icon theme.
- Added All Orange Soft and All Orange High Contrast variants.
- Upgraded the sampler page with pack sections, search, copy-theme buttons, and command docs.
- Tuned docs for the new command and icon features.

## 1.3.0

- Added Holiday themes: Halloween Midnight, Candy Cane Code, Valentine Glow, New Year Neon, and Birthday Confetti.
- Added Gaming themes: Voxel Craft, Cyber Runner, Retro Console, Starfighter HUD, and Quest Tavern.
- Added auto-switching documentation for VS Code light/dark theme settings.
- Added a theme contrast quality check script.
- Polished Marketplace README copy and theme pack organization.

## 1.2.0

- Added Seasonal themes: Spring Bloom, Summer Sunset, Autumn Ember, and Winter Aurora.
- Updated previews, README, and the GitHub Pages sampler.

## 1.1.0

- Expanded the pack beyond All Orange with additional dark and light themes.
- Added generated preview images and a GitHub Pages sampler.

## 1.0.0

- Initial All Orange theme release.
