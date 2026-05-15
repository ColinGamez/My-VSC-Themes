# Auto-Switching Themes

VS Code can automatically switch between a preferred light theme and a preferred dark theme when your operating system changes color mode.

Official VS Code docs: https://code.visualstudio.com/docs/configure/themes#_automatically-switch-based-on-os-color-scheme

## Extension Commands

The extension adds Theme Reactor and Command Palette helpers for quick switching:

| Command | Result |
| --- | --- |
| Colin's Themes: Enable Theme Reactor | Turns on automatic switching by hybrid, time-of-day, seasonal, or holiday mode. |
| Colin's Themes: Disable Theme Reactor | Turns off automatic Theme Reactor switching. |
| Colin's Themes: Apply Theme Reactor Now | Applies the current Theme Reactor pick immediately. |
| Colin's Themes: Pick Theme Reactor Favorite | Opens a quick picker for your configured favorite themes. |
| Colin's Themes: Random Theme Reactor Favorite | Switches to a random configured favorite. |
| Colin's Themes: Configure Theme Reactor Favorites | Lets you choose the favorite list used by Theme Reactor commands. |
| Colin's Themes: Set Theme Reactor Workspace Theme | Saves a workspace-specific theme override. |
| Colin's Themes: Apply Current Seasonal Theme | Picks Spring Bloom, Summer Sunset, Autumn Ember, or Winter Aurora based on the current month. |
| Colin's Themes: Apply Current Holiday Theme | Picks Halloween, December, New Year, Valentine's, or a seasonal fallback. |
| Colin's Themes: Pick Gaming Theme | Opens the gaming theme picker. |
| Colin's Themes: Pick Theme By Pack | Opens every pack in a quick picker. |
| Colin's Themes: Enable Startup Seasonal Auto Theme | Applies the current seasonal theme when VS Code starts. |
| Colin's Themes: Apply Orange Coding Preset | Applies All Orange, file icons, ligatures, minimap, bracket guides, and smooth scrolling. |
| Colin's Themes: Apply Focus Preset | Applies All Orange High Contrast, file icons, ligatures, no minimap, and focused whitespace hints. |
| Colin's Themes: Apply Light Coding Preset | Applies Spring Bloom, file icons, ligatures, no minimap, and bracket guides. |
| Colin's Themes: Apply Gaming Preset | Applies Starfighter HUD, file icons, ligatures, minimap, and bracket guides. |

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

## Theme Reactor

Theme Reactor is the extension's built-in automatic theme switcher.

Turn it on from the Command Palette with **Colin's Themes: Enable Theme Reactor**, or add this to `settings.json`:

```json
{
  "myVscThemes.reactor.enabled": true,
  "myVscThemes.reactor.mode": "hybrid"
}
```

Modes:

| Mode | Result |
| --- | --- |
| `hybrid` | Uses holiday themes in January, February, October, and December; otherwise uses the time-of-day schedule. |
| `timeOfDay` | Uses morning, day, evening, and night schedule settings. |
| `seasonal` | Uses Spring Bloom, Summer Sunset, Autumn Ember, or Winter Aurora by month. |
| `holiday` | Uses holiday themes when available, with seasonal fallback. |

Default time-of-day schedule:

```json
{
  "myVscThemes.reactor.schedule": {
    "morning": "Spring Bloom",
    "day": "Peach Soda",
    "evening": "Summer Sunset",
    "night": "All Orange"
  }
}
```

## Workspace-Specific Themes

For a project-specific theme, run **Colin's Themes: Set Theme Reactor Workspace Theme**, or create `.vscode/settings.json` in that project:

```json
{
  "myVscThemes.reactor.workspaceTheme": "Starfighter HUD"
}
```

That is useful if one project deserves its own mood without changing every VS Code window. If Theme Reactor is off, VS Code's normal `workbench.colorTheme` setting still works too.

## Manual Seasonal Rotation

You can still rotate manually with **Preferences: Color Theme** or with the seasonal and holiday commands:

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
