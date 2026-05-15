# All Orange Theme

A VS Code theme made for orange maximalists: Newton-orange code text, deep Newton-orange workbench surfaces, and warm amber accents.

## Themes

- **All Orange**: the main theme, with italic comments and emphasis.
- **All Orange No Italics**: the same palette without italic styling.

After changing the main theme, run `npm run build:no-italics` to regenerate the no-italic variant from it.

## Test Locally

Open this folder in VS Code, press `F5`, and choose **All Orange** in the Extension Development Host.

Open files from `demos/` while tuning the theme so you can check JavaScript, React, Vue, Python, Ruby, HTML, CSS, and JSON scopes quickly.

## Inspect Scopes

In the Extension Development Host, run **Developer: Inspect Editor Tokens and Scopes** from the Command Palette. Click a token to see the TextMate scopes and semantic token data that the theme can target.

## Optional Higher-Contrast Sidebar

If you like the editor colors but want the side UI to punch a little harder, add this to your VS Code settings:

```json
"workbench.colorCustomizations": {
  "[All Orange]": {
    "activityBar.background": "#1a0802",
    "activityBar.border": "#ff8f24",
    "sideBar.background": "#1f0a02",
    "sideBar.border": "#ff8f24",
    "sideBar.foreground": "#ffd9a8"
  }
}
```
