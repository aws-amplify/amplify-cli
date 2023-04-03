"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockFileParserFactory = void 0;
const amplify_error_1 = require("../errors/amplify-error");
const lock_file_types_1 = require("./lock-file-types");
const package_lock_parser_1 = require("./package-lock-parser");
const yarn_lock_parser_1 = require("./yarn-lock-parser");
const yarn2_lock_parser_1 = require("./yarn2-lock-parser");
class LockFileParserFactory {
    static getLockFileParser(lockfileType) {
        switch (lockfileType) {
            case lock_file_types_1.LockfileType.NPM:
                return new package_lock_parser_1.PackageLockParser();
            case lock_file_types_1.LockfileType.YARN:
                return new yarn_lock_parser_1.YarnLockParser();
            case lock_file_types_1.LockfileType.YARN2:
                return new yarn2_lock_parser_1.Yarn2LockParser();
            default:
                throw new amplify_error_1.AmplifyError('UnsupportedLockFileTypeError', {
                    message: 'Unsupported lockfile type ' + `${lockfileType} provided. Only 'npm' or 'yarn' is currently ` + 'supported.',
                    resolution: 'Install npm6 or yarn1 to compile overrides for this project.',
                });
        }
    }
}
exports.LockFileParserFactory = LockFileParserFactory;
//# sourceMappingURL=parser-factory.js.map