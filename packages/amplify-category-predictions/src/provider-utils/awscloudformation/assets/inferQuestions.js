/* eslint-disable no-multi-str */
/* eslint-disable object-shorthand */

import { alphanumeric } from '@aws-amplify/amplify-prompts';

const setup = {
  type() {
    return {
      type: 'list',
      name: 'inferType',
      message: 'What would you like to infer?',
      choices: [
        {
          name: 'Infer model',
          value: 'inferModel',
        },
      ],
    };
  },
  name(defaultName) {
    return {
      name: 'resourceName',
      message: 'Provide a friendly name for your resource',
      validate: alphanumeric(),
      default: defaultName,
    };
  },
};

export default {
  setup,
};
