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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const clime_1 = require("clime");
const File_1 = require("../types/File");
const graphql_transform_1 = require("graphql-transform");
const simple_appsync_transform_1 = require("simple-appsync-transform");
const fs = require("fs");
const path = require("path");
const log_1 = require("../log");
const aws_sdk_1 = require("aws-sdk");
const TMP_FILE = path.join(process.cwd(), '.tmp.cf.json');
function deploy(template, name, region = 'us-west-2') {
    return __awaiter(this, void 0, void 0, function* () {
        const cloudformation = new aws_sdk_1.CloudFormation({ apiVersion: '2010-05-15', region });
        fs.writeFileSync(TMP_FILE, JSON.stringify(template));
        const params = [
            {
                ParameterKey: 'AppSyncApiName',
                ParameterValue: name
            },
            {
                ParameterKey: 'DynamoDBTableName',
                ParameterValue: name + 'Table'
            },
            {
                ParameterKey: 'ElasticSearchDomainName',
                ParameterValue: name.toLowerCase()
            },
            {
                ParameterKey: 'IAMRoleName',
                ParameterValue: name + 'Role'
            },
            {
                ParameterKey: 'StreamingIAMRoleName',
                ParameterValue: name + 'StreamingLambda'
            }
        ];
        // const paramOverrides = Object.keys(params).map((k: string) => `${k}=${params[k]}`).join(' ')
        return yield new Promise((resolve, reject) => {
            cloudformation.createStack({
                StackName: name,
                Capabilities: ['CAPABILITY_NAMED_IAM'],
                Parameters: params,
                TemplateBody: JSON.stringify(template)
            }, (err, data) => {
                if (err) {
                    log_1.default.error(err.message);
                    reject(err);
                    return;
                }
                log_1.default.info(data);
                resolve(data);
            });
            // exec(`aws cloudformation deploy --template-file .tmp.cf.json --stack-name ${name} --param-overrides ${paramOverrides}`, (err, stdout, stderr) => {
            //     // fs.unlinkSync(TMP_FILE)
            //     if (err) {
            //         log.error(err.message)
            //         reject(err)
            //         return
            //     }
            //     if (stderr) {
            //         log.error(stderr)
            //         reject(err)
            //         return
            //     }
            //     log.error(stdout)
            //     resolve(stdout)
            // })
        });
    });
}
let default_1 = class default_1 extends clime_1.Command {
    execute(schema, name, region) {
        return __awaiter(this, void 0, void 0, function* () {
            const transformer = new graphql_transform_1.default({
                transformers: [
                    new simple_appsync_transform_1.default()
                ]
            });
            const cfdoc = transformer.transform(schema.readSync());
            const out = yield deploy(cfdoc, name);
        });
    }
};
__decorate([
    __param(0, clime_1.param({
        description: 'Path to schema.graphql',
        required: true,
    })),
    __param(1, clime_1.param({
        description: 'The name of the application',
        required: true,
    })),
    __param(2, clime_1.param({
        description: 'The region to launch the stack in. Defaults to us-west-2',
        required: false,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [File_1.default, String, String]),
    __metadata("design:returntype", Promise)
], default_1.prototype, "execute", null);
default_1 = __decorate([
    clime_1.command({
        description: 'Deploy an AppSync API from your schema.graphql file',
    })
], default_1);
exports.default = default_1;
//# sourceMappingURL=deploy.js.map