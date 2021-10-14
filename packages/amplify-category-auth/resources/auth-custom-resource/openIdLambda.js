const response = require('cfn-response');
const aws = require('aws-sdk');
const iam = new aws.IAM();
exports.handler = (event, context) => {
  if (event.RequestType == 'Delete') {
    response.send(event, context, response.SUCCESS, {});
  }
  if (event.RequestType == 'Update' || event.RequestType == 'Create') {
    const params = {
      ClientIDList: event.ResourceProperties.clientIdList.split(','),
      ThumbprintList: ['0000000000000000000000000000000000000000'],
      Url: event.ResourceProperties.url,
    };
    let exists = false;
    let existingValue;
    iam
      .listOpenIDConnectProviders({})
      .promise()
      .then(data => {
        if (data.OpenIDConnectProviderList && data.OpenIDConnectProviderList.length > 0) {
          const vals = data.OpenIDConnectProviderList.map(x => x.Arn);
          existingValue = vals.find(i => i.split('/')[1] === params.Url.split('//')[1]);
          if (!existingValue) {
            exists = true;
          }
        }
        if (!existingValue) {
          iam
            .createOpenIDConnectProvider(params)
            .promise()
            .then(data => {
              response.send(event, context, response.SUCCESS, {
                providerArn: data.OpenIDConnectProviderArn,
                providerIds: params.ClientIDList,
              });
            })
            .catch(err => {
              response.send(event, context, response.FAILED, { err });
            });
        } else {
          const findParams = {
            OpenIDConnectProviderArn: existingValue,
          };
          iam
            .getOpenIDConnectProvider(findParams)
            .promise()
            .then(data => {
              const audiences = data.ClientIDList;
              const updateCalls = [];
              params.ClientIDList.forEach(a => {
                if (!audiences.includes(a)) {
                  const updateParams = {
                    ClientID: a,
                    OpenIDConnectProviderArn: existingValue,
                  };
                  const prom = iam.addClientIDToOpenIDConnectProvider(updateParams).promise();
                  updateCalls.push(prom);
                }
              });
              Promise.all(updateCalls)
                .then(function (values) {
                  response.send(event, context, response.SUCCESS, { providerArn: existingValue, providerIds: params.ClientIDList });
                })
                .catch(err3 => {
                  response.send(event, context, response.FAILED, { err3 });
                });
            })
            .catch(err2 => {
              response.send(event, context, response.FAILED, { err2 });
            });
        }
      })
      .catch(err1 => {
        response.send(event, context, response.FAILED, { err1 });
      });
  }
};
