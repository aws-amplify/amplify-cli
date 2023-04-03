"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeoJSONObj = exports.generateResourceIdsInOrder = exports.getGeoJSConfiguration = exports.removeFirstDefaultGeofenceCollection = exports.removeGeofenceCollection = exports.removeFirstDefaultPlaceIndex = exports.removePlaceIndex = exports.removeFirstDefaultMap = exports.removeMap = exports.updateSecondGeofenceCollectionAsDefault = exports.updateGeofenceCollectionWithDefault = exports.updateSecondPlaceIndexAsDefault = exports.updatePlaceIndexWithDefault = exports.updateSecondMapAsDefault = exports.updateMapWithDefault = exports.importGeofencesWithDefault = exports.addGeofenceCollectionWithDefault = exports.addPlaceIndexWithDefault = exports.addMapWithDefault = exports.getGeoJSONFilePath = void 0;
const __1 = require("..");
const path_1 = __importDefault(require("path"));
const fs_extra_1 = require("fs-extra");
const defaultGeoConfig = {
    isFirstGeoResource: false,
    isAdditional: false,
    isDefault: true,
    resourceName: '\r',
    geoJSONFileName: 'valid-root-level-id.json',
    isRootLevelID: true,
    customProperty: 'name',
};
const defaultSearchIndexQuestion = `Set this search index as the default? It will be used in Amplify search index API calls if no explicit reference is provided.`;
const defaultMapQuestion = `Set this Map as the default? It will be used in Amplify Map API calls if no explicit reference is provided.`;
const defaultGeofenceCollectionQuestion = `Set this geofence collection as the default? It will be used in Amplify geofence collection API calls if no explicit reference is provided.`;
function getGeoJSONFilePath(fileName) {
    return path_1.default.join(__dirname, '..', '..', '..', 'amplify-e2e-tests', 'geo-json-files', fileName);
}
exports.getGeoJSONFilePath = getGeoJSONFilePath;
/**
 * Add map with default values. Assume auth is already configured
 * @param cwd command directory
 */
function addMapWithDefault(cwd, settings = {}) {
    const config = Object.assign(Object.assign({}, defaultGeoConfig), settings);
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'add'], { cwd, stripColors: true })
        .wait('Select which capability you want to add:')
        .sendCarriageReturn()
        .wait('Provide a name for the Map:')
        .sendLine(config.resourceName)
        .wait('Who can access this Map?')
        .sendCarriageReturn();
    chain.wait('Do you want to configure advanced settings?').sendNo();
    if (config.isAdditional === true) {
        chain.wait(defaultMapQuestion);
        if (config.isDefault === true) {
            chain.sendYes();
        }
        else {
            chain.sendNo();
        }
    }
    return chain.runAsync();
}
exports.addMapWithDefault = addMapWithDefault;
/**
 * Add place index with default values. Assume auth is already configured
 * @param cwd command directory
 */
function addPlaceIndexWithDefault(cwd, settings = {}) {
    const config = Object.assign(Object.assign({}, defaultGeoConfig), settings);
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'add'], { cwd, stripColors: true })
        .wait('Select which capability you want to add:')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Provide a name for the location search index (place index):')
        .sendLine(config.resourceName)
        .wait('Who can access this Search Index?')
        .sendCarriageReturn();
    chain.wait('Do you want to configure advanced settings?').sendNo();
    if (config.isAdditional === true) {
        chain.wait(defaultSearchIndexQuestion);
        if (config.isDefault === true) {
            chain.sendYes();
        }
        else {
            chain.sendNo();
        }
    }
    return chain.runAsync();
}
exports.addPlaceIndexWithDefault = addPlaceIndexWithDefault;
/**
 * Add geofence collection with default values. Assume auth and cognito group are configured
 * @param cwd command directory
 */
function addGeofenceCollectionWithDefault(cwd, groupNames, settings = {}) {
    const config = Object.assign(Object.assign({}, defaultGeoConfig), settings);
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'add'], { cwd, stripColors: true })
        .wait('Select which capability you want to add:')
        .sendKeyDown(2)
        .sendCarriageReturn()
        .wait('Provide a name for the Geofence Collection:')
        .sendLine(config.resourceName)
        .wait('Select one or more cognito groups to give access:')
        .selectAll();
    for (const groupName of groupNames) {
        chain.wait(`What kind of access do you want for ${groupName} users? Select ALL that apply:`).selectAll();
    }
    if (config.isAdditional === true) {
        chain.wait(defaultGeofenceCollectionQuestion);
        if (config.isDefault === true) {
            chain.sendYes();
        }
        else {
            chain.sendNo();
        }
    }
    return chain.runAsync();
}
exports.addGeofenceCollectionWithDefault = addGeofenceCollectionWithDefault;
/**
 * Add geofence collection with default values. Assume auth and cognito group are configured
 * @param cwd command directory
 */
