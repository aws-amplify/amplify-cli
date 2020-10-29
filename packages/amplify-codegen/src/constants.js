const chalk = require('chalk');

module.exports = {
  Label: 'codegen',
  Aliases: ['codeGen'],
  PROMPT_MSG_API_LIST: 'Choose the AppSync API that you want to use in this project',
  PROMPT_MSG_API_REMOVE: 'Choose the AppSync API that you want to remove from codegen',
  PROMPT_MSG_FILE_NAME: 'Enter the file name for the generated code',
  PROMPT_MSG_CODEGEN_TARGET: 'Choose the code generation language target',
  PROMPT_MSG_API_KEY: 'Choose the API Key to use',
  PROMPT_MSG_GQL_FILE_PATTERN: 'Enter the file name pattern of graphql queries, mutations and subscriptions',
  PROMPT_MSG_GENERATE_CODE: 'Do you want to generate code for your newly created GraphQL API',
  PROMPT_MSG_UPDATE_STATEMENTS:
    'Do you want to generate GraphQL statements (queries, mutations and subscription) based on your schema types?\nThis will overwrite your current graphql queries, mutations and subscriptions',
  PROMPT_MSG_CHANGE_REGION: 'Do you want to choose a different region',
  PROMPT_MSG_UPDATE_CODE: 'Do you want to update code for your updated GraphQL API',
  PROMPT_MSG_MAX_DEPTH: 'Enter maximum statement depth [increase from default if your schema is deeply nested]',
  PROMPT_MSG_GENERATE_OPS: 'Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions',
  PROMPT_MSG_SELECT_PROJECT: 'Choose the AppSync API',
  PROMPT_MSG_SELECT_REGION: 'Choose AWS Region',
  ERROR_CODEGEN_TARGET_NOT_SUPPORTED: 'is not supported by codegen plugin',
  ERROR_CODEGEN_FRONTEND_NOT_SUPPORTED: 'The project frontend is not supported by codegen',
  ERROR_MSG_MAX_DEPTH: 'Depth should be a integer greater than 0',
  ERROR_CODEGEN_NO_API_AVAILABLE: 'There are no GraphQL APIs available.\nAdd by running $amplify api add',
  ERROR_CODEGEN_NO_API_KEY_AVAILABLE:
    "Security mode is set to API Key but coudn't find any API Keys. Please add an API Key to your AppSync API using the AWS AppSync console",
  ERROR_CODEGEN_ALL_APIS_ALREADY_ADDED: 'All enabled AppSync APIs are already added',
  ERROR_CODEGEN_SUPPORT_MAX_ONE_API: 'Codegen support only one GraphQL API per project',
  CMD_DESCRIPTION_ADD: 'Generate API code or type annotations based on a GraphQL schema and query documents',
  CMD_DESCRIPTION_GENERATE_TYPES:
    "Generate API code or type annotations based on a GraphQL schema and statements.\nIf don't want to download schema before generating code pass --nodownload flag.",
  CMD_DESCRIPTION_GENERATE_STATEMENTS:
    "Generate GraphQL statements(query, mutations and subscriptions) from schema.\nIf don't want to download schema before generating code pass --nodownload flag",
  ERROR_NOT_CONFIGURED: '',
  CMD_DESCRIPTION_NOT_SUPPORTED: 'invalid subcommand',
  CMD_DESCRIPTION_CONFIGURE: 'Change/Update codegen configuration',
  ERROR_CODEGEN_NO_API_CONFIGURED: 'code generation is not configured. Configure it by running \n$amplify codegen add',
  ERROR_CODEGEN_PENDING_API_PUSH: 'AppSync API is not pushed to the cloud. Did you forget to do \n$amplify api push',
  WARNING_CODEGEN_PENDING_API_PUSH: 'The APIs listed below are not pushed to the cloud. Run amplify api push',
  ERROR_APPSYNC_API_NOT_FOUND:
    'Could not find the AppSync API. If you have removed the AppSync API in the console run amplify codegen remove',
  MSG_CODEGEN_PENDING_API_PUSH: `${chalk.bold(
    'WARNING:',
  )} You have modified your schema locally and not pushed to the cloud, which may result in incomplete type generation.\nWe recommend you first run ${chalk.underline(
    '$amplify push',
  )}`,
  INFO_AUTO_SELECTED_API: 'Using AppSync API:',
  INFO_MSG_REMOVE_API_SUCCESS: 'removed project',
  INFO_MESSAGE_CODEGEN_GENERATE_STARTED: 'Generating',
  INFO_MESSAGE_CODEGEN_GENERATE_SUCCESS: 'Code generated successfully and saved in file',
  INFO_MESSAGE_DOWNLOADING_SCHEMA: 'Downloading the introspection schema',
  INFO_MESSAGE_DOWNLOAD_SUCCESS: 'Downloaded the schema',
  INFO_MESSAGE_DOWNLOAD_ERROR: 'Downloading schema failed',
  INFO_MESSAGE_OPS_GEN: 'Generating GraphQL operations',
  INFO_MESSAGE_OPS_GEN_SUCCESS: 'Generated GraphQL operations successfully and saved at ',
  INFO_MESSAGE_ADD_ERROR: 'amplify codegen add takes only apiId as parameter. \n$ amplify codegen add [--apiId <API_ID>]',
};
