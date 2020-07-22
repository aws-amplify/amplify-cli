import * as fs from 'fs-extra';
import * as path from 'path';

function validateProject(projRoot: string, platform: string) {
  expect(fs.existsSync(path.join(projRoot, 'amplify'))).toBeTruthy();
  expect(fs.existsSync(path.join(projRoot, '.gitignore'))).toBeTruthy();
  switch (platform) {
    case 'android':
      expect(fs.existsSync(path.join(projRoot, 'amplify-gradle-config.json'))).toBeTruthy();
      expect(fs.existsSync(path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'awsconfiguration.json'))).toBeTruthy();
      expect(fs.existsSync(path.join(projRoot, 'app', 'src', 'main', 'res', 'raw', 'amplifyconfiguration.json'))).toBeTruthy();
      break;
    case 'ios':
      expect(fs.existsSync(path.join(projRoot, 'amplifytools.xcconfig'))).toBeTruthy();
      expect(fs.existsSync(path.join(projRoot, 'amplifyconfiguration.json'))).toBeTruthy();
      expect(fs.existsSync(path.join(projRoot, 'awsconfiguration.json'))).toBeTruthy();
      break;
    case 'javascript':
      expect(fs.existsSync(path.join(projRoot, 'amplify-build-config.json'))).toBeTruthy();
      expect(fs.existsSync(path.join(projRoot, 'package.json'))).toBeTruthy();
      break;
  }
}

function validateProjectConfig(projRoot: string, platform: string, framework?: string) {
  const configPath = path.join(projRoot, 'amplify', '.config', 'project-config.json');
  expect(fs.existsSync(configPath)).toBeTruthy();
  const configFile = fs.readFileSync(configPath);
  const config = JSON.parse(configFile.toString());
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

function validateApi(projRoot: string) {
  const apiPath = path.join(projRoot, 'amplify', 'backend', 'api', 'amplifyDatasource');
  expect(fs.existsSync(path.join(apiPath, 'schema.graphql'))).toBeTruthy();
  expect(fs.existsSync(path.join(apiPath, 'transform.conf.json'))).toBeTruthy();
  const transformConfFile = fs.readFileSync(path.join(apiPath, 'transform.conf.json'));
  const transformConf = JSON.parse(transformConfFile.toString());
  expect(transformConf['ResolverConfig']['project']['ConflictHandler']).toBe('AUTOMERGE');
  expect(transformConf['ResolverConfig']['project']['ConflictDetection']).toBe('VERSION');
}

function validateBackendConfig(projRoot: string) {
  const backendConfigPath = path.join(projRoot, 'amplify', 'backend', 'backend-config.json');
  expect(fs.existsSync(backendConfigPath)).toBeTruthy();
  const backendConfigFile = fs.readFileSync(backendConfigPath);
  const backendConfig = JSON.parse(backendConfigFile.toString());
  expect(backendConfig['api']['amplifyDatasource']['service']).toBe('AppSync');
  expect(backendConfig['api']['amplifyDatasource']['output']['authConfig']['defaultAuthentication']['authenticationType']).toBe('API_KEY');
}

function validateModelgen(projRoot: string) {
  const modelsDir = path.join(projRoot, 'src', 'models');
  expect(fs.existsSync(modelsDir)).toBeTruthy();
  expect(fs.existsSync(path.join(modelsDir, 'index.js'))).toBeTruthy();
  expect(fs.existsSync(path.join(modelsDir, 'schema.js'))).toBeTruthy();
}

function validateAmplifyPush(projRoot: string) {
  expect(fs.existsSync(path.join(projRoot, 'src', 'aws-exports.js'))).toBeTruthy();
  expect(fs.existsSync(path.join(projRoot, 'amplify', 'team-provider-info.json'))).toBeTruthy();
  expect(fs.existsSync(path.join(projRoot, 'amplify', 'backend', 'amplify-meta.json'))).toBeTruthy();
}

export { validateProject, validateProjectConfig, validateApi, validateBackendConfig, validateModelgen, validateAmplifyPush };
