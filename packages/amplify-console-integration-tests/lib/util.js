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
exports.readJsonFileSync = exports.getProfileName = exports.deleteProjectDir = exports.createNewProjectDir = exports.npmInstall = exports.isCI = exports.getCLIPath = void 0;
var fs = __importStar(require("fs-extra"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
Object.defineProperty(exports, "getCLIPath", { enumerable: true, get: function () { return amplify_e2e_core_1.getCLIPath; } });
Object.defineProperty(exports, "isCI", { enumerable: true, get: function () { return amplify_e2e_core_1.isCI; } });
Object.defineProperty(exports, "npmInstall", { enumerable: true, get: function () { return amplify_e2e_core_1.npmInstall; } });
Object.defineProperty(exports, "createNewProjectDir", { enumerable: true, get: function () { return amplify_e2e_core_1.createNewProjectDir; } });
function deleteProjectDir(projectDirpath) {
    return fs.removeSync(projectDirpath);
}
exports.deleteProjectDir = deleteProjectDir;
function getProfileName() {
    return 'console-integration-test-user';
}
exports.getProfileName = getProfileName;
function stripBOM(content) {
    // tslint:disable-next-line
    if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
    }
    return content;
}
function readJsonFileSync(jsonFilePath, encoding) {
    if (encoding === void 0) { encoding = 'utf8'; }
    return JSON.parse(stripBOM(fs.readFileSync(jsonFilePath, encoding)));
}
exports.readJsonFileSync = readJsonFileSync;
//# sourceMappingURL=util.js.map