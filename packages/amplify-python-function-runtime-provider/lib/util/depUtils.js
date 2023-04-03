"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDeps = exports.minPyVersion = void 0;
const pyUtils_1 = require("./pyUtils");
const semver_1 = require("semver");
exports.minPyVersion = (0, semver_1.coerce)('3.8');
const pythonErrMsg = 'You must have python >= 3.8 installed and available on your PATH as "python3" or "python". It can be installed from https://www.python.org/downloads';
const pipenvErrMsg = 'You must have pipenv installed and available on your PATH as "pipenv". It can be installed by running "pip3 install --user pipenv".';
const venvErrMsg = 'You must have virtualenv installed and available on your PATH as "venv". It can be installed by running "pip3 install venv".';
async function checkDeps() {
    let hasDeps = true;
    let errMsg = '';
    const pyBinary = (0, pyUtils_1.getPythonBinaryName)();
    if (!pyBinary) {
        hasDeps = false;
        errMsg = `Could not find "python3" or "python" executable in the PATH.`;
    }
    else {
        try {
            const pyVersionStr = await (0, pyUtils_1.execAsStringPromise)(`${pyBinary} --version`);
            const pyVersion = (0, semver_1.coerce)(pyVersionStr);
            if (!pyVersion || (0, semver_1.lt)(pyVersion, exports.minPyVersion)) {
                hasDeps = false;
                errMsg = `${pyBinary} found but version ${pyVersionStr} is less than the minimum required version.\n${pythonErrMsg}`;
            }
        }
        catch (err) {
            hasDeps = false;
            errMsg = `Error executing ${pyBinary}\n${pythonErrMsg}`;
        }
    }
    try {
        await (0, pyUtils_1.execAsStringPromise)('pipenv --version');
    }
    catch (err) {
        hasDeps = false;
        errMsg = errMsg.concat(errMsg ? '\n' : '', pipenvErrMsg);
    }
    try {
        await (0, pyUtils_1.execAsStringPromise)('virtualenv --version');
    }
    catch (err) {
        hasDeps = false;
        errMsg = errMsg.concat(errMsg ? '\n' : '', venvErrMsg);
    }
    return Promise.resolve({ hasRequiredDependencies: hasDeps, errorMessage: errMsg });
}
exports.checkDeps = checkDeps;
//# sourceMappingURL=depUtils.js.map