import { GraphQLResolveInfo } from 'graphql';
import { AmplifyAppSyncSimulator } from '../..';
import { AmplifyAppSyncSimulatorAuthenticationType } from '../../type-definition';
import { VelocityTemplate } from '../../velocity';
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
        expect(result.result).toEqual('some unexpected error, UnknowErrorType');
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
        expect(result.result).toEqual('Error: my string as error, UnknowErrorType');
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
});
