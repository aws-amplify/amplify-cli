import { GraphQLResolveInfo } from 'graphql';
import { AmplifyAppSyncSimulator } from '../..';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../type-definition';
import { AppSyncVTLRenderContext, VelocityTemplate } from '../../velocity';
import { JavaArray } from '../../velocity/value-mapper/array';
import { JavaMap } from '../../velocity/value-mapper/map';
import { mockInfo } from './util/general-utils.test';

describe('VelocityTemplate', () => {
  let content;
  let simulator;
  beforeAll(() => {
    content = `"$ctx.error.message, $ctx.error.type"`;
    simulator = new AmplifyAppSyncSimulator();
  });

  describe('constructor', () => {
    it('should handle bad template', () => {
      expect(
        () =>
          new VelocityTemplate(
            {
              path: 'INLINE_TEMPLATE',
              content: `{
          "version": "2017-02-28",
          "payload": {
            "identity": $util.toJson($$context.identity)
          }
        }`,
            },
            simulator,
          ),
      ).toThrowError(
        'Error:Parse error on INLINE_TEMPLATE:3: \n' +
          'Lexical error on line 4. Unrecognized text.\n' +
          '...tity": $util.toJson($$context.identity)\n' +
          '-----------------------^',
      );
    });
  });

  describe('#render', () => {
    describe('#render', () => {
      it('should handle unknow errors', () => {
        const template = new VelocityTemplate(
          {
            path: 'INLINE_TEMPLATE',
            content,
          },
          simulator,
        );
        const info = mockInfo;
        const result = template.render(
          {
            error: new Error('some unexpected error'),
            arguments: {},
            source: {},
          },
          {
            headers: { Key: 'value' },
            requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
          },
          info,
        );
        expect(result.errors).toEqual([]);
        expect(result.result).toEqual('some unexpected error, UnknownErrorType');
      });
    });

    describe('#render', () => {
      it('should handle with a not error in error', () => {
        const template = new VelocityTemplate(
          {
            path: 'INLINE_TEMPLATE',
            content,
          },
          simulator,
        );
        const info = mockInfo;
        const result = template.render(
          {
            error: 'my string as error',
            arguments: {},
            source: {},
          },
          {
            headers: { Key: 'value' },
            requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
          },
          info,
        );
        expect(result.errors).toEqual([]);
        expect(result.result).toEqual('Error: my string as error, UnknownErrorType');
      });
    });

    it('should handle string comparison', () => {
      const template = new VelocityTemplate(
        {
          path: 'INLINE_TEMPLATE',
          content: `
#if( $ctx.stash.get("current_user_id")!=$ctx.prev.result.current_user_id)
"not the same value"
#else
"the same value"
#end`,
        },
        simulator,
      );
      const info = mockInfo;
      const result = template.render(
        {
          arguments: {},
          source: {},
          stash: {
            current_user_id: 'someString',
          },
          prevResult: {
            current_user_id: 'someString',
          },
        },
        {
          headers: { Key: 'value' },
          requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        },
        info,
      );
      expect(result.errors).toEqual([]);
      expect(result.result).toEqual('the same value');
    });
  });

  describe('property keys set from a string in a template', () => {
    const renderTemplate = (content: string) => {
      const template = new VelocityTemplate({ path: 'INLINE_TEMPLATE', content: `"${content}"` }, simulator);
      const result = template.render(
        { arguments: {} } as AppSyncVTLRenderContext,
        { headers: {}, requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY },
        mockInfo,
      );
      return result.result;
    };

    it('treats a key from #set the same as the equivalent string key on read', () => {
      const viaVariable = renderTemplate('#set($m = {})#set($k = "constructor")[$!m[$k]]');
      const viaLiteral = renderTemplate('#set($m = {})[$!m["constructor"]]');
      expect(viaVariable).toEqual(viaLiteral);
      expect(viaVariable).toEqual('[]');
    });

    it('treats a key from #set the same as the equivalent string key on get()', () => {
      const viaVariable = renderTemplate('#set($m = {})#set($k = "constructor")[$!m.get($k)]');
      const viaLiteral = renderTemplate('#set($m = {})[$!m.get("constructor")]');
      expect(viaVariable).toEqual(viaLiteral);
    });

    it('treats a key from #set the same as the equivalent string key on write', () => {
      const viaVariable = renderTemplate('#set($m = {})#set($k = "__proto__")#set($m[$k] = [1])[$!m.size()]');
      const viaLiteral = renderTemplate('#set($m = {})#set($m["__proto__"] = [1])[$!m.size()]');
      expect(viaVariable).toEqual(viaLiteral);
    });

    it('treats a key from #set the same as the equivalent string key on put', () => {
      const viaVariable = renderTemplate('#set($m = {})#set($k = "__proto__")$!m.put($k, [1])[$!m.size()]');
      const viaLiteral = renderTemplate('#set($m = {})$!m.put("__proto__", [1])[$!m.size()]');
      expect(viaVariable).toEqual(viaLiteral);
    });

    it('still reads and writes with normal string keys', () => {
      expect(renderTemplate('#set($m = {})#set($k = "a")#set($m[$k] = "v")$m[$k]')).toEqual('v');
    });
  });

  describe('buildRenderContext', () => {
    it('should generate a context ', () => {
      const template = new VelocityTemplate(
        {
          path: 'INLINE_TEMPLATE',
          content: '$util.toJson("hello world")',
        },
        simulator,
      );
      const info = {
        fieldName: 'someField',
        fieldNodes: [
          {
            kind: 'Field',
            name: {
              kind: 'Name',
              value: 'someField',
            },
          },
        ],
        parentType: 'Query',
      } as unknown;
      const buildRenderContext = jest.spyOn(template as any, 'buildRenderContext');
      const values = {
        array: ['some', 'values'],
        mapObject: { some: 'value' },
      };
      template.render(
        {
          arguments: values,
          source: values,
          stash: values,
          result: values,
        },
        {
          headers: { Key: 'value' },
          requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
        },
        info as GraphQLResolveInfo,
      );

      expect(buildRenderContext).toHaveBeenCalled();
      const ctx = buildRenderContext.mock.results[0].value.ctx;
      expect(ctx.args.array).toBeInstanceOf(JavaArray);
      expect(ctx.args.mapObject).toBeInstanceOf(JavaMap);
      expect(ctx.source.array).toBeInstanceOf(JavaArray);
      expect(ctx.source.mapObject).toBeInstanceOf(JavaMap);
      expect(ctx.stash.array).toBeInstanceOf(JavaArray);
      expect(ctx.stash.mapObject).toBeInstanceOf(JavaMap);
      expect(ctx.info.selectionSetList).toBeInstanceOf(JavaArray);
    });
  });
});
