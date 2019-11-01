import { IAM, Fn, AppSync, Lambda } from 'cloudform-types';
import { ResourceConstants, PredictionsResourceIDs } from 'graphql-transformer-common';
import { iamActions, iamLambdaActions, getStorageARN } from './predictions_utils';
import { HttpConfig, LambdaConfig } from 'cloudform-types/types/appSync/dataSource';
import {
  obj, str, print, int,
  ref, iff, compoundExpression,
  ifElse, raw, set, forEach,
  ObjectNode, CompoundExpressionNode,
  printBlock, qref, toJson, comment
} from 'graphql-mapping-template';
import DataSource from 'cloudform-types/types/appSync/dataSource';

// tslint:disable: no-magic-numbers
export interface PredictionsDSConfig {
  id: string;
  httpConfig?: HttpConfig;
  lambdaConfig?: LambdaConfig;
}

export class ResourceFactory {
  public createIAMRole(actions: string[], bucketName: string) {
    // const policyActions = new Set<any>();
    const policyActions: string[] = [];
    let needsLambda: boolean = false;
    actions.forEach( (action) => {
      if(iamActions[action]) {
        if (!needsLambda && action in iamLambdaActions) {
          needsLambda = true;
        }
        policyActions.push(iamActions[action]);
      }
    });
    const iamRole = new IAM.Role({
      RoleName: this.joinWithEnv('-',[
        PredictionsResourceIDs.getIAMRole(),
        Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      ]),
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'appsync.amazonaws.com'
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        new IAM.Role.Policy({
          PolicyName: 'PredictionsAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Action: policyActions,
              Effect: 'Allow',
              Resource: '*' // no specific resources for predictions
            }]
          }
        }),
        new IAM.Role.Policy({
          PolicyName: 'PredictionsStorageAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Action: ['s3:GetObject','s3:PutObject'],
              Effect: 'Allow',
              Resource: getStorageARN(bucketName)
            }]
          }
        }),
        ...( needsLambda ? [new IAM.Role.Policy({
          PolicyName: 'PredictionsLambdaAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Action: ['lambda:InvokeFunction'],
              Effect: 'Allow',
              Resource: Fn.GetAtt(PredictionsResourceIDs.getLambdaID(), 'Arn'),
            }]
          }
        })] : [])
      ],
    });
    if (needsLambda) {
      iamRole.dependsOn(PredictionsResourceIDs.getLambdaIAMRole());
    }
    return iamRole;
  }

  public createLambdaIAMRole(bucketName: string = '') {
    return new IAM.Role({
      RoleName: this.joinWithEnv('-',[
        PredictionsResourceIDs.getLambdaIAMRole(),
        Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      ]),
      AssumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com'
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      Policies: [
        new IAM.Role.Policy({
          PolicyName: 'StorageAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Action: ['s3:PutObject', 's3:GetObject'],
              Effect: 'Allow',
              Resource: getStorageARN(bucketName)
            }]
          }
        }),
        new IAM.Role.Policy({
          PolicyName: 'PollyAccess',
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Action: ['polly:SynthesizeSpeech'],
              Effect: 'Allow',
              Resource: '*'
            }]
          }
        })
      ]
    });
  }

  public createPredictionsDataSource(config: PredictionsDSConfig): DataSource {
    let dataSource: DataSource;
    if (config.httpConfig) {
      dataSource = new AppSync.DataSource({
        ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
        Name: config.id,
        Type: 'HTTP',
        ServiceRoleArn: Fn.GetAtt(PredictionsResourceIDs.getIAMRole(), 'Arn'),
        HttpConfig: config.httpConfig,
      }).dependsOn(PredictionsResourceIDs.getIAMRole()); 
    }
    if (config.lambdaConfig) {
      dataSource = new AppSync.DataSource({
        ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
        Name: config.id,
        Type: 'AWS_LAMBDA',
        ServiceRoleArn: Fn.GetAtt(PredictionsResourceIDs.getIAMRole(), 'Arn'),
        LambdaConfig: config.lambdaConfig,
      }).dependsOn([PredictionsResourceIDs.getIAMRole(), PredictionsResourceIDs.getLambdaID()]);
    }
    return dataSource;
  }

  public getPredictionsDSConfig(action: string): PredictionsDSConfig {
    switch (action) {
      case 'identifyEntities':
      case 'identifyText':
      case 'identifyLabels':
        return {
          id: 'RekognitionDataSource', 
          httpConfig: {
            Endpoint: Fn.Sub('https://rekognition.${AWS::Region}.amazonaws.com', {}),
            AuthorizationConfig: {
              AuthorizationType: 'AWS_IAM',
              AwsIamConfig: {
                SigningRegion: Fn.Sub('${AWS::Region}', {}),
                SigningServiceName: 'rekognition',
              }
            }
        }};
      case 'translateText':
        return {
          id: 'TranslateDataSource',
          httpConfig: {
            Endpoint: Fn.Sub('https://translate.${AWS::Region}.amazonaws.com', {}),
            AuthorizationConfig: {
              AuthorizationType: 'AWS_IAM',
              AwsIamConfig: {
                SigningRegion: Fn.Sub('${AWS::Region}', {}),
                SigningServiceName: 'translate',
              }
            }
          }
        };
      case 'convertTextToSpeech':
        return {
          id: 'LambdaDataSource',
          lambdaConfig: {
            LambdaFunctionArn: Fn.GetAtt(PredictionsResourceIDs.getLambdaID(), 'Arn'),
          },
        };
      default:
        break;
    }
  }

  private joinWithEnv(separator: string, listToJoin: any[]) {
    return Fn.If(
      ResourceConstants.CONDITIONS.HasEnvironmentParameter,
      Fn.Join(separator, [...listToJoin, Fn.Ref(ResourceConstants.PARAMETERS.Env)]),
      Fn.Join(separator, listToJoin),
    );
  }

  public createResolver(type: string, field: string, pipelineFunctions: any[]) {
    return new AppSync.Resolver({
      ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
      TypeName: type,
      FieldName: field,
      Kind: 'PIPELINE',
      PipelineConfig: {
        Functions: pipelineFunctions
      },
      RequestMappingTemplate: printBlock('Stash resolver specific context.')(
        compoundExpression([
          qref('$ctx.stash.put("isList", false)'),
          obj({})
        ])
      ),
      ResponseMappingTemplate: print(compoundExpression([
        comment('If the result is a list return the result as a list'),
        ifElse(
          ref('ctx.stash.get("isList")'),
          compoundExpression([
            set(ref('result'), ref('ctx.result.split("[ ,]+")')),
            toJson(ref('result'))
          ]),
          toJson(ref('ctx.result'))
        )
      ])),
    }).dependsOn(pipelineFunctions);
  }

  // predictions action functions
  public createActionFunction(action: string, storageName: string, datasourceName: string) {
    const actionFunctionResolvers = {
      identifyText: {
        request: obj({
          version: str('2018-05-29'),
          method: str('POST'),
          resourcePath:  str('/'),
          params: obj({
            body: obj({
              Image: obj({
                S3Object: obj({
                  Bucket: str(storageName),
                  Name: str('$ctx.args.input.identifyText.key'),
                })
              })
            }),
            headers: obj({
              'Content-Type': str('application/x-amz-json-1.1'),
              'X-Amz-Target': str('RekognitionService.DetectText')
            })
          })
        }),
        response: compoundExpression([
          iff(
            ref('ctx.error'),
            ref('$util.error($ctx.error.message)')
          ),
          ifElse(raw('$ctx.result.statusCode == 200'),
            compoundExpression([
              set(ref('results'), ref('util.parseJson($ctx.result.body)')),
              set(ref('finalResult'), str('')),
              forEach(
                /** for */ ref('item'), /** in */ ref('result.TextDetections'), [
                  iff( raw('$item.type == "LINE"'),
                    set(ref('finalResult'), str('$finalResult$item.DetectedText'))
                  )
              ]),
              ref('util.toJson($finalResult)')
            ]), 
            ref('utils.appendError($ctx.result.body)'))
        ])
      },
      identifyLabels: {
        request: compoundExpression([
          qref('$ctx.stash.put("isList", false)'),
          obj({
            version: str('2018-05-29'),
            method: str('POST'),
            resourcePath:  str('/'),
            params: obj({
              body: obj({
                Image: obj({
                  S3Object: obj({
                    Bucket: str(storageName),
                    Name: str('$ctx.args.input.identifyLabels.key'),
                  })
                }),
                MaxLabels: int(10),
                MinConfidence: int(55)
              }),
              headers: obj({
                'Content-Type': str('application/x-amz-json-1.1'),
                'X-Amz-Target': str('RekognitionService.DetectLabels')
              })
            })
          })
        ]),
        response: compoundExpression([
          iff(
            ref('ctx.error'),
            ref('util.error($ctx.error.message)')
          ),
          ifElse(
            raw('$ctx.result.statusCode == 200'),
            compoundExpression([
              set(ref('labels'), str('')),
              set(ref('result'), ref('util.parseJson($ctx.result.body)')),
              forEach(
                /** for */ ref('label'), /** in */ ref('result.Labels'),
                [ set(ref('labels'), str('$labels$label.Name, ')) ]
              ),
              toJson(ref('labels.replaceAll(", $", "")')) // trim unnessary space
            ]),
            ref('util.error($ctx.result.body)')
          )
        ])
      },
      translateText: {
        request: compoundExpression([
          set(ref('text'), ref('util.defaultIfNullOrEmpty($ctx.args.input.translateText.text, $ctx.prev.result)')),
          obj({
            version: str('2018-05-29'),
            method: str('POST'),
            resourcePath: str('/'),
            params: obj({
              body: obj({
                SourceLanguageCode: str('$ctx.args.input.translateText.sourceLanguage'),
                TargetLanguageCode: str('$ctx.args.input.translateText.targetLanguage'),
                Text: str('$text')
              }),
              headers: obj({
                "Content-Type": str('application/x-amz-json-1.1'),
                "X-Amz-Target": str('AWSShineFrontendService_20170701.TranslateText')
              })
            })
          })
        ]),
        response: compoundExpression([
          iff(
            ref('ctx.error'),
            ref('util.error($ctx.error.message)')),
          ifElse(
            raw('$ctx.result.statusCode == 200'),
            compoundExpression([
              set(ref('result'), ref('util.parseJson($ctx.result.body)')),
              ref('util.toJson($result.TranslatedText)')
            ]),
            ref('util.appendError($ctx.result.body, $ctx.result.statusCode)'))
        ])
      },
      convertTextToSpeech: {
        request: compoundExpression([
          qref('$ctx.stash.put("isList", false)'),
          set(ref('text'), ref('util.defaultIfNullOrEmpty($ctx.args.input.convertTextToSpeech.text, $ctx.prev.result)')),
          obj({
            version: str('2018-05-29'),
            operation: str('Invoke'),
            payload: toJson(obj({
              uuid: str('$util.autoId()'),
              action: str('convertTextToSpeech'),
              bucket: str(storageName),
              voiceID: str('$ctx.args.input.convertTextToSpeech.voiceID'),
              text: str('$text')
            })),
          })
        ]),
        response: compoundExpression([
          iff(
            ref('ctx.error'),
            ref('util.error($ctx.error.message, $ctx.error.type)')
          ),
          set(ref('response'), ref('util.parseJson($ctx.result)')),
          ref('util.toJson($ctx.result.url)')
        ])
      },
    };
    return this.genericFunction(action, datasourceName, PredictionsResourceIDs.getIAMRole(), actionFunctionResolvers[action]);
  }

  private genericFunction(
      action: string,
      datasourceName: string,
      iamRole: string,
      resolver: {
        request: ObjectNode | CompoundExpressionNode,
        response: ObjectNode | CompoundExpressionNode,
      }) {
    return new AppSync.FunctionConfiguration({
      ApiId: Fn.Ref(ResourceConstants.PARAMETERS.AppSyncApiId),
      Name: `${action}Function`,
      DataSourceName: datasourceName,
      FunctionVersion: '2018-05-29',
      RequestMappingTemplate: print(resolver.request),
      ResponseMappingTemplate: print(resolver.response)
    }).dependsOn([iamRole, datasourceName]);
  }

  // Predictions Lambda Functions
  public createPredictionsLambda() {
    return new Lambda.Function({
      Code: {
        S3Bucket: Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentBucket),
        S3Key: Fn.Join('/', [
          Fn.Ref(ResourceConstants.PARAMETERS.S3DeploymentRootKey),
          'functions',
          Fn.Join('.', [PredictionsResourceIDs.getLambdaID(), 'zip']),
        ]),
      },
      FunctionName: this.joinWithEnv('-', [
        PredictionsResourceIDs.getLambdaName(),
        Fn.GetAtt(ResourceConstants.RESOURCES.GraphQLAPILogicalID, 'ApiId'),
      ]),
      Handler: PredictionsResourceIDs.getLambdaHandlerName(),
      Role: Fn.GetAtt(PredictionsResourceIDs.getLambdaIAMRole(), 'Arn'),
      Runtime: PredictionsResourceIDs.getLambdaRuntime(),
    }).dependsOn([
      PredictionsResourceIDs.getLambdaIAMRole(),
    ]);
  }
}