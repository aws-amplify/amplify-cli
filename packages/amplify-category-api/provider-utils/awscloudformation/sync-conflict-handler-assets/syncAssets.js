import chalk from 'chalk';

const learnMore = `When more than one system is updating an item in your GraphQL backend at a single time, Amplify DataStore can use different strategies with AWS AppSync to resolve these conflicts based on your use case.
This can be on the entire API (recommended) or for advanced use cases you can change these for each one of your GraphQL types. 

Automerge is the default mechanism where GraphQL type information can be used to merge objects using the scalar type context as long as two fields in a type are not in conflict.
When this happens the data is merged and AppSync will update the object version so that all clients are updated.
This also functions on lists of scalars where the updates are concatenated.

Optimistic Concurrency Control accepts the latest committed write to the database.
Other writers are rejected and must handle merges through other means, such as a client-side callback.

Finally you can also also configure a Lambda Function to resolve conflicts depending on your custom business need, such as letting specific users in a system have priority on making updates to data.
`;

function getDataStoreLearnMore() {
  return chalk.green(learnMore);
}

module.exports = {
  getDataStoreLearnMore,
};
