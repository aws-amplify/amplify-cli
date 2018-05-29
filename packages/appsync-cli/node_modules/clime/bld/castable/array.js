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
const v = require("villa");
const __1 = require("..");
function array(type, { separator = ',', trim = true, empty = false, validator, validators, } = {}) {
    return {
        cast(str, context) {
            return __awaiter(this, void 0, void 0, function* () {
                let parts = str.split(separator);
                if (trim) {
                    parts = parts.map(part => part.trim());
                }
                if (!empty) {
                    parts = parts.filter(part => !!part);
                }
                if (!validators) {
                    validators = validator ? [validator] : [];
                }
                let castingContext = __1.buildCastingContext(context, {
                    name: `element of ${context.name}`,
                    validators,
                    default: context.default,
                });
                return yield v.map(parts, part => __1.cast(part, type, castingContext));
            });
        },
    };
}
exports.array = array;
//# sourceMappingURL=array.js.map