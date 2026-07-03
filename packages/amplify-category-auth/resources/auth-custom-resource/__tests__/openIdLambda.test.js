/* eslint-disable @typescript-eslint/no-var-requires */

// In-memory IAM OIDC provider state driven by the mocked client.
// Must be prefixed with `mock` so jest allows referencing it inside the jest.mock factory.
let mockState = { providers: {} };

jest.mock(
  'cfn-response',
  () => ({
    SUCCESS: 'SUCCESS',
    FAILED: 'FAILED',
    send: jest.fn((event, context, status, data) => {
      context.__result = { status, data };
    }),
  }),
  { virtual: true },
);

jest.mock(
  '@aws-sdk/client-iam',
  () => {
    class NoSuchEntityException extends Error {
      constructor(message) {
        super(message);
        this.name = 'NoSuchEntityException';
      }
    }
    const mkCmd = (name) =>
      class {
        constructor(input) {
          this.input = input;
          this.__name = name;
        }
      };
    const send = jest.fn(async (cmd) => {
      switch (cmd.__name) {
        case 'List':
          return { OpenIDConnectProviderList: Object.keys(mockState.providers).map((Arn) => ({ Arn })) };
        case 'Create': {
          const host = cmd.input.Url.replace('https://', '');
          const Arn = `arn:aws:iam::123456789012:oidc-provider/${host}`;
          mockState.providers[Arn] = { ClientIDList: [...cmd.input.ClientIDList] };
          return { OpenIDConnectProviderArn: Arn };
        }
        case 'Get': {
          const p = mockState.providers[cmd.input.OpenIDConnectProviderArn];
          if (!p) throw new NoSuchEntityException('no provider');
          return { ClientIDList: [...p.ClientIDList] };
        }
        case 'Add': {
          const p = mockState.providers[cmd.input.OpenIDConnectProviderArn];
          if (!p) throw new NoSuchEntityException('no provider');
          if (!p.ClientIDList.includes(cmd.input.ClientID)) p.ClientIDList.push(cmd.input.ClientID);
          return {};
        }
        case 'Remove': {
          const p = mockState.providers[cmd.input.OpenIDConnectProviderArn];
          if (!p) throw new NoSuchEntityException('no provider');
          const i = p.ClientIDList.indexOf(cmd.input.ClientID);
          if (i === -1) throw new NoSuchEntityException('no client id');
          p.ClientIDList.splice(i, 1);
          return {};
        }
        case 'Delete': {
          if (!mockState.providers[cmd.input.OpenIDConnectProviderArn]) throw new NoSuchEntityException('no provider');
          delete mockState.providers[cmd.input.OpenIDConnectProviderArn];
          return {};
        }
        default:
          throw new Error(`unexpected command ${cmd.__name}`);
      }
    });
    return {
      NoSuchEntityException,
      IAMClient: jest.fn(() => ({ send })),
      ListOpenIDConnectProvidersCommand: mkCmd('List'),
      CreateOpenIDConnectProviderCommand: mkCmd('Create'),
      GetOpenIDConnectProviderCommand: mkCmd('Get'),
      AddClientIDToOpenIDConnectProviderCommand: mkCmd('Add'),
      RemoveClientIDFromOpenIDConnectProviderCommand: mkCmd('Remove'),
      DeleteOpenIDConnectProviderCommand: mkCmd('Delete'),
      __send: send,
    };
  },
  { virtual: true },
);

const iamMock = require('@aws-sdk/client-iam');
const { handler } = require('../openIdLambda');

const GOOGLE_OIDC_URL = 'https://accounts.google.com';

// The handler is intentionally fire-and-forget (returns void, calls cfn-response.send when done).
// Flush pending microtasks until cfn-response.send populates the result.
async function invoke(event) {
  const context = {};
  handler(event, context);
  for (let i = 0; i < 100 && !context.__result; i++) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setImmediate(r));
  }
  if (!context.__result) {
    throw new Error('handler never called response.send');
  }
  return context.__result;
}

