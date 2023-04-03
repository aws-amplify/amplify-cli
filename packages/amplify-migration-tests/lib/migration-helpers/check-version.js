"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allowedVersionsToMigrateFrom = exports.validateVersionsForMigrationTest = exports.versionCheck = void 0;
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
function versionCheck(cwd, testingWithLatestCodebase = false, version = {}) {
    return new Promise((resolve, reject) => {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(testingWithLatestCodebase), ['-v'], { cwd, stripColors: true })
            .wait(/\d+\.\d+\.\d+/, (v) => (version.v = v.trim()))
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.versionCheck = versionCheck;
/**
 * Validates from and to versions for migration tests.
 */
const validateVersionsForMigrationTest = () => __awaiter(void 0, void 0, void 0, function* () {
    const migrateFromVersion = { v: 'uninitialized' };
    const migrateToVersion = { v: 'uninitialized' };
    yield versionCheck(process.cwd(), false, migrateFromVersion);
    yield versionCheck(process.cwd(), true, migrateToVersion);
    console.log(`Test migration from: ${migrateFromVersion.v} to ${migrateToVersion.v}`);
    expect(migrateFromVersion.v).not.toEqual(migrateToVersion.v);
    expect(exports.allowedVersionsToMigrateFrom).toContain(migrateFromVersion.v);
});
exports.validateVersionsForMigrationTest = validateVersionsForMigrationTest;
/**
 * This list is used to check migration tests with the following changes. (excludes layer migration tests)
 *
 * api add/update flow: https://github.com/aws-amplify/amplify-cli/pull/8287
 *
 * ext migrate flow: https://github.com/aws-amplify/amplify-cli/pull/8806
 */
exports.allowedVersionsToMigrateFrom = ['5.2.0', '6.1.0', '10.5.1'];
//# sourceMappingURL=check-version.js.map