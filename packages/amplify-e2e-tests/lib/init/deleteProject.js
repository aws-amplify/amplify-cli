"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
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
var AWS = require("aws-sdk");
var nexpect = require("nexpect");
var utils_1 = require("../utils");
var utils_2 = require("../utils");
function deleteProject(cwd, deleteDeploymentBucket, verbose) {
    if (deleteDeploymentBucket === void 0) { deleteDeploymentBucket = true; }
    if (verbose === void 0) { verbose = utils_1.isCI() ? false : true; }
    return new Promise(function (resolve, reject) {
        var meta = utils_2.getProjectMeta(cwd).providers.awscloudformation;
        nexpect
            .spawn(utils_1.getCLIPath(), ['delete'], { cwd: cwd, stripColors: true, verbose: verbose })
            .wait('Are you sure you want to continue?')
            .sendline('y')
            .wait('Project deleted locally.')
            .run(function (err) {
            return __awaiter(this, void 0, void 0, function () {
                var DeploymentBucketName_1, s3_1, items, promises_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!!err) return [3 /*break*/, 6];
                            DeploymentBucketName_1 = meta.DeploymentBucketName;
                            if (!deleteDeploymentBucket) return [3 /*break*/, 4];
                            s3_1 = new AWS.S3();
                            return [4 /*yield*/, s3_1
                                    .listObjects({ Bucket: DeploymentBucketName_1 })
                                    .promise()];
                        case 1:
                            items = (_a.sent()).Contents;
                            promises_1 = [];
                            items.forEach(function (item) {
                                promises_1.push(s3_1.deleteObject({ Bucket: DeploymentBucketName_1, Key: item.Key }).promise());
                            });
                            return [4 /*yield*/, Promise.all(promises_1)];
                        case 2:
                            _a.sent();
                            return [4 /*yield*/, s3_1.deleteBucket({ Bucket: DeploymentBucketName_1 })];
                        case 3:
                            _a.sent();
                            resolve();
                            return [3 /*break*/, 5];
                        case 4:
                            resolve();
                            _a.label = 5;
                        case 5: return [3 /*break*/, 7];
                        case 6:
                            reject(err);
                            _a.label = 7;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        });
    });
}
exports.default = deleteProject;
//# sourceMappingURL=deleteProject.js.map