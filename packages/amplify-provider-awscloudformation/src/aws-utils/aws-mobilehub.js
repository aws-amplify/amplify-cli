const aws = require('./aws.js');

class Mobile {
  constructor(context) {
    return aws.configureWithCreds(context)
      .then((awsItem) => {
        this.context = context;
        this.mobile = new awsItem.Mobile();
        return this;
      });
  }
  getProjectResources(projectId) {
    const params = {
      projectId,
    };
    return this.mobile.describeProject(params).promise().then((result => result));
  }
}
module.exports = Mobile;
