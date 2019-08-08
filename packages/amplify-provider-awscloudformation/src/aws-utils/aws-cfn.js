const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const BottleNeck = require('bottleneck');
const chalk = require('chalk');
const columnify = require('columnify');

const aws = require('./aws.js');
const S3 = require('./aws-s3');
const providerName = require('../../lib/constants').ProviderName;
const { formUserAgentParam } = require('./user-agent');
const configurationManager = require('../../lib/configuration-manager');

const CFN_MAX_CONCURRENT_REQUEST = 5;
const CFN_POLL_TIME = 5 * 1000; // 5 secs wait to check if  new stacks are created by root stack

const CFN_SUCCESS_STATUS = [
  'UPDATE_COMPLETE',
  'CREATE_COMPLETE',
  'DELETE_COMPLETE',
  'DELETE_SKIPPED',
];

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

      this.cfn = new aws.CloudFormation({ ...cred, ...options, ...userAgentOption });
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
      cfnModel.createStack(cfnParentStackParams, (createErr) => {
        this.readStackEvents(cfnParentStackParams.StackName);
        if (createErr) {
          context.print.error('An error occurred when creating the CloudFormation stack');
          reject(createErr);
        }
        cfnModel.waitFor(
          cfnCompleteStatus,
          cfnStackCheckParams,
          (completeErr, waitForStackdata) => {
            if (self.pollForEvents) {
              clearInterval(self.pollForEvents);
            }
            if (completeErr) {
              context.print.error('An error occurred when  creating the CloudFormation stack');
              this.collectStackErrors(cfnParentStackParams.StackName).then(() =>
                reject(completeErr));
            }
            resolve(waitForStackdata);
          },
        );
      });
    });
  }

  collectStackErrors(stackName) {
    // add root stack to see the new stacks
    this.readStackEvents(stackName);
    // wait for the poll queue to drain
    return new Promise((resolve) => {
      this.pollQueue.once('empty', () => {
        const failedStacks = this.stackEvents.filter(ev =>
          CNF_ERROR_STATUS.includes(ev.ResourceStatus));
        try {
          const trace = this.generateFailedStackErrorMsgs(failedStacks);
          console.log(`\n\n${chalk.reset.red.bold('Following resources failed')}\n`);
          trace.forEach((t) => {
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
      .map((event) => {
        const err = [];
        const resourceName =
          event.PhysicalResourceId.replace(envRegExp, '') || event.LogicalResourceId;
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
    showEvents(_.uniqBy(newEvents, 'EventId'));
    this.stackEvents = [...allShownEvents, ...newEvents];
  }

  getStackEvents(stackName) {
    const self = this;
    return this.cfn
      .describeStackEvents({ StackName: stackName })
      .promise()
      .then((data) => {
        let events = data.StackEvents;
        events = events.filter(event => self.eventStartTime < new Date(event.Timestamp));
        return Promise.resolve(events);
      })
      .catch((e) => {
        if (e && e.code === 'Throttling') {
          return Promise.resolve([]);
        }
        Promise.reject(e);
      });
  }

  updateResourceStack(dir, cfnFile) {
    const filePath = path.normalize(path.join(dir, cfnFile));
    const projectDetails = this.context.amplify.getProjectDetails();
    const stackName = projectDetails.amplifyMeta.providers
      ? projectDetails.amplifyMeta.providers[providerName].StackName
      : '';
    const deploymentBucketName = projectDetails.amplifyMeta.providers
      ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName
      : '';
    const authRoleName = projectDetails.amplifyMeta.providers
      ? projectDetails.amplifyMeta.providers[providerName].AuthRoleName
      : '';
    const unauthRoleName = projectDetails.amplifyMeta.providers
      ? projectDetails.amplifyMeta.providers[providerName].UnauthRoleName
      : '';

    if (!stackName) {
      throw new Error('Project stack has not been created yet. Use amplify init to initialize the project.');
    }
    if (!deploymentBucketName) {
      throw new Error('Project deployment bucket has not been created yet. Use amplify init to initialize the project.');
    }

    return new S3(this.context)
      .then((s3) => {
        const s3Params = {
          Body: fs.createReadStream(filePath),
          Key: cfnFile,
        };
        return s3.uploadFile(s3Params);
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
          cfnModel.describeStacks(cfnStackCheckParams, (err) => {
            if (err) {
              reject(new Error("Project stack doesn't exist"));
              context.print.info(err.stack);
            }
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
            };

            cfnModel.updateStack(cfnParentStackParams, (updateErr) => {
              self.readStackEvents(stackName);

              const cfnCompleteStatus = 'stackUpdateComplete';
              if (updateErr) {
                console.error('Error updating cloudformation stack');
                reject(updateErr);
              }
              cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, (completeErr) => {
                if (self.pollForEvents) {
                  clearInterval(self.pollForEvents);
                }
                if (completeErr) {
                  console.error('Error updating cloudformation stack');
                  this.collectStackErrors(cfnParentStackParams.StackName).then(() =>
                    reject(completeErr));
                } else {
                  return self
                    .updateamplifyMetaFileWithStackOutputs(stackName)
                    .then(() => resolve());
                }
              });
            });
          });
        });
      });
  }

  updateamplifyMetaFileWithStackOutputs(parentStackName) {
    const cfnParentStackParams = {
      StackName: parentStackName,
    };
    const projectDetails = this.context.amplify.getProjectDetails();
    const { amplifyMeta } = projectDetails;

    const cfnModel = this.cfn;
    return cfnModel
      .describeStackResources(cfnParentStackParams)
      .promise()
      .then((result) => {
        let resources = result.StackResources;
        resources = resources.filter(resource =>
          !['DeploymentBucket',
            'AuthRole',
            'UnauthRole',
            'UpdateRolesWithIDPFunction',
            'UpdateRolesWithIDPFunctionOutputs',
            'UpdateRolesWithIDPFunctionRole'].includes(resource.LogicalResourceId));

        const promises = [];

        for (let i = 0; i < resources.length; i += 1) {
          const cfnNestedStackParams = {
            StackName: resources[i].PhysicalResourceId,
          };
          promises.push(this.describeStack(cfnNestedStackParams));
        }

        return Promise.all(promises).then((stackResult) => {
          Object.keys(amplifyMeta).forEach((category) => {
            Object.keys(amplifyMeta[category]).forEach((resource) => {
              const logicalResourceId = category + resource;
              const index = resources
                .findIndex(resourceItem => resourceItem.LogicalResourceId === logicalResourceId);
              if (index !== -1) {
                this.context.amplify.updateamplifyMetaAfterResourceUpdate(
                  category,
                  resource,
                  'output',
                  formatOutputs(stackResult[index].Stacks[0].Outputs),
                );
              }
            });
          });
        });
      });
  }

  describeStack(cfnNestedStackParams, maxTry = 10, timeout = CFN_POLL_TIME) {
    const cfnModel = this.cfn;
    return new Promise((resolve, reject) => {
      cfnModel
        .describeStacks(cfnNestedStackParams)
        .promise()
        .then(result => resolve(result))
        .catch((e) => {
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
    const stackName = teamProviderInfo[envName][providerName].StackName;

    if (!stackName) {
      throw new Error('Stack not defined for the environment.');
    }

    const cfnStackParams = {
      StackName: stackName,
    };

    const cfnModel = this.cfn;

    return new Promise((resolve, reject) => {
      cfnModel.describeStacks(cfnStackParams, (err) => {
        const cfnDeleteStatus = 'stackDeleteComplete';
        if (err === null) {
          cfnModel.deleteStack(cfnStackParams, (deleteErr) => {
            if (deleteErr) {
              console.log(`Error deleting stack ${stackName}`);
              reject(deleteErr);
            }
            cfnModel.waitFor(cfnDeleteStatus, cfnStackParams, (completeErr) => {
              if (err) {
                console.log(`Error deleting stack ${stackName}`);
                this.collectStackErrors(stackName).then(() => reject(completeErr));
              } else {
                resolve();
              }
            });
          });
        } else {
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
    const COLUMNS = [
      'ResourceStatus',
      'LogicalResourceId',
      'ResourceType',
      'Timestamp',
      'ResourceStatusReason',
    ];

    const e = events.map((ev) => {
      const res = {};
      const { ResourceStatus: resourceStatus } = ev;

      let colorFn = chalk.default;
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
    console.log(columnify(e, {
      columns: COLUMNS,
      showHeaders: false,
    }));
  }
}

// Unique events with last updated status
function getUniqueStacksEvents(events) {
  // sort in reverse chronological order
  const sortedEvents = [...events].sort((a, b) => b.TimeStamp - a.TimeStamp);
  return _.uniqBy(sortedEvents, 'PhysicalResourceId');
}

function filterNestedStacks(
  uniqueEvents,
  excludeWithStatus = CFN_SUCCESS_STATUS,
  includeWithStatus = [],
) {
  const nestedStacks = [];
  for (let i = 0; i < uniqueEvents.length; i += 1) {
    const {
      PhysicalResourceId: physicalResourceId,
      ResourceType: resourceType,
      ResourceStatus: status,
    } = uniqueEvents[i];
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
