/**
 * Check if running on Windows OS
 * @returns true if the CLI is used from Windows machine, false otherwise
 */
export const isWindowsPlatform = (): boolean => !!process?.platform?.startsWith('win');
