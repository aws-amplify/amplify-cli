"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nexpect = require("nexpect");
var utils_1 = require("../utils");
function amplifyPush(cwd, verbose) {
    if (verbose === void 0) { verbose = utils_1.isCI() ? false : true; }
    return new Promise(function (resolve, reject) {
        nexpect
            .spawn(utils_1.getCLIPath(), ['push'], { cwd: cwd, stripColors: true, verbose: verbose })
            .wait('Are you sure you want to continue?')
            .sendline('y')
            .wait('Do you want to generate code for your newly created GraphQL API')
            .sendline('n')
            .wait(/.*/)
            .run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.default = amplifyPush;
//# sourceMappingURL=amplifyPush.js.map