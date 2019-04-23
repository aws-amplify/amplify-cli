"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nexpect = require("nexpect");
var utils_1 = require("../utils");
var defaultSettings = {
    projectName: 'CLIIntegTestAuth',
};
function addAuthWithDefault(cwd, settings, verbose) {
    if (verbose === void 0) { verbose = !utils_1.isCI(); }
    return new Promise(function (resolve, reject) {
        nexpect
            .spawn(utils_1.getCLIPath(), ['add', 'auth'], { cwd: cwd, stripColors: true, verbose: verbose })
            .wait('Do you want to use the default authentication and security configuration?')
            .sendline('\r')
            .wait('How do you want users to be able to sign in when using your Cognito User Pool?')
            .sendline('\r')
            .wait('What attributes are required for signing up?')
            .sendline('\r')
            .sendEof()
            // tslint:disable-next-line
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
exports.addAuthWithDefault = addAuthWithDefault;
function addAuthWithDefaultSocial(cwd, settings, verbose) {
    if (verbose === void 0) { verbose = !utils_1.isCI(); }
    return new Promise(function (resolve, reject) {
        var _a = utils_1.getEnvVars(), FACEBOOK_APP_ID = _a.FACEBOOK_APP_ID, FACEBOOK_APP_SECRET = _a.FACEBOOK_APP_SECRET, GOOGLE_APP_ID = _a.GOOGLE_APP_ID, GOOGLE_APP_SECRET = _a.GOOGLE_APP_SECRET, AMAZON_APP_ID = _a.AMAZON_APP_ID, AMAZON_APP_SECRET = _a.AMAZON_APP_SECRET;
        var missingVars = [];
        if (!FACEBOOK_APP_ID) {
            missingVars.push('FACEBOOK_APP_ID');
        }
        ;
        if (!FACEBOOK_APP_SECRET) {
            missingVars.push('FACEBOOK_APP_SECRET');
        }
        ;
        if (!GOOGLE_APP_ID) {
            missingVars.push('GOOGLE_APP_ID');
        }
        ;
        if (!GOOGLE_APP_SECRET) {
            missingVars.push('GOOGLE_APP_SECRET');
        }
        ;
        if (!AMAZON_APP_ID) {
            missingVars.push('AMAZON_APP_ID');
        }
        ;
        if (!AMAZON_APP_SECRET) {
            missingVars.push('AMAZON_APP_SECRET');
        }
        ;
        if (missingVars.length > 0) {
            throw new Error(".env file is missing the following key/values: " + missingVars.join(', ') + " ");
        }
        nexpect
            .spawn(utils_1.getCLIPath(), ['add', 'auth'], { cwd: cwd, stripColors: true, verbose: verbose })
            .wait('Do you want to use the default authentication and security configuration?')
            // j = down arrow
            .sendline('j')
            .sendline('\r')
            .wait('How do you want users to be able to sign in when using your Cognito User Pool?')
            .sendline('\r')
            .wait('What attributes are required for signing up?')
            .sendline('\r')
            .wait('What domain name prefix you want us to create for you?')
            .sendline('\r')
            .wait('Enter your redirect signin URI:')
            .sendline('https://www.google.com/')
            .wait('Do you want to add another redirect signin URI')
            .sendline('n')
            .sendline('\r')
            .wait('Enter your redirect signout URI:')
            .sendline('https://www.nytimes.com/')
            .sendline('\r')
            .wait('Do you want to add another redirect signout URI')
            .sendline('n')
            .sendline('\r')
            .wait('Select the social providers you want to configure for your user pool:')
            .sendline('a')
            .sendline('\r')
            .wait('Enter your Facebook App ID for your OAuth flow:')
            .sendline(FACEBOOK_APP_ID)
            .sendline('\r')
            .wait('Enter your Facebook App Secret for your OAuth flow:')
            .sendline(FACEBOOK_APP_SECRET)
            .sendline('\r')
            .wait('Enter your Google Web Client ID for your OAuth flow:')
            .sendline(GOOGLE_APP_ID)
            .sendline('\r')
            .wait('Enter your Google Web Client Secret for your OAuth flow:')
            .sendline(GOOGLE_APP_SECRET)
            .sendline('\r')
            .wait('Enter your Amazon App ID for your OAuth flow:')
            .sendline(AMAZON_APP_ID)
            .sendline('\r')
            .wait('Enter your Amazon App Secret for your OAuth flow:')
            .sendline(AMAZON_APP_SECRET)
            .sendline('\r')
            .sendEof()
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
exports.addAuthWithDefaultSocial = addAuthWithDefaultSocial;
//# sourceMappingURL=auth.js.map