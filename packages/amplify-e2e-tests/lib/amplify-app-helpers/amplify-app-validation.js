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
exports.validateFeatureFlags = exports.validateAmplifyPush = exports.validateModelgen = exports.validateBackendConfig = exports.validateApi = exports.validateProjectConfig = exports.validateProject = void 0;
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var amplify_cli_core_1 = require("amplify-cli-core");
function validateProject(projRoot, platform) {
    expect(fs.existsSync(path.join(projRoot, 'amplify'))).toBe(true);
    expect(fs.existsSync(path.join(projRoot, '.gitignore'))).toBe(true);
    switch (platform) {
        case 'android':
            expect(fs.existsSync(path.join(projRoot, 'amplify-gradle-config.json'))).toBe(true);
            expect(fs.existsSync(path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'awsconfiguration.json'))).toBe(true);
            expect(fs.existsSync(path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json'))).toBe(true);
            break;
        case 'ios':
            expect(fs.existsSync(path.join(projRoot, 'amplifyconfiguration.json'))).toBe(true);
            expect(fs.existsSync(path.join(projRoot, 'awsconfiguration.json'))).toBe(true);
            break;
        case 'javascript':
            expect(fs.existsSync(path.join(projRoot, 'amplify-build-config.json'))).toBe(true);
            expect(fs.existsSync(path.join(projRoot, 'package.json'))).toBe(true);
            break;
    }
}
exports.validateProject = validateProject;
function validateProjectConfig(projRoot, platform, framework) {
    var configPath = path.join(projRoot, 'amplify', '.config', 'project-config.json');
    expect(fs.existsSync(configPath)).toBe(true);
    var configFile = fs.readFileSync(configPath);
    var config = JSON.parse(configFile.toString());
    switch (platform) {
        case 'android':
            expect(config['frontend']).toBe('android');
            expect(config['android']['config']['ResDir']).toBe(path.join('app', 'src', 'main', 'res'));
            break;
        case 'ios':
            expect(config['frontend']).toBe('ios');
            break;
        case 'javascript':
            expect(config['frontend']).toBe('javascript');
            switch (framework) {
                case 'angular':
                    expect(config['javascript']['framework']).toBe('angular');
                    expect(config['javascript']['config']['StartCommand']).toBe('ng serve');
                    break;
                case 'react':
                    expect(config['javascript']['framework']).toBe('react');
                    expect(config['javascript']['config']['StartCommand']).toBe('npm run-script start');
                    break;
            }
            break;
    }
}
exports.validateProjectConfig = validateProjectConfig;
function validateApi(projRoot) {
    var apiPath = path.join(projRoot, 'amplify', 'backend', 'api', 'amplifyDatasource');
    expect(fs.existsSync(path.join(apiPath, 'schema.graphql'))).toBe(true);
    expect(fs.existsSync(path.join(apiPath, 'transform.conf.json'))).toBe(true);
    var transformConfFile = fs.readFileSync(path.join(apiPath, 'transform.conf.json'));
    var transformConf = JSON.parse(transformConfFile.toString());
    expect(transformConf['ResolverConfig']['project']['ConflictHandler']).toBe('AUTOMERGE');
    expect(transformConf['ResolverConfig']['project']['ConflictDetection']).toBe('VERSION');
}
exports.validateApi = validateApi;
function validateBackendConfig(projRoot) {
    var backendConfigPath = path.join(projRoot, 'amplify', 'backend', 'backend-config.json');
    expect(fs.existsSync(backendConfigPath)).toBe(true);
    var backendConfigFile = fs.readFileSync(backendConfigPath);
    var backendConfig = JSON.parse(backendConfigFile.toString());
    expect(backendConfig['api']['amplifyDatasource']['service']).toBe('AppSync');
    expect(backendConfig['api']['amplifyDatasource']['output']['authConfig']['defaultAuthentication']['authenticationType']).toBe('API_KEY');
}
exports.validateBackendConfig = validateBackendConfig;
function validateModelgen(projRoot) {
    var modelsDir = path.join(projRoot, 'src', 'models');
    expect(fs.existsSync(modelsDir)).toBe(true);
    expect(fs.existsSync(path.join(modelsDir, 'index.js'))).toBe(true);
    expect(fs.existsSync(path.join(modelsDir, 'schema.js'))).toBe(true);
}
exports.validateModelgen = validateModelgen;
function validateAmplifyPush(projRoot) {
    expect(fs.existsSync(path.join(projRoot, 'src', 'aws-exports.js'))).toBe(true);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'team-provider-info.json'))).toBe(true);
    expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'amplify-meta.json'))).toBe(true);
}
exports.validateAmplifyPush = validateAmplifyPush;
function validateFeatureFlags(projRoot) {
    var testCLIJSONPath = amplify_cli_core_1.pathManager.getCLIJSONFilePath(projRoot);
    expect(fs.existsSync(testCLIJSONPath)).toBe(true);
}
exports.validateFeatureFlags = validateFeatureFlags;
//# sourceMappingURL=amplify-app-validation.js.map