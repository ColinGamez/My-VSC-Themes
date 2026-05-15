import { mkdir, writeFile } from "node:fs/promises";

const themeDir = new URL("../themes/", import.meta.url);

const themes = [
  {
    file: "neon-arcade-color-theme.json",
    name: "Neon Arcade",
    type: "dark",
    colors: {
      bg: "#07091f",
      bgAlt: "#0d1030",
      bgElevated: "#15194a",
      panel: "#0a0d29",
      line: "#23286a",
      fg: "#e8edff",
      muted: "#7f89c8",
      accent: "#00d7ff",
      accent2: "#ff4fd8",
      accent3: "#ffd166",
      string: "#8cffc1",
      number: "#ffd166",
      function: "#00d7ff",
      keyword: "#ff4fd8",
      type: "#b891ff",
      property: "#f7a8ff",
      comment: "#6570ad",
      error: "#ff5f7a",
      success: "#8cffc1",
      buttonFg: "#07091f"
    }
  },
  {
    file: "matcha-grove-color-theme.json",
    name: "Matcha Grove",
    type: "dark",
    colors: {
      bg: "#07130d",
      bgAlt: "#0c1d13",
      bgElevated: "#14321f",
      panel: "#0a1a11",
      line: "#28583a",
      fg: "#d9f5c9",
      muted: "#7ea774",
      accent: "#a8d45b",
      accent2: "#5ee39a",
      accent3: "#f4d35e",
      string: "#b7e86b",
      number: "#f4d35e",
      function: "#5ee39a",
      keyword: "#a8d45b",
      type: "#d7ef8f",
      property: "#c3e57d",
      comment: "#6f9469",
      error: "#ff8066",
      success: "#5ee39a",
      buttonFg: "#07130d"
    }
  },
  {
    file: "peach-soda-color-theme.json",
    name: "Peach Soda",
    type: "light",
    colors: {
      bg: "#fff7ef",
      bgAlt: "#ffeede",
      bgElevated: "#ffe2ca",
      panel: "#fff1e6",
      line: "#f6c8a8",
      fg: "#4b2f25",
      muted: "#9a6754",
      accent: "#f26d5b",
      accent2: "#d85f9f",
      accent3: "#d89124",
      string: "#407f3f",
      number: "#c87511",
      function: "#c94f45",
      keyword: "#d85f9f",
      type: "#995fc9",
      property: "#b65b34",
      comment: "#a87967",
      error: "#b3261e",
      success: "#407f3f",
      buttonFg: "#fff7ef"
    }
  }
];

function withAlpha(hex, alpha) {
  return `${hex}${alpha}`;
}

