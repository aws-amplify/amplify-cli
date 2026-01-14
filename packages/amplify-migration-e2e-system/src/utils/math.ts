/**
 * Generates a time-based Amplify app name with optional app name suffix.
 * Format: YYMMDDHHMMSSNNN[last4alphanumeric] (max 20 chars for Amplify compatibility)
 * @param appName Optional app name to extract last 4 alphanumeric characters from
 * @returns A unique, sortable app name
 */
export const generateTimeBasedE2EAmplifyAppName = (appName?: string): string => {
  const now = new Date();

  // Format: YYMMDDHHMMSSNNN (human-readable, sortable) - 15 chars
  const timestamp = [
    String(now.getFullYear()).slice(-2), // YY
    String(now.getMonth() + 1).padStart(2, '0'), // MM
    String(now.getDate()).padStart(2, '0'), // DD
    String(now.getHours()).padStart(2, '0'), // HH
    String(now.getMinutes()).padStart(2, '0'), // MM
    String(now.getSeconds()).padStart(2, '0'), // SS
    String(now.getMilliseconds()).padStart(3, '0'), // NNN
  ].join('');

  // Extract last 4 alphanumeric characters from appName if provided
  if (appName) {
    const alphanumericOnly = appName.replace(/[^a-zA-Z0-9]/g, '');
    const suffix = alphanumericOnly.slice(-4).toLowerCase();
    if (suffix.length > 0) {
      return `${timestamp}${suffix}`;
    }
  }

  return timestamp;
};
