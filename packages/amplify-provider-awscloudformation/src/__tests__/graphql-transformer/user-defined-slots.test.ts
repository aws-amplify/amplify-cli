import { SLOT_NAMES, createUserDefinedSlot, parseUserDefinedSlots } from '../../graphql-transformer';

describe('user defined slots', () => {
  describe('const SLOT_NAMES', () => {
    it('has expected value', () => {
      expect(SLOT_NAMES).toEqual(
        new Set([
          'init',
          'preAuth',
          'auth',
          'postAuth',
          'preDataLoad',
          'preUpdate',
          'preSubscribe',
          'postDataLoad',
          'postUpdate',
          'finish',
        ]),
      );
    });
  });

  describe('createUserDefinedSlot', () => {
    it('creates the expected object shape', () => {
      const fileName = 'Query.listTodos.postAuth.1.req.vtl';
      const slicedName = ['Query', 'listTodos', 'postAuth', '2', 'req', 'vtl'];
      const template = '$util.unauthorized()';

      expect(createUserDefinedSlot(fileName, slicedName, template)).toEqual({
        fileName,
        resolverTypeName: slicedName[0],
        resolverFieldName: slicedName[1],
        slotName: slicedName[2],
        template,
      });
    });
  });

  describe('parseUserDefinedSlots', () => {
    it('creates the user defined slots map', () => {
      const resolvers = {
        'Query.listTodos.auth.2.req.vtl': 'template 1',
        'Query.getTodo.auth.2.req.vtl': 'template 2',
        'Query.getTodo.postAuth.2.req.vtl': 'template 3',
        'Mutation.createTodo.auth.2.req.vtl': 'template 4',
      };

      expect(parseUserDefinedSlots(resolvers)).toEqual({
        'Query.listTodos': [
          {
            fileName: 'Query.listTodos.auth.2.req.vtl',
            resolverTypeName: 'Query',
            resolverFieldName: 'listTodos',
            slotName: 'auth',
            template: 'template 1',
          },
        ],
        'Query.getTodo': [
          {
            fileName: 'Query.getTodo.auth.2.req.vtl',
            resolverTypeName: 'Query',
            resolverFieldName: 'getTodo',
            slotName: 'auth',
            template: 'template 2',
          },
          {
            fileName: 'Query.getTodo.postAuth.2.req.vtl',
            resolverTypeName: 'Query',
            resolverFieldName: 'getTodo',
            slotName: 'postAuth',
            template: 'template 3',
          },
        ],
        'Mutation.createTodo': [
          {
            fileName: 'Mutation.createTodo.auth.2.req.vtl',
            resolverTypeName: 'Mutation',
            resolverFieldName: 'createTodo',
            slotName: 'auth',
            template: 'template 4',
          },
        ],
      });
    });

    it('excludes invalid slot names', () => {
      const resolvers = {
        'Query.listTodos.beforeAuth.2.req.vtl': 'template 1',
        'Query.getTodo.beforeAuth.2.req.vtl': 'template 2',
        'Query.getTodo.afterAuth.2.req.vtl': 'template 3',
        'Mutation.createTodo.preCreate.2.req.vtl': 'template 4',
      };

      expect(parseUserDefinedSlots(resolvers)).toEqual({});
    });

    it('exclused README file', () => {
      const resolvers = {
        'README.md': 'read me',
      };

      expect(parseUserDefinedSlots(resolvers)).toEqual({});
    });
  });
});
