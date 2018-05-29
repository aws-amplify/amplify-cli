var aws =  require("./aws.js");

class S3 {
    constructor() {
        return aws.configureWithCreds()
            .then((awsItem) => {
                return new awsItem.S3();
            });
    }
}

module.exports = S3;