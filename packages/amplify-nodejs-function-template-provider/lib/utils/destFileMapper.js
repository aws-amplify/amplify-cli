"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDstMap = void 0;
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
function getDstMap(files) {
    return files.reduce((acc, it) => lodash_1.default.assign(acc, { [it]: path_1.default.join('src', it.replace(/\.ejs$/, '')) }), {});
}
exports.getDstMap = getDstMap;
//# sourceMappingURL=destFileMapper.js.map