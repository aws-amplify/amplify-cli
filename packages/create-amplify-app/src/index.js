const chalk = require('chalk');
const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const { spawnSync, spawn } = require('child_process');
const frameworkConfigMapping = require('./framework-config-mapping');
const args = require('yargs').argv;
const { addFileToXcodeProj } = require('../../amplify-cli/src/lib/xcodeHelpers');

function run() {
  return checkNodeVersion()
    .then(() => installAmplifyCLI())
    .then(() => createAmplifySkeletonProject())
    .then(frontend => createAmplifyHelperFiles(frontend))
    .then(() => require(`./scripts/amplify-modelgen`))
    .then(() => {
      console.log('Successfully setup the Amplify project');
      process.exit(0);
    })
    .catch(e => {
      console.log(e);
      process.exit(1);
    });
}

// Node version check
async function checkNodeVersion() {
  const currentNodeVersion = process.versions.node;
  const semver = currentNodeVersion.split('.');
  const major = semver[0];
  const minor = semver[1];

  if (major < 8 || (major === 8 && minor < 12)) {
    console.error(
      `You are running Node ${currentNodeVersion}.\n` +
        `Amplify CLI requires Node 8.12.0 or higher. \n` +
        `Please update your version of Node.`
    );
    process.exit(1);
  }
}

async function installAmplifyCLI() {
  const amplifyCLIVersionCheck = spawnSync('amplify', ['-v']);
  if (amplifyCLIVersionCheck.stderr !== null) {
    console.log('****Amplify CLI already globally installed****');
    console.log(`v${amplifyCLIVersionCheck.stdout.toString()}`);
  } else {
    // Install the CLI
    console.log('Amplify CLI not found. Installing Amplify CLI...');

    return new Promise((resolve, reject) => {
      const amplifyCLIInstall = spawn('npm', ['install', '-g', '@aws-amplify/cli'], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
      });

      amplifyCLIInstall.on('exit', code => {
        if (code === 0) {
          console.log(`Successfully installed Amplify CLI`);
          resolve();
        } else {
          reject();
        }
      });
    });
  }
}

/* Check if amplify directory is present
If not - then generate a skeleton with a base project */

async function createAmplifySkeletonProject() {
  if (!fs.existsSync('./amplify')) {
    console.log('Creating base Amplify project...');

    return new Promise((resolve, reject) => {
      const createSkeletonAmplifyProject = spawn('amplify-dev', ['init', '--quickstart'], {
        cwd: process.cwd(),
        env: process.env,
        stdio: 'inherit',
      });

      createSkeletonAmplifyProject.on('exit', code => {
        if (code === 0) {
          return getProjectConfig()
            .then(projectConfig => {
              const projectConfigFilePath = path.join('amplify', '.config', 'project-config.json');
              fs.writeFileSync(projectConfigFilePath, JSON.stringify(projectConfig, null, 4));
              console.log('Successfully created Amplify Project');
              resolve(projectConfig.frontend);
            })
            .catch(e => {
              reject(e);
            });
        }
        console.log(`Failed to create Amplify Project`);
        reject();
      });
    });
  }
  console.log('Amplify project already initialized. Not generating skeleton project.');
}

async function getProjectConfig() {
  const projectName = path.basename(process.cwd());
  let projectConfig = {};

  const { suitableFrontend, jsFrameWork } = await guessPlatform();

  const projectConfigTemplateFilePath = path.join(__dirname, 'project-configs', `project-config-${suitableFrontend}.json`);
  projectConfig = JSON.parse(fs.readFileSync(projectConfigTemplateFilePath));
  projectConfig.projectName = projectName;

  if (suitableFrontend === 'javascript') {
    projectConfig.javascript.config = frameworkConfigMapping[jsFrameWork];
  }

  return projectConfig;
}

async function guessPlatform() {
  const frontendPlugins = {
    javascript: 'amplify-frontend-javascript',
    android: 'amplify-frontend-android',
    ios: 'amplify-frontend-ios',
  };

  let suitableFrontend;

  const validFrontends = Object.keys(frontendPlugins);

  if (args.platform) {
    if (!validFrontends.includes(args.platform)) {
      throw new Error('Invalid platform value passed. Valid values are javascript/ios/android');
    } else {
      suitableFrontend = args.platform;
    }
  } else {
    let fitToHandleScore = -1;

    Object.keys(frontendPlugins).forEach(key => {
      const { scanProject } = require(frontendPlugins[key]);
      const newScore = scanProject(process.cwd());
      if (newScore > fitToHandleScore) {
        fitToHandleScore = newScore;
        suitableFrontend = key;
      }
    });
  }

  let jsFrameWork = 'none';

  if (suitableFrontend === 'javascript') {
    const validJSFrameworks = Object.keys(frameworkConfigMapping);

    if (args.platform) {
      if (!validJSFrameworks.includes(args.framework)) {
        throw new Error('Invalid framework value passed. Valid values are  angular/ember/ionic/react/react-native/vue/none');
      } else {
        jsFrameWork = args.framework;
      }
    } else {
      jsFrameWork = guessFramework(process.cwd());

      if (jsFrameWork === 'none') {
        const platformComfirmation = {
          type: 'list',
          name: 'platform',
          message: 'What type of app are you building',
          choices: Object.keys(frontendPlugins),
        };

        const platformAnswer = await inquirer.prompt(platformComfirmation);
        suitableFrontend = platformAnswer.platform;

        if (suitableFrontend === 'javascript') {
          const frameworkComfirmation = {
            type: 'list',
            name: 'framework',
            message: 'What javascript framework are you using',
            choices: Object.keys(frameworkConfigMapping),
          };

          const frameworkAnswer = await inquirer.prompt(frameworkComfirmation);
          jsFrameWork = frameworkAnswer.framework;
        }
      }
    }
  }
  return { suitableFrontend, jsFrameWork };
}

