/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import inquirer from 'inquirer';
import { uniq, flatten } from 'lodash';
import chalk, { Chalk } from 'chalk';
import { $TSAny, $TSContext } from 'amplify-cli-core';

/**
 * Input object for parseInputs
 */
export type Input = {
  when?: () => boolean;
  prefixColor?: string;
  prefix?: string;
  key: string;
  question?: string;
  suffix?: string;
  map?: $TSAny;
  type?: string;
  iterator?: $TSAny;
  filter?: $TSAny;
  requiredOptions?: $TSAny;
  options?: $TSAny;
}

/**
 * parses input object and returns a question object
 */
export const parseInputs = async (
  input: Input,
  amplify: $TSAny,
  defaultValuesFilename: $TSAny,
  stringMapsFilename: $TSAny,
  currentAnswers: $TSAny,
  context: $TSContext,
): Promise<$TSAny> => {
  // eslint-disable-line max-len
  const defaultValuesSrc = `${__dirname}/../assets/${defaultValuesFilename}`;
  const stringMapsSrc = `${__dirname}/../assets/${stringMapsFilename}`;
  const { getAllDefaults } = await import(defaultValuesSrc);
  const { getAllMaps } = await import(stringMapsSrc);

  // Can have a cool question builder function here based on input json - will iterate on this
  // Can also have some validations here based on the input json
  // Uncool implementation here

  const color: keyof Chalk = input.prefixColor as keyof Chalk ?? 'green';
  const questionChalk = chalk[color] as Chalk;
  const prefix = input.prefix ? `${'\n'} ${questionChalk(input.prefix)} ${'\n'}` : '';

  let question: $TSAny = {
    name: input.key,
    message: input.question,
    prefix,
    suffix: input.suffix,
    when: amplify.getWhen(input, currentAnswers, context.updatingAuth, amplify),
    validate: amplify.inputValidation(input),
    default: () => {
      // eslint-disable-line no-unused-vars
      // if the user is editing and there is a previous value, this is always the default
      if (context.updatingAuth && context.updatingAuth[input.key] !== undefined) {
        if (input.key === 'triggers') {
          return triggerDefaults(context, input, getAllMaps(context.updatingAuth)[input.map]);
        }
        return context.updatingAuth[input.key];
      }
      // if not editing or no previous value, get defaults (either w/ or w/out social provider flow)
      return getAllDefaults(amplify.getProjectDetails(amplify))[input.key];
    },
  };

  if (input.type && ['list', 'multiselect'].includes(input.type)) {
    if (context.updatingAuth && input.iterator) {
      question = iteratorQuestion(input, question, context);
      // if selecting existing value to edit it's not require to validate inputs
      question.validate = () => true;
    } else if (input.filter) {
      question = filterInputs(input, question, getAllMaps, context, currentAnswers);
    } else if (input.requiredOptions) {
      question = getRequiredOptions(input, question, getAllMaps, context, currentAnswers);
    } else if (!input.requiredOptions || (question.when && !question.when())) {
      question = {
        choices: input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options,
        ...question,
      };
    }
  }

  if (input.type && input.type === 'list') {
    question = {
      type: 'list',
      ...question,
    };
  } else if (input.type && input.type === 'multiselect') {
    question = {
      type: 'checkbox',
      ...question,
    };
  } else if (input.type && input.type === 'confirm') {
    question = {
      type: 'confirm',
      ...question,
    };
  } else {
    question = {
      type: 'input',
      ...question,
    };
  }

  return question;
};

const iteratorQuestion = (
  input: $TSAny,
  question: $TSAny,
  context: $TSContext,
) => {
  if (context.updatingAuth[input.iterator]) {
    question = {
      choices: context.updatingAuth[input.iterator].map((i: $TSAny) => ({
        name: i,
        value: i,
      })),
      ...question,
    };
  } else if (input.iterator) {
    // TODO: make iterator key useful for non-update actions
    question = {
      choices: [],
      ...question,
    };
  }
  return question;
};

const getRequiredOptions = (
  input: $TSAny,
  question: $TSAny,
  getAllMaps: $TSAny,
  context: $TSContext,
  currentAnswers: $TSAny,
) => {
  const sourceValues = Object.assign(context.updatingAuth ? context.updatingAuth : {}, currentAnswers);
  const sourceArray = uniq(flatten(input.requiredOptions.map((i: $TSAny) => sourceValues[i] || [])));
  const requiredOptions = getAllMaps()[input.map] ? getAllMaps()[input.map].filter((x: $TSAny) => sourceArray.includes(x.value)) : [];
  const trueOptions = getAllMaps()[input.map] ? getAllMaps()[input.map].filter((x: $TSAny) => !sourceArray.includes(x.value)) : [];
  const msg = requiredOptions && requiredOptions.length > 0
    ? `--- ${input.requiredOptionsMsg} ${requiredOptions.map((t: $TSAny) => t.name).join(', ')}   ---`
    : '';
  question = Object.assign(question, {
    choices: [new inquirer.Separator(msg), ...trueOptions],
    filter: (userInput: $TSAny) => userInput.concat(...requiredOptions.map((z: $TSAny) => z.value)),
  });
  return question;
};

