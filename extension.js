const { registerCommandCenter } = require("./src/commandCenter");
const { registerReadmeStudio } = require("./src/readmeStudio");
const { registerSnippetForge } = require("./src/snippetForge");
const { registerThemeReactor } = require("./src/themeReactor");

function activate(context) {
  registerCommandCenter(context);
  registerReadmeStudio(context);
  registerSnippetForge(context);
  registerThemeReactor(context);
}

function deactivate() {}

module.exports = { activate, deactivate };
