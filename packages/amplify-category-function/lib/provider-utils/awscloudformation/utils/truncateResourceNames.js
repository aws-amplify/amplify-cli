"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.truncateResourceNames = void 0;
const uuid_1 = require("uuid");
const funcNameMaxLen = 64;
const roleNameMaxLen = 64;
const truncateResourceNames = (params) => {
    const result = {};
    if (typeof params.functionName === 'string') {
        result.functionName = ResourceNameTruncator.withLimit(funcNameMaxLen).truncate(params.functionName);
    }
    if (typeof params.roleName === 'string') {
        result.roleName = ResourceNameTruncator.withLimit(roleNameMaxLen).truncate(params.roleName);
    }
    return result;
};
exports.truncateResourceNames = truncateResourceNames;
class ResourceNameTruncator {
    constructor(resourceNameLengthLimit) {
        this.uuidSeed = '319569b2-7cdc-4712-8390-e22b1f6ce5a9';
        this.envNameLen = 10;
        this.hashLen = 12;
        this.effectiveResourceNameLengthLimit = resourceNameLengthLimit - this.envNameLen;
        this.resourceNameSlicePoint = this.effectiveResourceNameLengthLimit - this.hashLen;
    }
    static withLimit(resourceNameLengthLimit) {
        return new ResourceNameTruncator(resourceNameLengthLimit);
    }
    truncate(resourceName) {
        if (resourceName.length < this.effectiveResourceNameLengthLimit) {
            return resourceName;
        }
        const prefix = resourceName.slice(0, this.resourceNameSlicePoint / 2);
        const suffix = resourceName.slice(resourceName.length - this.resourceNameSlicePoint / 2);
        const middle = resourceName.slice(this.resourceNameSlicePoint / 2, resourceName.length - this.resourceNameSlicePoint / 2);
        const hash = (0, uuid_1.v5)(middle, this.uuidSeed);
        const shortHash = hash.slice(hash.length - this.hashLen);
        return `${prefix}${suffix}${shortHash}`;
    }
}
//# sourceMappingURL=truncateResourceNames.js.map