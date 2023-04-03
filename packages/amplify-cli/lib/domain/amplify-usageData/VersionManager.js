"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestPayloadVersion = exports.getLatestApiVersion = void 0;
const semver_1 = __importDefault(require("semver"));
const APIVersionToPayloadVersion = new Map([['v1.0', ['1.0.0', '1.0.1', '1.1.0']]]);
function getLatestApiVersion() {
    return [...APIVersionToPayloadVersion.keys()].reduce(getMaxVersion, '0');
}
exports.getLatestApiVersion = getLatestApiVersion;
function getMaxVersion(previousValue, currentValue) {
    const cleanVer = semver_1.default.coerce(currentValue);
    const cleanPreviousVer = semver_1.default.coerce(previousValue);
    if (cleanVer === null || cleanPreviousVer == null)
        throw new Error('version format is wrong ');
    if (semver_1.default.gt(cleanVer, cleanPreviousVer)) {
        return currentValue;
    }
    return previousValue;
}
function getLatestPayloadVersion() {
    const versions = APIVersionToPayloadVersion.get(getLatestApiVersion());
    if (!versions)
        throw new Error(`No Payload Versions mapped to API Version ${getLatestApiVersion}`);
    return versions.reduce(getMaxVersion, '0');
}
exports.getLatestPayloadVersion = getLatestPayloadVersion;
//# sourceMappingURL=VersionManager.js.map