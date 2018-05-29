"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
function range(from, to) {
    return (value, { name, source }) => {
        if (value < from || value >= to) {
            throw new core_1.ExpectedError(`Value (${source}) of "${name}" is not within the range of [${from}, ${to})`);
        }
    };
}
exports.range = range;
exports.integer = (value, { name, source }) => {
    if (value % 1 !== 0) {
        throw new core_1.ExpectedError(`Value (${source}) of "${name}" is not an integer`);
    }
};
//# sourceMappingURL=number.js.map