import { executePrompt, SelectPrompt, Choice } from 'amplify-cli-core';
import { normalizeEditor } from '../extensions/amplify-helpers/editor-selection';

const EDITOR_SELECT_MESSAGE = 'Choose your default editor:';

function constructEditorQuestion(editors: string[] | Choice[], initialEditor?: string): SelectPrompt {
  const normalizedInitialEditor = normalizeEditor(initialEditor);
  const editorQuestionName = 'selectEditor';
  const editorQuestion = new SelectPrompt(editorQuestionName, EDITOR_SELECT_MESSAGE, editors, normalizedInitialEditor);
  return editorQuestion;
}

export async function editorSelect(editors: string[] | Choice[], initialEditor?: string): Promise<string> {
  const editorQuestion = constructEditorQuestion(editors, initialEditor);
  const answer = await executePrompt(editorQuestion);
  return answer;
}
