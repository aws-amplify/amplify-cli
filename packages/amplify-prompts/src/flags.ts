/**
 * If this flag is set, debug messages will be printed.
 */
export const isDebug = process.argv.includes('--debug');

/**
 * If this flag is set, only warn and error messages will be printed.
 */
export const isSilent = process.argv.includes('--silent');

/**
 * If this flag is set, all prompts are suppressed.
 */
export const isYes = !!['--yes', '-y'].find(yesFlag => process.argv.includes(yesFlag));
