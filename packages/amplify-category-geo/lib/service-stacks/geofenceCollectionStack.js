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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeofenceCollectionStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const fs = __importStar(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const aws_lambda_1 = require("aws-cdk-lib/aws-lambda");
const constants_1 = require("../service-utils/constants");
const baseStack_1 = require("./baseStack");
const geofenceCollectionUtils_1 = require("../service-utils/geofenceCollectionUtils");
class GeofenceCollectionStack extends baseStack_1.BaseStack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.props = props;
        this.groupPermissions = this.props.groupPermissions;
        this.authResourceName = this.props.authResourceName;
        this.geofenceCollectionRegion = this.regionMapping.findInMap(cdk.Fn.ref('AWS::Region'), 'locationServiceRegion');
        const inputParameters = Object.keys(this.props.groupPermissions).map((group) => `authuserPoolGroups${group}GroupRole`);
        inputParameters.push(`auth${this.authResourceName}UserPoolId`, 'collectionName', 'env', 'isDefault');
        this.parameters = this.constructInputParameters(inputParameters);
        this.geofenceCollectionName = aws_cdk_lib_1.Fn.join('-', [
            this.parameters.get('collectionName').valueAsString,
            this.parameters.get('env').valueAsString,
        ]);
        this.geofenceCollectionResource = this.constructCollectionResource();
        this.constructCollectionPolicyResources(this.geofenceCollectionResource);
        this.constructOutputs();
    }
    constructOutputs() {
        new cdk.CfnOutput(this, 'Name', {
            value: this.geofenceCollectionResource.getAtt('CollectionName').toString(),
        });
        new cdk.CfnOutput(this, 'Region', {
            value: this.geofenceCollectionRegion,
        });
        const outputGeofenceCollectionARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:geofence-collection/${collectionName}', {
            region: this.geofenceCollectionRegion,
            account: cdk.Fn.ref('AWS::AccountId'),
            collectionName: this.geofenceCollectionResource.getAtt('CollectionName').toString(),
        });
        new cdk.CfnOutput(this, 'Arn', {
            value: outputGeofenceCollectionARN,
        });
    }
    constructCollectionResource() {
        const geoCreateCollectionStatement = new iam.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
        });
        geoCreateCollectionStatement.addActions('geo:CreateGeofenceCollection');
        geoCreateCollectionStatement.addAllResources();
        const geofenceCollectionARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:geofence-collection/${collectionName}', {
            region: this.geofenceCollectionRegion,
            account: cdk.Fn.ref('AWS::AccountId'),
            collectionName: this.geofenceCollectionName,
        });
        const geoUpdateDeleteCollectionStatement = new iam.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
        });
        geoUpdateDeleteCollectionStatement.addActions('geo:UpdateGeofenceCollection', 'geo:DeleteGeofenceCollection');
        geoUpdateDeleteCollectionStatement.addResources(geofenceCollectionARN);
        const customGeofenceCollectionLambdaCode = fs.readFileSync(constants_1.customGeofenceCollectionLambdaCodePath, 'utf-8');
        const customGeofenceCollectionLambda = new lambda.Function(this, 'CustomGeofenceCollectionLambda', {
            code: lambda.Code.fromInline(customGeofenceCollectionLambdaCode),
            handler: 'index.handler',
            runtime: aws_lambda_1.Runtime.NODEJS_16_X,
            timeout: aws_cdk_lib_1.Duration.seconds(300),
        });
        customGeofenceCollectionLambda.addToRolePolicy(geoCreateCollectionStatement);
        customGeofenceCollectionLambda.addToRolePolicy(geoUpdateDeleteCollectionStatement);
        const geofenceCollectionCustomResource = new cdk.CustomResource(this, 'CustomGeofenceCollection', {
            serviceToken: customGeofenceCollectionLambda.functionArn,
            resourceType: 'Custom::LambdaCallout',
            properties: {
                collectionName: this.geofenceCollectionName,
                region: this.geofenceCollectionRegion,
                env: cdk.Fn.ref('env'),
            },
        });
        return geofenceCollectionCustomResource;
    }
    constructCollectionPolicyResources(collectionResource) {
        Object.keys(this.groupPermissions).forEach((group) => {
            const outputGeofenceCollectionARN = cdk.Fn.sub('arn:aws:geo:${region}:${account}:geofence-collection/${collectionName}', {
                region: this.geofenceCollectionRegion,
                account: cdk.Fn.ref('AWS::AccountId'),
                collectionName: collectionResource.getAtt('CollectionName').toString(),
            });
            const crudActions = lodash_1.default.uniq(lodash_1.default.flatten(this.groupPermissions[group].map((permission) => geofenceCollectionUtils_1.crudPermissionsMap[permission])));
            const policyDocument = new iam.PolicyDocument({
                statements: [
                    new iam.PolicyStatement({
                        effect: iam.Effect.ALLOW,
                        actions: crudActions,
                        resources: [outputGeofenceCollectionARN],
                    }),
                ],
            });
            new iam.CfnPolicy(this, `${group}GeofenceCollectionPolicy`, {
                policyName: `${group}${this.geofenceCollectionName}Policy`,
                roles: [cdk.Fn.join('-', [this.parameters.get(`auth${this.authResourceName}UserPoolId`).valueAsString, `${group}GroupRole`])],
                policyDocument,
            });
        });
    }
}
exports.GeofenceCollectionStack = GeofenceCollectionStack;
//# sourceMappingURL=geofenceCollectionStack.js.map