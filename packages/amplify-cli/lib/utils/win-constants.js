"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tmpRegPath = exports.pendingDeletePath = exports.oldVersionPath = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const os_1 = require("os");
exports.oldVersionPath = path.join(amplify_cli_core_1.pathManager.getHomeDotAmplifyDirPath(), 'bin', 'amplify-old.exe');
exports.pendingDeletePath = path.join((0, os_1.homedir)(), '.amplify-pending-delete.exe');
exports.tmpRegPath = path.join((0, os_1.tmpdir)(), 'tmp.reg');
//# sourceMappingURL=win-constants.js.map