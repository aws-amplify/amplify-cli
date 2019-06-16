const path = require('path');
const inquirer = require('inquirer');
const minimatch = require('minimatch');
const fs = require('fs-extra');

const PublishIgnoreFileName = 'amplifyPublishIgnore.json';

async function configure(context) {
  const publishIgnoreFilePath = getPublishIgnoreFilePath(context);
  let publishIgnore = [];

  if (fs.existsSync(publishIgnoreFilePath)) {
    try {
      publishIgnore = require(publishIgnoreFilePath);
    } catch (e) {
      publishIgnore = [];
    }
  }

  publishIgnore = publishIgnore
    .map(ignore => ignore.trim())
    .filter(ignore => ignore.length > 0)
    .filter(ignore => !/^#/.test(ignore));

  context.print.info('You can configure the publish command to ignore certain directories or files.');
  context.print.info('Use glob patterns as in the .gitignore file.');

  publishIgnore = await configurePublishIgnore(context, publishIgnore);

  const jsonString = JSON.stringify(publishIgnore, null, 4);
  fs.writeFileSync(publishIgnoreFilePath, jsonString, 'utf8');

  return publishIgnore;
}

function getPublishIgnoreFilePath(context) {
  const projectPath = context.amplify.pathManager.searchProjectRootPath();
  if (projectPath || fs.existsSync(projectPath)) {
    return path.join(projectPath, PublishIgnoreFileName);
  }
  throw new Error('You are not working inside a valid amplify project.\nUse \'amplify init\' in the root of your app directory to initialize your project with Amplify');
}


async function configurePublishIgnore(context, publishIgnore) {
  const DONE = 'exit';
  const configActions = ['list', 'add', 'remove', 'remove all', DONE];
  const answer = await inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'Please select the configuration action on the publish ignore.',
    choices: configActions,
    default: configActions[0],
  });

  switch (answer.action) {
    case 'list':
      listPublishIgnore(context, publishIgnore);
      break;
    case 'add':
      publishIgnore = await addIgnore(context, publishIgnore);
      break;
    case 'remove':
      publishIgnore = await removeIgnore(context, publishIgnore);
      break;
    case 'remove all':
      publishIgnore = [];
      break;
    default:
      break;
  }

  if (answer.action !== DONE) {
    publishIgnore = await configurePublishIgnore(context, publishIgnore);
  }

  return publishIgnore;
}


function listPublishIgnore(context, publishIgnore) {
  context.print.info('');
  publishIgnore.forEach((element) => {
    context.print.info(element);
  });
  context.print.info('');
}

async function addIgnore(context, publishIgnore) {
  const answer = await inquirer.prompt({
    name: 'patternToAdd',
    type: 'input',
    message: 'Ignore pattern to add: ',
  });
  if (answer.patternToAdd) {
    const pattern = answer.patternToAdd.trim();
    if (pattern.length > 0) {
      if (!publishIgnore.includes(pattern)) {
        publishIgnore.push(pattern);
      } else {
        context.print.warning(`${pattern} duplicates an existing ignore pattern.`);
      }
    }
  }
  return publishIgnore;
}

async function removeIgnore(context, publishIgnore) {
  const CANCEL = '# cancel remove #';
  if (!publishIgnore || publishIgnore.length === 0) {
    context.print.error('Publish ignore list is empty, nothing to remove.');
    publishIgnore = [];
  } else {
    const answer = await inquirer.prompt({
      name: 'patternToRemove',
      type: 'list',
      choices: [...publishIgnore, CANCEL],
    });
    if (answer.patternToRemove && answer.patternToRemove !== CANCEL) {
      publishIgnore = publishIgnore.filter(ignore => answer.patternToRemove !== ignore);
    }
  }
  return publishIgnore;
}

function getIgnore(context) {
  let publishIgnore;
  const publishIgnoreFilePath = getPublishIgnoreFilePath(context);
  if (fs.existsSync(publishIgnoreFilePath)) {
    try {
      publishIgnore = context.amplify.readJsonFile(publishIgnoreFilePath);
    } catch (e) {
      publishIgnore = [];
    }
  } else {
    publishIgnore = [];
  }
  return publishIgnore;
}

function isIgnored(filePath, publishIgnore, ignoreRoot) {
  let result = false;
  if (publishIgnore && publishIgnore.length > 0) {
    for (let i = 0; i < publishIgnore.length; i++) {
      let pattern = publishIgnore[i];
      if (/^\/.*/.test(pattern)) {
        pattern = path.normalize(path.join(ignoreRoot, pattern));
      }
      if (minimatch(filePath, pattern, { matchBase: true })) {
        result = true;
        break;
      }
    }
  }
  return result;
}

module.exports = {
  configure,
  getIgnore,
  isIgnored,
};
