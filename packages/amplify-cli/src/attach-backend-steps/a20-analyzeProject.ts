import { normalizeEditor, editorSelection } from '../extensions/amplify-helpers/editor-selection';
import { $TSContext, stateManager, toolkitExtensions } from 'amplify-cli-core';
import { normalizeProjectName } from '../extensions/amplify-helpers/project-name-validation';

const { amplifyCLIConstants } = toolkitExtensions;
export async function analyzeProject(context: $TSContext) {
  let defaultEditor = getDefaultEditor();

  if (!defaultEditor) {
    defaultEditor = await getEditor(context);
  }

  context.exeInfo.projectConfig.projectName = normalizeProjectName(context.exeInfo.projectConfig.projectName);

  context.exeInfo.forcePush = !!context?.parameters?.options?.forcePush;

  context.exeInfo.projectConfig.version = amplifyCLIConstants.CURRENT_PROJECT_CONFIG_VERSION;

  context.exeInfo.localEnvInfo.defaultEditor = defaultEditor;
  return context;
}

async function getEditor(context: $TSContext) {
  let editor;
  if (context.exeInfo.inputParams.amplify && context.exeInfo.inputParams.amplify.defaultEditor) {
    editor = normalizeEditor(context.exeInfo.inputParams.amplify.defaultEditor);
  } else if (!context.exeInfo.inputParams.yes) {
    editor = await editorSelection(editor);
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
