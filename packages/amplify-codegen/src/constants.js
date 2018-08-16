module.exports = {
  PROMPT_MSG_API_LIST: 'Select the AppSync API that you want to use in this project',
  PROMPT_MSG_FILE_NAME: 'Enter the file name for the generated code',
  PROMPT_MSG_CODEGEN_TARGET: 'Select the code generation language target',
  PROMPT_MSG_GQL_FILE_PATTERN:
    'Enter the file name pattern of graphql queries, mutation and subscriptions',
  PROMPT_MSG_GENERATE_CODE:
    'Do you want to generate code',
  PROMPT_MSG_SELECT_PROJECT: 'Select the AppSync API',
  ERROR_CODEGEN_TARGET_NOT_SUPPORTED: 'is not supported by codegen plugin',
  ERROR_CODEGEN_FRONTEND_NOT_SUPPORTED: 'The project frontend is not supported by codegen',
  ERROR_CODEGEN_NO_API_AVAILABLE:
    'There are no Code Gen APIs available.\n Please add by running amplify codegen add',
  ERROR_CODEGEN_ALL_APIS_ALREADY_ADDED: 'All enabled AppSync APIs are already added',
  CMD_DESCRIPTION_ADD:
    'Generate API code or type annotations based on a GraphQL schema and query documents',
  CMD_DESCRIPTION_GENERATE:
    'Generate API code or type annotations based on a GraphQL schema and query documents.\nIf you want to download schema before generating code pass --download flag',
  ERROR_NOT_CONFIGURED: '',
  CMD_DESCRIPTION_CONFIGURE: 'Change/Update codegen configuration',
  ERROR_CODEGEN_NO_API_CONFIGURED:
    'code generation is not configured. Please configure it by running \namplify codegen add',
  ERROR_CODEGEN_PENDING_API_PUSH:
    'No API is pushed to cloud. Did you forget to do \n amplify api push',
  WARNING_CODEGEN_PENDING_API_PUSH:
    'The APIs listed below are not pushed to the cloud. Please run amplify api push',
  INFO_AUTO_SELECTED_API: 'Using AppSync API:',
  INFO_MSG_REMOVE_API_SUCCESS: 'removed project',
  INFO_MESSAGE_CODEGEN_GENERATE_STARTED: 'Generating',
  INFO_MESSAGE_CODEGEN_GENERATE_SUCCESS: 'code generated successfully and saved in file',
  INFO_MESSAGE_DOWNLOADING_SCHEMA: 'Downloading the introspection schema',
  INFO_MESSAGE_DOWNLOAD_SUCCESS: 'Downloaded the schema',
  INFO_MESSAGE_FRONTEND_ANDROID_GQL_LOCATION: 'Please add the graphql files in',
}
