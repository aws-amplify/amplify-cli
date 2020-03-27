import { CheckDependenciesResult } from 'amplify-function-plugin-interface/src';
import { execAsStringPromise, majMinPyVersion } from './pyUtils';

export async function checkDeps(): Promise<CheckDependenciesResult> {
  return new Promise((resolve, reject) => {
    Promise.all([execAsStringPromise('python3 --version'), execAsStringPromise('pipenv --version')]).then(versions => {
      let hasDeps = true;
      let errorMessage = '';
      if (!versions[0] || parseFloat(majMinPyVersion(versions[0])) < 3.8) {
        hasDeps = false;
        errorMessage =
          'You must have python >= 3.8 installed and available on your PATH as "python3". It can be installed at https://www.python.org/downloads';
      }
      if (!versions[1]) {
        hasDeps = false;
        let message =
          'You must have pipenv installed and available on your PATH as "pipenv". It can be installed by running "pip install pipenv".';
        errorMessage = errorMessage.concat(errorMessage ? '\n' : '', message);
      }
      resolve({
        hasRequiredDependencies: hasDeps,
        errorMessage,
      });
    });
  });
}
