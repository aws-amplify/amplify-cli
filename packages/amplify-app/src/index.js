const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const emoji = require('node-emoji');
const { spawnSync, spawn } = require('child_process');
const frameworkConfigMapping = require('./framework-config-mapping');
const args = require('yargs').argv;

const amplifyCliPackageName = '@aws-amplify/cli@canary';

function run() {
  const projpath = args.path;

  if (projpath) {
    process.chdir(projpath);
  }

  return checkNodeVersion()
    .then(() => installAmplifyCLI())
    .then(() => createAmplifySkeletonProject())
    .then(frontend => createAmplifyHelperFiles(frontend))
    .then(frontend => {
      console.log(`${emoji.get('boom')} Amplify setup completed successfully.`);
      showHelpText(frontend);
      process.exit(0);
    })
    .catch(e => {
      if (e) {
        console.log(e);
      }
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
    console.log(`${emoji.get('white_check_mark')} Found Amplify CLI v${amplifyCLIVersionCheck.stdout.toString()}`);
  } else {
    // Install the CLI
    console.log(`${emoji.get('worried')} Amplify CLI not found on your system.`);
    console.log(`${emoji.get('sweat_smile')} Installing Amplify CLI. Hold tight.`);

    return new Promise((resolve, reject) => {
      const amplifyCLIInstall = spawn('npm', ['install', '-g', `${amplifyCliPackageName}`], {
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
}

/* Check if amplify directory is present
If not - then generate a skeleton with a base project */

async function createAmplifySkeletonProject() {
  if (!fs.existsSync('./amplify')) {
    console.log(`${emoji.get('guitar')} Creating base Amplify project`);

    return new Promise((resolve, reject) => {
      const createSkeletonAmplifyProject = spawn('amplify', ['init', '--quickstart'], {
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
              console.log(`${emoji.get('boom')} Successfully created base Amplify Project`);
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
  console.log(
    `An Amplify project is already initialized in your current working directory ${emoji.get('smiley')}. Not generating base project.`
  );
  console.log();
  const existingApp = true;
  const projectConfig = await getProjectConfig(existingApp);
  return projectConfig.frontend;
}

async function getProjectConfig(existingApp) {
  if (existingApp === true) {
    const projectConfigFilePath = path.join('amplify', '.config', 'project-config.json');
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

    return projectConfig;
  }

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

  if (suitableFrontend) {
    console.log(`$  Amplify project setup for ${suitableFrontend} platform`);
  }
  if (jsFrameWork) {
    console.log(`${emoji.get('white_check_mark')} Framework detected: ${jsFrameWork}`);
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
  };

  Object.assign(packageJSON.scripts, runScripts);
  Object.assign(packageJSON.devDependencies, devDependencies);

  fs.writeFileSync(packageJSONFilepath, JSON.stringify(packageJSON, null, 4));

  console.log(`${emoji.get('white_check_mark')} Successfully added helper npm run scripts to your package.json.`);

  return new Promise((resolve, reject) => {
    const npmInstall = spawn('npm', ['install', '--only=dev'], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

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

async function createAmplifyHelperFiles(frontend) {
  if (frontend === 'javascript') {
    await createJSHelperFiles();
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

  if (frontend === 'ios') {
    await showIOSHelpText();
  }
}

async function showJSHelpText() {
  console.log();
  console.log(chalk.green('Some next steps:'));
  console.log('"npm run amplify-modelgen" will allow you to generate models/entities for your GraphQL models');
  console.log('"npm run amplify-push" will build all your local backend resources and provision it in the cloud');
  console.log('');
}

async function showAndroidHelpText() {
  // TBD
}

async function showIOSHelpText() {
  // TBD
}

module.exports = { run };
