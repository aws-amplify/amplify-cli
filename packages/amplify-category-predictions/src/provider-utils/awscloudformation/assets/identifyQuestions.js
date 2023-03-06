/* eslint-disable object-shorthand */
/* eslint-disable no-multi-str */

function identifyAccess(options) {
  return {
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
    default: options.access ? options.access : 'auth',
  };
}

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
    when: (answers) => answers.adminTask,
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
  identifyAccess,
  adminTask,
  s3bucket,
};
