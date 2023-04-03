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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readFromPath = exports.getGQLDiff = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("amplify-cli-core");
const deep_diff_1 = require("deep-diff");
const ROOT_STACK_FILE_NAME = 'cloudformation-template.json';
const getGQLDiff = (currentBackendDir, cloudBackendDir) => {
    const currentBuildDir = path.join(currentBackendDir, 'build');
    const cloudBuildDir = path.join(cloudBackendDir, 'build');
    if (fs_extra_1.default.existsSync(cloudBuildDir) && fs_extra_1.default.existsSync(currentBuildDir)) {
        const current = loadDiffableProject(cloudBuildDir, ROOT_STACK_FILE_NAME);
        const next = loadDiffableProject(currentBuildDir, ROOT_STACK_FILE_NAME);
        return { current, next, diff: (0, deep_diff_1.diff)(current, next) };
    }
    return null;
};
exports.getGQLDiff = getGQLDiff;
function loadDiffableProject(path, rootStackName) {
    const project = readFromPath(path);
    const currentStacks = project.stacks || {};
    const diffableProject = {
        stacks: {},
        root: {},
    };
    for (const key of Object.keys(currentStacks)) {
        diffableProject.stacks[key] = amplify_cli_core_1.JSONUtilities.parse(project.stacks[key]);
    }
    if (project[rootStackName]) {
        diffableProject.root = amplify_cli_core_1.JSONUtilities.parse(project[rootStackName]);
    }
    return diffableProject;
}
function readFromPath(directory) {
    const pathExists = fs_extra_1.default.pathExistsSync(directory);
    if (!pathExists) {
        return undefined;
    }
    const dirStats = fs_extra_1.default.lstatSync(directory);
    if (!dirStats.isDirectory()) {
        const buf = fs_extra_1.default.readFileSync(directory);
        return buf.toString();
    }
    const files = fs_extra_1.default.readdirSync(directory);
    const filesObject = {};
    for (const fileName of files) {
        const fullPath = path.join(directory, fileName);
        const value = readFromPath(fullPath);
        filesObject[fileName] = value;
    }
    return filesObject;
}
exports.readFromPath = readFromPath;
//# sourceMappingURL=utils.js.map