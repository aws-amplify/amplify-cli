import capitalizeFirstLetter from 'graphiql-code-exporter/lib/utils/capitalizeFirstLetter';
import commentsFactory from 'graphiql-code-exporter/lib/utils/jsCommentsFactory';
import {
  distinct,
  isOperationNamed,
  collapseExtraNewlines,
  addLeftWhitespace,
} from 'graphiql-code-exporter/lib/utils/index.js';




const comments = {
  setup: `This setup is only needed once per application`,
};

function formatVariableName(operationData): string {
  const {name} = operationData;
  return (
    name.charAt(0).toUpperCase() +
    name
      .slice(1)
      .replace(/[A-Z]/g, '_$&')
      .toUpperCase()
  );
}

function operationVariableName(operation): string {
  const {type} = operation;
  return formatVariableName(operation) + '_' + type.toUpperCase();
}

function operationVariables(operationData) {
  const params = (
    operationData.operationDefinition.variableDefinitions || []
  ).map(def => def.variable.name.value);
  const variablesBody = params.map(param => `"${param}": ${param}`).join(', ');
  const variables = `{${variablesBody}}`;

  const propsBody = params.map(param => `"${param}": props.${param}`).join(', ');
  const props = `{${propsBody}}`;

  return {params, variables, props};
}

function operationComponentName(operationData): string {
  const {type} = operationData;

  const suffix =
    type === 'query'
      ? 'Query'
      : type === 'mutation'
        ? 'Mutation'
        : type === 'subscription'
          ? 'Subscription'
          : '';

  return suffix.length > 0
    ? '' + capitalizeFirstLetter(operationData.name) + suffix
    : capitalizeFirstLetter(operationData.name);
}

function mutationComponent(
  getComment,
  options,
  element,
  operationData,
  heads,
  vars,
) {
  const {params, variables} = operationVariables(operationData);

  const call = `${operationData.name}(${
    params.length === 0 ? '' : `${variables}`
  })`;

  const onClick = `() => ${call}`;

  return `<Mutation
  mutation={${operationVariableName(operationData)}}${
    heads === '{}'
      ? ''
      : `
  context={{ headers: ${heads} }}
`
  }>
  {(${operationData.name}, { loading, error, data }) => {
    if (loading) return <${element}>Loading</${element}>

    if (error)
      return (
        <${element}>
          Error in ${operationVariableName(operationData)}
          {JSON.stringify(error, null, 2)}
        </${element}>
      );

    const dataEl = data ? (
      <${element}>{JSON.stringify(data, null, 2)}</${element}>
    ) : null;

    return (
      <div>
        {dataEl}

        <button onClick={${onClick}}>
          Run mutation: ${operationData.name}
        </button>
      </div>
    );
  }}
</Mutation>`;
}

const queryComponent = (
  getComment,
  options,
  element,
  operationData,
  heads,
  vars,
) => {
  const {params, props} = operationVariables(operationData);
  return `<Query
  query={${operationVariableName(operationData)}}${
    heads === '{}'
      ? ''
      : `
  context={{ headers: ${heads} }}`
  } ${
    params.length === 0
      ? ''
      : `
  variables={${props}}`
  }>
  {({ loading, error, data }) => {
    if (loading) return <${element}>Loading</${element}>
    if (error)
      return (
        <${element}>
          Error in ${operationVariableName(operationData)}
          {JSON.stringify(error, null, 2)}
        </${element}>
      );

    if (data) {
      return (
        <${element}>{JSON.stringify(data, null, 2)}</${element}>
      )
    }
  }}
</Query>`;
};

