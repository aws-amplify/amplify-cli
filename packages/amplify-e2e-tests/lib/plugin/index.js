"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listGeneralInfo = exports.listExcluded = exports.listActive = exports.scan = exports.help = void 0;
__exportStar(require("./new-plugin"), exports);
__exportStar(require("./verifyPluginStructure"), exports);
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
function help(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['plugin', 'help'], { cwd: cwd, stripColors: true })
            .wait(/.*/)
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.help = help;
function scan(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['plugin', 'scan'], { cwd: cwd, stripColors: true })
            .wait(/.*/)
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.scan = scan;
function listActive(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['plugin', 'list'], { cwd: cwd, stripColors: true })
            .wait('Select the section to list')
            .sendLine('')
            .wait('Select the name of the plugin to list')
            .sendLine('k')
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.listActive = listActive;
function listExcluded(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['plugin', 'list'], { cwd: cwd, stripColors: true })
            .wait('Select the section to list')
            .sendLine('j')
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.listExcluded = listExcluded;
function listGeneralInfo(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['plugin', 'list'], { cwd: cwd, stripColors: true })
            .wait('Select the section to list')
            .sendLine('j')
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.listGeneralInfo = listGeneralInfo;
//# sourceMappingURL=index.js.map