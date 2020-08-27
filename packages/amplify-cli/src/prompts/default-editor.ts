import { executePrompt, SelectPrompt } from 'amplify-cli-core';
import { normalizeEditor } from '../extensions/amplify-helpers/editor-selection';

const EDITOR_SELECT_MESSAGE = 'Choose your default editor:';

const defaultEditors = [
  {
    name: 'Visual Studio Code',
    value: 'vscode',
  },
  {
    name: 'Atom Editor',
    value: 'atom',
  },
  {
    name: 'Sublime Text',
    value: 'sublime',
  },
  {
    name: 'IntelliJ IDEA',
    value: 'intellij',
  },
  {
    name: 'Vim (via Terminal, Mac OS only)',
    value: 'vim',
  },
  {
    name: 'Emacs (via Terminal, Mac OS only)',
    value: 'emacs',
  },
  {
    name: 'None',
    value: 'none',
  },
];

function constructEditorQuestion(editors, initialEditor?) {
  const normalizedInitialEditor = normalizeEditor(initialEditor);
  const editorQuestionName = 'selectEditor';
  const editorQuestion = new SelectPrompt(editorQuestionName, EDITOR_SELECT_MESSAGE, editors, normalizedInitialEditor);
  return editorQuestion;
}

export async function editorSelect(editors = defaultEditors, initialEditor?) {
  const editorQuestion = constructEditorQuestion(editors, initialEditor);
  const answer = await executePrompt(editorQuestion);
  return answer;
}
