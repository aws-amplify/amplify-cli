const aws = require('./aws.js');
const S3 = require('./aws-s3');
const fs = require('fs');
const path = require('path');
const providerName = require('../../constants').ProviderName;

class CloudFormation {
  constructor(context) {
    return aws.configureWithCreds(context)
      .then((awsItem) => {
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

    return new Promise((resolve, reject) => {
      cfnModel.createStack(cfnParentStackParams, (createErr, data) => {
        if (createErr) {
          context.print.error('Error creating cloudformation stack');
          reject(createErr);
        }
        cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, (completeErr) => {
          if (completeErr) {
            context.print.error('Error creating cloudformation stack');
            reject(completeErr);
          }
          resolve(data);
        });
      });
    });
  }

  updateResourceStack(dir, cfnFile) {
    const filePath = path.normalize(path.join(dir, cfnFile));
    const projectDetails = this.context.awsmobile.getProjectDetails();
    const stackName = projectDetails.awsmobileMeta.provider ? projectDetails.awsmobileMeta.provider[providerName].StackName : '';
    const deploymentBucketName = projectDetails.awsmobileMeta.provider ? projectDetails.awsmobileMeta.provider[providerName].DeploymentBucket : '';
    if (!stackName) {
      throw (new Error('Project Stack is not yet created. Please use awsmobile init to initialize the project.'));
    }
    if (!deploymentBucketName) {
      throw (new Error('Project deployment bucket is not yet created. Please use awsmobile init to initialize the project.'));
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
              ],
            };

            cfnModel.updateStack(cfnParentStackParams, (updateErr) => {
              const cfnCompleteStatus = 'stackUpdateComplete';
              if (updateErr) {
                console.error('Error updating cloudformation stack');
                reject(updateErr);
              }
              cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, (completeErr) => {
                if (completeErr) {
                  console.error('Error updating cloudformation stack');
                  reject(completeErr);
                } else {
                  return self.updateAwsmobileMetaFileWithStackOutputs(stackName)
                    .then(() => resolve());
                }
              });
            });
          });
        });
      });
  }

  updateAwsmobileMetaFileWithStackOutputs(parentStackName) {
    const cfnParentStackParams = {
      StackName: parentStackName,
    };
    const projectDetails = this.context.awsmobile.getProjectDetails();
    const { awsmobileMeta } = projectDetails;

    const cfnModel = this.cfn;
    return cfnModel.describeStackResources(cfnParentStackParams).promise()
      .then((result) => {
        let resources = result.StackResources;
        resources = resources.filter(resource => resource.LogicalResourceId !== 'DeploymentBucket');
        const promises = [];

        for (let i = 0; i < resources.length; i += 1) {
          if (resources[i].LogicalResourceId === 'DeploymentBucket') {
            continue;
          }
          const cfnNestedStackParams = {
            StackName: resources[i].PhysicalResourceId,
          };

          promises.push(cfnModel.describeStacks(cfnNestedStackParams).promise());
        }

        return Promise.all(promises)
          .then((stackResult) => {
            Object.keys((awsmobileMeta)).forEach((category) => {
              Object.keys((awsmobileMeta[category])).forEach((resource) => {
                const logicalResourceId = category + resource;
                const index = resources.findIndex(resourceItem =>
                  resourceItem.LogicalResourceId ===
                    logicalResourceId);

                if (index !== -1) {
                  this.context.awsmobile.updateAwsMobileMetaAfterResourceUpdate(category, resource, 'output', formatOutputs(stackResult[index].Stacks[0].Outputs));
                }
              });
            });
          });
      });
  }

  deleteResourceStack() {
    const projectDetails = this.context.awsmobile.getProjectDetails();
    const stackName = projectDetails.awsmobileMeta.provider ? projectDetails.awsmobileMeta.provider[providerName].parentStackName : '';
    if (!stackName) {
      throw new Error('Project stack does not exist');
    }

    const cfnStackParams = {
      StackName: stackName,
    };

    const cfnModel = this.cfn;

    return new Promise((resolve, reject) => {
      cfnModel.describeStacks(cfnStackParams, (err) => {
        let cfnDeleteStatus = 'stackCreateComplete';
        if (err === null) {
          cfnModel.deleteStack(cfnStackParams, (deleteErr) => {
            cfnDeleteStatus = 'stackDeleteComplete';
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
module.exports = CloudFormation;
