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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTempDir = exports.createNewProjectDir = exports.installAmplifyCLI = exports.npmInstall = exports.injectSessionToken = exports.getNpmPath = exports.getNpxPath = exports.getScriptRunnerPath = exports.isTestingWithLatestCodebase = exports.getCLIPath = exports.addFeatureFlag = void 0;
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-cycle */
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const ini = __importStar(require("ini"));
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const amplify_cli_core_1 = require("amplify-cli-core");
const semver_1 = require("semver");
const _1 = require(".");
__exportStar(require("./diagnose"), exports);
__exportStar(require("./configure"), exports);
__exportStar(require("./init"), exports);
__exportStar(require("./utils"), exports);
__exportStar(require("./categories"), exports);
__exportStar(require("./export"), exports);
var feature_flags_1 = require("./utils/feature-flags");
Object.defineProperty(exports, "addFeatureFlag", { enumerable: true, get: function () { return feature_flags_1.addFeatureFlag; } });
__exportStar(require("./cli-version-controller"), exports);
const amplifyTestsDir = 'amplify-e2e-tests';
function getCLIPath(testingWithLatestCodebase = false) {
    if (!testingWithLatestCodebase) {
        if (process.env.AMPLIFY_PATH && fs.existsSync(process.env.AMPLIFY_PATH)) {
            return process.env.AMPLIFY_PATH;
        }
        return process.platform === 'win32' ? 'amplify.exe' : 'amplify';
    }
    const amplifyScriptPath = path.join(__dirname, '..', '..', 'amplify-cli', 'bin', 'amplify');
    return amplifyScriptPath;
}
exports.getCLIPath = getCLIPath;
function isTestingWithLatestCodebase(scriptRunnerPath) {
    return scriptRunnerPath === process.execPath;
}
exports.isTestingWithLatestCodebase = isTestingWithLatestCodebase;
function getScriptRunnerPath(testingWithLatestCodebase = false) {
    if (!testingWithLatestCodebase) {
        return process.platform === 'win32' ? 'node.exe' : 'exec';
    }
    // nodejs executable
    return process.execPath;
}
exports.getScriptRunnerPath = getScriptRunnerPath;
function getNpxPath() {
    let npxPath = 'npx';
    if (process.platform === 'win32') {
        npxPath = getScriptRunnerPath().replace('node.exe', 'npx.cmd');
    }
    return npxPath;
}
exports.getNpxPath = getNpxPath;
function getNpmPath() {
    let npmPath = 'npm';
    if (process.platform === 'win32') {
        npmPath = getScriptRunnerPath().replace('node.exe', 'npm.cmd');
    }
    return npmPath;
}
exports.getNpmPath = getNpmPath;
function injectSessionToken(profileName) {
    const credentialsContents = ini.parse(fs.readFileSync(amplify_cli_core_1.pathManager.getAWSCredentialsFilePath()).toString());
    credentialsContents[profileName] = credentialsContents[profileName] || {};
    credentialsContents[profileName].aws_session_token = process.env.AWS_SESSION_TOKEN;
    fs.writeFileSync(amplify_cli_core_1.pathManager.getAWSCredentialsFilePath(), ini.stringify(credentialsContents));
}
exports.injectSessionToken = injectSessionToken;
function npmInstall(cwd) {
    (0, child_process_1.spawnSync)('npm', ['install'], { cwd });
}
exports.npmInstall = npmInstall;
function installAmplifyCLI(version = 'latest') {
    return __awaiter(this, void 0, void 0, function* () {
        (0, child_process_1.spawnSync)('npm', ['install', '-g', `@aws-amplify/cli@${version}`], {
            cwd: process.cwd(),
            env: process.env,
            stdio: 'inherit',
        });
        console.log('SETTING PATH:');
        if ((0, semver_1.gt)(version, '10.0.0')) {
            process.env.AMPLIFY_PATH =
                process.platform === 'win32'
                    ? path.join(os.homedir(), '.amplify', 'bin', 'amplify')
                    : path.join(os.homedir(), '.amplify', 'bin', 'amplify');
        }
        else {
            process.env.AMPLIFY_PATH =
                process.platform === 'win32'
                    ? path.join(os.homedir(), '..', '..', 'Program` Files', 'nodejs', 'node_modules', '@aws-amplify', 'cli', 'bin', 'amplify')
                    : path.join(os.homedir(), '.npm-global', 'bin', 'amplify');
        }
        console.log('PATH SET:', process.env.AMPLIFY_PATH);
    });
}
exports.installAmplifyCLI = installAmplifyCLI;
function createNewProjectDir(projectName, 
// eslint-disable-next-line spellcheck/spell-checker
prefix = path.join(fs.realpathSync(os.tmpdir()), amplifyTestsDir)) {
    return __awaiter(this, void 0, void 0, function* () {
        let projectDir;
        do {
            projectDir = path.join(prefix, `${projectName}_${Math.floor(Math.random() * 1000000)}`);
        } while (fs.existsSync(projectDir));
        fs.ensureDirSync(projectDir);
        const initialDelay = Math.floor(Math.random() * 180 * 1000);
        yield (0, _1.sleep)(initialDelay);
        console.log(projectDir);
        return projectDir;
    });
}
exports.createNewProjectDir = createNewProjectDir;
const createTempDir = () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const osTempDir = fs.realpathSync(os.tmpdir());
    const tempProjectDir = path.join(osTempDir, amplifyTestsDir, (0, uuid_1.v4)());
    fs.mkdirsSync(tempProjectDir);
    return tempProjectDir;
};
exports.createTempDir = createTempDir;
//# sourceMappingURL=index.js.map