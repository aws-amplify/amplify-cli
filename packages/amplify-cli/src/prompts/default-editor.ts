import { SelectPrompt, Choice } from 'amplify-cli-core';
import { normalizeEditor } from '../extensions/amplify-helpers/editor-selection';

const PROMPT_NAME = 'selectEditor';
const PROMPT_MESSAGE = 'Choose your default editor:';

function constructEditorPrompt(editors: string[] | Choice[], initialEditor?: string): SelectPrompt {
  const normalizedInitialEditor = normalizeEditor(initialEditor);
  const editorQuestion = new SelectPrompt(PROMPT_NAME, PROMPT_MESSAGE, editors, normalizedInitialEditor);
  return editorQuestion;
}

export async function editorSelect(editors: string[] | Choice[], initialEditor?: string): Promise<string> {
  const answer = await constructEditorPrompt(editors, initialEditor).run();
  return answer;
}