function importGeofencesWithDefault(cwd, settings = {}) {
    const config = Object.assign(Object.assign({}, defaultGeoConfig), settings);
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'import'], { cwd, stripColors: true })
        .wait('Provide the path to GeoJSON file containing the Geofences')
        .sendLine(getGeoJSONFilePath(config.geoJSONFileName))
        .wait('Select the property to use as the Geofence feature identifier:');
    if (config.isRootLevelID) {
        chain.sendCarriageReturn(); //root level ID
    }
    else {
        chain.sendKeyDown().sendCarriageReturn(); //custom property
    }
    return chain.runAsync();
}
exports.importGeofencesWithDefault = importGeofencesWithDefault;
/**
 * Update an existing map with given settings. Assume auth is already configured
 * @param cwd command directory
 */
function updateMapWithDefault(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'update'], { cwd, stripColors: true })
        .wait('Select which capability you want to update:')
        .sendCarriageReturn()
        .wait('Select the Map you want to update')
        .sendCarriageReturn()
        .wait('Who can access this Map?')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait(defaultMapQuestion)
        .sendYes()
        .runAsync();
}
exports.updateMapWithDefault = updateMapWithDefault;
/**
 * Update the second map as default. Assume auth is already configured and two maps added with first default
 * @param cwd command directory
 */
function updateSecondMapAsDefault(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'update'], { cwd, stripColors: true })
        .wait('Select which capability you want to update:')
        .sendCarriageReturn()
        .wait('Select the Map you want to update')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Who can access this Map?')
        .sendCarriageReturn()
        .wait(defaultMapQuestion)
        .sendYes()
        .runAsync();
}
exports.updateSecondMapAsDefault = updateSecondMapAsDefault;
/**
 * Update an existing place index with default values. Assume auth is already configured
 * @param cwd command directory
 */
function updatePlaceIndexWithDefault(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'update'], { cwd, stripColors: true })
        .wait('Select which capability you want to update:')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Select the search index you want to update')
        .sendCarriageReturn()
        .wait('Who can access this Search Index?')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait(defaultSearchIndexQuestion)
        .sendYes()
        .runAsync();
}
exports.updatePlaceIndexWithDefault = updatePlaceIndexWithDefault;
/**
 * Update the second place index as default. Assume auth is already configured and two indexes added with first default
 * @param cwd command directory
 */
function updateSecondPlaceIndexAsDefault(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'update'], { cwd, stripColors: true })
        .wait('Select which capability you want to update:')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Select the search index you want to update')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Who can access this Search Index?')
        .sendCarriageReturn()
        .wait(defaultSearchIndexQuestion)
        .sendYes()
        .runAsync();
}
exports.updateSecondPlaceIndexAsDefault = updateSecondPlaceIndexAsDefault;
/**
 * Update an existing geofence collection with given settings. Assume auth is already configured
 * @param cwd command directory
 */
function updateGeofenceCollectionWithDefault(cwd, groupNames) {
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'update'], { cwd, stripColors: true })
        .wait('Select which capability you want to update:')
        .sendKeyDown(2)
        .sendCarriageReturn()
        .wait('Select the geofence collection you want to update')
        .sendCarriageReturn()
        .wait('Select one or more cognito groups to give access:')
        .sendCarriageReturn();
    for (const groupName of groupNames) {
        chain.wait(`What kind of access do you want for ${groupName} users? Select ALL that apply:`).sendCarriageReturn();
    }
    return chain.wait(defaultGeofenceCollectionQuestion).sendYes().runAsync();
}
exports.updateGeofenceCollectionWithDefault = updateGeofenceCollectionWithDefault;
/**
 * Update the second geofence collection as default. Assume auth is already configured and two geofence collections added with first default
 * @param cwd command directory
 */
function updateSecondGeofenceCollectionAsDefault(cwd, groupNames) {
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'update'], { cwd, stripColors: true })
        .wait('Select which capability you want to update:')
        .sendKeyDown(2)
        .sendCarriageReturn()
        .wait('Select the geofence collection you want to update')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Select one or more cognito groups to give access:')
        .sendCarriageReturn();
    for (const groupName of groupNames) {
        chain.wait(`What kind of access do you want for ${groupName} users? Select ALL that apply:`).sendCarriageReturn();
    }
    return chain.wait(defaultGeofenceCollectionQuestion).sendYes().runAsync();
}
exports.updateSecondGeofenceCollectionAsDefault = updateSecondGeofenceCollectionAsDefault;
/**
 * Remove an existing map. Assume auth is already configured
 * @param cwd command directory
 */
