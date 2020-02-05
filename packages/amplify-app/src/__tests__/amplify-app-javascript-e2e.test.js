const { amplifyAppAngular, amplifyAppReact, amplifyModelgen, amplifyPush } = require('../test-helpers/amplify-app-setup');
const { deleteAmplifyAppFiles, amplifyDelete } = require('../test-helpers/amplify-app-cleanup');
const fs = require('fs-extra');
const path = require('path');

jest.setTimeout(30000);
// move to javascriptTest dir to avoid conflicts
fs.mkdirSync('javascriptTest');
process.chdir('javascriptTest');

it('should set up a angular project', async () => {
  await amplifyAppAngular();
  expect(fs.existsSync(path.join('amplify'))).toBeTruthy();
  expect(fs.existsSync(path.join('amplify-build-config.json'))).toBeTruthy();
  expect(fs.existsSync(path.join('package.json'))).toBeTruthy();
});

it('should have a valid angular project config', async () => {
  const configPath = path.join('amplify', '.config', 'project-config.json');
  expect(fs.existsSync(configPath)).toBeTruthy();
  const configFile = fs.readFileSync(configPath);
  const config = JSON.parse(configFile);
  expect(config['frontend']).toBe('javascript');
  expect(config['javascript']['framework']).toBe('angular');
  expect(config['javascript']['config']['StartCommand']).toBe('ng serve');
});

it('remove amplify-app files after angular test', async () => {
  deleteAmplifyAppFiles();
});

it('should set up a react project', async () => {
  await amplifyAppReact();
  expect(fs.existsSync(path.join('amplify'))).toBeTruthy();
  expect(fs.existsSync(path.join('amplify-build-config.json'))).toBeTruthy();
  expect(fs.existsSync(path.join('package.json'))).toBeTruthy();
});

it('should have a valid react project config', async () => {
  const configPath = path.join('amplify', '.config', 'project-config.json');
  expect(fs.existsSync(configPath)).toBeTruthy();
  const configFile = fs.readFileSync(configPath);
  const config = JSON.parse(configFile);
  expect(config['frontend']).toBe('javascript');
  expect(config['javascript']['framework']).toBe('react');
  expect(config['javascript']['config']['StartCommand']).toBe('npm run-script start');
});

it('should have an api', async () => {
  const apiPath = path.join('amplify', 'backend', 'api', 'amplifyDatasource');
  expect(fs.existsSync(path.join(apiPath, 'schema.graphql'))).toBeTruthy();
  expect(fs.existsSync(path.join(apiPath, 'transform.conf.json'))).toBeTruthy();
  const transformConfFile = fs.readFileSync(path.join(apiPath, 'transform.conf.json'));
  const transformConf = JSON.parse(transformConfFile);
  expect(transformConf['ResolverConfig']['project']['ConflictHandler']).toBe('AUTOMERGE');
  expect(transformConf['ResolverConfig']['project']['ConflictDetection']).toBe('VERSION');
});

it('should have a backend-config', async () => {
  const backendConfigPath = path.join('amplify', 'backend', 'backend-config.json');
  expect(fs.existsSync(backendConfigPath)).toBeTruthy();
  const backendConfigFile = fs.readFileSync(backendConfigPath);
  const backendConfig = JSON.parse(backendConfigFile);
  expect(backendConfig['api']['amplifyDatasource']['service']).toBe('AppSync');
  expect(backendConfig['api']['amplifyDatasource']['output']['authConfig']['defaultAuthentication']['authenticationType']).toBe('API_KEY');
});

it('should run modelgen', async () => {
  await amplifyModelgen();
  expect(fs.existsSync(path.join('src', 'models'))).toBeTruthy();
  expect(fs.existsSync(path.join('src', 'models', 'index.js'))).toBeTruthy();
  expect(fs.existsSync(path.join('src', 'models', 'schema.js'))).toBeTruthy();
});

jest.setTimeout(600000);

it('should run amplify push', async () => {
  await amplifyPush();
  expect(fs.existsSync(path.join('src', 'aws-exports.js'))).toBeTruthy();
  expect(fs.existsSync(path.join('amplify', 'team-provider-info.json'))).toBeTruthy();
  expect(fs.existsSync(path.join('amplify', 'backend', 'amplify-meta.json'))).toBeTruthy();
});

it('remove amplify-app files and test folder after js test', async () => {
  await amplifyDelete();
  await deleteAmplifyAppFiles();
  process.chdir('..');
  fs.removeSync('javascriptTest');
});