const filterInputs = (
  input: $TSAny,
  question: $TSAny,
  getAllMaps: $TSAny,
  context: $TSContext,
  currentAnswers: $TSAny,
) => {
  if (input.filter === 'providers') {
    const choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
    const { requiredAttributes } = Object.assign(context.updatingAuth ? context.updatingAuth : {}, currentAnswers);
    if (requiredAttributes) {
      const attrMap = getAllMaps().attributeProviderMap;
      requiredAttributes.forEach((attr: string | number) => {
        choices.forEach((choice: { missingAttributes: $TSAny[]; value: string; disabled: string; name: $TSAny; }) => {
          choice.missingAttributes = [];
          if (!attrMap[attr] || !attrMap[attr][`${choice.value.toLowerCase()}`].attr) {
            choice.missingAttributes = choice.missingAttributes.length < 1 ? [attr] : choice.missingAttributes.concat(attr);
            const newList = choice.missingAttributes.join(', ');
            choice.disabled = `Your UserPool is configured to require ${newList.substring(
              0,
              newList.length,
            )}, which cannot be retrieved from ${choice.name}`;
          }
        });
      });
    }
    question = { choices, ...question };
  }
  if (input.filter === 'attributes') {
    let choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
    choices = JSON.parse(JSON.stringify(choices));
    const attrMap = getAllMaps().attributeProviderMap;
    choices.forEach((choice: { missingProviders: $TSAny[]; value: string | number; name: string; }) => {
      choice.missingProviders = [];
      if (attrMap[choice.value]) {
        Object.values(attrMap[choice.value]).forEach((provider: $TSAny, index) => {
          if (!provider.attr) {
            const providerKey = Object.keys(attrMap[choice.value])[index];
            let providerName = providerKey.charAt(0).toUpperCase() + providerKey.slice(1);
            if (providerName.toLowerCase() === 'LoginWithAmazon'.toLowerCase()) {
              providerName = 'Login With Amazon';
            }
            if (providerName.toLowerCase() === 'SignInWithApple'.toLowerCase()) {
              providerName = 'Sign in with Apple';
            }
            choice.missingProviders = choice.missingProviders.length < 1 ? [providerName] : choice.missingProviders.concat(providerName);
          }
        });
        if (choice.missingProviders && choice.missingProviders.length > 0) {
          const newList = choice.missingProviders.join(', ');
          choice.name = `${choice.name} (This attribute is not supported by ${newList.substring(0, newList.length)}.)`;
        }
      }
    });
    question = { choices, ...question };
  }
  if (input.filter === 'updateOptions' && context.updatingAuth) {
    const choices = input.map ? getAllMaps(context.updatingAuth)[input.map] : input.options;
    const newChoices = JSON.parse(JSON.stringify(choices));
    choices.forEach((c: { conditionKey: string; value: $TSAny; conditionMsg: string; name: string; }) => {
      if (c.conditionKey === 'useDefault' && context.updatingAuth[c.conditionKey] === c.value && !c.conditionMsg) {
        const index = newChoices.findIndex((i: { name: string; }) => i.name === c.name);
        newChoices.splice(index, 1);
      } else if (c.conditionMsg && !context.updatingAuth[c.conditionKey]) {
        if (context.updatingAuth.useDefault === 'defaultSocial') {
          const index = newChoices.findIndex((i: { name: string; }) => i.name === c.name);
          newChoices[index].disabled = `Disabled: ${c.conditionMsg}`;
        } else {
          const index = newChoices.findIndex((i: { name: string; }) => i.name === c.name);
          newChoices.splice(index, 1);
        }
      }
    });
    question = { choices: newChoices, ...question };
  }
  return question;
};

const triggerDefaults = (
  context: $TSContext,
  input: { key: string | number; },
  availableOptions: $TSAny[],
) => {
  const capabilityDefaults: $TSAny[] = [];
  if (context.updatingAuth.triggers) {
    const current = typeof context.updatingAuth[input.key] === 'string' ? JSON.parse(context.updatingAuth[input.key]) : context.updatingAuth[input.key];
    try {
      if (current) {
        availableOptions.forEach(a => {
          let match = true;
          Object.keys(a.triggers).forEach(t => {
            if (current[t]) {
              const test = a.triggers[t].every((c: $TSAny) => current[t].includes(c));
              if (!test) {
                match = false;
              }
            } else {
              match = false;
            }
          });
          if (match) {
            capabilityDefaults.push(a.value);
          }
        });
      }
    } catch (e) {
      throw new Error('Error parsing capability defaults');
    }
  }
  return capabilityDefaults;
};
