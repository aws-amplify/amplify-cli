"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.authConfigPull = exports.headlessPull = void 0;
var util = __importStar(require("../util"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var os_1 = require("os");
var defaultSettings = {
    name: os_1.EOL,
    editor: os_1.EOL,
    appType: os_1.EOL,
    framework: os_1.EOL,
    srcDir: os_1.EOL,
    distDir: os_1.EOL,
    buildCmd: os_1.EOL,
    startCmd: os_1.EOL,
    useProfile: os_1.EOL,
    profileName: os_1.EOL,
};
function headlessPull(projectRootDirPath, amplifyParam, providersParam, categoryConfig, frontendConfig) {
    var pullCommand = [
        'pull',
        '--amplify',
        JSON.stringify(amplifyParam),
        '--providers',
        JSON.stringify(providersParam),
        '--no-override',
        '--yes',
    ];
    if (categoryConfig)
        pullCommand.push.apply(pullCommand, ['--categories', JSON.stringify(categoryConfig)]);
    if (frontendConfig)
        pullCommand.push('--frontend', JSON.stringify(frontendConfig));
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)(util.getCLIPath(), pullCommand, { cwd: projectRootDirPath, stripColors: true }).run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.headlessPull = headlessPull;
function authConfigPull(projectRootDirPath, params, settings) {
    if (settings === void 0) { settings = {}; }
    var pullCommand = ['pull'];
    Object.keys(params).forEach(function (key) {
        if (params[key])
            pullCommand.push.apply(pullCommand, ["--".concat(key), JSON.stringify(params[key])]);
    });
    var s = __assign(__assign({}, defaultSettings), settings);
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)(util.getCLIPath(), pullCommand, { cwd: projectRootDirPath, stripColors: true })
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendLine(s.profileName)
            .wait('Choose your default editor:')
            .sendLine(s.editor)
            .wait("Choose the type of app that you're building")
            .sendLine(s.appType)
            .wait('What javascript framework are you using')
            .sendLine(s.framework)
            .wait('Source Directory Path:')
            .sendLine(s.srcDir)
            .wait('Distribution Directory Path:')
            .sendLine(s.distDir)
            .wait('Build Command:')
            .sendLine(s.buildCmd)
            .wait('Start Command:')
            .sendLine(s.startCmd)
            .wait('Do you plan on modifying this backend?')
            .sendConfirmYes()
            .wait('Successfully pulled backend environment dev from the cloud.')
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.authConfigPull = authConfigPull;
//# sourceMappingURL=pullProject.js.map