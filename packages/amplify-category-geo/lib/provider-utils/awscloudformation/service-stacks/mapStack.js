"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const cdk = __importStar(require("@aws-cdk/core"));
const location = __importStar(require("@aws-cdk/aws-location"));
const iam = __importStar(require("@aws-cdk/aws-iam"));
const mapParams_1 = require("../utils/mapParams");
const prepare_app_1 = require("@aws-cdk/core/lib/private/prepare-app");
const resourceParams_1 = require("../utils/resourceParams");
class MapStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id);
        this.props = props;
        this.mapName = this.props.mapName;
        this.mapStyle = mapParams_1.getGeoMapStyle(this.props.dataProvider, this.props.mapStyleType);
        this.pricingPlan = this.props.pricingPlan;
        this.accessType = this.props.accessType;
        this.parameters = this.constructInputParameters([
            'authRoleName',
            'unauthRoleName',
            'env'
        ]);
        this.resources = this.constructResources();
        new cdk.CfnOutput(this, 'Name', {
            value: this.resources.get('map').ref
        });
    }
    constructInputParameters(parameterNames) {
        let parametersMap = new Map();
        parameterNames.forEach(parameterName => {
            const inputParameter = new cdk.CfnParameter(this, parameterName, { type: 'String' });
            parametersMap.set(parameterName, inputParameter);
        });
        return parametersMap;
    }
    constructResources() {
        let resourcesMap = new Map();
        const mapResource = this.constructMapResource();
        resourcesMap.set('map', mapResource);
        const mapPolicyResource = this.constructMapPolicyResource(mapResource);
        resourcesMap.set('mapPolicy', mapPolicyResource);
        return resourcesMap;
    }
    constructMapResource() {
        return new location.CfnMap(this, 'Map', {
            mapName: this.mapName,
            configuration: {
                style: this.mapStyle
            },
            pricingPlan: this.pricingPlan
        });
    }
    toCloudFormation() {
        prepare_app_1.prepareApp(this);
        const cfn = this._toCloudFormation();
        return cfn;
    }
    constructMapPolicyResource(mapResource) {
        let policy = new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "geo:GetMapStyleDescriptor",
                        "geo:GetMapGlyphs",
                        "geo:GetMapSprites",
                        "geo:GetMapTile"
                    ],
                    resources: [mapResource.getAtt('MapArn').toString()],
                })
            ],
        });
        let cognitoRoles = new Array();
        cognitoRoles.push(this.parameters.get('authRoleName').valueAsString);
        if (this.accessType == resourceParams_1.AccessType.AuthorizedAndGuestUsers) {
            cognitoRoles.push(this.parameters.get('unauthRoleName').valueAsString);
        }
        return new iam.CfnPolicy(this, 'MapPolicy', {
            policyName: `${this.mapName}Policy`,
            roles: cognitoRoles,
            policyDocument: policy
        });
    }
}
exports.MapStack = MapStack;
//# sourceMappingURL=mapStack.js.map