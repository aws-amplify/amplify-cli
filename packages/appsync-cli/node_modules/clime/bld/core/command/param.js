"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const hyphenate_1 = require("hyphenate");
const internal_util_1 = require("../../internal-util");
/**
 * The `param()` decorator that decorates parameters of method `execute` on a
 * concrete `Command` class.
 * This decorator could only be applied to continuous parameters of which the
 * index starts from 0.
 */
function param({ name: paramName, type, required, validator, validators, default: defaultValue, description, } = {}) {
    return (target, name, index) => {
        assert.equal(name, 'execute');
        let constructor = target.constructor;
        let definitions = constructor.paramDefinitions;
        if (constructor.paramDefinitions) {
            definitions = constructor.paramDefinitions;
        }
        else {
            definitions = constructor.paramDefinitions = [];
        }
        type = type ||
            Reflect.getMetadata('design:paramtypes', target, 'execute')[index];
        paramName = paramName ||
            // tslint:disable-next-line:no-unbound-method
            hyphenate_1.default(internal_util_1.Reflection.getFunctionParameterName(target.execute, index), { lowerCase: true });
        if (!validators) {
            validators = validator ? [validator] : [];
        }
        definitions[index] = {
            name: paramName,
            index,
            type,
            required: !!required,
            validators,
            default: defaultValue,
            description,
        };
    };
}
exports.param = param;
//# sourceMappingURL=param.js.map