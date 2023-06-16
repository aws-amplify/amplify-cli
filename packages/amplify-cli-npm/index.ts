import { Binary } from './binary';

/**
 * Proxies commands to the downloaded binary
 */
export const run = async (): Promise<void> => {
  const binary = new Binary();
  return binary.run();
};

/**
 * Downloads the amplify cli binary
 */
export const install = async (): Promise<void> => {
  const binary = new Binary();
  return binary.install();
};

// force version bump to 12.1.0
