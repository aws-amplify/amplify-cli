const aws = require('./aws.js');
const S3 = require('./aws-s3');
const fs = require('fs');
const path = require('path');
const shortid = require('shortid');

shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
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

  updateResourceStack(dir, cfnFile) {
    const filePath = path.normalize(path.join(dir, cfnFile));
    const projectDetails = this.context.awsmobile.getProjectDetails();
    const projectName = projectDetails.projectConfig.ProjectName;
    let stackName = projectDetails.awsmobileMeta.provider ? projectDetails.awsmobileMeta.provider[providerName].parentStackName : '';
    if (!stackName) {
      stackName = projectName + shortid.generate().toLowerCase();
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
            const cfnParentStackParams = {
              StackName: stackName,
              TemplateURL: templateURL,
              Capabilities: ["CAPABILITY_NAMED_IAM"]
            };

            if (err != null && err.statusCode === 400) { // Create new parent stack
              const cfnCompleteStatus = 'stackCreateComplete';
              cfnModel.createStack(cfnParentStackParams, (createErr) => {
                console.log(`Creating new parent cloudformation stack:${stackName}`);
                if (createErr) {
                  console.error('Error creating cloudformation stack');
                  reject(createErr);
                }
                cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, (completeErr) => {
                  if (completeErr) {
                    console.error('Error creating cloudformation stack');
                    reject(completeErr);
                  } else {
                    context.awsmobile.updateProviderAwsMobileMeta(
                      providerName,
                      { parentStackName: stackName },
                    );
                    return self.updateAwsmobileMetaFileWithStackOutputs(stackName)
                      .then(() => resolve());
                  }
                });
              });
            } else {
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
            }
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
        const resources = result.StackResources;
        const promises = [];

        for (let i = 0; i < resources.length; i += 1) {
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
