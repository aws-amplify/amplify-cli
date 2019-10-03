/* eslint-disable object-shorthand */
/* eslint-disable no-multi-str */

// defaults for text, entity, and label categories


function identifyAccess(options) {
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
}

const setup = {
  type() {
    return [
      {
        type: 'list',
        name: 'identifyType',
        message: 'What would you like to identify?',
        choices: [
          {
            name: 'Identify Text',
            value: 'identifyText',
          },
          {
            name: 'Identify Entities',
            value: 'identifyEntities',
          },
          {
            name: 'Identify Labels',
            value: 'identifyLabels',
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


const identifyText = {
  questions(options) {
    return [
      {
        type: 'confirm',
        name: 'identifyDoc',
        message: 'Would you also like to identify documents?',
        default: (options.identifyDoc) ? options.identifyDoc : false,
      },
    ];
  },
  formatFlag(flag) {
    if (flag) return { format: 'ALL' };
    return { format: 'PLAIN' };
  },
  auth: identifyAccess,
};

const identifyEntities = {
  questions(options) {
    return [
      {
        type: 'list',
        name: 'setup',
        message: 'Would you like use the default configuration?',
        choices: [
          {
            name: 'Default Configuration',
            value: 'default',
          },
          {
            name: 'Advanced Configuration',
            value: 'advanced',
          },
        ],
      },
      {
        type: 'confirm',
        name: 'celebrityDetectionEnabled',
        message: 'Would you like to enable celebrity detection?',
        default: (options.celebrityDetectionEnabled) ? options.celebrityDetectionEnabled : true,
        when: answers => (answers.setup === 'advanced'),
      },
      {
        type: 'confirm',
        name: 'adminTask',
        message: 'Would you like to identify entities from a collection of images?',
        default: (options.adminTask) ? options.adminTask : false,
        when: answers => (answers.setup === 'advanced'),
      },
      {
        type: 'number',
        name: 'maxEntities',
        message: 'How many entities would you like to identify?',
        default: (options.maxEntities) ? options.maxEntities : 50,
        when: answers => (answers.setup === 'advanced' && answers.adminTask),
        validate: value => (value > 0 && value < 101) || 'Please enter a number between 1 and 100!',
      },
      {
        type: 'list',
        name: 'folderPolicies',
        message: 'Would you like to allow users to add images to this collection?',
        choices: [
          {
            name: 'Yes',
            value: 'app',
          },
          {
            name: 'No',
            value: 'admin',
          },
        ],
        when: answers => (answers.setup === 'advanced' && answers.adminTask),
        default: (options.folderPolicies) ? options.folderPolicies : 'app',
      },
    ];
  },
  auth: identifyAccess,
  defaults: {
    celebrityDetectionEnabled: true,
  },
};


const identifyLabels = {
  questions(options) {
    return [
      {
        type: 'list',
        name: 'setup',
        message: 'Would you like use the default configuration?',
        choices: [
          {
            name: 'Default Configuration',
            value: 'default',
          },
          {
            name: 'Advanced Configuration',
            value: 'advanced',
          },
        ],
      },
      {
        type: 'list',
        name: 'type',
        message: 'What kind of label detection?',
        choices: [
          {
            name: 'Only identify unsafe labels',
            value: 'UNSAFE',
          },
          {
            name: 'Identify labels',
            value: 'LABELS',
          },
          {
            name: 'Identify all kinds',
            value: 'ALL',
          },
        ],
        when: answers => (answers.setup === 'advanced'),
        default: [options.type ? options.type : 'LABELS'],
      },
    ];
  },
  auth: identifyAccess,
  defaults: {
    type: 'LABELS',
  },
};


const adminTask = [
  {
    type: 'list',
    name: 'adminTask',
    message: 'What kind of entity recognition are you building?',
    choices: [
      {
        name: 'A general entity recognition',
        value: false,
      },
      {
        name: 'Detecting entity from a specific set of folder',
        value: true,
      },
    ],
    default: 'general',
  },
  {
    type: 'list',
    name: 'folderPolicies',
    message: 'Who can have access to these images? ',
    choices: [
      {
        name: 'Admins (via the CLI)',
        value: 'admin',
      },
      {
        name: 'App users (via the client app)',
        value: 'app',
      },
    ],
    when: answers => (answers.adminTask),
    default: 'admin',
  },
];

const s3bucket = {
  key: 'bucketName',
  question: 'The CLI would be provisioning an S3 bucket to store these images please provide bucket name:',
  validation: {
    operator: 'regex',
    value: '^[a-z0-9-]+$',
    onErrorMsg: 'Bucket name can only use the following characters: a-z 0-9 -',
  },
  required: true,
};

export default {
  setup,
  identifyAccess,
  identifyText,
  identifyEntities,
  identifyLabels,
  adminTask,
  s3bucket,
};
