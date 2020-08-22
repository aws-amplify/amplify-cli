// To support earlier version of the value we need to fix-up mixed case 'Code' to 'code',
// map 'code' to 'vscode' or 'idea14ce' to 'intellij'
export function normalizeEditor(editor) {
  if (editor) {
    editor = editor.toLowerCase();

    if (editor === 'idea14ce') {
      editor = 'intellij';
    } else if (editor === 'code') {
      editor = 'vscode';
    }

    editor = editors.findIndex(editorEntry => editorEntry.value === editor) > -1 ? editor : undefined;
  }

  return editor;
}
