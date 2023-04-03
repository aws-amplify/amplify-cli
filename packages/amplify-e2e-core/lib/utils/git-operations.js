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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gitChangedFiles = exports.gitCleanFdX = exports.gitCleanFdx = exports.gitCommitAll = exports.gitInit = void 0;
const execa_1 = __importDefault(require("execa"));
/**
 * Initializes a git repo in the specified directory and configures a test name and email for commits
 */
const gitInit = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, execa_1.default)('git', ['init'], { cwd });
    yield (0, execa_1.default)('git', ['config', 'user.email', 'e2e-test@test.com'], { cwd });
    yield (0, execa_1.default)('git', ['config', 'user.name', 'E2E Test'], { cwd });
});
exports.gitInit = gitInit;
/**
 * Stages all changed files and commits them
 */
const gitCommitAll = (cwd, message = 'e2e core committing all staged files') => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, execa_1.default)('git', ['add', '.'], { cwd });
    yield (0, execa_1.default)('git', ['commit', '-m', message], { cwd });
});
exports.gitCommitAll = gitCommitAll;
/**
 * Executes `git clean -fdx` in the specified directory
 */
const gitCleanFdx = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, execa_1.default)('git', ['clean', '-fdx'], { cwd });
});
exports.gitCleanFdx = gitCleanFdx;
// It is important to note the difference between -fdx and -fdX
// -fdx removes all untracked files
// -fdX removes all untracked files that are not ignored by git
const gitCleanFdX = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, execa_1.default)('git', ['clean', '-fdX'], { cwd });
});
exports.gitCleanFdX = gitCleanFdX;
/**
 * Returns a list of files that have unstaged changes in the specified directory
 */
const gitChangedFiles = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    const { stdout } = yield (0, execa_1.default)('git', ['diff', '--name-only'], { cwd });
    return stdout
        .trim()
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .sort();
});
exports.gitChangedFiles = gitChangedFiles;
//# sourceMappingURL=git-operations.js.map