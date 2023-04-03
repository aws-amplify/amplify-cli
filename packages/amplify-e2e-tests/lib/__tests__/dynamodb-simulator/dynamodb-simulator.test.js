var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var _this = this;
var path = require('path');
var ddbSimulator = require('amplify-dynamodb-simulator');
var fs = require('fs-extra');
jest.setTimeout(90 * 1000);
jest.mock('amplify-cli-core', function () { return ({
    pathManager: {
        getAmplifyPackageLibDirPath: jest.fn().mockReturnValue(path.join(process.cwd(), '../', '/amplify-dynamodb-simulator')),
    },
}); });
describe('emulator operations', function () {
    var dbPath = path.join(process.cwd(), "../amplify-dynamodb-simulator/dynamodb-data/".concat(process.pid));
    // taken from dynamodb examples.
    var dbParams = {
        AttributeDefinitions: [
            {
                AttributeName: 'Artist',
                AttributeType: 'S',
            },
            {
                AttributeName: 'SongTitle',
                AttributeType: 'S',
            },
        ],
        KeySchema: [
            {
                AttributeName: 'Artist',
                KeyType: 'HASH',
            },
            {
                AttributeName: 'SongTitle',
                KeyType: 'RANGE',
            },
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    };
    var ensureNoDbPath = function () {
        if (fs.existsSync(dbPath)) {
            try {
                fs.removeSync(dbPath);
            }
            catch (err) {
                console.log(err);
            }
        }
    };
    var realProcessEnv = process.env;
    var emulators;
    beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            jest.resetModules();
            ensureNoDbPath();
            emulators = [];
            jest.setTimeout(40 * 1000);
            return [2 /*return*/];
        });
    }); });
    afterEach(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    process.env = __assign({}, realProcessEnv);
                    return [4 /*yield*/, Promise.all(emulators.map(function (emu) { return emu.terminate(); }))];
                case 1:
                    _a.sent();
                    ensureNoDbPath();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should support in memory operations', function () { return __awaiter(_this, void 0, void 0, function () {
        var emu, dynamo, tables;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ddbSimulator.launch()];
                case 1:
                    emu = _a.sent();
                    emulators.push(emu);
                    dynamo = ddbSimulator.getClient(emu);
                    return [4 /*yield*/, dynamo.listTables().promise()];
                case 2:
                    tables = _a.sent();
                    expect(tables).toEqual({ TableNames: [] });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should preserve state between restarts with dbPath', function () { return __awaiter(_this, void 0, void 0, function () {
        var emuOne, dynamoOne, emuTwo, dynamoTwo, t;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ddbSimulator.launch({ dbPath: dbPath })];
                case 1:
                    emuOne = _a.sent();
                    emulators.push(emuOne);
                    dynamoOne = ddbSimulator.getClient(emuOne);
                    return [4 /*yield*/, dynamoOne
                            .createTable(__assign({ TableName: 'foo' }, dbParams))
                            .promise()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, emuOne.terminate()];
                case 3:
                    _a.sent();
                    emulators = [];
                    return [4 /*yield*/, ddbSimulator.launch({ dbPath: dbPath })];
                case 4:
                    emuTwo = _a.sent();
                    emulators.push(emuTwo);
                    return [4 /*yield*/, ddbSimulator.getClient(emuTwo)];
                case 5:
                    dynamoTwo = _a.sent();
                    return [4 /*yield*/, dynamoTwo.listTables().promise()];
                case 6:
                    t = _a.sent();
                    expect(t).toEqual({
                        TableNames: ['foo'],
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should start on specific port', function () { return __awaiter(_this, void 0, void 0, function () {
        var port, emu;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, require('get-port')()];
                case 1:
                    port = _a.sent();
                    return [4 /*yield*/, ddbSimulator.launch({ port: port })];
                case 2:
                    emu = _a.sent();
                    emulators.push(emu);
                    expect(emu.port).toBe(port);
                    return [2 /*return*/];
            }
        });
    }); });
    it('reports on invalid dbPath values', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expect.assertions(1);
                    return [4 /*yield*/, expect(ddbSimulator.launch({ dbPath: 'dynamodb-data' })).rejects.toThrow('invalid directory for database creation')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('reports on invalid dbPath values with extra stderr output', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    expect.assertions(1);
                    // This makes JVM running DynamoDB simulator print an extra line before surfacing real error.
                    process.env.JAVA_TOOL_OPTIONS = '-Dlog4j2.formatMsgNoLookups=true';
                    return [4 /*yield*/, expect(ddbSimulator.launch({ dbPath: 'dynamodb-data' })).rejects.toThrow('invalid directory for database creation')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=dynamodb-simulator.test.js.map