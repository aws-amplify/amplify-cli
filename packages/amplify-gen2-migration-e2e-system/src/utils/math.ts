/**
 * Generates a time-based Amplify app name with optional app name suffix.
 * Format: e[YYMMDDHHMMSSMM][last3alphanumeric] (max 18 chars for Amplify compatibility)
 * Prefixed with 'e' to ensure CDK resource names start with an alphabetic character.
 * @param appName Optional app name to extract last 3 alphanumeric characters from
 * @returns A unique, sortable app name starting with a letter (max 18 chars)
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
    String(now.getMilliseconds()).padStart(3, '0').slice(0, 2), // MM (first 2 digits of ms)
  ].join('');

  // Prefix with 'e' (for e2e) to ensure name starts with alphabetic character
  // CDK requires resource names to start with a letter
  const prefix = 'e';

  // Extract last 3 alphanumeric characters from appName if provided
  // Total: 1 (prefix) + 14 (timestamp) + 3 (suffix) = 18 chars (under 20 limit)
  if (appName) {
    const alphanumericOnly = appName.replace(/[^a-zA-Z0-9]/g, '');
    const suffix = alphanumericOnly.slice(-3).toLowerCase();
    if (suffix.length > 0) {
      return `${prefix}${timestamp}${suffix}`;
    }
  }

  return `${prefix}${timestamp}`;
};
