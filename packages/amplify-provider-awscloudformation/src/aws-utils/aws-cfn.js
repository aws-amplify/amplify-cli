// disabling lint until this file is converted to TS
/* eslint-disable */
const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const BottleNeck = require('bottleneck');
const chalk = require('chalk');
const columnify = require('columnify');

const aws = require('./aws');
const { S3 } = require('./aws-s3');
const providerName = require('../constants').ProviderName;
const { formUserAgentParam } = require('./user-agent');
const configurationManager = require('../configuration-manager');
const { stateManager, pathManager, AmplifyError, AmplifyFault } = require('@aws-amplify/amplify-cli-core');
const { fileLogger } = require('../utils/aws-logger');
const logger = fileLogger('aws-cfn');
const { pagedAWSCall } = require('./paged-call');
const { initializeProgressBars } = require('./aws-cfn-progress-formatter');
const { getStatusToErrorMsg, collectStackErrorMessages } = require('./cloudformation-error-serializer');

const { printer } = require('@aws-amplify/amplify-prompts');
const { proxyAgent } = require('./aws-globals');

const CFN_MAX_CONCURRENT_REQUEST = 5;
const CFN_POLL_TIME = (process.env.IS_AMPLIFY_CI ? 30 : 5) * 1000; // 5 secs wait to check if  new stacks are created by root stack
const CFN_POLL_TIME_MAX = (process.env.IS_AMPLIFY_CI ? 120 : 30) * 1000; // 30 seconds
let CFNLOG = [];
const CFN_SUCCESS_STATUS = ['UPDATE_COMPLETE', 'CREATE_COMPLETE', 'DELETE_COMPLETE', 'DELETE_SKIPPED'];

const CNF_ERROR_STATUS = ['CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED'];

// These are cascade failures caused because of a root failure. Safe to ignore
const RESOURCE_CASCADE_FAIL_REASONS = ['Resource creation cancelled', 'Resource update cancelled'];

