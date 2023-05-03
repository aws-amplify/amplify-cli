const response = require('cfn-response');
const aws = require('aws-sdk');
const iam = new aws.IAM();

exports.handler = (event) => {
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
          .promise()
          .catch((err) => {
            console.log(err);

            if (err.name === 'NotFoundException') {
              return response.send(event, context, response.SUCCESS);
            }

            response.send(event, context, response.FAILED, { err });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      response.send(event, context, response.FAILED, { err });
    });
};
