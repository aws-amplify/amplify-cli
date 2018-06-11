var aws = require("./aws.js");

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

        let bucketName = s3Params.Bucket;

        return this.createBucket(bucketName)
            .then(() => {
                return this.s3.putObject(s3Params).promise();
            });
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
                        .then(() => this.s3.waitFor('bucketExists', params).promise())
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