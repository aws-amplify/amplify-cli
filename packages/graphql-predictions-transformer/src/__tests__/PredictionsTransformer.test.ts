import { GraphQLTransform } from 'graphql-transformer-core';
import { PredictionsTransformer } from '../PredictionsTransformer';

// tslint:disable: no-magic-numbers
test('lambda function is added to pipeline when lambda dependent action is added', () => {
  const validSchema = `
    type Query {
      speakTranslatedText: String @predictions(actions: [ translateText convertTextToSpeech ])
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new PredictionsTransformer({ bucketName: "myStorage${hash}-${env}" })]
  });

  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  /**
   * AppSync DataSources x2
   *  - Translate
   *  - Lambda
   * AppSync Functions x2
   *  - translateTextFunction
   *  - convertTextToSpeechFunction
   * AppSync Query Resolver x1
   *  - QueryspeakTranslatedTextResolver
   * IAM Roles x2
   *  - predictions IAM Role
   *  - lambda IAM Role
   * Lambda Function x1
   *  - predictionsLambda
   * 
   * Total : 8
   */
  expect(Object.keys(out.stacks.PredictionsDirectiveStack.Resources).length).toEqual(8);


  // Schema Validation
  expect(out.schema).toMatchSnapshot();
  
  // Expect Schema for Query operation to return a string
  expect(out.schema).toContain('speakTranslatedText(input: SpeakTranslatedTextInput!): String');
  
  // IAM role
  const iamRoleResource = out.stacks.PredictionsDirectiveStack.Resources.predictionsIAMRole;
  expect(iamRoleResource).toBeDefined();
  expect(iamRoleResource.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toEqual('appsync.amazonaws.com');
  expect(iamRoleResource.Properties.AssumeRolePolicyDocument.Statement[0].Action).toEqual('sts:AssumeRole');
  iamRoleResource.Properties.Policies.forEach( (policy: any) => {
    expect(['translate:TranslateText', 'lambda:InvokeFunction', 's3:GetObject' ]).toContain(policy.PolicyDocument.Statement[0].Action[0]);
  });

  // Resolver
  const resolverResource = out.stacks.PredictionsDirectiveStack.Resources.QueryspeakTranslatedTextResolver;
  expect(resolverResource).toBeDefined();
  expect(resolverResource.Properties.FieldName).toEqual('speakTranslatedText');
  expect(resolverResource.Properties.TypeName).toEqual('Query');
  expect(resolverResource.Properties.Kind).toEqual('PIPELINE');
  expect(resolverResource.Properties.PipelineConfig.Functions.length).toEqual(2);
});


test('return type is a list based on the action', () => {
  const validSchema = `
    type Query {
      translateLabels: String @predictions(actions: [ identifyLabels translateText ])
    }
  `;
  const transformer = new GraphQLTransform({
    transformers: [new PredictionsTransformer({ bucketName: "myStorage${hash}-${env}" })]
  });
  const out = transformer.transform(validSchema);
  expect(out).toBeDefined();
  // match schema snapshot
  expect(out.schema).toMatchSnapshot();
  expect(Object.keys(out.stacks.PredictionsDirectiveStack.Resources).length).toEqual(6);

  // Expect Schema for Query operation to return a string
  expect(out.schema).toContain('translateLabels(input: TranslateLabelsInput!): [String]');

  // IAM role
  const iamRoleResource = out.stacks.PredictionsDirectiveStack.Resources.predictionsIAMRole;
  expect(iamRoleResource).toBeDefined();
  expect(iamRoleResource.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toEqual('appsync.amazonaws.com');
  expect(iamRoleResource.Properties.AssumeRolePolicyDocument.Statement[0].Action).toEqual('sts:AssumeRole');
  iamRoleResource.Properties.Policies.forEach( (policy: any) => {
    expect(['translate:TranslateText', 'rekognition:DetectLabels', 's3:GetObject']).toContain(policy.PolicyDocument.Statement[0].Action[0]);
  });
});