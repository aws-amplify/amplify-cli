import { normalizeEditor, editors } from '../extensions/amplify-helpers/editor-selection';
import { editorSelect } from '../prompts';
import { amplifyCLIConstants } from '../extensions/amplify-helpers/constants';
import { stateManager } from 'amplify-cli-core';

export async function analyzeProject(context) {
  let defaultEditor = getDefaultEditor();

  if (!defaultEditor) {
    defaultEditor = await getEditor(context);
  }

  if ((context.exeInfo.inputParams && context.exeInfo.inputParams.yes) || context.parameters.options.forcePush) {
    context.exeInfo.forcePush = true;
  } else {
    context.exeInfo.forcePush = false;
  }

  context.exeInfo.projectConfig.version = amplifyCLIConstants.PROJECT_CONFIG_VERSION;

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
    editor = await editorSelect(editors, editor);
  }

  return editor;
}

function getDefaultEditor() {
  const projectPath = process.cwd();
  const localEnvInfo = stateManager.getLocalEnvInfo(projectPath, {
    throwIfNotExist: false,
    default: {},
  });

  return localEnvInfo.defaultEditor;
}
