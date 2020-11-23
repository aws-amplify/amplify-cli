const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const emoji = require('node-emoji');
const { spawnSync, spawn } = require('child_process');
const frameworkConfigMapping = require('./framework-config-mapping');
const { addAmplifyFiles } = require('./xcodeHelpers');
const ini = require('ini');
const semver = require('semver');
const stripAnsi = require('strip-ansi');
const { engines } = require('../package.json');

const npm = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
const amplify = /^win/.test(process.platform) ? 'amplify.cmd' : 'amplify';
const amplifyDev = /^win/.test(process.platform) ? 'amplify-dev.cmd' : 'amplify-dev';
const amplifyCliPackageName = '@aws-amplify/cli';

/**
 * `amplify-app` entry point
 *
 * @param {Object} opts command options
 * @param {string?} opts.path project path
 * @param {string?} opts.platform ios | android  | javascript
 * @param {boolean?} opts.skipEnvCheck if true, skip environment checks (NodeJs version, amplify-cli)
 * @param {string?} opts.jsFramework javascript framework
 *
 * @public
 * @returns {Promise<void>}
 */
function run(opts) {
  const projpath = opts.path;
  if (projpath) {
    process.chdir(projpath);
  }

  if (!opts.skipEnvCheck) {
    checkNodeVersion()
    amplifyCLIVersionCheck()
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
  }

  return createAmplifySkeletonProject(opts.platform, opts.jsFramework)
    .then(frontend => createAmplifyHelperFiles(frontend))
    .then(frontend => {
      console.log(`${emoji.get('white_check_mark')} Amplify setup completed successfully.`);
      showHelpText(frontend);
      process.exit(0);
    })
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
}

/**
 * Checks installed NodeJS version
 * @private
 */
function checkNodeVersion() {
  const currentNodeVersion = process.versions.node;
  const minNodeVersion = engines.node;
  if (!semver.satisfies(currentNodeVersion, minNodeVersion)) {
    const errorMsg = `You are running Node ${currentNodeVersion}.\n` +
    `Amplify CLI requires Node ${minNodeVersion}. \n` +
    `Please update your version of Node.`;
    console.error(errorMsg);
    process.exit(1);
  }
}

/**
 * Installs Amplify CLI using npm
 * @private
 * @returns {Promise<void>}
 */
async function installAmplifyCLI() {
  return new Promise((resolve, reject) => {
    const amplifyCLIInstall = spawn(npm, ['install', '-g', amplifyCliPackageName], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });

    amplifyCLIInstall.on('exit', code => {
      if (code === 0) {
        console.log(`${emoji.get('white_check_mark')} Successfully installed Amplify CLI.`);
        resolve();
      } else {
        console.log(`${emoji.get('x')} Failed to install Amplify CLI.`);
        reject();
      }
    });
  });
}

/**
 * Check the amplify CLI version, install latest CLI if it does not exist or is too old
 * @private
 * @returns {Promise<void>}
 */
async function amplifyCLIVersionCheck() {
  const amplifyCLIVersionSpawn = spawnSync(amplify, ['-v']);
  const minCLIVersion = engines['@aws-amplify/cli'];
  if (amplifyCLIVersionSpawn.stderr !== null) {
    const amplifyCLIVersion = semver.coerce(stripAnsi(amplifyCLIVersionSpawn.stdout.toString()));
    if (semver.satisfies(amplifyCLIVersion, minCLIVersion)) {
      console.log(`${emoji.get('white_check_mark')} Found Amplify CLI version ${amplifyCLIVersion}`);
    } else {
      console.log(
        `${emoji.get('worried')} Found Amplify CLI version ${amplifyCLIVersion}. The minimum required version is ${minCLIVersion}`,
      );
      console.log(`${emoji.get('sweat_smile')} Installing Amplify CLI. Hold tight.`);
      await installAmplifyCLI();
    }
  } else {
    console.log(`${emoji.get('worried')} Amplify CLI was not found.`);
    console.log(`${emoji.get('sweat_smile')} Installing Amplify CLI. Hold tight.`);
    await installAmplifyCLI();
  }
}

