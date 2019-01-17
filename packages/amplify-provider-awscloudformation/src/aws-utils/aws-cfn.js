const aws = require('./aws.js');
const S3 = require('./aws-s3');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const providerName = require('../../lib/constants').ProviderName;
const columnify = require('columnify');
const { formUserAgentParam } = require('./user-agent');

const CFN_MAX_CONCURRENT_REQUEST = 15;
const CFN_POLL_TIME = 7000; // 7sec

const CFN_SUCCESS_STATUS = [
  'UPDATE_COMPLETE',
  'CREATE_COMPLETE',
  'DELETE_COMPLETE',
  'DELETE_SKIPPED',
];

class CloudFormation {
  constructor(context, awsClientWithCreds, userAgentAction) {
    const initializeAwsClient = awsClientWithCreds
      ? Promise.resolve(awsClientWithCreds)
      : aws.configureWithCreds(context);

    let userAgentParam;
    if (userAgentAction) {
      userAgentParam = formUserAgentParam(context, userAgentAction);
    }

    return initializeAwsClient.then((awsItem) => {
      if (userAgentAction) {
        awsItem.config.update({ customUserAgent: userAgentParam });
      }
      this.cfn = new awsItem.CloudFormation();
      this.context = context;
      return this;
    });
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
              reject(completeErr);
            }
            resolve(waitForStackdata);
          },
        );
      });
    });
  }

  readStackEvents(stackName) {
    // Stores all the events displayed to the user (useful to do a diff with new Events)
    let allShownEvents = [];
    const self = this;
    const cfnModel = this.cfn;
    const params = {
      StackName: stackName,
    };
    let nestedStackQueue = [];

    this.pollForEvents = setInterval(() => {
      cfnModel.describeStackEvents(params, (err, data) => {
        if (err) {
          console.log(err);
          /* Not throwing error out here since this is an asynchornous event
          running in the background */
        } else {
          let stackEvents = data.StackEvents;
          stackEvents = stackEvents
            .filter(event => self.eventStartTime < new Date(event.Timestamp));

          if (allShownEvents.length === 0) {
            // Showing events for the first time to the user
            if (stackEvents.length > 0) {
              showEvents(stackEvents);
              allShownEvents = stackEvents;
            }
          }

          let newEvents = stackEvents;
          const nestedStackEventPromises = [];

          const uniqueEvents = getUniqueStacksEvents(newEvents);
          const nestedStacks = filterNestedStacks(uniqueEvents);

          if (!nestedStackQueue.length) {
            // empty queue
            nestedStackQueue = nestedStacks;
          } else {
            // maintain the order of the queue and remove missing stack
            nestedStackQueue = _.intersection(nestedStackQueue, nestedStacks);

            // add newly created stack to the end of the queue
            const newStacks = _.difference(nestedStacks, nestedStackQueue);
            nestedStackQueue = [...nestedStackQueue, ...newStacks];
          }

          for (let i = 0; i < Math.min(CFN_MAX_CONCURRENT_REQUEST, nestedStackQueue.length); i++) {
            nestedStackEventPromises.push(self.getNestedStackEvents(nestedStackQueue[0]));
            if (nestedStackQueue.length > 1) {
              nestedStackQueue.shift();
            }
          }

          return Promise.all(nestedStackEventPromises).then((nestedstackEvents) => {
            newEvents = nestedstackEvents.reduce(
              (combinedEventList, nestedstackEventList) =>
                combinedEventList.concat(nestedstackEventList),
              newEvents,
            );
            // Just get the new events to display to the user

            newEvents = _.differenceBy(newEvents, allShownEvents, 'EventId');
            newEvents = _.uniqBy(newEvents, 'EventId');
            showEvents(newEvents);
            allShownEvents = allShownEvents.concat(newEvents);
          });
        }
      });
    }, CFN_POLL_TIME);
  }

  getNestedStackEvents(stackName) {
    const self = this;
    return this.cfn
      .describeStackEvents({ StackName: stackName })
      .promise()
      .then((data) => {
        let nestedstackEvents = data.StackEvents;
        nestedstackEvents = nestedstackEvents
          .filter(event => self.eventStartTime < new Date(event.Timestamp));

        return nestedstackEvents;
      })
      .catch(() =>
        // ignore. We dont fail if we can't get the nested stack status
        ({}));
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
              Capabilities: ['CAPABILITY_NAMED_IAM'],
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
                  reject(completeErr);
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
          !['DeploymentBucket', 'AuthRole', 'UnauthRole'].includes(resource.LogicalResourceId));

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
                reject(completeErr);
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
    console.log(columnify(events, {
      columns: [
        'ResourceStatus',
        'LogicalResourceId',
        'ResourceType',
        'Timestamp',
        'ResourceStatusReason',
      ],
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

module.exports = CloudFormation;
