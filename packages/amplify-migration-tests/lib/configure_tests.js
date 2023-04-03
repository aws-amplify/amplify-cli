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
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const semver_1 = __importDefault(require("semver"));
/*
 *  Migration tests must be run without publishing to local registry
 *  so that the CLI used initially is the installed version and the
 *  tested CLI is the codebase (bin/amplify)
 */
function setupAmplify(version = 'latest') {
    return __awaiter(this, void 0, void 0, function* () {
        // install CLI to be used for migration test initial project
        yield (0, amplify_e2e_core_1.installAmplifyCLI)(version);
        console.log('INSTALLED CLI:', version);
        if ((0, amplify_e2e_core_1.isCI)()) {
            const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
            const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
            if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
                throw new Error('Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env');
            }
            const validSemver = semver_1.default.parse(version);
            if (!validSemver || semver_1.default.gt(version, '10.7.0')) {
                // version is either after 10.7 or it's a tag name like latest so use the current configure function
                yield (0, amplify_e2e_core_1.amplifyConfigure)({
                    accessKeyId: AWS_ACCESS_KEY_ID,
                    secretAccessKey: AWS_SECRET_ACCESS_KEY,
                    profileName: 'amplify-integ-test-user',
                });
            }
            else {
                // version is before 10.7 so use the previous config function
                yield (0, amplify_e2e_core_1.amplifyConfigureBeforeOrAtV10_7)({
                    accessKeyId: AWS_ACCESS_KEY_ID,
                    secretAccessKey: AWS_SECRET_ACCESS_KEY,
                    profileName: 'amplify-integ-test-user',
                });
            }
            if (process.env.AWS_SESSION_TOKEN) {
                (0, amplify_e2e_core_1.injectSessionToken)('amplify-integ-test-user');
            }
        }
        else {
            console.log('AWS Profile is already configured');
        }
    });
}
process.nextTick(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // check if cli version was passed to setup-profile
        if (process.argv.length > 2) {
            const cliVersion = process.argv[2];
            yield setupAmplify(cliVersion);
        }
        else {
            yield setupAmplify();
        }
    }
    catch (e) {
        console.log(e.stack);
        process.exit(1);
    }
}));
//# sourceMappingURL=configure_tests.js.map