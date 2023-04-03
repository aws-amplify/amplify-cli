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
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_storage_simulator_1 = require("amplify-storage-simulator");
var AWS = __importStar(require("aws-sdk"));
var fs = __importStar(require("fs-extra"));
var port = 20005; // for testing
var route = '/mock-testing';
var bucket = 'mock-testing';
var localDirS3 = __dirname + '/test-data/';
var actual_file = __dirname + '/test-data/2.png';
var s3client;
var simulator;
jest.setTimeout(2000000);
beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    var ep;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                AWS.config.update({
                    accessKeyId: 'fakeaccesskeyidfortesting',
                    secretAccessKey: 'fakeaccesssecretkeyfortesting',
                    region: 'eu-west-2',
                });
                ep = new AWS.Endpoint('http://localhost:20005');
                s3client = new AWS.S3({
                    apiVersion: '2006-03-01',
                    endpoint: ep.href,
                    s3BucketEndpoint: true,
                    sslEnabled: false,
                    s3ForcePathStyle: true,
                });
                simulator = new amplify_storage_simulator_1.AmplifyStorageSimulator({ port: port, route: route, localDirS3: localDirS3 });
                return [4 /*yield*/, simulator.start()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!simulator) return [3 /*break*/, 2];
                return [4 /*yield*/, simulator.stop()];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2 /*return*/];
        }
    });
}); });
/**
 * Test api below
 */
