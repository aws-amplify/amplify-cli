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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHostingBucketInfo = exports.resetBuildCommand = exports.createReactTestProject = exports.removeHosting = exports.amplifyPublishWithoutUpdateWithYesFlag = exports.amplifyPublishWithoutUpdate = exports.amplifyPublishWithUpdate = exports.amplifyPushWithUpdate = exports.removePRODCloudFront = exports.addPRODHosting = exports.addDevContainerHosting = exports.enableContainerHosting = exports.addDEVHosting = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const __1 = require("..");
const lodash_1 = __importDefault(require("lodash"));
const child_process_1 = require("child_process");
const utils_1 = require("../utils");
function addDEVHosting(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'hosting'], { cwd, stripColors: true })
            .wait('Select the plugin module to execute')
            .send(__1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .wait('Select the environment setup:')
            .sendCarriageReturn()
            .wait('hosting bucket name')
            .sendCarriageReturn()
            .wait('index doc for the website')
            .sendCarriageReturn()
            .wait('error doc for the website')
            .sendCarriageReturn()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addDEVHosting = addDEVHosting;
function enableContainerHosting(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['configure', 'project'], { cwd, stripColors: true })
            .wait('Which setting do you want to configure?')
            .sendKeyDown(2)
            .sendCarriageReturn()
            .wait('Do you want to enable container-based deployments?')
            .sendConfirmYes()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.enableContainerHosting = enableContainerHosting;
function addDevContainerHosting(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'hosting'], { cwd, stripColors: true })
            .wait('Select the plugin module to execute')
            .sendKeyDown(2)
            .sendCarriageReturn()
            .wait('Provide your web app endpoint (e.g. app.example.com or www.example.com):')
            .sendLine('www.test-amplify-app.com')
            .wait('Do you want to automatically protect your web app using Amazon Cognito Hosted UI')
            .sendConfirmNo()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addDevContainerHosting = addDevContainerHosting;
function addPRODHosting(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['add', 'hosting'], { cwd, stripColors: true })
            .wait('Select the plugin module to execute')
            .send(__1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .wait('Select the environment setup:')
            .send(__1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .wait('hosting bucket name')
            .sendCarriageReturn()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addPRODHosting = addPRODHosting;
function removePRODCloudFront(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['update', 'hosting'], { cwd, stripColors: true })
            .wait('Specify the section to configure')
            .send(__1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .wait('Remove CloudFront from hosting')
            .send('y')
            .sendCarriageReturn()
            .wait('index doc for the website')
            .sendCarriageReturn()
            .wait('error doc for the website')
            .sendCarriageReturn()
            .wait('Specify the section to configure')
            .send(__1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.removePRODCloudFront = removePRODCloudFront;
const amplifyPushWithUpdate = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['push'], { cwd, stripColors: true })
        .wait('Are you sure you want to continue?')
        .sendCarriageReturn()
        .runAsync();
});
exports.amplifyPushWithUpdate = amplifyPushWithUpdate;
const amplifyPublishWithUpdate = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['publish'], { cwd, stripColors: true })
        .wait('Are you sure you want to continue?')
        .sendCarriageReturn()
        .runAsync();
});
exports.amplifyPublishWithUpdate = amplifyPublishWithUpdate;
function amplifyPublishWithoutUpdate(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['publish'], { cwd, stripColors: true })
            .wait('Do you still want to publish the frontend')
            .sendConfirmYes()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyPublishWithoutUpdate = amplifyPublishWithoutUpdate;
/**
 * executes publish command with yes flag
 */
const amplifyPublishWithoutUpdateWithYesFlag = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['publish', '-y'], { cwd, stripColors: true });
    return chain.runAsync();
});
exports.amplifyPublishWithoutUpdateWithYesFlag = amplifyPublishWithoutUpdateWithYesFlag;
function removeHosting(cwd) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['remove', 'hosting'], { cwd, stripColors: true })
            .wait('Choose the resource you would want to remove')
            .sendCarriageReturn()
            .wait('Are you sure you want to delete the resource?')
            .sendCarriageReturn()
            .wait('Successfully removed resource')
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.removeHosting = removeHosting;
function createReactTestProject() {
    return __awaiter(this, void 0, void 0, function* () {
        const projRoot = yield (0, __1.createNewProjectDir)('hosting');
        const projectName = path.basename(projRoot);
        const projectDir = path.dirname(projRoot);
        (0, child_process_1.spawnSync)((0, __1.getNpxPath)(), ['create-react-app', '--scripts-version', '5.0.1', projectName], { cwd: projectDir });
        return projRoot;
    });
}
exports.createReactTestProject = createReactTestProject;
function resetBuildCommand(projectDir, newBuildCommand) {
    const projectConfigFilePath = path.join(projectDir, 'amplify', '.config', 'project-config.json');
    const projectConfig = (0, __1.readJsonFile)(projectConfigFilePath);
    const currentBuildCommand = projectConfig.javascript.config.BuildCommand;
    projectConfig.javascript.config.BuildCommand = newBuildCommand;
    fs.writeFileSync(projectConfigFilePath, JSON.stringify(projectConfig, null, 4));
    return currentBuildCommand;
}
exports.resetBuildCommand = resetBuildCommand;
function extractHostingBucketInfo(projectDir) {
    const meta = (0, utils_1.getBackendAmplifyMeta)(projectDir);
    return lodash_1.default.get(meta, ['hosting', 'S3AndCloudFront', 'output', 'HostingBucketName']);
}
exports.extractHostingBucketInfo = extractHostingBucketInfo;
//# sourceMappingURL=hosting.js.map