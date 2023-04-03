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
exports.query = exports.schema = exports.runTest = void 0;
//special handling needed to test prediction
//This test will faile due to a possible AppSync bug, see details below the test code
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var aws_sdk_1 = __importDefault(require("aws-sdk"));
var graphql_tag_1 = __importDefault(require("graphql-tag"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var authHelper_1 = require("../authHelper");
var common_1 = require("../common");
var imageKey = 'public/myimage.jpg';
function runTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, awsconfig, appSyncClient, result, pollyURL, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectDir)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3Storage)(projectDir)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectDir, { transformerVersion: 1 })];
                case 3:
                    _a.sent();
                    (0, common_1.updateSchemaInTestProject)(projectDir, testModule.schema);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, uploadImageFile(projectDir)];
                case 5:
                    _a.sent();
                    apiKey = (0, authHelper_1.getApiKey)(projectDir);
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientAPIKeyAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, appSyncClient.query({
                            query: (0, graphql_tag_1.default)(exports.query),
                            fetchPolicy: 'no-cache',
                        })];
                case 7:
                    result = _a.sent();
                    expect(result).toBeDefined();
                    pollyURL = result.data.speakTranslatedImageText;
                    // check that return format is a url
                    expect(pollyURL).toMatch(/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/);
                    return [3 /*break*/, 9];
                case 8:
                    err_1 = _a.sent();
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
function uploadImageFile(projectDir) {
    return __awaiter(this, void 0, void 0, function () {
        var imageFilePath, s3Client, amplifyMeta, storageResourceName, bucketName, fileStream, uploadParams;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    imageFilePath = path_1.default.join(__dirname, 'predictions-usage-image.jpg');
                    s3Client = new aws_sdk_1.default.S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        sessionToken: process.env.AWS_SESSION_TOKEN,
                        region: process.env.AWS_DEFAULT_REGION,
                    });
                    amplifyMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectDir);
                    storageResourceName = Object.keys(amplifyMeta.storage).find(function (key) {
                        return amplifyMeta.storage[key].service === 'S3';
                    });
                    bucketName = amplifyMeta.storage[storageResourceName].output.BucketName;
                    fileStream = fs_extra_1.default.createReadStream(imageFilePath);
                    uploadParams = {
                        Bucket: bucketName,
                        Key: imageKey,
                        Body: fileStream,
                        ContentType: 'image/jpeg',
                        ACL: 'public-read',
                    };
                    return [4 /*yield*/, s3Client.upload(uploadParams).promise()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
//schema
exports.schema = "\ntype Query {\n  speakTranslatedImageText: String @predictions(actions: [identifyText, translateText, convertTextToSpeech])\n}\n";
//queries
exports.query = "\n#change: remove redaudant ($input: SpeakTranslatedImageTextInput!)\nquery SpeakTranslatedImageText {\n  speakTranslatedImageText(\n    input: {\n      identifyText: { key: \"myimage.jpg\" }\n      translateText: { sourceLanguage: \"en\", targetLanguage: \"es\" }\n      convertTextToSpeech: { voiceID: \"Conchita\" }\n    }\n  )\n}\n";
/*
This test will fail:
There is an AppSync bug, the error received:
{
  graphQLErrors: [
    {
      path: [Array],
      data: null,
      errorType: 'MappingTemplate',
      errorInfo: null,
      locations: [Array],
      message: "Unable to parse the JSON document: 'Unexpected character ('m' (code 109)): was expecting comma to separate Object entries\n" +
        ' at [Source: (String)"{\n' +
        '  "version": "2018-05-29",\n' +
        '  "method": "POST",\n' +
        '  "resourcePath": "/",\n' +
        '  "params": {\n' +
        '      "body": {\n' +
        '          "Image": {\n' +
        '              "S3Object": {\n' +
        '                  "Bucket": "xxxx",\n' +
        '                  "Name": "public/"myimage.jpg""\n' +
        '        }\n' +
        '      }\n' +
        '    },\n' +
        '      "headers": {\n' +
        '          "Content-Type": "application/x-amz-json-1.1",\n' +
        '          "X-Amz-Target": "RekognitionService.DetectText"\n' +
        '    }\n' +
        '  }\n' +
        `}"; line: 10, column: 37]'`
    }
  ],
  networkError: null,
  extraInfo: undefined
}
*/
//# sourceMappingURL=predictions-usage.js.map