const STACK_RESOURCE_FILTER_FAIL_REASON = 'The following resource(s) failed';
class CloudFormation {
  constructor(context, userAgentAction, options = {}, eventMap = {}) {
    return (async () => {
      let userAgentParam;
      if (userAgentAction) {
        userAgentParam = formUserAgentParam(context, userAgentAction);
      }

      this.pollQueue = new BottleNeck({ minTime: 100, maxConcurrent: CFN_MAX_CONCURRENT_REQUEST });
      this.pollQueueStacks = [];
      this.stackEvents = [];
      let cred;
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // no credential. New project
      }
      const userAgentOption = {};
      if (userAgentAction) {
        userAgentOption.customUserAgent = userAgentParam;
      }

      this.cfn = new aws.CloudFormation({
        ...cred,
        ...options,
        ...userAgentOption,
        httpOptions: {
          agent: proxyAgent(),
        },
      });
      this.context = context;
      if (Object.keys(eventMap).length) {
        this.eventMap = eventMap;
        this.progressBar = initializeProgressBars(this.eventMap);
      }
      return this;
    })();
  }

  createResourceStack(cfnParentStackParams) {
    const cfnModel = this.cfn;
    const { context } = this;
    const cfnCompleteStatus = 'stackCreateComplete';
    const cfnStackCheckParams = {
      StackName: cfnParentStackParams.StackName,
    };
    const self = this;
    self.eventStartTime = new Date();

    return new Promise((resolve, reject) => {
      logger('cfnModel.createStack', [cfnParentStackParams])();
      cfnModel.createStack(cfnParentStackParams, (createErr) => {
        this.readStackEvents(cfnParentStackParams.StackName);
        logger('cfnModel.createStack', [cfnParentStackParams])(createErr);
        if (createErr) {
          context.print.error('\nAn error occurred when creating the CloudFormation stack');
          reject(createErr);
        }
        cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, async (completeErr, waitForStackdata) => {
          if (self.pollForEvents) {
            clearTimeout(self.pollForEvents);
          }

          this.progressBar?.stop();

          if (completeErr) {
            context.print.error('\nAn error occurred when creating the CloudFormation stack');
            const errorDetails = await this.collectStackErrors(cfnParentStackParams.StackName);
            logger('cfnModel.createStack', [cfnParentStackParams])(completeErr);
            const error = new AmplifyFault(
              'DeploymentFault',
              { message: 'Initialization of project failed', details: errorDetails },
              completeErr,
            );
            error.stack = null;
            reject(error);
          }
          resolve(waitForStackdata);
        });
      });
    });
  }

  /**
   * In the event of a cfn deployment failure, generate error messages from the cfn events
   * and write them on the console and return them for consumption by the caller.
   */
  collectStackErrors(stackName) {
    // add root stack to see the new stacks
    this.readStackEvents(stackName);
    // wait for the poll queue to drain
    return new Promise((resolve, reject) => {
      this.pollQueue.once('empty', () => {
        const failedStacks = this.stackEvents.filter((ev) => CNF_ERROR_STATUS.includes(ev.ResourceStatus));
        const customStackIds = this.getCustomStackIds(failedStacks);
        try {
          const trace = this.generateFailedStackErrorMsgs(failedStacks);
          printer.error('The following resources failed to deploy:');
          trace.forEach((t) => {
            console.log(t);
            console.log('\n');
          });
          resolve(collectStackErrorMessages(this.filterFailedStackEvents(failedStacks), customStackIds));
        } catch (e) {
          reject(e);
        } finally {
          if (this.pollForEvents) {
            clearTimeout(this.pollForEvents);
          }
        }
      });
    });
  }

  getCustomStackIds(eventsWithFailure) {
    return eventsWithFailure
      .filter((stack) => stack.ResourceType === 'AWS::CloudFormation::Stack')
      .filter(
        (stack) =>
          this.eventMap['rootResources'] &&
          this.eventMap['rootResources'].some(
            (resource) => resource.category.includes('custom-') && resource.key === stack.LogicalResourceId,
          ),
      )
      .map((stack) => stack.PhysicalResourceId);
  }

  /**
   * Generate user friendly error message from the failed stacks for printing it on the user console
   */
  generateFailedStackErrorMsgs(eventsWithFailure) {
    this.context.exeInfo.cloudformationEvents = CFNLOG;
    const stackTrees = this.filterFailedStackEvents(eventsWithFailure).map((event) => {
      const err = [];
      const resourceName = event.LogicalResourceId;
      const cfnURL = getCFNConsoleLink(event, this.cfn);
      err.push(`${chalk.red('Resource Name:')} ${resourceName} (${event.ResourceType})`);
      err.push(`${chalk.red('Event Type:')} ${getStatusToErrorMsg(event.ResourceStatus)}`);
      err.push(`${chalk.red('Reason:')} ${event.ResourceStatusReason}`);
      if (cfnURL) {
        err.push(`${chalk.red('URL:')} ${cfnURL}`);
      }
      return err.join('\n');
    });
    return stackTrees;
  }

  /**
   * Filter out all the failed stacks that don't have useful error messages such as parent stack's 'Resource creation cancelled'
   */
  filterFailedStackEvents(eventsWithFailure) {
    return eventsWithFailure
      .filter(
        (stack) =>
          stack.ResourceType !== 'AWS::CloudFormation::Stack' ||
          (stack.ResourceStatusReason && !stack.ResourceStatusReason.includes(STACK_RESOURCE_FILTER_FAIL_REASON)),
      )
      .filter(
        (stack) =>
          (this.eventMap.logicalResourceNames && this.eventMap.logicalResourceNames.includes(stack.LogicalResourceId)) ||
          (this.eventMap['rootResources'] && this.eventMap['rootResources'].some((resource) => resource.key === stack.LogicalResourceId)),
      )
      .filter((stack) => !RESOURCE_CASCADE_FAIL_REASONS.includes(stack.ResourceStatusReason));
  }

  readStackEvents(stackName) {
    const self = this;
    let delay = CFN_POLL_TIME;
    let readStackEventsCalls = 0;
    const invoker = () => {
      self.addToPollQueue(stackName, 3);
      if (delay < CFN_POLL_TIME_MAX) {
        delay = Math.min(Math.pow(2, readStackEventsCalls) * CFN_POLL_TIME, CFN_POLL_TIME_MAX);
      }
      self.pollForEvents = setTimeout(invoker, delay);
      readStackEventsCalls++;
    };

    // start it off
    self.pollForEvents = setTimeout(invoker, delay);
  }

  pollStack(stackName) {
    return this.getStackEvents(stackName)
      .then((stackEvents) => {
        const uniqueEvents = getUniqueStacksEvents(stackEvents);
        const nestedStacks = filterNestedStacks(uniqueEvents);

        nestedStacks.forEach((stackId) => {
          if (stackId !== stackName) {
            this.addToPollQueue(stackId);
          }
        });
        this.showNewEvents(stackEvents);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  addToPollQueue(stackId, priority = 5) {
    if (!this.pollQueueStacks.includes(stackId)) {
      this.pollQueueStacks.push(stackId);
      this.pollQueue.schedule({ priority }, () => {
        this.removeFromPollQueue(stackId);
        return this.pollStack(stackId);
      });
    }
    return false;
  }

  removeFromPollQueue(stackId) {
    const index = this.pollQueueStacks.indexOf(stackId);
    if (index !== -1) {
      this.pollQueueStacks.splice(index, 1);
    }
  }
  showNewEvents(events) {
    const allShownEvents = this.stackEvents;
    let newEvents = [];

    if (allShownEvents.length) {
      newEvents = _.differenceBy(events, allShownEvents, 'EventId');
    } else {
      newEvents = events;
    }
    if (this.eventMap && this.progressBar.isTTY()) {
      this.showEventProgress(_.uniqBy(newEvents, 'EventId'));
    } else {
      showEvents(_.uniqBy(newEvents, 'EventId'));
    }

    CFNLOG = CFNLOG.concat(_.uniqBy(newEvents, 'EventId').reverse());
    this.stackEvents = [...allShownEvents, ...newEvents];
  }

  // For each event update the corresponding progress bar
  showEventProgress(events) {
    events = events.reverse();
    if (events.length > 0) {
      events.forEach((event) => {
        const finishStatus = CFN_SUCCESS_STATUS.includes(event.ResourceStatus);
        const updateObj = {
          name: event.LogicalResourceId,
          payload: {
            LogicalResourceId: event.LogicalResourceId,
            ResourceType: event.ResourceType,
            ResourceStatus: event.ResourceStatus,
            Timestamp: event.Timestamp,
          },
        };
        const item = this.eventMap['rootResources'].find((it) => it.key === event.LogicalResourceId);
        if (event.LogicalResourceId === this.eventMap['rootStackName'] || item) {
          // If the root resource for a category has already finished, then we do not have to wait for all events under it.
          if (finishStatus && item && item.category) {
            this.progressBar.finishBar(item.category);
          }
          this.progressBar.updateBar('projectBar', updateObj);
        } else if (this.eventMap['eventToCategories']) {
          const category = this.eventMap['eventToCategories'].get(event.LogicalResourceId);
          if (category) {
            this.progressBar.updateBar(category, updateObj);
          }
        }
      });
    }
  }

  getStackEvents(stackName) {
    const self = this;
    const describeStackEventsArgs = { StackName: stackName };
    const log = logger('getStackEvents.cfnModel.describeStackEvents', [describeStackEventsArgs]);
    log();
    return this.cfn
      .describeStackEvents({ StackName: stackName })
      .promise()
      .then((data) => {
        let events = data.StackEvents;
        events = events.filter((event) => self.eventStartTime < new Date(event.Timestamp));
        return Promise.resolve(events);
      })
      .catch((e) => {
        log(e);
        if (e && e.code === 'Throttling') {
          return Promise.resolve([]);
        }
        return Promise.reject(e);
      });
  }

  getStackParameters(stackName) {
    return this.cfn
      .describeStack({ StackName: stackName })
      .promise()
      .then((data) => {
        return data.Parameters;
      });
  }

  updateResourceStack(filePath) {
    try {
      const backEndDir = pathManager.getBackendDirPath(pathManager.findProjectRoot());
      const providerDirectory = path.normalize(path.join(backEndDir, providerName));
      logger('updateCloudFormationNestedStack', [providerDirectory, filePath])();

      const cfnFile = path.parse(filePath).base;
      const { amplifyMeta } = this.context.amplify.getProjectDetails();
      const providerMeta = amplifyMeta.providers ? amplifyMeta.providers[providerName] : {};

      const stackName = providerMeta.StackName || '';
      const stackId = providerMeta.StackId || '';

      const deploymentBucketName = amplifyMeta.providers ? amplifyMeta.providers[providerName].DeploymentBucketName : '';
      const authRoleName = amplifyMeta.providers ? amplifyMeta.providers[providerName].AuthRoleName : '';
      const unauthRoleName = amplifyMeta.providers ? amplifyMeta.providers[providerName].UnauthRoleName : '';

      const Tags = this.context.amplify.getTags(this.context);

      if (!stackName) {
        throw new AmplifyError('StackNotFoundError', {
          message: 'Project stack has not been created yet.',
          resolution: 'Use amplify init to initialize the project.',
        });
      }
      if (!deploymentBucketName) {
        throw new AmplifyError('BucketNotFoundError', {
          message: 'Project deployment bucket has not been created yet.',
          resolution: 'Use amplify init to initialize the project.',
        });
      }

      return S3.getInstance(this.context)
        .then((s3) => {
          const s3Params = {
            Body: fs.createReadStream(filePath),
            Key: cfnFile,
          };
          logger('updateResourceStack.s3.uploadFile', [{ Key: s3Params.cfnFile }])();
          return s3.uploadFile(s3Params, false);
        })
        .then((bucketName) => {
          const templateURL = `https://s3.amazonaws.com/${bucketName}/${cfnFile}`;
          const cfnStackCheckParams = {
            StackName: stackName,
          };
          const cfnModel = this.cfn;
          const { context } = this;
          const self = this;
          this.eventStartTime = new Date();
          return new Promise((resolve, reject) => {
            logger('updateResourceStack.describeStack', [cfnStackCheckParams])();
            this.describeStack(cfnStackCheckParams)
              .then(() => {
                const cfnParentStackParams = {
                  StackName: stackName,
                  TemplateURL: templateURL,
                  Capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
                  Parameters: [
                    {
                      ParameterKey: 'DeploymentBucketName',
                      ParameterValue: deploymentBucketName,
                    },
                    {
                      ParameterKey: 'AuthRoleName',
                      ParameterValue: authRoleName,
                    },
                    {
                      ParameterKey: 'UnauthRoleName',
                      ParameterValue: unauthRoleName,
                    },
                  ],
                  Tags,
                };
                logger('updateResourceStack.updateStack', [cfnStackCheckParams])();
                cfnModel.updateStack(cfnParentStackParams, (updateErr) => {
                  self.readStackEvents(stackName);

                  const cfnCompleteStatus = 'stackUpdateComplete';
                  if (updateErr) {
                    if (self.pollForEvents) {
                      clearTimeout(self.pollForEvents);
                    }
                    return reject(updateErr);
                  }
                  cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, async (completeErr) => {
                    if (self.pollForEvents) {
                      clearTimeout(self.pollForEvents);
                    }
                    this.progressBar?.stop();

                    if (completeErr) {
                      await this.collectStackErrors(cfnParentStackParams.StackName).then((errorDetails) => {
                        completeErr.details = errorDetails;
                        reject(completeErr);
                      });
                    } else {
                      self.context.usageData.calculatePushNormalizationFactor(this.stackEvents, stackId);
                      await self.updateamplifyMetaFileWithStackOutputs(stackName);
                      return resolve();
                    }
                  });
                });
              })
              .catch((err) => {
                reject(new Error("Project stack doesn't exist"));
                context.print.info(err.stack);
              });
          });
        });
    } catch (error) {
      this.progressBar?.stop();
      throw new AmplifyFault(
        'ResourceNotReadyFault',
        {
          message: error.message,
          code: error.code,
        },
        error,
      );
    }
  }

  async listStacks(nextToken = null, stackStatusFilter) {
    return await this.cfn
      .listStacks({
        NextToken: nextToken,
        StackStatusFilter: stackStatusFilter,
      })
      .promise();
  }

  async updateamplifyMetaFileWithStackOutputs(parentStackName) {
    const cfnParentStackParams = {
      StackName: parentStackName,
    };
    const { amplifyMeta } = this.context.amplify.getProjectDetails();

    logger('updateamplifyMetaFileWithStackOutputs.cfn.listStackResources', [cfnParentStackParams])();

    const stackSummaries = await pagedAWSCall(
      async (params, nextToken) => {
        return await this.cfn.listStackResources({ ...params, NextToken: nextToken }).promise();
      },
      {
        StackName: parentStackName,
      },
      (response) => response.StackResourceSummaries,
      async (response) => response.NextToken,
    );

    const resources = stackSummaries.filter(
      (resource) =>
        ![
          'DeploymentBucket',
          'AuthRole',
          'UnauthRole',
          'UpdateRolesWithIDPFunction',
          'UpdateRolesWithIDPFunctionOutputs',
          'UpdateRolesWithIDPFunctionRole',
        ].includes(resource.LogicalResourceId) && resource.ResourceType === 'AWS::CloudFormation::Stack',
    );
    /**
     * Update root stack overrides
     */
    const rootStackResources = stackSummaries.filter(
      (resource) =>
        !['UpdateRolesWithIDPFunction', 'UpdateRolesWithIDPFunctionOutputs', 'UpdateRolesWithIDPFunctionRole'].includes(
          resource.LogicalResourceId,
        ),
    );
    if (rootStackResources.length > 0) {
      const rootStackResult = await this.describeStack(cfnParentStackParams);
      Object.keys(amplifyMeta)
        .filter((k) => k === 'providers')
        .forEach((category) => {
          Object.keys(amplifyMeta[category]).forEach((key) => {
            const formattedOutputs = formatOutputs(rootStackResult.Stacks[0].Outputs);
            this.context.amplify.updateProviderAmplifyMeta('awscloudformation', formattedOutputs);
            /**
             * Write the new env specific datasource information into
             * the team-provider-info file
             */
            const { envName } = this.context.amplify.getEnvInfo();
            const projectPath = pathManager.findProjectRoot();
            const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath);
            const tpiResourceParams = _.get(teamProviderInfo, [envName, 'awscloudformation'], {});
            _.assign(tpiResourceParams, stateManager.getMeta().providers.awscloudformation);
            _.setWith(teamProviderInfo, [envName, 'awscloudformation'], tpiResourceParams);
            stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);
          });
        });
    }

    if (resources.length > 0) {
      const promises = [];

      for (let i = 0; i < resources.length; i++) {
        const cfnNestedStackParams = {
          StackName: resources[i].PhysicalResourceId,
        };

        promises.push(this.describeStack(cfnNestedStackParams));
      }

      const stackResult = await Promise.all(promises);

      Object.keys(amplifyMeta)
        .filter((k) => k !== 'providers')
        .forEach((category) => {
          Object.keys(amplifyMeta[category]).forEach((resource) => {
            const logicalResourceId = category + resource;
            const index = resources.findIndex((resourceItem) => resourceItem.LogicalResourceId === logicalResourceId);

            if (index !== -1) {
              const formattedOutputs = formatOutputs(stackResult[index].Stacks[0].Outputs);

              const updatedMeta = this.context.amplify.updateamplifyMetaAfterResourceUpdate(category, resource, 'output', formattedOutputs);

              // Check to see if this is an AppSync resource and if we've to remove the GraphQLAPIKeyOutput from meta or not
              if (amplifyMeta[category][resource]) {
                const resourceObject = amplifyMeta[category][resource];

                if (
                  resourceObject.service === 'AppSync' &&
                  resourceObject.output &&
                  resourceObject.output.GraphQLAPIKeyOutput &&
                  !formattedOutputs.GraphQLAPIKeyOutput
                ) {
                  const updatedResourceObject = updatedMeta[category][resource];

                  if (updatedResourceObject.output.GraphQLAPIKeyOutput) {
                    delete updatedResourceObject.output.GraphQLAPIKeyOutput;
                  }
                }

                if (resourceObject.service === 'S3AndCloudFront' && resourceObject.output) {
                  updatedMeta[category][resource].output = formattedOutputs;
                }

                stateManager.setMeta(undefined, updatedMeta);
              }
            }
          });
        });
    }
  }

  listExports(nextToken = null) {
    const log = logger('listExports.cfn.listExports', [{ NextToken: nextToken }]);
    return new Promise((resolve, reject) => {
      log();
      this.cfn.listExports(nextToken ? { NextToken: nextToken } : {}, async (err, data) => {
        if (err) {
          log(err);
          reject(err);
        } else if (data.NextToken) {
          await this.listExports(data.NextToken).then((innerExports) => resolve([...data.Exports, ...innerExports]));
        } else {
          resolve(data.Exports);
        }
      });
    });
  }

  describeStack(cfnNestedStackParams, maxTry = 10, timeout = CFN_POLL_TIME) {
    const cfnModel = this.cfn;
    const log = logger('describeStack.cfn.describeStacks', [cfnNestedStackParams]);
    return new Promise((resolve, reject) => {
      log();
      cfnModel
        .describeStacks(cfnNestedStackParams)
        .promise()
        .then((result) => resolve(result))
        .catch((e) => {
          log(e);
          if (e.code === 'Throttling' && e.retryable) {
            setTimeout(() => {
              resolve(this.describeStack(cfnNestedStackParams, maxTry - 1, timeout));
            }, timeout);
          } else {
            reject(e);
          }
        });
    });
  }

  async listStackResources(stackId) {
    const meta = stateManager.getMeta();
    stackId = stackId || _.get(meta, ['providers', providerName, 'StackName'], undefined);
    if (!stackId) {
      throw new AmplifyError('StackNotFoundError', {
        message: `StackId not found in amplify-meta for provider ${providerName}`,
      });
    }
    // StackName param can be a StackName, StackId, or a PhysicalResourceId
    return this.cfn.listStackResources({ StackName: stackId }).promise();
  }

  deleteResourceStack(envName) {
    const teamProviderInfo = stateManager.getTeamProviderInfo();
    const providerInfo = teamProviderInfo?.[envName]?.[providerName];
    const stackName = providerInfo?.StackName;
    if (!stackName) {
      throw new AmplifyError('StackNotFoundError', {
        message: `Stack not defined for the environment.`,
      });
    }

    const cfnStackParams = {
      StackName: stackName,
    };

    const cfnModel = this.cfn;
    const log = logger('deleteResourceStack.cfn.describeStacks', [cfnStackParams]);

    return new Promise((resolve, reject) => {
      log();
      cfnModel.describeStacks(cfnStackParams, (err, data) => {
        const cfnDeleteStatus = 'stackDeleteComplete';
        if (
          (err && err.statusCode === 400 && err.message.includes(`${stackName} does not exist`)) ||
          data.StackStatus === 'DELETE_COMPLETE'
        ) {
          this.context.print.warning('Stack has already been deleted or does not exist');
          resolve();
        }
        if (err === null) {
          cfnModel.deleteStack(cfnStackParams, (deleteErr) => {
            if (deleteErr) {
              console.log(`Error deleting stack ${stackName}`);
              return reject(deleteErr);
            }
            cfnModel.waitFor(cfnDeleteStatus, cfnStackParams, async (completeErr) => {
              if (err) {
                console.log(`Error deleting stack ${stackName}`);
                await this.collectStackErrors(stackName).then((errorDetails) => {
                  completeErr.details = errorDetails;
                  reject(completeErr);
                });
              } else {
                resolve();
              }
            });
          });
        } else {
          log(err);
          reject(err);
        }
      });
    });
  }
}

