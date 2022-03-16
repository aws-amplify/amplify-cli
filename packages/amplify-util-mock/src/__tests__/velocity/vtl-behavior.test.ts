import { AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncGraphQLExecutionContext } from 'amplify-appsync-simulator';
import { VelocityTemplateSimulator, AppSyncVTLContext } from '../../velocity';

describe('VTL behavior', () => {
  let vtlTemplate: VelocityTemplateSimulator;

  beforeEach(() => {
    const authConfig: AppSyncAuthConfiguration = {
      defaultAuthentication: {
        authenticationType: 'API_KEY',
      },
      additionalAuthenticationProviders: [],
    };
    vtlTemplate = new VelocityTemplateSimulator({ authConfig });
  });

  test('Integer.parseInt()', () => {
    const context: AppSyncVTLContext = { arguments: { input: { value: '42' } } };
    const request: AppSyncGraphQLExecutionContext = {
      requestAuthorizationMode: AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
      headers: {},
    };

    const template = `
      #set( $value = 1 )
      $util.toJson($value.parseInt($ctx.args.input.value))
    `;
    const output = vtlTemplate.render(template, { context, requestParameters: request });

    expect(output.result).toEqual(42);
    expect(output.errors).toEqual([]);
    expect(output.isReturn).toEqual(false);
    expect(output.hadException).toEqual(false);
  });
});
