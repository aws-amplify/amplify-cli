"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.ValidateError = exports.Unauthorized = exports.TemplateSentError = void 0;
var errors_1 = require("./errors");
Object.defineProperty(exports, "TemplateSentError", { enumerable: true, get: function () { return errors_1.TemplateSentError; } });
Object.defineProperty(exports, "Unauthorized", { enumerable: true, get: function () { return errors_1.Unauthorized; } });
Object.defineProperty(exports, "ValidateError", { enumerable: true, get: function () { return errors_1.ValidateError; } });
const general_utils_1 = require("./general-utils");
const dynamodb_utils_1 = require("./dynamodb-utils");
const list_utils_1 = require("./list-utils");
const map_utils_1 = require("./map-utils");
const auth_utils_1 = require("./auth-utils");
const transform_1 = require("./transform");
const time_1 = require("./time");
const rds_1 = require("./rds");
const str_1 = require("./str");
const math_1 = require("./math");
function create(errors = [], now = new Date(), info, context) {
    return {
        ...(0, auth_utils_1.authUtils)(context),
        ...general_utils_1.generalUtils,
        dynamodb: dynamodb_utils_1.dynamodbUtils,
        list: list_utils_1.listUtils,
        map: map_utils_1.mapUtils,
        transform: transform_1.transformUtils,
        now,
        errors,
        info,
        time: (0, time_1.time)(),
        str: str_1.str,
        math: math_1.math,
        rds: rds_1.rds,
    };
}
exports.create = create;
//# sourceMappingURL=index.js.map