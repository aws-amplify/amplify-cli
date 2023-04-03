"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rds = void 0;
const serializeRdsObject = (rdsObject) => {
    var _a;
    return ((_a = rdsObject === null || rdsObject === void 0 ? void 0 : rdsObject.sqlStatementResults) !== null && _a !== void 0 ? _a : []).map((statement) => {
        var _a;
        return ((_a = statement === null || statement === void 0 ? void 0 : statement.records) !== null && _a !== void 0 ? _a : []).map((record) => {
            const result = {};
            record.forEach((row, index) => {
                var _a, _b, _c;
                result[(_b = (_a = statement === null || statement === void 0 ? void 0 : statement.columnMetadata) === null || _a === void 0 ? void 0 : _a[index]) === null || _b === void 0 ? void 0 : _b.name] = row['isNull'] || row['null'] ? null : (_c = Object.values(row)) === null || _c === void 0 ? void 0 : _c[0];
            });
            return result;
        });
    });
};
exports.rds = {
    toJsonString: (rdsObject) => {
        try {
            rdsObject = JSON.parse(rdsObject);
            const rdsJson = serializeRdsObject(rdsObject);
            return JSON.stringify(rdsJson);
        }
        catch (_a) {
            return '';
        }
    },
    toJsonObject: (rdsString) => {
        try {
            const rdsObject = JSON.parse(rdsString);
            return serializeRdsObject(rdsObject);
        }
        catch (_a) {
            return '';
        }
    },
};
//# sourceMappingURL=rds.js.map