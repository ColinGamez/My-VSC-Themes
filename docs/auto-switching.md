# Auto-Switching Themes

VS Code can automatically switch between a preferred light theme and a preferred dark theme when your operating system changes color mode.

Official VS Code docs: https://code.visualstudio.com/docs/configure/themes#_automatically-switch-based-on-os-color-scheme

## Extension Commands

The extension adds Command Palette helpers for quick switching:

| Command | Result |
| --- | --- |
| Colin's Themes: Apply Current Seasonal Theme | Picks Spring Bloom, Summer Sunset, Autumn Ember, or Winter Aurora based on the current month. |
| Colin's Themes: Apply Current Holiday Theme | Picks Halloween, December, New Year, Valentine's, or a seasonal fallback. |
| Colin's Themes: Pick Gaming Theme | Opens the gaming theme picker. |
| Colin's Themes: Pick Theme By Pack | Opens every pack in a quick picker. |
| Colin's Themes: Enable Startup Seasonal Auto Theme | Applies the current seasonal theme when VS Code starts. |

## Light And Dark Auto Switch

Add this to your VS Code `settings.json`:

```json
{
  "window.autoDetectColorScheme": true,
  "workbench.preferredLightColorTheme": "Spring Bloom",
  "workbench.preferredDarkColorTheme": "All Orange"
}
```

Good pairs from this pack:

| Mood | Light | Dark |
| --- | --- | --- |
| Seasonal | Spring Bloom | Winter Aurora |
| Warm | Honey Terminal | All Orange |
| Holiday | Candy Cane Code | New Year Neon |
| Playful | Birthday Confetti | Cotton Candy Terminal |

## Workspace-Specific Themes

For a project-specific theme, create `.vscode/settings.json` in that project:

```json
{
  "workbench.colorTheme": "Starfighter HUD"
}
```

That is useful if one project deserves its own mood without changing every VS Code window.

## Manual Seasonal Rotation

VS Code does not include a built-in month scheduler for color themes. For now, the clean setup is to rotate manually:

| Season Or Event | Theme |
| --- | --- |
| Spring | Spring Bloom |
| Summer | Summer Sunset |
| Autumn | Autumn Ember |
| Winter | Winter Aurora |
| Halloween | Halloween Midnight |
| December | Candy Cane Code |
| New Year | New Year Neon |
| Valentine's | Valentine Glow |
| Birthday | Birthday Confetti |

Use **Preferences: Color Theme** and pick the theme for the season.
