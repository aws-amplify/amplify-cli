"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOverrides = exports.amplifyOverrideApi = exports.amplifyOverrideAuth = exports.amplifyOverrideRoot = void 0;
// eslint-disable-next-line import/no-cycle
const __1 = require("..");
const amplifyOverrideRoot = (cwd, settings) => {
    const args = ['override', 'project'];
    return (0, __1.nspawn)((0, __1.getCLIPath)(settings.testingWithLatestCodebase), args, { cwd, stripColors: true })
        .wait('Do you want to edit override.ts file now?')
        .sendNo()
        .sendEof()
        .runAsync();
};
exports.amplifyOverrideRoot = amplifyOverrideRoot;
const amplifyOverrideAuth = (cwd) => {
    const args = ['override', 'auth'];
    return (0, __1.nspawn)((0, __1.getCLIPath)(), args, { cwd, stripColors: true })
        .wait('Do you want to edit override.ts file now?')
        .sendNo()
        .sendEof()
        .runAsync();
};
exports.amplifyOverrideAuth = amplifyOverrideAuth;
const amplifyOverrideApi = (cwd) => {
    const args = ['override', 'api'];
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), args, { cwd, stripColors: true });
    chain.wait('Do you want to edit override.ts file now?').sendNo().sendEof();
    return chain.runAsync();
};
exports.amplifyOverrideApi = amplifyOverrideApi;
const buildOverrides = (cwd) => {
    const args = ['build'];
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), args, { cwd, stripColors: true });
    return chain.runAsync();
};
exports.buildOverrides = buildOverrides;
//# sourceMappingURL=overrideStack.js.map