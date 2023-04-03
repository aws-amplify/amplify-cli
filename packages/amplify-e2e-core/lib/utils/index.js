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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomShortId = exports.getFunctionSrcNode = exports.addOptFile = exports.overrideLayerCodePython = exports.overrideLayerCodeNode = exports.overrideFunctionSrcPython = exports.overrideFunctionSrcNode = exports.overrideFunctionCodePython = exports.overrideFunctionCodeNode = exports.addNodeDependencies = exports.loadFunctionTestFile = exports.deleteAmplifyDir = exports.deleteProjectDir = exports.TEST_PROFILE_NAME = exports.isCI = void 0;
/* eslint-disable import/no-cycle */
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const rimraf = __importStar(require("rimraf"));
const dotenv_1 = require("dotenv");
const execa_1 = __importDefault(require("execa"));
const uuid_1 = require("uuid");
const __1 = require("..");
__exportStar(require("./add-circleci-tags"), exports);
__exportStar(require("./api"), exports);
__exportStar(require("./appsync"), exports);
__exportStar(require("./envVars"), exports);
__exportStar(require("./getAppId"), exports);
__exportStar(require("./headless"), exports);
__exportStar(require("./overrides"), exports);
__exportStar(require("./nexpect"), exports);
__exportStar(require("./pinpoint"), exports);
__exportStar(require("./projectMeta"), exports);
__exportStar(require("./readJsonFile"), exports);
__exportStar(require("./request"), exports);
__exportStar(require("./retrier"), exports);
__exportStar(require("./sdk-calls"), exports);
__exportStar(require("./selectors"), exports);
__exportStar(require("./sleep"), exports);
__exportStar(require("./transformConfig"), exports);
__exportStar(require("./admin-ui"), exports);
__exportStar(require("./hooks"), exports);
__exportStar(require("./git-operations"), exports);
__exportStar(require("./help"), exports);
/**
 * Whether the current environment is CircleCI or not
 */
const isCI = () => JSON.parse(process.env.CI || 'false') && JSON.parse(process.env.CIRCLECI || 'false');
exports.isCI = isCI;
// eslint-disable-next-line spellcheck/spell-checker
exports.TEST_PROFILE_NAME = (0, exports.isCI)() ? 'amplify-integ-test-user' : 'default';
// run dotenv config to update env variable
(0, dotenv_1.config)();
/**
 * delete project directory
 */
const deleteProjectDir = (root) => {
    try {
        rimraf.sync(root);
    }
    catch (e) {
        // directory does not exist/was already deleted
    }
};
exports.deleteProjectDir = deleteProjectDir;
/**
 * delete <project-root>/amplify directory
 */
const deleteAmplifyDir = (root) => {
    rimraf.sync(path.join(root, 'amplify'));
};
exports.deleteAmplifyDir = deleteAmplifyDir;
/**
 * load test file
 */
const loadFunctionTestFile = (fileName) => {
    const functionPath = getTestFileNamePath(fileName);
    return fs.readFileSync(functionPath, 'utf-8').toString();
};
exports.loadFunctionTestFile = loadFunctionTestFile;
/**
 * install and save node dependencies
 */
const addNodeDependencies = (root, functionName, dependencies) => {
    const indexPath = path.join(getPathToFunction(root, functionName), 'src');
    execa_1.default.commandSync(`yarn add ${dependencies.join(' ')}`, { cwd: indexPath });
};
exports.addNodeDependencies = addNodeDependencies;
/**
 * copy node function code from source to target
 */
const overrideFunctionCodeNode = (root, functionName, sourceFileName, targetFileName = 'index.js') => {
    const sourcePath = getTestFileNamePath(sourceFileName);
    const targetPath = path.join(getPathToFunction(root, functionName), 'src', targetFileName);
    fs.copySync(sourcePath, targetPath);
};
exports.overrideFunctionCodeNode = overrideFunctionCodeNode;
/**
 * copy python function code from source to target
 */
const overrideFunctionCodePython = (root, functionName, sourceFileName, targetFileName = 'index.py') => {
    const sourcePath = getTestFileNamePath(sourceFileName);
    const targetPath = path.join(getPathToFunction(root, functionName), 'lib', 'python', targetFileName);
    fs.copySync(sourcePath, targetPath);
};
exports.overrideFunctionCodePython = overrideFunctionCodePython;
/**
 * overwrite node function /src
 */
const overrideFunctionSrcNode = (root, functionName, content, targetFileName = 'index.js') => {
    const dirPath = path.join(getPathToFunction(root, functionName), 'src');
    const targetPath = path.join(dirPath, targetFileName);
    fs.ensureDirSync(dirPath);
    fs.writeFileSync(targetPath, content);
};
exports.overrideFunctionSrcNode = overrideFunctionSrcNode;
/**
 * overwrite node function /src
 */
const overrideFunctionSrcPython = (root, functionName, content, targetFileName = 'index.py') => {
    const dirPath = path.join(getPathToFunction(root, functionName), 'src');
    const targetPath = path.join(dirPath, targetFileName);
    fs.ensureDirSync(dirPath);
    fs.writeFileSync(targetPath, content);
};
exports.overrideFunctionSrcPython = overrideFunctionSrcPython;
/**
 * overwrite node layer content
 */
const overrideLayerCodeNode = (root, projectName, layerName, content, targetFileName = 'index.js') => {
    const dirPath = path.join(getPathToLayer(root, { projName: projectName, layerName }), 'lib', 'nodejs');
    const targetPath = path.join(dirPath, targetFileName);
    fs.ensureDirSync(dirPath);
    fs.writeFileSync(targetPath, content);
};
exports.overrideLayerCodeNode = overrideLayerCodeNode;
/**
 * overwrite python layer content
 */
const overrideLayerCodePython = (root, projectName, layerName, content, targetFileName = 'index.py') => {
    const dirPath = path.join(getPathToLayer(root, { projName: projectName, layerName }), 'lib', 'python');
    const targetPath = path.join(dirPath, targetFileName);
    fs.ensureDirSync(dirPath);
    fs.writeFileSync(targetPath, content);
};
exports.overrideLayerCodePython = overrideLayerCodePython;
/**
 * write target file to layer resource's opt/<targetFileName>
 */
const addOptFile = (root, projectName, layerName, content, targetFileName) => {
    const dirPath = path.join(getPathToLayer(root, { projName: projectName, layerName }), 'opt');
    const targetPath = path.join(dirPath, targetFileName);
    fs.ensureDirSync(dirPath);
    fs.writeFileSync(targetPath, content);
};
exports.addOptFile = addOptFile;
/**
 * get node function source file
 */
const getFunctionSrcNode = (root, functionName, fileName = 'index.js') => {
    const indexPath = path.join(getPathToFunction(root, functionName), 'src', fileName);
    return fs.readFileSync(indexPath).toString();
};
exports.getFunctionSrcNode = getFunctionSrcNode;
const getTestFileNamePath = (fileName) => path.join(__dirname, '..', '..', '..', 'amplify-e2e-tests', 'functions', fileName);
const getPathToFunction = (root, funcName) => path.join(root, 'amplify', 'backend', 'function', funcName);
const getPathToLayer = (root, layerProjectName) => path.join(root, 'amplify', 'backend', 'function', (0, __1.getLayerDirectoryName)(layerProjectName));
/**
 * Generate short v4 UUID
 * @returns short UUID
 */
const generateRandomShortId = () => (0, uuid_1.v4)().split('-')[0];
exports.generateRandomShortId = generateRandomShortId;
//# sourceMappingURL=index.js.map