function createTheme({ name, type, colors }) {
  const isLight = type === "light";
  const listForeground = isLight ? colors.fg : colors.fg;

  return {
    "$schema": "vscode://schemas/color-theme",
    name,
    type,
    semanticHighlighting: true,
    colors: {
      focusBorder: colors.accent,
      foreground: colors.fg,
      disabledForeground: colors.muted,
      "widget.shadow": withAlpha(isLight ? "#704020" : "#000000", "33"),
      "selection.background": withAlpha(colors.accent, isLight ? "33" : "44"),
      descriptionForeground: colors.muted,
      errorForeground: colors.error,

      "activityBar.background": colors.bgAlt,
      "activityBar.foreground": colors.fg,
      "activityBar.inactiveForeground": colors.muted,
      "activityBar.activeBorder": colors.accent,
      "activityBarBadge.background": colors.accent,
      "activityBarBadge.foreground": colors.buttonFg,

      "sideBar.background": colors.panel,
      "sideBar.foreground": listForeground,
      "sideBar.border": colors.line,
      "sideBarTitle.foreground": colors.fg,
      "sideBarSectionHeader.background": colors.bgElevated,
      "sideBarSectionHeader.foreground": colors.fg,
      "sideBarSectionHeader.border": colors.line,

      "editorGroup.border": colors.line,
      "editorGroupHeader.tabsBackground": colors.bgAlt,
      "editorGroupHeader.tabsBorder": colors.line,
      "tab.activeBackground": colors.bg,
      "tab.activeForeground": colors.fg,
      "tab.inactiveBackground": colors.bgAlt,
      "tab.inactiveForeground": colors.muted,
      "tab.border": colors.line,
      "tab.activeBorderTop": colors.accent,
      "tab.unfocusedActiveBorderTop": colors.muted,

      "editor.background": colors.bg,
      "editor.foreground": colors.fg,
      "editorLineNumber.foreground": colors.muted,
      "editorLineNumber.activeForeground": colors.accent,
      "editorCursor.foreground": colors.accent,
      "editor.selectionBackground": withAlpha(colors.accent, isLight ? "33" : "44"),
      "editor.selectionHighlightBackground": withAlpha(colors.accent2, isLight ? "22" : "33"),
      "editor.inactiveSelectionBackground": withAlpha(colors.accent, "22"),
      "editor.wordHighlightBackground": withAlpha(colors.accent, "22"),
      "editor.wordHighlightStrongBackground": withAlpha(colors.accent2, "22"),
      "editor.findMatchBackground": withAlpha(colors.accent3, isLight ? "55" : "66"),
      "editor.findMatchHighlightBackground": withAlpha(colors.accent, "33"),
      "editor.findRangeHighlightBackground": withAlpha(colors.accent2, "22"),
      "editor.hoverHighlightBackground": withAlpha(colors.accent, "18"),
      "editor.lineHighlightBackground": colors.bgAlt,
      "editor.lineHighlightBorder": colors.line,
      "editorIndentGuide.background1": withAlpha(colors.line, isLight ? "66" : ""),
      "editorIndentGuide.activeBackground1": colors.accent,
      "editorRuler.foreground": colors.line,
      "editorWhitespace.foreground": colors.line,

      "editorGutter.background": colors.bg,
      "editorGutter.modifiedBackground": colors.accent3,
      "editorGutter.addedBackground": colors.success,
      "editorGutter.deletedBackground": colors.error,

      "minimap.background": colors.bg,
      "minimap.selectionHighlight": withAlpha(colors.accent, "70"),
      "minimap.findMatchHighlight": colors.accent3,
      "minimap.errorHighlight": colors.error,
      "minimap.warningHighlight": colors.accent3,

      "statusBar.background": colors.bgElevated,
      "statusBar.foreground": colors.fg,
      "statusBar.border": colors.line,
      "statusBar.debuggingBackground": colors.accent,
      "statusBar.debuggingForeground": colors.buttonFg,
      "statusBar.noFolderBackground": colors.bgAlt,
      "statusBarItem.hoverBackground": colors.line,
      "statusBarItem.remoteBackground": colors.accent,
      "statusBarItem.remoteForeground": colors.buttonFg,

      "titleBar.activeBackground": colors.bgAlt,
      "titleBar.activeForeground": colors.fg,
      "titleBar.inactiveBackground": colors.panel,
      "titleBar.inactiveForeground": colors.muted,
      "titleBar.border": colors.line,

      "panel.background": colors.panel,
      "panel.foreground": colors.fg,
      "panel.border": colors.line,
      "panelTitle.activeForeground": colors.fg,
      "panelTitle.inactiveForeground": colors.muted,
      "panelTitle.activeBorder": colors.accent,

      "terminal.background": colors.bg,
      "terminal.foreground": colors.fg,
      "terminal.ansiBlack": colors.bg,
      "terminal.ansiRed": colors.error,
      "terminal.ansiGreen": colors.success,
      "terminal.ansiYellow": colors.accent3,
      "terminal.ansiBlue": colors.function,
      "terminal.ansiMagenta": colors.accent2,
      "terminal.ansiCyan": colors.accent,
      "terminal.ansiWhite": colors.fg,
      "terminal.ansiBrightBlack": colors.muted,
      "terminal.ansiBrightRed": colors.error,
      "terminal.ansiBrightGreen": colors.success,
      "terminal.ansiBrightYellow": colors.accent3,
      "terminal.ansiBrightBlue": colors.function,
      "terminal.ansiBrightMagenta": colors.accent2,
      "terminal.ansiBrightCyan": colors.accent,
      "terminal.ansiBrightWhite": isLight ? "#2b1b16" : "#ffffff",

      "input.background": colors.bg,
      "input.foreground": colors.fg,
      "input.border": colors.line,
      "input.placeholderForeground": colors.muted,
      "inputOption.activeBackground": withAlpha(colors.accent, "22"),
      "inputOption.activeBorder": colors.accent,
      "inputValidation.errorBackground": colors.bgAlt,
      "inputValidation.errorBorder": colors.error,
      "inputValidation.warningBackground": colors.bgAlt,
      "inputValidation.warningBorder": colors.accent3,
      "inputValidation.infoBackground": colors.bgAlt,
      "inputValidation.infoBorder": colors.accent,

      "button.background": colors.accent,
      "button.foreground": colors.buttonFg,
      "button.hoverBackground": colors.accent3,
      "button.secondaryBackground": colors.bgElevated,
      "button.secondaryForeground": colors.fg,
      "button.secondaryHoverBackground": colors.line,

      "dropdown.background": colors.bg,
      "dropdown.foreground": colors.fg,
      "dropdown.border": colors.line,
      "list.activeSelectionBackground": colors.bgElevated,
      "list.activeSelectionForeground": colors.fg,
      "list.inactiveSelectionBackground": colors.bgAlt,
      "list.inactiveSelectionForeground": colors.fg,
      "list.hoverBackground": colors.bgAlt,
      "list.highlightForeground": colors.accent,
      "list.focusOutline": colors.accent,

      "menu.background": colors.panel,
      "menu.foreground": colors.fg,
      "menu.selectionBackground": colors.bgElevated,
      "menu.selectionForeground": colors.fg,
      "menu.separatorBackground": colors.line,

      "quickInput.background": colors.panel,
      "quickInput.foreground": colors.fg,
      "quickInputTitle.background": colors.bgElevated,
      "pickerGroup.border": colors.line,
      "pickerGroup.foreground": colors.accent,

      "scrollbarSlider.background": withAlpha(colors.line, isLight ? "66" : "55"),
      "scrollbarSlider.hoverBackground": withAlpha(colors.accent, "55"),
      "scrollbarSlider.activeBackground": withAlpha(colors.accent, "88"),
      "editorOverviewRuler.border": colors.bg,
      "editorOverviewRuler.modifiedForeground": colors.accent3,
      "editorOverviewRuler.addedForeground": colors.success,
      "editorOverviewRuler.deletedForeground": colors.error,
      "editorOverviewRuler.errorForeground": colors.error,
      "editorOverviewRuler.warningForeground": colors.accent3,
      "editorOverviewRuler.infoForeground": colors.accent,

      "badge.background": colors.accent,
      "badge.foreground": colors.buttonFg,
      "progressBar.background": colors.accent,
      "notificationCenter.border": colors.line,
      "notificationCenterHeader.background": colors.bgElevated,
      "notificationCenterHeader.foreground": colors.fg,
      "notifications.background": colors.panel,
      "notifications.foreground": colors.fg,
      "notifications.border": colors.line,
      "notificationToast.border": colors.line,

      "breadcrumb.background": colors.bg,
      "breadcrumb.foreground": colors.muted,
      "breadcrumb.focusForeground": colors.fg,
      "breadcrumb.activeSelectionForeground": colors.accent,

      "gitDecoration.addedResourceForeground": colors.success,
      "gitDecoration.modifiedResourceForeground": colors.accent3,
      "gitDecoration.deletedResourceForeground": colors.error,
      "gitDecoration.untrackedResourceForeground": colors.success,
      "gitDecoration.ignoredResourceForeground": colors.muted,
      "gitDecoration.conflictingResourceForeground": colors.accent2,

      "diffEditor.insertedTextBackground": withAlpha(colors.success, "22"),
      "diffEditor.removedTextBackground": withAlpha(colors.error, "22"),
      "diffEditor.border": colors.line,
      "peekView.border": colors.accent,
      "peekViewEditor.background": colors.bg,
      "peekViewResult.background": colors.panel,
      "peekViewTitle.background": colors.bgElevated,
      "peekViewTitleLabel.foreground": colors.fg,
      "peekViewTitleDescription.foreground": colors.muted
    },
    tokenColors: [
      {
        scope: ["comment", "punctuation.definition.comment"],
        settings: { foreground: colors.comment, fontStyle: "italic" }
      },
      {
        scope: ["string", "constant.other.symbol", "markup.inline.raw"],
        settings: { foreground: colors.string }
      },
      {
        scope: ["constant.numeric", "constant.language", "support.constant"],
        settings: { foreground: colors.number }
      },
      {
        scope: ["keyword", "storage", "storage.type", "storage.modifier"],
        settings: { foreground: colors.keyword, fontStyle: "bold" }
      },
      {
        scope: ["entity.name.function", "support.function", "meta.function-call"],
        settings: { foreground: colors.function }
      },
      {
        scope: ["entity.name.type", "entity.name.class", "support.type", "support.class"],
        settings: { foreground: colors.type }
      },
      {
        scope: ["variable", "variable.other", "meta.definition.variable"],
        settings: { foreground: colors.fg }
      },
      {
        scope: ["variable.parameter", "meta.function.parameters"],
        settings: { foreground: colors.accent3 }
      },
      {
        scope: ["property", "variable.other.property", "support.variable.property"],
        settings: { foreground: colors.property }
      },
      {
        scope: ["entity.name.tag", "punctuation.definition.tag"],
        settings: { foreground: colors.keyword }
      },
      {
        scope: ["entity.other.attribute-name"],
        settings: { foreground: colors.property }
      },
      {
        scope: ["markup.heading", "entity.name.section"],
        settings: { foreground: colors.accent, fontStyle: "bold" }
      },
      {
        scope: ["markup.bold"],
        settings: { foreground: colors.accent3, fontStyle: "bold" }
      },
      {
        scope: ["markup.italic"],
        settings: { foreground: colors.type, fontStyle: "italic" }
      },
      {
        scope: ["invalid", "invalid.illegal"],
        settings: { foreground: isLight ? "#ffffff" : colors.bg, background: colors.error }
      }
    ],
    semanticTokenColors: {
      namespace: colors.type,
      class: colors.type,
      interface: colors.type,
      enum: colors.number,
      type: colors.type,
      typeParameter: colors.accent3,
      function: colors.function,
      method: colors.function,
      macro: colors.accent,
      variable: colors.fg,
      parameter: colors.accent3,
      property: colors.property,
      enumMember: colors.number,
      event: colors.accent2,
      operator: colors.accent,
      keyword: { foreground: colors.keyword, fontStyle: "bold" },
      comment: { foreground: colors.comment, fontStyle: "italic" },
      string: colors.string,
      number: colors.number,
      regexp: colors.type,
      decorator: colors.accent2
    }
  };
}

await mkdir(themeDir, { recursive: true });

for (const theme of themes) {
  const outputPath = new URL(theme.file, themeDir);
  await writeFile(outputPath, `${JSON.stringify(createTheme(theme), null, 2)}\n`, "utf8");
}
