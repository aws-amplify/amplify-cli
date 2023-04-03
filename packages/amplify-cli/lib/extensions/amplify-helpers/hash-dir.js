"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashDir = void 0;
const folder_hash_1 = require("folder-hash");
async function hashDir(dir, exclude) {
    const { hash: folderHash } = await (0, folder_hash_1.hashElement)(dir, {
        folders: { exclude: exclude },
    });
    return Buffer.from(folderHash).toString('hex').substr(0, 20);
}
exports.hashDir = hashDir;
//# sourceMappingURL=hash-dir.js.map