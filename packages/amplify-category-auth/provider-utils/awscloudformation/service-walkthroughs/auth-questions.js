const inquirer = require('inquirer');
const chalk = require('chalk');
const chalkpipe = require('chalk-pipe');
const thirdPartyMap = require('../assets/string-maps').authProviders;

async function serviceWalkthrough(
  context,
  defaultValuesFilename,
  stringMapsFilename,
  serviceMetadata,
) {
  const { inputs } = serviceMetadata;
  const { amplify } = context;
  const { parseInputs } = require(`${__dirname}/../question-factories/core-questions.js`);
  const constraints = context.updatingAuth && context.updatingAuth.savedConstraints ? JSON.parse(context.updatingAuth.savedConstraints) : undefined; // eslint-disable-line
  const allMetadata = amplify.getProjectDetails().amplifyMeta || {};
  const projectType = Object.keys(amplify.getProjectConfig().frontendHandler)[0];


  let coreAnswers = {};
  /* eslint-disable */

  // QUESTION LOOP
  for (let i = 0; i < inputs.length; i = i + 1) {
    // If we are on the second or higher question, we first check to see if the user selected 'learn more' and if learn more text is present on the question object.
    if (i > 0 && new RegExp(/learn/i).test(coreAnswers[inputs[i-1].key]) && inputs[i-1].learnMore) {
      // To support line breaks between paragraphs for readability, we splut up the string and joint with template string hard returns
      const helpTextArray = inputs[i-1].learnMore.split("\n");
      // !IMPORTANT! Do no change indentation or carriage returns in template string. !IMPORTANT!
      const helpText = `
${helpTextArray.join(`
        
`)}
      
`;
      inputs[i-1].prefix = chalkpipe(null, chalk.green)(helpText);  // Assign prefix text with chalkpipe 
      i-- // Decrement the loop iterator by one to 'rewind' to the last question with the suffix displayed.

    };
  /* eslint-enable */

    // If user selected default, jump out of the loop
    if (coreAnswers.useDefault === 'default') {
      break;
    }

    const q = await parseInputs(
      inputs[i],
      amplify,
      defaultValuesFilename,
      stringMapsFilename,
      coreAnswers,
      context,
    );
    if (q.name === 'useDefault' && context.updatingAuth && context.updatingAuth.savedConstraints) {
      const editWarning = chalkpipe(null, chalk.red)(`
You have already saved other AWS resources which have Cognito-related constraints. By selecting the default options, you risk creating an invalid configuration. Select default configuration at your own risk.\n
      `);
      q.prefix = q.prefix ? q.prefix.concat(editWarning) : editWarning;
    }


    // TODO: Replace with a function that checks after edit, and offers undo. Remove triple loop.
    if (constraints && constraints.length > 0) {
      constraints.forEach((c) => {
        const plugins = Object.keys(c);
        plugins.forEach((p) => {
          const resources = Object.keys(c[p]);
          resources.forEach((r) => {
            if (allMetadata[p] && allMetadata[p][r] && Object.keys(c[p][r]).includes(inputs[i].key)) { //eslint-disable-line
              const overRideWarning = chalkpipe(null, chalk.red)(`
Your ${p} resource named ${r} relies on this attribute. Edit at your own risk.\n
`);
              q.prefix = q.prefix ? q.prefix.concat(overRideWarning) : overRideWarning;
            }
          });
        });
      });
    }

    // Update answers with spreading of previous values and those returning from question prompt
    coreAnswers = { ...coreAnswers, ...(await inquirer.prompt(q)) };
  }


  // POST-QUESTION LOOP PARSING
  /*
    create key/value pairs of third party auth providers,
    where key = name accepted by updateIdentityPool API call and value = id entered by user
    TODO: evalutate need for abstracted version of this operation
  */
  if (coreAnswers.thirdPartyAuth) {
    coreAnswers.selectedParties = {};
    thirdPartyMap.forEach((e) => {
      // don't send google value in cf if native project, since we need to make an openid provider
      if (projectType === 'javascript' || e.answerHashKey !== 'googleClientId') {
        if (coreAnswers[e.answerHashKey]) {
          coreAnswers.selectedParties[e.value] = coreAnswers[e.answerHashKey];
        }
        /*
          certain third party providers (such as Twitter) require multiple values,
          which Cognito requires to be a concatenated string -
          so here we build the string using 'concatKeys' defined in the thirdPartyMap
        */
        if (coreAnswers[e.answerHashKey] && e.concatKeys) {
          e.concatKeys.forEach((i) => {
            coreAnswers.selectedParties[e.value] = coreAnswers.selectedParties[e.value].concat(';', coreAnswers[i]);
          });
        }
      }
    });

    if (projectType !== 'javascript' && coreAnswers.authProviders.includes('accounts.google.com')) {
      coreAnswers.audiences = [coreAnswers.googleClientId];
      if (projectType === 'ios') {
        coreAnswers.audiences.push(coreAnswers.googleIos);
      } else if (projectType === 'android') {
        coreAnswers.audiences.push(coreAnswers.googleAndroid);
      }
    }

    console.log('coreAnswers.selectedParties', coreAnswers.selectedParties);
    console.log('coreAnswers.audiences', coreAnswers.audiences);

    coreAnswers.selectedParties = JSON.stringify(coreAnswers.selectedParties);
  }

  const roles = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'staticRoles');

  return {
    ...coreAnswers,
    ...roles,
  };
}

module.exports = { serviceWalkthrough };
