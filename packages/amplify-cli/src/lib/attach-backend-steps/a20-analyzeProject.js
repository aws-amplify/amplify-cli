const fs = require('fs-extra');
const { normalizeEditor, editorSelection } = require('../../extensions/amplify-helpers/editor-selection');
const { PROJECT_CONFIG_VERSION } = require('../../extensions/amplify-helpers/constants');
const { readJsonFile } = require('../../extensions/amplify-helpers/read-json-file');

async function run(context) {
  let defaultEditor = getDefaultEditor(context);

  if (!defaultEditor) {
    defaultEditor = await getEditor(context);
  }

  if ((context.exeInfo.inputParams && context.exeInfo.inputParams.yes) || context.parameters.options.forcePush) {
    context.exeInfo.forcePush = true;
  } else {
    context.exeInfo.forcePush = false;
  }

  context.exeInfo.projectConfig.version = PROJECT_CONFIG_VERSION;

  context.exeInfo.localEnvInfo.defaultEditor = defaultEditor;
  return context;
}

/* End getProjectName */

/* Begin getEditor */
async function getEditor(context) {
  let editor;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    editor = normalizeEditor(context.exeInfo.inputParams.amplify.defaultEditor);
  } else if (!context.exeInfo.inputParams.yes) {
    editor = await editorSelection(editor);
  }

  return editor;
}

function getDefaultEditor(context) {
  let defaultEditor;
  const projectPath = process.cwd();
  const localEnvFilePath = context.amplify.pathManager.getLocalEnvFilePath(projectPath);
  if (fs.existsSync(localEnvFilePath)) {
    ({ defaultEditor } = readJsonFile(localEnvFilePath));
  }

  return defaultEditor;
}

module.exports = {
  run,
};
