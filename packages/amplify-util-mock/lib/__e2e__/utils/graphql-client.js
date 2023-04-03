"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLClient = void 0;
const axios_1 = __importDefault(require("axios"));
class GraphQLClient {
    constructor(url, headers) {
        this.url = url;
        this.headers = headers;
    }
    async query(query, variables) {
        const axRes = await axios_1.default.post(this.url, {
            query,
            variables,
        }, { headers: this.headers });
        return axRes.data;
    }
}
exports.GraphQLClient = GraphQLClient;
//# sourceMappingURL=graphql-client.js.map