describe('test server running', function () {
    test('server is running', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                expect(simulator).toBeDefined();
                expect(simulator.url).toEqual('http://localhost:20005');
            }
            catch (e) {
                console.log(e);
                expect(true).toEqual(false);
            }
            return [2 /*return*/];
        });
    }); });
});
describe('Test get api', function () {
    var actual_file = __dirname + '/test-data/2.png';
    test('get image work ', function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, s3client.getObject({ Bucket: bucket, Key: '2.png' }).promise()];
                case 1:
                    data = _a.sent();
                    expect(data).toBeDefined();
                    expect(data.Body).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    test('get text file', function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, s3client.getObject({ Bucket: bucket, Key: 'abc.txt' }).promise()];
                case 1:
                    data = _a.sent();
                    expect(data).toBeDefined();
                    expect(data.Body).toBeDefined();
                    expect(data.Body.toString()).toEqual('Helloworld1234');
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('Test list api', function () {
    test('get list', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, s3client.listObjects({ Bucket: bucket, Prefix: 'normal' }).promise()];
                case 1:
                    response = _a.sent();
                    expect(response).toBeDefined();
                    expect(response.Contents[0].Key).toEqual('normal/2.png');
                    expect(response.Contents.length).toEqual(1);
                    return [2 /*return*/];
            }
        });
    }); });
    test('get list', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, s3client.listObjects({ Bucket: bucket }).promise()];
                case 1:
                    response = _a.sent();
                    expect(response).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    test('empty bucket', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, s3client.listObjects({ Bucket: bucket, Prefix: 'public' }).promise()];
                case 1:
                    response = _a.sent();
                    expect(response).toBeDefined();
                    expect(response.Contents.length).toEqual(0);
                    return [2 /*return*/];
            }
        });
    }); });
    test('list object pagination', function () { return __awaiter(void 0, void 0, void 0, function () {
        var maxKeys, total, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    maxKeys = 2;
                    total = 7;
                    return [4 /*yield*/, s3client
                            .listObjects({
                            Bucket: bucket,
                            Prefix: 'pagination',
                            Marker: '',
                            MaxKeys: maxKeys,
                        })
                            .promise()];
                case 1:
                    response = _a.sent();
                    _a.label = 2;
                case 2:
                    if (!(response.IsTruncated === true)) return [3 /*break*/, 4];
                    expect(response).toBeDefined();
                    expect(response.Contents.length).toEqual(maxKeys);
                    return [4 /*yield*/, s3client
                            .listObjects({
                            Bucket: bucket,
                            Prefix: 'pagination',
                            Marker: response.NextMarker,
                            MaxKeys: maxKeys,
                        })
                            .promise()];
                case 3:
                    response = _a.sent();
                    total = total - maxKeys;
                    return [3 /*break*/, 2];
                case 4:
                    expect(response.Contents.length).toEqual(total);
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('Test delete api', function () {
    var dirPathOne = __dirname + '/test-data/deleteOne';
    beforeEach(function () {
        fs.ensureDirSync(dirPathOne);
        fs.copySync(__dirname + '/test-data/normal/', dirPathOne + '/');
    });
    test('test one delete ', function () { return __awaiter(void 0, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, s3client.deleteObject({ Bucket: bucket, Key: 'deleteOne/2.png' }).promise()];
                case 1:
                    data = _a.sent();
                    expect(fs.rmdirSync(dirPathOne)).toBeUndefined;
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('Test put api', function () {
    var actual_file = __dirname + '/test-data/2.png';
    var buffer = fs.readFileSync(actual_file);
    test('put image', function () { return __awaiter(void 0, void 0, void 0, function () {
        var params, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        Bucket: bucket,
                        Key: '2.png',
                        Prefix: 'upload',
                        Body: buffer,
                    };
                    return [4 /*yield*/, s3client.upload(params).promise()];
                case 1:
                    data = _a.sent();
                    expect(data).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    var file = __dirname + '/test-data/abc.txt';
    var buf1 = fs.readFileSync(file);
    var Jsonobj = {
        __typename: 'UserData',
        id: 'a9a394ea-feaa-4bf9-a612-d80aa38e6b31',
        name: 'Test Mock Storage',
        users: null,
        completionStatus: null,
        parentId: null,
        time: { __typename: 'Time', cDate: 1578985237505, mDate: null, rDate: null, freq: null },
        Type: 'ROOT',
        Manager: null,
        logo: {
            __typename: 'S3File',
            id: null,
            name: 'logo.png',
            names: null,
            typeId: 'a9a394ea-feaa-4bf9-a612-d80aa38e6b31',
            fileType: 'LOGO',
            contentType: 'image/png',
            length: null,
            key: 'a9a394ea-feaa-4bf9-a612-d80aa38e6b31/LOGO/logo.png.png',
        },
        integrate: null,
        Setting: { __typename: 'Setting', dueInDays: null, fre: 'ANN', sur: 'high', art: null, access: 'PHYSICAL' },
        createdBy: null,
        createdAt: 1578985237505,
        modifiedBy: null,
        modifiedAt: 1578985237505,
        Details: null,
        effect: 'HEALTH',
    };
    test('put text', function () { return __awaiter(void 0, void 0, void 0, function () {
        var params, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        Bucket: bucket,
                        Key: 'upload/abc.txt',
                        Body: buf1,
                    };
                    return [4 /*yield*/, s3client.upload(params).promise()];
                case 1:
                    data = _a.sent();
                    expect(data).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    test('put JSON', function () { return __awaiter(void 0, void 0, void 0, function () {
        var params, data, jsonFile, contents, obj;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        Bucket: bucket,
                        Key: 'upload/abc.json',
                        Body: JSON.stringify(Jsonobj),
                        ContentType: 'application/json',
                    };
                    return [4 /*yield*/, s3client.upload(params).promise()];
                case 1:
                    data = _a.sent();
                    jsonFile = __dirname + '/test-data/upload/abc.json';
                    contents = fs.readFileSync(jsonFile);
                    obj = JSON.parse(contents.toString());
                    expect(data).toBeDefined();
                    expect(JSON.stringify(obj)).toBe(JSON.stringify(Jsonobj));
                    return [2 /*return*/];
            }
        });
    }); });
    var file1 = __dirname + '/test-data/Snake_River_(5mb).jpg';
    var buf2 = fs.readFileSync(file1);
    test(' multipart upload', function () { return __awaiter(void 0, void 0, void 0, function () {
        var params, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params = {
                        Bucket: bucket,
                        Key: 'upload/long_image.jpg',
                        Body: buf2,
                    };
                    return [4 /*yield*/, s3client.upload(params).promise()];
                case 1:
                    data = _a.sent();
                    expect(data.Key).toBe('upload/long_image.jpg');
                    return [2 /*return*/];
            }
        });
    }); });
    test(' async uploads', function () { return __awaiter(void 0, void 0, void 0, function () {
        var params1, data, params2, data2, params3, data3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params1 = {
                        Bucket: bucket,
                        Key: 'upload/long_image1.jpg',
                        Body: buf2,
                    };
                    return [4 /*yield*/, s3client.upload(params1).promise()];
                case 1:
                    data = _a.sent();
                    params2 = {
                        Bucket: bucket,
                        Key: 'upload/long_image2.jpg',
                        Body: buf2,
                    };
                    return [4 /*yield*/, s3client.upload(params2).promise()];
                case 2:
                    data2 = _a.sent();
                    params3 = {
                        Bucket: bucket,
                        Key: 'upload/long_image3.jpg',
                        Body: buf2,
                    };
                    return [4 /*yield*/, s3client.upload(params3).promise()];
                case 3:
                    data3 = _a.sent();
                    expect(data.Key).toBe('upload/long_image1.jpg');
                    expect(data2.Key).toBe('upload/long_image2.jpg');
                    expect(data3.Key).toBe('upload/long_image3.jpg');
                    return [2 /*return*/];
            }
        });
    }); });
    test(' async uploads', function () { return __awaiter(void 0, void 0, void 0, function () {
        var params1, params2, params3, uploadPromises, uploadResults;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    params1 = {
                        Bucket: bucket,
                        Key: 'upload/long_image1.jpg',
                        Body: buf2,
                    };
                    params2 = {
                        Bucket: bucket,
                        Key: 'upload/long_image2.jpg',
                        Body: buf2,
                    };
                    params3 = {
                        Bucket: bucket,
                        Key: 'upload/long_image3.jpg',
                        Body: buf2,
                    };
                    uploadPromises = [];
                    uploadPromises.push(s3client.upload(params1).promise());
                    uploadPromises.push(s3client.upload(params2).promise());
                    uploadPromises.push(s3client.upload(params3).promise());
                    return [4 /*yield*/, Promise.all(uploadPromises)];
                case 1:
                    uploadResults = _a.sent();
                    expect(uploadResults[0].Key).toBe('upload/long_image1.jpg');
                    expect(uploadResults[1].Key).toBe('upload/long_image2.jpg');
                    expect(uploadResults[2].Key).toBe('upload/long_image3.jpg');
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=S3server.test.js.map