/**
 * Checks if amplify directory is present.
 * If not - then generate a skeleton with a base project
 * @private
 * @param {string} platform
 * @param {string} jsFramework
 * @returns {Promise<void>}
 */
async function createAmplifySkeletonProject(platform, jsFramework) {
  if (!fs.existsSync('./amplify')) {
    console.log(`${emoji.get('guitar')} Creating base Amplify project`);

    return new Promise((resolve, reject) => {
      const amplifyCmd = path.basename(process.argv[1]) === 'amplify-app-dev' ? amplifyDev : amplify;
      const createSkeletonAmplifyProject = spawn(amplifyCmd, ['init', '--quickstart'], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
      });

      createSkeletonAmplifyProject.on('exit', code => {
        if (code === 0) {
          return getProjectConfig(false, platform, jsFramework)
            .then(projectConfig => {
              const projectConfigFilePath = path.join('amplify', '.config', 'project-config.json');
              fs.writeFileSync(projectConfigFilePath, JSON.stringify(projectConfig, null, 4));
              console.log(`${emoji.get('white_check_mark')} Successfully created base Amplify Project`);
              resolve(projectConfig.frontend);
            })
            .catch(e => {
              reject(e);
            });
        }
        console.log(`${emoji.get('x')} Failed to create base Amplify Project`);
        reject();
      });
    });
  }
  if (platform !== 'ios') {
    console.log(
      `An Amplify project is already initialized in your current working directory ${emoji.get('smiley')}. Not generating base project.\n`,
    );
  }

  const existingApp = true;
  const projectConfig = await getProjectConfig(existingApp, platform, jsFramework);
  return projectConfig.frontend;
}

async function getProjectConfig(existingApp, argPlatform, argJsFramework) {
  if (existingApp === true) {
    const projectConfigFilePath = path.join('amplify', '.config', 'project-config.json');
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

    return projectConfig;
  }

  const projectName = path.basename(process.cwd());
  let projectConfig = {};

  const { suitableFrontend, jsFramework } = await guessPlatform(argPlatform, argJsFramework);

  const projectConfigTemplateFilePath = path.join(__dirname, 'project-configs', `project-config-${suitableFrontend}.json`);
  projectConfig = JSON.parse(fs.readFileSync(projectConfigTemplateFilePath));
  projectConfig.projectName = projectName;

  if (suitableFrontend === 'javascript') {
    projectConfig.javascript.framework = jsFramework;
    projectConfig.javascript.config = frameworkConfigMapping[jsFramework];
  }

  return projectConfig;
}

/**
 * Guesses platform and used JavaScript framework if no values
 * are provided
 * @param {string?} providedPlatform optional platform
 * @param {string?} providedJSFramework optional JavaScript framework
 */
