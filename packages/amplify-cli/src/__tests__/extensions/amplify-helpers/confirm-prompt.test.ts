import * as inquirer from 'inquirer';
import { confirmPrompt } from '../../../extensions/amplify-helpers/confirm-prompt';

jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));

const promptMock = inquirer.prompt as unknown as jest.Mock;

// Shape of the value inquirer.prompt() returns: a promise with the prompt UI
// (which carries the captured answers) monkey-patched onto it.
type PromptUiShape = { answers: Record<string, unknown> };
const attachUi = (promise: Promise<unknown>, ui: PromptUiShape): Promise<unknown> => {
  (promise as Promise<unknown> & { ui: PromptUiShape }).ui = ui;
  return promise;
};

// Mirrors the error Node >=24 throws from readline.Interface#pause() once the
// interface is closed (Node <=22 made the call a no-op).
const nodeReadlineAfterCloseError = (): Error => {
  const err = new Error('readline was closed') as NodeJS.ErrnoException;
  err.code = 'ERR_USE_AFTER_CLOSE';
  return err;
};

describe('confirmPrompt', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('asks inquirer a confirm question and returns the answer', async () => {
    promptMock.mockReturnValue(attachUi(Promise.resolve({ yesno: false }), { answers: { yesno: false } }));

    await expect(confirmPrompt('Proceed?', true)).resolves.toBe(false);
    expect(promptMock).toHaveBeenCalledWith({ name: 'yesno', message: 'Proceed?', type: 'confirm', default: true });
  });

  it('recovers a "yes" answer when inquirer teardown throws ERR_USE_AFTER_CLOSE on Node >=24', async () => {
    // inquirer captures the answer on ui.answers, then baseUI.close() -> rl.pause()
    // throws because stdin has already closed, rejecting the prompt promise.
    const ui: PromptUiShape = { answers: {} };
    const rejectsAfterCapturing = Promise.resolve().then(() => {
      ui.answers.yesno = true;
      throw nodeReadlineAfterCloseError();
    });
    promptMock.mockReturnValue(attachUi(rejectsAfterCapturing, ui));

    await expect(confirmPrompt('Edit now?', false)).resolves.toBe(true);
  });

  it('recovers a "no" answer when inquirer teardown throws ERR_USE_AFTER_CLOSE on Node >=24', async () => {
    const ui: PromptUiShape = { answers: {} };
    const rejectsAfterCapturing = Promise.resolve().then(() => {
      ui.answers.yesno = false;
      throw nodeReadlineAfterCloseError();
    });
    promptMock.mockReturnValue(attachUi(rejectsAfterCapturing, ui));

    await expect(confirmPrompt('Edit now?', true)).resolves.toBe(false);
  });

  it('falls back to the default answer when the crash happens before any answer is captured', async () => {
    const uiTrueDefault: PromptUiShape = { answers: {} };
    promptMock.mockReturnValueOnce(
      attachUi(
        Promise.resolve().then(() => {
          throw nodeReadlineAfterCloseError();
        }),
        uiTrueDefault,
      ),
    );
    await expect(confirmPrompt('Edit now?', true)).resolves.toBe(true);

    const uiFalseDefault: PromptUiShape = { answers: {} };
    promptMock.mockReturnValueOnce(
      attachUi(
        Promise.resolve().then(() => {
          throw nodeReadlineAfterCloseError();
        }),
        uiFalseDefault,
      ),
    );
    await expect(confirmPrompt('Edit now?', false)).resolves.toBe(false);
  });

  it('rethrows errors that are not the Node readline-after-close crash', async () => {
    const ui: PromptUiShape = { answers: {} };
    const rejectsWithUnrelatedError = Promise.resolve().then(() => {
      throw new Error('something else went wrong');
    });
    promptMock.mockReturnValue(attachUi(rejectsWithUnrelatedError, ui));

    await expect(confirmPrompt('Proceed?')).rejects.toThrow('something else went wrong');
  });
});
