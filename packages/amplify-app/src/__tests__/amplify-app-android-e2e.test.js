const { amplifyAppAndroid } = require('../test-helpers/amplify-app-setup');
const { deleteAmplifyAppFiles } = require('../test-helpers/amplify-app-cleanup');
const fs = require('fs-extra');
const path = require('path');

jest.setTimeout(30000);
// move to androidTest dir to avoid conflicts
fs.mkdirSync('androidTest');
process.chdir('androidTest');

it('should set up a android project', async () => {
  await amplifyAppAndroid();
  expect(fs.existsSync(path.join('amplify'))).toBeTruthy();
  expect(fs.existsSync(path.join('amplify-gradle-config.json'))).toBeTruthy();
});

it('should have a valid android project config', async () => {
  const configPath = path.join('amplify', '.config', 'project-config.json');
  expect(fs.existsSync(configPath)).toBeTruthy();
  const configFile = fs.readFileSync(configPath);
  const config = JSON.parse(configFile);
  expect(config['frontend']).toBe('android');
  expect(config['android']['config']['ResDir']).toBe(path.join('app', 'src', 'main', 'res'));
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

it('remove amplify-app files and test folder after android test', async () => {
  deleteAmplifyAppFiles();
  process.chdir('..');
  fs.removeSync('androidTest');
});
