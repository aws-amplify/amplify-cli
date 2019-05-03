const inquirer = require('inquirer');

const subcommand = 'configure-transformers';
const category = 'api';

const EnableDisableTransformers = 'Enable / Disable transformers';
const ScanForNewTransformers = 'Scan for new transformers';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify } = context;
    context.print.info('GraphQL transformers provide a set of simple to use abstractions that help you quickly create backends for your web and mobile applications on AWS');
    context.print.info('Available transformers are listed next.');

    const transformers = await amplify.transformersManager
      .loadEnabledTransformers(context, category);
    displayTransformersInfoTable(context, transformers);

    let choices = [ScanForNewTransformers, 'Exit'];
    // don't show enable/disable option when we only have built-in transformers
    const customTransformers = transformers.filter(transformer => transformer.type === 'custom');
    if (customTransformers.length > 0) {
      choices = [EnableDisableTransformers, ...choices];
    }

    const question = [{
      name: 'transformerAction',
      message: 'What would you like to do?',
      type: 'list',
      choices,
    }];

    return inquirer.prompt(question).then((answer) => {
      switch (answer.transformerAction) {
        case EnableDisableTransformers:
          return selectAndSaveTransformers(
            context, category, customTransformers,
            'Modify transformers selection',
            customTransformers.filter(transformer => transformer.enabled),
            false,
          );

        case ScanForNewTransformers:
          context.print.info('Scanning...');
          return amplify.transformersManager.scanNodeModules(context, category)
            .then((newTransformers) => {
              if (newTransformers.length > 0) {
                displayTransformersInfoTable(context, newTransformers);
              } else {
                context.print.info('No new transformers founds');
              }
              return newTransformers;
            })
            .then(newTransformers =>
              (newTransformers.length > 0
                ? inquirer.prompt({
                  name: 'addTransformersConfirmation',
                  message: 'Do you want to add any?',
                  type: 'list',
                  choices: ['Yes', 'No'],
                }).then(answ => (answ.addTransformersConfirmation === 'Yes' ? newTransformers : []))
                : []))
            .then(newTransformers =>
              (newTransformers.length > 0
                ? selectAndSaveTransformers(context, category, newTransformers, 'Select the transformers you want to add')
                : false))
            .then(success => context.print.info(success ? 'Transformer selection saved successfully' : ''));

        default:
      }
    });
  },
};

async function selectAndSaveTransformers(
  context,
  cliCategory,
  transformers,
  message,
  defaultTransformers = [],
  saveDisabledTransformers = false,
) {
  const answer = await inquirer.prompt({
    name: 'selectedTransformers',
    message,
    type: 'checkbox',
    choices: transformers.map(transformer => `${transformer.name}:${transformer.version}`),
    default: defaultTransformers.map(transformer => `${transformer.name}:${transformer.version}`),
  });

  let transformersToSave = answer.selectedTransformers
    .map((answ) => {
      const components = answ.split(':');
      return transformers
        .find(transformer =>
          transformer.name === components[0] &&
          transformer.version === components[1]);
    })
    .filter(transformer => transformer)
    .map(transformer => ({ ...transformer, enabled: true }));

  if (saveDisabledTransformers) {
    transformersToSave = [
      ...transformersToSave,
      ...transformers
        .filter(transformer => !transformersToSave
          .find(enabledTransformer => enabledTransformer.path === transformer.path))
        .map(transformer => ({ ...transformer, enabled: false })),
    ];
  }

  return await context.amplify.transformersManager
    .saveCustomTransformers(context, cliCategory, transformersToSave);
}

function displayTransformersInfoTable(context, transformers) {
  const { table } = context.print;
  const tableOptions = transformers.reduce(
    (options, transformer) =>
      [...options, [
        transformer.name,
        transformer.type,
        transformer.enabled ? 'Enabled' : 'Disabled',
        transformer.author,
        transformer.version,
      ]],
    [['Transformer', 'Type', 'State', 'Author', 'Version']],
  );

  context.print.info('');
  table(
    tableOptions,
    { format: 'markdown' },
  );
  context.print.info('');
}
