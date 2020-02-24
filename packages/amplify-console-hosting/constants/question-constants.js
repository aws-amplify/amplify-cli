import chalk from 'chalk';

export const DEPLOY_TYPE_QUESTION = `Choose a ${chalk.red('type')}`;
export const DEPLOY_TYPE_QUESTION_MANUAL = 'Manual deployment';
export const DEPLOY_TYPE_QUESTION_CICD = 'Continuous deployment (Git-based deployments)';
export const LEARN_MORE = 'Learn more';
export const SELECT_CONFIG_QUESTION = 'Configure settings for all frontends:';
export const SELECT_CONFIG_COMPLETION = 'Apply configuration';
export const SELECT_REMOVE_FRONTEND_QUESTION = 'Select frontends to remove';
export const BASIC_AUTH_USERNAME_QUESTION = 'Enter username';
export const BASIC_AUTH_PASSWORD_QUESTION = 'Enter password';
export const CONFIRM_QUESTION = 'Confirm?';
export const BASIC_AUTH_DISABLE_QUESTION = 'Disable basic auth';
export const BASIC_AUTH_EDIT_QUESTION = 'Edit basic auth';

export const CREATE_NEW_CUSTOM_RULE_QUESTIION = 'Create new custom rule';
export const DELETE_CUSTOM_RULE_QUESTION = 'Delete custom rule';
export const EDIT_CUSTOM_RULE_QUESTION = 'Edit custom rule';
export const EDIT_SOURCE_QUESTION = 'Please input source url';
export const EDIT_TARGET_QUESTION = 'Please input target url';
export const EDIT_STATUS_CODE = 'Please input status code';
export const EDIT_COUNTRY_CODE = 'Please input contry code(enter to skip)';
export const SELECT_DELETE_CUSTOM_RULE_QUESTION = 'Please select custom rules to delete';
export const SELECT_EIDT_CUSTOM_RULE_QUESTION = 'Please select custom rules to edit';
export const SELECT_CONFIG_AUTH = 'Access control';
export const SELECT_CONFIG_RULES = 'Redirects and rewrites';
export const SELECT_DOMAIN_MANAGEMENT = 'Domain management';
export const SELECT_REMOVE_FRONTEND = 'Remove frontend environment';
export const SELECT_ADD_FRONTEND = 'Add new frontend environment';

export const PICKUP_FRONTEND_QUESTION = 'Pick a frontend environment to deploy to:';
export const ADD_NEW_FRONTEND_QUESTION = 'Enter a frontend environment name (e.g. dev or prod):';

export const CICD_CONFIRM_QUESTION = 'Continuous deployment is configured in the Amplify Console. Please hit enter once you connect your repository';
export const INPUT_APP_ARN_QUESTION = 'Please enter your Amplify Console App Arn (App Settings > General):';
export const CHANGE_APP_ARN_QUESTION = 'Please enter your new Amplify Console App Arn (App Settings > General):';

export const VIEW_APP_QUESTION = `You have set up CI/CD with Amplify Console. \
Run ${chalk.green('git push')} from a connected branch to publish updates. \
Open your Amplify Console app to view connected branches?`;

export const VIEW_URL_QUESTION = 'Would you like to open the deployed website?';
export const INPUT_BLANK_VALIDATION = 'Input can not be blank';
export const STATUS_CODE_VALIDATION = 'Status code can only be number';
export const FRONTEND_NAME_VALIDATION = 'The frontend environment already exists. Please input a new name';

export const APP_CONFIGURE_QUESTION = `We recommends you open ${chalk.green('AWS Amplify Console')} to configure advanced settings such as ${chalk.yellow('rewrite/redirect, basic auth, custom domain...')} Open your Amplify Console app to configure?`;
export const APP_SERVE_QUESTION = 'You have set up Continuous deployment with Amplify Console. Visit Amplify Console to view your frontend URL?';
