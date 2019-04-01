"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var fs_1 = require("fs");
var rimraf = require("rimraf");
var dotenv_1 = require("dotenv");
var projectMeta_1 = require("./projectMeta");
exports.getProjectMeta = projectMeta_1.default;
// run dotenv config to update env variable
dotenv_1.config();
function getCLIPath() {
    return path_1.join(__dirname, '..', '..', '..', 'amplify-cli', 'bin', 'amplify');
}
exports.getCLIPath = getCLIPath;
function createNewProjectDir(root) {
    if (!root) {
        root = path_1.join(__dirname, '../../../..', "amplify-integ-" + Math.round(Math.random() * 100) + "-test-" + Math.round(Math.random() * 1000));
    }
    fs_1.mkdirSync(root);
    return root;
}
exports.createNewProjectDir = createNewProjectDir;
function deleteProjectDir(root) {
    return rimraf.sync(root);
}
exports.deleteProjectDir = deleteProjectDir;
function isCI() {
    return process.env.CI ? true : false;
}
exports.isCI = isCI;
function getEnvVars() {
    return __assign({}, process.env);
}
exports.getEnvVars = getEnvVars;
//# sourceMappingURL=index.js.map