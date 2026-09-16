import { CheckDependenciesResult } from '@aws-amplify/amplify-function-plugin-interface';
import { getPythonBinaryName } from './pyUtils';
import { coerce, lt } from 'semver';
import { execWithOutputAsString } from '@aws-amplify/amplify-cli-core';

export const minPyVersion = coerce('3.8')!;
const pythonErrMsg =
  'You must have python >= 3.8 installed and available on your PATH as "python3" or "python". It can be installed from https://www.python.org/downloads';
const packageManagerErrMsg =
  'You must have either uv (recommended) or pipenv installed and available on your PATH. ' +
  'Install uv from https://docs.astral.sh/uv/ for faster builds, or ' +
  'install pipenv by running "pip3 install --user pipenv".';

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
      const pyVersionStr = await execWithOutputAsString(`${pyBinary} --version`);
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

  // Check for package managers: uv (preferred) or pipenv (fallback)
  let hasPackageManager = false;

  // Check uv first (preferred)
  try {
    await execWithOutputAsString('uv --version');
    hasPackageManager = true;
  } catch (err) {
    // uv not available, check pipenv
    try {
      await execWithOutputAsString('pipenv --version');
      hasPackageManager = true;
    } catch (err) {
      // Neither available
      hasDeps = false;
      errMsg = errMsg.concat(errMsg ? '\n' : '', packageManagerErrMsg);
    }
  }

  // check venv
  try {
    await execWithOutputAsString('virtualenv --version');
  } catch (err) {
    hasDeps = false;
    errMsg = errMsg.concat(errMsg ? '\n' : '', venvErrMsg);
  }

  return Promise.resolve({ hasRequiredDependencies: hasDeps, errorMessage: errMsg });
}
