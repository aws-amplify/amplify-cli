/**
 * If this flag is set, debug messages will be printed.
 */
export const isDebug = process.argv.includes('--debug') || process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT === 'true';
/**
 * If this flag is set, only warn and error messages will be printed.
 */
export const isSilent = process.argv.includes('--silent');

/**
 * If this flag is set, all prompts are suppressed.
 */
export const isYes = !!['--yes', '-y'].find((yesFlag) => process.argv.includes(yesFlag));

/**
 * Set to true if stdin is a TTY (interactive shell)
 */
export const isInteractiveShell = process.stdin.isTTY;

/**
 * If this flag is set, printer will trim non ASCI characters from the output.
 */
export const isHeadless = process.argv.includes('--headless');
