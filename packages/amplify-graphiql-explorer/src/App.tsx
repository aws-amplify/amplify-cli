import GraphiQL from 'graphiql';
import GraphiQLExplorer from 'graphiql-explorer';
import 'graphiql/graphiql.css';
import { buildClientSchema, getIntrospectionQuery, GraphQLSchema, parse } from 'graphql';
import { Component } from 'react';
import 'semantic-ui-css/semantic.min.css';
import './App.css';
import { AuthModal, AUTH_MODE } from './AuthModal';
import { ClearDataModal } from './ClearDataModal';
import { refreshToken } from './utils/jwt';

const DEFAULT_COGNITO_JWT_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZDhjYTUyOC00OTMxLTQyNTQtOTI3My1lYTVlZTg1M2YyNzEiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbS91cy1lYXN0LTFfZmFrZSIsInBob25lX251bWJlcl92ZXJpZmllZCI6dHJ1ZSwiY29nbml0bzp1c2VybmFtZSI6InVzZXIxIiwiYXVkIjoiMmhpZmEwOTZiM2EyNG12bTNwaHNrdWFxaTMiLCJldmVudF9pZCI6ImIxMmEzZTJmLTdhMzYtNDkzYy04NWIzLTIwZDgxOGJkNzhhMSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxOTc0MjY0NDEyLCJwaG9uZV9udW1iZXIiOiIrMTIwNjIwNjIwMTYiLCJleHAiOjE1NjQyNjgwMTIsImlhdCI6MTU2NDI2NDQxMywiZW1haWwiOiJ1c2VyQGRvbWFpbi5jb20ifQ.wHKY2KIhvWn4zpJ4TZ1vS3zRE9mGWsLY4NCV2Cof17Q`;
const DEFAULT_OIDC_JWT_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyMSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczovL3NvbWUtb2lkYy1wcm92aWRlci9hdXRoIiwicGhvbmVfbnVtYmVyX3ZlcmlmaWVkIjp0cnVlLCJhdWQiOiIyaGlmYTA5NmIzYTI0bXZtM3Boc2t1YXFpMyIsImV2ZW50X2lkIjoiYjEyYTNlMmYtN2EzNi00OTNjLTg1YjMtMjBkODE4YmQ3OGExIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE5NzQyNjQ0MTIsInBob25lX251bWJlciI6IisxMjA2MjA2MjAxNiIsImV4cCI6MTU2NDI2ODAxMiwiaWF0IjoxNTY0MjY0NDEzLCJlbWFpbCI6InVzZXJAZG9tYWluLmNvbSJ9.uAegFXomOnA7Dkl-5FcS5icu5kL9Juqb81GnTrOZZqM`;

const AUTH_TYPE_TO_NAME = {
  AMAZON_COGNITO_USER_POOLS: 'User Pool',
  API_KEY: 'API Key',
  OPENID_CONNECT: 'Open ID',
  AWS_IAM: 'IAM',
};

type AmplifyAppSyncSimulatorAuthInfo = {
  authenticationType: string;
};
type AmplifyAppSyncSimulatorApiInfo = {
  name: string;
  defaultAuthenticationType: AmplifyAppSyncSimulatorAuthInfo;
  apiKey: string;
  additionalAuthenticationProviders: AmplifyAppSyncSimulatorAuthInfo[];
  authAccessKeyId?: string;
};
const DEFAULT_API_INFO: AmplifyAppSyncSimulatorApiInfo = {
  name: 'AppSyncTransformer',
  defaultAuthenticationType: {
    authenticationType: 'API_KEY',
  },
  additionalAuthenticationProviders: [],
  apiKey: 'da2-fakeApiId123456',
};

const LOCAL_STORAGE_KEY_NAMES = {
  cognitoToken: 'AMPLIFY_GRPAHIQL_EXPLORER_COGNITO_JWT_TOKEN',
  oidcToken: 'AMPLIFY_GRPAHIQL_EXPLORER_OIDC_JWT_TOKEN',
  apiKey: 'AMPLIFY_GRPAHIQL_EXPLORER_API_KEY',
  iam: 'AMPLIFY_GRPAHIQL_EXPLORER_AWS_IAM',
  iamRole: 'AMPLIFY_GRPAHIQL_EXPLORER_AWS_IAM_ROLE',
};

