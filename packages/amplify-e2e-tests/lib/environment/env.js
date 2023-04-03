"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeEnvironment = exports.importEnvironment = exports.addEnvironmentHostedUI = exports.pullEnvironment = exports.getEnvironment = exports.listEnvironment = exports.checkoutEnvironment = exports.addEnvironmentWithImportedAuth = exports.addEnvironmentYes = exports.updateEnvironment = exports.addEnvironmentCarryOverEnvVars = exports.addEnvironment = void 0;
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
function addEnvironment(cwd, settings) {
    return new Promise(function (resolve, reject) {
        var chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'add'], { cwd: cwd, stripColors: true })
            .wait('Enter a name for the environment')
            .sendLine(settings.envName)
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendCarriageReturn();
        chain.wait('Initialized your environment successfully.').run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addEnvironment = addEnvironment;
function addEnvironmentCarryOverEnvVars(cwd, settings) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'add'], { cwd: cwd, stripColors: true })
                    .wait('Enter a name for the environment')
                    .sendLine(settings.envName)
                    .wait('Select the authentication method you want to use:')
                    .sendCarriageReturn()
                    .wait('Please choose the profile you want to use')
                    .sendCarriageReturn()
                    .wait('You have configured environment variables for functions. How do you want to proceed?')
                    .sendCarriageReturn()
                    .wait('Initialized your environment successfully.')
                    .runAsync()];
        });
    });
}
exports.addEnvironmentCarryOverEnvVars = addEnvironmentCarryOverEnvVars;
function updateEnvironment(cwd, settings) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'update'], { cwd: cwd, stripColors: true })
            .wait('Specify an IAM Policy ARN to use as a permissions boundary for all Amplify-generated IAM Roles')
            .sendLine(settings.permissionsBoundaryArn)
            .run(function (err) { return (err ? reject(err) : resolve()); });
    });
}
exports.updateEnvironment = updateEnvironment;
function addEnvironmentYes(cwd, settings) {
    var _a;
    settings.disableAmplifyAppCreation = (_a = settings.disableAmplifyAppCreation) !== null && _a !== void 0 ? _a : true;
    var env = settings.disableAmplifyAppCreation
        ? {
            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
        }
        : undefined;
    var providerConfig = {
        awscloudformation: {
            configLevel: 'project',
            useProfile: true,
            profileName: (0, amplify_e2e_core_1.isCI)() ? 'amplify-integ-test-user' : 'default',
        },
    };
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'add', '--yes', '--envName', settings.envName, '--providers', JSON.stringify(providerConfig)], {
            cwd: cwd,
            stripColors: true,
            env: env,
        }).run(function (err) { return (err ? reject(err) : resolve()); });
    });
}
exports.addEnvironmentYes = addEnvironmentYes;
function addEnvironmentWithImportedAuth(cwd, settings) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'add'], { cwd: cwd, stripColors: true })
            .wait('Enter a name for the environment')
            .sendLine(settings.envName)
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendCarriageReturn()
            .wait("already imported to '".concat(settings.currentEnvName, "' environment, do you want to import it to the new environment"))
            .sendConfirmYes()
            .wait('Initialized your environment successfully.')
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
exports.addEnvironmentWithImportedAuth = addEnvironmentWithImportedAuth;
function checkoutEnvironment(cwd, settings) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'checkout', settings.envName, settings.restoreBackend ? '--restore' : ''], { cwd: cwd, stripColors: true })
            .wait('Initialized your environment successfully.')
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
exports.checkoutEnvironment = checkoutEnvironment;
// Test multiple Environments by passing settings.numEnv
function listEnvironment(cwd, settings) {
    return new Promise(function (resolve, reject) {
        var numEnv = settings.numEnv || 1;
        var regex = /\|\s\*?[a-z]{2,10}\s+\|/;
        var chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'list'], { cwd: cwd, stripColors: true }).wait('| Environments |').wait('| ------------ |');
        for (var i = 0; i < numEnv; ++i) {
            chain.wait(regex);
        }
        chain.sendEof().run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.listEnvironment = listEnvironment;
// Get environment details and return them as JSON
function getEnvironment(cwd, settings) {
    var envData = {};
    var helper = function (output) {
        var _a = output.split(/:(.+)/), key = _a[0], value = _a[1]; // Split string on first ':' only
        envData[key.trim()] = value.trim();
    };
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'get', '--name', settings.envName], { cwd: cwd, stripColors: true })
            .wait(settings.envName)
            .wait('--------------')
            .wait('Provider')
            .wait('AuthRoleName', helper)
            .wait('UnauthRoleArn', helper)
            .wait(/^AuthRoleArn/, helper) // Needs to be a regex to prevent matching UnauthRoleArn twice
            .wait('Region', helper)
            .wait('DeploymentBucketName', helper)
            .wait('UnauthRoleName', helper)
            .wait('StackName', helper)
            .wait('StackId', helper)
            .wait('--------------')
            .sendEof()
            .run(function (err) {
            if (!err) {
                resolve(JSON.stringify({ awscloudformation: envData }));
            }
            else {
                reject(err);
            }
        });
    });
}
exports.getEnvironment = getEnvironment;
/*
  `amplify env pull` only outputs via ora.spinner,
  but nexpect can't wait() on the spinner output
  See amplify-cli/src/initialize-env.js
*/
function pullEnvironment(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'pull'], { cwd: cwd, stripColors: true }).run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.pullEnvironment = pullEnvironment;
function addEnvironmentHostedUI(cwd, settings) {
    var _a = (0, amplify_e2e_core_1.getSocialProviders)(), FACEBOOK_APP_ID = _a.FACEBOOK_APP_ID, FACEBOOK_APP_SECRET = _a.FACEBOOK_APP_SECRET, GOOGLE_APP_ID = _a.GOOGLE_APP_ID, GOOGLE_APP_SECRET = _a.GOOGLE_APP_SECRET, AMAZON_APP_ID = _a.AMAZON_APP_ID, AMAZON_APP_SECRET = _a.AMAZON_APP_SECRET, APPLE_APP_ID = _a.APPLE_APP_ID, APPLE_TEAM_ID = _a.APPLE_TEAM_ID, APPLE_KEY_ID = _a.APPLE_KEY_ID, APPLE_PRIVATE_KEY = _a.APPLE_PRIVATE_KEY;
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'add'], { cwd: cwd, stripColors: true })
            .wait('Enter a name for the environment')
            .sendLine(settings.envName)
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendCarriageReturn()
            .wait('Enter your Facebook App ID for your OAuth flow:')
            .sendLine(FACEBOOK_APP_ID)
            .wait('Enter your Facebook App Secret for your OAuth flow:')
            .sendLine(FACEBOOK_APP_SECRET)
            .wait('Enter your Google Web Client ID for your OAuth flow:')
            .sendLine(GOOGLE_APP_ID)
            .wait('Enter your Google Web Client Secret for your OAuth flow:')
            .sendLine(GOOGLE_APP_SECRET)
            .wait('Enter your Amazon App ID for your OAuth flow:')
            .sendLine(AMAZON_APP_ID)
            .wait('Enter your Amazon App Secret for your OAuth flow:')
            .sendLine(AMAZON_APP_SECRET)
            .wait('Enter your Services ID for your OAuth flow:')
            .sendLine(APPLE_APP_ID)
            .wait('Enter your Team ID for your OAuth flow:')
            .sendLine(APPLE_TEAM_ID)
            .wait('Enter your Key ID for your OAuth flow:')
            .sendLine(APPLE_KEY_ID)
            .wait('Enter your Private Key for your OAuth flow')
            .sendLine(APPLE_PRIVATE_KEY)
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
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
exports.addEnvironmentHostedUI = addEnvironmentHostedUI;
function importEnvironment(cwd, settings) {
    var cmd_array = [
        'env',
        'import',
        '--name',
        settings.envName,
        '--config',
        settings.providerConfig,
        '--yes', // If env with same name already exists, overwrite it
    ];
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), cmd_array, { cwd: cwd, stripColors: true })
            .wait('Successfully added environment from your project')
            .sendEof()
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                console.error(err);
                reject(err);
            }
        });
    });
}
exports.importEnvironment = importEnvironment;
var removeEnvironment = function (cwd, settings) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['env', 'remove', settings.envName], { cwd: cwd, stripColors: true })
                .wait("Are you sure you want to continue?")
                .sendYes()
                .wait('Successfully removed environment from your project locally')
                .runAsync()];
    });
}); };
exports.removeEnvironment = removeEnvironment;
//# sourceMappingURL=env.js.map