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
    profileName: 'amplifyinteg',
    region: '\r',
    userName: '\r',
};
var MANDATORY_PARAMS = ['accessKeyId', 'secretAccessKey'];
function amplifyConfigure(settings, verbose) {
    if (verbose === void 0) { verbose = utils_1.isCI() ? false : true; }
    var s = __assign({}, defaultSettings, settings);
    var missingParam = MANDATORY_PARAMS.filter(function (p) { return !Object.keys(s).includes(p); });
    if (missingParam.length) {
        throw new Error("mandatory params " + missingParam.join(' ') + " are missing");
    }
    return new Promise(function (resolve, reject) {
        nexpect
            .spawn(utils_1.getCLIPath(), ['configure'], { stripColors: true, verbose: verbose })
            .wait('Sign in to your AWS administrator account:')
            .wait('Press Enter to continue')
            .sendline('\r')
            .wait('Specify the AWS Region')
            .sendline('\r')
            .wait('user name:')
            .sendline('\r')
            .wait("Press Enter to continue")
            .sendline('\r')
            .wait('accessKeyId')
            .sendline(s.accessKeyId)
            .wait('secretAccessKey')
            .sendline(s.secretAccessKey)
            .wait('Profile Name:')
            .sendline(s.profileName)
            .wait('Successfully set up the new user.')
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
exports.default = amplifyConfigure;
//# sourceMappingURL=index.js.map