async function guessPlatform(providedPlatform, providedJSFramework) {
  const frontendPlugins = {
    javascript: 'amplify-frontend-javascript',
    android: 'amplify-frontend-android',
    ios: 'amplify-frontend-ios',
    flutter: 'amplify-frontend-flutter',
  };

  let suitableFrontend;
  let resolvedJSFramework = 'none';

  const validFrontends = Object.keys(frontendPlugins);

  if (providedPlatform) {
    if (!validFrontends.includes(providedPlatform)) {
      throw new Error('Invalid platform value passed. Valid values are javascript/ios/android');
    } else {
      suitableFrontend = providedPlatform;
    }
  } else {
    let fitToHandleScore = -1;

    validFrontends.forEach(key => {
      const { scanProject } = require(frontendPlugins[key]);
      const newScore = scanProject(process.cwd());
      if (newScore > fitToHandleScore) {
        fitToHandleScore = newScore;
        suitableFrontend = key;
      }
    });
  }

  if (suitableFrontend === 'javascript') {
    const validJSFrameworks = Object.keys(frameworkConfigMapping);

    if (providedPlatform) {
      if (!validJSFrameworks.includes(providedJSFramework)) {
        throw new Error('Invalid framework value passed. Valid values are angular/ember/ionic/react/react-native/vue/none');
      } else {
        resolvedJSFramework = providedJSFramework;
      }
    } else {
      resolvedJSFramework = guessFramework(process.cwd());

      if (resolvedJSFramework === 'none') {
        const platformComfirmation = {
          type: 'list',
          name: 'platform',
          message: 'What type of app are you building',
          choices: validFrontends,
        };

        const { platform } = await inquirer.prompt(platformComfirmation);
        suitableFrontend = platform;

        if (suitableFrontend === 'javascript') {
          const frameworkComfirmation = {
            type: 'list',
            name: 'framework',
            message: 'What javascript framework are you using',
            choices: validJSFrameworks,
          };

          const { framework } = await inquirer.prompt(frameworkComfirmation);
          resolvedJSFramework = framework;
        }
      }
    }
  }

  if (suitableFrontend) {
    console.log(`$  Amplify project setup for ${suitableFrontend} platform`);
  }
  if (resolvedJSFramework) {
    console.log(`${emoji.get('white_check_mark')} Framework detected: ${resolvedJSFramework}`);
  }

  return { suitableFrontend, jsFramework: resolvedJSFramework };
}

function guessFramework(projectPath) {
  let framework = 'none';
  try {
    const packageJsonFilePath = path.join(projectPath, 'package.json');

    if (fs.existsSync(packageJsonFilePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath));
      if (packageJson && packageJson.dependencies) {
        if (packageJson.dependencies.react) {
          framework = 'react';
          if (packageJson.dependencies['react-native']) {
            framework = 'react-native';
          }
        } else if (packageJson.dependencies['@angular/core']) {
          framework = 'angular';
          if (packageJson.dependencies['ionic-angular']) {
            framework = 'ionic';
          }
        } else if (packageJson.dependencies.vue) {
          framework = 'vue';
        }
      }
    }
  } catch (e) {
    console.log(e.stack);
    framework = 'none';
  }
  return framework;
}

async function createJSHelperFiles() {
  /* Check for build configs  */
  const buildConfig = {
    profile: 'default',
    envName: 'amplify',
  };
  const buildConfigFilepath = `./amplify-build-config.json`;
  if (!fs.existsSync(buildConfigFilepath)) {
    fs.writeFileSync(buildConfigFilepath, JSON.stringify(buildConfig, null, 4));
  }

  /* Add run scripts to package.json */

  const sourceScriptDir = path.join(__dirname, 'scripts');
  const targetScriptDir = path.join('.', 'amplify', 'scripts');

  fs.ensureDirSync(targetScriptDir);
  fs.copySync(sourceScriptDir, targetScriptDir);

  const packageJSONFilepath = `./package.json`;
  let packageJSON;
  if (fs.existsSync(packageJSONFilepath)) {
    packageJSON = JSON.parse(fs.readFileSync(packageJSONFilepath));
  } else {
    packageJSON = {
      name: 'amplify-app',
      version: '1.0.0',
      description: 'amplify app skeleton',
      main: 'index.js',
      dependencies: {},
      devDependencies: {},
    };
  }

  if (!packageJSON.scripts) {
    packageJSON.scripts = {};
  }
  if (!packageJSON.devDependencies) {
    packageJSON.devDependencies = {};
  }

  const modelGenScriptPath = path.join('amplify', 'scripts', 'amplify-modelgen.js');
  const pushScript = path.join('amplify', 'scripts', 'amplify-push.js');

  const runScripts = {
    'amplify-modelgen': `node ${modelGenScriptPath}`,
    'amplify-push': `node ${pushScript}`,
  };

  const devDependencies = {
    ini: '^1.3.5',
    inquirer: '^6.5.1',
  };

  Object.assign(packageJSON.scripts, runScripts);
  Object.assign(packageJSON.devDependencies, devDependencies);

  fs.writeFileSync(packageJSONFilepath, JSON.stringify(packageJSON, null, 4));

  console.log(`${emoji.get('white_check_mark')} Successfully added helper npm run scripts to your package.json.`);

  return new Promise((resolve, reject) => {
    const npmInstall = spawn(npm, ['install', '--only=dev'], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

    npmInstall.on('exit', code => {
      if (code === 0) {
        console.log(`${emoji.get('white_check_mark')} Successfully installed dev dependencies`);
        resolve();
      } else {
        reject();
      }
    });
  });
}

async function createAndroidHelperFiles() {
  const configJsonObj = {
    profile: 'default',
    envName: 'amplify',
    syncEnabled: true,
  };
  const configJsonStr = JSON.stringify(configJsonObj, null, 4);
  const configFile = path.join(process.cwd(), 'amplify-gradle-config.json');
  const emptyJsonStr = JSON.stringify({});
  const rawPath = path.join(process.cwd(), 'app', 'src', 'main', 'res', 'raw');
  const awsConfigFile = path.join(rawPath, 'awsconfiguration.json');
  const amplifyConfigFile = path.join(rawPath, 'amplifyconfiguration.json');
  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, configJsonStr);
  }

  fs.ensureDirSync(rawPath);

  if (!fs.existsSync(awsConfigFile)) {
    fs.writeFileSync(awsConfigFile, emptyJsonStr);
  }
  if (!fs.existsSync(amplifyConfigFile)) {
    fs.writeFileSync(amplifyConfigFile, emptyJsonStr);
  }
}