function getAPIInfo() {
  return fetch('/api-config').then((response) => response.json());
}

// Calls clear-data endpoint to clear all data in the local database
function clearData() {
  return fetch('/clear-data', { method: 'DELETE' }).then((response) => response.json());
}

function fetcher(params: Object, additionalHeaders): Promise<any> {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };
  return fetch('/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (responseBody) {
      try {
        return JSON.parse(responseBody);
      } catch (e) {
        return responseBody;
      }
    });
}

const DEFAULT_QUERY = `# shift-option/alt-click on a query below to jump to it in the explorer
# option/alt-click on a field in the explorer to select all subfields
`;

type State = {
  schema?: GraphQLSchema | null;
  query?: string;
  explorerIsOpen: boolean;
  authModalVisible: boolean;
  clearDataModalVisible: boolean;
  jwtToken?: string;
  apiKey?: string;
  apiInfo: AmplifyAppSyncSimulatorApiInfo;
  currentAuthMode: AUTH_MODE;
  credentials: {
    apiKey?: string;
    cognitoJWTToken?: string;
    oidcJWTToken?: string;
    iamRole?: 'Auth' | 'UnAuth';
  };
  clearResponse?: string;
};

class App extends Component<{}, State> {
  _graphiql?: GraphiQL;
  state: State = {
    schema: null,
    query: DEFAULT_QUERY,
    explorerIsOpen: true,
    authModalVisible: false,
    clearDataModalVisible: false,
    apiInfo: DEFAULT_API_INFO,
    currentAuthMode: AUTH_MODE.API_KEY,
    credentials: {
      apiKey: '',
      cognitoJWTToken: '',
      oidcJWTToken: '',
      iamRole: 'UnAuth',
    },
  };

  constructor(props) {
    super(props);
    this.fetch = this.fetch.bind(this);
  }
  async componentDidMount() {
    const apiInfo = await getAPIInfo();
    await this.loadCredentials(apiInfo);
    this.setState({ apiInfo });
    const introspectionResult = await this.fetch({
      query: getIntrospectionQuery(),
    });

    const editor = this._graphiql?.getQueryEditor();
    editor?.setOption('extraKeys', {
      ...(editor.options.extraKeys || {}),
      'Shift-Alt-LeftClick': this._handleInspectOperation,
    });
    if (introspectionResult && introspectionResult.data) {
      this.setState({ schema: buildClientSchema(introspectionResult.data) });
    }
  }

  toggleAuthModal = () =>
    this.setState((prevState) => ({
      authModalVisible: !prevState.authModalVisible,
    }));

  toggleClearDataModal = () =>
    this.setState((prevState) => ({
      clearDataModalVisible: !prevState.clearDataModalVisible,
    }));

  hideDataModal = () => {
    this.setState({ clearDataModalVisible: false });
  };

  clearDataAndShowMessage = async () => {
    this.setState({ clearDataModalVisible: false });
    this.setState({ clearResponse: JSON.stringify(await clearData(), undefined, 2) });
    setTimeout(() => {
      this.setState({ clearResponse: '' });
    }, 8000);
  };

  switchAuthMode = (val) => {
    this.setState({ currentAuthMode: val });
  };
  _handleInspectOperation = (cm: any, mousePos: { line: Number; ch: Number }) => {
    const parsedQuery = parse(this.state.query || '');

    if (!parsedQuery) {
      console.error("Couldn't parse query document");
      return null;
    }

    var token = cm.getTokenAt(mousePos);
    var start = { line: mousePos.line, ch: token.start };
    var end = { line: mousePos.line, ch: token.end };
    var relevantMousePos = {
      start: cm.indexFromPos(start),
      end: cm.indexFromPos(end),
    };

    var position = relevantMousePos;

    var def = parsedQuery.definitions.find((definition) => {
      if (!definition.loc) {
        console.log('Missing location information for definition');
        return false;
      }

      const { start, end } = definition.loc;
      return start <= position.start && end >= position.end;
    });

    if (!def) {
      console.error(`Unable to find definition corresponding position at ${position.start}`);
      return null;
    }

    var operationKind = def.kind === 'OperationDefinition' ? def.operation : def.kind === 'FragmentDefinition' ? 'fragment' : 'unknown';

    var operationName =
      def.kind === 'OperationDefinition' && !!def.name
        ? def.name.value
        : def.kind === 'FragmentDefinition' && !!def.name
        ? def.name.value
        : 'unknown';

    var selector = `.graphiql-explorer-root #${operationKind}-${operationName}`;

    var el = document.querySelector(selector);
    el && el.scrollIntoView();
  };

