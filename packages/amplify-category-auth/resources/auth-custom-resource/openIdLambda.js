const aws = require('aws-sdk');
const iam = new aws.IAM();

exports.handler = (event) => {
  if (event.RequestType == 'Update' || event.RequestType == 'Create') {
    iam
      .listOpenIDConnectProviders({})
      .promise()
      .then(async (data) => {
        let providerArn;

        if (data.OpenIDConnectProviderList && data.OpenIDConnectProviderList.length > 0) {
          const providerArns = data.OpenIDConnectProviderList.map((x) => x.Arn);
          providerArn = providerArns.find((i) => i.split('/')[1] === params.Url.split('//')[1]);
        }

        if (providerArn) {
          await iam
            .deleteOpenIDConnectProvider({ OpenIDConnectProviderArn: providerArn })
            .promise();
        }
      });
  }
};
