import ci from 'ci-info';

/**
 * Determine if the CLI is running in a CI/CD environment or not.
 * Currently this is just a proxy to ci-info but we may want to include other signals in the future
 */
export const isCI = () => {
  return ci.isCI;
};