function formatOutputs(outputs) {
  const formattedOutputs = {};
  for (let i = 0; i < outputs.length; i += 1) {
    formattedOutputs[outputs[i].OutputKey] = outputs[i].OutputValue;
  }

  return formattedOutputs;
}

function showEvents(events) {
  // CFN sorts the events by descending
  events = events.reverse();

  if (events.length > 0) {
    console.log('\n');
    const COLUMNS = ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'];

    const e = events.map((ev) => {
      const res = {};
      const { ResourceStatus: resourceStatus } = ev;

      let colorFn = chalk.reset;
      if (CNF_ERROR_STATUS.includes(resourceStatus)) {
        colorFn = chalk.red;
      } else if (CFN_SUCCESS_STATUS.includes(resourceStatus)) {
        colorFn = chalk.green;
      }

      COLUMNS.forEach((col) => {
        if (ev[col]) {
          res[col] = colorFn(ev[col]);
        }
      });
      return res;
    });

    const formattedEvents = columnify(e, {
      columns: COLUMNS,
      showHeaders: false,
    });
    console.log(formattedEvents);
  }
}

// Unique events with last updated status
function getUniqueStacksEvents(events) {
  // sort in reverse chronological order
  const sortedEvents = [...events].sort((a, b) => b.TimeStamp - a.TimeStamp);
  return _.uniqBy(sortedEvents, 'PhysicalResourceId');
}

function filterNestedStacks(uniqueEvents, excludeWithStatus = CFN_SUCCESS_STATUS, includeWithStatus = []) {
  const nestedStacks = [];
  for (let i = 0; i < uniqueEvents.length; i += 1) {
    const { PhysicalResourceId: physicalResourceId, ResourceType: resourceType, ResourceStatus: status } = uniqueEvents[i];
    if (physicalResourceId && !nestedStacks.includes(physicalResourceId)) {
      if (resourceType === 'AWS::CloudFormation::Stack') {
        if (includeWithStatus.includes(status)) {
          nestedStacks.push(physicalResourceId);
        } else if (excludeWithStatus.length && !excludeWithStatus.includes(status)) {
          nestedStacks.push(physicalResourceId);
        }
      }
    }
  }
  return nestedStacks;
}

function getCFNConsoleLink(event, cfn) {
  if (event.ResourceStatus === 'CREATE_FAILED') {
    // Stacks get deleted and don't have perm link
    return null;
  }
  const arn = event.StackId;
  const { region } = cfn.config;
  return `https://console.aws.amazon.com/cloudformation/home?region=${region}#/stacks/${encodeURIComponent(arn)}/events`;
}

module.exports = CloudFormation;
