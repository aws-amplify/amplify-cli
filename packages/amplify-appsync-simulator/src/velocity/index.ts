import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncVTLTemplate } from '../type-definition';
import { Compile, parse } from 'amplify-velocity-template';
import { TemplateSentError, create as createUtil, ValidateError } from './util';
import { map as convertToJavaTypes, map } from './value-mapper/mapper';

import { AmplifyAppSyncSimulator } from '..';
import { AppSyncGraphQLExecutionContext } from '../utils/graphql-runner';
import { GraphQLResolveInfo } from 'graphql';
import { createInfo } from './util/info';

export type AppSyncSimulatorRequestContext = {
  jwt?: {
    iss?: string;
    sub?: string;
    'cognito:username'?: string;
  };
  request?: object;
};

export type AppSyncVTLRenderContext = {
  arguments: object;
  source: object;
  stash?: object;
  result?: any;
  prevResult?: any;
  error?: any;
};

class VelocityTemplateParseError extends Error {}

export class VelocityTemplate {
  private compiler: Compile;
  private template;
  constructor(template: AppSyncVTLTemplate, private simulatorContext: AmplifyAppSyncSimulator) {
    try {
      const ast = parse(template.content.toString());
      this.compiler = new Compile(ast, {
        valueMapper: map,
        escape: false,
      });
      this.template = template;
    } catch (e) {
      const lineDetails = `${e.hash.line}:${e.hash.loc?.first_column ? e.hash.loc.first_column : ''}`;
      const fileName = template.path ? `${template.path}:${lineDetails}` : lineDetails;
      const templateError = new VelocityTemplateParseError(`Error:Parse error on ${fileName} \n${e.message}`);
      templateError.stack = e.stack;
      throw templateError;
    }
  }
  render(
    ctxValues: AppSyncVTLRenderContext,
    requestContext: AppSyncGraphQLExecutionContext,
    info?: GraphQLResolveInfo,
  ): { result; stash; errors; isReturn: boolean; hadException: boolean } {
    const context = this.buildRenderContext(ctxValues, requestContext, info);
    let templateResult;
    try {
      templateResult = this.compiler.render(context);
    } catch (e) {
      const lastError = context.util.errors.length && context.util.errors[context.util.errors.length - 1];
      if (lastError && lastError instanceof ValidateError) {
        return {
          result: lastError.data,
          errors: [...context.util.errors],
          isReturn: true,
          stash: context.ctx.stash.toJSON(),
          hadException: true,
        };
      }
      return { result: null, errors: [...context.util.errors], isReturn: false, stash: context.ctx.stash.toJSON(), hadException: true };
    }
    const isReturn = this.compiler._state.return; // If the template has #return, then set the value
    const stash = context.ctx.stash.toJSON();
    try {
      const result = JSON.parse(templateResult);
      return { result, stash, errors: context.util.errors, isReturn, hadException: false };
    } catch (e) {
      if (isReturn) {
        // # when template has #return, if the value is non JSON, we pass that along
        return { result: templateResult, stash, errors: context.util.errors, isReturn, hadException: false };
      }
      const errorMessage = `Unable to convert ${templateResult} to class com.amazonaws.deepdish.transform.model.lambda.LambdaVersionedConfig.`;
      throw new TemplateSentError(errorMessage, 'MappingTemplate', null, null, info);
    }
  }

  private buildRenderContext(
    ctxValues: AppSyncVTLRenderContext,
    requestContext: AppSyncGraphQLExecutionContext,
    info: GraphQLResolveInfo,
  ): any {
    const { source, arguments: argument, result, stash, prevResult, error } = ctxValues;
    const { jwt } = requestContext;
    const { iss: issuer, sub, 'cognito:username': cognitoUserName, username } = jwt || {};

    const util = createUtil([], new Date(Date.now()), info);
    const args = convertToJavaTypes(argument);
    // Identity is null for API Key
    let identity = null;
    if (requestContext.requestAuthorizationMode === AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT) {
      identity = convertToJavaTypes({
        sub,
        issuer,
        claims: requestContext.jwt,
      });
    } else if (requestContext.requestAuthorizationMode === AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS) {
      identity = convertToJavaTypes({
        sub,
        issuer,
        'cognito:username': cognitoUserName,
        username: username || cognitoUserName,
        sourceIp: requestContext.sourceIp,
        claims: requestContext.jwt,
        ...(this.simulatorContext.appSyncConfig.defaultAuthenticationType.authenticationType ===
        AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS
          ? { defaultAuthStrategy: 'ALLOW' }
          : {}),
      });
    }

    const vtlContext = {
      arguments: args,
      args,
      info: convertToJavaTypes(createInfo(info)),
      request: { headers: requestContext.headers },
      identity,
      stash: convertToJavaTypes(stash || {}),
      source: convertToJavaTypes(source),
      result: convertToJavaTypes(result),
      // surfacing the errorType to ensure the type is included in $ctx.error
      // Mapping Template Errors: https://docs.aws.amazon.com/appsync/latest/devguide/troubleshooting-and-common-mistakes.html#mapping-template-errors
      error: error
        ? {
            ...error,
            type: error.type || error.extensions?.errorType || 'UnknownErrorType',
            message: error.message || `Error: ${error}`,
          }
        : error,
    };

    if (typeof prevResult !== 'undefined') {
      vtlContext['prev'] = convertToJavaTypes({
        result: prevResult,
      });
    }

    return {
      util,
      utils: util,
      context: vtlContext,
      ctx: vtlContext,
    };
  }
}
