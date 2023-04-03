"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.skipHooksFilePath = exports.defaultSupportedExt = exports.supportedEnvEvents = exports.supportedEvents = exports.hookFileSeparator = void 0;
exports.hookFileSeparator = '-';
exports.supportedEvents = {
    add: ['notifications', 'analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'predictions', 'storage', 'codegen', 'env'],
    update: ['notifications', 'analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'predictions', 'storage', 'env'],
    remove: ['notifications', 'analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'predictions', 'storage', 'env'],
    push: ['analytics', 'api', 'auth', 'function', 'hosting', 'interactions', 'storage'],
    pull: ['env'],
    publish: [],
    delete: [],
    checkout: ['env'],
    list: ['env'],
    get: ['env'],
    mock: ['api', 'storage', 'function'],
    build: ['function'],
    status: ['notifications'],
    import: ['auth', 'storage', 'env'],
    gqlcompile: ['api'],
    addgraphqldatasource: ['api'],
    statements: ['codegen'],
    types: ['codegen'],
};
exports.supportedEnvEvents = ['add', 'update', 'remove', 'pull', 'checkout', 'list', 'get', 'import'];
exports.defaultSupportedExt = { js: { runtime: 'node' }, sh: { runtime: 'bash' } };
exports.skipHooksFilePath = '/opt/amazon';
//# sourceMappingURL=hooksConstants.js.map