async function createIosHelperFiles() {
  const configFile = './amplifytools.xcconfig';
  const awsConfigFile = './awsconfiguration.json';
  const amplifyConfigFile = './amplifyconfiguration.json';
  const amplifyDir = './amplify';
  const configJsonObj = {};
  const configJsonStr = JSON.stringify(configJsonObj);

  // Write files if needed and them to xcode project if one exists
  if (!fs.existsSync(configFile)) {
    const configxc = ini.parse('');
    configxc.push = false;
    configxc.modelgen = false;
    configxc.profile = 'default';
    configxc.envName = 'amplify';
    fs.writeFileSync(configFile, ini.stringify(configxc));
  }

  if (!fs.existsSync(awsConfigFile)) {
    fs.writeFileSync(awsConfigFile, configJsonStr);
  }

  if (!fs.existsSync(amplifyConfigFile)) {
    fs.writeFileSync(amplifyConfigFile, configJsonStr);
  }

  if (fs.existsSync(amplifyDir)) {
    await addAmplifyFiles();
  }
}

async function createAmplifyHelperFiles(frontend) {
  if (frontend === 'javascript') {
    await createJSHelperFiles();
  }

  if (frontend === 'android') {
    await createAndroidHelperFiles();
  }

  if (frontend === 'ios') {
    await createIosHelperFiles();
  }

  return frontend;
}

async function showHelpText(frontend) {
  if (frontend === 'javascript') {
    await showJSHelpText();
  }

  if (frontend === 'android') {
    await showAndroidHelpText();
  }
}

async function showJSHelpText() {
  console.log();
  console.log(chalk.green('Some next steps:'));
  console.log('"npm run amplify-modelgen" will allow you to generate models/entities for your GraphQL models');
  console.log('"npm run amplify-push" will build all your local backend resources and provision them in the cloud');
  console.log('');
}

async function showAndroidHelpText() {
  console.log();
  console.log(chalk.green('Some next steps:'));
  console.log(
    'Running the "modelgen" task provided in the amplifytools plugin will allow you to generate models/entities for your GraphQL models',
  );
  console.log(
    'Running the "amplifyPush" task provided in the amplifytools plugin will build all your local backend resources and provision them in the cloud',
  );
  console.log('');
}

module.exports = { run };
