"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const hyphenate_1 = require("hyphenate");
/**
 * The abstract `Options` class to be extended.
 */
class Options {
}
exports.Options = Options;
/**
 * The `option()` decorator that decorates concrete class of `Options`.
 */
function option({ name: optionName, flag, placeholder, toggle, type, required, validator, validators, default: defaultValue, description, } = {}) {
    assert(!flag || /^[a-z]$/i.test(flag), 'The option flag is expected to be a letter');
    return (target, name) => {
        let constructor = target.constructor;
        let definitions = constructor.definitions;
        if (definitions) {
            definitions = constructor.definitions;
        }
        else {
            definitions = constructor.definitions = [];
        }
        type = type || Reflect.getMetadata('design:type', target, name);
        optionName = optionName || hyphenate_1.default(name, { lowerCase: true });
        if (!validators) {
            validators = validator ? [validator] : [];
        }
        definitions.push({
            name: optionName,
            key: name,
            flag,
            placeholder,
            toggle: !!toggle,
            type,
            required: !!required,
            validators,
            default: defaultValue,
            description,
        });
    };
}
exports.option = option;
//# sourceMappingURL=option.js.map