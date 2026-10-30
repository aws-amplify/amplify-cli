import * as inquirer from 'inquirer';

// Node v24 made readline.Interface#pause() throw with this code when the
// interface is already closed; Node <=22 treated the call as a no-op.
const READLINE_USE_AFTER_CLOSE = 'ERR_USE_AFTER_CLOSE';

/**
 * Prompts the user with a yes/no question and resolves to their boolean answer.
 *
 * On Node >=24 inquirer@7's prompt teardown crashes the CLI: `baseUI.close()`
 * calls `readline.Interface#pause()` unconditionally, and Node >=24 throws
 * `ERR_USE_AFTER_CLOSE` from that call once stdin has closed (for example EOF on
 * piped input) as the prompt finishes. The answer is captured on the prompt UI
 * before teardown runs, so this helper recovers it and returns it, restoring the
 * pre-Node-24 behavior where the teardown was a silent no-op for every caller.
 *
 * @param message - the question to display to the user
 * @param defaultValue - the answer used when the user accepts the default
 * @returns the user's boolean response
 * @deprecated Use confirmContinue from amplify-prompts instead
 */
export async function confirmPrompt(message: string, defaultValue = true): Promise<boolean> {
  const promptPromise = inquirer.prompt({
    name: 'yesno',
    message,
    type: 'confirm',
    default: defaultValue,
  });
  try {
    const ans = await promptPromise;
    return ans.yesno;
  } catch (err) {
    if (!isReadlineUseAfterCloseError(err)) {
      throw err;
    }
    // The crash happens during teardown, after the answer was captured on the
    // prompt UI. Recover it so the caller sees the user's real choice; fall back
    // to the default if the prompt closed before an answer was recorded.
    const capturedAnswer = promptPromise.ui?.answers?.yesno;
    return typeof capturedAnswer === 'boolean' ? capturedAnswer : defaultValue;
  }
}

const isReadlineUseAfterCloseError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: unknown }).code === READLINE_USE_AFTER_CLOSE;
