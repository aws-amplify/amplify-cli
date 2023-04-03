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
exports.getProjectSchema = exports.appsyncGraphQLRequest = void 0;
const url_1 = __importDefault(require("url"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const request_1 = require("../utils/request");
function appsyncGraphQLRequest(resource, op) {
    return __awaiter(this, void 0, void 0, function* () {
        const postData = JSON.stringify(op);
        const target = url_1.default.parse(resource.output.GraphQLAPIEndpointOutput);
        return yield (0, request_1.post)({
            body: postData,
            hostname: target.host,
            path: target.path,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length,
                'X-Api-Key': resource.output.GraphQLAPIKeyOutput,
            },
        });
    });
}
exports.appsyncGraphQLRequest = appsyncGraphQLRequest;
const getProjectSchema = (projRoot, apiName) => {
    const schemaFilePath = path_1.default.join(projRoot, 'amplify', 'backend', 'api', apiName, 'schema.graphql');
    return fs_extra_1.default.readFileSync(schemaFilePath, 'utf8');
};
exports.getProjectSchema = getProjectSchema;
//# sourceMappingURL=appsync.js.map