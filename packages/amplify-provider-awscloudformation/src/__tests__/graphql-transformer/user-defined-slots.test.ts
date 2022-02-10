import { SLOT_NAMES, parseUserDefinedSlots } from '../../graphql-transformer';

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
            requestResolver: {
              fileName: 'Query.listTodos.auth.2.req.vtl',
              template: 'template 1',
            },
            resolverTypeName: 'Query',
            resolverFieldName: 'listTodos',
            slotName: 'auth',
          },
        ],
        'Query.getTodo': [
          {
            requestResolver: {
              fileName: 'Query.getTodo.auth.2.req.vtl',
              template: 'template 2',
            },
            resolverTypeName: 'Query',
            resolverFieldName: 'getTodo',
            slotName: 'auth',
          },
          {
            requestResolver: {
              fileName: 'Query.getTodo.postAuth.2.req.vtl',
              template: 'template 3',
            },
            resolverTypeName: 'Query',
            resolverFieldName: 'getTodo',
            slotName: 'postAuth',
          },
        ],
        'Mutation.createTodo': [
          {
            requestResolver: {
              fileName: 'Mutation.createTodo.auth.2.req.vtl',
              template: 'template 4',
            },
            resolverTypeName: 'Mutation',
            resolverFieldName: 'createTodo',
            slotName: 'auth',
          },
        ],
      });
    });

    it('groups request and response resolvers in the same slot together', () => {
      const resolvers = {
        'Query.getTodo.auth.1.req.vtl': 'request resolver 1',
        'Query.getTodo.auth.1.res.vtl': 'response resolver 1',
        'Mutation.createTodo.postAuth.2.req.vtl': 'request resolver 2',
        'Mutation.createTodo.postAuth.2.res.vtl': 'response resolver 2',
      };

      expect(parseUserDefinedSlots(resolvers)).toEqual({
        'Query.getTodo': [
          {
            requestResolver: {
              fileName: 'Query.getTodo.auth.1.req.vtl',
              template: 'request resolver 1',
            },
            responseResolver: {
              fileName: 'Query.getTodo.auth.1.res.vtl',
              template: 'response resolver 1',
            },
            resolverTypeName: 'Query',
            resolverFieldName: 'getTodo',
            slotName: 'auth',
          },
        ],
        'Mutation.createTodo': [
          {
            requestResolver: {
              fileName: 'Mutation.createTodo.postAuth.2.req.vtl',
              template: 'request resolver 2',
            },
            responseResolver: {
              fileName: 'Mutation.createTodo.postAuth.2.res.vtl',
              template: 'response resolver 2',
            },
            resolverTypeName: 'Mutation',
            resolverFieldName: 'createTodo',
            slotName: 'postAuth',
          },
        ],
      });
    });

    it('orders multiple slot resolvers correctly', () => {
      const resolvers = {
        'Query.getTodo.auth.3.req.vtl': 'request resolver 3',
        'Query.getTodo.auth.3.res.vtl': 'response resolver 3',
        'Query.getTodo.auth.1.req.vtl': 'request resolver 1',
        'Query.getTodo.auth.1.res.vtl': 'response resolver 1',
        'Query.getTodo.auth.2.req.vtl': 'request resolver 2',
        'Query.getTodo.auth.2.res.vtl': 'response resolver 2',
      };

      const result = parseUserDefinedSlots(resolvers);
      expect(result).toEqual({
        'Query.getTodo': [
          {
            requestResolver: {
              fileName: 'Query.getTodo.auth.1.req.vtl',
              template: 'request resolver 1',
            },
            responseResolver: {
              fileName: 'Query.getTodo.auth.1.res.vtl',
              template: 'response resolver 1',
            },
            resolverTypeName: 'Query',
            resolverFieldName: 'getTodo',
            slotName: 'auth',
          },
          {
            requestResolver: {
              fileName: 'Query.getTodo.auth.2.req.vtl',
              template: 'request resolver 2',
            },
            responseResolver: {
              fileName: 'Query.getTodo.auth.2.res.vtl',
              template: 'response resolver 2',
            },
            resolverTypeName: 'Query',
            resolverFieldName: 'getTodo',
            slotName: 'auth',
          },
          {
            requestResolver: {
              fileName: 'Query.getTodo.auth.3.req.vtl',
              template: 'request resolver 3',
            },
            responseResolver: {
              fileName: 'Query.getTodo.auth.3.res.vtl',
              template: 'response resolver 3',
            },
            resolverTypeName: 'Query',
            resolverFieldName: 'getTodo',
            slotName: 'auth',
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
