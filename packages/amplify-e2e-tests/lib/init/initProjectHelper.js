"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var nexpect = require("nexpect");
var utils_1 = require("../utils");
var defaultSettings = {
    name: '\r',
    envName: 'integtest',
    editor: '\r',
    appType: '\r',
    framework: '\r',
    srcDir: '\r',
    distDir: '\r',
    buildCmd: '\r',
    startCmd: '\r',
    useProfile: '\r',
    profileName: '\r'
};
function initProjectWithProfile(cwd, settings, verbose) {
    if (verbose === void 0) { verbose = utils_1.isCI() ? false : true; }
    var s = __assign({}, defaultSettings, settings);
    return new Promise(function (resolve, reject) {
        nexpect
            .spawn(utils_1.getCLIPath(), ['init'], { cwd: cwd, stripColors: true, verbose: verbose })
            .wait('Enter a name for the project')
            .sendline(s.name)
            .wait('Enter a name for the environment')
            .sendline(s.envName)
            .wait('Choose your default editor:')
            .sendline(s.editor)
            .wait("Choose the type of app that you're building")
            .sendline(s.appType)
            .wait('What javascript framework are you using')
            .sendline(s.framework)
            .wait('Source Directory Path:')
            .sendline(s.srcDir)
            .wait('Distribution Directory Path:')
            .sendline(s.distDir)
            .wait('Build Command:')
            .sendline(s.buildCmd)
            .wait('Start Command:')
            .sendline('\r')
            .wait('Using default provider  awscloudformation')
            .wait('Do you want to use an AWS profile?')
            .sendline('y')
            .wait('Please choose the profile you want to use')
            .sendline(s.profileName)
            .wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything')
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
exports.default = initProjectWithProfile;
function initProjectWithAccessKey(cwd, settings, verbose) {
    if (verbose === void 0) { verbose = utils_1.isCI() ? false : true; }
    var s = __assign({}, defaultSettings, settings);
    return new Promise(function (resolve, reject) {
        nexpect
            .spawn(utils_1.getCLIPath(), ['init'], { cwd: cwd, stripColors: true, verbose: verbose })
            .wait('Enter a name for the project')
            .sendline(s.name)
            .wait('Enter a name for the environment')
            .sendline(s.envName)
            .wait('Choose your default editor:')
            .sendline(s.editor)
            .wait("Choose the type of app that you're building")
            .sendline(s.appType)
            .wait('What javascript framework are you using')
            .sendline(s.framework)
            .wait('Source Directory Path:')
            .sendline(s.srcDir)
            .wait('Distribution Directory Path:')
            .sendline(s.distDir)
            .wait('Build Command:')
            .sendline(s.buildCmd)
            .wait('Start Command:')
            .sendline('\r')
            .wait('Using default provider  awscloudformation')
            .wait('Do you want to use an AWS profile?')
            .sendline('n')
            .wait('accessKeyId')
            .sendline(s.accessKeyId)
            .wait('secretAccessKey')
            .sendline(s.secretAccessKey)
            .wait('region')
            .sendline('us-east-1')
            .wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything')
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
exports.initProjectWithAccessKey = initProjectWithAccessKey;
function initNewEnvWithAccessKey(cwd, s, verbose) {
    if (verbose === void 0) { verbose = utils_1.isCI() ? false : true; }
    return new Promise(function (resolve, reject) {
        nexpect
            .spawn(utils_1.getCLIPath(), ['init'], { cwd: cwd, stripColors: true, verbose: verbose })
            .wait('Do you want to use an existing environment?')
            .sendline('n')
            .wait('Enter a name for the environment')
            .sendline(s.envName)
            .wait('Using default provider  awscloudformation')
            .wait('Do you want to use an AWS profile?')
            .sendline('n')
            .wait('accessKeyId')
            .sendline(s.accessKeyId)
            .wait('secretAccessKey')
            .sendline(s.secretAccessKey)
            .wait('region')
            .sendline('us-east-1')
            .wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything')
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
exports.initNewEnvWithAccessKey = initNewEnvWithAccessKey;
function initNewEnvWithProfile(cwd, s, verbose) {
    if (verbose === void 0) { verbose = utils_1.isCI() ? false : true; }
    return new Promise(function (resolve, reject) {
        nexpect
            .spawn(utils_1.getCLIPath(), ['init'], { cwd: cwd, stripColors: true, verbose: verbose })
            .wait('Do you want to use an existing environment?')
            .sendline('n')
            .wait('Enter a name for the environment')
            .sendline(s.envName)
            .wait('Using default provider  awscloudformation')
            .wait('Do you want to use an AWS profile?')
            .sendline('y')
            .wait('Please choose the profile you want to use')
            .sendline('\r')
            .wait('Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything')
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
exports.initNewEnvWithProfile = initNewEnvWithProfile;
//# sourceMappingURL=initProjectHelper.js.map