import { printer } from 'amplify-prompts';
import { AmplifyVmSandboxEnv, VmSandbox } from '../types';
import { getProjectInfo } from './project-info';

/**
 * @description Provides a sandbox configuration for use in overrides within vm2.
 * @returns sandbox object for use in overrides vm sandbox
 */
export function getVmSandbox(): VmSandbox {
  const sandbox = {
    amplify: {
      env: getAmplifyEnvironment(),
      projectInfo: getProjectInfo()
    }
  }
  printer.debug(`override: vm sandbox: ${ JSON.stringify(sandbox) }`);
  return sandbox;
}

/**
 * @description Filters process.env to keys matching output of AmplifyVmSandboxEnvKeys().
 * @returns Filtered process.env
 */
function getAmplifyEnvironment(): AmplifyVmSandboxEnv {
  const amplifyEnv: AmplifyVmSandboxEnv = {};
  const amplifyVmSandboxEnvKeys: (string | RegExp)[] = [
    // https://docs.aws.amazon.com/amplify/latest/userguide/environment-variables.html#amplify-console-environment-variables
    '_BUILD_TIMEOUT',
    '_LIVE_UPDATES',
    /^AMPLIFY_/,
    /^AWS_/,
  ];

  // environment keys that should never be available to the override
  const forbiddenKeys: (string | RegExp)[] = [
    'AWS_ACCESS_KEY_ID',
    /SECRET/i,
  ];

  // set of process.env keys that are not forbidden
  const allowedKeys: Set<string> = new Set(Object.keys(process.env).filter(key => {
    return !forbiddenKeys.some(forbiddenKey => {
      const isForbiddenKey = ((typeof forbiddenKey === 'string' && forbiddenKey === key) || (forbiddenKey instanceof RegExp && forbiddenKey.test(key)));
      if (isForbiddenKey) {
        // todo: Replace printer.debug() with printer.trace() if it is added
        printer.debug(`override: Excluding forbidden environment key: ${ key }`);
      }
      return isForbiddenKey;
    })
  }));

  // build the new env with k/v pairs from the allowedKeys where the key names match the rules specified in amplifyVmSandboxEnvKeys
  amplifyVmSandboxEnvKeys.forEach(key => {
    if (typeof key === 'string' && allowedKeys.has(key)) {
      // todo: Replace printer.debug() with printer.trace() if it is added
      printer.debug(`override: Adding environment key from exact match: ${key}`);
      Object.assign(amplifyEnv, {[key]: process.env[key]});
      allowedKeys.delete(key);
    } else if (key instanceof RegExp) {
      for (const allowedKey of allowedKeys) {
        if (key.test(allowedKey)) {
          // todo: Replace printer.debug() with printer.trace() if it is added
          printer.debug(`override: Adding environment key from RegExp match: ${allowedKey}`);
          Object.assign(amplifyEnv, { [allowedKey]: process.env[allowedKey] });
          allowedKeys.delete(allowedKey);
        }
      }
    }
  });

  // ensure that we are returning a new copy of the environment variables
  return JSON.parse(JSON.stringify(amplifyEnv)) as AmplifyVmSandboxEnv;
}
