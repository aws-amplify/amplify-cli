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
exports.envWithHelp = exports.pullWithHelp = exports.initWithHelp = exports.pushWithHelp = exports.statusForCategoryWithHelp = exports.statusWithHelp = void 0;
const __1 = require("..");
const statusWithHelp = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    const expectedLines = ['USAGE', 'amplify status [-v | --verbose]'];
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['status', '-h'], { cwd, stripColors: true });
    for (const expectedLine of expectedLines) {
        chain.wait(expectedLine);
    }
    yield chain.runAsync();
});
exports.statusWithHelp = statusWithHelp;
const statusForCategoryWithHelp = (cwd, category) => __awaiter(void 0, void 0, void 0, function* () {
    const expectedLines = ['USAGE', `amplify ${category} status`];
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['status', category, '-h'], { cwd, stripColors: true });
    for (const expectedLine of expectedLines) {
        chain.wait(expectedLine);
    }
    yield chain.runAsync();
});
exports.statusForCategoryWithHelp = statusForCategoryWithHelp;
const pushWithHelp = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    const expectedLines = ['USAGE', /amplify push*/];
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['push', '-h'], { cwd, stripColors: true });
    for (const expectedLine of expectedLines) {
        chain.wait(expectedLine);
    }
    yield chain.runAsync();
});
exports.pushWithHelp = pushWithHelp;
const initWithHelp = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    const expectedLines = ['USAGE', /amplify init*/];
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['init', '-h'], { cwd, stripColors: true });
    for (const expectedLine of expectedLines) {
        chain.wait(expectedLine);
    }
    yield chain.runAsync();
});
exports.initWithHelp = initWithHelp;
const pullWithHelp = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    const expectedLines = ['USAGE', /amplify pull*/];
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['pull', '-h'], { cwd, stripColors: true });
    for (const expectedLine of expectedLines) {
        chain.wait(expectedLine);
    }
    yield chain.runAsync();
});
exports.pullWithHelp = pullWithHelp;
const envWithHelp = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    const expectedLines = ['USAGE', 'amplify env <subcommand>'];
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['env', '-h'], { cwd, stripColors: true });
    for (const expectedLine of expectedLines) {
        chain.wait(expectedLine);
    }
    yield chain.runAsync();
});
exports.envWithHelp = envWithHelp;
//# sourceMappingURL=help.js.map