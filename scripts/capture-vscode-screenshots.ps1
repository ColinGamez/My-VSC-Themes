param(
  [string]$VsixPath = ".\my-vsc-themes-1.5.0.vsix",
  [string[]]$Themes = @("All Orange", "Spring Bloom", "Starfighter HUD")
)

$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$screenshotsDir = Join-Path $root "assets\screenshots"
$userDataDir = Join-Path $root ".tmp-vscode-screenshot-user"
$extensionsDir = Join-Path $root ".tmp-vscode-screenshot-extensions"
$settingsDir = Join-Path $userDataDir "User"
$sampleFile = Join-Path $root "demos\sample.tsx"
$codeCmd = Join-Path $env:LOCALAPPDATA "Programs\Microsoft VS Code\bin\code.cmd"

if (!(Test-Path $codeCmd)) {
  throw "Could not find VS Code CLI at $codeCmd"
}

if (!(Test-Path $VsixPath)) {
  throw "Could not find VSIX at $VsixPath"
}

foreach ($path in @($userDataDir, $extensionsDir)) {
  if ($path.StartsWith($root) -and (Test-Path $path)) {
    Remove-Item -LiteralPath $path -Recurse -Force
  }
}

New-Item -ItemType Directory -Force -Path $screenshotsDir, $settingsDir | Out-Null

& $codeCmd --user-data-dir $userDataDir --extensions-dir $extensionsDir --install-extension $VsixPath --force | Out-Host

& $codeCmd --user-data-dir $userDataDir --extensions-dir $extensionsDir --list-extensions --show-versions | Out-Host

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class NativeWindow {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }

  [DllImport("user32.dll")]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

  [DllImport("user32.dll")]
  public static extern bool PostMessage(IntPtr hWnd, UInt32 msg, IntPtr wParam, IntPtr lParam);

  [DllImport("user32.dll")]
  public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, UInt32 nFlags);
}
"@

function Convert-ToSlug {
  param([string]$Value)
  return ($Value.ToLower() -replace "[^a-z0-9]+", "-" -replace "^-|-$", "")
}

function Write-Settings {
  param([string]$Theme)

  $settings = @{
    "workbench.colorTheme" = $Theme
    "workbench.iconTheme" = "colins-color-icons"
    "workbench.startupEditor" = "none"
    "workbench.editor.showTabs" = "single"
    "workbench.activityBar.location" = "default"
    "workbench.welcomePage.walkthroughs.openOnInstall" = $false
    "extensions.ignoreRecommendations" = $true
    "editor.fontSize" = 15
    "editor.fontLigatures" = $true
    "editor.minimap.enabled" = $true
    "editor.bracketPairColorization.enabled" = $true
    "security.workspace.trust.enabled" = $false
    "telemetry.telemetryLevel" = "off"
  }

  $settings | ConvertTo-Json -Depth 8 | Set-Content -Path (Join-Path $settingsDir "settings.json") -Encoding UTF8
}

function Find-CodeWindow {
  for ($attempt = 0; $attempt -lt 45; $attempt++) {
    $codeProcessIds = Get-CimInstance Win32_Process -Filter "name = 'Code.exe'" |
      Where-Object { $_.CommandLine -like "*$userDataDir*" } |
      Select-Object -ExpandProperty ProcessId

    $window = Get-Process -Id $codeProcessIds -ErrorAction SilentlyContinue |
      Where-Object { $_.MainWindowHandle -ne 0 } |
      Sort-Object StartTime -Descending |
      Select-Object -First 1

    if ($window) {
      return $window
    }

    Start-Sleep -Milliseconds 700
  }

  throw "Timed out waiting for the VS Code screenshot window."
}

function Save-WindowScreenshot {
  param(
    [IntPtr]$Handle,
    [string]$OutputPath
  )

  [NativeWindow]::ShowWindow($Handle, 3) | Out-Null
  [NativeWindow]::SetForegroundWindow($Handle) | Out-Null
  Start-Sleep -Milliseconds 900

  $rect = New-Object NativeWindow+RECT
  [NativeWindow]::GetWindowRect($Handle, [ref]$rect) | Out-Null

  $width = $rect.Right - $rect.Left
  $height = $rect.Bottom - $rect.Top

  $bitmap = New-Object System.Drawing.Bitmap $width, $height
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $hdc = $graphics.GetHdc()
  $captured = [NativeWindow]::PrintWindow($Handle, $hdc, 2)
  $graphics.ReleaseHdc($hdc)

  if (!$captured) {
    throw "Failed to capture the VS Code window with PrintWindow."
  }

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

foreach ($theme in $Themes) {
  Write-Settings -Theme $theme
  & $codeCmd @(
    "--user-data-dir", $userDataDir,
    "--extensions-dir", $extensionsDir,
    "--new-window",
    "--skip-welcome",
    "--skip-release-notes",
    "--disable-workspace-trust",
    "--goto",
    $sampleFile
  ) | Out-Null

  $window = Find-CodeWindow
  Start-Sleep -Seconds 5
  $slug = Convert-ToSlug -Value $theme
  $outputPath = Join-Path $screenshotsDir "$slug-vscode.png"
  Save-WindowScreenshot -Handle $window.MainWindowHandle -OutputPath $outputPath
  [NativeWindow]::PostMessage($window.MainWindowHandle, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null
  Start-Sleep -Seconds 2
}

if ($userDataDir.StartsWith($root) -and (Test-Path $userDataDir)) {
  Remove-Item -LiteralPath $userDataDir -Recurse -Force
}

if ($extensionsDir.StartsWith($root) -and (Test-Path $extensionsDir)) {
  Remove-Item -LiteralPath $extensionsDir -Recurse -Force
}
