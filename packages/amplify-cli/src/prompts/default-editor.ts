import { executePrompt, SelectPrompt } from 'amplify-cli-core';
import { normalizeEditor } from '../extensions/amplify-helpers/editor-selection';

const EDITOR_SELECT_MESSAGE = 'Choose your default editor:';

function constructEditorQuestion(editors, initialEditor?) {
  const normalizedInitialEditor = normalizeEditor(initialEditor);
  const editorQuestionName = 'selectEditor';
  const editorQuestion = new SelectPrompt(editorQuestionName, EDITOR_SELECT_MESSAGE, editors, normalizedInitialEditor);
  return editorQuestion;
}

export async function editorSelect(editors, initialEditor?) {
  const editorQuestion = constructEditorQuestion(editors, initialEditor);
  const answer = await executePrompt(editorQuestion);
  return answer;
}
