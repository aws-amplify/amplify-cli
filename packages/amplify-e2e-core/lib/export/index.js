"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPullBackend = exports.exportBackend = void 0;
const __1 = require("..");
function exportBackend(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['export', '--out', settings.exportPath], { cwd, stripColors: true })
            .wait('For more information: https://docs.amplify.aws/cli/usage/export-to-cdk')
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.exportBackend = exportBackend;
function exportPullBackend(cwd, settings) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['export', 'pull', '--out', settings.exportPath, '--frontend', settings.frontend, '--rootStackName', settings.rootStackName], { cwd, stripColors: true })
            .wait('Successfully generated frontend config files')
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.exportPullBackend = exportPullBackend;
//# sourceMappingURL=index.js.map