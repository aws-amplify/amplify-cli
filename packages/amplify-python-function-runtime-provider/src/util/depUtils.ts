import { CheckDependenciesResult } from 'amplify-function-plugin-interface';
import { execAsStringPromise, getPythonBinaryName } from './pyUtils';
import { coerce, lt } from 'semver';

export const minPyVersion = coerce('3.8')!;
const pythonErrMsg =
  'You must have python >= 3.8 installed and available on your PATH as "python3" or "python". It can be installed from https://www.python.org/downloads';
const pipenvErrMsg =
  'You must have pipenv installed and available on your PATH as "pipenv". It can be installed by running "pip3 install --user pipenv".';

const venvErrMsg =
  'You must have virtualenv installed and available on your PATH as "venv". It can be installed by running "pip3 install venv".';

export async function checkDeps(): Promise<CheckDependenciesResult> {
  let hasDeps = true;
  let errMsg = '';

  const pyBinary = getPythonBinaryName();

  if (!pyBinary) {
    hasDeps = false;
    errMsg = `Could not find "python3" or "python" executable in the PATH.`;
  } else {
    try {
      const pyVersionStr = await execAsStringPromise(`${pyBinary} --version`);
      const pyVersion = coerce(pyVersionStr);
      if (!pyVersion || lt(pyVersion, minPyVersion)) {
        hasDeps = false;
        errMsg = `${pyBinary} found but version ${pyVersionStr} is less than the minimum required version.\n${pythonErrMsg}`;
      }
    } catch (err) {
      hasDeps = false;
      errMsg = `Error executing ${pyBinary}\n${pythonErrMsg}`;
    }
  }

  // check pipenv
  try {
    await execAsStringPromise('pipenv --version');
  } catch (err) {
    hasDeps = false;
    errMsg = errMsg.concat(errMsg ? '\n' : '', pipenvErrMsg);
  }

  // check venv
  try {
    await execAsStringPromise('virtualenv --version');
  } catch (err) {
    hasDeps = false;
    errMsg = errMsg.concat(errMsg ? '\n' : '', venvErrMsg);
  }

  return Promise.resolve({ hasRequiredDependencies: hasDeps, errorMessage: errMsg });
}
