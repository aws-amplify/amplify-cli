"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapUtils = void 0;
const mapper_1 = require("../value-mapper/mapper");
exports.mapUtils = {
    copyAndRetainAllKeys(map, keys) {
        const keyStr = keys.toJSON();
        return (0, mapper_1.map)(map
            .keySet()
            .toJSON()
            .reduce((sum, [key, val]) => {
            if (keyStr.indexOf(key.toString()) === -1)
                return sum;
            const valJSON = val && val.toJSON ? val.toJSON() : val;
            return {
                ...sum,
                [key]: valJSON,
            };
        }, {}));
    },
    copyAndRemoveAllKeys(map, keys) {
        const keysStr = keys.toJSON();
        const result = map
            .keySet()
            .toJSON()
            .reduce((acc, key) => {
            key = key && key.toString && key.toString();
            if (!keysStr.includes(key)) {
                const val = map.get(key);
                const valJSON = val && val.toJSON ? val.toJSON() : val;
                return { ...acc, [key]: valJSON };
            }
            return acc;
        }, {});
        return (0, mapper_1.map)(result);
    },
};
//# sourceMappingURL=map-utils.js.map