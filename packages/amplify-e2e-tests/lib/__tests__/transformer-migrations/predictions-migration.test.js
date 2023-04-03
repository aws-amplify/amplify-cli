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
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var aws_appsync_1 = __importStar(require("aws-appsync"));
var graphql_tag_1 = __importDefault(require("graphql-tag"));
global.fetch = require('node-fetch');
describe('transformer predictions migration test', function () {
    var projRoot;
    var projectName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectName = (0, amplify_e2e_core_1.createRandomName)();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)((0, amplify_e2e_core_1.createRandomName)())];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projectName })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3AndAuthWithAuthOnlyAccess)(projRoot)];
                case 3:
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
                    return [2 /*return*/];
            }
        });
    }); });
    it('migration of predictions directives', function () { return __awaiter(void 0, void 0, void 0, function () {
        var predictionsSchema, appSyncClient, translateQuery, translateResult, speakQuery, speakResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    predictionsSchema = 'transformer_migration/predictions.graphql';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { apiName: projectName, transformerVersion: 1 })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, predictionsSchema)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 3:
                    _a.sent();
                    appSyncClient = getAppSyncClientFromProj(projRoot);
                    translateQuery = "\n      query TranslateThis {\n        translateThis(input: { translateText: { sourceLanguage: \"en\", targetLanguage: \"de\", text: \"This is a voice test\" } })\n      }\n    ";
                    return [4 /*yield*/, appSyncClient.query({
                            query: (0, graphql_tag_1.default)(translateQuery),
                            fetchPolicy: 'no-cache',
                        })];
                case 4:
                    translateResult = _a.sent();
                    expect(translateResult.errors).toBeUndefined();
                    expect(translateResult.data).toBeDefined();
                    expect(translateResult.data.translateThis).toMatch(/((\bDies\b)|(\bdas\b)|(\bder\b)) ist ein ((\bStimmtest\b)|(\Sprachtest\b))/i);
                    speakQuery = "\n      query SpeakTranslatedText {\n        speakTranslatedText(\n          input: {\n            translateText: { sourceLanguage: \"en\", targetLanguage: \"es\", text: \"this is a voice test\" }\n            convertTextToSpeech: { voiceID: \"Conchita\" }\n          }\n        )\n      }\n    ";
                    return [4 /*yield*/, appSyncClient.query({
                            query: (0, graphql_tag_1.default)(speakQuery),
                            fetchPolicy: 'no-cache',
                        })];
                case 5:
                    speakResult = _a.sent();
                    expect(speakResult.errors).toBeUndefined();
                    expect(speakResult.data).toBeDefined();
                    expect(speakResult.data.speakTranslatedText).toMatch(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, predictionsSchema)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushForce)(projRoot)];
                case 7:
                    _a.sent();
                    appSyncClient = getAppSyncClientFromProj(projRoot);
                    return [4 /*yield*/, appSyncClient.query({
                            query: (0, graphql_tag_1.default)(translateQuery),
                            fetchPolicy: 'no-cache',
                        })];
                case 8:
                    translateResult = _a.sent();
                    expect(translateResult.errors).toBeUndefined();
                    expect(translateResult.data).toBeDefined();
                    expect(translateResult.data.translateThis).toMatch(/((\bDies\b)|(\bdas\b)|(\bder\b)) ist ein ((\bStimmtest\b)|(\Sprachtest\b))/i);
                    return [4 /*yield*/, appSyncClient.query({
                            query: (0, graphql_tag_1.default)(speakQuery),
                            fetchPolicy: 'no-cache',
                        })];
                case 9:
                    speakResult = _a.sent();
                    expect(speakResult.errors).toBeUndefined();
                    expect(speakResult.data).toBeDefined();
                    expect(speakResult.data.speakTranslatedText).toMatch(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/);
                    return [2 /*return*/];
            }
        });
    }); });
    var getAppSyncClientFromProj = function (projRoot) {
        var meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        var region = meta.providers.awscloudformation.Region;
        var output = meta.api[projectName].output;
        var url = output.GraphQLAPIEndpointOutput;
        var apiKey = output.GraphQLAPIKeyOutput;
        return new aws_appsync_1.default({
            url: url,
            region: region,
            disableOffline: true,
            auth: {
                type: aws_appsync_1.AUTH_TYPE.API_KEY,
                apiKey: apiKey,
            },
        });
    };
});
//# sourceMappingURL=predictions-migration.test.js.map