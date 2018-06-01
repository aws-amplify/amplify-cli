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
Object.defineProperty(exports, "__esModule", { value: true });
const clime_1 = require("clime");
const fs = require("fs");
const log_1 = require("../log");
const TemplateSchema = `type Post @model {
    id: ID!
    title: String! @search
    tags: [String] @search
    createdAt: String
    updatedAt: String
}
`;
const DefaultConfig = (name) => `
{
    "name": "${name}"
}
`;
let default_1 = class default_1 extends clime_1.Command {
    execute() {
        /**
         * Initialize an application.
         */
        log_1.default.debug('Creating schema.graphql');
        fs.writeFileSync('schema.graphql', TemplateSchema);
        log_1.default.info(`
            Edit the schema.graphql file and then run 'appsync create schema.graphql <application-name>' to build and deploy your API.
        `);
    }
};
__decorate([
    clime_1.metadata,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], default_1.prototype, "execute", null);
default_1 = __decorate([
    clime_1.command({
        description: 'Deploy an AppSync API from your schema.graphql file',
    })
], default_1);
exports.default = default_1;
//# sourceMappingURL=init.js.map