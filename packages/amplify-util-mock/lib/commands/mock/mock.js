"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const mockAll_1 = require("../../mockAll");
const help_1 = require("./help");
exports.name = 'mock';
const run = async (context) => {
    if (context.parameters.options.help) {
        return (0, help_1.run)(context);
    }
    await (0, mockAll_1.mockAllCategories)(context);
    return undefined;
};
exports.run = run;
//# sourceMappingURL=mock.js.map