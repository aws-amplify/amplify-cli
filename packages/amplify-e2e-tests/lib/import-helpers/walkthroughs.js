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
exports.removeImportedDynamoDBWithDefault = exports.importDynamoDBTable = exports.removeImportedS3WithDefault = exports.importS3 = exports.headlessPull = exports.headlessPullExpectError = exports.addS3WithAuthConfigurationMismatchErrorExit = exports.removeImportedAuthHeadless = exports.removeImportedAuthWithDefault = exports.importIdentityPoolAndUserPool = exports.importUserPoolOnly = void 0;
/* eslint-disable */
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var importUserPoolOnly = function (cwd, autoCompletePrefix, clientNames) {
    return new Promise(function (resolve, reject) {
        var chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['auth', 'import'], { cwd: cwd, stripColors: true })
            .wait('What type of auth resource do you want to import')
            .sendKeyDown()
            .sendCarriageReturn()
            .wait('Select the User Pool you want to import')
            .send(autoCompletePrefix)
            .delay(500) // Some delay required for autocomplete and terminal to catch up
            .sendCarriageReturn();
        if (clientNames === null || clientNames === void 0 ? void 0 : clientNames.web) {
            chain
                .wait('Select a Web client to import:')
                .send(clientNames.web)
                .delay(500) // Some delay required for autocomplete and terminal to catch up
                .sendCarriageReturn();
        }
        if (clientNames === null || clientNames === void 0 ? void 0 : clientNames.native) {
            chain.wait('Select a Native client to import:');
            chain
                .send(clientNames.native)
                .delay(500) // Some delay required for autocomplete and terminal to catch up
                .sendCarriageReturn();
        }
        chain
            .wait('- JavaScript: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js')
            .sendEof()
            .run(function (err) {
            if (!err) {
                resolve(undefined);
            }
            else {
                reject(err);
            }
        });
    });
};
exports.importUserPoolOnly = importUserPoolOnly;
var importIdentityPoolAndUserPool = function (cwd, autoCompletePrefix, clientNames) {
    return new Promise(function (resolve, reject) {
        var chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['auth', 'import'], { cwd: cwd, stripColors: true })
            .wait('What type of auth resource do you want to import')
            .sendCarriageReturn()
            .wait('Select the User Pool you want to import')
            .send(autoCompletePrefix)
            .delay(500) // Some delay required for autocomplete and terminal to catch up
            .sendCarriageReturn();
        if (clientNames === null || clientNames === void 0 ? void 0 : clientNames.web) {
            chain
                .wait('Select a Web client to import:')
                .send(clientNames.web)
                .delay(500) // Some delay required for autocomplete and terminal to catch up
                .sendCarriageReturn();
        }
        if (clientNames === null || clientNames === void 0 ? void 0 : clientNames.native) {
            chain.wait('Select a Native client to import:');
            chain
                .send(clientNames.native)
                .delay(500) // Some delay required for autocomplete and terminal to catch up
                .sendCarriageReturn();
        }
        else {
            chain.wait('Select a Native client to import:').sendCarriageReturn();
        }
        chain
            .wait('- JavaScript: https://docs.amplify.aws/lib/auth/getting-started/q/platform/js')
            .sendEof()
            .run(function (err) {
            if (!err) {
                resolve(undefined);
            }
            else {
                reject(err);
            }
        });
    });
};
exports.importIdentityPoolAndUserPool = importIdentityPoolAndUserPool;
var removeImportedAuthWithDefault = function (cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['auth', 'remove'], { cwd: cwd, stripColors: true })
            .wait('Choose the resource you would want to remove')
            .sendCarriageReturn()
            .wait('Are you sure you want to unlink this imported resource')
            .sendConfirmYes()
            .sendEof()
            .run(function (err) {
            if (!err) {
                resolve(undefined);
            }
            else {
                reject(err);
            }
        });
    });
};
exports.removeImportedAuthWithDefault = removeImportedAuthWithDefault;
var removeImportedAuthHeadless = function (cwd, authResourceName) { return __awaiter(void 0, void 0, void 0, function () {
    var chain;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['auth', 'remove', authResourceName, '-y'], { cwd: cwd, stripColors: true });
                return [4 /*yield*/, chain.runAsync()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.removeImportedAuthHeadless = removeImportedAuthHeadless;
var addS3WithAuthConfigurationMismatchErrorExit = function (cwd, settings) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['add', 'storage'], { cwd: cwd, stripColors: true })
            .wait('Select from one of the below mentioned services')
            .sendCarriageReturn()
            .wait('Provide a friendly name')
            .sendCarriageReturn()
            .wait('Provide bucket name')
            .sendCarriageReturn()
            .wait('Who should have access')
            .sendCarriageReturn()
            .wait('What kind of access do you want')
            .sendLine(' ')
            .wait('Do you want to add a Lambda Trigger for your S3 Bucket')
            .sendConfirmNo()
            .wait('Current auth configuration is: userPoolOnly, but identityPoolAndUserPool was required.')
            .sendEof()
            .run(function (err) {
            if (!err) {
                resolve(undefined);
            }
            else {
                reject(err);
            }
        });
    });
};
exports.addS3WithAuthConfigurationMismatchErrorExit = addS3WithAuthConfigurationMismatchErrorExit;
var headlessPullExpectError = function (projectRoot, amplifyParameters, providersParameter, errorMessage, categoriesParameter, frontendParameter) {
    var pullCommand = [
        'pull',
        '--amplify',
        JSON.stringify(amplifyParameters),
        '--providers',
        JSON.stringify(providersParameter),
        '--no-override',
        '--yes',
    ];
    if (categoriesParameter) {
        pullCommand.push.apply(pullCommand, ['--categories', JSON.stringify(categoriesParameter)]);
    }
    if (frontendParameter) {
        pullCommand.push('--frontend', JSON.stringify(frontendParameter));
    }
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), pullCommand, { cwd: projectRoot, stripColors: true })
            .wait(errorMessage)
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
};
exports.headlessPullExpectError = headlessPullExpectError;
var headlessPull = function (projectRoot, amplifyParameters, providersParameter, categoriesParameter, frontendParameter) {
    var pullCommand = [
        'pull',
        '--amplify',
        JSON.stringify(amplifyParameters),
        '--providers',
        JSON.stringify(providersParameter),
        '--no-override',
        '--yes',
    ];
    if (categoriesParameter) {
        pullCommand.push.apply(pullCommand, ['--categories', JSON.stringify(categoriesParameter)]);
    }
    if (frontendParameter) {
        pullCommand.push('--frontend', JSON.stringify(frontendParameter));
    }
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), pullCommand, { cwd: projectRoot, stripColors: true }).run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
};
exports.headlessPull = headlessPull;
var importS3 = function (cwd, autoCompletePrefix) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['storage', 'import'], { cwd: cwd, stripColors: true })
            .wait('Select from one of the below mentioned services')
            .sendCarriageReturn()
            .wait('Select the S3 Bucket you want to import')
            .send(autoCompletePrefix)
            .delay(500) // Some delay required for autocomplete and terminal to catch up
            .sendCarriageReturn()
            .wait('- JavaScript: https://docs.amplify.aws/lib/storage/getting-started/q/platform/js')
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
};
exports.importS3 = importS3;
var removeImportedS3WithDefault = function (cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['storage', 'remove'], { cwd: cwd, stripColors: true })
            .wait('Choose the resource you would want to remove')
            .sendCarriageReturn()
            .wait('Are you sure you want to unlink this imported resource')
            .sendConfirmYes()
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
};
exports.removeImportedS3WithDefault = removeImportedS3WithDefault;
var importDynamoDBTable = function (cwd, autoCompletePrefix) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['storage', 'import'], { cwd: cwd, stripColors: true })
            .wait('Select from one of the below mentioned services')
            .sendKeyDown()
            .sendCarriageReturn()
            .wait('Select the DynamoDB Table you want to import')
            .send(autoCompletePrefix)
            .delay(500) // Some delay required for autocomplete and terminal to catch up
            .sendCarriageReturn()
            .wait('- This resource can now be accessed from REST APIs (`amplify add api`) and Functions (`amplify add function`)')
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
};
exports.importDynamoDBTable = importDynamoDBTable;
// As of Today it is the same that we have for S3, duplicated to make sure we not break when updating the flow of only one
// of these.
var removeImportedDynamoDBWithDefault = function (cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['storage', 'remove'], { cwd: cwd, stripColors: true })
            .wait('Choose the resource you would want to remove')
            .sendCarriageReturn()
            .wait('Are you sure you want to unlink this imported resource')
            .sendConfirmYes()
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
};
exports.removeImportedDynamoDBWithDefault = removeImportedDynamoDBWithDefault;
//# sourceMappingURL=walkthroughs.js.map