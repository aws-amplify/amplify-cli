const response = require('cfn-response');
const {
  IAMClient,
  AddClientIDToOpenIDConnectProviderCommand,
  CreateOpenIDConnectProviderCommand,
  GetOpenIDConnectProviderCommand,
  ListOpenIDConnectProvidersCommand,
} = require('@aws-sdk/client-iam');
const iam = new IAMClient({});

exports.handler = (event, context) => {
  // Don't return promise, response.send() marks context as done internally
  const ignoredPromise = handleEvent(event, context);
};

async function handleEvent(event, context) {
  try {
    if (event.RequestType === 'Update' || event.RequestType === 'Create') {
      const params = {
        ClientIDList: event.ResourceProperties.clientIdList.split(','),
        ThumbprintList: ['0000000000000000000000000000000000000000'],
        Url: event.ResourceProperties.url,
      };
      let existingValue;
      const listOpenIDConnectProvidersResponse = await iam.send(new ListOpenIDConnectProvidersCommand({}));
      if (
        listOpenIDConnectProvidersResponse.OpenIDConnectProviderList &&
        listOpenIDConnectProvidersResponse.OpenIDConnectProviderList.length > 0
      ) {
        const vals = listOpenIDConnectProvidersResponse.OpenIDConnectProviderList.map((x) => x.Arn);
        existingValue = vals.find((i) => i.split('/')[1] === params.Url.split('//')[1]);
      }
      if (!existingValue) {
        const createOpenIDConnectProviderResponse = await iam.send(new CreateOpenIDConnectProviderCommand(params));
        response.send(event, context, response.SUCCESS, {
          providerArn: createOpenIDConnectProviderResponse.OpenIDConnectProviderArn,
          providerIds: params.ClientIDList,
        });
        return;
      } else {
        const findParams = {
          OpenIDConnectProviderArn: existingValue,
        };
        const getOpenIDConnectProviderResponse = await iam.send(new GetOpenIDConnectProviderCommand(findParams));
        const audiences = getOpenIDConnectProviderResponse.ClientIDList;
        for (const clientID of params.ClientIDList) {
          if (!audiences.includes(clientID)) {
            const updateParams = {
              ClientID: clientID,
              OpenIDConnectProviderArn: existingValue,
            };
            await iam.send(new AddClientIDToOpenIDConnectProviderCommand(updateParams));
          }
        }
        response.send(event, context, response.SUCCESS, {
          providerArn: existingValue,
          providerIds: params.ClientIDList,
        });
        return;
      }
    }
    response.send(event, context, response.SUCCESS, {});
  } catch (err) {
    response.send(event, context, response.FAILED, { err });
  }
}
