# Support

Thanks for using Colin's VS Code Themes.

## Report An Issue

Open an issue on GitHub:

https://github.com/ColinGamez/My-VSC-Themes/issues

Helpful details:

- Theme name
- Whether the issue is with a color theme, file icon theme, or command
- If it is a preset command, mention which settings changed unexpectedly
- Language or file type
- A screenshot if the issue is visual
- What feels hard to read or visually off

## Request A Theme

Theme ideas are welcome. Include the mood, 3-5 colors, and whether it should be dark or light.

## Local Testing

Run the local checks before packaging:

```sh
npm run build
npm run check:themes
npx @vscode/vsce package --allow-missing-repository
```

For command issues, test from the Command Palette with one of the `Colin's Themes:` commands.

For CI or release issues, include the GitHub Actions run URL and the failing step name.
