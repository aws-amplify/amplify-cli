"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWindowsPlatform = void 0;
const isWindowsPlatform = () => { var _a; return !!((_a = process === null || process === void 0 ? void 0 : process.platform) === null || _a === void 0 ? void 0 : _a.startsWith('win')); };
exports.isWindowsPlatform = isWindowsPlatform;
//# sourceMappingURL=windows-utils.js.map