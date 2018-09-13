module.exports = {
  PROMPT_MSG_API_LIST: 'Choose the AppSync API that you want to use in this project',
  PROMPT_MSG_FILE_NAME: 'Enter the file name for the generated code',
  PROMPT_MSG_CODEGEN_TARGET: 'Choose the code generation language target',
  PROMPT_MSG_GQL_FILE_PATTERN:
    'Enter the file name pattern of graphql queries, mutations and subscriptions',
  PROMPT_MSG_GENERATE_CODE:
    'Do you want to generate code for your newly created GraphQL API',
  PROMPT_MSG_UPDATE_CODE:
    'Do you want to update code for your updated GraphQL API',
  PROMPT_MSG_GENERATE_OPS: 'Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions',
  PROMPT_MSG_SELECT_PROJECT: 'Choose the AppSync API',
  ERROR_CODEGEN_TARGET_NOT_SUPPORTED: 'is not supported by codegen plugin',
  ERROR_CODEGEN_FRONTEND_NOT_SUPPORTED: 'The project frontend is not supported by codegen',
  ERROR_CODEGEN_NO_API_AVAILABLE:
    'There are no Code Gen APIs available.\n Add by running amplify codegen add',
  ERROR_CODEGEN_ALL_APIS_ALREADY_ADDED: 'All enabled AppSync APIs are already added',
  CMD_DESCRIPTION_ADD:
    'Generate API code or type annotations based on a GraphQL schema and query documents',
  CMD_DESCRIPTION_GENERATE:
    'Generate API code or type annotations based on a GraphQL schema and query documents.\nIf you want to download schema before generating code pass --download flag',
  CMD_DESCRIPTION_GENERATE_DOCS:
    'Generate GraphQL Documents(query, mutations and subscriptions) from schema.\nIf you want to download schema before generating docs pass --download flag',
  ERROR_NOT_CONFIGURED: '',
  CMD_DESCRIPTION_CONFIGURE: 'Change/Update codegen configuration',
  ERROR_CODEGEN_NO_API_CONFIGURED:
    'code generation is not configured. Configure it by running \namplify codegen add',
  ERROR_CODEGEN_PENDING_API_PUSH:
    'No API is pushed to cloud. Did you forget to do \n amplify api push',
  WARNING_CODEGEN_PENDING_API_PUSH:
    'The APIs listed below are not pushed to the cloud. Run amplify api push',
  INFO_AUTO_SELECTED_API: 'Using AppSync API:',
  INFO_MSG_REMOVE_API_SUCCESS: 'removed project',
  INFO_MESSAGE_CODEGEN_GENERATE_STARTED: 'Generating',
  INFO_MESSAGE_CODEGEN_GENERATE_SUCCESS: 'Code generated successfully and saved in file',
  INFO_MESSAGE_DOWNLOADING_SCHEMA: 'Downloading the introspection schema',
  INFO_MESSAGE_DOWNLOAD_SUCCESS: 'Downloaded the schema',
  INFO_MESSAGE_OPS_GEN: 'Generating GraphQL operations',
  INFO_MESSAGE_OPS_GEN_SUCCESS: 'Generated GraphQL operations successfully and saved at ',
};
