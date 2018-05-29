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
const Path = require("path");
const v = require("villa");
const core_1 = require("../core");
class File {
    constructor(source, cwd, usingDefault) {
        this.source = source;
        this.cwd = cwd;
        this.baseName = Path.basename(source);
        this.fullName = Path.resolve(cwd, source);
        this.default = usingDefault;
    }
    require() {
        try {
            return require(this.fullName);
        }
        catch (error) {
            throw new core_1.ExpectedError(`Error requiring file "${this.source}"`);
        }
    }
    buffer() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assert();
            return v.call(FS.readFile, this.fullName);
        });
    }
    text(encoding = 'utf-8') {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.assert();
            return v.call(FS.readFile, this.fullName, encoding);
        });
    }
    json(encoding) {
        return __awaiter(this, void 0, void 0, function* () {
            let json = yield this.text(encoding);
            return JSON.parse(json);
        });
    }
    assert(exists = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let stats = yield v.call(FS.stat, this.fullName).catch(v.bear);
            if (exists) {
                if (!stats) {
                    throw new core_1.ExpectedError(`File "${this.source}" does not exist`);
                }
                if (!stats.isFile()) {
                    throw new core_1.ExpectedError(`Object "${this.source}" is expected to be a file`);
                }
            }
            else if (stats) {
                throw new core_1.ExpectedError(`Object "${this.source}" already exists`);
            }
        });
    }
    exists(extensions) {
        return __awaiter(this, void 0, void 0, function* () {
            let extensionsSpecified = !!extensions;
            for (let extension of extensions || ['']) {
                let path = this.fullName + extension;
                let stats = yield v.call(FS.stat, path).catch(v.bear);
                if (stats && stats.isFile()) {
                    return extensionsSpecified ? path : true;
                }
            }
            return extensionsSpecified ? undefined : false;
        });
    }
    static cast(name, context) {
        return new this(name, context.cwd, context.default);
    }
}
exports.File = File;
class Directory {
    constructor(source, cwd, usingDefault) {
        this.source = source;
        this.cwd = cwd;
        this.baseName = Path.basename(source);
        this.fullName = Path.resolve(cwd, source);
        this.default = usingDefault;
    }
    assert(exists = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let stats = yield v.call(FS.stat, this.fullName).catch(v.bear);
            if (exists) {
                if (!stats) {
                    throw new core_1.ExpectedError(`Directory "${this.source}" does not exist`);
                }
                if (!stats.isDirectory()) {
                    throw new core_1.ExpectedError(`Object "${this.source}" is expected to be a directory`);
                }
            }
            else if (stats) {
                throw new core_1.ExpectedError(`Object "${this.source}" already exists`);
            }
        });
    }
    exists() {
        return __awaiter(this, void 0, void 0, function* () {
            let stats = yield v.call(FS.stat, this.fullName).catch(v.bear);
            return !!stats && stats.isDirectory();
        });
    }
    static cast(name, context) {
        return new this(name, context.cwd, context.default);
    }
}
exports.Directory = Directory;
//# sourceMappingURL=fs.js.map