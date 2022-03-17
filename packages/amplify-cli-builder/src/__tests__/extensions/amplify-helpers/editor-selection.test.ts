import { editorSelection, normalizeEditor } from '../../../extensions/amplify-helpers/editor-selection';

jest.mock('inquirer', () => ({
  prompt: () => {
    return new Promise(resolve => resolve({ editorSelected: 'vscode' }));
  },
}));

jest.mock('amplify-cli-core', () => ({
  JSONUtilities: {
    readJson: jest.fn(),
    writeJson: jest.fn(),
  },
}));

describe('editorSelection', () => {
  it('return selected editor name', async () => {
    const result = await editorSelection('vscode');
    expect(result).toBe('vscode');
  });
});

describe('normalizeEditor', () => {
  it('return normalised editor name', () => {
    const result = normalizeEditor('vscode');
    expect(result).toBe('vscode');
  });
  it('return intellij when idea14ce is provided', () => {
    const result = normalizeEditor('idea14ce');
    expect(result).toBe('intellij');
  });
  it('return vscode when code is provided', () => {
    const result = normalizeEditor('code');
    expect(result).toBe('vscode');
  });
});
