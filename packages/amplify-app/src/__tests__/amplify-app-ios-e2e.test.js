const { amplifyAppIos } = require('../test-helpers/amplify-app-setup');
const { deleteAmplifyAppFiles } = require('../test-helpers/amplify-app-cleanup');
const fs = require('fs-extra');
const path = require('path');

jest.setTimeout(30000);
// move to src dir to avoid conflicts
fs.mkdirSync('iosTest');
process.chdir('iosTest');

it('should set up a iOS project', async () => {
  await amplifyAppIos();
  expect(fs.existsSync(path.join('amplify'))).toBeTruthy();
  expect(fs.existsSync(path.join('amplifyxc.config'))).toBeTruthy();
  expect(fs.existsSync(path.join('amplifyconfiguration.json'))).toBeTruthy();
  expect(fs.existsSync(path.join('awsconfiguration.json'))).toBeTruthy();
});

it('should have a valid iOS project config', async () => {
  const configPath = path.join('amplify', '.config', 'project-config.json');
  expect(fs.existsSync(configPath)).toBeTruthy();
  const configFile = fs.readFileSync(configPath);
  const config = JSON.parse(configFile);
  expect(config['frontend']).toBe('ios');
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

it('remove amplify-app files and test folder after ios test', async () => {
  deleteAmplifyAppFiles();
  process.chdir('..');
  fs.removeSync('iosTest');
});
