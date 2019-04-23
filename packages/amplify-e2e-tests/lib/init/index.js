"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var initProjectHelper_1 = require("./initProjectHelper");
exports.initProjectWithProfile = initProjectHelper_1.default;
exports.initProjectWithAccessKey = initProjectHelper_1.initProjectWithAccessKey;
exports.initNewEnvWithAccessKey = initProjectHelper_1.initNewEnvWithAccessKey;
exports.initNewEnvWithProfile = initProjectHelper_1.initNewEnvWithProfile;
var amplifyPush_1 = require("./amplifyPush");
exports.amplifyPush = amplifyPush_1.default;
var utils_1 = require("../utils");
exports.getProjectMeta = utils_1.getProjectMeta;
var deleteProject_1 = require("./deleteProject");
exports.deleteProject = deleteProject_1.default;
//# sourceMappingURL=index.js.map