const path = require('path');
const inquirer = require('inquirer');
const minimatch = require('minimatch');
const fs = require('fs-extra');

const PublishMetaFileName = 'amplifyPublishMeta.json';

async function configure(context) {
  const publishMetaFilePath = getPublishMetaFilePath(context);
  let publishMeta = [];

  if (fs.existsSync(publishMetaFilePath)) {
    try {
      publishMeta = require(publishMetaFilePath);
    } catch (e) {
      publishMeta = [];
    }
  }

  publishMeta = publishMeta
    .filter(meta => meta.pattern.length > 0)
    .filter(meta => meta.key.length > 0)
    .filter(meta => !/^#/.test(meta.pattern));

  context.print.info('You can configure the publish command to include metadata on certain directories or files.');
  context.print.info('Use glob patterns as in the .gitignore file.');

  publishMeta = await configurePublishMeta(context, publishMeta);

  const jsonString = JSON.stringify(publishMeta, null, 4);
  fs.writeFileSync(publishMetaFilePath, jsonString, 'utf8');

  return publishMeta;
}

function getPublishMetaFilePath(context) {
  const projectPath = context.amplify.pathManager.searchProjectRootPath();
  if (projectPath || fs.existsSync(projectPath)) {
    return path.join(projectPath, PublishMetaFileName);
  }
  const error = new Error(
    "You are not working inside a valid Amplify project.\nUse 'amplify init' in the root of your app directory to initialize your project, or 'amplify pull' to pull down an existing project.",
  );

  error.name = 'NotInitialized';
  error.stack = undefined;

  throw error;
}

async function configurePublishMeta(context, publishMeta) {
  const DONE = 'exit';
  const configActions = ['list', 'add', 'remove', 'remove all', DONE];
  const answer = await inquirer.prompt({
    name: 'action',
    type: 'list',
    message: 'Please select the configuration action on the publish metadata.',
    choices: configActions,
    default: configActions[0],
  });

  switch (answer.action) {
    case 'list':
      listPublishMeta(context, publishMeta);
      break;
    case 'add':
      publishMeta = await addMeta(context, publishMeta);
      break;
    case 'remove':
      publishMeta = await removeMeta(context, publishMeta);
      break;
    case 'remove all':
      publishMeta = [];
      break;
    default:
      break;
  }

  if (answer.action !== DONE) {
    publishMeta = await configurePublishMeta(context, publishMeta);
  }

  return publishMeta;
}

function listPublishMeta(context, publishMeta) {
  context.print.info('');
  publishMeta.forEach(element => {
    context.print.info(element);
  });
  context.print.info('');
}

async function addMeta(context, publishMeta) {
  const answerPattern = await inquirer.prompt({
    name: 'patternToAdd',
    type: 'input',
    message: 'Metadata pattern to add: ',
  });
  const answerKey = await inquirer.prompt({
    name: 'keyToAdd',
    type: 'input',
    message: 'Metadata key to add: ',
  });
  const answerValue = await inquirer.prompt({
    name: 'valueToAdd',
    type: 'input',
    message: 'Metadata value to add: ',
  });

  if (answerPattern.patternToAdd && answerKey.keyToAdd && answerValue.valueToAdd) {
    const pattern = answerPattern.patternToAdd.trim();
    const key = answerKey.keyToAdd.trim();
    const value = answerValue.valueToAdd.trim();

    if (pattern.length > 0 && key.length > 0 && value.length >= 0) {
      publishMeta.push({ pattern: pattern, key: key, value: value });
    }
  }
  return publishMeta;
}

async function removeMeta(context, publishMeta) {
  const CANCEL = '# cancel remove #';
  if (!publishMeta || publishMeta.length === 0) {
    context.print.error('Publish metadata list is empty, nothing to remove.');
    publishMeta = [];
  } else {
    const answer = await inquirer.prompt({
      name: 'patternToRemove',
      type: 'list',
      choices: [...publishMeta, CANCEL],
    });
    if (answer.patternToRemove && answer.patternToRemove !== CANCEL) {
      publishMeta = publishMeta.filter(meta => answer.patternToRemove !== meta.pattern);
    }
  }
  return publishMeta;
}

function getMeta(context) {
  let publishMeta;
  const publishMetaFilePath = getPublishMetaFilePath(context);
  if (fs.existsSync(publishMetaFilePath)) {
    try {
      publishMeta = context.amplify.readJsonFile(publishMetaFilePath);
    } catch (e) {
      publishMeta = [];
    }
  } else {
    publishMeta = [];
  }
  return publishMeta;
}

function getMetaKeyValue(filePath, publishMeta, metaRoot) {
  let result = [];
  if (publishMeta && publishMeta.length > 0) {
    for (let i = 0; i < publishMeta.length; i++) {
      let pattern = publishMeta[i].pattern;
      const key = publishMeta[i].key;
      const value = publishMeta[i].value;
      if (/^\/.*/.test(pattern)) {
        pattern = path.normalize(path.join(metaRoot, pattern));
      }
      if (minimatch(filePath, pattern, { matchBase: true })) {
        result.push({ key: key, value: value });
      }
    }
  }
  return result;
}

module.exports = {
  configure,
  getMeta,
  getMetaKeyValue,
};
