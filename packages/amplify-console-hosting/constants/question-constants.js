import chalk from 'chalk';

export const DEPLOY_TYPE_QUESTION = `Choose a ${chalk.red('type')}`;
export const DEPLOY_TYPE_QUESTION_MANUAL = 'Manual deployment';
export const DEPLOY_TYPE_QUESTION_CICD = 'Continuous deployment (Git-based deployments)';
export const LEARN_MORE = 'Learn more';

export const CICD_CONFIRM_QUESTION = 'Continuous deployment is configured in the Amplify Console. Please hit enter once you connect your repository';

export const VIEW_APP_QUESTION = `You have set up continuous deployment with Amplify Console. \
Run ${chalk.green('git push')} from a connected branch to publish updates. \
Open your Amplify Console app to view connected branches?`;

export const APP_CONFIGURE_QUESTION = 'Configure settings such as custom domains, redirects, and password protection using the Amplify Console. Continue?';
export const APP_CICD_SERVE_QUESTION = 'You have set up continuous deployment with Amplify Console. Open your Amplify Console app to view connected branches?';

export const POST_ADDING_MESSAGE = `${chalk.green('You can now publish your app using the following command:')}`;
export const POST_PUBLISH_MESSAGE = 'Command: amplify publish';
