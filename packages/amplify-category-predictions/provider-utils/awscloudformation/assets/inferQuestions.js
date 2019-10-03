/* eslint-disable no-multi-str */
/* eslint-disable object-shorthand */

const inferAccess = {
  prompt(options) {
    return [
      {
        type: 'list',
        name: 'access',
        message: 'Who should have access?',
        choices: [
          {
            name: 'Auth users only',
            value: 'auth',
          },
          {
            name: 'Auth and Guest users',
            value: 'authAndGuest',
          },
        ],
        default: (options.access) ? options.access : 'auth',
      },
    ];
  },
};

const setup = {
  type() {
    return [
      {
        type: 'list',
        name: 'inferType',
        message: 'What would you like to infer?',
        choices: [
          {
            name: 'Infer model',
            value: 'inferModel',
          },
        ],
      },
    ];
  },
  name(defaultName) {
    return [
      {
        name: 'resourceName',
        message: 'Provide a friendly name for your resource',
        validate: (value) => {
          const regex = new RegExp('^[a-zA-Z0-9]+$');
          return regex.test(value) ?
            true : 'Resource name should be alphanumeric!';
        },
        default: defaultName,
      },
    ];
  },
};

const inferModel = {
  endpointPrompt(options) {
    return [
      {
        type: 'list',
        name: 'endpointConfig',
        message: 'Would you like to create your endpoint or load an use an existing endpoint?',
        choices: [
          {
            name: 'Create an endpoint',
            value: 'create',
          },
          {
            name: 'Import an existing endpoint',
            value: 'import',
          },
        ],
        default: options.endpointConfig,
      },
    ];
  },
  importPrompt(options) {
    return [
      {
        type: 'list',
        name: 'endpoint',
        message: 'Select an endpoint: ',
        choices: options.endpoints,
        default: options.endpointName,
      },
    ];
  },
  authAccess: inferAccess,
};

export default {
  setup,
  inferModel,
};
