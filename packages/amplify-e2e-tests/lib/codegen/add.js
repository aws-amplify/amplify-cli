"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCodegen = void 0;
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
/**
 * Execute a `codegen add` command for testing purposes.
 * @param cwd working directory to execute the command in
 * @param settings configuration settings for the command
 */
var addCodegen = function (cwd, settings) {
    return new Promise(function (resolve, reject) {
        var commandParams = ['codegen', 'add'];
        if (settings.apiId) {
            commandParams.push('--apiId', settings.apiId);
        }
        var run = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), commandParams, { cwd: cwd, stripColors: true });
        if (!(settings.ios || settings.android)) {
            run.wait('Choose the code generation language target').sendCarriageReturn();
        }
        run
            .wait('Enter the file name pattern of graphql queries, mutations and subscriptions')
            .sendCarriageReturn()
            .wait('Do you want to generate/update all possible GraphQL operations')
            .sendConfirmYes()
            .wait('Enter maximum statement depth [increase from default if your schema is deeply')
            .sendCarriageReturn();
        if (settings.ios) {
            run
                .wait('Enter the file name for the generated code')
                .sendCarriageReturn()
                .wait('Do you want to generate code for your newly created GraphQL API')
                .sendCarriageReturn();
        }
        run.run(function (err) {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
};
exports.addCodegen = addCodegen;
//# sourceMappingURL=add.js.map