describe('openIdLambda custom resource', () => {
  beforeEach(() => {
    mockState = { providers: {} };
    iamMock.__send.mockClear();
  });

  it('creates the OIDC provider on Create', async () => {
    const res = await invoke({ RequestType: 'Create', ResourceProperties: { clientIdList: 'a,b', url: GOOGLE_OIDC_URL } });
    expect(res.status).toBe('SUCCESS');
    const arns = Object.keys(mockState.providers);
    expect(arns).toHaveLength(1);
    expect(mockState.providers[arns[0]].ClientIDList).toEqual(['a', 'b']);
  });

  it('deletes the OIDC provider on Delete when this stack is the sole owner', async () => {
    await invoke({ RequestType: 'Create', ResourceProperties: { clientIdList: 'a,b', url: GOOGLE_OIDC_URL } });
    const res = await invoke({ RequestType: 'Delete', ResourceProperties: { clientIdList: 'a,b', url: GOOGLE_OIDC_URL } });
    expect(res.status).toBe('SUCCESS');
    expect(Object.keys(mockState.providers)).toHaveLength(0);
  });

  it('retains a shared provider and removes only this stacks client IDs on Delete', async () => {
    // Our stack registers 'a'; a second stack sharing the account-global provider registers
    // 'otherApp' (a real Create that finds the existing provider and adds its client ID).
    await invoke({ RequestType: 'Create', ResourceProperties: { clientIdList: 'a', url: GOOGLE_OIDC_URL } });
    await invoke({ RequestType: 'Create', ResourceProperties: { clientIdList: 'otherApp', url: GOOGLE_OIDC_URL } });
    const arn = Object.keys(mockState.providers)[0];
    expect(mockState.providers[arn].ClientIDList).toEqual(['a', 'otherApp']);

    const res = await invoke({ RequestType: 'Delete', ResourceProperties: { clientIdList: 'a', url: GOOGLE_OIDC_URL } });
    expect(res.status).toBe('SUCCESS');
    expect(Object.keys(mockState.providers)).toHaveLength(1);
    expect(mockState.providers[arn].ClientIDList).toEqual(['otherApp']);
  });

  it('is idempotent when the provider is already gone', async () => {
    const res = await invoke({ RequestType: 'Delete', ResourceProperties: { clientIdList: 'a', url: GOOGLE_OIDC_URL } });
    expect(res.status).toBe('SUCCESS');
    expect(Object.keys(mockState.providers)).toHaveLength(0);
  });

  it('appends new client IDs to the existing provider on Update', async () => {
    await invoke({ RequestType: 'Create', ResourceProperties: { clientIdList: 'a', url: GOOGLE_OIDC_URL } });
    const res = await invoke({ RequestType: 'Update', ResourceProperties: { clientIdList: 'a,b', url: GOOGLE_OIDC_URL } });
    expect(res.status).toBe('SUCCESS');
    const arn = Object.keys(mockState.providers)[0];
    expect(mockState.providers[arn].ClientIDList).toEqual(['a', 'b']);
  });

  it('deletes the provider when a concurrent stack empties it during our Delete', async () => {
    // Provider is shared: our client ID is 'a', another stack owns 'b'.
    await invoke({ RequestType: 'Create', ResourceProperties: { clientIdList: 'a,b', url: GOOGLE_OIDC_URL } });
    const arn = Object.keys(mockState.providers)[0];

    // Simulate the other stack removing 'b' concurrently, in between our initial read and our
    // own removal, by piggy-backing on the RemoveClientID call for 'a'.
    const defaultImpl = iamMock.__send.getMockImplementation();
    iamMock.__send.mockImplementation(async (cmd) => {
      const result = await defaultImpl(cmd);
      if (cmd.__name === 'Remove' && cmd.input.ClientID === 'a') {
        const p = mockState.providers[arn];
        if (p) p.ClientIDList = p.ClientIDList.filter((id) => id !== 'b');
      }
      return result;
    });

    const res = await invoke({ RequestType: 'Delete', ResourceProperties: { clientIdList: 'a', url: GOOGLE_OIDC_URL } });
    iamMock.__send.mockImplementation(defaultImpl);

    expect(res.status).toBe('SUCCESS');
    // Provider had ['a','b'] at first read (remaining 'b' looked non-empty), but 'b' was removed
    // concurrently; the re-read must observe the empty list and delete the provider.
    expect(Object.keys(mockState.providers)).toHaveLength(0);
  });
});
