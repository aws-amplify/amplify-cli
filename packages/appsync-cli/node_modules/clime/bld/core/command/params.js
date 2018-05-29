"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const hyphenate_1 = require("hyphenate");
const internal_util_1 = require("../../internal-util");
/**
 * The `params()` decorator that decorates one array parameter of method
 * `execute` of a concrete `Command` class.
 */
function params({ name: paramName, type, required, validator, validators, description, }) {
    return (target, name, index) => {
        assert.equal(name, 'execute');
        let constructor = target.constructor;
        if (constructor.paramsDefinition) {
            throw new Error('Can only define one `params` parameter');
        }
        paramName = paramName ||
            // tslint:disable-next-line:no-unbound-method
            hyphenate_1.default(internal_util_1.Reflection.getFunctionParameterName(target.execute, index), { lowerCase: true });
        if (!validators) {
            validators = validator ? [validator] : [];
        }
        constructor.paramsDefinition = {
            name: paramName,
            index,
            type,
            required: !!required,
            validators,
            description,
        };
    };
}
exports.params = params;
//# sourceMappingURL=params.js.map