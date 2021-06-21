"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMapWalkthrough = exports.createMapWalkthrough = void 0;
const inquirer_1 = __importDefault(require("inquirer"));
const resourceParamsUtils_1 = require("../utils/resourceParamsUtils");
const mapParams_1 = require("../utils/mapParams");
const uuid_1 = __importDefault(require("uuid"));
const resourceParams_1 = require("../utils/resourceParams");
const constants_1 = require("../utils/constants");
async function createMapWalkthrough(context, parameters) {
    parameters = resourceParamsUtils_1.merge(parameters, await mapNameWalkthrough(context));
    parameters = resourceParamsUtils_1.merge(parameters, await mapDataProviderWalkthrough());
    if (parameters.dataProvider == resourceParams_1.DataProvider.Here) {
        parameters.mapStyleType = mapParams_1.HereMapStyleType.Berlin;
    }
    else {
        parameters = resourceParamsUtils_1.merge(parameters, await mapStyleTypeWalkthrough());
        if (parameters.mapStyleType == mapParams_1.EsriMapStyleType.Canvas) {
            parameters = resourceParamsUtils_1.merge(parameters, await mapCavasStyleTypeWalkthrough());
        }
    }
    parameters = resourceParamsUtils_1.merge(parameters, await mapAccessWalkthrough());
    parameters = resourceParamsUtils_1.merge(parameters, await pricingPlanWalkthrough());
    parameters.isDefaultMap = await context.amplify.confirmPrompt('Do you want to set this map as default?', true);
    return parameters;
}
exports.createMapWalkthrough = createMapWalkthrough;
async function mapNameWalkthrough(context) {
    const mapNamePrompt = {
        type: 'input',
        name: 'mapName',
        message: 'Provide a name for the Map:',
        validate: context.amplify.inputValidation({
            operator: 'regex',
            value: '^[a-zA-Z0-9]+$',
            onErrorMsg: 'You can use the following characters: a-z A-Z 0-9',
            required: true,
        }),
        default: () => {
            const [shortId] = uuid_1.default().split('-');
            return `map${shortId}`;
        },
    };
    return await inquirer_1.default.prompt([mapNamePrompt]);
}
async function mapDataProviderWalkthrough() {
    const dataProviderPrompt = {
        type: 'list',
        name: 'dataProvider',
        message: 'Specify the data provider of geospatial data:',
        choices: Object.keys(resourceParams_1.DataProvider),
        default: 'Esri'
    };
    return await inquirer_1.default.prompt([dataProviderPrompt]);
}
async function mapStyleTypeWalkthrough() {
    const mapStyleTypePrompt = {
        type: 'list',
        name: 'mapStyleType',
        message: `Specify the map style. Refer ${constants_1.apiDocs.mapStyles}`,
        choices: Object.keys(mapParams_1.EsriMapStyleType),
        default: 'Streets'
    };
    return await inquirer_1.default.prompt([mapStyleTypePrompt]);
}
async function mapCavasStyleTypeWalkthrough() {
    const mapCanvasStyleTypePrompt = {
        type: 'list',
        name: 'mapStyleType',
        message: 'Choose from available Canvas Map Styles:',
        choices: ['DarkGrayCanvas', 'LightGrayCanvas'],
        default: 'LightGrayCanvas'
    };
    return await inquirer_1.default.prompt([mapCanvasStyleTypePrompt]);
}
async function mapAccessWalkthrough() {
    const mapAccessPrompt = {
        type: 'list',
        name: 'accessType',
        message: 'Who should have access?',
        choices: Object.keys(resourceParams_1.AccessType),
        default: 'AuthUsers'
    };
    return await inquirer_1.default.prompt([mapAccessPrompt]);
}
async function pricingPlanWalkthrough() {
    const pricingPlanPrompt = {
        type: 'list',
        name: 'pricingPlan',
        message: 'Specify the pricing plan for the map: Refer https://aws.amazon.com/location/pricing/',
        choices: Object.values(resourceParams_1.PricingPlan),
        default: 'RequestBasedUsage'
    };
    return await inquirer_1.default.prompt([pricingPlanPrompt]);
}
async function updateMapWalkthrough(context, lambdaToUpdate) {
    return {};
}
exports.updateMapWalkthrough = updateMapWalkthrough;
//# sourceMappingURL=mapWalkthrough.js.map