"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const fs = require("fs");
class File {
    constructor(path) {
        this.path = path;
    }
    static cast(path, context) {
        return new File(Path.resolve(context.cwd, path));
    }
    read() {
        return new Promise((res, rej) => {
            fs.readFile(this.path, 'utf8', (err, contents) => {
                if (err) {
                    rej(err);
                }
                res(contents);
            });
        });
    }
    readSync() {
        return fs.readFileSync(this.path, 'utf8');
    }
    write(data) {
        return new Promise((res, rej) => {
            fs.writeFile(this.path, data, (err) => {
                if (err) {
                    rej(err);
                }
                res();
            });
        });
    }
    writeSync(data) {
        fs.writeFileSync(this.path, data);
    }
}
exports.default = File;
//# sourceMappingURL=File.js.map