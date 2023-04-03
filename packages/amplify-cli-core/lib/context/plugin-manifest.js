"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginManifest = void 0;
class PluginManifest {
    constructor(name, type, displayName, aliases, commands, commandAliases, services, eventHandlers) {
        this.name = name;
        this.type = type;
        this.displayName = displayName;
        this.aliases = aliases;
        this.commands = commands;
        this.commandAliases = commandAliases;
        this.services = services;
        this.eventHandlers = eventHandlers;
    }
}
exports.PluginManifest = PluginManifest;
//# sourceMappingURL=plugin-manifest.js.map