export const schema = {
  models: {
    Project: {
      name: 'Project',
      fields: {
        id: {
          name: 'id',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        title: {
          name: 'title',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        description: {
          name: 'description',
          isArray: false,
          type: 'String',
          isRequired: false,
          attributes: [],
        },
        status: {
          name: 'status',
          isArray: false,
          type: {
            enum: 'ProjectStatus',
          },
          isRequired: true,
          attributes: [],
        },
        deadline: {
          name: 'deadline',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
        },
        color: {
          name: 'color',
          isArray: false,
          type: 'String',
          isRequired: false,
          attributes: [],
        },
        todos: {
          name: 'todos',
          isArray: true,
          type: {
            model: 'Todo',
          },
          isRequired: false,
          attributes: [],
          isArrayNullable: true,
          association: {
            connectionType: 'HAS_MANY',
            associatedWith: ['projectTodosId'],
          },
        },
        createdAt: {
          name: 'createdAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
        updatedAt: {
          name: 'updatedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
      },
      syncable: true,
      pluralName: 'Projects',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
        {
          type: 'auth',
          properties: {
            rules: [
              {
                allow: 'public',
                operations: ['create', 'update', 'delete', 'read'],
              },
            ],
          },
        },
      ],
    },
    Todo: {
      name: 'Todo',
      fields: {
        id: {
          name: 'id',
          isArray: false,
          type: 'ID',
          isRequired: true,
          attributes: [],
        },
        name: {
          name: 'name',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        description: {
          name: 'description',
          isArray: false,
          type: 'String',
          isRequired: false,
          attributes: [],
        },
        images: {
          name: 'images',
          isArray: true,
          type: 'String',
          isRequired: false,
          attributes: [],
          isArrayNullable: true,
        },
        projectID: {
          name: 'projectID',
          isArray: false,
          type: 'ID',
          isRequired: false,
          attributes: [],
        },
        createdAt: {
          name: 'createdAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
        updatedAt: {
          name: 'updatedAt',
          isArray: false,
          type: 'AWSDateTime',
          isRequired: false,
          attributes: [],
          isReadOnly: true,
        },
        projectTodosId: {
          name: 'projectTodosId',
          isArray: false,
          type: 'ID',
          isRequired: false,
          attributes: [],
        },
      },
      syncable: true,
      pluralName: 'Todos',
      attributes: [
        {
          type: 'model',
          properties: {},
        },
        {
          type: 'key',
          properties: {
            name: 'gsi-Project.todos',
            fields: ['projectTodosId'],
          },
        },
        {
          type: 'auth',
          properties: {
            rules: [
              {
                allow: 'public',
                operations: ['create', 'update', 'delete', 'read'],
              },
            ],
          },
        },
      ],
    },
  },
  enums: {
    ProjectStatus: {
      name: 'ProjectStatus',
      values: ['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED'],
    },
  },
  nonModels: {
    QuoteResponse: {
      name: 'QuoteResponse',
      fields: {
        message: {
          name: 'message',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        quote: {
          name: 'quote',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        author: {
          name: 'author',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        timestamp: {
          name: 'timestamp',
          isArray: false,
          type: 'String',
          isRequired: true,
          attributes: [],
        },
        totalQuotes: {
          name: 'totalQuotes',
          isArray: false,
          type: 'Int',
          isRequired: true,
          attributes: [],
        },
      },
    },
  },
  codegenVersion: '3.4.4',
  version: 'd7e1f7f956f8328fc04346998e551e16',
};
