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
/* eslint-disable spellcheck/spell-checker */
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var child_process_1 = require("child_process");
var aws_sdk_1 = require("aws-sdk");
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
describe('amplify pull with uibuilder', function () {
    var projRoot;
    var projRoot2;
    var projectDir;
    var projectName;
    var reactDir;
    var appId;
    var envName = 'integtest';
    var cypressConfig = "\n    const { defineConfig } = require('cypress')\n\n    module.exports = defineConfig({\n      e2e: {\n        supportFile: false\n      }\n    })\n  ";
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, region, amplifyUIBuilder;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('pull-uibuilder')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('pull-uibuilder-2')];
                case 2:
                    projRoot2 = _a.sent();
                    projectName = "".concat(path_1.default.basename(projRoot), "reactapp");
                    projectDir = path_1.default.dirname(projRoot2);
                    reactDir = "".concat(projectDir, "/").concat(projectName);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {
                            disableAmplifyAppCreation: false,
                            name: 'uibuildertest',
                        })];
                case 3:
                    _a.sent();
                    appId = (0, amplify_e2e_core_1.getAppId)(projRoot);
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                    region = meta.providers.awscloudformation.Region;
                    amplifyUIBuilder = new aws_sdk_1.AmplifyUIBuilder({ region: region });
                    return [4 /*yield*/, amplifyUIBuilder
                            .createComponent({
                            appId: appId,
                            environmentName: envName,
                            componentToCreate: amplify_e2e_core_1.myIconComponent,
                        })
                            .promise()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, amplifyUIBuilder
                            .createComponent({
                            appId: appId,
                            environmentName: envName,
                            componentToCreate: amplify_e2e_core_1.formCheckoutComponent,
                        })
                            .promise()];
                case 5:
                    _a.sent();
                    // needs to enable studio for resources to be pull down
                    return [4 /*yield*/, (0, amplify_e2e_core_1.enableAdminUI)(appId, envName, region)];
                case 6:
                    // needs to enable studio for resources to be pull down
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot2);
                    (0, amplify_e2e_core_1.deleteProjectDir)(reactDir);
                    return [2 /*return*/];
            }
        });
    }); });
    it('appropriate uibuilder files are generated', function () { return __awaiter(void 0, void 0, void 0, function () {
        var fileList, npmStartProcess, res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    (0, child_process_1.spawnSync)((0, amplify_e2e_core_1.getNpxPath)(), ['create-react-app', projectName], { cwd: projectDir, encoding: 'utf-8' });
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStudioHeadlessPull)(reactDir, { appId: appId, envName: envName })];
                case 1:
                    _a.sent();
                    fileList = fs_extra_1.default.readdirSync("".concat(reactDir, "/src/ui-components/"));
                    expect(fileList).toContain('FormCheckout.jsx');
                    expect(fileList).toContain('FormCheckout.d.ts');
                    expect(fileList).toContain('MyIcon.d.ts');
                    expect(fileList).toContain('MyIcon.jsx');
                    expect(fileList).toContain('index.js');
                    expect(fileList).toContain('studioTheme.js');
                    expect(fileList).toContain('studioTheme.js.d.ts');
                    expect(fileList).toHaveLength(7);
                    (0, child_process_1.spawnSync)((0, amplify_e2e_core_1.getNpmPath)(), 
                    // in some runs spawnSync/npx will still use an old ver of react-scripts moving it into npm install flow
                    ['install', '-E', '@types/react', 'cypress', '@aws-amplify/ui-react', 'aws-amplify', 'react-scripts@5'], { cwd: reactDir });
                    fs_extra_1.default.unlinkSync("".concat(reactDir, "/src/App.js"));
                    fs_extra_1.default.writeFileSync("".concat(reactDir, "/src/App.js"), fs_extra_1.default.readFileSync(path_1.default.join(__dirname, '..', 'cypress', 'uibuilder', 'uibuilder-app.js')));
                    fs_extra_1.default.writeFileSync("".concat(reactDir, "/cypress.config.js"), cypressConfig);
                    fs_extra_1.default.mkdirsSync("".concat(reactDir, "/cypress/e2e/"));
                    fs_extra_1.default.writeFileSync("".concat(reactDir, "/cypress/e2e/sample_spec.cy.js"), fs_extra_1.default.readFileSync(path_1.default.join(__dirname, '..', 'cypress', 'uibuilder', 'uibuilder-spec.js')));
                    npmStartProcess = (0, child_process_1.spawn)((0, amplify_e2e_core_1.getNpmPath)(), ['start'], { cwd: reactDir, timeout: 300000 });
                    // Give react server time to start
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 60000); })];
                case 2:
                    // Give react server time to start
                    _a.sent();
                    res = (0, child_process_1.spawnSync)((0, amplify_e2e_core_1.getNpxPath)(), ['cypress', 'run'], { cwd: reactDir, encoding: 'utf8' });
                    // kill the react server process
                    (0, child_process_1.spawnSync)('kill', ["".concat(npmStartProcess.pid)], { encoding: 'utf8' });
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 3:
                    _a.sent();
                    // Seriously, kill the react server process
                    // react-scripts somehow resurrects the process automatically after the first kill.
                    (0, child_process_1.spawnSync)('pkill', ['-f', 'react'], { encoding: 'utf8' });
                    expect(res.status).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=uibuilder.test.js.map