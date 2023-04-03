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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWithoutCredentialFileAndNoNewUserSetup = void 0;
var path_1 = __importDefault(require("path"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs_extra_1 = __importDefault(require("fs-extra"));
var os_1 = __importDefault(require("os"));
function initWithoutCredentialFileAndNoNewUserSetup(projRoot) {
    return __awaiter(this, void 0, void 0, function () {
        var settings, dotAWSDirPath, credentialsFilePath, configFilePath, credentialsFilePathHide, configFilePathHide;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    settings = {
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        sessionToken: process.env.AWS_SESSION_TOKEN,
                        region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-west-2',
                    };
                    delete process.env.AWS_ACCESS_KEY_ID;
                    delete process.env.AWS_SECRET_ACCESS_KEY;
                    delete process.env.AWS_DEFAULT_REGION;
                    delete process.env.AWS_REGION;
                    dotAWSDirPath = path_1.default.normalize(path_1.default.join(os_1.default.homedir(), '.aws'));
                    credentialsFilePath = path_1.default.join(dotAWSDirPath, 'credentials');
                    configFilePath = path_1.default.join(dotAWSDirPath, 'config');
                    credentialsFilePathHide = path_1.default.join(dotAWSDirPath, 'credentials.hide');
                    configFilePathHide = path_1.default.join(dotAWSDirPath, 'config.hide');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    if (fs_extra_1.default.existsSync(configFilePath)) {
                        fs_extra_1.default.renameSync(configFilePath, configFilePathHide);
                    }
                    if (fs_extra_1.default.existsSync(credentialsFilePath)) {
                        fs_extra_1.default.renameSync(credentialsFilePath, credentialsFilePathHide);
                    }
                    return [4 /*yield*/, initWorkflow(projRoot, settings)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    if (fs_extra_1.default.existsSync(configFilePathHide)) {
                        fs_extra_1.default.renameSync(configFilePathHide, configFilePath);
                    }
                    if (fs_extra_1.default.existsSync(credentialsFilePathHide)) {
                        fs_extra_1.default.renameSync(credentialsFilePathHide, credentialsFilePath);
                    }
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.initWithoutCredentialFileAndNoNewUserSetup = initWithoutCredentialFileAndNoNewUserSetup;
function initWorkflow(cwd, settings) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            (0, amplify_e2e_core_1.addCircleCITags)(cwd);
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['init'], {
                        cwd: cwd,
                        stripColors: true,
                        env: {
                            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
                        },
                    })
                        .wait('Enter a name for the project')
                        .sendCarriageReturn()
                        .wait('Initialize the project with the above configuration?')
                        .sendConfirmNo()
                        .wait('Enter a name for the environment')
                        .sendCarriageReturn()
                        .wait('Choose your default editor:')
                        .sendCarriageReturn()
                        .wait("Choose the type of app that you're building")
                        .sendCarriageReturn()
                        .wait('What javascript framework are you using')
                        .sendCarriageReturn()
                        .wait('Source Directory Path:')
                        .sendCarriageReturn()
                        .wait('Distribution Directory Path:')
                        .sendCarriageReturn()
                        .wait('Build Command:')
                        .sendCarriageReturn()
                        .wait('Start Command:')
                        .sendCarriageReturn()
                        .wait('Using default provider  awscloudformation')
                        .wait('Select the authentication method you want to use:')
                        .send(amplify_e2e_core_1.KEY_DOWN_ARROW)
                        .sendCarriageReturn()
                        .pauseRecording()
                        .wait('accessKeyId')
                        .sendLine(settings.accessKeyId)
                        .wait('secretAccessKey')
                        .sendLine(settings.secretAccessKey)
                        .resumeRecording()
                        .wait('region');
                    (0, amplify_e2e_core_1.singleSelect)(chain, settings.region, amplify_e2e_core_1.amplifyRegions);
                    chain
                        .wait('Help improve Amplify CLI by sharing non sensitive configurations on failures')
                        .sendYes()
                        .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
                        .run(function (err) {
                        if (!err) {
                            resolve();
                        }
                        else {
                            reject(err);
                        }
                    });
                })];
        });
    });
}
//# sourceMappingURL=index.js.map