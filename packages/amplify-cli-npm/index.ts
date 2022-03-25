import { Binary } from './binary';

/**
 * proxies commands to the downloaded binary
 */
export const run = async (): Promise<void> => {
  const binary = new Binary();
  binary.run();
};

/**
 * downloads the amplify cli binary
 */
export const install = async (): Promise<void> => {
  const binary = new Binary();
  return binary.install();
};