function removeMap(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'remove'], { cwd, stripColors: true })
        .wait('Select which capability you want to remove:')
        .sendCarriageReturn()
        .wait('Select the Map you want to remove')
        .sendCarriageReturn()
        .wait('Are you sure you want to delete the resource?')
        .sendConfirmYes()
        .runAsync();
}
exports.removeMap = removeMap;
/**
 * Remove an existing default map. Assume auth is already configured and two maps added with first default
 * @param cwd command directory
 */
function removeFirstDefaultMap(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'remove'], { cwd, stripColors: true })
        .wait('Select which capability you want to remove:')
        .sendCarriageReturn()
        .wait('Select the Map you want to remove')
        .sendCarriageReturn()
        .wait('Are you sure you want to delete the resource?')
        .sendConfirmYes()
        .wait('Select the Map you want to set as default:')
        .sendCarriageReturn()
        .runAsync();
}
exports.removeFirstDefaultMap = removeFirstDefaultMap;
/**
 * Remove an existing place index. Assume auth is already configured
 * @param cwd command directory
 */
function removePlaceIndex(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'remove'], { cwd, stripColors: true })
        .wait('Select which capability you want to remove:')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Select the search index you want to remove')
        .sendCarriageReturn()
        .wait('Are you sure you want to delete the resource?')
        .sendConfirmYes()
        .runAsync();
}
exports.removePlaceIndex = removePlaceIndex;
/**
 * Remove an existing default index. Assume auth is already configured and two indexes added with first default
 * @param cwd command directory
 */
function removeFirstDefaultPlaceIndex(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'remove'], { cwd, stripColors: true })
        .wait('Select which capability you want to remove:')
        .sendKeyDown()
        .sendCarriageReturn()
        .wait('Select the search index you want to remove')
        .sendCarriageReturn()
        .wait('Are you sure you want to delete the resource?')
        .sendConfirmYes()
        .wait('Select the search index you want to set as default:')
        .sendCarriageReturn()
        .runAsync();
}
exports.removeFirstDefaultPlaceIndex = removeFirstDefaultPlaceIndex;
/**
 * Remove an existing geofence collection. Assume auth is already configured
 * @param cwd command directory
 */
function removeGeofenceCollection(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'remove'], { cwd, stripColors: true })
        .wait('Select which capability you want to remove:')
        .sendKeyDown(2)
        .sendCarriageReturn()
        .wait('Select the geofence collection you want to remove')
        .sendCarriageReturn()
        .wait('Are you sure you want to delete the resource?')
        .sendConfirmYes()
        .runAsync();
}
exports.removeGeofenceCollection = removeGeofenceCollection;
/**
 * Remove an existing default geofence collection. Assume auth is already configured and two geofence collections added with first default
 * @param cwd command directory
 */
function removeFirstDefaultGeofenceCollection(cwd) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['geo', 'remove'], { cwd, stripColors: true })
        .wait('Select which capability you want to remove:')
        .sendKeyDown(2)
        .sendCarriageReturn()
        .wait('Select the geofence collection you want to remove')
        .sendCarriageReturn()
        .wait('Are you sure you want to delete the resource?')
        .sendConfirmYes()
        .wait('Select the geofence collection you want to set as default:')
        .sendCarriageReturn()
        .runAsync();
}
exports.removeFirstDefaultGeofenceCollection = removeFirstDefaultGeofenceCollection;
/**
 * Get Geo configuration from aws-exports
 */
function getGeoJSConfiguration(awsExports) {
    return awsExports.geo.amazon_location_service;
}
exports.getGeoJSConfiguration = getGeoJSConfiguration;
function generateResourceIdsInOrder(count) {
    const resourceIdArr = [];
    while (count > 0) {
        resourceIdArr.push((0, __1.generateRandomShortId)());
        count--;
    }
    return resourceIdArr;
}
exports.generateResourceIdsInOrder = generateResourceIdsInOrder;
function getGeoJSONObj(geoJSONFileName) {
    return JSON.parse((0, fs_extra_1.readFileSync)(getGeoJSONFilePath(geoJSONFileName), 'utf8'));
}
exports.getGeoJSONObj = getGeoJSONObj;
//# sourceMappingURL=geo.js.map