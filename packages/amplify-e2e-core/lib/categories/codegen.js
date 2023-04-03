"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateModels = void 0;
const __1 = require("..");
function generateModels(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['codegen', 'models'], { cwd, stripColors: true }).run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.generateModels = generateModels;
//# sourceMappingURL=codegen.js.map