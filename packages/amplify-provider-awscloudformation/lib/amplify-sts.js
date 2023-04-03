"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountId = void 0;
const aws_sts_1 = require("./aws-utils/aws-sts");
async function getAccountId(context) {
    const amplifySts = await aws_sts_1.STS.getInstance(context);
    try {
        const data = await amplifySts.getCallerIdentity();
        return data.Account;
    }
    catch (ex) {
        return '';
    }
}
exports.getAccountId = getAccountId;
//# sourceMappingURL=amplify-sts.js.map