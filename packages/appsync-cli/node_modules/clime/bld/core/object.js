"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("./error");
function isPrintable(object) {
    return !!object && typeof object.print === 'function';
}
exports.isPrintable = isPrintable;
function isStringCastable(object) {
    return !!object && !!object.cast && typeof object.cast === 'function';
}
exports.isStringCastable = isStringCastable;
function cast(source, type, context) {
    return __awaiter(this, void 0, void 0, function* () {
        let value;
        let { name, validators, default: usingDefault, } = context;
        switch (type) {
            case String:
                value = source;
                break;
            case Number:
                value = Number(source);
                if (isNaN(value)) {
                    throw new error_1.ExpectedError(`Value "${source}" cannot be casted to number`);
                }
                break;
            case Boolean:
                if (/^(?:f|false)$/i.test(source)) {
                    value = false;
                }
                else {
                    let n = Number(source);
                    value = isNaN(n) ? true : Boolean(n);
                }
                break;
            default:
                if (!isStringCastable(type)) {
                    throw new Error(`Type \`${type.name || type}\` cannot be casted from a string, \
see \`StringCastable\` interface for more information`);
                }
                let castingContext = buildCastingContext(context, {
                    name,
                    validators,
                    default: usingDefault,
                    upper: context,
                });
                value = yield type.cast(source, castingContext);
                break;
        }
        for (let validator of validators) {
            if (validator instanceof RegExp) {
                if (!validator.test(source)) {
                    throw new error_1.ExpectedError(`Invalid value for "${name}"`);
                }
            }
            else if (typeof validator === 'function') {
                validator(value, { name, source });
            }
            else {
                validator.validate(value, { name, source });
            }
        }
        return value;
    });
}
exports.cast = cast;
function buildCastingContext(context, extension) {
    return Object.assign(Object.create(context), extension);
}
exports.buildCastingContext = buildCastingContext;
//# sourceMappingURL=object.js.map