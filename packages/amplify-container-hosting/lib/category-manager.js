const fs = require('fs-extra');
const path = require('path');
const sequential = require('promise-sequential');
const constants = require('./constants');
const supportedServices = require('./supported-services');

const category = 'hosting';

function getAvailableServices(context) {
  const availableServices = [];
  const projectConfig = context.amplify.getProjectConfig();
  Object.keys(supportedServices).forEach(service => {
    if (projectConfig.providers.includes(supportedServices[service].provider)) {
      availableServices.push(service);
    }
  });
  return availableServices;
}

function getCategoryStatus(context) {
  const enabledServices = [];
  const disabledServices = [];

  const availableServices = getAvailableServices(context);
  if (availableServices.length > 0) {
    const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
    const categoryDirPath = path.join(projectBackendDirPath, constants.CategoryName);
    if (fs.existsSync(categoryDirPath)) {
      const serviceDirnames = fs.readdirSync(categoryDirPath);
      for (let i = 0; i < serviceDirnames.length; i++) {
        const serviceDirPath = path.join(categoryDirPath, serviceDirnames[i]);
        const stat = fs.lstatSync(serviceDirPath);
        if (stat.isDirectory()) {
          if (availableServices.includes(serviceDirnames[i])) {
            enabledServices.push(serviceDirnames[i]);
          }
        }
      }
    }
    availableServices.forEach(service => {
      if (!enabledServices.includes(service)) {
        disabledServices.push(service);
      }
    });
  }

  return {
    availableServices,
    enabledServices,
    disabledServices,
  };
}

function runServiceAction(context, service, action, args) {
  context.exeInfo = context.amplify.getProjectDetails();
  if (context.exeInfo.amplifyMeta) {
    context.exeInfo.categoryMeta = context.exeInfo.amplifyMeta[constants.CategoryName];
    if (context.exeInfo.categoryMeta) {
      context.exeInfo.serviceMeta = context.exeInfo.categoryMeta[service];
    }
  }
  const serviceModule = require(path.join(__dirname, `${service}/index.js`));
  return serviceModule[action](context, args);
}

async function migrate(context) {
  const migrationTasks = [];
  const { migrationInfo } = context;
  const categoryMeta = migrationInfo.amplifyMeta[constants.CategoryName];
  if (categoryMeta) {
    Object.keys(categoryMeta).forEach(service => {
      const serviceModule = require(path.join(__dirname, `${service}/index.js`));
      migrationTasks.push(() => serviceModule.migrate(context));
    });
  }
  await sequential(migrationTasks);
}

function getIAMPolicies(resourceName, crudOptions) {
  let policy = {};
  let actions = new Set();

  crudOptions.forEach(crudOption => {
    switch (crudOption) {
      case 'create':
        actions.add('s3:PutObject');
        break;
      case 'update':
        actions.add('s3:PutObject');
        break;
      case 'read':
        actions.add('s3:GetObject');
        actions.add('s3:ListBucket');
        break;
      case 'delete':
        actions.add('s3:DeleteObject');
        break;
      default:
        console.log(`${crudOption} not supported`);
    }
  });

  actions = Array.from(actions);
  policy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
        'Fn::Join': [
          '',
          [
            'arn:aws:s3:::',
            {
              Ref: `${category}${resourceName}HostingBucketName`,
            },
            '/*',
          ],
        ],
      },
    ],
  };

  const attributes = ['HostingBucketName'];

  return { policy, attributes };
}

module.exports = {
  getCategoryStatus,
  runServiceAction,
  migrate,
  getIAMPolicies,
};
