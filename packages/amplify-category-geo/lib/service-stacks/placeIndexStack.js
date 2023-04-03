"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceIndexStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const fs = __importStar(require("fs-extra"));
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const resourceParams_1 = require("../service-utils/resourceParams");
const baseStack_1 = require("./baseStack");
const constants_1 = require("../service-utils/constants");
class PlaceIndexStack extends baseStack_1.BaseStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.props = props;
        this.accessType = this.props.accessType;
        this.groupPermissions = this.props.groupPermissions;
        this.authResourceName = this.props.authResourceName;
        this.placeIndexRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');
        const inputParameters = this.props.groupPermissions.map((group) => `authuserPoolGroups${group}GroupRole`);
        inputParameters.push(`auth${this.authResourceName}UserPoolId`, 'authRoleName', 'unauthRoleName', 'indexName', 'dataProvider', 'dataSourceIntendedUse', 'env', 'isDefault');
        this.parameters = this.constructInputParameters(inputParameters);
        this.placeIndexName = aws_cdk_lib_1.Fn.join('-', [this.parameters.get('indexName').valueAsString, this.parameters.get('env').valueAsString]);
        this.placeIndexResource = this.constructIndexResource();
        this.constructIndexPolicyResource(this.placeIndexResource);
        this.constructOutputs();
    }
    constructOutputs() {
        new cdk.CfnOutput(this, 'Name', {
            value: this.placeIndexResource.getAtt('IndexName').toString(),
        });
        new cdk.CfnOutput(this, 'Region', {
            value: this.placeIndexRegion,
        });
        new cdk.CfnOutput(this, 'Arn', {
            value: this.placeIndexResource.getAtt('IndexArn').toString(),
        });
    }
    constructIndexResource() {
        const geoCreateIndexStatement = new iam.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
        });
        geoCreateIndexStatement.addActions('geo:CreatePlaceIndex');
        geoCreateIndexStatement.addAllResources();
        const placeIndexARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:place-index/${indexName}', {
            region: this.placeIndexRegion,
            account: cdk.Fn.ref('AWS::AccountId'),
            indexName: this.placeIndexName,
        });
        const geoUpdateDeleteIndexStatement = new iam.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
        });
        geoUpdateDeleteIndexStatement.addActions('geo:UpdatePlaceIndex', 'geo:DeletePlaceIndex');
        geoUpdateDeleteIndexStatement.addResources(placeIndexARN);
        const dataSource = this.parameters.get('dataProvider').valueAsString;
        const dataSourceIntendedUse = this.parameters.get('dataSourceIntendedUse').valueAsString;
        const customPlaceIndexLambdaCode = fs.readFileSync(constants_1.customPlaceIndexLambdaCodePath, 'utf-8');
        const customPlaceIndexLambda = new lambda.Function(this, 'CustomPlaceIndexLambda', {
            code: lambda.Code.fromInline(customPlaceIndexLambdaCode),
            handler: 'index.handler',
            runtime: aws_lambda_1.Runtime.NODEJS_16_X,
            timeout: aws_cdk_lib_1.Duration.seconds(300),
        });
        customPlaceIndexLambda.addToRolePolicy(geoCreateIndexStatement);
        customPlaceIndexLambda.addToRolePolicy(geoUpdateDeleteIndexStatement);
        const placeIndexCustomResource = new cdk.CustomResource(this, 'CustomPlaceIndex', {
            serviceToken: customPlaceIndexLambda.functionArn,
            resourceType: 'Custom::LambdaCallout',
            properties: {
                indexName: this.placeIndexName,
                dataSource,
                dataSourceIntendedUse,
                region: this.placeIndexRegion,
                env: cdk.Fn.ref('env'),
            },
        });
        return placeIndexCustomResource;
    }
    constructIndexPolicyResource(indexResource) {
        const policy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['geo:SearchPlaceIndexForPosition', 'geo:SearchPlaceIndexForText', 'geo:SearchPlaceIndexForSuggestions', 'geo:GetPlace'],
                    resources: [indexResource.getAtt('IndexArn').toString()],
                }),
            ],
        });
        const cognitoRoles = [];
        if (this.accessType === resourceParams_1.AccessType.AuthorizedUsers || this.accessType === resourceParams_1.AccessType.AuthorizedAndGuestUsers) {
            cognitoRoles.push(this.parameters.get('authRoleName').valueAsString);
        }
        if (this.accessType === resourceParams_1.AccessType.AuthorizedAndGuestUsers) {
            cognitoRoles.push(this.parameters.get('unauthRoleName').valueAsString);
        }
        if (this.groupPermissions && this.authResourceName) {
            this.groupPermissions.forEach((group) => {
                cognitoRoles.push(cdk.Fn.join('-', [this.parameters.get(`auth${this.authResourceName}UserPoolId`).valueAsString, `${group}GroupRole`]));
            });
        }
        return new iam.CfnPolicy(this, 'PlaceIndexPolicy', {
            policyName: `${this.placeIndexName}Policy`,
            roles: cognitoRoles,
            policyDocument: policy,
        });
    }
}
exports.PlaceIndexStack = PlaceIndexStack;
//# sourceMappingURL=placeIndexStack.js.map