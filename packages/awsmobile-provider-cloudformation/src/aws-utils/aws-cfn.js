var aws =  require("./aws.js");

class CloudFormation {
    constructor() {
        return aws.configureWithCreds()
            .then((awsItem) => {
                return new awsItem.CloudFormation();
            });
    }
}

module.exports = CloudFormation;