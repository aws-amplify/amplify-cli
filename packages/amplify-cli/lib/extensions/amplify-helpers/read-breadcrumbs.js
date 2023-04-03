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
exports.readBreadcrumbs = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const constants_1 = require("./constants");
const leave_breadcrumbs_1 = require("./leave-breadcrumbs");
function readBreadcrumbs(category, resourceName) {
    const breadcrumbsPath = path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), category, resourceName, constants_1.amplifyCLIConstants.BreadcrumbsFileName);
    let breadcrumbs = amplify_cli_core_1.JSONUtilities.readJson(breadcrumbsPath, {
        throwIfNotExist: false,
    });
    if (!breadcrumbs) {
        breadcrumbs = {
            pluginId: 'amplify-nodejs-function-runtime-provider',
            functionRuntime: 'nodejs',
            defaultEditorFile: 'src/index.js',
            useLegacyBuild: true,
        };
        (0, leave_breadcrumbs_1.leaveBreadcrumbs)(category, resourceName, breadcrumbs);
    }
    return breadcrumbs;
}
exports.readBreadcrumbs = readBreadcrumbs;
//# sourceMappingURL=read-breadcrumbs.js.map