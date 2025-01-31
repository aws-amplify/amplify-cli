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
  void tryHandleEvent(event, context);
};

async function tryHandleEvent(event, context) {
  try {
    const res = await handleEvent(event);
    response.send(event, context, response.SUCCESS, res);
  } catch (e) {
    response.send(event, context, response.FAILED, { e });
  }
}

async function handleEvent(event) {
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
      return {
        providerArn: createOpenIDConnectProviderResponse.OpenIDConnectProviderArn,
        providerIds: params.ClientIDList,
      };
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
      return {
        providerArn: existingValue,
        providerIds: params.ClientIDList,
      };
    }
  }
  return {};
}
