const fs = require('fs');
const path = require('path');
const os = require('os');
const ini = require('ini');
const { spawn } = require('child_process');
const inquirer = require('inquirer');

const amplify = process.env.AMPLIFY_PATH ? process.env.AMPLIFY_PATH : /^win/.test(process.platform) ? 'amplify.cmd' : 'amplify';
const dotAWSDirPath = path.normalize(path.join(os.homedir(), '.aws'));
const configFilePath = path.join(dotAWSDirPath, 'config');
run();

function getNamedProfiles() {
  let namedProfiles;
  if (fs.existsSync(configFilePath)) {
    const config = ini.parse(fs.readFileSync(configFilePath, 'utf-8'));
    namedProfiles = {};
    Object.keys(config).forEach((key) => {
      const profileName = key.replace('profile', '').trim();
      if (!namedProfiles[profileName]) {
        namedProfiles[profileName] = config[key];
      }
    });
  }
  return namedProfiles;
}

async function askForProfile(namedProfiles) {
  const profileQuestion = {
    type: 'list',
    name: 'profile',
    message: 'Choose the profile you would like to use',
    choices: Object.keys(namedProfiles),
  };
  const profileAnswer = await inquirer.prompt(profileQuestion);
  return profileAnswer.profile;
}

async function getValidProfile(profileToUse) {
  const namedProfiles = getNamedProfiles();
  if (namedProfiles && Object.keys(namedProfiles).length) {
    if (namedProfiles[profileToUse]) {
      return profileToUse;
    }
    const profileAnswer = await askForProfile(namedProfiles);
    return profileAnswer;
  }
  console.log(`Profiles not found. Please create one`);
  return undefined;
}

async function configureProfile() {
  const amplifyConfigure = spawn(amplify, ['configure'], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

  return new Promise((resolve, reject) => {
    amplifyConfigure.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
}

async function run() {
  /* Run amplify init + push or amplify push */

  let buildConfig;
  const buildConfigFilepath = `./amplify-build-config.json`;
  if (fs.existsSync(buildConfigFilepath)) {
    buildConfig = JSON.parse(fs.readFileSync(buildConfigFilepath));
  }

  let profileToUse = buildConfig.profile || 'default';

  // If accessKeyId and secretKey not provided in buildConfig, profile needs to exists
  if (!buildConfig.accessKeyId) {
    /* Check if profile exists - if not run `amplify configure` */
    let foundProfile;
    while (!foundProfile) {
      foundProfile = await getValidProfile(profileToUse);
      if (!foundProfile) {
        console.log('Attempting to configure the profile');
        await configureProfile();
      }
    }
    profileToUse = foundProfile;
  }

  const PROJECT_CONFIG = `{\
    "envName":"${buildConfig.envName || 'amplify'}"\
  }`;

  let PROVIDER_CONFIG;

  if (buildConfig.profile) {
    PROVIDER_CONFIG = `{\
      "awscloudformation": {\
        "configLevel":"project",\
        "useProfile":true,\
        "profileName":"${profileToUse}"\
      } \
    }`;
  } else if (buildConfig.accessKeyId && buildConfig.secretAccessKey && buildConfig.region) {
    PROVIDER_CONFIG = `{\
      "awscloudformation": {\
        "configLevel":"project",\
        "accessKeyId":"${buildConfig.accessKeyId}",\
        "secretAccessKey":"${buildConfig.secretAccessKey}",\
        "region":"${buildConfig.region}"\
      } \
    }`;
  } else {
    console.log('AWS Credentials not configured');
  }

  let cloudPush;

  if (!fs.existsSync(`./amplify/.config/local-env-info.json`)) {
    // init and then push

    cloudPush = spawn(amplify, ['init', '--amplify', PROJECT_CONFIG, '--providers', PROVIDER_CONFIG, '--yes'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit',
    });
  } else {
    // just push

    cloudPush = spawn(amplify, ['push', '--yes'], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });
  }

  cloudPush.on('exit', (code) => {
    if (code === 0) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}
