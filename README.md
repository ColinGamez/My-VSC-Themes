# Colin's VS Code Themes

A small VS Code theme hub with orange, neon, matcha, and peach palettes.

## Themes

- **All Orange**: the main theme, with italic comments and emphasis.
- **All Orange No Italics**: the same palette without italic styling.
- **Neon Arcade**: electric blue, hot pink, and golden syntax on a midnight UI.
- **Matcha Grove**: deep green workbench surfaces with mint and tea-gold syntax.
- **Peach Soda**: a soft light theme with peach UI, coral accents, and readable warm text.

After changing theme sources, run `npm run build` to regenerate derived themes.

## Test Locally

Open this folder in VS Code, run **Run > Start Debugging**, and choose a theme in the Extension Development Host.

Open files from `demos/` while tuning the theme so you can check JavaScript, React, Vue, Python, Ruby, HTML, CSS, and JSON scopes quickly.

## Inspect Scopes

In the Extension Development Host, run **Developer: Inspect Editor Tokens and Scopes** from the Command Palette. Click a token to see the TextMate scopes and semantic token data that the theme can target.

## Optional Higher-Contrast Sidebar

If you like the editor colors but want the side UI to punch a little harder, add this to your VS Code settings:

```json
"workbench.colorCustomizations": {
  "[All Orange]": {
    "activityBar.background": "#1a0802",
    "activityBar.border": "#fa824c",
    "sideBar.background": "#1f0a02",
    "sideBar.border": "#fa824c",
    "sideBar.foreground": "#ffbf69"
  }
}
```
