const response = require('cfn-response');
const {
  IAMClient,
  AddClientIDToOpenIDConnectProviderCommand,
  CreateOpenIDConnectProviderCommand,
  DeleteOpenIDConnectProviderCommand,
  GetOpenIDConnectProviderCommand,
  ListOpenIDConnectProvidersCommand,
  RemoveClientIDFromOpenIDConnectProviderCommand,
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

// Returns the ARN of the OIDC provider matching the given url, or undefined if none exists.
async function findProviderArn(url) {
  if (!url) {
    return undefined;
  }
  const providerHost = new URL(url).host;
  const listOpenIDConnectProvidersResponse = await iam.send(new ListOpenIDConnectProvidersCommand({}));
  const providers = listOpenIDConnectProvidersResponse.OpenIDConnectProviderList || [];
  // OIDC provider ARNs look like arn:aws:iam::<account>:oidc-provider/<host>
  const match = providers.find((p) => p.Arn && p.Arn.endsWith(`:oidc-provider/${providerHost}`));
  return match ? match.Arn : undefined;
}

async function handleEvent(event) {
  const clientIdList = event.ResourceProperties.clientIdList ? event.ResourceProperties.clientIdList.split(',') : [];
  const url = event.ResourceProperties.url;

  if (event.RequestType === 'Update' || event.RequestType === 'Create') {
    const params = {
      ClientIDList: clientIdList,
      ThumbprintList: ['0000000000000000000000000000000000000000'],
      Url: url,
    };
    const existingValue = await findProviderArn(url);
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

  if (event.RequestType === 'Delete') {
    // Clean up the OIDC provider on stack teardown. The provider is account-global and
    // keyed by URL, so it can be shared by other Amplify environments/apps in the same
    // account. To avoid breaking those, we only remove the client IDs this resource
    // registered and delete the provider itself once no client IDs remain. All calls
    // tolerate an already-removed provider/client ID so the handler stays idempotent.
    try {
      const existingValue = await findProviderArn(url);
      if (!existingValue) {
        return {};
      }
      const getOpenIDConnectProviderResponse = await iam.send(
        new GetOpenIDConnectProviderCommand({ OpenIDConnectProviderArn: existingValue }),
      );
      const currentAudiences = getOpenIDConnectProviderResponse.ClientIDList || [];
      const remainingAudiences = currentAudiences.filter((clientID) => !clientIdList.includes(clientID));
      if (remainingAudiences.length === 0) {
        // Our client IDs appear to be the only ones. Re-read immediately before deleting so we do
        // not destroy a provider that another stack concurrently added client IDs to (or re-created)
        // between our first read and the delete.
        const refreshed = await iam.send(new GetOpenIDConnectProviderCommand({ OpenIDConnectProviderArn: existingValue }));
        const refreshedRemaining = (refreshed.ClientIDList || []).filter((clientID) => !clientIdList.includes(clientID));
        if (refreshedRemaining.length === 0) {
          await iam.send(new DeleteOpenIDConnectProviderCommand({ OpenIDConnectProviderArn: existingValue }));
        } else {
          // A concurrent stack added client IDs after our first read; only drop ours.
          for (const clientID of clientIdList) {
            if ((refreshed.ClientIDList || []).includes(clientID)) {
              await iam.send(
                new RemoveClientIDFromOpenIDConnectProviderCommand({
                  ClientID: clientID,
                  OpenIDConnectProviderArn: existingValue,
                }),
              );
            }
          }
        }
      } else {
        // Provider is still used by other client IDs (another Amplify app); only drop ours.
        for (const clientID of clientIdList) {
          if (currentAudiences.includes(clientID)) {
            await iam.send(
              new RemoveClientIDFromOpenIDConnectProviderCommand({
                ClientID: clientID,
                OpenIDConnectProviderArn: existingValue,
              }),
            );
          }
        }
        // Re-read after removing our client IDs. If another stack sharing this provider
        // removed its client IDs concurrently, the provider is now empty and would otherwise
        // be left orphaned with zero client IDs, so delete it here.
        const refreshed = await iam.send(new GetOpenIDConnectProviderCommand({ OpenIDConnectProviderArn: existingValue }));
        if ((refreshed.ClientIDList || []).length === 0) {
          await iam.send(new DeleteOpenIDConnectProviderCommand({ OpenIDConnectProviderArn: existingValue }));
        }
      }
    } catch (e) {
      // NoSuchEntity means the provider (or client ID) is already gone; treat as success.
      if (e.name !== 'NoSuchEntityException') {
        throw e;
      }
    }
    return {};
  }

  return {};
}
