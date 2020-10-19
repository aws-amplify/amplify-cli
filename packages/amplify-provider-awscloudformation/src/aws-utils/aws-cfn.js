const fs = require('fs-extra');
const path = require('path');
const _ = require('lodash');
const BottleNeck = require('bottleneck');
const chalk = require('chalk');
const columnify = require('columnify');

const aws = require('./aws.js');
const { S3 } = require('./aws-s3');
const providerName = require('../constants').ProviderName;
const { formUserAgentParam } = require('./user-agent');
const { stateManager } = require('amplify-cli-core');
const { CreateService } = require('./aws-service-creator');
const { fileLogger, logStackEvents } = require('../utils/aws-logger');
const logger = fileLogger('aws-cfn');

const CFN_MAX_CONCURRENT_REQUEST = 5;
const CFN_POLL_TIME = 5 * 1000; // 5 secs wait to check if  new stacks are created by root stack

const CFN_SUCCESS_STATUS = ['UPDATE_COMPLETE', 'CREATE_COMPLETE', 'DELETE_COMPLETE', 'DELETE_SKIPPED'];

const CNF_ERROR_STATUS = ['CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED'];
class CloudFormation {
  constructor(context, userAgentAction, options = {}) {
    return (async () => {
      let userAgentParam;
      if (userAgentAction) {
        userAgentParam = formUserAgentParam(context, userAgentAction);
      }

      this.pollQueue = new BottleNeck({ minTime: 100, maxConcurrent: CFN_MAX_CONCURRENT_REQUEST });
      this.pollQueueStacks = [];
      this.stackEvents = [];
      const userAgentOption = {};
      if (userAgentAction) {
        userAgentOption.customUserAgent = userAgentParam;
      }

      this.cfn = await CreateService(context, aws.CloudFormation, { ...options, ...userAgentOption });
      this.context = context;
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
      cfnModel.createStack(cfnParentStackParams, createErr => {
        this.readStackEvents(cfnParentStackParams.StackName);
        logger('cfnModel.createStack', [cfnParentStackParams])(createErr);
        if (createErr) {
          context.print.error('An error occurred when creating the CloudFormation stack');
          reject(createErr);
        }
        cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, (completeErr, waitForStackdata) => {
          if (self.pollForEvents) {
            clearInterval(self.pollForEvents);
          }
          if (completeErr) {
            context.print.error('An error occurred when creating the CloudFormation stack');
            this.collectStackErrors(cfnParentStackParams.StackName).then(() => reject(completeErr));
          }
          resolve(waitForStackdata);
        });
      });
    });
  }

  collectStackErrors(stackName) {
    // add root stack to see the new stacks
    this.readStackEvents(stackName);
    // wait for the poll queue to drain
    return new Promise(resolve => {
      this.pollQueue.once('empty', () => {
        const failedStacks = this.stackEvents.filter(ev => CNF_ERROR_STATUS.includes(ev.ResourceStatus));
        try {
          const trace = this.generateFailedStackErrorMsgs(failedStacks);
          console.log(`\n\n${chalk.reset.red.bold('Following resources failed')}\n`);
          trace.forEach(t => {
            console.log(t);
            console.log('\n');
          });
          resolve();
        } catch (e) {
          Promise.reject(e);
        }
      });
    });
  }

  generateFailedStackErrorMsgs(eventsWithFailure) {
    const { envName = '' } = this.context.amplify.getEnvInfo();
    const envRegExp = new RegExp(`(-|_)${envName}`);
    const stackTrees = eventsWithFailure
      .filter(stack => stack.ResourceType !== 'AWS::CloudFormation::Stack')
      .map(event => {
        const err = [];
        const resourceName = event.PhysicalResourceId.replace(envRegExp, '') || event.LogicalResourceId;
        const cfnURL = getCFNConsoleLink(event, this.cfn);
        err.push(`${chalk.bold('Resource Name:')} ${resourceName} (${event.ResourceType})`);
        err.push(`${chalk.bold('Event Type:')} ${getStatusToErrorMsg(event.ResourceStatus)}`);
        err.push(`${chalk.bold('Reason:')} ${event.ResourceStatusReason}`);
        if (cfnURL) {
          err.push(`${chalk.bold('URL:')} ${cfnURL}`);
        }
        return err.join('\n');
      });
    return stackTrees;
  }

  readStackEvents(stackName) {
    this.pollForEvents = setInterval(() => this.addToPollQueue(stackName, 3), CFN_POLL_TIME);
  }

  pollStack(stackName) {
    return this.getStackEvents(stackName)
      .then(stackEvents => {
        const uniqueEvents = getUniqueStacksEvents(stackEvents);
        const nestedStacks = filterNestedStacks(uniqueEvents);

        nestedStacks.forEach(stackId => {
          if (stackId !== stackName) {
            this.addToPollQueue(stackId);
          }
        });
        this.showNewEvents(stackEvents);
      })
      .catch(err => {
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
    showEvents(_.uniqBy(newEvents, 'EventId'));
    this.stackEvents = [...allShownEvents, ...newEvents];
  }

  getStackEvents(stackName) {
    const self = this;
    const describeStackEventsArgs = { StackName: stackName };
    const log = logger('getStackEvents.cfnModel.describeStackEvents', [describeStackEventsArgs]);
    log();
    return this.cfn
      .describeStackEvents({ StackName: stackName })
      .promise()
      .then(data => {
        let events = data.StackEvents;
        events = events.filter(event => self.eventStartTime < new Date(event.Timestamp));
        return Promise.resolve(events);
      })
      .catch(e => {
        log(e);
        if (e && e.code === 'Throttling') {
          return Promise.resolve([]);
        }
        Promise.reject(e);
      });
  }

  updateResourceStack(dir, cfnFile) {
    const filePath = path.normalize(path.join(dir, cfnFile));
    const projectDetails = this.context.amplify.getProjectDetails();
    const stackName = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].StackName : '';
    const deploymentBucketName = projectDetails.amplifyMeta.providers
      ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName
      : '';
    const authRoleName = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].AuthRoleName : '';
    const unauthRoleName = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].UnauthRoleName : '';

    const Tags = this.context.amplify.getTags();

    if (!stackName) {
      throw new Error('Project stack has not been created yet. Use amplify init to initialize the project.');
    }
    if (!deploymentBucketName) {
      throw new Error('Project deployment bucket has not been created yet. Use amplify init to initialize the project.');
    }

    return S3.getInstance(this.context)
      .then(s3 => {
        const s3Params = {
          Body: fs.createReadStream(filePath),
          Key: cfnFile,
        };
        logger('updateResourceStack.s3.uploadFile', [{ Key: s3Params.cfnFile }])();
        return s3.uploadFile(s3Params, false);
      })
      .then(bucketName => {
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
              cfnModel.updateStack(cfnParentStackParams, updateErr => {
                self.readStackEvents(stackName);

                const cfnCompleteStatus = 'stackUpdateComplete';
                if (updateErr) {
                  console.error('Error updating cloudformation stack');
                  reject(updateErr);
                }
                cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, completeErr => {
                  if (self.pollForEvents) {
                    clearInterval(self.pollForEvents);
                  }
                  if (completeErr) {
                    console.error('Error updating cloudformation stack');
                    this.collectStackErrors(cfnParentStackParams.StackName).then(() => reject(completeErr));
                  } else {
                    return self.updateamplifyMetaFileWithStackOutputs(stackName).then(() => resolve());
                  }
                });
              });
            })
            .catch(err => {
              reject(new Error("Project stack doesn't exist"));
              context.print.info(err.stack);
            });
        });
      });
  }

  async updateamplifyMetaFileWithStackOutputs(parentStackName) {
    const cfnParentStackParams = {
      StackName: parentStackName,
    };
    const projectDetails = this.context.amplify.getProjectDetails();
    const { amplifyMeta } = projectDetails;
    logger('updateamplifyMetaFileWithStackOutputs.cfn.describeStackResources', [cfnParentStackParams])();
    const result = await this.cfn.describeStackResources(cfnParentStackParams).promise();
    const resources = result.StackResources.filter(
      resource =>
        ![
          'DeploymentBucket',
          'AuthRole',
          'UnauthRole',
          'UpdateRolesWithIDPFunction',
          'UpdateRolesWithIDPFunctionOutputs',
          'UpdateRolesWithIDPFunctionRole',
        ].includes(resource.LogicalResourceId),
    );

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
        .filter(k => k !== 'providers')
        .forEach(category => {
          Object.keys(amplifyMeta[category]).forEach(resource => {
            const logicalResourceId = category + resource;
            const index = resources.findIndex(resourceItem => resourceItem.LogicalResourceId === logicalResourceId);

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
      this.cfn.listExports(nextToken ? { NextToken: nextToken } : {}, (err, data) => {
        if (err) {
          log(err);
          reject(err);
        } else if (data.NextToken) {
          this.listExports(data.NextToken).then(innerExports => resolve([...data.Exports, ...innerExports]));
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
        .then(result => resolve(result))
        .catch(e => {
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

  deleteResourceStack(envName) {
    const { teamProviderInfo } = this.context.amplify.getProjectDetails();
    const teamProvider = teamProviderInfo[envName][providerName];
    const stackName = teamProvider.StackName;
    if (!stackName) {
      throw new Error('Stack not defined for the environment.');
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
          cfnModel.deleteStack(cfnStackParams, deleteErr => {
            if (deleteErr) {
              console.log(`Error deleting stack ${stackName}`);
              reject(deleteErr);
            }
            cfnModel.waitFor(cfnDeleteStatus, cfnStackParams, completeErr => {
              if (err) {
                console.log(`Error deleting stack ${stackName}`);
                this.collectStackErrors(stackName).then(() => reject(completeErr));
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
  events = events.sort((a, b) => new Date(a.Timestamp) > new Date(b.Timestamp));

  if (events.length > 0) {
    console.log('\n');
    const COLUMNS = ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'];

    const e = events.map(ev => {
      const res = {};
      const { ResourceStatus: resourceStatus } = ev;
      logStackEvents(`${ev.ResourceStatus} ${ev.LogicalResourceId} ${ev.ResourceType} ${ev.ResourceStatusReason || ''} (${ev.Timestamp})`);
      let colorFn = chalk.reset;
      if (CNF_ERROR_STATUS.includes(resourceStatus)) {
        colorFn = chalk.red;
      } else if (CFN_SUCCESS_STATUS.includes(resourceStatus)) {
        colorFn = chalk.green;
      }

      COLUMNS.forEach(col => {
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

function getStatusToErrorMsg(status) {
  const MAP = {
    CREATE_FAILED: 'create',
    DELETE_FAILED: 'delete',
    UPDATE_FAILED: 'update',
  };
  return MAP[status] || status;
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
