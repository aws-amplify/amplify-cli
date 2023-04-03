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
exports.checkoutEnv = exports.removeHostingEnabledInConsole = exports.removeNonExistingHosting = exports.removeHosting = exports.amplifyPush = exports.amplifyStatus = exports.amplifyServe = exports.amplifyConfigure = exports.amplifyPublish = exports.addCICDHostingWithoutFrontend = exports.addManualHosting = exports.addEnvironment = exports.deleteProject = void 0;
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var util_1 = require("../util");
var constants_1 = require("./constants");
var deleteProject = function (cwd) { return __awaiter(void 0, void 0, void 0, function () {
    var noOutputTimeout;
    return __generator(this, function (_a) {
        noOutputTimeout = 10 * 60 * 1000;
        return [2 /*return*/, (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['delete'], { cwd: cwd, stripColors: true, noOutputTimeout: noOutputTimeout })
                .wait('Are you sure you want to continue?')
                .sendYes()
                .wait('Project deleted locally.')
                .runAsync()];
    });
}); };
exports.deleteProject = deleteProject;
function addEnvironment(cwd, settings) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['env', 'add', '--providers', JSON.stringify(settings.providersParam)], { cwd: cwd, stripColors: true })
            .wait('Enter a name for the environment')
            .sendLine(settings.envName)
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
exports.addEnvironment = addEnvironment;
function addManualHosting(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['add', 'hosting'], { cwd: cwd, stripColors: true })
            .wait(/.*Hosting with Amplify Console*/)
            .sendCarriageReturn()
            .wait('Manual deployment')
            .sendCarriageReturn()
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
exports.addManualHosting = addManualHosting;
function addCICDHostingWithoutFrontend(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['add', 'hosting'], { cwd: cwd, stripColors: true })
            .wait(/.*Hosting with Amplify Console*/)
            .sendCarriageReturn()
            .wait('Continuous deployment (Git-based deployments)')
            //move up
            .send('k')
            .sendCarriageReturn()
            .wait(/.*Continuous deployment is configured in the Amplify Console.*/)
            .sendCarriageReturn()
            .wait("No hosting URL found. Run 'amplify add hosting' again to set up hosting with Amplify Console.")
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
exports.addCICDHostingWithoutFrontend = addCICDHostingWithoutFrontend;
var amplifyPublish = function (cwd) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['publish'], { cwd: cwd, stripColors: true })
                .wait('Are you sure you want to continue?')
                .sendCarriageReturn()
                .runAsync()];
    });
}); };
exports.amplifyPublish = amplifyPublish;
function amplifyConfigure(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['hosting', 'configure'], { cwd: cwd, stripColors: true })
            .wait(/.*We recommends you open AWS Amplify Console*/)
            .sendCarriageReturn()
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
exports.amplifyConfigure = amplifyConfigure;
function amplifyServe(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['hosting', 'configure'], { cwd: cwd, stripColors: true })
            .wait(/.*You have set up Manual deployment*/)
            .sendCarriageReturn()
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
exports.amplifyServe = amplifyServe;
function amplifyStatus(cwd, expectedStatus) {
    return new Promise(function (resolve, reject) {
        var regex = new RegExp(".*".concat(expectedStatus, "*"));
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['status'], { cwd: cwd, stripColors: true })
            .wait(regex)
            .sendCarriageReturn()
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
exports.amplifyStatus = amplifyStatus;
var amplifyPush = function (cwd) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['push'], { cwd: cwd, stripColors: true })
                .wait('Are you sure you want to continue?')
                .sendCarriageReturn()
                .runAsync()];
    });
}); };
exports.amplifyPush = amplifyPush;
function removeHosting(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['remove', 'hosting'], { cwd: cwd, stripColors: true })
            .wait(/.*Are you sure you want to delete the resource*/)
            .sendCarriageReturn()
            .wait('Successfully removed resource')
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
exports.removeHosting = removeHosting;
function removeNonExistingHosting(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['remove', 'hosting'], { cwd: cwd, stripColors: true })
            .wait(/.*Hosting with Amplify Console*/)
            .sendCarriageReturn()
            .wait(constants_1.HOSTING_NOT_ENABLED)
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
exports.removeNonExistingHosting = removeNonExistingHosting;
function removeHostingEnabledInConsole(cwd) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['remove', 'hosting'], { cwd: cwd, stripColors: true })
            .wait(/.*Hosting with Amplify Console*/)
            .sendCarriageReturn()
            .wait(constants_1.HOSTING_ENABLED_IN_CONSOLE)
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
exports.removeHostingEnabledInConsole = removeHostingEnabledInConsole;
function checkoutEnv(cwd, env) {
    return new Promise(function (resolve, reject) {
        (0, amplify_e2e_core_1.nspawn)((0, util_1.getCLIPath)(), ['env', 'checkout', env], { cwd: cwd, stripColors: true }).run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.checkoutEnv = checkoutEnv;
//# sourceMappingURL=consoleHosting.js.map