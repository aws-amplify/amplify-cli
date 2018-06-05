var aws = require("./aws.js");
var S3 = require("./aws-s3");
var fs = require('fs');
var path = require('path');

class CloudFormation {
    constructor(context) {
        return aws.configureWithCreds(context)
            .then((awsItem) => {
                this.cfn = new awsItem.CloudFormation();
                this.context = context;
                return this;
            });
    }

    updateResourceStacks(dir, cfnFiles, category, resourceName) {
        let promises = [];

        for (let i = 0; i < cfnFiles.length; i++) {
            promises.push(this.updateResourceStack(dir, cfnFiles[i], category, resourceName));
        }
        return Promise.all(promises);
    }

    updateResourceStack(dir, cfnFile, category, resourceName) {
        let filePath = path.normalize(path.join(dir, cfnFile));
        let projectDetails = this.context.awsmobile.getProjectDetails()
        let projectName = projectDetails.projectConfig.ProjectName;
        let bucketName = projectName.toLowerCase() + "-awsmobilecli-cfn-templates-randomchars";
        let stackName = projectName + '-' + category + '-' + resourceName;
        let templateURL = "https://s3.amazonaws.com/" + bucketName + '/' + cfnFile;

        return new S3(this.context)
            .then((s3) => {

                let s3Params = {
                    Body: fs.createReadStream(filePath),
                    Key: cfnFile,
                    Bucket: bucketName
                };
                return s3.uploadFile(s3Params);
            })
            .then(() => {

                let cfnStackCheckParams = {
                    "StackName": stackName
                };

                let cfnStackCreateParams = {
                    "StackName": stackName,
                    "TemplateURL": templateURL
                };
                let cfnModel = this.cfn;
                let context = this.context;

                return new Promise((resolve, reject) => {
                    cfnModel.describeStacks(cfnStackCheckParams, function(err, data) {
                        let cfnCompleteStatus = 'stackCreateComplete';
                        if (err != null && err.statusCode === 400) {
                            cfnModel.createStack(cfnStackCreateParams, function(err, data) {
                                if (err) {
                                    console.log("Error for " + category + ":" + resourceName);
                                    console.log(err, err.stack);
                                    resolve();
                                }
                                cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, function(err, data) {
                                    if (err) {
                                        console.log("Error for " + category + ":" + resourceName);
                                        console.log(err, err.stack);
                                        resolve();
                                    } else {
                                        console.log(data.Stacks[0].Outputs);
                                        let options = Object.assign({}, formatOutputs(data.Stacks[0].Outputs));
                                        options.stackName = stackName;
                                        options.s3TemplateURL = templateURL;
                                        context.awsmobile.updateAwsMobileMetaAfterResourceUpdate(category, resourceName, options);
                                        resolve();
                                    }

                                });
                            });
                        } else {
                            cfnModel.updateStack(cfnStackCreateParams, function(err, data) {
                                cfnCompleteStatus = 'stackUpdateComplete';
                                if (err) {
                                    console.log("Error for " + category + ":" + resourceName);
                                    console.log(err, err.stack);
                                    resolve();
                                }
                                cfnModel.waitFor(cfnCompleteStatus, cfnStackCheckParams, function(err, data) {
                                    if (err) {
                                        console.log("Error for " + category + ":" + resourceName);
                                        console.log(err, err.stack);
                                        resolve();
                                    } else {
                                        console.log(data.Stacks[0].Outputs);
                                        let options = Object.assign({}, formatOutputs(data.Stacks[0].Outputs));
                                        options.stackName = stackName;
                                        options.s3TemplateURL = templateURL;
                                        context.awsmobile.updateAwsMobileMetaAfterResourceUpdate(category, resourceName, options);
                                        resolve();
                                    }
                                });
                            });
                        }

                    });
                });
            });
    }

    deleteResourceStack(dir, category, resourceName) {
        let projectDetails = this.context.awsmobile.getProjectDetails()
        let projectName = projectDetails.projectConfig.ProjectName;
        let stackName = projectName + '-' + category + '-' + resourceName;

        let cfnStackParams = {
            "StackName": stackName
        };

        let cfnModel = this.cfn;
        let context = this.context;

        return new Promise((resolve, reject) => {
            cfnModel.describeStacks(cfnStackParams, function(err, data) {
                let cfnDeleteStatus = 'stackCreateComplete';
                if (err != null && err.statusCode === 400) {
                    // Stack doesn't exist, remove resource from current cloud awsmobile-meta
                    context.awsmobile.updateAwsMobileMetaAfterResourceDelete(category, resourceName);

                } else {
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
                                // Remove resource from current cloud awsmobile-meta
                                context.awsmobile.updateAwsMobileMetaAfterResourceDelete(category, resourceName);
                                resolve();
                            }
                        });
                    });
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