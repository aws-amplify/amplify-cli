"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.open = void 0;
const open_1 = __importDefault(require("open"));
const __1 = require("..");
const open = async (target, options) => {
    if ((0, __1.isCI)()) {
        return Promise.resolve();
    }
    let childProcess;
    try {
        childProcess = await (0, open_1.default)(target, options);
        childProcess.on('error', (e) => handleOpenError(e, target));
    }
    catch (e) {
        handleOpenError(e, target);
        return Promise.resolve();
    }
    return Promise.resolve(childProcess);
};
exports.open = open;
const handleOpenError = (err, target) => {
    console.error(`Unable to open ${target}: ${err.message}`);
    if ('code' in err && err['code'] === 'ENOENT') {
        console.warn('Have you installed `xdg-utils` on your machine?');
    }
};
//# sourceMappingURL=open.js.map