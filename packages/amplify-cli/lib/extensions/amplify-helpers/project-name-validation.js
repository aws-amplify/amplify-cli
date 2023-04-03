"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeProjectName = exports.isProjectNameValid = exports.invalidAlphanumericRegex = exports.validAlphanumericRegex = void 0;
const make_id_1 = require("./make-id");
exports.validAlphanumericRegex = /^[a-zA-Z0-9]+$/;
exports.invalidAlphanumericRegex = /[^a-zA-Z0-9]/g;
function isProjectNameValid(projectName) {
    return !!projectName && projectName.length >= 3 && projectName.length <= 20 && exports.validAlphanumericRegex.test(projectName);
}
exports.isProjectNameValid = isProjectNameValid;
function normalizeProjectName(projectName) {
    if (!projectName) {
        projectName = `amplify${(0, make_id_1.makeId)(5)}`;
    }
    if (!isProjectNameValid(projectName)) {
        projectName = projectName.replace(exports.invalidAlphanumericRegex, '');
        if (projectName.length < 3) {
            projectName += (0, make_id_1.makeId)(5);
        }
        else if (projectName.length > 20) {
            projectName = projectName.substring(0, 20);
        }
    }
    return projectName;
}
exports.normalizeProjectName = normalizeProjectName;
//# sourceMappingURL=project-name-validation.js.map