const snippet = {
  language: 'JavaScript',
  codeMirrorMode: 'javascript',
  name: 'amplify',
  options: [
    {
      id: 'client',
      label: 'with client setup',
      initial: true,
    },
    {
      id: 'imports',
      label: 'with required imports',
      initial: true,
    },
  ],
  generate: opts => {
    const {headers, options, serverUrl} = opts;

    const getComment = commentsFactory(true, comments);

    const operationDataList = opts.operationDataList.map(
      (operationData, idx) => {
        if (!isOperationNamed(operationData)) {
          return {
            ...operationData,
            name: `unnamed${capitalizeFirstLetter(operationData.type)}${idx +
              1}`.trim(),
            query:
              `# Consider giving this ${
                operationData.type
              } a unique, descriptive
# name in your application as a best practice
${operationData.type} unnamed${capitalizeFirstLetter(operationData.type)}${idx +
                1} ` +
              operationData.query
                .trim()
                .replace(/^(query|mutation|subscription) /i, ''),
          };
        } else {
          return operationData;
        }
      },
    );

    const element = options.reactNative ? 'View' : 'pre';
    const vars = JSON.stringify({}, null, 2);
    const headersValues = [...Object.keys(headers || [])]
      .filter(k => headers[k])
      .map(k => `"${k}": "${headers[k]}"`)
      .join(',\n');

    const heads = `{${headersValues}}`;

    const packageDeps = `/*
  Add these to your \`package.json\`:
  import API, { graphqlOperation } from '@aws-amplify/api'
  import PubSub from '@aws-amplify/pubsub';
*/

`;

    const clientSetup = options.client
      ? `${getComment('setup')};
const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: "${serverUrl}",
  }),
});\n`
      : '';

    const operationTypes = distinct(
      operationDataList.map(operationData => operationData.type),
    );

    const imports = [
      operationTypes.indexOf('query') > -1 ? 'Query' : null,
      operationTypes.indexOf('mutation') > -1 ? 'Mutation' : null,
      'ApolloProvider',
    ].filter(Boolean);

    const reactApolloImports = `import { ${imports.join(
      ', ',
    )} } from "react-apollo";`;
    const reactImports = `import React from "react";
import ReactDOM from "react-dom";
import { ${
      options.client ? 'ApolloClient, ' : ''
    }InMemoryCache, HttpLink } from "apollo-boost";`;

    const gqlImport = 'import gql from "graphql-tag";';

    const generalImports = options.imports
      ? `${gqlImport}
${reactImports}
${reactApolloImports}`
      : '';

    const components = operationDataList
      .map(operationData => {
        const componentFn =
          operationData.type === 'query'
            ? queryComponent
            : operationData.type === 'mutation'
              ? mutationComponent
              : () =>
                  `"We don't support ${
                    operationData.type
                  } GraphQL operations yet"`;

        const graphqlOperation = `const ${operationVariableName(
          operationData,
        )} = gql\`
${addLeftWhitespace(operationData.query, 2)}
\`;`;

        const component = `${graphqlOperation}

const ${operationComponentName(operationData)} = (props) => {
  return (
${addLeftWhitespace(
          componentFn(
            // $FlowFixMe: Add flow type to utils fn
            getComment,
            options,
            element,
            operationData,
            heads,
            vars,
          ),
          4,
        )}
  )
};`;

        return component;
      })
      .join('\n\n');

    const componentInstantiations = operationDataList
      .map(operationData => {
        const {params} = operationVariables(operationData);

        const props = params.map(param => `${param}={${param}}`).join(' ');

        return `<${operationComponentName(operationData)} ${props} />`;
      })
      .join('\n');

    const variableInstantiations = operationDataList
      .map(operationData => {
        const variables = Object.entries(
          operationData.variables || {}
        ).map(([key, value]) => `const ${key} = ${JSON.stringify(value, null, 2)};`);

        return `${variables.join('\n')}`;
      })
      .join('\n\n');

    const containerComponent = `${variableInstantiations}

const container = (
  <ApolloProvider client={apolloClient}>
${addLeftWhitespace(componentInstantiations, 4)}
  </ApolloProvider>
);`;

    const snippet = `
/* This is an example snippet - you should consider tailoring it
to your service.
*/
${packageDeps}${generalImports}

${clientSetup}

${components}

${containerComponent}

ReactDOM.render(container, document.getElementById("root"));`;
    return collapseExtraNewlines(snippet.trim());
  },
};

export default snippet;
