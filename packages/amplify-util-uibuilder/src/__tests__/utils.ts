import type { GenericDataSchema } from '@aws-amplify/codegen-ui';

export const exampleSchema: GenericDataSchema = {
  dataSourceType: 'DataStore',
  models: {
    Author: {
      primaryKeys: ['id'],
      fields: {
        id: {
          dataType: 'ID',
          required: true,
          readOnly: false,
          isArray: false,
        },
        name: {
          dataType: 'String',
          required: false,
          readOnly: false,
          isArray: false,
        },
        profileImageSrc: {
          dataType: 'AWSURL',
          required: false,
          readOnly: false,
          isArray: false,
        },
        description: {
          dataType: 'String',
          required: false,
          readOnly: false,
          isArray: false,
        },
        books: {
          dataType: 'String',
          required: false,
          readOnly: false,
          isArray: true,
        },
        createdAt: {
          dataType: 'AWSDateTime',
          required: false,
          readOnly: true,
          isArray: false,
        },
        updatedAt: {
          dataType: 'AWSDateTime',
          required: false,
          readOnly: true,
          isArray: false,
        },
      },
    },
    JoinTable: {
      primaryKeys: ['id'],
      fields: {
        id: {
          dataType: 'ID',
          required: true,
          readOnly: false,
          isArray: false,
        },
      },
      isJoinTable: true
    },
    EmptyModel: {
      primaryKeys: ['id'],
      fields: {
      },
    },
  },
  enums: {}, // eslint-disable-line spellcheck/spell-checker
  nonModels: {},
};
