const aws = require("./aws.js");
const S3 = require("./aws-s3");
const fs = require('fs');
const path = require('path');
var shortid = require('shortid');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
const providerName = require("../../constants").ProviderName;

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
        let filePath = path.normalize(path.join(dir, cfnFile));
        let projectDetails = this.context.awsmobile.getProjectDetails();
        let projectName = projectDetails.projectConfig.ProjectName;
        let stackName = projectDetails.awsmobileMeta.provider ? projectDetails.awsmobileMeta.provider[providerName].parentStackName : '';
        let updateAwsMetaFile = false;
        if(!stackName) {
            stackName = projectName + shortid.generate().toLowerCase();
            updateAwsMetaFile = true;
        }

        return new S3(this.context)
            .then((s3) => {
                let s3Params = {
                    Body: fs.createReadStream(filePath),
                    Key: cfnFile
                };
                return s3.uploadFile(s3Params);
            })
            .then((bucketName) => {
                let templateURL = "https://s3.amazonaws.com/" + bucketName + '/' + cfnFile;
                let cfnStackCheckParams = {
                    "StackName": stackName
                };

                let cfnStackCreateParams = {
                    "StackName": stackName,
                    "TemplateURL": templateURL,
                };

                let cfnModel = this.cfn;
                let context = this.context;
                let self = this;

                return new Promise((resolve, reject) => {
                    cfnModel.describeStacks(cfnStackCheckParams, function(err, data) {
                        let cfnParentStackParams = {
                            "StackName": stackName,
                            "TemplateURL": templateURL,
                            "Capabilities": ["CAPABILITY_NAMED_IAM"]
                        };

                        if (err != null && err.statusCode === 400) { // Create new parent stack
                            let cfnCompleteStatus = 'stackCreateComplete';
                            cfnModel.createStack(cfnParentStackParams, function(err, data) {
                                if (err) {
                                    console.log("Error creating cloudformation stack");
                                    console.log(err, err.stack);
                                    resolve();
                                }
                                cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, function(err, data) {
                                    if (err) {
                                        console.log("Error creating cloudformation stack");
                                        console.log(err, err.stack);
                                        resolve();
                                    } else {
                                        context.awsmobile.updateProviderAwsMobileMeta(providerName, {"parentStackName": stackName});
                                        return self.updateAwsmobileMetaFileWithStackOutputs(stackName)
                                            .then(() => resolve());
                                    }

                                });
                            });
                        } else {
                            cfnModel.updateStack(cfnParentStackParams, function(err, data) {
                                let cfnCompleteStatus = 'stackUpdateComplete';
                                if (err) {
                                    console.log("Error updating cloudformation stack");
                                    console.log(err, err.stack);
                                    resolve();
                                }
                                cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, function(err, data) {
                                    if (err) {
                                        console.log("Error updating cloudformation stack");
                                        console.log(err, err.stack);
                                        resolve();
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
        let cfnParentStackParams = {
            "StackName": parentStackName
        };
        let projectDetails = this.context.awsmobile.getProjectDetails();
        let awsmobileMeta = projectDetails.awsmobileMeta;

        let cfnModel = this.cfn;
        return cfnModel.describeStackResources(cfnParentStackParams).promise()
            .then((result) => {
                let resources = result.StackResources;
                let promises = [];

                for(let i = 0; i < resources.length; i++) {
                    let cfnNestedStackParams = {
                        "StackName": resources[i].PhysicalResourceId
                    };

                    promises.push(cfnModel.describeStacks(cfnNestedStackParams).promise());
                }

                return Promise.all(promises)
                    .then((result) => {
                        Object.keys((awsmobileMeta)).forEach((category) => {
                            Object.keys((awsmobileMeta[category])).forEach((resource) => {
                                let logicalResourceId = category + resource;
                                let index = resources.findIndex((resourceItem) => {
                                    return resourceItem.LogicalResourceId === logicalResourceId;
                                });
                                if(index != -1) {
                                    this.context.awsmobile.updateAwsMobileMetaAfterResourceUpdate(category, resource, "output", formatOutputs(result[index].Stacks[0].Outputs));
                                }
                            });
                        });
                    });
            });
    }

    deleteResourceStack() {
        let projectDetails = this.context.awsmobile.getProjectDetails();
        let stackName = projectDetails.awsmobileMeta.provider ? projectDetails.awsmobileMeta.provider[providerName].parentStackName : '';
        if(!stackName) {
            throw new Error('Project stack does not exist');
        }

        let cfnStackParams = {
            "StackName": stackName
        };

        let cfnModel = this.cfn;
        let context = this.context;

        return new Promise((resolve, reject) => {
            cfnModel.describeStacks(cfnStackParams, function(err, data) {
                let cfnDeleteStatus = 'stackCreateComplete';
                if (err === null) {
                    cfnModel.deleteStack(cfnStackParams, function(err, data) {
                        cfnDeleteStatus = 'stackDeleteComplete';
                        if (err) {
                            console.log("Error for " + category + ":" + resourceName);
                            console.log(err, err.stack);
                            resolve();
                        }
                        cfnModel.waitFor(cfnDeleteStatus, cfnStackParams, function(err, data) {
                            if (err) {
                                console.log("Error for " + category + ":" + resourceName);
                                console.log(err, err.stack);
                                resolve();
                            } else {
                                resolve();
                            }
                        });
                    });
                } else {
                    console.log(err.stack);
                    resolve();
                }
            });
        });
    }


}

function formatOutputs(outputs) {
    let formattedOutputs = {};
    for (let i = 0; i < outputs.length; i++) {
        formattedOutputs[outputs[i].OutputKey] = outputs[i].OutputValue
    }

    return formattedOutputs;
}
module.exports = CloudFormation;