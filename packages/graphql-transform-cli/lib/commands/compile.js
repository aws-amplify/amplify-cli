"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const clime_1 = require("clime");
const File_1 = require("../types/File");
const graphql_transform_1 = require("graphql-transform");
const graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
const graphql_auth_transformer_1 = require("graphql-auth-transformer");
const graphql_appsync_transformer_1 = require("graphql-appsync-transformer");
let default_1 = class default_1 extends clime_1.Command {
    execute(schemaFile, output) {
        const transformer = new graphql_transform_1.default({
            transformers: [
                new graphql_appsync_transformer_1.default(),
                new graphql_dynamodb_transformer_1.default(),
                new graphql_auth_transformer_1.default()
            ]
        });
        const cfdoc = transformer.transform(schemaFile.readSync());
        output.writeSync(JSON.stringify(cfdoc, null, 4));
    }
};
__decorate([
    __param(0, clime_1.param({
        description: 'Path to schema.graphql',
        required: true,
    })),
    __param(1, clime_1.param({
        description: 'Path to output.yaml',
        required: true,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [File_1.default,
        File_1.default]),
    __metadata("design:returntype", void 0)
], default_1.prototype, "execute", null);
default_1 = __decorate([
    clime_1.command({
        description: 'Deploy an AppSync API from your schema.graphql file',
    })
], default_1);
exports.default = default_1;
//# sourceMappingURL=compile.js.map