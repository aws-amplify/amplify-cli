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
const FS = require("fs");
const v = require("villa");
function safeStat(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield v.call(FS.stat, path).catch(v.bear);
    });
}
exports.safeStat = safeStat;
function existsFile(path) {
    return __awaiter(this, void 0, void 0, function* () {
        let stats = yield safeStat(path);
        return !!stats && stats.isFile();
    });
}
exports.existsFile = existsFile;
function existsDir(path) {
    return __awaiter(this, void 0, void 0, function* () {
        let stats = yield safeStat(path);
        return !!stats && stats.isDirectory();
    });
}
exports.existsDir = existsDir;
//# sourceMappingURL=fs.js.map