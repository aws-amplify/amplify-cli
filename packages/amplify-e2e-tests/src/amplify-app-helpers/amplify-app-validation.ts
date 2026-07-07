import * as fs from 'fs-extra';
import * as path from 'path';
import { AmplifyFrontend, pathManager } from '@aws-amplify/amplify-cli-core';

const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';

function validateProject(projRoot: string, platform: AmplifyFrontend) {
  expect(fs.existsSync(path.join(projRoot, 'amplify'))).toBe(true);
  expect(fs.existsSync(path.join(projRoot, '.gitignore'))).toBe(true);
  switch (platform) {
    case AmplifyFrontend.android:
      expect(fs.existsSync(path.join(projRoot, 'amplify-gradle-config.json'))).toBe(true);
      expect(fs.existsSync(path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'awsconfiguration.json'))).toBe(true);
      expect(fs.existsSync(path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json'))).toBe(true);
      break;
    case AmplifyFrontend.ios:
      expect(fs.existsSync(path.join(projRoot, 'amplifyconfiguration.json'))).toBe(true);
      expect(fs.existsSync(path.join(projRoot, 'awsconfiguration.json'))).toBe(true);
      break;
    case AmplifyFrontend.javascript:
      expect(fs.existsSync(path.join(projRoot, 'amplify-build-config.json'))).toBe(true);
      expect(fs.existsSync(path.join(projRoot, 'package.json'))).toBe(true);
      break;
    default:
      expect(false).toBe(true);
  }
}

function validateProjectConfig(projRoot: string, platform: AmplifyFrontend, framework?: string) {
  const configPath = path.join(projRoot, 'amplify', '.config', 'project-config.json');
  expect(fs.existsSync(configPath)).toBe(true);
  const configFile = fs.readFileSync(configPath);
  const config = JSON.parse(configFile.toString());
  switch (platform) {
    case AmplifyFrontend.android:
      expect(config['frontend']).toBe('android');
      expect(config['android']['config']['ResDir']).toBe(path.join('app', 'src', 'main', 'res'));
      break;
    case AmplifyFrontend.ios:
      expect(config['frontend']).toBe('ios');
      break;
    case AmplifyFrontend.javascript:
      expect(config['frontend']).toBe('javascript');
      switch (framework) {
        case 'angular':
          expect(config['javascript']['framework']).toBe('angular');
          expect(config['javascript']['config']['StartCommand']).toBe('ng serve');
          break;
        case 'react':
          expect(config['javascript']['framework']).toBe('react');
          expect(config['javascript']['config']['StartCommand']).toBe(`${npm} run-script start`);
          break;
        default:
          expect(false).toBe(true);
      }
      break;
    case AmplifyFrontend.flutter:
      expect(config['frontend']).toBe('flutter');
      break;
  }
}

function validateApi(projRoot: string) {
  const apiPath = path.join(projRoot, 'amplify', 'backend', 'api', 'amplifyDatasource');
  expect(fs.existsSync(path.join(apiPath, 'schema.graphql'))).toBe(true);
  expect(fs.existsSync(path.join(apiPath, 'transform.conf.json'))).toBe(true);
  const transformConfFile = fs.readFileSync(path.join(apiPath, 'transform.conf.json'));
  const transformConf = JSON.parse(transformConfFile.toString());
  expect(transformConf['ResolverConfig']['project']['ConflictHandler']).toBe('AUTOMERGE');
  expect(transformConf['ResolverConfig']['project']['ConflictDetection']).toBe('VERSION');
}

function validateBackendConfig(projRoot: string) {
  const backendConfigPath = path.join(projRoot, 'amplify', 'backend', 'backend-config.json');
  expect(fs.existsSync(backendConfigPath)).toBe(true);
  const backendConfigFile = fs.readFileSync(backendConfigPath);
  const backendConfig = JSON.parse(backendConfigFile.toString());
  expect(backendConfig['api']['amplifyDatasource']['service']).toBe('AppSync');
  expect(backendConfig['api']['amplifyDatasource']['output']['authConfig']['defaultAuthentication']['authenticationType']).toBe('API_KEY');
}

function validateModelgen(projRoot: string) {
  const modelsDir = path.join(projRoot, 'src', 'models');
  expect(fs.existsSync(modelsDir)).toBe(true);
  expect(fs.existsSync(path.join(modelsDir, 'index.js'))).toBe(true);
  expect(fs.existsSync(path.join(modelsDir, 'schema.js'))).toBe(true);
}

function validateAmplifyPush(projRoot: string) {
  expect(fs.existsSync(path.join(projRoot, 'src', 'aws-exports.js'))).toBe(true);
  expect(fs.existsSync(path.join(projRoot, 'amplify', 'team-provider-info.json'))).toBe(true);
  expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'amplify-meta.json'))).toBe(true);
}

function validateFeatureFlags(projRoot: string) {
  const testCLIJSONPath = pathManager.getCLIJSONFilePath(projRoot);
  expect(fs.existsSync(testCLIJSONPath)).toBe(true);
}

export {
  validateProject,
  validateProjectConfig,
  validateApi,
  validateBackendConfig,
  validateModelgen,
  validateAmplifyPush,
  validateFeatureFlags,
};
