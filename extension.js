const { registerCommandCenter } = require("./src/commandCenter");
const { registerLaunchPad } = require("./src/launchPad");
const { registerReadmeStudio } = require("./src/readmeStudio");
const { registerSnippetForge } = require("./src/snippetForge");
const { registerThemeReactor } = require("./src/themeReactor");

function activate(context) {
  registerCommandCenter(context);
  registerLaunchPad(context);
  registerReadmeStudio(context);
  registerSnippetForge(context);
  registerThemeReactor(context);
}

function deactivate() {}

module.exports = { activate, deactivate };
