"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginPlatform = void 0;
const plugin_collection_1 = require("./plugin-collection");
const constants_1 = require("../constants");
const SECONDSINADAY = 86400;
class PluginPlatform {
    constructor() {
        this.pluginDirectories = [constants_1.constants.LOCAL_NODE_MODULES, constants_1.constants.PARENT_DIRECTORY, constants_1.constants.GLOBAL_NODE_MODULES];
        this.pluginPrefixes = [constants_1.constants.AMPLIFY_PREFIX];
        this.userAddedLocations = [];
        this.lastScanTime = new Date();
        this.maxScanIntervalInSeconds = SECONDSINADAY;
        this.plugins = new plugin_collection_1.PluginCollection();
        this.excluded = new plugin_collection_1.PluginCollection();
    }
}
exports.PluginPlatform = PluginPlatform;
//# sourceMappingURL=plugin-platform.js.map