  _handleEditQuery = (query: string | undefined): void => this.setState({ query });

  _handleToggleExplorer = () => {
    this.setState({ explorerIsOpen: !this.state.explorerIsOpen });
  };

  fetch(params) {
    const headers = {};
    if (this.state.currentAuthMode === AUTH_MODE.API_KEY) {
      headers['x-api-key'] = this.state.credentials.apiKey;
    } else if (this.state.currentAuthMode === AUTH_MODE.AMAZON_COGNITO_USER_POOLS) {
      headers['Authorization'] = this.state.credentials.cognitoJWTToken;
    } else if (this.state.currentAuthMode === AUTH_MODE.OPENID_CONNECT) {
      headers['Authorization'] = this.state.credentials.oidcJWTToken;
    } else if (this.state.currentAuthMode === AUTH_MODE.AWS_IAM) {
      const { iamRole } = this.state.credentials;
      const iamAccessKeyId = iamRole === 'Auth' ? this.state.apiInfo.authAccessKeyId || 'ASIAVJKIAM-AuthRole' : 'ASIAVJKI-UnAuthRole';

      headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${iamAccessKeyId}/${new Date().toISOString()}/aws-fake/service`;
    }
    return fetcher(params, headers);
  }

  storeCredentials(credentials) {
    const newState = {};
    if (credentials.authMode === 'API_KEY') {
      newState['apiKey'] = credentials.apiKey;
      window.localStorage.setItem(LOCAL_STORAGE_KEY_NAMES.apiKey, credentials.apiKey);
    } else if (credentials.authMode === AUTH_MODE.AMAZON_COGNITO_USER_POOLS) {
      newState['cognitoJWTToken'] = credentials.cognitoToken;
      window.localStorage.setItem(LOCAL_STORAGE_KEY_NAMES.cognitoToken, credentials.cognitoToken);
    } else if (credentials.authMode === AUTH_MODE.OPENID_CONNECT) {
      newState['oidcJWTToken'] = credentials.OIDCToken;
      window.localStorage.setItem(LOCAL_STORAGE_KEY_NAMES.oidcToken, credentials.OIDCToken);
    } else if (credentials.authMode === AUTH_MODE.AWS_IAM) {
      newState['iamRole'] = credentials.iamRole;
      window.localStorage.setItem(LOCAL_STORAGE_KEY_NAMES.iamRole, credentials.iamRole);
    }

    this.setState((prevState) => ({
      ...prevState,
      credentials: {
        ...prevState.credentials,
        ...newState,
      },
      currentAuthMode: credentials.authMode,
    }));
  }

  async loadCredentials(apiInfo = this.state.apiInfo) {
    const credentials = {};
    const authProviders = [apiInfo.defaultAuthenticationType, ...apiInfo.additionalAuthenticationProviders];
    const possibleAuth = authProviders.map((auth) => auth.authenticationType);

    if (possibleAuth.includes('API_KEY')) {
      credentials['apiKey'] = DEFAULT_API_INFO.apiKey;
    }

    if (possibleAuth.includes('AMAZON_COGNITO_USER_POOLS')) {
      let token = window.localStorage.getItem(LOCAL_STORAGE_KEY_NAMES.cognitoToken);
      if (token) {
        credentials['cognitoJWTToken'] = await refreshToken(token);
      } else {
        console.warn('Invalid Cognito token found in local storage. Using the default OIDC token');
        // token is not valid
        credentials['cognitoJWTToken'] = await refreshToken(DEFAULT_COGNITO_JWT_TOKEN);
      }
    }

    if (possibleAuth.includes('OPENID_CONNECT')) {
      const issuers = authProviders
        .filter((auth) => auth.authenticationType === AUTH_MODE.OPENID_CONNECT)
        .map((auth: any) => auth.openIDConnectConfig.Issuer);
      try {
        credentials['oidcJWTToken'] = await refreshToken(window.localStorage.getItem(LOCAL_STORAGE_KEY_NAMES.oidcToken) || '', issuers[0]);
      } catch (e) {
        console.warn('Invalid OIDC token found in local storage. Using the default OIDC token');
        credentials['oidcJWTToken'] = await refreshToken(DEFAULT_OIDC_JWT_TOKEN, issuers[0]);
      }
    }

    if (possibleAuth.includes('AWS_IAM')) {
      credentials['iamRole'] = window.localStorage.getItem(LOCAL_STORAGE_KEY_NAMES.iamRole) || 'auth';
    }

    this.setState(() => ({
      currentAuthMode: AUTH_MODE[apiInfo.defaultAuthenticationType.authenticationType] || AUTH_MODE.API_KEY,
    }));
    this.setState({ credentials });
    return credentials;
  }

  render() {
    const { query, schema, authModalVisible, apiInfo, clearDataModalVisible, clearResponse } = this.state;
    const authModes = [
      AUTH_MODE[apiInfo.defaultAuthenticationType.authenticationType],
      ...apiInfo.additionalAuthenticationProviders.map((auth) => AUTH_MODE[auth.authenticationType]),
    ].filter((auth) => auth);
    const authModal = authModalVisible ? (
      <AuthModal
        selectedAuthMode={this.state.currentAuthMode}
        currentOIDCToken={this.state.credentials.oidcJWTToken}
        currentCognitoToken={this.state.credentials.cognitoJWTToken}
        apiKey={this.state.credentials.apiKey}
        iamRole={this.state.credentials.iamRole}
        authModes={authModes}
        onClose={(credentials) => {
          this.storeCredentials(credentials);
          this.setState({ authModalVisible: false });
        }}
      />
    ) : null;

    const clearDataModal = clearDataModalVisible ? (
      <ClearDataModal onClose={this.hideDataModal} onClear={this.clearDataAndShowMessage} />
    ) : null;

    const buttons = [
      {
        onClick: () => this._graphiql?.handlePrettifyQuery(),
        label: 'Prettify',
        title: 'Prettify Query (Shift-Ctrl-P)',
      },
      {
        onClick: () => this._graphiql?.handleToggleHistory(),
        label: 'History',
        title: 'Show History',
      },
      {
        onClick: this._handleToggleExplorer,
        label: 'Explorer',
        title: 'Toggle Explorer',
      },
      {
        onClick: this.toggleAuthModal,
        label: 'Update Auth',
        title: 'Auth Setting',
      },
      {
        onClick: this.toggleClearDataModal,
        label: 'Clear data',
        title: 'Clear Mock Data',
      },
    ];

    return (
      <>
        {authModal}
        {clearDataModal}
        <div className="graphiql-container">
          <GraphiQLExplorer
            schema={schema}
            query={query}
            onEdit={this._handleEditQuery}
            onRunOperation={(operationName) => this._graphiql?.handleRunQuery(operationName)}
            explorerIsOpen={this.state.explorerIsOpen}
            onToggleExplorer={this._handleToggleExplorer}
          />
          <GraphiQL
            ref={(ref) => (this._graphiql = ref as GraphiQL)}
            fetcher={this.fetch}
            schema={schema!}
            query={query}
            onEditQuery={this._handleEditQuery}
            response={clearResponse}
          >
            <GraphiQL.Toolbar>
              {buttons.map((button, index) => (
                <GraphiQL.Button key={index} onClick={button.onClick} label={button.label} title={button.title} />
              ))}
              <GraphiQL.Menu
                label={`Auth - ${AUTH_TYPE_TO_NAME[this.state.currentAuthMode]}${
                  this.state.currentAuthMode === 'AWS_IAM' ? `(${this.state.credentials.iamRole} Role)` : ''
                }`}
                title={AUTH_TYPE_TO_NAME[this.state.currentAuthMode]}
              >
                {authModes.map((mode, index) => (
                  <GraphiQL.MenuItem
                    key={index}
                    title={AUTH_TYPE_TO_NAME[mode]}
                    label={`Use: ${AUTH_TYPE_TO_NAME[mode]}`}
                    onSelect={() => this.switchAuthMode(mode)}
                  />
                ))}
              </GraphiQL.Menu>
            </GraphiQL.Toolbar>
          </GraphiQL>
        </div>
      </>
    );
  }
}

export default App;
