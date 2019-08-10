import React, { Component } from 'react';
import GraphiQL from 'graphiql';
import GraphiQLExplorer from 'graphiql-explorer';
import { buildClientSchema, getIntrospectionQuery, parse } from 'graphql';
import 'semantic-ui-css/semantic.min.css';
import { AuthModal } from './AuthModal';

import 'graphiql/graphiql.css';
import './App.css';

import { GraphQLSchema } from 'graphql';

const DEFAULT_JWT_TOKEN = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3ZDhjYTUyOC00OTMxLTQyNTQtOTI3My1lYTVlZTg1M2YyNzEiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbS91cy1lYXN0LTFfZmFrZSIsInBob25lX251bWJlcl92ZXJpZmllZCI6dHJ1ZSwiY29nbml0bzp1c2VybmFtZSI6InVzZXIxIiwiYXVkIjoiMmhpZmEwOTZiM2EyNG12bTNwaHNrdWFxaTMiLCJldmVudF9pZCI6ImIxMmEzZTJmLTdhMzYtNDkzYy04NWIzLTIwZDgxOGJkNzhhMSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxOTc0MjY0NDEyLCJwaG9uZV9udW1iZXIiOiIrMTIwNjIwNjIwMTYiLCJleHAiOjE1NjQyNjgwMTIsImlhdCI6MTU2NDI2NDQxMywiZW1haWwiOiJ1c2VyQGRvbWFpbi5jb20ifQ.wHKY2KIhvWn4zpJ4TZ1vS3zRE9mGWsLY4NCV2Cof17Q`;

const DEFAULT_API_INFO = {
  name: 'AppSyncTransformer',
  authenticationType: 'API_KEY',
  apiKey: 'da2-fakeApiId123456',
};

const LOCAL_STORAGE_KEY_NAMES = {
  jwtToken: 'AMPLIFY_GRPAHIQL_EXPLORER_JWT_TOKEN',
  apiKey: 'AMPLIFY_GRPAHIQL_EXPLORER_API_KEY',
};

function getAPIInfo() {
  return fetch('/api-config').then(response => response.json());
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
    .then(function(response) {
      return response.text();
    })
    .then(function(responseBody) {
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
  query: string;
  explorerIsOpen: boolean;
  authModalVisible: boolean;
  jwtToken?: string;
  apiKey?: string;
  apiInfo?: {};
};

class App extends Component<{}, State> {
  _graphiql: GraphiQL;
  state = {
    schema: null,
    query: DEFAULT_QUERY,
    explorerIsOpen: true,
    authModalVisible: false,
    apiInfo: DEFAULT_API_INFO,
    jwtToken: DEFAULT_JWT_TOKEN,
    apiKey: DEFAULT_API_INFO.apiKey,
  };

  constructor(props, ...rest) {
    super(props, ...rest);
    this.fetch = this.fetch.bind(this);
  }
  async componentDidMount() {
    const apiInfo = await getAPIInfo();
    this.loadCredentials(apiInfo);
    this.setState({ apiInfo });
    const introspectionResult = await this.fetch({
      query: getIntrospectionQuery(),
    });

    const editor = this._graphiql.getQueryEditor();
    editor.setOption('extraKeys', {
      ...(editor.options.extraKeys || {}),
      'Shift-Alt-LeftClick': this._handleInspectOperation,
    });
    if (introspectionResult && introspectionResult.data) {
      this.setState({ schema: buildClientSchema(introspectionResult.data) });
    }
  }

  toggleAuthModal = () =>
    this.setState({
      authModalVisible: !this.state.authModalVisible,
    });

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

    var def = parsedQuery.definitions.find(definition => {
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

    var operationKind =
      def.kind === 'OperationDefinition'
        ? def.operation
        : def.kind === 'FragmentDefinition'
        ? 'fragment'
        : 'unknown';

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

  _handleEditQuery = (query: string): void => this.setState({ query });

  _handleToggleExplorer = () => {
    this.setState({ explorerIsOpen: !this.state.explorerIsOpen });
  };

  fetch(params) {
    const headers = {};
    if (this.state.apiInfo.authenticationType === 'API_KEY') {
      headers['x-api-key'] = this.state.apiKey;
    } else {
      headers['Authorization'] = this.state.jwtToken;
    }
    return fetcher(params, headers);
  }

  storeCredentials(credentials) {
    const apiInfo = this.state.apiInfo;
    const newState = {
      apiInfo: { ...apiInfo, authenticationType: credentials.authMode },
    };
    if (credentials.authMode === 'API_KEY') {
      newState['apiKey'] = credentials.apiKey;
      window.localStorage.setItem(LOCAL_STORAGE_KEY_NAMES.apiKey, credentials.apiKey);
    } else {
      newState['jwtToken'] = credentials.jwtToken;
      window.localStorage.setItem(LOCAL_STORAGE_KEY_NAMES.jwtToken, credentials.jwtToken);
    }
    this.setState(newState);
  }

  loadCredentials(apiInfo = this.state.apiInfo) {
    const credentials = {};
    if (apiInfo.authenticationType === 'API_KEY') {
      credentials['apiKey'] =
        window.localStorage.getItem(LOCAL_STORAGE_KEY_NAMES.apiKey) || DEFAULT_API_INFO.apiKey;
    } else {
      credentials['jwtToken'] =
        window.localStorage.getItem(LOCAL_STORAGE_KEY_NAMES.jwtToken) || DEFAULT_JWT_TOKEN;
    }
    this.setState(credentials);
    return credentials;
  }

  render() {
    const { query, schema, authModalVisible } = this.state;
    const authModal = authModalVisible ? (
      <AuthModal
        authMode={this.state.apiInfo.authenticationType}
        apiKey={this.state.apiKey}
        currentToken={this.state.jwtToken}
        onClose={credentials => {
          this.storeCredentials(credentials);
          this.setState({ authModalVisible: false });
        }}
      />
    ) : null;
    const authButton =
      this.state.apiInfo.authenticationType !== 'API_KEY' ? (
        <GraphiQL.Button onClick={this.toggleAuthModal} label='Auth' title='Auth Setting' />
      ) : null;
    return (
      <>
        {authModal}
        <div className='graphiql-container'>
          <GraphiQLExplorer
            schema={schema}
            query={query}
            onEdit={this._handleEditQuery}
            onRunOperation={operationName => this._graphiql.handleRunQuery(operationName)}
            explorerIsOpen={this.state.explorerIsOpen}
            onToggleExplorer={this._handleToggleExplorer}
          />
          <GraphiQL
            ref={ref => (this._graphiql = ref)}
            fetcher={this.fetch}
            schema={schema}
            query={query}
            onEditQuery={this._handleEditQuery}
          >
            <GraphiQL.Toolbar>
              <GraphiQL.Button
                onClick={() => this._graphiql.handlePrettifyQuery()}
                label='Prettify'
                title='Prettify Query (Shift-Ctrl-P)'
              />
              <GraphiQL.Button
                onClick={() => this._graphiql.handleToggleHistory()}
                label='History'
                title='Show History'
              />
              <GraphiQL.Button
                onClick={this._handleToggleExplorer}
                label='Explorer'
                title='Toggle Explorer'
              />
              {authButton}
            </GraphiQL.Toolbar>
          </GraphiQL>
        </div>
      </>
    );
  }
}

export default App;
