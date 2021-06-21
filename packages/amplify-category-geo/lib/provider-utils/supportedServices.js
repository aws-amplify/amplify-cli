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
exports.supportedServices = void 0;
const mapWalkthrough_1 = require("./awscloudformation/service-walkthroughs/mapWalkthrough");
const geoController = __importStar(require("./awscloudformation"));
exports.supportedServices = {
    Map: {
        alias: 'Map',
        walkthroughs: {
            createWalkthrough: mapWalkthrough_1.createMapWalkthrough,
            updateWalkthrough: mapWalkthrough_1.updateMapWalkthrough
        },
        provider: 'awscloudformation',
        providerController: geoController,
    },
    PlaceIndex: {
        alias: 'Place Index',
        walkthroughs: {
            createWalkthrough: null,
            updateWalkthrough: null
        },
        provider: 'awscloudformation',
        providerController: geoController,
    },
    Tracker: {
        alias: 'Tracker',
        walkthroughs: {
            createWalkthrough: null,
            updateWalkthrough: null
        },
        provider: 'awscloudformation',
        providerController: geoController,
    },
    GeofenceCollection: {
        alias: 'Geofence Collection',
        walkthroughs: {
            createWalkthrough: null,
            updateWalkthrough: null
        },
        provider: 'awscloudformation',
        providerController: geoController,
    }
};
//# sourceMappingURL=supportedServices.js.map