/**
 * Generates a time-based Amplify app name with optional app name suffix.
 * Format: [last8alphanumeric][YYMMDDHHMMSS] (20 chars for Amplify compatibility)
 * CDK resource names (based off of amplify app name) must start with an alphabetic character.
 * @param appName Optional app name from which to extract last 8 alphanumeric characters
 * @returns A unique, sortable app name starting with a letter (max 20 chars)
 */
export const generateTimeBasedE2EAmplifyAppName = (appName?: string): string => {
  const now = new Date();

  // Format: YYMMDDHHMMSSMM (human-readable, sortable) - 14 chars
  // Using only 2 digits of milliseconds to save space
  const timestamp = [
    String(now.getFullYear()).slice(-2), // YY
    String(now.getMonth() + 1).padStart(2, '0'), // MM
    String(now.getDate()).padStart(2, '0'), // DD
    String(now.getHours()).padStart(2, '0'), // HH
    String(now.getMinutes()).padStart(2, '0'), // MM
    String(now.getSeconds()).padStart(2, '0'), // SS
  ].join('');

  // Extract last 8 alphanumeric characters from appName if provided
  // Total: 8 (prefix) + 12 (timestamp) = 20 chars (at 20 char limit)
  if (appName) {
    const alphanumericOnly = appName.replace(/[^a-zA-Z0-9]/g, '');
    const prefix = alphanumericOnly.slice(-8).toLowerCase();
    if (prefix.length > 0) {
      // Ensure prefix starts with a letter to avoid CDK resource naming issues
      const safePrefix = /^[a-z]/.test(prefix) ? prefix : `e${prefix.slice(1)}`;
      return `${safePrefix}${timestamp}`;
    }
  }
  // if no app name provided, prefix with word starting with alphabetic to avoid CDK resource naming issues
  // eslint-disable-next-line spellcheck/spell-checker
  return `e2etests${timestamp}`;
};
