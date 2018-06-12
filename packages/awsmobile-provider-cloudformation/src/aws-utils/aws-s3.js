const aws = require("./aws.js");
var shortid = require('shortid');
shortid.characters('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$@');
const providerName = require("../../constants").ProviderName;

class S3 {
    constructor(context) {
        return aws.configureWithCreds(context)
            .then((awsItem) => {
                this.context = context;
                this.s3 = new awsItem.S3();
                return this;
            });
    }

    uploadFile(s3Params) {
        // Create Bucket if not present
        // Then upload the files
        let projectDetails = this.context.awsmobile.getProjectDetails();
        let projectName = projectDetails.projectConfig.ProjectName;
        let projectBucket = projectDetails.awsmobileMeta.provider ? projectDetails.awsmobileMeta.provider[providerName].s3DeploymentBucket : '';
        let updateProjectConfigFile = false;

        if(!projectBucket) {
            updateProjectConfigFile = true;
            projectBucket = projectName.toLowerCase() + "-awsmobile-" + shortid.generate().toLowerCase();
        }

        s3Params.Bucket = projectBucket;

        return this.createBucket(projectBucket)
            .then(() => {
                if(updateProjectConfigFile) {
                    this.context.awsmobile.updateProviderAwsMobileMeta(providerName, {"s3DeploymentBucket": projectBucket});
                }
                return this.s3.putObject(s3Params).promise();
            })
            .then(() => projectBucket);

    }

    createBucket(bucketName) {
        // Check if bucket exists;
        let params = {
            Bucket: bucketName
        };

        return this.ifBucketExists(bucketName)
            .then((result) => {
                if (!result) {
                    this.context.print.warning('S3 Bucket to store cloudformation templates not present. Creating one for you....');
                    this.context.print.warning('Bucket name: ' + bucketName);

                    return this.s3.createBucket(params).promise()
                        .then(() => {
                            this.s3.waitFor('bucketExists', params).promise()
                        })
                        .then(() => {
                            this.context.print.success('S3 Bucket sucessfully created');
                            return bucketName;
                        });
                }
            });

    }

    ifBucketExists(bucketName) {
        return this.s3.listBuckets({}).promise()
            .then((result) => {
                let index = result.Buckets.findIndex((bucket) => bucket.Name === bucketName);
                if (index != -1) {
                    return true;
                }
                return false;
            });
    }
}



module.exports = S3;