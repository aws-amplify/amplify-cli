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
exports.MapStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const fs = __importStar(require("fs-extra"));
const resourceParams_1 = require("../service-utils/resourceParams");
const baseStack_1 = require("./baseStack");
const constants_1 = require("../service-utils/constants");
class MapStack extends baseStack_1.BaseStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.props = props;
        this.accessType = this.props.accessType;
        this.groupPermissions = this.props.groupPermissions;
        this.authResourceName = this.props.authResourceName;
        this.mapRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');
        const inputParameters = (this.props.groupPermissions || []).map((group) => `authuserPoolGroups${group}GroupRole`);
        inputParameters.push(`auth${this.authResourceName}UserPoolId`, 'authRoleName', 'unauthRoleName', 'mapName', 'mapStyle', 'env', 'isDefault');
        this.parameters = this.constructInputParameters(inputParameters);
        this.mapName = aws_cdk_lib_1.Fn.join('-', [this.parameters.get('mapName').valueAsString, this.parameters.get('env').valueAsString]);
        this.mapResource = this.constructMapResource();
        this.constructMapPolicyResource(this.mapResource);
        this.constructOutputs();
    }
    constructOutputs() {
        new cdk.CfnOutput(this, 'Name', {
            value: this.mapResource.getAtt('MapName').toString(),
        });
        new cdk.CfnOutput(this, 'Style', {
            value: this.parameters.get('mapStyle').valueAsString,
        });
        new cdk.CfnOutput(this, 'Region', {
            value: this.mapRegion,
        });
        new cdk.CfnOutput(this, 'Arn', {
            value: this.mapResource.getAtt('MapArn').toString(),
        });
    }
    constructMapResource() {
        const geoCreateMapStatement = new iam.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
        });
        geoCreateMapStatement.addActions('geo:CreateMap');
        geoCreateMapStatement.addAllResources();
        const mapARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:map/${mapName}', {
            region: this.mapRegion,
            account: cdk.Fn.ref('AWS::AccountId'),
            mapName: this.mapName,
        });
        const geoUpdateDeleteMapStatement = new iam.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
        });
        geoUpdateDeleteMapStatement.addActions('geo:UpdateMap', 'geo:DeleteMap');
        geoUpdateDeleteMapStatement.addResources(mapARN);
        const mapStyle = this.parameters.get('mapStyle').valueAsString;
        const customMapLambdaCode = fs.readFileSync(constants_1.customMapLambdaCodePath, 'utf-8');
        const customMapLambda = new lambda.Function(this, 'CustomMapLambda', {
            code: lambda.Code.fromInline(customMapLambdaCode),
            handler: 'index.handler',
            runtime: aws_lambda_1.Runtime.NODEJS_16_X,
            timeout: aws_cdk_lib_1.Duration.seconds(300),
        });
        customMapLambda.addToRolePolicy(geoCreateMapStatement);
        customMapLambda.addToRolePolicy(geoUpdateDeleteMapStatement);
        const mapCustomResource = new cdk.CustomResource(this, 'CustomMap', {
            serviceToken: customMapLambda.functionArn,
            resourceType: 'Custom::LambdaCallout',
            properties: {
                mapName: this.mapName,
                mapStyle,
                region: this.mapRegion,
                env: cdk.Fn.ref('env'),
            },
        });
        return mapCustomResource;
    }
    constructMapPolicyResource(mapResource) {
        const policy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['geo:GetMapStyleDescriptor', 'geo:GetMapGlyphs', 'geo:GetMapSprites', 'geo:GetMapTile'],
                    resources: [mapResource.getAtt('MapArn').toString()],
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
        return new iam.CfnPolicy(this, 'MapPolicy', {
            policyName: `${this.mapName}Policy`,
            roles: cognitoRoles,
            policyDocument: policy,
        });
    }
}
exports.MapStack = MapStack;
//# sourceMappingURL=mapStack.js.map