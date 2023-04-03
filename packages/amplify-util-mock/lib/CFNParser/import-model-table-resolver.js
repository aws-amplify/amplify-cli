"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importModelTableResolver = void 0;
const matcher = new RegExp('(?<apiId>.+):GetAtt:(?<modelName>.+)Table:Name');
const importModelTableResolver = (val, env) => {
    const match = matcher.exec(val);
    if (!match) {
        return val;
    }
    return [match.groups.modelName, match.groups.apiId, env].join('-');
};
exports.importModelTableResolver = importModelTableResolver;
//# sourceMappingURL=import-model-table-resolver.js.map