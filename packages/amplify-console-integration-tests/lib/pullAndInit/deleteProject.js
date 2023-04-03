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
exports.headlessDelete = void 0;
var util = __importStar(require("../util"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var headlessDelete = function (projectRootDirPath) {
    return (0, amplify_e2e_core_1.nspawn)(util.getCLIPath(), ['delete'], { cwd: projectRootDirPath, stripColors: true })
        .wait('Are you sure you want to continue?')
        .sendYes()
        .wait('Project deleted locally.')
        .runAsync();
};
exports.headlessDelete = headlessDelete;
//# sourceMappingURL=deleteProject.js.map