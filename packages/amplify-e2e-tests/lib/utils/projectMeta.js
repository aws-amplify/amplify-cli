"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var fs_1 = require("fs");
function getProjectMeta(projectRoot) {
    var metaFilePath = path_1.join(projectRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    return JSON.parse(fs_1.readFileSync(metaFilePath, 'utf8'));
}
exports.default = getProjectMeta;
//# sourceMappingURL=projectMeta.js.map