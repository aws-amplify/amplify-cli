import { Compile, parse } from 'amplify-velocity-template';
import * as JSON5 from 'json5';
import { AmplifyAppSyncSimulator } from '..';
import { AmplifyAppSyncSimulatorAuthenticationType, AppSyncVTLTemplate } from '../type-definition';
import { create as createUtil } from './util';
import { map as convertToJavaTypes, map } from './value-mapper/mapper';

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
      const lineDetails = `${e.hash.line}:${e.hash.loc.first_column}`;
      const fileName = template.path ? `${template.path}:${lineDetails}` : lineDetails;
      const templateError = new VelocityTemplateParseError(
        `Error:Parse error on ${fileName} \n${e.message}`
      );
      templateError.stack = e.stack;
      throw templateError;
    }
  }
  render(
    ctxValues: AppSyncVTLRenderContext,
    requestContext: AppSyncSimulatorRequestContext,
    info?: any
  ): any {
    const context = this.buildRenderContext(ctxValues, requestContext, info);
    try {
      const templateResult = this.compiler.render(context);
      const stash = context.ctx.stash.toJSON();
      let result;

      try {
        result = JSON5.parse(templateResult);
      } catch (e) {
        result = templateResult;
      }
      return { result, stash, errors: context.util.errors };
    } catch (e) {
      throw e;
    }
  }

  private buildRenderContext(
    ctxValues: AppSyncVTLRenderContext,
    requestContext: any,
    info: any
  ): any {
    const { source, arguments: argument, result, stash, prevResult } = ctxValues;

    const {
      jwt: { iss: issuer, sub, 'cognito:username': cognitoUserName, username },
      request,
    } = requestContext;

    const util = createUtil();
    const args = convertToJavaTypes(argument);
    // Identity is null for API Key
    let identity = null;
    if (
      requestContext.requestAuthorizationMode ===
      AmplifyAppSyncSimulatorAuthenticationType.OPENID_CONNECT
    ) {
      identity = convertToJavaTypes({
        sub,
        issuer,
        claims: requestContext.jwt,
      });
    } else if (
      requestContext.requestAuthorizationMode ===
      AmplifyAppSyncSimulatorAuthenticationType.AMAZON_COGNITO_USER_POOLS
    ) {
      identity = convertToJavaTypes({
        sub,
        issuer,
        'cognito:username': cognitoUserName,
        username: username || cognitoUserName,
        sourceIp: this.getRemoteIpAddress(requestContext.request),
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
      request: request ? { headers: request.headers } : {},
      identity,
      stash: convertToJavaTypes(stash || {}),
      source: convertToJavaTypes(source),
      result: convertToJavaTypes(result || {}),
    };

    if (prevResult) {
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

  private getRemoteIpAddress(request) {
    if (request && request.connection && request.connection.remoteAddress) {
      if (request.connection.remoteAddress.startsWith('::ffff:')) {
        // IPv4 address in v6 format
        return [request.connection.remoteAddress.replace('::ffff:', '')];
      }
      return [request.connection.remoteAddress];
    }
    return ['0.0.0.0'];
  }
}
