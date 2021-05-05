import { DirectiveWrapper, MappingTemplate, TransformerContractError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import { TransformerContextProvider, TransformerSchemaVisitStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import * as cdk from '@aws-cdk/core';
import {
  DirectiveNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {
  HttpResourceIDs,
  isScalar,
  makeInputValueDefinition,
  makeNamedType,
  makeNonNullType,
  ModelResourceIDs,
  ResourceConstants,
  unwrapNonNull,
} from 'graphql-transformer-common';
import {
  and,
  comment,
  compoundExpression,
  ifElse,
  iff,
  obj,
  or,
  parens,
  printBlock,
  qref,
  raw,
  ref,
  set,
  str,
} from 'graphql-mapping-template';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type HttpHeader = {
  key: string;
  value: string;
};

type HttpDirectiveConfiguration = {
  headers: HttpHeader[] | undefined;
  method: HttpMethod;
  origin: string;
  path: string;
  queryAndBodyArgs: InputValueDefinitionNode[];
  resolverFieldName: string;
  resolverTypeName: string;
  supportsBody: boolean;
  url: string;
};

const SPLIT_URL_REGEX = /(http(s)?:\/\/|www\.)|(\/.*)/g;
const URL_REGEX = /(http(s)?:\/\/)|(\/.*)/g;
const VALID_PROTOCOLS_REGEX = /^http(s)?:\/\//;
const HTTP_DIRECTIVE_STACK = 'HttpDirectiveStack';
const RESOLVER_VERSION = '2018-05-29';
const directiveDefinition = /* GraphQL */ `
  directive @http(method: HttpMethod = GET, url: String!, headers: [HttpHeader] = []) on FIELD_DEFINITION
  enum HttpMethod {
    GET
    POST
    PUT
    DELETE
    PATCH
  }
  input HttpHeader {
    key: String
    value: String
  }
`;

export class HttpTransformer extends TransformerPluginBase {
  private directiveList: HttpDirectiveConfiguration[] = [];

  constructor() {
    super('amplify-http-transformer', directiveDefinition);
  }

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    context: TransformerSchemaVisitStepContextProvider,
  ): void => {
    const directiveWrapped = new DirectiveWrapper(directive);
    const args = directiveWrapped.getArguments({
      method: 'GET',
      path: '',
      origin: '',
      queryAndBodyArgs: definition.arguments,
      resolverTypeName: parent.name.value,
      resolverFieldName: definition.name.value,
      supportsBody: false,
    } as HttpDirectiveConfiguration);

    if (!VALID_PROTOCOLS_REGEX.test(args.url)) {
      throw new TransformerContractError(
        `@http directive at location ${directive?.loc?.start} requires a url parameter that begins with http:// or https://.`,
      );
    }

    args.origin = args.url.replace(URL_REGEX, '$1');
    args.path = args.url.split(SPLIT_URL_REGEX).slice(-2, -1)[0] ?? '/';
    args.supportsBody = args.method === 'POST' || args.method === 'PUT' || args.method === 'PATCH';

    if (!args.headers) {
      args.headers = [];
    } else if (!Array.isArray(args.headers)) {
      args.headers = [args.headers];
    }

    const newFieldArgsArray: InputValueDefinitionNode[] = [];
    let params = args.path.match(/:\w+/g);

    if (params) {
      params = params.map(p => p.replace(':', ''));

      // If there are URL parameters, remove them from the array used to
      // create the query and body types.
      args.queryAndBodyArgs = args.queryAndBodyArgs.filter(arg => {
        return isScalar(arg.type) && !(params as string[]).includes(arg.name.value);
      });

      // Replace each URL parameter with $ctx.args.params.parameter_name for
      // use in the resolver template.
      args.path = args.path.replace(/:\w+/g, (str: string) => {
        return `\$\{ctx.args.params.${str.replace(':', '')}\}`;
      });

      const urlParamInputObject = makeUrlParamInputObject(args, params);
      context.output.addInput(urlParamInputObject);
      newFieldArgsArray.push(makeHttpArgument('params', urlParamInputObject, true));
    }

    if (args.queryAndBodyArgs.length > 0) {
      // For GET requests, leave the nullability of the query parameters
      // unchanged. For PUT, POST, and PATCH, unwrap any non-nulls.
      const name = ModelResourceIDs.HttpQueryInputObjectName(parent.name.value, definition.name.value);
      const queryInputObject = makeHttpInputObject(name, args.queryAndBodyArgs, args.method !== 'GET');

      // If any of the arguments for the query are non-null, then make the
      // newly generated type wrapper non-null too (this only really applies
      // to GET requests).
      const makeNonNull = queryInputObject.fields!.filter(a => a.type.kind === Kind.NON_NULL_TYPE).length > 0;

      context.output.addInput(queryInputObject);
      newFieldArgsArray.push(makeHttpArgument('query', queryInputObject, makeNonNull));

      if (args.supportsBody) {
        const name = ModelResourceIDs.HttpBodyInputObjectName(parent.name.value, definition.name.value);
        const bodyInputObject = makeHttpInputObject(name, args.queryAndBodyArgs, true);

        context.output.addInput(bodyInputObject);
        newFieldArgsArray.push(makeHttpArgument('body', bodyInputObject, makeNonNull));
      }
    }

    // Update the field if necessary with the new arguments.
    if (newFieldArgsArray.length > 0) {
      const updatedField = {
        ...definition,
        arguments: newFieldArgsArray,
      };

      const mostRecentParent = context.output.getType(parent.name.value) as ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
      let updatedFieldsInParent = mostRecentParent.fields!.filter(f => f.name.value !== definition.name.value);
      updatedFieldsInParent.push(updatedField);

      const updatedParentType = {
        ...mostRecentParent,
        fields: updatedFieldsInParent,
      };

      context.output.putType(updatedParentType);
    }

    this.directiveList.push(args);
  };

  generateResolvers = (context: TransformerContextProvider): void => {
    if (this.directiveList.length === 0) {
      return;
    }

    const stack: cdk.Stack = context.stackManager.createStack(HTTP_DIRECTIVE_STACK);
    const env = context.stackManager.getParameter(ResourceConstants.PARAMETERS.Env) as cdk.CfnParameter;

    stack.templateOptions.templateFormatVersion = '2010-09-09';
    stack.templateOptions.description = 'An auto-generated nested stack for the @http directive.';

    this.directiveList.forEach(directive => {
      // Create a new data source if necessary.
      const dataSourceId = HttpResourceIDs.HttpDataSourceID(directive.origin);

      if (context.api.getDataSource(dataSourceId) === undefined) {
        context.api.addHttpDataSource(dataSourceId, replaceEnv(env, directive.origin), {}, stack);
      }

      // Create the GraphQL resolver.
      createResolver(stack, dataSourceId, context, directive);
    });
  };
}

function createResolver(stack: cdk.Stack, dataSourceId: string, context: TransformerContextProvider, config: HttpDirectiveConfiguration) {
  const env = context.stackManager.getParameter(ResourceConstants.PARAMETERS.Env) as cdk.CfnParameter;
  const { method, supportsBody } = config;
  const reqCompoundExpr: any[] = [];
  const requestParams: any = { headers: ref('util.toJson($headers)') };
  const parsedHeaders = config.headers!.map(header => qref(`$headers.put("${header.key}", "${header.value}")`));

  if (method !== 'DELETE') {
    requestParams.query = ref('util.toJson($ctx.args.query)');
  }

  if (supportsBody) {
    const nonNullArgs = config.queryAndBodyArgs.filter(arg => arg.type.kind === Kind.NON_NULL_TYPE);

    requestParams.body = ref('util.toJson($ctx.args.body)');

    if (nonNullArgs.length > 0) {
      reqCompoundExpr.push(
        compoundExpression([
          comment('START: Manually checking that all non-null arguments are provided either in the query or the body'),
          iff(
            or(
              nonNullArgs.map(arg => {
                const name = arg.name.value;

                return parens(and([raw(`!$ctx.args.body.${name}`), raw(`!$ctx.args.query.${name}`)]));
              }),
            ),
            ref('util.error("An argument you marked as Non-Null is not present in the query nor the body of your request."))'),
          ),
          comment('END: Manually checking that all non-null arguments are provided either in the query or the body'),
        ]),
      );
    }
  }

  reqCompoundExpr.push(
    set(ref('headers'), ref('utils.http.copyHeaders($ctx.request.headers)')),
    qref('$headers.put("accept-encoding", "application/json")'),
  );

  if (supportsBody) {
    reqCompoundExpr.push(qref('$headers.put("Content-Type", "application/json")'));
  }

  reqCompoundExpr.push(
    ...parsedHeaders,
    obj({
      version: str(RESOLVER_VERSION),
      method: str(method),
      resourcePath: str(config.path),
      params: obj(requestParams),
    }),
  );

  const requestTemplateString = replaceEnv(env, printBlock('Create request')(compoundExpression(reqCompoundExpr)));
  const requestMappingTemplate = cdk.Token.isUnresolved(requestTemplateString)
    ? MappingTemplate.inlineTemplateFromString(requestTemplateString)
    : MappingTemplate.s3MappingTemplateFromString(requestTemplateString, `${config.resolverTypeName}.${config.resolverFieldName}.req.vtl`);

  return context.api.addResolver(
    config.resolverTypeName,
    config.resolverFieldName,
    requestMappingTemplate,
    MappingTemplate.s3MappingTemplateFromString(
      printBlock('Process response')(
        ifElse(
          supportsBody ? raw('$ctx.result.statusCode == 200 || $ctx.result.statusCode == 201') : raw('$ctx.result.statusCode == 200'),
          ifElse(
            ref('ctx.result.headers.get("Content-Type").toLowerCase().contains("xml")'),
            ref('utils.xml.toJsonString($ctx.result.body)'),
            ref('ctx.result.body'),
          ),
          ref('util.qr($util.appendError($ctx.result.body, $ctx.result.statusCode))'),
        ),
      ),
      `${config.resolverTypeName}.${config.resolverFieldName}.res.vtl`,
    ),
    dataSourceId,
    undefined,
    stack,
  );
}

function replaceEnv(env: cdk.CfnParameter, value: string): string {
  if (!value.includes('${env}')) {
    return value;
  }

  return cdk.Fn.sub(value, {
    env: (env as unknown) as string,
  });
}

function makeUrlParamInputObject(directive: HttpDirectiveConfiguration, urlParams: string[]): InputObjectTypeDefinitionNode {
  return {
    kind: 'InputObjectTypeDefinition',
    name: {
      kind: 'Name',
      value: ModelResourceIDs.UrlParamsInputObjectName(directive.resolverTypeName, directive.resolverFieldName),
    },
    fields: urlParams.map(param => {
      return makeInputValueDefinition(param, makeNonNullType(makeNamedType('String')));
    }),
    directives: [],
  };
}

function makeHttpArgument(name: string, inputType: InputObjectTypeDefinitionNode, makeNonNull: boolean): InputValueDefinitionNode {
  const type = makeNonNull ? makeNonNullType(makeNamedType(inputType.name.value)) : makeNamedType(inputType.name.value);
  return makeInputValueDefinition(name, type);
}

function makeHttpInputObject(name: string, argArray: InputValueDefinitionNode[], makeNonNull: boolean): InputObjectTypeDefinitionNode {
  // Unwrap all the non-nulls in the argument array if the flag is set.
  const fields: InputValueDefinitionNode[] = makeNonNull
    ? argArray.map((arg: InputValueDefinitionNode) => {
        return {
          ...arg,
          type: unwrapNonNull(arg.type),
        };
      })
    : argArray;
  return {
    kind: 'InputObjectTypeDefinition',
    name: {
      kind: 'Name',
      value: name,
    },
    fields,
    directives: [],
  };
}