function guessFramework(projectPath) {
  let frameWork = 'none';
  try {
    const packageJsonFilePath = path.join(projectPath, 'package.json');

    if (fs.existsSync(packageJsonFilePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath));
      if (packageJson && packageJson.dependencies) {
        if (packageJson.dependencies.react) {
          frameWork = 'react';
          if (packageJson.dependencies['react-native']) {
            frameWork = 'react-native';
          }
        } else if (packageJson.dependencies['@angular/core']) {
          frameWork = 'angular';
          if (packageJson.dependencies['ionic-angular']) {
            frameWork = 'ionic';
          }
        } else if (packageJson.dependencies.vue) {
          frameWork = 'vue';
        }
      }
    }
  } catch (e) {
    console.log(e.stack);
    frameWork = 'none';
  }
  return frameWork;
}

async function createJSHelperFiles() {
  /* Check for build configs  */
  let buildConfig = {
    profile: 'default',
    envName: 'amplify',
  };
  const buildConfigFilepath = `./amplify-build-config.json`;
  if (fs.existsSync(buildConfigFilepath)) {
    buildConfig = JSON.parse(fs.readFileSync(buildConfigFilepath));
  } else {
    fs.writeFileSync(buildConfigFilepath, JSON.stringify(buildConfig, null, 4));
  }

  /* Add run scripts to package.json */

  console.log('Adding npm run scripts to your package.json...');

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
  };

  Object.assign(packageJSON.scripts, runScripts);
  Object.assign(packageJSON.devDependencies, devDependencies);

  fs.writeFileSync(packageJSONFilepath, JSON.stringify(packageJSON, null, 4));

  return new Promise((resolve, reject) => {
    const npmInstall = spawn('npm', ['install'], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

    npmInstall.on('exit', code => {
      if (code === 0) {
        console.log(`Successfully installed dependencies`);
        resolve();
      } else {
        reject();
      }
    });
  });
}

async function createAndoidHelperFiles() {
  const configJsonData = '{"profile":"default", "envName":"amplify"}';
  const configJsonObj = JSON.parse(configJsonData);
  const configJsonStr = JSON.stringify(configJsonObj);
  const configDir = path.join(process.cwd(), './amplify-gradle-config.json');
  if (await !fs.existsSync(configDir)) {
    fs.writeFileSync(configDir, configJsonStr);
  }
}

async function createIosHelperFiles() {
  const configDir = path.join(process.cwd(), '/amplifyxc.config');
  const configStr = 'push=false\nprofile=default\nenvName=amplify';
  const awsConfigDir = path.join(process.cwd(), '/awsconfiguration.json');
  const amplifyConfigDir = path.join(process.cwd(), '/amplifyconfiguration.json');
  const configJsonData = '{}';
  const configJsonObj = JSON.parse(configJsonData);
  const configJsonStr = JSON.stringify(configJsonObj);

  // Write files if needed and them to xcode project if one exists
  if (await !fs.existsSync(configDir)) {
    await fs.writeFileSync(configDir, configStr);
  }
  await addFileToXcodeProj(configDir);
  if (await !fs.existsSync(awsConfigDir)) {
    await fs.writeFileSync(awsConfigDir, configJsonStr);
  }
  await addFileToXcodeProj(awsConfigDir);
  if (await !fs.existsSync(amplifyConfigDir)) {
    await fs.writeFileSync(amplifyConfigDir, configJsonStr);
  }
  await addFileToXcodeProj(amplifyConfigDir);
}

async function createAmplifyHelperFiles(frontend) {
  if (frontend === 'javascript') {
    await createJSHelperFiles();
  }

  if (frontend === 'android') {
    await createAndoidHelperFiles();
  }

  if (frontend === 'ios') {
    await createIosHelperFiles();
  }
}

module.exports = { run };
