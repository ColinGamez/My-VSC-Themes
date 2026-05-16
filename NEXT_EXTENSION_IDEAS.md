# Colin's Code Suite

Colin's Code Suite is a family of VS Code extensions that feel polished, useful, and fun enough for people to actually keep installed.

The plan: build each tool as a standalone extension, then ship one extension pack that installs the whole suite.

## Suite Extensions

### 1. Colin's Project Command Center

Mission control for any workspace.

Status: Alpha is landing inside Colin's VS Code Themes first as the second suite tool.

Core idea:

- Detect package scripts, Git status, README, tests, build commands, and common project files.
- Show them in a clean sidebar dashboard.
- Let users run common project actions without remembering commands.

Killer feature:

- A project health panel that says what is missing: README, license, tests, `.gitignore`, package scripts, screenshots, or publish docs.

MVP:

- Sidebar view.
- npm script buttons.
- Git branch and repo link.
- Detected project type.
- Quick actions for test, build, lint, and open terminal.

### 2. Colin's Theme Reactor

Smart theme switching for moods, seasons, and coding sessions.

Status: Alpha shipped in Colin's VS Code Themes v1.6.0.

Core idea:

- Auto-switch themes based on time of day, season, workspace, or manual presets.
- Pair with Colin's VS Code Themes first, then support any installed theme.

Killer feature:

- Seasonal mode: Halloween, winter, spring, summer, New Year, birthday, and All Orange defaults.

MVP:

- Morning, day, evening, and night schedules.
- Seasonal schedule.
- Workspace-specific theme preference.
- Command to randomize from favorites.

### 3. Colin's README Studio

A visual README builder inside VS Code.

Status: Alpha is landing inside Colin's VS Code Themes as the third suite tool.

Core idea:

- Help people make GitHub and Marketplace pages look legit without fighting Markdown.
- Generate polished sections from a webview editor.

Killer feature:

- One-click README polish pass that adds badges, screenshots, install steps, usage, support, license, and changelog links.

MVP:

- Webview editor.
- Live Markdown preview.
- Section templates.
- Badge picker.
- Screenshot block builder.

### 4. Colin's Snippet Forge

Turn selected code into reusable snippets.

Status: Alpha is landing inside Colin's VS Code Themes as the fourth suite tool.

Core idea:

- Highlight code, run a command, and convert it into a VS Code snippet with placeholders.

Killer feature:

- Auto-detect repeated identifiers and offer placeholder names.

MVP:

- Create snippet from selected text.
- Choose language scope.
- Edit prefix and description.
- Save to user snippets.
- Preview generated JSON before writing.

### 5. Colin's Bug Report Builder

Make clean bug reports from the current coding session.

Core idea:

- Collect the useful context people always forget: file type, selected code, diagnostics, VS Code version, extension list, branch, and recent terminal output.

Killer feature:

- Generates a GitHub-ready issue draft with system info and reproducible steps.

MVP:

- Command to create a Markdown bug report.
- Include selected code if the user approves.
- Include diagnostics from the active file.
- Copy report to clipboard or save as `BUG_REPORT.md`.

### 6. Colin's Repo Time Machine

A visual timeline for what changed in a repo.

Core idea:

- Make Git history easier to scan for people who do not want a wall of commits.

Killer feature:

- "What changed today?" timeline grouped by file and commit.

MVP:

- Sidebar or webview timeline.
- Today, this week, and this month filters.
- Hot files list.
- Branch summary.
- Open changed file from timeline.

### 7. Colin's Launch Pad

A fast command hub for projects, scripts, links, and tools.

Core idea:

- One slick launcher for the user's actual workflow.

Killer feature:

- Per-workspace favorites: commands, folders, npm scripts, GitHub links, docs, terminals, and local files.

MVP:

- Command palette style webview.
- Favorites stored per workspace.
- Run VS Code commands.
- Open files, folders, URLs, and terminals.

### 8. Colin's Code Mood Board

Creative planning boards inside VS Code.

Core idea:

- Save project inspiration without leaving the editor.

Killer feature:

- Drag in screenshots, palette colors, links, snippets, and notes, then keep them tied to the workspace.

MVP:

- Webview board.
- Add notes, links, colors, and snippets.
- Save board data in `.vscode/colin-mood-board.json`.
- Export board to Markdown.

## Extension Pack

### Colin's Code Suite

This is the bundle extension that installs all eight tools.

MVP:

- Extension pack manifest.
- Marketplace page explaining the suite.
- Links to each tool.
- Recommended install path: start with Theme Reactor and Project Command Center.

## Build Order

1. Theme Reactor
2. Project Command Center
3. README Studio
4. Snippet Forge
5. Launch Pad
6. Bug Report Builder
7. Repo Time Machine
8. Code Mood Board
9. Colin's Code Suite extension pack

Why this order: Theme Reactor uses the theme hub we already have, Project Command Center creates the daily-use anchor, README Studio is a very shareable tool, and Snippet Forge gives the suite a strong coding utility.

## Shared Design Rules

- Every tool should feel useful within 30 seconds.
- Every tool gets one standout feature before extra settings.
- Use normal VS Code APIs first: commands, sidebar views, webviews, status bar items, workspace storage, and settings.
- Keep telemetry off unless there is a clear reason and clear opt-in.
- Make every extension useful alone, then better as part of the suite.

## First Milestones

Ship Theme Reactor, Project Command Center, README Studio, and Snippet Forge as the first suite tools.

Theme Reactor status: Alpha shipped in Colin's VS Code Themes v1.6.0.

Theme Reactor scope:

- Alpha inside the current theme extension.
- Theme schedule settings.
- Manual commands for time-of-day, seasonal, holiday, favorites, random favorite, and workspace themes.
- First-class support for Colin's VS Code Themes.
- Standalone extension scaffold after the alpha feels right.
- README, icon, changelog, and Marketplace polish.

Project Command Center status: Alpha is landing inside Colin's VS Code Themes first.

Project Command Center scope:

- Colin's Suite activity bar view.
- Workspace/project type detection.
- npm/package script dashboard.
- Git branch, status, and remote link.
- Project health checks for README, `.gitignore`, license, CI, build, test, and lint basics.
- Quick actions for terminal, best script, repository, starter files, and Theme Reactor.

README Studio status: Alpha is landing inside Colin's VS Code Themes first.

README Studio scope:

- Webview builder for project README files.
- Project-aware badges, install command, usage command, feature seeds, command/script table, support links, and roadmap.
- Live Markdown preview.
- Reuse existing README content.
- Copy generated Markdown or save to `README.md`.

Snippet Forge status: Alpha is landing inside Colin's VS Code Themes first.

Snippet Forge scope:

- Create snippets from selected editor code.
- Suggest prefix, description, language scope, and snippet name.
- Detect repeated identifiers and offer tab-stop placeholders.
- Preview generated snippet JSON.
- Save to `.vscode/colins-snippets.code-snippets` or copy JSON.
