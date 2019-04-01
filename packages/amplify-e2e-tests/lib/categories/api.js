"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nexpect = require("nexpect");
var fs = require("fs");
var utils_1 = require("../utils");
var defaultSettings = {
    projectName: 'CLIIntegTestApi',
};
function readSchemaDocument(schemaName) {
    var docPath = __dirname + "/../../schemas/" + schemaName + ".graphql";
    if (fs.existsSync(docPath)) {
        return fs.readFileSync(docPath).toString();
    }
    else {
        throw new Error("Could not find schema at path '" + docPath + "'");
    }
}
function getSchemaPath(schemaName) {
    return __dirname + "/../../schemas/" + schemaName;
}
function addApiWithSimpleModel(cwd, settings, verbose) {
    if (verbose === void 0) { verbose = !utils_1.isCI(); }
    return new Promise(function (resolve, reject) {
        nexpect
            .spawn(utils_1.getCLIPath(), ['add', 'api'], { cwd: cwd, stripColors: true, verbose: verbose })
            .wait('Please select from one of the below mentioned services')
            .sendline('\r')
            .wait('Provide API name:')
            .sendline('\r')
            .wait(/.*Choose an authorization type for the API.*/)
            .sendline('\r')
            .wait('Do you have an annotated GraphQL schema?')
            .sendline('y')
            .wait('Provide your schema file path:')
            .sendline(getSchemaPath('simple_model.graphql'))
            // tslint:disable-next-line
            .wait('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud')
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
exports.addApiWithSimpleModel = addApiWithSimpleModel;
//# sourceMappingURL=api.js.map